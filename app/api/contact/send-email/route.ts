import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { to, subject, name, email, message, contactId } = await request.json();

    // Email body
    const emailBody = `
New Contact Form Submission

From: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}

---
Contact ID: ${contactId}
You can respond to this message through the admin panel.
    `.trim();

    // For now, we'll use a simple approach
    // In production, integrate with Resend, SendGrid, or similar service
    // Example with Resend (uncomment and configure):
    /*
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const resend = new Resend(RESEND_API_KEY);
    await resend.emails.send({
      from: "noreply@abrtechltd.com",
      to: to,
      subject: subject,
      text: emailBody,
    });
    */

    // For now, just log the email (you can configure actual email service)
    console.log("=== CONTACT FORM EMAIL ===");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${emailBody}`);
    console.log("========================");

    // TODO: Replace with actual email service integration
    // Recommended services: Resend, SendGrid, AWS SES, or Nodemailer

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Email sending error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send email" },
      { status: 500 }
    );
  }
}

