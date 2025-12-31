import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: NextRequest) {
  try {
    const { to, subject, name, email, message, contactId } =
      await request.json();

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

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

    await transporter.sendMail({
      from: process.env.SMTP_USER, // Must match authenticated user
      to: to,
      replyTo: email,
      subject: subject,
      text: emailBody,
    });

    console.log(`Email sent to ${to}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Email sending error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send email" },
      { status: 500 }
    );
  }
}
