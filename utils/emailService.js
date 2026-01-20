import nodemailer from 'nodemailer';

/**
 * Create email transporter with Gmail SMTP
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD, // Use App Password, not regular password
    },
    // Add timeout settings to fail faster
    connectionTimeout: 5000,
    greetingTimeout: 5000,
  });
};

/**
 * Send verification email to user
 * @param {String} email - Recipient email
 * @param {String} name - Recipient name
 * @param {String} verificationToken - Email verification token
 */
export const sendVerificationEmail = async (email, name, verificationToken) => {
  const transporter = createTransporter();
  
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
  
  const mailOptions = {
    from: `"Bunk Buzz" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify Your Email - Bunk Buzz',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            font-weight: bold;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            color: #666;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📚 Welcome to Bunk Buzz!</h1>
        </div>
        <div class="content">
          <h2>Hi ${name},</h2>
          <p>Thank you for signing up for Bunk Buzz! We're excited to help you track your attendance and make smart decisions about your classes.</p>
          <p>To get started, please verify your email address by clicking the button below:</p>
          <div style="text-align: center;">
            <a href="${verificationUrl}" class="button">Verify Email</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
          <p><strong>This link will expire in 24 hours.</strong></p>
          <p>If you didn't create an account with Bunk Buzz, please ignore this email.</p>
          <p>Best regards,<br>The Bunk Buzz Team</p>
        </div>
        <div class="footer">
          <p>© 2026 Bunk Buzz. All rights reserved.</p>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✓ Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('✗ Failed to send verification email:', error.message);
    console.log('Note: User signup will continue without email verification');
    // Don't throw error - allow signup to continue
    return false;
  }
};

/**
 * Send password reset email
 * @param {String} email - Recipient email
 * @param {String} name - Recipient name
 * @param {String} resetToken - Password reset token
 */
export const sendPasswordResetEmail = async (email, name, resetToken) => {
  const transporter = createTransporter();
  
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  
  const mailOptions = {
    from: `"Bunk Buzz" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Password Reset Request - Bunk Buzz',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🔒 Password Reset</h1>
        </div>
        <div class="content">
          <h2>Hi ${name},</h2>
          <p>We received a request to reset your password for your Bunk Buzz account.</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </div>
          <p><strong>This link will expire in 1 hour.</strong></p>
          <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
          <p>Best regards,<br>The Bunk Buzz Team</p>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✓ Password reset email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('✗ Failed to send password reset email:', error.message);
    console.log('Note: Password reset will continue without email');
    // Don't throw error - allow reset to continue
    return false;
  }
};

/**
 * Send welcome email after successful verification
 * @param {String} email - Recipient email
 * @param {String} name - Recipient name
 */
export const sendWelcomeEmail = async (email, name) => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: `"Bunk Buzz" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Welcome to Bunk Buzz! 🎉',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎉 You're All Set!</h1>
        </div>
        <div class="content">
          <h2>Welcome aboard, ${name}!</h2>
          <p>Your email has been verified successfully. You can now access all features of Bunk Buzz:</p>
          <ul>
            <li>📊 Track attendance for all your subjects</li>
            <li>📅 Manage your timetable</li>
            <li>🎯 Use the Bunk Predictor to make smart decisions</li>
            <li>📈 View detailed analytics and insights</li>
          </ul>
          <p>Get started by adding your subjects and marking your attendance!</p>
          <p>Best regards,<br>The Bunk Buzz Team</p>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✓ Welcome email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('✗ Failed to send welcome email:', error.message);
    // Don't throw error for welcome email failures
    return false;
  }
};
