import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messageId, message } = await request.json();

    if (!messageId || !message) {
      return NextResponse.json(
        { error: "Message ID and content are required" },
        { status: 400 }
      );
    }

    // Fetch original message to verify access
    const { data: originalMessage, error: fetchError } = await supabase
      .from("contact_messages")
      .select("*")
      .eq("id", messageId)
      .single();

    if (fetchError || !originalMessage) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    const isAdmin = user.user_metadata?.role === "admin";

    // Verify access
    if (!isAdmin && originalMessage.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const senderRole = isAdmin ? "admin" : "user";
    const newStatus = isAdmin ? "replied" : "new"; // If admin replies, status is replied. If user replies, status is new (unread for admin).

    // Insert reply
    const { data: reply, error: insertError } = await supabase
      .from("contact_replies")
      .insert({
        message_id: messageId,
        sender_role: senderRole,
        message: message,
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    // Update parent message status (and potentially update 'updated_at' to bump it to top)
    await supabase
      .from("contact_messages")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", messageId);

    // TODO: Send email notification to the other party (Admin -> User or User -> Admin)

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error("Error sending reply:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
