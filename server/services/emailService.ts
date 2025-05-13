import * as nodemailer from 'nodemailer';

class EmailService {
  private transporter: nodemailer.Transporter;
  
  constructor() {
    // Configure nodemailer with Gmail SMTP
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
    
    // Verify connection configuration
    this.transporter.verify((error, success) => {
      if (error) {
        console.error('SMTP connection error:', error);
      } else {
        console.log('SMTP server is ready to send emails');
      }
    });
  }

  /**
   * Sends a welcome email to a new user
   * @param email - Recipient email address
   * @param username - Username for personalization
   */
  async sendWelcomeEmail(email: string, username: string): Promise<void> {
    // Always log in development mode for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`[EMAIL] Welcome email sent to ${email}`);
    }
    
    try {
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || '"ECC Security System" <security@eccsystem.com>',
        to: email,
        subject: 'Welcome to ECC Security System',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #3949ab;">Welcome to ECC Security System, ${username}!</h2>
            <p>Thank you for registering with our secure authentication platform.</p>
            <p>Your account is protected with advanced Elliptic Curve Cryptography and two-factor authentication.</p>
            <hr style="border: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #666;">
              If you did not create this account, please contact our support team immediately.
            </p>
          </div>
        `
      });
      
      console.log(`Welcome email sent successfully to ${email}, message ID: ${info.messageId}`);
    } catch (error) {
      console.error('Error sending welcome email:', error);
      throw new Error('Failed to send welcome email');
    }
  }

  /**
   * Sends a one-time password to the user
   * @param email - Recipient email address
   * @param otp - One-time password
   */
  async sendOTP(email: string, otp: string): Promise<void> {
    // Always log the OTP in development mode for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`[EMAIL] OTP sent to ${email}: ${otp}`);
    }
    
    // Send actual email (works in both development and production)
    try {
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || '"ECC Security System" <security@eccsystem.com>',
        to: email,
        subject: 'Your One-Time Password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #3949ab;">Your One-Time Password</h2>
            <p>You've requested to log in to your ECC Security System account.</p>
            <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
              <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px;">${otp}</span>
            </div>
            <p>This code will expire in 5 minutes.</p>
            <p>If you didn't request this code, please ignore this email.</p>
            <hr style="border: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #666;">
              This is an automated message, please do not reply.
            </p>
          </div>
        `
      });
      
      console.log(`Email sent successfully to ${email}, message ID: ${info.messageId}`);
    } catch (error) {
      console.error('Error sending OTP email:', error);
      throw new Error('Failed to send OTP email');
    }
  }

  /**
   * Sends a login alert notification
   * @param email - Recipient email address
   * @param location - Location of the login
   * @param deviceInfo - Device information
   * @param isNewLocation - Whether this is a new login location
   */
  async sendLoginAlert(
    email: string, 
    location: string, 
    deviceInfo: string, 
    isNewLocation: boolean
  ): Promise<void> {
    // Always log in development mode for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`[EMAIL] Login alert sent to ${email} for ${location} (${deviceInfo})`);
    }
    
    const subject = isNewLocation 
      ? '⚠️ New Location Login Alert' 
      : 'Login Notification';
    
    try {
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || '"ECC Security System" <security@eccsystem.com>',
        to: email,
        subject: subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: ${isNewLocation ? '#ff9800' : '#3949ab'};">
              ${isNewLocation ? '⚠️ New Location Login' : 'Successful Login'}
            </h2>
            <p>We detected a${isNewLocation ? ' new ' : ' '}login to your account.</p>
            <div style="background-color: #f5f5f5; padding: 15px; margin: 15px 0;">
              <p><strong>Location:</strong> ${location}</p>
              <p><strong>Device:</strong> ${deviceInfo}</p>
              <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            </div>
            
            ${isNewLocation ? `
            <p style="color: #ff9800; font-weight: bold;">
              If this wasn't you, please secure your account immediately by logging in and using the "Force Logout All Other Devices" option.
            </p>` : ''}
            
            <hr style="border: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #666;">
              This is an automated security notification.
            </p>
          </div>
        `
      });
      
      console.log(`Login alert email sent successfully to ${email}, message ID: ${info.messageId}`);
    } catch (error) {
      console.error('Error sending login alert email:', error);
      throw new Error('Failed to send login alert email');
    }
  }
}

// Export a singleton instance
export const emailService = new EmailService();