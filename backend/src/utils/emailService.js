import nodemailer from 'nodemailer';
import EmailConfig from '../models/EmailConfig.js';
import EmailTemplate from '../models/EmailTemplate.js';

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
    
    // ZeptoMail configuration - Port 587 with STARTTLS is recommended
    // Port 465 with SSL also works but 587 with TLS is more reliable
    let isSecure = false;
    let usePort = config.smtpPort;
    let useSecurity = config.smtpSecurity;
    
    // For ZeptoMail, prefer port 587 with TLS (STARTTLS)
    // Port 465 with SSL also works, but 587 is more compatible
    if (config.smtpHost === 'smtp.zeptomail.in' || config.smtpHost.includes('zeptomail')) {
      if (config.smtpPort === 465 && config.smtpSecurity === 'ssl') {
        console.log('   🔧 ZeptoMail detected: Using port 587 with STARTTLS (recommended)...');
        usePort = 587;
        useSecurity = 'tls';
        isSecure = false; // STARTTLS uses secure: false
      } else if (config.smtpPort === 587 || config.smtpSecurity === 'tls') {
        usePort = 587;
        useSecurity = 'tls';
        isSecure = false;
      } else {
        isSecure = config.smtpSecurity === 'ssl' || config.smtpPort === 465;
      }
    } else {
      // For other SMTP servers, use configured settings
      isSecure = config.smtpSecurity === 'ssl' || config.smtpPort === 465;
    }
    
    console.log('   Using port:', usePort);
    console.log('   Using security:', useSecurity);
    console.log('   Using secure connection:', isSecure);
    
    console.log('📧 Creating nodemailer transporter...');
    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: usePort,
      secure: isSecure, // true for 465 (SSL), false for 587 (STARTTLS/TLS)
      auth: {
        user: config.smtpUsername,
        pass: config.smtpPassword,
      },
      // Increased timeout settings for better reliability
      connectionTimeout: 30000, // 30 seconds
      greetingTimeout: 30000, // 30 seconds
      socketTimeout: 60000, // 60 seconds
      // Retry options
      pool: true, // Use connection pooling
      maxConnections: 1,
      maxMessages: 3,
      // For STARTTLS on port 587 (ZeptoMail recommended)
      ...(usePort === 587 && useSecurity === 'tls' && {
        requireTLS: true,
        tls: {
          rejectUnauthorized: false, // Allow self-signed certificates
          minVersion: 'TLSv1.2',
          ciphers: 'SSLv3'
        }
      }),
      // For SSL on port 465
      ...(isSecure && usePort === 465 && {
        tls: {
          rejectUnauthorized: false,
          minVersion: 'TLSv1.2'
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
 * Get template from database and replace variables
 * Returns processed HTML with variables replaced - HTML is sent exactly as-is
 */
export async function getTemplateAndReplaceVariables(templateType, variables = {}) {
  try {
    const template = await EmailTemplate.getByType(templateType);
    
    if (!template || !template.isActive) {
      console.log(`   ⚠️  No active template found for type: ${templateType}, using default`);
      return null;
    }
    
    console.log(`   ✅ Template found: ${template.name}`);
    
    // Get HTML from template - this is the main content
    let processedHtml = template.html;
    
    // Handle logoUrl from template - replace {{logoUrl}} placeholder with img tag or empty
    let logoImgTag = '';
    if (template.logoUrl) {
      // Replace {{frontendUrl}} in logoUrl if present
      let logoUrl = template.logoUrl;
      if (variables.frontendUrl) {
        logoUrl = logoUrl.replace(/\{\{frontendUrl\}\}/g, variables.frontendUrl);
      }
      
      // Convert relative path to absolute URL if needed (for uploaded files)
      if (logoUrl.startsWith('/uploads/')) {
        // It's a relative path - convert to absolute URL
        const baseUrl = variables.frontendUrl || process.env.FRONTEND_URL || 'http://localhost:5175';
        // Remove leading slash if present in baseUrl to avoid double slashes
        const cleanBaseUrl = baseUrl.replace(/\/$/, '');
        logoUrl = `${cleanBaseUrl}${logoUrl}`;
      }
      
      // Create img tag with absolute URL
      logoImgTag = `<img src="${logoUrl}" alt="ShubhVenue Logo" class="logo" />`;
    }
    // Replace {{logoUrl}} placeholder (used as img tag placeholder in template)
    processedHtml = processedHtml.replace(/\{\{logoUrl\}\}/g, logoImgTag);
    
    // Replace all {{variable}} placeholders with actual values in HTML
    Object.keys(variables).forEach(key => {
      const value = variables[key];
      // Skip object values - handle them separately
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        return;
      }
      // Match {{variable}} pattern (simple variables)
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      processedHtml = processedHtml.replace(regex, String(value || ''));
    });
    
    // Handle nested object paths like user.name, vendor.name, etc.
    Object.keys(variables).forEach(parentKey => {
      if (variables[parentKey] && typeof variables[parentKey] === 'object' && !Array.isArray(variables[parentKey])) {
        Object.keys(variables[parentKey]).forEach(childKey => {
          const value = variables[parentKey][childKey] || '';
          // Match {{parent.child}} pattern (e.g., {{user.name}}, {{vendor.email}})
          const regex = new RegExp(`\\{\\{${parentKey}\\.${childKey}\\}\\}`, 'g');
          processedHtml = processedHtml.replace(regex, String(value));
        });
      }
    });
    
    // Extract subject from HTML <title> tag if present, otherwise use template subject or default
    let processedSubject = template.subject || '';
    if (!processedSubject && processedHtml) {
      const titleMatch = processedHtml.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch && titleMatch[1]) {
        processedSubject = titleMatch[1].trim();
      }
    }
    
    // If still no subject, use default based on template type
    if (!processedSubject) {
      const subjectMap = {
        'customer_welcome': 'Welcome to ShubhVenue!',
        'vendor_welcome': 'Welcome to ShubhVenue - Registration Received',
        'vendor_approval': 'Your Vendor Account Has Been Approved',
        'vendor_rejection': 'Vendor Account Update',
        'vendor_registration_admin': 'New Vendor Registration - Approval Required',
        'booking_confirmation': 'Booking Confirmation',
        'booking_cancellation': 'Booking Cancellation',
        'password_reset': 'Password Reset Request'
      };
      processedSubject = subjectMap[templateType] || 'Email from ShubhVenue';
    }
    
    // Replace variables in subject as well
    Object.keys(variables).forEach(key => {
      const value = variables[key];
      // Skip object values - handle them separately
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        return;
      }
      // Match {{variable}} pattern (simple variables)
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      processedSubject = processedSubject.replace(regex, String(value || ''));
    });
    
    // Handle nested object paths in subject
    Object.keys(variables).forEach(parentKey => {
      if (variables[parentKey] && typeof variables[parentKey] === 'object' && !Array.isArray(variables[parentKey])) {
        Object.keys(variables[parentKey]).forEach(childKey => {
          const value = variables[parentKey][childKey] || '';
          // Match {{parent.child}} pattern (e.g., {{user.name}}, {{vendor.email}})
          const regex = new RegExp(`\\{\\{${parentKey}\\.${childKey}\\}\\}`, 'g');
          processedSubject = processedSubject.replace(regex, String(value));
        });
      }
    });
    
    // Auto-generate plain text version from HTML
    const processedText = template.text || processedHtml.replace(/<[^>]*>/g, '').trim();
    
    return {
      subject: processedSubject,
      html: processedHtml, // HTML is sent exactly as-is (just variables replaced)
      text: processedText
    };
  } catch (error) {
    console.error(`   ⚠️  Error getting template for ${templateType}:`, error.message);
    return null;
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
    // For ZeptoMail, the sender email MUST be verified in their dashboard
    // Priority: smtpAddress (verified sender) > emailFromAddress
    const fromEmail = config.smtpAddress || config.emailFromAddress;
    
    if (!fromEmail) {
      const errorMsg = 'Sender email address is not configured. Please configure emailFromAddress or smtpAddress in email settings.';
      console.error('❌❌❌', errorMsg);
      return { success: false, error: errorMsg };
    }
    
    // Log sender email for verification check
    console.log('📧 Sender Email (must be verified in ZeptoMail):', fromEmail);
    
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
    
    // Warn if using ZeptoMail and sender might not be verified
    if (config.smtpHost && (config.smtpHost.includes('zeptomail') || config.smtpHost === 'smtp.zeptomail.in')) {
      console.log('   ⚠️  ZeptoMail: Ensure sender email is verified in dashboard');
    }
    
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
    
    // Check for specific ZeptoMail relay error
    if (error.message && error.message.includes('553') && error.message.includes('relay')) {
      console.error('');
      console.error('⚠️  ZEPTOMAIL SENDER VERIFICATION REQUIRED ⚠️');
      console.error('   The sender email address must be verified in ZeptoMail dashboard.');
      console.error('   Steps to fix:');
      console.error('   1. Login to https://www.zeptomail.com/');
      console.error('   2. Go to "Senders" or "Verified Senders" section');
      console.error(`   3. Add and verify: ${config.emailFromAddress || config.smtpAddress}`);
      console.error('   4. Click the verification link sent to that email');
      console.error('   5. Once verified, emails will work');
      console.error('');
    }
    
    console.error('   Full error:', error);
    console.error('   Error stack:', error.stack);
    
    // Provide user-friendly error message
    let userError = error.message || 'Unknown error occurred';
    if (error.message && error.message.includes('553') && error.message.includes('relay')) {
      userError = `Sender email "${config.emailFromAddress || config.smtpAddress}" is not verified in ZeptoMail. Please verify the sender email in ZeptoMail dashboard first.`;
    }
    
    return { success: false, error: userError };
  }
}

/**
 * Send welcome email to customer when they register
 */
export async function sendCustomerWelcomeEmail(user) {
  console.log('📧 Preparing to send customer welcome email...');
  console.log('   Customer Name:', user.name);
  console.log('   Customer Email:', user.email);
  
  // Try to get template from database
  const templateData = await getTemplateAndReplaceVariables('customer_welcome', {
    user: {
      name: user.name || 'Customer',
      email: user.email || '',
      phone: user.phone || ''
    },
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5175'
  });
  
  // Use template from database if available, otherwise use default
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5175';
  const subject = templateData?.subject || 'Welcome to ShubhVenue - Registration Successful!';
  const html = templateData?.html || `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1F2937; background-color: #F3F4F6; }
        .email-wrapper { max-width: 600px; margin: 0 auto; background-color: #FFFFFF; }
        .header { background: linear-gradient(135deg, #8F61EF 0%, #F9A826 100%); color: white; padding: 40px 30px; text-align: center; }
        .logo { max-width: 180px; height: auto; margin-bottom: 20px; }
        .header h1 { font-size: 28px; font-weight: 700; margin: 0; letter-spacing: -0.5px; }
        .content { padding: 40px 30px; background-color: #FFFFFF; }
        .content p { margin-bottom: 16px; color: #4B5563; font-size: 16px; }
        .content ul { margin: 20px 0 20px 20px; color: #4B5563; }
        .content li { margin-bottom: 10px; font-size: 16px; }
        .button-wrapper { text-align: center; margin: 30px 0; }
        .button { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #8F61EF 0%, #F9A826 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(143, 97, 239, 0.3); }
        .footer { background-color: #F9FAFB; padding: 30px; text-align: center; border-top: 1px solid #E5E7EB; }
        .footer p { color: #6B7280; font-size: 14px; margin-bottom: 8px; }
        .footer-links { margin-top: 16px; }
        .footer-links a { color: #8F61EF; text-decoration: none; margin: 0 12px; font-size: 14px; }
        @media only screen and (max-width: 600px) {
          .header { padding: 30px 20px; }
          .content { padding: 30px 20px; }
          .footer { padding: 20px; }
          .header h1 { font-size: 24px; }
        }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="header">
          <img src="${frontendUrl}/image/venuebook.png" alt="ShubhVenue Logo" class="logo" />
          <h1>🎉 Welcome to ShubhVenue!</h1>
        </div>
        <div class="content">
          <p>Dear ${user.name || 'Customer'},</p>
          <p>Thank you for joining ShubhVenue! We're thrilled to have you as part of our community.</p>
          <p>Your account has been successfully created. You can now:</p>
          <ul>
            <li>Browse and explore amazing wedding venues</li>
            <li>Book venues for your special occasions</li>
            <li>Save your favorite venues to your shotlist</li>
            <li>Manage your bookings and reservations</li>
          </ul>
          <div class="button-wrapper">
            <a href="${frontendUrl}" class="button">Start Exploring Venues</a>
          </div>
          <p>If you have any questions or need assistance, our support team is here to help.</p>
          <p style="margin-top: 30px;">Best regards,<br><strong>The ShubhVenue Team</strong></p>
        </div>
        <div class="footer">
          <p>© 2024 ShubhVenue. All rights reserved.</p>
          <div class="footer-links">
            <a href="${frontendUrl}">Visit Website</a>
            <a href="${frontendUrl}/contact">Contact Us</a>
            <a href="${frontendUrl}/privacy">Privacy Policy</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  const text = templateData?.text;

  try {
    const result = await sendEmail({
      to: user.email,
      subject,
      html, // HTML is sent exactly as-is (just variables replaced)
      text,
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
  console.log('📧 Preparing to send vendor welcome email...');
  console.log('   Vendor Name:', vendor.name);
  console.log('   Vendor Email:', vendor.email);
  
  // Try to get template from database
  const templateData = await getTemplateAndReplaceVariables('vendor_welcome', {
    user: {
      name: vendor.name || 'Vendor',
      email: vendor.email || '',
      phone: vendor.phone || ''
    },
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5175'
  });
  
  // Use template from database if available, otherwise use default
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5175';
  const subject = templateData?.subject || 'Welcome to ShubhVenue - Registration Received';
  const html = templateData?.html || `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1F2937; background-color: #F3F4F6; }
        .email-wrapper { max-width: 600px; margin: 0 auto; background-color: #FFFFFF; }
        .header { background: linear-gradient(135deg, #8F61EF 0%, #F9A826 100%); color: white; padding: 40px 30px; text-align: center; }
        .logo { max-width: 180px; height: auto; margin-bottom: 20px; }
        .header h1 { font-size: 28px; font-weight: 700; margin: 0; letter-spacing: -0.5px; }
        .content { padding: 40px 30px; background-color: #FFFFFF; }
        .content p { margin-bottom: 16px; color: #4B5563; font-size: 16px; }
        .highlight-box { background: linear-gradient(135deg, rgba(143, 97, 239, 0.1) 0%, rgba(249, 168, 38, 0.1) 100%); border-left: 4px solid #F9A826; padding: 20px; margin: 30px 0; border-radius: 8px; }
        .highlight-box p { margin-bottom: 12px; color: #1F2937; }
        .highlight-box strong { color: #8F61EF; font-size: 18px; }
        .footer { background-color: #F9FAFB; padding: 30px; text-align: center; border-top: 1px solid #E5E7EB; }
        .footer p { color: #6B7280; font-size: 14px; margin-bottom: 8px; }
        .footer-links { margin-top: 16px; }
        .footer-links a { color: #8F61EF; text-decoration: none; margin: 0 12px; font-size: 14px; }
        @media only screen and (max-width: 600px) {
          .header { padding: 30px 20px; }
          .content { padding: 30px 20px; }
          .footer { padding: 20px; }
          .header h1 { font-size: 24px; }
        }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="header">
          <img src="${frontendUrl}/image/venuebook.png" alt="ShubhVenue Logo" class="logo" />
          <h1>🎉 Welcome to ShubhVenue!</h1>
        </div>
        <div class="content">
          <p>Dear ${vendor.name},</p>
          <p>Thank you for registering with ShubhVenue! We're excited to have you on board as a vendor partner.</p>
          <div class="highlight-box">
            <p><strong>⏰ What's Next?</strong></p>
            <p>Your registration has been received and is currently under review by our admin team.</p>
            <p style="margin-top: 12px;"><strong>You will receive an approval email within 24-48 hours.</strong></p>
            <p style="margin-top: 12px;">Once approved, you'll be able to log in and start managing your venues and bookings.</p>
          </div>
          <p>In the meantime, if you have any questions, please don't hesitate to contact our support team.</p>
          <p style="margin-top: 30px;">Best regards,<br><strong>The ShubhVenue Team</strong></p>
        </div>
        <div class="footer">
          <p>© 2024 ShubhVenue. All rights reserved.</p>
          <div class="footer-links">
            <a href="${frontendUrl}">Visit Website</a>
            <a href="${frontendUrl}/contact">Contact Us</a>
            <a href="${frontendUrl}/privacy">Privacy Policy</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  const text = templateData?.text;

  try {
    const result = await sendEmail({
      to: vendor.email,
      subject,
      html,
      text,
    });
    
    if (result && result.success) {
      console.log('✅ Vendor welcome email sent successfully to:', vendor.email);
    } else {
      console.error('❌ Failed to send vendor welcome email:', result?.error);
    }
    
    return result || { success: false, error: 'Unknown error occurred' };
  } catch (error) {
    console.error('❌ Exception in sendVendorWelcomeEmail:', error);
    return { success: false, error: error.message || 'Exception occurred while sending email' };
  }
}

/**
 * Send email to admin when vendor registers
 */
export async function sendVendorRegistrationEmailToAdmin(vendor) {
  console.log('📧 Preparing to send vendor registration notification to admin...');
  
  const adminEmails = await getAdminEmails();
  
  if (adminEmails.length === 0) {
    console.log('No admin emails found, skipping vendor registration notification');
    return { success: false, error: 'No admin emails found' };
  }

  // Try to get template from database
  const registrationDate = vendor.createdAt ? new Date(vendor.createdAt).toLocaleString() : new Date().toLocaleString();
  const templateData = await getTemplateAndReplaceVariables('vendor_registration_admin', {
    vendor: {
      name: vendor.name || 'Vendor',
      email: vendor.email || '',
      phone: vendor.phone || 'N/A'
    },
    registrationDate: registrationDate,
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5175'
  });
  
  // Use template from database if available, otherwise use default
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5175';
  const subject = templateData?.subject || 'New Vendor Registration - Approval Required';
  const html = templateData?.html || `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1F2937; background-color: #F3F4F6; }
        .email-wrapper { max-width: 600px; margin: 0 auto; background-color: #FFFFFF; }
        .header { background: linear-gradient(135deg, #8F61EF 0%, #F9A826 100%); color: white; padding: 40px 30px; text-align: center; }
        .logo { max-width: 180px; height: auto; margin-bottom: 20px; }
        .header h1 { font-size: 28px; font-weight: 700; margin: 0; letter-spacing: -0.5px; }
        .content { padding: 40px 30px; background-color: #FFFFFF; }
        .content p { margin-bottom: 16px; color: #4B5563; font-size: 16px; }
        .info-card { background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .info-row { margin: 12px 0; padding: 10px 0; border-bottom: 1px solid #E5E7EB; }
        .info-row:last-child { border-bottom: none; }
        .label { font-weight: 600; color: #8F61EF; display: inline-block; min-width: 140px; }
        .value { color: #1F2937; }
        .notice-box { background: linear-gradient(135deg, rgba(143, 97, 239, 0.1) 0%, rgba(249, 168, 38, 0.1) 100%); border-left: 4px solid #F9A826; padding: 20px; margin: 30px 0; border-radius: 8px; }
        .notice-box p { margin-bottom: 12px; color: #1F2937; }
        .notice-box strong { color: #8F61EF; }
        .button-wrapper { text-align: center; margin: 30px 0; }
        .button { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #8F61EF 0%, #F9A826 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(143, 97, 239, 0.3); }
        .footer { background-color: #F9FAFB; padding: 30px; text-align: center; border-top: 1px solid #E5E7EB; }
        .footer p { color: #6B7280; font-size: 14px; margin-bottom: 8px; }
        @media only screen and (max-width: 600px) {
          .header { padding: 30px 20px; }
          .content { padding: 30px 20px; }
          .footer { padding: 20px; }
          .header h1 { font-size: 24px; }
          .label { display: block; margin-bottom: 4px; }
        }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="header">
          <img src="${frontendUrl}/image/venuebook.png" alt="ShubhVenue Logo" class="logo" />
          <h1>New Vendor Registration</h1>
        </div>
        <div class="content">
          <p>A new vendor has registered and is waiting for approval:</p>
          <div class="info-card">
            <div class="info-row">
              <span class="label">Name:</span>
              <span class="value">${vendor.name}</span>
            </div>
            <div class="info-row">
              <span class="label">Email:</span>
              <span class="value">${vendor.email}</span>
            </div>
            <div class="info-row">
              <span class="label">Phone:</span>
              <span class="value">${vendor.phone || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">Registration Date:</span>
              <span class="value">${registrationDate}</span>
            </div>
          </div>
          <div class="notice-box">
            <p><strong>⏰ Response Time:</strong></p>
            <p>Please review and respond to this vendor registration within <strong>24-48 hours</strong>.</p>
            <p>The vendor has been notified that they will receive a response within this timeframe.</p>
          </div>
          <div class="button-wrapper">
            <a href="${frontendUrl}/admin/vendors" class="button">Review Vendor Registration</a>
          </div>
          <p style="margin-top: 30px;">Please review and approve or reject this vendor registration from the admin dashboard.</p>
        </div>
        <div class="footer">
          <p>© 2024 ShubhVenue. All rights reserved.</p>
          <p style="font-size: 12px; color: #9CA3AF;">This is an automated notification email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  const text = templateData?.text;

  try {
    const result = await sendEmail({
      to: adminEmails,
      subject,
      html,
      text,
    });
    
    if (result && result.success) {
      console.log('✅ Vendor registration notification sent to admin');
    } else {
      console.error('❌ Failed to send admin notification:', result?.error);
    }
    
    return result || { success: false, error: 'Unknown error occurred' };
  } catch (error) {
    console.error('❌ Exception in sendVendorRegistrationEmailToAdmin:', error);
    return { success: false, error: error.message || 'Exception occurred while sending email' };
  }
}

/**
 * Send email to vendor when admin approves
 */
export async function sendVendorApprovalEmail(vendor) {
  console.log('📧 Preparing to send vendor approval email...');
  console.log('   Vendor Name:', vendor.name);
  console.log('   Vendor Email:', vendor.email);
  
  // Try to get template from database
  const templateData = await getTemplateAndReplaceVariables('vendor_approval', {
    user: {
      name: vendor.name || 'Vendor',
      email: vendor.email || '',
      phone: vendor.phone || ''
    },
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5175'
  });
  
  // Use template from database if available, otherwise use default
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5175';
  const subject = templateData?.subject || 'Your Vendor Account Has Been Approved';
  const html = templateData?.html || `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1F2937; background-color: #F3F4F6; }
        .email-wrapper { max-width: 600px; margin: 0 auto; background-color: #FFFFFF; }
        .header { background: linear-gradient(135deg, #8F61EF 0%, #F9A826 100%); color: white; padding: 40px 30px; text-align: center; }
        .logo { max-width: 180px; height: auto; margin-bottom: 20px; }
        .header h1 { font-size: 28px; font-weight: 700; margin: 0; letter-spacing: -0.5px; }
        .content { padding: 40px 30px; background-color: #FFFFFF; }
        .content p { margin-bottom: 16px; color: #4B5563; font-size: 16px; }
        .success-box { background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(143, 97, 239, 0.1) 100%); border-left: 4px solid #10B981; padding: 20px; margin: 30px 0; border-radius: 8px; text-align: center; }
        .success-box h2 { color: #10B981; font-size: 24px; margin-bottom: 12px; }
        .success-box p { color: #1F2937; margin-bottom: 8px; }
        .content ul { margin: 20px 0 20px 20px; color: #4B5563; }
        .content li { margin-bottom: 10px; font-size: 16px; }
        .button-wrapper { text-align: center; margin: 30px 0; }
        .button { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #8F61EF 0%, #F9A826 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(143, 97, 239, 0.3); }
        .footer { background-color: #F9FAFB; padding: 30px; text-align: center; border-top: 1px solid #E5E7EB; }
        .footer p { color: #6B7280; font-size: 14px; margin-bottom: 8px; }
        .footer-links { margin-top: 16px; }
        .footer-links a { color: #8F61EF; text-decoration: none; margin: 0 12px; font-size: 14px; }
        @media only screen and (max-width: 600px) {
          .header { padding: 30px 20px; }
          .content { padding: 30px 20px; }
          .footer { padding: 20px; }
          .header h1 { font-size: 24px; }
        }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="header">
          <img src="${frontendUrl}/image/venuebook.png" alt="ShubhVenue Logo" class="logo" />
          <h1>🎉 Account Approved!</h1>
        </div>
        <div class="content">
          <p>Dear ${vendor.name},</p>
          <div class="success-box">
            <h2>✅ Great News!</h2>
            <p>Your vendor account has been approved by our admin team.</p>
            <p>You can now log in to your vendor dashboard and start managing your venues and bookings.</p>
          </div>
          <p>Get started by accessing your vendor dashboard where you can:</p>
          <ul>
            <li>Add and manage your venues</li>
            <li>View and manage bookings</li>
            <li>Track your earnings</li>
            <li>Update your profile and settings</li>
          </ul>
          <div class="button-wrapper">
            <a href="${frontendUrl}/vendor/login" class="button">Login to Dashboard</a>
          </div>
          <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
          <p style="margin-top: 30px;">Best regards,<br><strong>The ShubhVenue Team</strong></p>
        </div>
        <div class="footer">
          <p>© 2024 ShubhVenue. All rights reserved.</p>
          <div class="footer-links">
            <a href="${frontendUrl}">Visit Website</a>
            <a href="${frontendUrl}/contact">Contact Us</a>
            <a href="${frontendUrl}/privacy">Privacy Policy</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  const text = templateData?.text;

  try {
    const result = await sendEmail({
      to: vendor.email,
      subject,
      html,
      text,
    });
    
    if (result && result.success) {
      console.log('✅ Vendor approval email sent successfully to:', vendor.email);
    } else {
      console.error('❌ Failed to send vendor approval email:', result?.error);
    }
    
    return result || { success: false, error: 'Unknown error occurred' };
  } catch (error) {
    console.error('❌ Exception in sendVendorApprovalEmail:', error);
    return { success: false, error: error.message || 'Exception occurred while sending email' };
  }
}

/**
 * Send email to vendor when admin rejects
 */
export async function sendVendorRejectionEmail(vendor) {
  console.log('📧 Preparing to send vendor rejection email...');
  console.log('   Vendor Name:', vendor.name);
  console.log('   Vendor Email:', vendor.email);
  
  // Check if vendor was previously approved
  const wasApproved = vendor.vendorStatus === 'approved';
  
  // Try to get template from database
  const templateData = await getTemplateAndReplaceVariables('vendor_rejection', {
    user: {
      name: vendor.name || 'Vendor',
      email: vendor.email || '',
      phone: vendor.phone || ''
    },
    wasApproved: wasApproved ? 'true' : 'false',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5175'
  });
  
  // Use template from database if available, otherwise use default
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5175';
  const subject = templateData?.subject || (wasApproved 
    ? 'Vendor Account Status Update - ShubhVenue'
    : 'Vendor Account Registration Update - ShubhVenue');
    
  const html = templateData?.html || `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1F2937; background-color: #F3F4F6; }
        .email-wrapper { max-width: 600px; margin: 0 auto; background-color: #FFFFFF; }
        .header { background: linear-gradient(135deg, #8F61EF 0%, #F9A826 100%); color: white; padding: 40px 30px; text-align: center; }
        .logo { max-width: 180px; height: auto; margin-bottom: 20px; }
        .header h1 { font-size: 28px; font-weight: 700; margin: 0; letter-spacing: -0.5px; }
        .content { padding: 40px 30px; background-color: #FFFFFF; }
        .content p { margin-bottom: 16px; color: #4B5563; font-size: 16px; }
        .notice-box { background: rgba(239, 68, 68, 0.1); border-left: 4px solid #EF4444; padding: 20px; margin: 30px 0; border-radius: 8px; }
        .notice-box p { margin-bottom: 12px; color: #1F2937; }
        .notice-box strong { color: #EF4444; }
        .button-wrapper { text-align: center; margin: 30px 0; }
        .button { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #8F61EF 0%, #F9A826 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(143, 97, 239, 0.3); }
        .footer { background-color: #F9FAFB; padding: 30px; text-align: center; border-top: 1px solid #E5E7EB; }
        .footer p { color: #6B7280; font-size: 14px; margin-bottom: 8px; }
        .footer-links { margin-top: 16px; }
        .footer-links a { color: #8F61EF; text-decoration: none; margin: 0 12px; font-size: 14px; }
        @media only screen and (max-width: 600px) {
          .header { padding: 30px 20px; }
          .content { padding: 30px 20px; }
          .footer { padding: 20px; }
          .header h1 { font-size: 24px; }
        }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="header">
          <img src="${frontendUrl}/image/venuebook.png" alt="ShubhVenue Logo" class="logo" />
          <h1>Account Status Update</h1>
        </div>
        <div class="content">
          <p>Dear ${vendor.name},</p>
          <div class="notice-box">
            <p><strong>Account Registration Update</strong></p>
            <p>We regret to inform you that your vendor account registration has been reviewed and unfortunately, we are unable to approve it at this time.</p>
          </div>
          <p>If you believe this is an error or would like to discuss this further, please contact our support team. We're here to help and would be happy to assist you.</p>
          <div class="button-wrapper">
            <a href="${frontendUrl}/contact" class="button">Contact Support</a>
          </div>
          <p>Thank you for your interest in ShubhVenue. We appreciate you taking the time to register with us.</p>
          <p style="margin-top: 30px;">Best regards,<br><strong>The ShubhVenue Team</strong></p>
        </div>
        <div class="footer">
          <p>© 2024 ShubhVenue. All rights reserved.</p>
          <div class="footer-links">
            <a href="${frontendUrl}">Visit Website</a>
            <a href="${frontendUrl}/contact">Contact Us</a>
            <a href="${frontendUrl}/privacy">Privacy Policy</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  const text = templateData?.text;

  try {
    const result = await sendEmail({
      to: vendor.email,
      subject,
      html,
      text,
    });
    
    if (result && result.success) {
      console.log('✅ Vendor rejection email sent successfully to:', vendor.email);
    } else {
      console.error('❌ Failed to send vendor rejection email:', result?.error);
    }
    
    return result || { success: false, error: 'Unknown error occurred' };
  } catch (error) {
    console.error('❌ Exception in sendVendorRejectionEmail:', error);
    return { success: false, error: error.message || 'Exception occurred while sending email' };
  }
}

/**
 * Get all admin email addresses
 * Priority: 1. Admin notification email from config, 2. All admin users' emails
 */
export async function getAdminEmails() {
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
 * Send booking confirmation email to customer
 */
export async function sendBookingConfirmationEmail(booking, customerEmail) {
  console.log('📧 Preparing to send booking confirmation email to customer...');
  console.log('   Customer Email:', customerEmail);
  console.log('   Booking ID:', booking._id);
  
  if (!customerEmail) {
    console.log('⚠️  No customer email provided, skipping booking confirmation email');
    return { success: false, error: 'Customer email not provided' };
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5175';
  const bookingDate = booking.date ? new Date(booking.date).toLocaleDateString('en-IN', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }) : 'N/A';
  
  const dateRange = booking.dateFrom && booking.dateTo 
    ? `${new Date(booking.dateFrom).toLocaleDateString('en-IN')} - ${new Date(booking.dateTo).toLocaleDateString('en-IN')}`
    : bookingDate;

  // Try to get template from database
  const templateData = await getTemplateAndReplaceVariables('booking_confirmation', {
    customerName: booking.name || booking.customerId?.name || 'Customer',
    bookingId: booking.customBookingId || booking._id.toString().slice(-6),
    venueName: booking.venueId?.name || 'Venue',
    bookingDate: dateRange,
    guests: booking.guests || 0,
    totalAmount: booking.totalAmount || 0,
    frontendUrl: frontendUrl
  });

  const subject = templateData?.subject || `Booking Confirmation - ${booking.venueId?.name || 'Venue'}`;
  const html = templateData?.html || `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1F2937; background-color: #F3F4F6; }
        .email-wrapper { max-width: 600px; margin: 0 auto; background-color: #FFFFFF; }
        .header { background: linear-gradient(135deg, #8F61EF 0%, #F9A826 100%); color: white; padding: 40px 30px; text-align: center; }
        .logo { max-width: 180px; height: auto; margin-bottom: 20px; }
        .header h1 { font-size: 28px; font-weight: 700; margin: 0; letter-spacing: -0.5px; }
        .content { padding: 40px 30px; background-color: #FFFFFF; }
        .content p { margin-bottom: 16px; color: #4B5563; font-size: 16px; }
        .info-card { background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .info-row { margin: 12px 0; padding: 10px 0; border-bottom: 1px solid #E5E7EB; }
        .info-row:last-child { border-bottom: none; }
        .label { font-weight: 600; color: #8F61EF; display: inline-block; min-width: 140px; }
        .value { color: #1F2937; }
        .notice-box { background: linear-gradient(135deg, rgba(143, 97, 239, 0.1) 0%, rgba(249, 168, 38, 0.1) 100%); border-left: 4px solid #F9A826; padding: 20px; margin: 30px 0; border-radius: 8px; }
        .notice-box p { margin-bottom: 12px; color: #1F2937; }
        .footer { background-color: #F9FAFB; padding: 30px; text-align: center; border-top: 1px solid #E5E7EB; }
        .footer p { color: #6B7280; font-size: 14px; margin-bottom: 8px; }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="header">
          <img src="${frontendUrl}/image/venuebook.png" alt="ShubhVenue Logo" class="logo" />
          <h1>✅ Booking Confirmed!</h1>
        </div>
        <div class="content">
          <p>Dear ${booking.name || booking.customerId?.name || 'Customer'},</p>
          <p>Thank you for your booking! Your booking has been received and is pending admin approval.</p>
          <div class="info-card">
            <div class="info-row">
              <span class="label">Booking ID:</span>
              <span class="value">${booking.customBookingId || booking._id.toString().slice(-6)}</span>
            </div>
            <div class="info-row">
              <span class="label">Venue:</span>
              <span class="value">${booking.venueId?.name || 'Venue'}</span>
            </div>
            <div class="info-row">
              <span class="label">Date:</span>
              <span class="value">${dateRange}</span>
            </div>
            <div class="info-row">
              <span class="label">Guests:</span>
              <span class="value">${booking.guests || 0}</span>
            </div>
            <div class="info-row">
              <span class="label">Total Amount:</span>
              <span class="value">₹${booking.totalAmount || 0}</span>
            </div>
          </div>
          <div class="notice-box">
            <p><strong>⏰ Next Steps:</strong></p>
            <p>Your booking is currently pending admin approval. You will receive a confirmation email once it's approved.</p>
          </div>
          <p style="margin-top: 30px;">Best regards,<br><strong>The ShubhVenue Team</strong></p>
        </div>
        <div class="footer">
          <p>© 2024 ShubhVenue. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  const text = templateData?.text;

  try {
    const result = await sendEmail({
      to: customerEmail,
      subject,
      html,
      text,
    });
    
    if (result && result.success) {
      console.log('✅ Booking confirmation email sent successfully to customer:', customerEmail);
    } else {
      console.error('❌ Failed to send booking confirmation email:', result?.error);
    }
    
    return result || { success: false, error: 'Unknown error occurred' };
  } catch (error) {
    console.error('❌ Exception in sendBookingConfirmationEmail:', error);
    return { success: false, error: error.message || 'Exception occurred while sending email' };
  }
}

/**
 * Send booking notification email to admin
 */
export async function sendBookingNotificationToAdmin(booking) {
  console.log('📧 Preparing to send booking notification to admin...');
  
  const adminEmails = await getAdminEmails();
  
  if (adminEmails.length === 0) {
    console.log('No admin emails found, skipping booking notification');
    return { success: false, error: 'No admin emails found' };
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5175';
  const bookingDate = booking.date ? new Date(booking.date).toLocaleDateString('en-IN', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }) : 'N/A';
  
  const dateRange = booking.dateFrom && booking.dateTo 
    ? `${new Date(booking.dateFrom).toLocaleDateString('en-IN')} - ${new Date(booking.dateTo).toLocaleDateString('en-IN')}`
    : bookingDate;

  const subject = `New Booking Received - ${booking.venueId?.name || 'Venue'}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1F2937; background-color: #F3F4F6; }
        .email-wrapper { max-width: 600px; margin: 0 auto; background-color: #FFFFFF; }
        .header { background: linear-gradient(135deg, #8F61EF 0%, #F9A826 100%); color: white; padding: 40px 30px; text-align: center; }
        .logo { max-width: 180px; height: auto; margin-bottom: 20px; }
        .header h1 { font-size: 28px; font-weight: 700; margin: 0; letter-spacing: -0.5px; }
        .content { padding: 40px 30px; background-color: #FFFFFF; }
        .content p { margin-bottom: 16px; color: #4B5563; font-size: 16px; }
        .info-card { background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .info-row { margin: 12px 0; padding: 10px 0; border-bottom: 1px solid #E5E7EB; }
        .info-row:last-child { border-bottom: none; }
        .label { font-weight: 600; color: #8F61EF; display: inline-block; min-width: 140px; }
        .value { color: #1F2937; }
        .notice-box { background: linear-gradient(135deg, rgba(143, 97, 239, 0.1) 0%, rgba(249, 168, 38, 0.1) 100%); border-left: 4px solid #F9A826; padding: 20px; margin: 30px 0; border-radius: 8px; }
        .notice-box p { margin-bottom: 12px; color: #1F2937; }
        .button-wrapper { text-align: center; margin: 30px 0; }
        .button { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #8F61EF 0%, #F9A826 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(143, 97, 239, 0.3); }
        .footer { background-color: #F9FAFB; padding: 30px; text-align: center; border-top: 1px solid #E5E7EB; }
        .footer p { color: #6B7280; font-size: 14px; margin-bottom: 8px; }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="header">
          <img src="${frontendUrl}/image/venuebook.png" alt="ShubhVenue Logo" class="logo" />
          <h1>New Booking Received</h1>
        </div>
        <div class="content">
          <p>A new booking has been received and requires your approval:</p>
          <div class="info-card">
            <div class="info-row">
              <span class="label">Booking ID:</span>
              <span class="value">${booking.customBookingId || booking._id.toString().slice(-6)}</span>
            </div>
            <div class="info-row">
              <span class="label">Customer:</span>
              <span class="value">${booking.name || booking.customerId?.name || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">Email:</span>
              <span class="value">${booking.customerId?.email || booking.email || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">Phone:</span>
              <span class="value">${booking.phone || booking.customerId?.phone || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">Venue:</span>
              <span class="value">${booking.venueId?.name || 'Venue'}</span>
            </div>
            <div class="info-row">
              <span class="label">Date:</span>
              <span class="value">${dateRange}</span>
            </div>
            <div class="info-row">
              <span class="label">Guests:</span>
              <span class="value">${booking.guests || 0}</span>
            </div>
            <div class="info-row">
              <span class="label">Total Amount:</span>
              <span class="value">₹${booking.totalAmount || 0}</span>
            </div>
            <div class="info-row">
              <span class="label">Payment Status:</span>
              <span class="value">${booking.paymentStatus || 'pending'}</span>
            </div>
          </div>
          <div class="notice-box">
            <p><strong>⏰ Action Required:</strong></p>
            <p>Please review and approve this booking from the admin dashboard.</p>
          </div>
          <div class="button-wrapper">
            <a href="${frontendUrl}/admin/bookings" class="button">Review Booking</a>
          </div>
        </div>
        <div class="footer">
          <p>© 2024 ShubhVenue. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const result = await sendEmail({
      to: adminEmails,
      subject,
      html,
    });
    
    if (result && result.success) {
      console.log('✅ Booking notification sent to admin');
    } else {
      console.error('❌ Failed to send admin notification:', result?.error);
    }
    
    return result || { success: false, error: 'Unknown error occurred' };
  } catch (error) {
    console.error('❌ Exception in sendBookingNotificationToAdmin:', error);
    return { success: false, error: error.message || 'Exception occurred while sending email' };
  }
}

/**
 * Send booking approval notification to vendor
 */
export async function sendBookingApprovalToVendor(booking, vendorEmail) {
  console.log('📧 Preparing to send booking approval notification to vendor...');
  console.log('   Vendor Email:', vendorEmail);
  console.log('   Booking ID:', booking._id);
  
  if (!vendorEmail) {
    console.log('⚠️  No vendor email provided, skipping vendor notification');
    return { success: false, error: 'Vendor email not provided' };
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5175';
  const bookingDate = booking.date ? new Date(booking.date).toLocaleDateString('en-IN', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }) : 'N/A';
  
  const dateRange = booking.dateFrom && booking.dateTo 
    ? `${new Date(booking.dateFrom).toLocaleDateString('en-IN')} - ${new Date(booking.dateTo).toLocaleDateString('en-IN')}`
    : bookingDate;

  const subject = `New Booking Approved - ${booking.venueId?.name || 'Venue'}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1F2937; background-color: #F3F4F6; }
        .email-wrapper { max-width: 600px; margin: 0 auto; background-color: #FFFFFF; }
        .header { background: linear-gradient(135deg, #8F61EF 0%, #F9A826 100%); color: white; padding: 40px 30px; text-align: center; }
        .logo { max-width: 180px; height: auto; margin-bottom: 20px; }
        .header h1 { font-size: 28px; font-weight: 700; margin: 0; letter-spacing: -0.5px; }
        .content { padding: 40px 30px; background-color: #FFFFFF; }
        .content p { margin-bottom: 16px; color: #4B5563; font-size: 16px; }
        .info-card { background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .info-row { margin: 12px 0; padding: 10px 0; border-bottom: 1px solid #E5E7EB; }
        .info-row:last-child { border-bottom: none; }
        .label { font-weight: 600; color: #8F61EF; display: inline-block; min-width: 140px; }
        .value { color: #1F2937; }
        .success-box { background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(143, 97, 239, 0.1) 100%); border-left: 4px solid #10B981; padding: 20px; margin: 30px 0; border-radius: 8px; }
        .success-box p { margin-bottom: 12px; color: #1F2937; }
        .button-wrapper { text-align: center; margin: 30px 0; }
        .button { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #8F61EF 0%, #F9A826 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(143, 97, 239, 0.3); }
        .footer { background-color: #F9FAFB; padding: 30px; text-align: center; border-top: 1px solid #E5E7EB; }
        .footer p { color: #6B7280; font-size: 14px; margin-bottom: 8px; }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="header">
          <img src="${frontendUrl}/image/venuebook.png" alt="ShubhVenue Logo" class="logo" />
          <h1>✅ Booking Approved</h1>
        </div>
        <div class="content">
          <p>Dear Vendor,</p>
          <div class="success-box">
            <p><strong>New Booking Approved!</strong></p>
            <p>A booking for your venue has been approved by admin and is now visible in your dashboard.</p>
          </div>
          <div class="info-card">
            <div class="info-row">
              <span class="label">Booking ID:</span>
              <span class="value">${booking.customBookingId || booking._id.toString().slice(-6)}</span>
            </div>
            <div class="info-row">
              <span class="label">Venue:</span>
              <span class="value">${booking.venueId?.name || 'Venue'}</span>
            </div>
            <div class="info-row">
              <span class="label">Customer:</span>
              <span class="value">${booking.name || booking.customerId?.name || 'Customer'}</span>
            </div>
            <div class="info-row">
              <span class="label">Phone:</span>
              <span class="value">${booking.phone || booking.customerId?.phone || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">Date:</span>
              <span class="value">${dateRange}</span>
            </div>
            <div class="info-row">
              <span class="label">Guests:</span>
              <span class="value">${booking.guests || 0}</span>
            </div>
            <div class="info-row">
              <span class="label">Total Amount:</span>
              <span class="value">₹${booking.totalAmount || 0}</span>
            </div>
          </div>
          <div class="button-wrapper">
            <a href="${frontendUrl}/vendor/bookings" class="button">View Booking Details</a>
          </div>
          <p style="margin-top: 30px;">Best regards,<br><strong>The ShubhVenue Team</strong></p>
        </div>
        <div class="footer">
          <p>© 2024 ShubhVenue. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const result = await sendEmail({
      to: vendorEmail,
      subject,
      html,
    });
    
    if (result && result.success) {
      console.log('✅ Booking approval notification sent successfully to vendor:', vendorEmail);
    } else {
      console.error('❌ Failed to send vendor notification:', result?.error);
    }
    
    return result || { success: false, error: 'Unknown error occurred' };
  } catch (error) {
    console.error('❌ Exception in sendBookingApprovalToVendor:', error);
    return { success: false, error: error.message || 'Exception occurred while sending email' };
  }
}

/**
 * Send booking confirmation email when vendor approves/confirms booking
 */
export async function sendVendorBookingConfirmationEmail(booking, customerEmail) {
  console.log('📧 Preparing to send vendor booking confirmation email to customer...');
  console.log('   Customer Email:', customerEmail);
  console.log('   Booking ID:', booking._id);
  
  if (!customerEmail) {
    console.log('⚠️  No customer email provided, skipping vendor confirmation email');
    return { success: false, error: 'Customer email not provided' };
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5175';
  const bookingDate = booking.date ? new Date(booking.date).toLocaleDateString('en-IN', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }) : 'N/A';
  
  const dateRange = booking.dateFrom && booking.dateTo 
    ? `${new Date(booking.dateFrom).toLocaleDateString('en-IN')} - ${new Date(booking.dateTo).toLocaleDateString('en-IN')}`
    : bookingDate;

  const subject = `Booking Confirmed by Venue - ${booking.venueId?.name || 'Venue'}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1F2937; background-color: #F3F4F6; }
        .email-wrapper { max-width: 600px; margin: 0 auto; background-color: #FFFFFF; }
        .header { background: linear-gradient(135deg, #8F61EF 0%, #F9A826 100%); color: white; padding: 40px 30px; text-align: center; }
        .logo { max-width: 180px; height: auto; margin-bottom: 20px; }
        .header h1 { font-size: 28px; font-weight: 700; margin: 0; letter-spacing: -0.5px; }
        .content { padding: 40px 30px; background-color: #FFFFFF; }
        .content p { margin-bottom: 16px; color: #4B5563; font-size: 16px; }
        .info-card { background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .info-row { margin: 12px 0; padding: 10px 0; border-bottom: 1px solid #E5E7EB; }
        .info-row:last-child { border-bottom: none; }
        .label { font-weight: 600; color: #8F61EF; display: inline-block; min-width: 140px; }
        .value { color: #1F2937; }
        .success-box { background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(143, 97, 239, 0.1) 100%); border-left: 4px solid #10B981; padding: 20px; margin: 30px 0; border-radius: 8px; }
        .success-box h2 { color: #10B981; font-size: 24px; margin-bottom: 12px; }
        .success-box p { color: #1F2937; margin-bottom: 8px; }
        .footer { background-color: #F9FAFB; padding: 30px; text-align: center; border-top: 1px solid #E5E7EB; }
        .footer p { color: #6B7280; font-size: 14px; margin-bottom: 8px; }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="header">
          <img src="${frontendUrl}/image/venuebook.png" alt="ShubhVenue Logo" class="logo" />
          <h1>🎉 Booking Confirmed!</h1>
        </div>
        <div class="content">
          <p>Dear ${booking.name || booking.customerId?.name || 'Customer'},</p>
          <div class="success-box">
            <h2>✅ Great News!</h2>
            <p>Your booking has been confirmed by the venue!</p>
            <p>The venue has approved your booking request. Your event is now confirmed.</p>
          </div>
          <div class="info-card">
            <div class="info-row">
              <span class="label">Booking ID:</span>
              <span class="value">${booking.customBookingId || booking._id.toString().slice(-6)}</span>
            </div>
            <div class="info-row">
              <span class="label">Venue:</span>
              <span class="value">${booking.venueId?.name || 'Venue'}</span>
            </div>
            <div class="info-row">
              <span class="label">Date:</span>
              <span class="value">${dateRange}</span>
            </div>
            <div class="info-row">
              <span class="label">Guests:</span>
              <span class="value">${booking.guests || 0}</span>
            </div>
            <div class="info-row">
              <span class="label">Total Amount:</span>
              <span class="value">₹${booking.totalAmount || 0}</span>
            </div>
            <div class="info-row">
              <span class="label">Status:</span>
              <span class="value" style="color: #10B981; font-weight: 600;">Confirmed</span>
            </div>
          </div>
          <p style="margin-top: 30px;">Your booking is now confirmed. The venue will contact you with further details about your event.</p>
          <p style="margin-top: 30px;">Best regards,<br><strong>The ShubhVenue Team</strong></p>
        </div>
        <div class="footer">
          <p>© 2024 ShubhVenue. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const result = await sendEmail({
      to: customerEmail,
      subject,
      html,
    });
    
    if (result && result.success) {
      console.log('✅ Vendor booking confirmation email sent successfully to customer:', customerEmail);
    } else {
      console.error('❌ Failed to send vendor confirmation email:', result?.error);
    }
    
    return result || { success: false, error: 'Unknown error occurred' };
  } catch (error) {
    console.error('❌ Exception in sendVendorBookingConfirmationEmail:', error);
    return { success: false, error: error.message || 'Exception occurred while sending email' };
  }
}

/**
 * Send booking cancellation email
 */
export async function sendBookingCancellationEmail(booking, recipientEmail, recipientType = 'customer') {
  console.log(`📧 Preparing to send booking cancellation email to ${recipientType}...`);
  console.log('   Recipient Email:', recipientEmail);
  console.log('   Booking ID:', booking._id);
  
  if (!recipientEmail) {
    console.log(`⚠️  No ${recipientType} email provided, skipping cancellation email`);
    return { success: false, error: `${recipientType} email not provided` };
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5175';
  const bookingDate = booking.date ? new Date(booking.date).toLocaleDateString('en-IN', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }) : 'N/A';
  
  const dateRange = booking.dateFrom && booking.dateTo 
    ? `${new Date(booking.dateFrom).toLocaleDateString('en-IN')} - ${new Date(booking.dateTo).toLocaleDateString('en-IN')}`
    : bookingDate;

  // Try to get template from database
  const templateData = await getTemplateAndReplaceVariables('booking_cancellation', {
    customerName: booking.name || booking.customerId?.name || 'Customer',
    bookingId: booking.customBookingId || booking._id.toString().slice(-6),
    venueName: booking.venueId?.name || 'Venue',
    bookingDate: dateRange,
    frontendUrl: frontendUrl
  });

  const subject = templateData?.subject || `Booking Cancelled - ${booking.venueId?.name || 'Venue'}`;
  const html = templateData?.html || `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1F2937; background-color: #F3F4F6; }
        .email-wrapper { max-width: 600px; margin: 0 auto; background-color: #FFFFFF; }
        .header { background: linear-gradient(135deg, #8F61EF 0%, #F9A826 100%); color: white; padding: 40px 30px; text-align: center; }
        .logo { max-width: 180px; height: auto; margin-bottom: 20px; }
        .header h1 { font-size: 28px; font-weight: 700; margin: 0; letter-spacing: -0.5px; }
        .content { padding: 40px 30px; background-color: #FFFFFF; }
        .content p { margin-bottom: 16px; color: #4B5563; font-size: 16px; }
        .info-card { background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .info-row { margin: 12px 0; padding: 10px 0; border-bottom: 1px solid #E5E7EB; }
        .info-row:last-child { border-bottom: none; }
        .label { font-weight: 600; color: #8F61EF; display: inline-block; min-width: 140px; }
        .value { color: #1F2937; }
        .notice-box { background: rgba(239, 68, 68, 0.1); border-left: 4px solid #EF4444; padding: 20px; margin: 30px 0; border-radius: 8px; }
        .notice-box p { margin-bottom: 12px; color: #1F2937; }
        .footer { background-color: #F9FAFB; padding: 30px; text-align: center; border-top: 1px solid #E5E7EB; }
        .footer p { color: #6B7280; font-size: 14px; margin-bottom: 8px; }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="header">
          <img src="${frontendUrl}/image/venuebook.png" alt="ShubhVenue Logo" class="logo" />
          <h1>Booking Cancelled</h1>
        </div>
        <div class="content">
          <p>Dear ${recipientType === 'customer' ? (booking.name || booking.customerId?.name || 'Customer') : 'Vendor'},</p>
          <div class="notice-box">
            <p><strong>Booking Cancellation Notice</strong></p>
            <p>The following booking has been cancelled:</p>
          </div>
          <div class="info-card">
            <div class="info-row">
              <span class="label">Booking ID:</span>
              <span class="value">${booking.customBookingId || booking._id.toString().slice(-6)}</span>
            </div>
            <div class="info-row">
              <span class="label">Venue:</span>
              <span class="value">${booking.venueId?.name || 'Venue'}</span>
            </div>
            <div class="info-row">
              <span class="label">Date:</span>
              <span class="value">${dateRange}</span>
            </div>
            <div class="info-row">
              <span class="label">Customer:</span>
              <span class="value">${booking.name || booking.customerId?.name || 'Customer'}</span>
            </div>
          </div>
          <p style="margin-top: 30px;">Best regards,<br><strong>The ShubhVenue Team</strong></p>
        </div>
        <div class="footer">
          <p>© 2024 ShubhVenue. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  const text = templateData?.text;

  try {
    const result = await sendEmail({
      to: recipientEmail,
      subject,
      html,
      text,
    });
    
    if (result && result.success) {
      console.log(`✅ Booking cancellation email sent successfully to ${recipientType}:`, recipientEmail);
    } else {
      console.error(`❌ Failed to send cancellation email to ${recipientType}:`, result?.error);
    }
    
    return result || { success: false, error: 'Unknown error occurred' };
  } catch (error) {
    console.error(`❌ Exception in sendBookingCancellationEmail:`, error);
    return { success: false, error: error.message || 'Exception occurred while sending email' };
  }
}

/**
 * Send lead notification email to admin
 */
export async function sendLeadNotificationToAdmin(lead) {
  console.log('📧 Preparing to send lead notification to admin...');
  
  const adminEmails = await getAdminEmails();
  
  if (adminEmails.length === 0) {
    console.log('No admin emails found, skipping lead notification');
    return { success: false, error: 'No admin emails found' };
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5175';
  const leadDate = lead.date ? new Date(lead.date).toLocaleDateString('en-IN', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }) : 'N/A';
  
  const dateRange = lead.dateFrom && lead.dateTo 
    ? `${new Date(lead.dateFrom).toLocaleDateString('en-IN')} - ${new Date(lead.dateTo).toLocaleDateString('en-IN')}`
    : leadDate;

  const subject = `New Lead Received - ${lead.venueId?.name || 'Venue'}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1F2937; background-color: #F3F4F6; }
        .email-wrapper { max-width: 600px; margin: 0 auto; background-color: #FFFFFF; }
        .header { background: linear-gradient(135deg, #8F61EF 0%, #F9A826 100%); color: white; padding: 40px 30px; text-align: center; }
        .logo { max-width: 180px; height: auto; margin-bottom: 20px; }
        .header h1 { font-size: 28px; font-weight: 700; margin: 0; letter-spacing: -0.5px; }
        .content { padding: 40px 30px; background-color: #FFFFFF; }
        .content p { margin-bottom: 16px; color: #4B5563; font-size: 16px; }
        .info-card { background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .info-row { margin: 12px 0; padding: 10px 0; border-bottom: 1px solid #E5E7EB; }
        .info-row:last-child { border-bottom: none; }
        .label { font-weight: 600; color: #8F61EF; display: inline-block; min-width: 140px; }
        .value { color: #1F2937; }
        .notice-box { background: linear-gradient(135deg, rgba(143, 97, 239, 0.1) 0%, rgba(249, 168, 38, 0.1) 100%); border-left: 4px solid #F9A826; padding: 20px; margin: 30px 0; border-radius: 8px; }
        .notice-box p { margin-bottom: 12px; color: #1F2937; }
        .button-wrapper { text-align: center; margin: 30px 0; }
        .button { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #8F61EF 0%, #F9A826 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(143, 97, 239, 0.3); }
        .footer { background-color: #F9FAFB; padding: 30px; text-align: center; border-top: 1px solid #E5E7EB; }
        .footer p { color: #6B7280; font-size: 14px; margin-bottom: 8px; }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="header">
          <img src="${frontendUrl}/image/venuebook.png" alt="ShubhVenue Logo" class="logo" />
          <h1>New Lead Received</h1>
        </div>
        <div class="content">
          <p>A new lead has been received:</p>
          <div class="info-card">
            <div class="info-row">
              <span class="label">Customer:</span>
              <span class="value">${lead.name || lead.customerId?.name || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">Email:</span>
              <span class="value">${lead.email || lead.customerId?.email || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">Phone:</span>
              <span class="value">${lead.phone || lead.customerId?.phone || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">Venue:</span>
              <span class="value">${lead.venueId?.name || 'Venue'}</span>
            </div>
            <div class="info-row">
              <span class="label">Date:</span>
              <span class="value">${dateRange}</span>
            </div>
            <div class="info-row">
              <span class="label">Guests:</span>
              <span class="value">${lead.guests || 0}</span>
            </div>
            <div class="info-row">
              <span class="label">Total Amount:</span>
              <span class="value">₹${lead.totalAmount || 0}</span>
            </div>
            <div class="info-row">
              <span class="label">Status:</span>
              <span class="value">${lead.status || 'new'}</span>
            </div>
          </div>
          <div class="notice-box">
            <p><strong>⏰ Action Required:</strong></p>
            <p>This is a lead inquiry. Please contact the customer to convert it into a booking.</p>
          </div>
          <div class="button-wrapper">
            <a href="${frontendUrl}/admin/leads" class="button">View Lead Details</a>
          </div>
        </div>
        <div class="footer">
          <p>© 2024 ShubhVenue. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const result = await sendEmail({
      to: adminEmails,
      subject,
      html,
    });
    
    if (result && result.success) {
      console.log('✅ Lead notification sent to admin');
    } else {
      console.error('❌ Failed to send lead notification:', result?.error);
    }
    
    return result || { success: false, error: 'Unknown error occurred' };
  } catch (error) {
    console.error('❌ Exception in sendLeadNotificationToAdmin:', error);
    return { success: false, error: error.message || 'Exception occurred while sending email' };
  }
}

/**
 * Send review notification email to vendor when customer reviews
 */
export async function sendReviewNotificationToVendor(review, vendorEmail) {
  console.log('📧 Preparing to send review notification to vendor...');
  console.log('   Vendor Email:', vendorEmail);
  console.log('   Review ID:', review._id);
  
  if (!vendorEmail) {
    console.log('⚠️  No vendor email provided, skipping review notification');
    return { success: false, error: 'Vendor email not provided' };
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5175';
  const reviewDate = review.createdAt ? new Date(review.createdAt).toLocaleDateString('en-IN', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }) : new Date().toLocaleDateString('en-IN');

  const subject = `New Review Received - ${review.venueId?.name || 'Venue'}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1F2937; background-color: #F3F4F6; }
        .email-wrapper { max-width: 600px; margin: 0 auto; background-color: #FFFFFF; }
        .header { background: linear-gradient(135deg, #8F61EF 0%, #F9A826 100%); color: white; padding: 40px 30px; text-align: center; }
        .logo { max-width: 180px; height: auto; margin-bottom: 20px; }
        .header h1 { font-size: 28px; font-weight: 700; margin: 0; letter-spacing: -0.5px; }
        .content { padding: 40px 30px; background-color: #FFFFFF; }
        .content p { margin-bottom: 16px; color: #4B5563; font-size: 16px; }
        .info-card { background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .info-row { margin: 12px 0; padding: 10px 0; border-bottom: 1px solid #E5E7EB; }
        .info-row:last-child { border-bottom: none; }
        .label { font-weight: 600; color: #8F61EF; display: inline-block; min-width: 140px; }
        .value { color: #1F2937; }
        .rating-stars { color: #F9A826; font-size: 20px; }
        .review-comment { background-color: #F9FAFB; border-left: 4px solid #8F61EF; padding: 15px; margin: 20px 0; border-radius: 4px; font-style: italic; color: #4B5563; }
        .button-wrapper { text-align: center; margin: 30px 0; }
        .button { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #8F61EF 0%, #F9A826 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(143, 97, 239, 0.3); }
        .footer { background-color: #F9FAFB; padding: 30px; text-align: center; border-top: 1px solid #E5E7EB; }
        .footer p { color: #6B7280; font-size: 14px; margin-bottom: 8px; }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="header">
          <img src="${frontendUrl}/image/venuebook.png" alt="ShubhVenue Logo" class="logo" />
          <h1>New Review Received</h1>
        </div>
        <div class="content">
          <p>Dear Vendor,</p>
          <p>A customer has left a review for your venue:</p>
          <div class="info-card">
            <div class="info-row">
              <span class="label">Venue:</span>
              <span class="value">${review.venueId?.name || 'Venue'}</span>
            </div>
            <div class="info-row">
              <span class="label">Customer:</span>
              <span class="value">${review.userId?.name || 'Customer'}</span>
            </div>
            <div class="info-row">
              <span class="label">Rating:</span>
              <span class="value">
                <span class="rating-stars">${'★'.repeat(review.rating || 0)}${'☆'.repeat(5 - (review.rating || 0))}</span>
                (${review.rating || 0}/5)
              </span>
            </div>
            <div class="info-row">
              <span class="label">Date:</span>
              <span class="value">${reviewDate}</span>
            </div>
          </div>
          ${review.comment ? `
          <div class="review-comment">
            <strong>Review Comment:</strong><br>
            "${review.comment}"
          </div>
          ` : ''}
          <div class="button-wrapper">
            <a href="${frontendUrl}/vendor/reviews" class="button">View & Reply to Review</a>
          </div>
          <p style="margin-top: 30px;">You can reply to this review from your vendor dashboard.</p>
          <p style="margin-top: 30px;">Best regards,<br><strong>The ShubhVenue Team</strong></p>
        </div>
        <div class="footer">
          <p>© 2024 ShubhVenue. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const result = await sendEmail({
      to: vendorEmail,
      subject,
      html,
    });
    
    if (result && result.success) {
      console.log('✅ Review notification sent successfully to vendor:', vendorEmail);
    } else {
      console.error('❌ Failed to send review notification:', result?.error);
    }
    
    return result || { success: false, error: 'Unknown error occurred' };
  } catch (error) {
    console.error('❌ Exception in sendReviewNotificationToVendor:', error);
    return { success: false, error: error.message || 'Exception occurred while sending email' };
  }
}

/**
 * Send review reply notification email to customer when vendor replies
 */
export async function sendReviewReplyNotificationToCustomer(review, customerEmail) {
  console.log('📧 Preparing to send review reply notification to customer...');
  console.log('   Customer Email:', customerEmail);
  console.log('   Review ID:', review._id);
  
  if (!customerEmail) {
    console.log('⚠️  No customer email provided, skipping review reply notification');
    return { success: false, error: 'Customer email not provided' };
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5175';
  const replyDate = review.reply?.repliedAt ? new Date(review.reply.repliedAt).toLocaleDateString('en-IN', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }) : new Date().toLocaleDateString('en-IN');

  const subject = `Venue Replied to Your Review - ${review.venueId?.name || 'Venue'}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1F2937; background-color: #F3F4F6; }
        .email-wrapper { max-width: 600px; margin: 0 auto; background-color: #FFFFFF; }
        .header { background: linear-gradient(135deg, #8F61EF 0%, #F9A826 100%); color: white; padding: 40px 30px; text-align: center; }
        .logo { max-width: 180px; height: auto; margin-bottom: 20px; }
        .header h1 { font-size: 28px; font-weight: 700; margin: 0; letter-spacing: -0.5px; }
        .content { padding: 40px 30px; background-color: #FFFFFF; }
        .content p { margin-bottom: 16px; color: #4B5563; font-size: 16px; }
        .info-card { background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .info-row { margin: 12px 0; padding: 10px 0; border-bottom: 1px solid #E5E7EB; }
        .info-row:last-child { border-bottom: none; }
        .label { font-weight: 600; color: #8F61EF; display: inline-block; min-width: 140px; }
        .value { color: #1F2937; }
        .review-section { margin: 20px 0; }
        .review-box { background-color: #F9FAFB; border-left: 4px solid #8F61EF; padding: 15px; margin: 15px 0; border-radius: 4px; }
        .reply-box { background-color: #ECFDF5; border-left: 4px solid #10B981; padding: 15px; margin: 15px 0; border-radius: 4px; }
        .reply-box strong { color: #10B981; }
        .button-wrapper { text-align: center; margin: 30px 0; }
        .button { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #8F61EF 0%, #F9A826 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(143, 97, 239, 0.3); }
        .footer { background-color: #F9FAFB; padding: 30px; text-align: center; border-top: 1px solid #E5E7EB; }
        .footer p { color: #6B7280; font-size: 14px; margin-bottom: 8px; }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="header">
          <img src="${frontendUrl}/image/venuebook.png" alt="ShubhVenue Logo" class="logo" />
          <h1>Venue Replied to Your Review</h1>
        </div>
        <div class="content">
          <p>Dear ${review.userId?.name || 'Customer'},</p>
          <p>The venue has replied to your review:</p>
          <div class="info-card">
            <div class="info-row">
              <span class="label">Venue:</span>
              <span class="value">${review.venueId?.name || 'Venue'}</span>
            </div>
            <div class="info-row">
              <span class="label">Replied By:</span>
              <span class="value">${review.reply?.repliedBy?.name || 'Venue Owner'}</span>
            </div>
            <div class="info-row">
              <span class="label">Reply Date:</span>
              <span class="value">${replyDate}</span>
            </div>
          </div>
          <div class="review-section">
            <div class="review-box">
              <strong>Your Review:</strong><br>
              <span class="rating-stars" style="color: #F9A826;">${'★'.repeat(review.rating || 0)}${'☆'.repeat(5 - (review.rating || 0))}</span>
              ${review.comment ? `<br><br>"${review.comment}"` : ''}
            </div>
            <div class="reply-box">
              <strong>Venue Reply:</strong><br><br>
              "${review.reply?.message || ''}"
            </div>
          </div>
          <div class="button-wrapper">
            <a href="${frontendUrl}/venue/${review.venueId?.slug || review.venueId?._id}" class="button">View Review & Reply</a>
          </div>
          <p style="margin-top: 30px;">Best regards,<br><strong>The ShubhVenue Team</strong></p>
        </div>
        <div class="footer">
          <p>© 2024 ShubhVenue. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const result = await sendEmail({
      to: customerEmail,
      subject,
      html,
    });
    
    if (result && result.success) {
      console.log('✅ Review reply notification sent successfully to customer:', customerEmail);
    } else {
      console.error('❌ Failed to send review reply notification:', result?.error);
    }
    
    return result || { success: false, error: 'Unknown error occurred' };
  } catch (error) {
    console.error('❌ Exception in sendReviewReplyNotificationToCustomer:', error);
    return { success: false, error: error.message || 'Exception occurred while sending email' };
  }
}

/**
 * Send verification request confirmation email to vendor
 */
export async function sendVerificationRequestConfirmationToVendor(vendor, subscription) {
  console.log('📧 Preparing to send verification request confirmation to vendor...');
  console.log('   Vendor Email:', vendor.email);
  console.log('   Subscription ID:', subscription._id);
  
  if (!vendor.email) {
    console.log('⚠️  No vendor email provided, skipping verification request confirmation');
    return { success: false, error: 'Vendor email not provided' };
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5175';
  const requestDate = subscription.verificationRequestDetails?.submittedAt 
    ? new Date(subscription.verificationRequestDetails.submittedAt).toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : new Date().toLocaleDateString('en-IN');

  const subject = `Verification Request Submitted - ${vendor.name}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1F2937; background-color: #F3F4F6; }
        .email-wrapper { max-width: 600px; margin: 0 auto; background-color: #FFFFFF; }
        .header { background: linear-gradient(135deg, #8F61EF 0%, #F9A826 100%); color: white; padding: 40px 30px; text-align: center; }
        .logo { max-width: 180px; height: auto; margin-bottom: 20px; }
        .header h1 { font-size: 28px; font-weight: 700; margin: 0; letter-spacing: -0.5px; }
        .content { padding: 40px 30px; background-color: #FFFFFF; }
        .content p { margin-bottom: 16px; color: #4B5563; font-size: 16px; }
        .info-card { background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .info-row { margin: 12px 0; padding: 10px 0; border-bottom: 1px solid #E5E7EB; }
        .info-row:last-child { border-bottom: none; }
        .label { font-weight: 600; color: #8F61EF; display: inline-block; min-width: 180px; }
        .value { color: #1F2937; }
        .notice-box { background: linear-gradient(135deg, rgba(143, 97, 239, 0.1) 0%, rgba(249, 168, 38, 0.1) 100%); border-left: 4px solid #F9A826; padding: 20px; margin: 30px 0; border-radius: 8px; }
        .notice-box p { margin-bottom: 12px; color: #1F2937; }
        .notice-box strong { color: #8F61EF; }
        .footer { background-color: #F9FAFB; padding: 30px; text-align: center; border-top: 1px solid #E5E7EB; }
        .footer p { color: #6B7280; font-size: 14px; margin-bottom: 8px; }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="header">
          <img src="${frontendUrl}/image/venuebook.png" alt="ShubhVenue Logo" class="logo" />
          <h1>Verification Request Submitted</h1>
        </div>
        <div class="content">
          <p>Dear ${vendor.name},</p>
          <p>Your verification request has been successfully submitted!</p>
          <div class="info-card">
            <div class="info-row">
              <span class="label">Business Name:</span>
              <span class="value">${subscription.verificationRequestDetails?.businessName || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">Plan:</span>
              <span class="value">${subscription.planId?.name || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">Request Date:</span>
              <span class="value">${requestDate}</span>
            </div>
            <div class="info-row">
              <span class="label">Status:</span>
              <span class="value" style="color: #F9A826; font-weight: 600;">Pending Verification</span>
            </div>
          </div>
          <div class="notice-box">
            <p><strong>⏰ What's Next?</strong></p>
            <p>Our admin team will review your verification request within <strong>24-48 hours</strong>.</p>
            <p>You will receive an email notification once your verification is approved.</p>
            <p>Once approved, your venues will be verified and visible to customers.</p>
          </div>
          <p style="margin-top: 30px;">Best regards,<br><strong>The ShubhVenue Team</strong></p>
        </div>
        <div class="footer">
          <p>© 2024 ShubhVenue. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const result = await sendEmail({
      to: vendor.email,
      subject,
      html,
    });
    
    if (result && result.success) {
      console.log('✅ Verification request confirmation sent successfully to vendor:', vendor.email);
    } else {
      console.error('❌ Failed to send verification request confirmation:', result?.error);
    }
    
    return result || { success: false, error: 'Unknown error occurred' };
  } catch (error) {
    console.error('❌ Exception in sendVerificationRequestConfirmationToVendor:', error);
    return { success: false, error: error.message || 'Exception occurred while sending email' };
  }
}

/**
 * Send verification request notification email to admin
 */
export async function sendVerificationRequestNotificationToAdmin(vendor, subscription, adminEmails) {
  console.log('📧 Preparing to send verification request notification to admin...');
  console.log('   Admin Emails:', adminEmails);
  console.log('   Vendor:', vendor.name);
  console.log('   Subscription ID:', subscription._id);
  
  if (!adminEmails || adminEmails.length === 0) {
    console.log('⚠️  No admin emails provided, skipping verification request notification');
    return { success: false, error: 'Admin emails not provided' };
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5175';
  const requestDate = subscription.verificationRequestDetails?.submittedAt 
    ? new Date(subscription.verificationRequestDetails.submittedAt).toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : new Date().toLocaleDateString('en-IN');

  const subject = `New Verification Request - ${vendor.name}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1F2937; background-color: #F3F4F6; }
        .email-wrapper { max-width: 600px; margin: 0 auto; background-color: #FFFFFF; }
        .header { background: linear-gradient(135deg, #8F61EF 0%, #F9A826 100%); color: white; padding: 40px 30px; text-align: center; }
        .logo { max-width: 180px; height: auto; margin-bottom: 20px; }
        .header h1 { font-size: 28px; font-weight: 700; margin: 0; letter-spacing: -0.5px; }
        .content { padding: 40px 30px; background-color: #FFFFFF; }
        .content p { margin-bottom: 16px; color: #4B5563; font-size: 16px; }
        .info-card { background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .info-row { margin: 12px 0; padding: 10px 0; border-bottom: 1px solid #E5E7EB; }
        .info-row:last-child { border-bottom: none; }
        .label { font-weight: 600; color: #8F61EF; display: inline-block; min-width: 200px; }
        .value { color: #1F2937; }
        .notice-box { background: linear-gradient(135deg, rgba(143, 97, 239, 0.1) 0%, rgba(249, 168, 38, 0.1) 100%); border-left: 4px solid #F9A826; padding: 20px; margin: 30px 0; border-radius: 8px; }
        .notice-box p { margin-bottom: 12px; color: #1F2937; }
        .notice-box strong { color: #8F61EF; }
        .button-wrapper { text-align: center; margin: 30px 0; }
        .button { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #8F61EF 0%, #F9A826 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(143, 97, 239, 0.3); }
        .footer { background-color: #F9FAFB; padding: 30px; text-align: center; border-top: 1px solid #E5E7EB; }
        .footer p { color: #6B7280; font-size: 14px; margin-bottom: 8px; }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="header">
          <img src="${frontendUrl}/image/venuebook.png" alt="ShubhVenue Logo" class="logo" />
          <h1>New Verification Request</h1>
        </div>
        <div class="content">
          <p>Dear Admin,</p>
          <p>A vendor has submitted a verification request:</p>
          <div class="info-card">
            <div class="info-row">
              <span class="label">Vendor Name:</span>
              <span class="value">${vendor.name}</span>
            </div>
            <div class="info-row">
              <span class="label">Vendor Email:</span>
              <span class="value">${vendor.email}</span>
            </div>
            <div class="info-row">
              <span class="label">Business Name:</span>
              <span class="value">${subscription.verificationRequestDetails?.businessName || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">Business Address:</span>
              <span class="value">${subscription.verificationRequestDetails?.businessAddress || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">Business Phone:</span>
              <span class="value">${subscription.verificationRequestDetails?.businessPhone || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">Business Email:</span>
              <span class="value">${subscription.verificationRequestDetails?.businessEmail || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">GST Number:</span>
              <span class="value">${subscription.verificationRequestDetails?.gstNumber || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">PAN Number:</span>
              <span class="value">${subscription.verificationRequestDetails?.panNumber || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">Plan:</span>
              <span class="value">${subscription.planId?.name || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">Request Date:</span>
              <span class="value">${requestDate}</span>
            </div>
            <div class="info-row">
              <span class="label">Status:</span>
              <span class="value" style="color: #F9A826; font-weight: 600;">Pending Verification</span>
            </div>
          </div>
          <div class="notice-box">
            <p><strong>⏰ Response Time:</strong></p>
            <p>Please review and respond to this verification request within <strong>24-48 hours</strong>.</p>
            <p>The vendor has been notified that they will receive a response within this timeframe.</p>
          </div>
          <div class="button-wrapper">
            <a href="${frontendUrl}/admin/verification-requests" class="button">Review Verification Request</a>
          </div>
          <p style="margin-top: 30px;">Please review and approve or reject this verification request from the admin dashboard.</p>
        </div>
        <div class="footer">
          <p>© 2024 ShubhVenue. All rights reserved.</p>
          <p style="font-size: 12px; color: #9CA3AF;">This is an automated notification email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const result = await sendEmail({
      to: adminEmails,
      subject,
      html,
    });
    
    if (result && result.success) {
      console.log('✅ Verification request notification sent to admin');
    } else {
      console.error('❌ Failed to send admin notification:', result?.error);
    }
    
    return result || { success: false, error: 'Unknown error occurred' };
  } catch (error) {
    console.error('❌ Exception in sendVerificationRequestNotificationToAdmin:', error);
    return { success: false, error: error.message || 'Exception occurred while sending email' };
  }
}

/**
 * Send verification approval email to vendor
 */
export async function sendVerificationApprovalEmailToVendor(vendor, subscription) {
  console.log('📧 Preparing to send verification approval email to vendor...');
  console.log('   Vendor Email:', vendor.email);
  console.log('   Subscription ID:', subscription._id);
  
  if (!vendor.email) {
    console.log('⚠️  No vendor email provided, skipping verification approval email');
    return { success: false, error: 'Vendor email not provided' };
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5175';
  const approvalDate = subscription.adminVerifiedAt 
    ? new Date(subscription.adminVerifiedAt).toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : new Date().toLocaleDateString('en-IN');

  const venueNames = subscription.venueIds && subscription.venueIds.length > 0
    ? subscription.venueIds.map(v => v.name || 'Venue').join(', ')
    : 'Your venues';

  const subject = `Verification Approved - ${vendor.name}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1F2937; background-color: #F3F4F6; }
        .email-wrapper { max-width: 600px; margin: 0 auto; background-color: #FFFFFF; }
        .header { background: linear-gradient(135deg, #8F61EF 0%, #F9A826 100%); color: white; padding: 40px 30px; text-align: center; }
        .logo { max-width: 180px; height: auto; margin-bottom: 20px; }
        .header h1 { font-size: 28px; font-weight: 700; margin: 0; letter-spacing: -0.5px; }
        .content { padding: 40px 30px; background-color: #FFFFFF; }
        .content p { margin-bottom: 16px; color: #4B5563; font-size: 16px; }
        .info-card { background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .info-row { margin: 12px 0; padding: 10px 0; border-bottom: 1px solid #E5E7EB; }
        .info-row:last-child { border-bottom: none; }
        .label { font-weight: 600; color: #8F61EF; display: inline-block; min-width: 180px; }
        .value { color: #1F2937; }
        .success-box { background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(143, 97, 239, 0.1) 100%); border-left: 4px solid #10B981; padding: 20px; margin: 30px 0; border-radius: 8px; }
        .success-box h2 { color: #10B981; font-size: 24px; margin-bottom: 12px; }
        .success-box p { color: #1F2937; margin-bottom: 8px; }
        .button-wrapper { text-align: center; margin: 30px 0; }
        .button { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #8F61EF 0%, #F9A826 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(143, 97, 239, 0.3); }
        .footer { background-color: #F9FAFB; padding: 30px; text-align: center; border-top: 1px solid #E5E7EB; }
        .footer p { color: #6B7280; font-size: 14px; margin-bottom: 8px; }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="header">
          <img src="${frontendUrl}/image/venuebook.png" alt="ShubhVenue Logo" class="logo" />
          <h1>🎉 Verification Approved!</h1>
        </div>
        <div class="content">
          <p>Dear ${vendor.name},</p>
          <div class="success-box">
            <h2>✅ Great News!</h2>
            <p>Your verification request has been approved!</p>
            <p>Your venues are now verified and visible to customers.</p>
          </div>
          <div class="info-card">
            <div class="info-row">
              <span class="label">Business Name:</span>
              <span class="value">${subscription.verificationRequestDetails?.businessName || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">Plan:</span>
              <span class="value">${subscription.planId?.name || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">Verified Venues:</span>
              <span class="value">${venueNames}</span>
            </div>
            <div class="info-row">
              <span class="label">Approval Date:</span>
              <span class="value">${approvalDate}</span>
            </div>
            <div class="info-row">
              <span class="label">Status:</span>
              <span class="value" style="color: #10B981; font-weight: 600;">Verified & Active</span>
            </div>
          </div>
          <div class="button-wrapper">
            <a href="${frontendUrl}/vendor/dashboard" class="button">View Dashboard</a>
          </div>
          <p style="margin-top: 30px;">Your verified venues are now live and visible to customers. Thank you for choosing ShubhVenue!</p>
          <p style="margin-top: 30px;">Best regards,<br><strong>The ShubhVenue Team</strong></p>
        </div>
        <div class="footer">
          <p>© 2024 ShubhVenue. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const result = await sendEmail({
      to: vendor.email,
      subject,
      html,
    });
    
    if (result && result.success) {
      console.log('✅ Verification approval email sent successfully to vendor:', vendor.email);
    } else {
      console.error('❌ Failed to send verification approval email:', result?.error);
    }
    
    return result || { success: false, error: 'Unknown error occurred' };
  } catch (error) {
    console.error('❌ Exception in sendVerificationApprovalEmailToVendor:', error);
    return { success: false, error: error.message || 'Exception occurred while sending email' };
  }
}

/**
 * Send test email
 */
export async function sendTestEmail(toEmail) {
  console.log('📧 Preparing to send test email...');
  console.log('   To Email:', toEmail);
  
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5175';
  
  // Get email config for variables
  const config = await EmailConfig.getConfig();
  const testDate = new Date().toLocaleDateString('en-IN', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // Try to get template from database
  const templateData = await getTemplateAndReplaceVariables('test_email', {
    frontendUrl: frontendUrl,
    smtpHost: config.smtpHost || 'smtp.zeptomail.in',
    smtpPort: config.smtpPort || '465',
    smtpSecurity: config.smtpSecurity || 'SSL',
    fromAddress: config.emailFromAddress || 'no-reply@synilogicitsolution.com',
    testDate: testDate
  });
  
  // Use template from database if available, otherwise use default
  const subject = templateData?.subject || 'Test Email - ShubhVenue Email Configuration';
  const html = templateData?.html || `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1F2937; background-color: #F3F4F6; }
        .email-wrapper { max-width: 600px; margin: 0 auto; background-color: #FFFFFF; }
        .header { background: linear-gradient(135deg, #8F61EF 0%, #F9A826 100%); color: white; padding: 40px 30px; text-align: center; }
        .logo { max-width: 180px; height: auto; margin-bottom: 20px; }
        .header h1 { font-size: 28px; font-weight: 700; margin: 0; letter-spacing: -0.5px; }
        .content { padding: 40px 30px; background-color: #FFFFFF; }
        .content p { margin-bottom: 16px; color: #4B5563; font-size: 16px; }
        .success-box { background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(143, 97, 239, 0.1) 100%); border-left: 4px solid #10B981; padding: 20px; margin: 30px 0; border-radius: 8px; }
        .success-box h2 { color: #10B981; font-size: 24px; margin-bottom: 12px; }
        .success-box p { color: #1F2937; margin-bottom: 8px; }
        .info-card { background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .info-row { margin: 12px 0; padding: 10px 0; border-bottom: 1px solid #E5E7EB; }
        .info-row:last-child { border-bottom: none; }
        .label { font-weight: 600; color: #8F61EF; display: inline-block; min-width: 180px; }
        .value { color: #1F2937; }
        .footer { background-color: #F9FAFB; padding: 30px; text-align: center; border-top: 1px solid #E5E7EB; }
        .footer p { color: #6B7280; font-size: 14px; margin-bottom: 8px; }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="header">
          <img src="${frontendUrl}/image/venuebook.png" alt="ShubhVenue Logo" class="logo" />
          <h1>✅ Test Email Successful!</h1>
        </div>
        <div class="content">
          <p>Dear Admin,</p>
          <div class="success-box">
            <h2>Email Configuration Working!</h2>
            <p>This is a test email from ShubhVenue email system.</p>
            <p>If you are reading this, your email configuration is working correctly!</p>
          </div>
          <div class="info-card">
            <div class="info-row">
              <span class="label">SMTP Host:</span>
              <span class="value">${config.smtpHost || 'smtp.zeptomail.in'}</span>
            </div>
            <div class="info-row">
              <span class="label">SMTP Port:</span>
              <span class="value">${config.smtpPort || '465'}</span>
            </div>
            <div class="info-row">
              <span class="label">Security:</span>
              <span class="value">${config.smtpSecurity || 'SSL'}</span>
            </div>
            <div class="info-row">
              <span class="label">From Address:</span>
              <span class="value">${config.emailFromAddress || 'no-reply@synilogicitsolution.com'}</span>
            </div>
            <div class="info-row">
              <span class="label">Test Date:</span>
              <span class="value">${testDate}</span>
            </div>
          </div>
          <p style="margin-top: 30px;">Your email system is properly configured and ready to send emails.</p>
          <p style="margin-top: 30px;">Best regards,<br><strong>The ShubhVenue Team</strong></p>
        </div>
        <div class="footer">
          <p>© 2024 ShubhVenue. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  const text = templateData?.text;

  try {
    const result = await sendEmail({
      to: toEmail,
      subject,
      html,
      text,
    });
    
    if (result && result.success) {
      console.log('✅ Test email sent successfully to:', toEmail);
    } else {
      console.error('❌ Failed to send test email:', result?.error);
    }
    
    return result || { success: false, error: 'Unknown error occurred' };
  } catch (error) {
    console.error('❌ Exception in sendTestEmail:', error);
    return { success: false, error: error.message || 'Exception occurred while sending email' };
  }
}

