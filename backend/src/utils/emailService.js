import nodemailer from 'nodemailer';
import EmailConfig from '../models/EmailConfig.js';

/**
 * Get email transporter with current configuration
 */
async function getTransporter() {
  try {
    console.log('📧 Getting email configuration...');
    const config = await EmailConfig.getConfig();
    console.log('   Config retrieved successfully');
    console.log('   SMTP Host:', config.smtpHost);
    console.log('   SMTP Port:', config.smtpPort);
    console.log('   SMTP Security:', config.smtpSecurity);
    console.log('   From Address:', config.emailFromAddress);
    
    // ZeptoMail: Try TLS on port 587 first (more reliable), fallback to SSL on 465
    // Port 587 with TLS is generally more reliable than 465 with SSL
    let isSecure = false;
    let usePort = config.smtpPort;
    let useSecurity = config.smtpSecurity;
    
    // If port is 465, try 587 with TLS instead (more reliable)
    if (config.smtpPort === 465) {
      console.log('   ⚠️  Port 465 detected, trying port 587 with TLS (more reliable)...');
      usePort = 587;
      useSecurity = 'tls';
      isSecure = false; // TLS uses secure: false
    } else {
      isSecure = config.smtpSecurity === 'ssl' || config.smtpPort === 465;
    }
    
    console.log('   Using port:', usePort);
    console.log('   Using security:', useSecurity);
    console.log('   Using secure connection:', isSecure);
    
    console.log('📧 Creating nodemailer transporter...');
    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: usePort, // Use adjusted port
      secure: isSecure, // true for 465 (SSL), false for 587 (TLS)
      auth: {
        user: config.smtpUsername,
        pass: config.smtpPassword,
      },
      // Increased timeout settings for better reliability
      connectionTimeout: 30000, // 30 seconds (increased from 10)
      greetingTimeout: 30000, // 30 seconds (increased from 10)
      socketTimeout: 60000, // 60 seconds (increased from 10)
      // Retry options
      pool: true, // Use connection pooling
      maxConnections: 1,
      maxMessages: 3,
      // For TLS on port 587
      ...(useSecurity === 'tls' && {
        requireTLS: true,
        tls: {
          rejectUnauthorized: false, // Allow self-signed certificates if needed
          minVersion: 'TLSv1.2'
        }
      }),
      // For SSL on port 465
      ...(isSecure && {
        tls: {
          rejectUnauthorized: false
        }
      })
    });
    
    console.log('   Transporter created successfully');
    
    // Verify transporter connection with timeout (non-blocking)
    console.log('📧 Verifying transporter connection...');
    try {
      // Use Promise.race to add a timeout to verification
      const verifyPromise = transporter.verify();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection verification timeout')), 20000)
      );
      await Promise.race([verifyPromise, timeoutPromise]);
      console.log('   ✅ Transporter connection verified successfully');
    } catch (verifyError) {
      console.warn('   ⚠️  Connection verification failed, but continuing:', verifyError.message);
      // Don't throw error, continue with email sending attempt
      // Sometimes verification fails but actual sending works
    }

    return { transporter, config };
  } catch (error) {
    console.error('❌❌❌ Error in getTransporter:');
    console.error('   Error message:', error.message);
    console.error('   Error code:', error.code);
    console.error('   Error stack:', error.stack);
    throw error;
  }
}

/**
 * Send email
 */
export async function sendEmail({ to, subject, html, text }) {
  try {
    console.log('📧 sendEmail function called');
    console.log('   To:', to);
    console.log('   Subject:', subject);
    
    console.log('📧 Getting email transporter...');
    const { transporter, config } = await getTransporter();
    console.log('   Transporter obtained successfully');
    console.log('   SMTP Host:', config.smtpHost);
    console.log('   SMTP Port:', config.smtpPort);
    console.log('   From Address:', config.emailFromAddress);

    // Use emailFromAddress directly (must be verified in ZeptoMail)
    // If smtpAddress is set, use that as the verified sender
    const fromEmail = config.smtpAddress || config.emailFromAddress;
    
    const mailOptions = {
      from: config.emailFromName 
        ? `"${config.emailFromName}" <${fromEmail}>`
        : fromEmail,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject: subject,
      html: html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      replyTo: config.replyEmailAddress 
        ? (config.replyEmailName 
          ? `"${config.replyEmailName}" <${config.replyEmailAddress}>`
          : config.replyEmailAddress)
        : undefined,
    };

    console.log('📤 Attempting to send email...');
    console.log('   From:', mailOptions.from);
    console.log('   To:', mailOptions.to);
    console.log('   Subject:', mailOptions.subject);
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅✅✅ Email sent successfully!');
    console.log('   To:', mailOptions.to);
    console.log('   Subject:', mailOptions.subject);
    console.log('   Message ID:', info.messageId);
    console.log('   Response:', info.response || 'Email accepted by server');
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌❌❌ Error sending email:');
    console.error('   To:', to);
    console.error('   Subject:', subject);
    console.error('   Error message:', error.message);
    console.error('   Error code:', error.code);
    console.error('   Error response:', error.response);
    console.error('   Full error:', error);
    console.error('   Error stack:', error.stack);
    return { success: false, error: error.message || 'Unknown error occurred' };
  }
}

/**
 * Send welcome email to customer when they register
 */
export async function sendCustomerWelcomeEmail(user) {
  console.log('📧 Preparing to send customer welcome email...');
  console.log('   Customer Name:', user.name);
  console.log('   Customer Email:', user.email);
  
  const subject = 'Welcome to ShubhVenue - Registration Successful!';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>🎉 Welcome to ShubhVenue!</h2>
        </div>
        <div class="content">
          <p>Dear ${user.name},</p>
          <p>Thank you for joining ShubhVenue! We're thrilled to have you as part of our community.</p>
          <p>Your account has been successfully created. You can now:</p>
          <ul>
            <li>Browse and explore amazing wedding venues</li>
            <li>Book venues for your special occasions</li>
            <li>Save your favorite venues to your shotlist</li>
            <li>Manage your bookings and reservations</li>
          </ul>
          <p style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5175'}" class="button">Start Exploring Venues</a>
          </p>
          <p>If you have any questions or need assistance, our support team is here to help.</p>
          <p>Best regards,<br>ShubhVenue Team</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const result = await sendEmail({
      to: user.email,
      subject,
      html,
    });
    
    if (result && result.success) {
      console.log('✅✅✅ Customer welcome email sent successfully!');
      console.log('   Email sent to:', user.email);
      console.log('   Message ID:', result.messageId);
      return result;
    } else {
      console.error('❌❌❌ Failed to send customer welcome email');
      console.error('   Result:', result);
      console.error('   Error:', result?.error || 'Unknown error');
      return { success: false, error: result?.error || 'Unknown error occurred' };
    }
  } catch (error) {
    console.error('❌❌❌ Exception in sendCustomerWelcomeEmail:');
    console.error('   Error:', error.message);
    console.error('   Stack:', error.stack);
    return { success: false, error: error.message || 'Exception occurred while sending email' };
  }
}

/**
 * Send welcome email to vendor when they register
 */
export async function sendVendorWelcomeEmail(vendor) {
  const subject = 'Welcome to ShubhVenue - Registration Successful!';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .highlight { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>🎉 Welcome to ShubhVenue!</h2>
        </div>
        <div class="content">
          <p>Dear ${vendor.name},</p>
          <p>Thank you for registering with ShubhVenue! We're excited to have you on board.</p>
          <div class="highlight">
            <p><strong>⏰ What's Next?</strong></p>
            <p>Your registration has been received and is currently under review by our admin team.</p>
            <p><strong>You will receive an approval email within 24-48 hours.</strong></p>
            <p>Once approved, you'll be able to log in and start managing your venues and bookings.</p>
          </div>
          <p>In the meantime, if you have any questions, please don't hesitate to contact our support team.</p>
          <p>Best regards,<br>ShubhVenue Team</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: vendor.email,
    subject,
    html,
  });
}

/**
 * Send email to admin when vendor registers
 */
export async function sendVendorRegistrationEmailToAdmin(vendor) {
  const adminEmails = await getAdminEmails();
  
  if (adminEmails.length === 0) {
    console.log('No admin emails found, skipping vendor registration notification');
    return { success: false, error: 'No admin emails found' };
  }

  const subject = 'New Vendor Registration - Approval Required';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .info-row { margin: 10px 0; }
        .label { font-weight: bold; color: #555; }
        .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .notice { background: #d1ecf1; padding: 15px; border-left: 4px solid #0c5460; margin: 20px 0; border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>New Vendor Registration</h2>
        </div>
        <div class="content">
          <p>A new vendor has registered and is waiting for approval:</p>
          <div class="info-row">
            <span class="label">Name:</span> ${vendor.name}
          </div>
          <div class="info-row">
            <span class="label">Email:</span> ${vendor.email}
          </div>
          <div class="info-row">
            <span class="label">Phone:</span> ${vendor.phone || 'N/A'}
          </div>
          <div class="info-row">
            <span class="label">Registration Date:</span> ${new Date(vendor.createdAt).toLocaleString()}
          </div>
          <div class="notice">
            <p><strong>⏰ Response Time:</strong></p>
            <p>Please review and respond to this vendor registration within <strong>24-48 hours</strong>.</p>
            <p>The vendor has been notified that they will receive a response within this timeframe.</p>
          </div>
          <p style="margin-top: 20px;">Please review and approve or reject this vendor registration.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: adminEmails,
    subject,
    html,
  });
}

/**
 * Send email to vendor when admin approves
 */
export async function sendVendorApprovalEmail(vendor) {
  const subject = 'Vendor Account Approved - Welcome to ShubhVenue!';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>🎉 Account Approved!</h2>
        </div>
        <div class="content">
          <p>Dear ${vendor.name},</p>
          <p>Great news! Your vendor account has been approved by our admin team.</p>
          <p>You can now log in to your vendor dashboard and start managing your venues and bookings.</p>
          <p style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5175'}/vendor/login" class="button">Login to Dashboard</a>
          </p>
          <p>If you have any questions, please don't hesitate to contact our support team.</p>
          <p>Best regards,<br>ShubhVenue Team</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: vendor.email,
    subject,
    html,
  });
}

/**
 * Send email to vendor when admin rejects
 */
export async function sendVendorRejectionEmail(vendor) {
  // Check if vendor was previously approved
  const wasApproved = vendor.vendorStatus === 'approved';
  
  const subject = wasApproved 
    ? 'Vendor Account Status Update - ShubhVenue'
    : 'Vendor Account Registration Update - ShubhVenue';
    
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #e74c3c; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .notice { background: #f8d7da; padding: 15px; border-left: 4px solid #dc3545; margin: 20px 0; border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Account Status Update</h2>
        </div>
        <div class="content">
          <p>Dear ${vendor.name},</p>
          ${wasApproved 
            ? `<div class="notice">
                <p><strong>Important Notice:</strong></p>
                <p>Your vendor account has been reviewed and we are unable to continue your account access at this time.</p>
              </div>
              <p>Your account access has been revoked. If you believe this is an error or would like to discuss this further, please contact our support team.</p>`
            : `<p>We regret to inform you that your vendor account registration has been reviewed and unfortunately, we are unable to approve it at this time.</p>
              <p>If you believe this is an error or would like to discuss this further, please contact our support team.</p>`
          }
          <p>Thank you for your interest in ShubhVenue.</p>
          <p>Best regards,<br>ShubhVenue Team</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: vendor.email,
    subject,
    html,
  });
}

/**
 * Get all admin email addresses
 * Priority: 1. Admin notification email from config, 2. All admin users' emails
 */
async function getAdminEmails() {
  try {
    const config = await EmailConfig.getConfig();
    const adminEmails = [];
    
    // First, check if admin notification email is set in config
    if (config.adminNotificationEmail) {
      adminEmails.push(config.adminNotificationEmail);
    }
    
    // Also get emails from all admin users
    const User = (await import('../models/User.js')).default;
    const admins = await User.find({ role: 'admin', isDeleted: false }).select('email');
    const adminUserEmails = admins.map(admin => admin.email).filter(email => email);
    
    // Combine and remove duplicates
    const allEmails = [...adminEmails, ...adminUserEmails];
    return [...new Set(allEmails)].filter(email => email);
  } catch (error) {
    console.error('Error fetching admin emails:', error);
    return [];
  }
}

/**
 * Send test email
 */
export async function sendTestEmail(toEmail) {
  const subject = 'Test Email - ShubhVenue Email Configuration';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .success { color: #28a745; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>✅ Test Email Successful!</h2>
        </div>
        <div class="content">
          <p>Dear Admin,</p>
          <p>This is a test email from ShubhVenue email system.</p>
          <p class="success">If you are reading this, your email configuration is working correctly!</p>
          <p>Email configuration details:</p>
          <ul>
            <li>SMTP Host: smtp.zeptomail.in</li>
            <li>Port: 465</li>
            <li>Security: SSL</li>
          </ul>
          <p>Best regards,<br>ShubhVenue Team</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: toEmail,
    subject,
    html,
  });
}

