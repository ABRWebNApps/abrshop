import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Ideally, we check if the user is authorized to view this message (is owner or is admin)
    // For now, assuming if they are logged in and requesting it, we check ownership in the query

    // However, for admin access we need role check.
    // Simplified: If user is admin, allow. If user is owner, allow.

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Fetch message and verify ownership/access
    const { data: message, error: messageError } = await supabase
      .from("contact_messages")
      .select("*")
      .eq("id", id)
      .single();

    if (messageError || !message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Check permissions
    const isAdmin = user.user_metadata?.role === "admin";
    if (!isAdmin && message.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch replies
    const { data: replies, error: repliesError } = await supabase
      .from("contact_replies")
      .select("*")
      .eq("message_id", id)
      .order("created_at", { ascending: true });

    if (repliesError) {
      throw repliesError;
    }

    return NextResponse.json({
      message,
      replies: replies || [],
    });
  } catch (error: any) {
    console.error("Error fetching thread:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
