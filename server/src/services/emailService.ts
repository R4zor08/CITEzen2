import nodemailer from 'nodemailer';

interface SendContactInquiryEmailArgs {
  senderName: string;
  senderEmail: string;
  subject: string;
  message: string;
}

export async function sendContactInquiryEmail({
  senderName,
  senderEmail,
  subject,
  message
}: SendContactInquiryEmailArgs): Promise<{ sent: boolean; reason?: string }> {
  const recipientEmail = process.env.CONTACT_RECIPIENT_EMAIL || 'rcllanto@nemsu.edu.ph';
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = Number(process.env.SMTP_PORT || 465);
  const smtpSecure = smtpPort === 465;

  if (!smtpUser || !smtpPass) {
    console.warn(
      `[Email Service] SMTP credentials (SMTP_USER, SMTP_PASS) not configured in server/.env.\n` +
      `To deliver real emails to ${recipientEmail}, please configure a Gmail App Password in server/.env.\n` +
      `Simulated email notification logged for: "${subject}" from ${senderName} <${senderEmail}>`
    );
    return {
      sent: false,
      reason: 'SMTP_USER and SMTP_PASS not set in server/.env'
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass.replace(/\s+/g, '')
      }
    });

    const formattedDate = new Date().toLocaleString('en-PH', {
      timeZone: 'Asia/Manila',
      dateStyle: 'full',
      timeStyle: 'medium'
    });

    const mailOptions = {
      from: `"CITEzen Portal" <${smtpUser}>`,
      to: recipientEmail,
      replyTo: senderEmail,
      subject: `[CITEzen Inquiry] ${subject} - From ${senderName}`,
      text: `You have received a new inquiry from the CITEzen Contact Form:\n\n` +
            `From: ${senderName} (${senderEmail})\n` +
            `Subject: ${subject}\n` +
            `Date: ${formattedDate}\n\n` +
            `Message:\n${message}\n\n` +
            `---\n` +
            `You can reply directly to this email to respond to ${senderName}.`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
            .header { background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: #ffffff; padding: 24px 32px; }
            .header h1 { margin: 0 0 6px 0; font-size: 20px; font-weight: 700; }
            .header p { margin: 0; font-size: 13px; opacity: 0.9; }
            .content { padding: 32px; }
            .meta-box { background: #f1f5f9; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px; }
            .meta-row { display: flex; margin-bottom: 8px; font-size: 14px; }
            .meta-row:last-child { margin-bottom: 0; }
            .meta-label { font-weight: 600; width: 80px; color: #64748b; }
            .meta-value { font-weight: 500; color: #0f172a; }
            .message-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 8px; }
            .message-box { background: #ffffff; border-left: 4px solid #0284c7; padding: 16px 20px; border-radius: 4px; font-size: 15px; line-height: 1.6; color: #334155; white-space: pre-wrap; background-color: #f8fafc; }
            .cta-btn { display: inline-block; margin-top: 24px; background: #0284c7; color: #ffffff !important; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 14px; }
            .footer { background: #f8fafc; padding: 20px 32px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>CITEzen Contact Inquiry</h1>
              <p>North Eastern Mindanao State University (NEMSU) &bull; CITE Portal</p>
            </div>
            <div class="content">
              <div class="meta-box">
                <div class="meta-row">
                  <span class="meta-label">From:</span>
                  <span class="meta-value">${senderName} &lt;<a href="mailto:${senderEmail}" style="color: #0284c7;">${senderEmail}</a>&gt;</span>
                </div>
                <div class="meta-row">
                  <span class="meta-label">Subject:</span>
                  <span class="meta-value">${subject}</span>
                </div>
                <div class="meta-row">
                  <span class="meta-label">Time:</span>
                  <span class="meta-value">${formattedDate}</span>
                </div>
              </div>

              <div class="message-label">Message Content:</div>
              <div class="message-box">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>

              <div style="text-align: center;">
                <a href="mailto:${senderEmail}?subject=Re: ${encodeURIComponent(subject)}" class="cta-btn">
                  Reply to ${senderName}
                </a>
              </div>
            </div>
            <div class="footer">
              <p style="margin: 0;">This email was automatically dispatched by the CITEzen System.</p>
              <p style="margin: 4px 0 0 0;">Recipient: ${recipientEmail}</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Service] Contact inquiry email successfully delivered to ${recipientEmail} (MessageId: ${info.messageId})`);
    return { sent: true };
  } catch (error: any) {
    console.error(`[Email Service] Failed to send email to ${recipientEmail}:`, error.message);
    return { sent: false, reason: error.message };
  }
}

interface SendPasswordResetOtpEmailArgs {
  recipientEmail: string;
  recipientName: string;
  otpCode: string;
}

export async function sendPasswordResetOtpEmail({
  recipientEmail,
  recipientName,
  otpCode
}: SendPasswordResetOtpEmailArgs): Promise<{ sent: boolean; reason?: string }> {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = Number(process.env.SMTP_PORT || 465);
  const smtpSecure = smtpPort === 465;

  if (!smtpUser || !smtpPass) {
    console.warn(
      `[Email Service] SMTP credentials not set in server/.env.\n` +
      `[SIMULATED OTP] Password reset OTP for ${recipientEmail} (${recipientName}) is: ${otpCode}`
    );
    return {
      sent: false,
      reason: 'SMTP_USER and SMTP_PASS not set in server/.env'
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass.replace(/\s+/g, '')
      }
    });

    const mailOptions = {
      from: `"CITEzen Security" <${smtpUser}>`,
      to: recipientEmail,
      subject: `[CITEzen] Your Password Reset Code is ${otpCode}`,
      text: `Hello ${recipientName},\n\n` +
            `You recently requested to reset your CITEzen account password.\n\n` +
            `Your 6-digit verification code is: ${otpCode}\n\n` +
            `This code will expire in 15 minutes. If you did not request this password reset, please ignore this email or contact support.\n\n` +
            `---\n` +
            `North Eastern Mindanao State University (NEMSU)\n` +
            `College of Information Technology Education (CITE)`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
            .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); }
            .header { background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: #ffffff; padding: 28px 32px; text-align: center; }
            .header h1 { margin: 0 0 6px 0; font-size: 22px; font-weight: 800; letter-spacing: -0.02em; }
            .header p { margin: 0; font-size: 13px; opacity: 0.9; }
            .content { padding: 32px; }
            .greeting { font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 12px; }
            .text { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
            .otp-box { background: #f0f9ff; border: 2px dashed #0284c7; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
            .otp-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #0369a1; margin-bottom: 8px; }
            .otp-code { font-family: monospace; font-size: 36px; font-weight: 800; letter-spacing: 0.25em; color: #0284c7; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 6px; font-size: 13px; color: #92400e; margin-bottom: 24px; }
            .footer { background: #f8fafc; padding: 20px 32px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>CITEzen Account Security</h1>
              <p>NEMSU &bull; College of Information Technology Education</p>
            </div>
            <div class="content">
              <div class="greeting">Hello ${recipientName},</div>
              <div class="text">
                We received a request to reset the password for your CITEzen account. Enter the verification code below to complete the reset:
              </div>
              
              <div class="otp-box">
                <div class="otp-label">Verification Code</div>
                <div class="otp-code">${otpCode}</div>
              </div>

              <div class="warning">
                <strong>Important:</strong> This verification code is valid for <strong>15 minutes</strong>. If you did not make this request, you can safely disregard this email.
              </div>

              <div class="text" style="font-size: 13px; color: #64748b; margin-bottom: 0;">
                For your security, never share this code with anyone.
              </div>
            </div>
            <div class="footer">
              <p style="margin: 0;">North Eastern Mindanao State University (NEMSU)</p>
              <p style="margin: 4px 0 0 0;">CITEzen Automated Security Notification</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Service] Password reset OTP email sent to ${recipientEmail} (MessageId: ${info.messageId})`);
    return { sent: true };
  } catch (error: any) {
    console.error(`[Email Service] Failed to send password reset email to ${recipientEmail}:`, error.message);
    return { sent: false, reason: error.message };
  }
}

