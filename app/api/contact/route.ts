import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    // Authenticate user if possible, but don't require it
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { name, email, subject, message } = await request.json();

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Store message in database
    const { data: contactMessage, error: dbError } = await supabase
      .from("contact_messages")
      .insert({
        user_id: user?.id || null, // Allow null for anonymous users
        name,
        email,
        subject,
        message,
        status: "new",
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { error: "Failed to save message" },
        { status: 500 }
      );
    }

    // Send email notification
    try {
      const emailResponse = await fetch(
        `${process.env.NEXT_PUBLIC_SITE_URL || request.headers.get("origin") || "http://localhost:3000"}/api/contact/send-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: "info@abrtechltd.com, sales@abrtechltd.com",
            subject: `New Contact Form Submission: ${subject}`,
            name,
            email,
            message,
            contactId: contactMessage.id,
          }),
        }
      );

      if (!emailResponse.ok) {
        console.error("Email sending failed, but message saved");
      }
    } catch (emailError) {
      console.error("Email error:", emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: "Message sent successfully",
    });
  } catch (error: any) {
    console.error("Contact API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
