import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { to, subject, message, originalMessage } = await request.json();

    // Email body for reply
    const emailBody = `
Hello,

Thank you for contacting ABR Technologies. Here is our response:

${message}

---
Original Message:
${originalMessage}

Best regards,
ABR Technologies Team
    `.trim();

    // For now, just log the email (you can configure actual email service)
    console.log("=== CONTACT FORM REPLY EMAIL ===");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${emailBody}`);
    console.log("================================");

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

