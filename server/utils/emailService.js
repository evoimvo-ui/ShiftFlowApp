const { BrevoClient } = require('@getbrevo/brevo');

const client = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY
});

const sendVerificationEmail = async (toEmail, code) => {
  try {
    await client.transactionalEmails.sendTransacEmail({
      subject: "ShiftForge - Verify your account",
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #3b82f6; text-align: center;">Welcome to ShiftForge</h2>
          <p style="font-size: 16px; color: #333;">Thank you for registering. Please use the following code to verify your account:</p>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111827;">${code}</span>
          </div>
          <p style="font-size: 14px; color: #6b7280; text-align: center;">This code will expire in 15 minutes.</p>
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="font-size: 12px; color: #9ca3af; text-align: center;">If you did not request this, you can safely ignore this email.</p>
        </div>
      `,
      sender: {
        name: process.env.BREVO_FROM_NAME || "ShiftForge",
        email: process.env.BREVO_FROM_EMAIL
      },
      to: [{ email: toEmail }]
    });
    return true;
  } catch (error) {
    console.error("Brevo Email Error:", error);
    return false;
  }
};

module.exports = { sendVerificationEmail };