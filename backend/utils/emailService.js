const nodemailer = require('nodemailer');

// Create reusable transporter
const createTransporter = () => {
  // Remove any spaces from the password (Gmail app passwords sometimes have spaces)
  const emailPass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s/g, '') : '';
  
  if (!process.env.EMAIL_USER || !emailPass) {
    throw new Error('Email credentials are not configured. Please set EMAIL_USER and EMAIL_PASS in .env file.');
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: emailPass
    },
    // Add connection timeout and other options for better reliability
    pool: true,
    maxConnections: 1,
    rateDelta: 2000,
    rateLimit: 5
  });

  // Verify transporter configuration
  return transporter;
};

// Send OTP email
const sendOTPEmail = async (email, otp, name) => {
  let transporter;
  try {
    // Create and verify transporter
    transporter = createTransporter();
    
    // Verify connection configuration
    await transporter.verify();
    console.log('Email server is ready to send messages');

    const mailOptions = {
      from: `"ShareLane" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email - ShareLane',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">ShareLane</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
            <h2 style="color: #667eea; margin-top: 0;">Email Verification</h2>
            <p>Hello ${name || 'there'},</p>
            <p>Thank you for signing up for ShareLane! To complete your registration, please verify your email address using the OTP below:</p>
            <div style="background: white; padding: 20px; border-radius: 5px; text-align: center; margin: 30px 0; border: 2px dashed #667eea;">
              <h1 style="color: #667eea; font-size: 36px; letter-spacing: 5px; margin: 0;">${otp}</h1>
            </div>
            <p style="color: #666; font-size: 14px;">This OTP will expire in 10 minutes. If you didn't request this verification, please ignore this email.</p>
            <p style="margin-top: 30px;">Best regards,<br>The ShareLane Team</p>
          </div>
        </body>
        </html>
      `,
      text: `
        Hello ${name || 'there'},
        
        Thank you for signing up for ShareLane! To complete your registration, please verify your email address using the OTP below:
        
        ${otp}
        
        This OTP will expire in 10 minutes. If you didn't request this verification, please ignore this email.
        
        Best regards,
        The ShareLane Team
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('OTP email sent successfully:', info.messageId);
    console.log('Email sent to:', email);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    
    // Provide more detailed error messages
    let errorMessage = 'Failed to send OTP email';
    
    if (error.code === 'EAUTH') {
      errorMessage = 'Email authentication failed. Please check your EMAIL_USER and EMAIL_PASS in .env file.';
    } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
      errorMessage = 'Email server connection failed. Please check your internet connection and email service configuration.';
    } else if (error.response) {
      errorMessage = `Email service error: ${error.response}`;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    console.error('Detailed error:', {
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });
    
    throw new Error(errorMessage);
  } finally {
    // Close transporter connection
    if (transporter) {
      transporter.close();
    }
  }
};

module.exports = {
  sendOTPEmail
};

