import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

export async function POST(request) {
  console.log("[API] Processing support query");

  try {
    const formData = await request.json();
    if (!formData) {
      console.error("[API] No data found in request");
      return NextResponse.json({ message: "No data found" }, { status: 500 });
    }

    const { fullName = "", email = "", message = "" } = formData;
    console.log(`[API] Processing support query from: ${fullName}, ${email}`);

    const template = `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
        }
        .container {
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          padding: 10px 0;
          background-color: #333333;
          color: #ffffff;
          border-radius: 8px 8px 0 0;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
        }
        .content {
          padding: 20px;
        }
        .content p {
          font-size: 16px;
          color: #555555;
          line-height: 1.5;
        }
        .footer {
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #999999;
        }
        .footer a {
          color: #999999;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Email Header -->
        <div class="header">
          <h1>Support Request Received</h1>
        </div>
        
        <!-- Email Content -->
        <div class="content">
          <p>Hi <strong>{{fullName}}</strong>,</p>
          
          <p>Thank you for reaching out to us. We have received your support request with the following details:</p>
          
          <p><strong>Email:</strong> {{email}}</p>
          
          <p><strong>Message:</strong></p>
          <p>{{message}}</p>
          
          <p>Our team will review your request and get back to you as soon as possible. We appreciate your patience.</p>
        </div>
        
        <!-- Email Footer -->
        <div class="footer">
          <p>&copy; 2024 Venture CRM. All rights reserved.</p>
          <p><a href="#">Privacy Policy</a> | <a href="#">Terms of Service</a></p>
        </div>
      </div>
    </body>
    </html>
    `;
    const emailHtml = template
      .replace("{{fullName}}", formData.fullName)
      .replace("{{email}}", formData.email)
      .replace("{{message}}", formData.message);

    console.log("[API] Sending support notification emails");
    const notifyEmails = (process.env.SUPPORT_NOTIFY_EMAILS || "")
      .split(",")
      .filter(Boolean);
    for (const addr of notifyEmails) {
      sendEmail(addr.trim(), "Contact from Denshees", emailHtml);
    }

    console.log("[API] Support query processed successfully");
    return NextResponse.json({ message: "Email sent" });
  } catch (error) {
    console.error("[API] Error processing support query:", error);
    return NextResponse.json({ error }, { status: 500 });
  }
}

function sendEmail(to, subject, emailHtml) {
  console.log(`[API] Sending email to: ${to}`);

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  const mailOptions = {
    from: process.env.SMTP_USER,
    to: to,
    subject: subject,
    html: emailHtml,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("[API] Error sending email:", error);
    } else {
      console.log(`[API] Email sent: ${info.response}`);
    }
  });
}
