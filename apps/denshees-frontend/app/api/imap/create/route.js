import { jwtDecode } from "jwt-decode";
import axios from "axios";
import nodemailer from "nodemailer";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request) {
  const token = request.headers.get("authorization");
  const {
    username,
    password,
    port,
    secure,
    host,
    imap_host,
    imapEmail,
    imapPassword,
  } = await request.json();

  try {
    await sendTestEmail({ email: username, password, port, host, secure });
    await testImapEmail({
      username: imapEmail,
      password: imapPassword,
      host: imap_host,
      port: 993,
      secure: true,
    });
  } catch (error) {
    console.error("[API] Invalid email credentials:", error);
    return NextResponse.json(
      { message: "Invalid email credential" },
      { status: 400 },
    );
  }

  try {
    const user = jwtDecode(token);

    const record = await prisma.emailCredential.create({
      data: {
        username,
        password,
        userId: user.userId,
        host: host || "smtp.gmail.com",
        port: port || 465,
        secure: secure || true,
        imapHost: imap_host,
        imapEmail,
        imapPassword,
        dailyLimit: 20,
      },
    });

    return NextResponse.json(record);
  } catch (error) {
    console.error("[API] Error creating email credentials:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}

async function sendTestEmail({ host, port, secure, email, password }) {
  console.log("[API] Sending test email to:", email);

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: email,
      pass: password,
    },
  });

  const mailOptions = {
    from: email,
    to: email,
    subject: "Test Email",
    text: `Hello There,

You've just added a new email address to your Denshees account, and we wanted to send this test email to confirm that your SMTP connection is all set up and working perfectly.

If you have any questions or run into any issues, feel free to reach out to us at arpitabhyankar99823@gmail.com. We're always here to help!

Thanks for choosing Denshees. We look forward to supporting your email marketing journey!

Best regards,
Arpit Abhyankar (Co-Owner, Denshees)`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("[API] Test email sent:", info.messageId);
  } catch (error) {
    console.error("[API] Error sending test email:", error);
    throw error;
  }
}

async function testImapEmail({ username, password, host, port, secure }) {
  console.log("[API] Testing IMAP connection");

  const backendUrl = process.env.BACKEND_URL || "http://localhost:8100";

  const res = await axios.post(`${backendUrl}/email/test-imap`, {
    host,
    port,
    secure,
    username,
    password,
  });

  if (res.status !== 200) {
    throw new Error(res.data?.message || "IMAP test failed");
  }

  console.log("[API] IMAP connection test successful");
}
