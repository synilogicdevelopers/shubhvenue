import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectToDatabase } from './src/config/db.js';
import EmailTemplate from './src/models/EmailTemplate.js';

dotenv.config();

const defaultTemplates = [
  {
    name: 'Customer Welcome Email',
    type: 'customer_welcome',
    html: `<!DOCTYPE html>
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
    .button { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #8F61EF 0%, #F9A826 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; transition: all 0.3s ease; box-shadow: 0 4px 6px rgba(143, 97, 239, 0.3); }
    .button:hover { transform: translateY(-2px); box-shadow: 0 6px 12px rgba(143, 97, 239, 0.4); }
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
      <img src="{{frontendUrl}}/image/venuebook.png" alt="ShubhVenue Logo" class="logo" />
      <h1>🎉 Welcome to ShubhVenue!</h1>
    </div>
    <div class="content">
      <p>Dear {{user.name}},</p>
      <p>Thank you for joining ShubhVenue! We're thrilled to have you as part of our community.</p>
      <p>Your account has been successfully created. You can now:</p>
      <ul>
        <li>Browse and explore amazing wedding venues</li>
        <li>Book venues for your special occasions</li>
        <li>Save your favorite venues to your shotlist</li>
        <li>Manage your bookings and reservations</li>
      </ul>
      <div class="button-wrapper">
        <a href="{{frontendUrl}}" class="button">Start Exploring Venues</a>
      </div>
      <p>If you have any questions or need assistance, our support team is here to help.</p>
      <p style="margin-top: 30px;">Best regards,<br><strong>The ShubhVenue Team</strong></p>
    </div>
    <div class="footer">
      <p>© 2024 ShubhVenue. All rights reserved.</p>
      <div class="footer-links">
        <a href="{{frontendUrl}}">Visit Website</a>
        <a href="{{frontendUrl}}/contact">Contact Us</a>
        <a href="{{frontendUrl}}/privacy">Privacy Policy</a>
      </div>
    </div>
  </div>
</body>
</html>`,
    isActive: true,
  },
  {
    name: 'Vendor Welcome Email',
    type: 'vendor_welcome',
    html: `<!DOCTYPE html>
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
      <img src="{{frontendUrl}}/image/venuebook.png" alt="ShubhVenue Logo" class="logo" />
      <h1>🎉 Welcome to ShubhVenue!</h1>
    </div>
    <div class="content">
      <p>Dear {{user.name}},</p>
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
        <a href="{{frontendUrl}}">Visit Website</a>
        <a href="{{frontendUrl}}/contact">Contact Us</a>
        <a href="{{frontendUrl}}/privacy">Privacy Policy</a>
      </div>
    </div>
  </div>
</body>
</html>`,
    isActive: true,
  },
  {
    name: 'Vendor Registration Admin Notification',
    type: 'vendor_registration_admin',
    html: `<!DOCTYPE html>
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
      <img src="{{frontendUrl}}/image/venuebook.png" alt="ShubhVenue Logo" class="logo" />
      <h1>New Vendor Registration</h1>
    </div>
    <div class="content">
      <p>A new vendor has registered and is waiting for approval:</p>
      <div class="info-card">
        <div class="info-row">
          <span class="label">Name:</span>
          <span class="value">{{vendor.name}}</span>
        </div>
        <div class="info-row">
          <span class="label">Email:</span>
          <span class="value">{{vendor.email}}</span>
        </div>
        <div class="info-row">
          <span class="label">Phone:</span>
          <span class="value">{{vendor.phone}}</span>
        </div>
        <div class="info-row">
          <span class="label">Registration Date:</span>
          <span class="value">{{registrationDate}}</span>
        </div>
      </div>
      <div class="notice-box">
        <p><strong>⏰ Response Time:</strong></p>
        <p>Please review and respond to this vendor registration within <strong>24-48 hours</strong>.</p>
        <p>The vendor has been notified that they will receive a response within this timeframe.</p>
      </div>
      <div class="button-wrapper">
        <a href="{{frontendUrl}}/admin/vendors" class="button">Review Vendor Registration</a>
      </div>
      <p style="margin-top: 30px;">Please review and approve or reject this vendor registration from the admin dashboard.</p>
    </div>
    <div class="footer">
      <p>© 2024 ShubhVenue. All rights reserved.</p>
      <p style="font-size: 12px; color: #9CA3AF;">This is an automated notification email.</p>
    </div>
  </div>
</body>
</html>`,
    isActive: true,
  },
  {
    name: 'Vendor Approval Email',
    type: 'vendor_approval',
    html: `<!DOCTYPE html>
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
    .button-wrapper { text-align: center; margin: 30px 0; }
    .button { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #8F61EF 0%, #F9A826 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; transition: all 0.3s ease; box-shadow: 0 4px 6px rgba(143, 97, 239, 0.3); }
    .button:hover { transform: translateY(-2px); box-shadow: 0 6px 12px rgba(143, 97, 239, 0.4); }
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
      <img src="{{frontendUrl}}/image/venuebook.png" alt="ShubhVenue Logo" class="logo" />
      <h1>🎉 Account Approved!</h1>
    </div>
    <div class="content">
      <p>Dear {{user.name}},</p>
      <div class="success-box">
        <h2>✅ Great News!</h2>
        <p>Your vendor account has been approved by our admin team.</p>
        <p>You can now log in to your vendor dashboard and start managing your venues and bookings.</p>
      </div>
      <p>Get started by accessing your vendor dashboard where you can:</p>
      <ul style="margin: 20px 0 20px 20px; color: #4B5563;">
        <li>Add and manage your venues</li>
        <li>View and manage bookings</li>
        <li>Track your earnings</li>
        <li>Update your profile and settings</li>
      </ul>
      <div class="button-wrapper">
        <a href="{{frontendUrl}}/vendor/login" class="button">Login to Dashboard</a>
      </div>
      <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
      <p style="margin-top: 30px;">Best regards,<br><strong>The ShubhVenue Team</strong></p>
    </div>
    <div class="footer">
      <p>© 2024 ShubhVenue. All rights reserved.</p>
      <div class="footer-links">
        <a href="{{frontendUrl}}">Visit Website</a>
        <a href="{{frontendUrl}}/contact">Contact Us</a>
        <a href="{{frontendUrl}}/privacy">Privacy Policy</a>
      </div>
    </div>
  </div>
</body>
</html>`,
    isActive: true,
  },
  {
    name: 'Vendor Rejection Email',
    type: 'vendor_rejection',
    html: `<!DOCTYPE html>
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
    .button { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #8F61EF 0%, #F9A826 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; transition: all 0.3s ease; box-shadow: 0 4px 6px rgba(143, 97, 239, 0.3); }
    .button:hover { transform: translateY(-2px); box-shadow: 0 6px 12px rgba(143, 97, 239, 0.4); }
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
      <img src="{{frontendUrl}}/image/venuebook.png" alt="ShubhVenue Logo" class="logo" />
      <h1>Account Status Update</h1>
    </div>
    <div class="content">
      <p>Dear {{user.name}},</p>
      <div class="notice-box">
        <p><strong>Account Registration Update</strong></p>
        <p>We regret to inform you that your vendor account registration has been reviewed and unfortunately, we are unable to approve it at this time.</p>
      </div>
      <p>If you believe this is an error or would like to discuss this further, please contact our support team. We're here to help and would be happy to assist you.</p>
      <div class="button-wrapper">
        <a href="{{frontendUrl}}/contact" class="button">Contact Support</a>
      </div>
      <p>Thank you for your interest in ShubhVenue. We appreciate you taking the time to register with us.</p>
      <p style="margin-top: 30px;">Best regards,<br><strong>The ShubhVenue Team</strong></p>
    </div>
    <div class="footer">
      <p>© 2024 ShubhVenue. All rights reserved.</p>
      <div class="footer-links">
        <a href="{{frontendUrl}}">Visit Website</a>
        <a href="{{frontendUrl}}/contact">Contact Us</a>
        <a href="{{frontendUrl}}/privacy">Privacy Policy</a>
      </div>
    </div>
  </div>
</body>
</html>`,
    isActive: true,
  },
  {
    name: 'Booking Confirmation Email',
    type: 'booking_confirmation',
    subject: 'Booking Confirmation - {{venueName}}',
    html: `<!DOCTYPE html>
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
      <img src="{{frontendUrl}}/image/venuebook.png" alt="ShubhVenue Logo" class="logo" />
      <h1>✅ Booking Confirmed!</h1>
    </div>
    <div class="content">
      <p>Dear {{customerName}},</p>
      <p>Thank you for your booking! Your booking has been received and is pending admin approval.</p>
      <div class="info-card">
        <div class="info-row">
          <span class="label">Booking ID:</span>
          <span class="value">{{bookingId}}</span>
        </div>
        <div class="info-row">
          <span class="label">Venue:</span>
          <span class="value">{{venueName}}</span>
        </div>
        <div class="info-row">
          <span class="label">Date:</span>
          <span class="value">{{bookingDate}}</span>
        </div>
        <div class="info-row">
          <span class="label">Guests:</span>
          <span class="value">{{guests}}</span>
        </div>
        <div class="info-row">
          <span class="label">Total Amount:</span>
          <span class="value">₹{{totalAmount}}</span>
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
</html>`,
    description: 'Email sent to customer when booking is created',
    variables: [
      { name: 'customerName', description: 'Customer name', example: 'John Doe' },
      { name: 'bookingId', description: 'Booking ID', example: 'BK123456' },
      { name: 'venueName', description: 'Venue name', example: 'Grand Palace' },
      { name: 'bookingDate', description: 'Booking date', example: '15 January 2024' },
      { name: 'guests', description: 'Number of guests', example: '100' },
      { name: 'totalAmount', description: 'Total booking amount', example: '50000' },
      { name: 'frontendUrl', description: 'Frontend URL', example: 'http://localhost:5175' }
    ],
    isActive: true,
  },
  {
    name: 'Booking Notification Admin',
    type: 'booking_notification_admin',
    subject: 'New Booking Received - {{venueName}}',
    html: `<!DOCTYPE html>
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
      <img src="{{frontendUrl}}/image/venuebook.png" alt="ShubhVenue Logo" class="logo" />
      <h1>New Booking Received</h1>
    </div>
    <div class="content">
      <p>A new booking has been received and requires your approval:</p>
      <div class="info-card">
        <div class="info-row">
          <span class="label">Booking ID:</span>
          <span class="value">{{bookingId}}</span>
        </div>
        <div class="info-row">
          <span class="label">Customer:</span>
          <span class="value">{{customerName}}</span>
        </div>
        <div class="info-row">
          <span class="label">Email:</span>
          <span class="value">{{customerEmail}}</span>
        </div>
        <div class="info-row">
          <span class="label">Phone:</span>
          <span class="value">{{customerPhone}}</span>
        </div>
        <div class="info-row">
          <span class="label">Venue:</span>
          <span class="value">{{venueName}}</span>
        </div>
        <div class="info-row">
          <span class="label">Date:</span>
          <span class="value">{{bookingDate}}</span>
        </div>
        <div class="info-row">
          <span class="label">Guests:</span>
          <span class="value">{{guests}}</span>
        </div>
        <div class="info-row">
          <span class="label">Total Amount:</span>
          <span class="value">₹{{totalAmount}}</span>
        </div>
        <div class="info-row">
          <span class="label">Payment Status:</span>
          <span class="value">{{paymentStatus}}</span>
        </div>
      </div>
      <div class="notice-box">
        <p><strong>⏰ Action Required:</strong></p>
        <p>Please review and approve this booking from the admin dashboard.</p>
      </div>
      <div class="button-wrapper">
        <a href="{{frontendUrl}}/admin/bookings" class="button">Review Booking</a>
      </div>
    </div>
    <div class="footer">
      <p>© 2024 ShubhVenue. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
    description: 'Email notification sent to admin when a new booking is received',
    variables: [
      { name: 'bookingId', description: 'Booking ID', example: 'BK123456' },
      { name: 'customerName', description: 'Customer name', example: 'John Doe' },
      { name: 'customerEmail', description: 'Customer email', example: 'john@example.com' },
      { name: 'customerPhone', description: 'Customer phone', example: '+91 9876543210' },
      { name: 'venueName', description: 'Venue name', example: 'Grand Palace' },
      { name: 'bookingDate', description: 'Booking date', example: '15 January 2024' },
      { name: 'guests', description: 'Number of guests', example: '100' },
      { name: 'totalAmount', description: 'Total booking amount', example: '50000' },
      { name: 'paymentStatus', description: 'Payment status', example: 'completed' },
      { name: 'frontendUrl', description: 'Frontend URL', example: 'http://localhost:5175' }
    ],
    isActive: true,
  },
  {
    name: 'Booking Approval Vendor',
    type: 'booking_approval_vendor',
    subject: 'New Booking Approved - {{venueName}}',
    html: `<!DOCTYPE html>
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
      <img src="{{frontendUrl}}/image/venuebook.png" alt="ShubhVenue Logo" class="logo" />
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
          <span class="value">{{bookingId}}</span>
        </div>
        <div class="info-row">
          <span class="label">Venue:</span>
          <span class="value">{{venueName}}</span>
        </div>
        <div class="info-row">
          <span class="label">Customer:</span>
          <span class="value">{{customerName}}</span>
        </div>
        <div class="info-row">
          <span class="label">Phone:</span>
          <span class="value">{{customerPhone}}</span>
        </div>
        <div class="info-row">
          <span class="label">Date:</span>
          <span class="value">{{bookingDate}}</span>
        </div>
        <div class="info-row">
          <span class="label">Guests:</span>
          <span class="value">{{guests}}</span>
        </div>
        <div class="info-row">
          <span class="label">Total Amount:</span>
          <span class="value">₹{{totalAmount}}</span>
        </div>
      </div>
      <div class="button-wrapper">
        <a href="{{frontendUrl}}/vendor/bookings" class="button">View Booking Details</a>
      </div>
      <p style="margin-top: 30px;">Best regards,<br><strong>The ShubhVenue Team</strong></p>
    </div>
    <div class="footer">
      <p>© 2024 ShubhVenue. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
    description: 'Email notification sent to vendor when admin approves a booking',
    variables: [
      { name: 'bookingId', description: 'Booking ID', example: 'BK123456' },
      { name: 'venueName', description: 'Venue name', example: 'Grand Palace' },
      { name: 'customerName', description: 'Customer name', example: 'John Doe' },
      { name: 'customerPhone', description: 'Customer phone', example: '+91 9876543210' },
      { name: 'bookingDate', description: 'Booking date', example: '15 January 2024' },
      { name: 'guests', description: 'Number of guests', example: '100' },
      { name: 'totalAmount', description: 'Total booking amount', example: '50000' },
      { name: 'frontendUrl', description: 'Frontend URL', example: 'http://localhost:5175' }
    ],
    isActive: true,
  },
  {
    name: 'Vendor Booking Confirmation',
    type: 'vendor_booking_confirmation',
    subject: 'Booking Confirmed by Venue - {{venueName}}',
    html: `<!DOCTYPE html>
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
      <img src="{{frontendUrl}}/image/venuebook.png" alt="ShubhVenue Logo" class="logo" />
      <h1>🎉 Booking Confirmed!</h1>
    </div>
    <div class="content">
      <p>Dear {{customerName}},</p>
      <div class="success-box">
        <h2>✅ Great News!</h2>
        <p>Your booking has been confirmed by the venue!</p>
        <p>The venue has approved your booking request. Your event is now confirmed.</p>
      </div>
      <div class="info-card">
        <div class="info-row">
          <span class="label">Booking ID:</span>
          <span class="value">{{bookingId}}</span>
        </div>
        <div class="info-row">
          <span class="label">Venue:</span>
          <span class="value">{{venueName}}</span>
        </div>
        <div class="info-row">
          <span class="label">Date:</span>
          <span class="value">{{bookingDate}}</span>
        </div>
        <div class="info-row">
          <span class="label">Guests:</span>
          <span class="value">{{guests}}</span>
        </div>
        <div class="info-row">
          <span class="label">Total Amount:</span>
          <span class="value">₹{{totalAmount}}</span>
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
</html>`,
    description: 'Email sent to customer when vendor confirms/approves booking',
    variables: [
      { name: 'customerName', description: 'Customer name', example: 'John Doe' },
      { name: 'bookingId', description: 'Booking ID', example: 'BK123456' },
      { name: 'venueName', description: 'Venue name', example: 'Grand Palace' },
      { name: 'bookingDate', description: 'Booking date', example: '15 January 2024' },
      { name: 'guests', description: 'Number of guests', example: '100' },
      { name: 'totalAmount', description: 'Total booking amount', example: '50000' },
      { name: 'frontendUrl', description: 'Frontend URL', example: 'http://localhost:5175' }
    ],
    isActive: true,
  },
  {
    name: 'Booking Cancellation Email',
    type: 'booking_cancellation',
    subject: 'Booking Cancelled - {{venueName}}',
    html: `<!DOCTYPE html>
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
      <img src="{{frontendUrl}}/image/venuebook.png" alt="ShubhVenue Logo" class="logo" />
      <h1>Booking Cancelled</h1>
    </div>
    <div class="content">
      <p>Dear {{customerName}},</p>
      <div class="notice-box">
        <p><strong>Booking Cancellation Notice</strong></p>
        <p>The following booking has been cancelled:</p>
      </div>
      <div class="info-card">
        <div class="info-row">
          <span class="label">Booking ID:</span>
          <span class="value">{{bookingId}}</span>
        </div>
        <div class="info-row">
          <span class="label">Venue:</span>
          <span class="value">{{venueName}}</span>
        </div>
        <div class="info-row">
          <span class="label">Date:</span>
          <span class="value">{{bookingDate}}</span>
        </div>
        <div class="info-row">
          <span class="label">Customer:</span>
          <span class="value">{{customerName}}</span>
        </div>
      </div>
      <p style="margin-top: 30px;">Best regards,<br><strong>The ShubhVenue Team</strong></p>
    </div>
    <div class="footer">
      <p>© 2024 ShubhVenue. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
    description: 'Email sent when a booking is cancelled',
    variables: [
      { name: 'customerName', description: 'Customer name', example: 'John Doe' },
      { name: 'bookingId', description: 'Booking ID', example: 'BK123456' },
      { name: 'venueName', description: 'Venue name', example: 'Grand Palace' },
      { name: 'bookingDate', description: 'Booking date', example: '15 January 2024' },
      { name: 'frontendUrl', description: 'Frontend URL', example: 'http://localhost:5175' }
    ],
    isActive: true,
  },
  {
    name: 'Lead Notification Admin',
    type: 'lead_notification_admin',
    subject: 'New Lead Received - {{venueName}}',
    html: `<!DOCTYPE html>
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
      <img src="{{frontendUrl}}/image/venuebook.png" alt="ShubhVenue Logo" class="logo" />
      <h1>New Lead Received</h1>
    </div>
    <div class="content">
      <p>A new lead has been received:</p>
      <div class="info-card">
        <div class="info-row">
          <span class="label">Customer:</span>
          <span class="value">{{customerName}}</span>
        </div>
        <div class="info-row">
          <span class="label">Email:</span>
          <span class="value">{{customerEmail}}</span>
        </div>
        <div class="info-row">
          <span class="label">Phone:</span>
          <span class="value">{{customerPhone}}</span>
        </div>
        <div class="info-row">
          <span class="label">Venue:</span>
          <span class="value">{{venueName}}</span>
        </div>
        <div class="info-row">
          <span class="label">Date:</span>
          <span class="value">{{leadDate}}</span>
        </div>
        <div class="info-row">
          <span class="label">Guests:</span>
          <span class="value">{{guests}}</span>
        </div>
        <div class="info-row">
          <span class="label">Total Amount:</span>
          <span class="value">₹{{totalAmount}}</span>
        </div>
        <div class="info-row">
          <span class="label">Status:</span>
          <span class="value">{{status}}</span>
        </div>
      </div>
      <div class="notice-box">
        <p><strong>⏰ Action Required:</strong></p>
        <p>This is a lead inquiry. Please contact the customer to convert it into a booking.</p>
      </div>
      <div class="button-wrapper">
        <a href="{{frontendUrl}}/admin/leads" class="button">View Lead Details</a>
      </div>
    </div>
    <div class="footer">
      <p>© 2024 ShubhVenue. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
    description: 'Email notification sent to admin when a new lead is created',
    variables: [
      { name: 'customerName', description: 'Customer name', example: 'John Doe' },
      { name: 'customerEmail', description: 'Customer email', example: 'john@example.com' },
      { name: 'customerPhone', description: 'Customer phone', example: '+91 9876543210' },
      { name: 'venueName', description: 'Venue name', example: 'Grand Palace' },
      { name: 'leadDate', description: 'Lead date', example: '15 January 2024' },
      { name: 'guests', description: 'Number of guests', example: '100' },
      { name: 'totalAmount', description: 'Total amount', example: '50000' },
      { name: 'status', description: 'Lead status', example: 'new' },
      { name: 'frontendUrl', description: 'Frontend URL', example: 'http://localhost:5175' }
    ],
    isActive: true,
  },
  {
    name: 'Review Notification Vendor',
    type: 'review_notification_vendor',
    subject: 'New Review Received - {{venueName}}',
    html: `<!DOCTYPE html>
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
      <img src="{{frontendUrl}}/image/venuebook.png" alt="ShubhVenue Logo" class="logo" />
      <h1>New Review Received</h1>
    </div>
    <div class="content">
      <p>Dear Vendor,</p>
      <p>A customer has left a review for your venue:</p>
      <div class="info-card">
        <div class="info-row">
          <span class="label">Venue:</span>
          <span class="value">{{venueName}}</span>
        </div>
        <div class="info-row">
          <span class="label">Customer:</span>
          <span class="value">{{customerName}}</span>
        </div>
        <div class="info-row">
          <span class="label">Rating:</span>
          <span class="value">
            <span class="rating-stars">{{ratingStars}}</span>
            ({{rating}}/5)
          </span>
        </div>
        <div class="info-row">
          <span class="label">Date:</span>
          <span class="value">{{reviewDate}}</span>
        </div>
      </div>
      {{#if reviewComment}}
      <div class="review-comment">
        <strong>Review Comment:</strong><br>
        "{{reviewComment}}"
      </div>
      {{/if}}
      <div class="button-wrapper">
        <a href="{{frontendUrl}}/vendor/reviews" class="button">View & Reply to Review</a>
      </div>
      <p style="margin-top: 30px;">You can reply to this review from your vendor dashboard.</p>
      <p style="margin-top: 30px;">Best regards,<br><strong>The ShubhVenue Team</strong></p>
    </div>
    <div class="footer">
      <p>© 2024 ShubhVenue. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
    description: 'Email notification sent to vendor when customer posts a review',
    variables: [
      { name: 'venueName', description: 'Venue name', example: 'Grand Palace' },
      { name: 'customerName', description: 'Customer name', example: 'John Doe' },
      { name: 'rating', description: 'Rating (1-5)', example: '5' },
      { name: 'ratingStars', description: 'Rating stars', example: '★★★★★' },
      { name: 'reviewComment', description: 'Review comment', example: 'Great venue!' },
      { name: 'reviewDate', description: 'Review date', example: '15 January 2024' },
      { name: 'frontendUrl', description: 'Frontend URL', example: 'http://localhost:5175' }
    ],
    isActive: true,
  },
  {
    name: 'Review Reply Customer',
    type: 'review_reply_customer',
    subject: 'Venue Replied to Your Review - {{venueName}}',
    html: `<!DOCTYPE html>
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
      <img src="{{frontendUrl}}/image/venuebook.png" alt="ShubhVenue Logo" class="logo" />
      <h1>Venue Replied to Your Review</h1>
    </div>
    <div class="content">
      <p>Dear {{customerName}},</p>
      <p>The venue has replied to your review:</p>
      <div class="info-card">
        <div class="info-row">
          <span class="label">Venue:</span>
          <span class="value">{{venueName}}</span>
        </div>
        <div class="info-row">
          <span class="label">Replied By:</span>
          <span class="value">{{repliedBy}}</span>
        </div>
        <div class="info-row">
          <span class="label">Reply Date:</span>
          <span class="value">{{replyDate}}</span>
        </div>
      </div>
      <div class="review-section">
        <div class="review-box">
          <strong>Your Review:</strong><br>
          <span class="rating-stars" style="color: #F9A826;">{{ratingStars}}</span>
          {{#if reviewComment}}
          <br><br>"{{reviewComment}}"
          {{/if}}
        </div>
        <div class="reply-box">
          <strong>Venue Reply:</strong><br><br>
          "{{replyMessage}}"
        </div>
      </div>
      <div class="button-wrapper">
        <a href="{{frontendUrl}}/venue/{{venueSlug}}" class="button">View Review & Reply</a>
      </div>
      <p style="margin-top: 30px;">Best regards,<br><strong>The ShubhVenue Team</strong></p>
    </div>
    <div class="footer">
      <p>© 2024 ShubhVenue. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
    description: 'Email notification sent to customer when vendor replies to their review',
    variables: [
      { name: 'customerName', description: 'Customer name', example: 'John Doe' },
      { name: 'venueName', description: 'Venue name', example: 'Grand Palace' },
      { name: 'venueSlug', description: 'Venue slug', example: 'grand-palace' },
      { name: 'repliedBy', description: 'Person who replied', example: 'Venue Owner' },
      { name: 'replyDate', description: 'Reply date', example: '15 January 2024' },
      { name: 'ratingStars', description: 'Rating stars', example: '★★★★★' },
      { name: 'reviewComment', description: 'Review comment', example: 'Great venue!' },
      { name: 'replyMessage', description: 'Vendor reply message', example: 'Thank you for your feedback!' },
      { name: 'frontendUrl', description: 'Frontend URL', example: 'http://localhost:5175' }
    ],
    isActive: true,
  },
  {
    name: 'Verification Request Vendor',
    type: 'verification_request_vendor',
    subject: 'Verification Request Submitted - {{vendorName}}',
    html: `<!DOCTYPE html>
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
      <img src="{{frontendUrl}}/image/venuebook.png" alt="ShubhVenue Logo" class="logo" />
      <h1>Verification Request Submitted</h1>
    </div>
    <div class="content">
      <p>Dear {{vendorName}},</p>
      <p>Your verification request has been successfully submitted!</p>
      <div class="info-card">
        <div class="info-row">
          <span class="label">Business Name:</span>
          <span class="value">{{businessName}}</span>
        </div>
        <div class="info-row">
          <span class="label">Plan:</span>
          <span class="value">{{planName}}</span>
        </div>
        <div class="info-row">
          <span class="label">Request Date:</span>
          <span class="value">{{requestDate}}</span>
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
</html>`,
    description: 'Email confirmation sent to vendor after submitting verification request',
    variables: [
      { name: 'vendorName', description: 'Vendor name', example: 'John Vendor' },
      { name: 'businessName', description: 'Business name', example: 'Grand Events' },
      { name: 'planName', description: 'Plan name', example: 'Premium Plan' },
      { name: 'requestDate', description: 'Request submission date', example: '15 January 2024' },
      { name: 'frontendUrl', description: 'Frontend URL', example: 'http://localhost:5175' }
    ],
    isActive: true,
  },
  {
    name: 'Verification Request Admin',
    type: 'verification_request_admin',
    subject: 'New Verification Request - {{vendorName}}',
    html: `<!DOCTYPE html>
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
      <img src="{{frontendUrl}}/image/venuebook.png" alt="ShubhVenue Logo" class="logo" />
      <h1>New Verification Request</h1>
    </div>
    <div class="content">
      <p>Dear Admin,</p>
      <p>A vendor has submitted a verification request:</p>
      <div class="info-card">
        <div class="info-row">
          <span class="label">Vendor Name:</span>
          <span class="value">{{vendorName}}</span>
        </div>
        <div class="info-row">
          <span class="label">Vendor Email:</span>
          <span class="value">{{vendorEmail}}</span>
        </div>
        <div class="info-row">
          <span class="label">Business Name:</span>
          <span class="value">{{businessName}}</span>
        </div>
        <div class="info-row">
          <span class="label">Business Address:</span>
          <span class="value">{{businessAddress}}</span>
        </div>
        <div class="info-row">
          <span class="label">Business Phone:</span>
          <span class="value">{{businessPhone}}</span>
        </div>
        <div class="info-row">
          <span class="label">Business Email:</span>
          <span class="value">{{businessEmail}}</span>
        </div>
        <div class="info-row">
          <span class="label">GST Number:</span>
          <span class="value">{{gstNumber}}</span>
        </div>
        <div class="info-row">
          <span class="label">PAN Number:</span>
          <span class="value">{{panNumber}}</span>
        </div>
        <div class="info-row">
          <span class="label">Plan:</span>
          <span class="value">{{planName}}</span>
        </div>
        <div class="info-row">
          <span class="label">Request Date:</span>
          <span class="value">{{requestDate}}</span>
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
        <a href="{{frontendUrl}}/admin/verification-requests" class="button">Review Verification Request</a>
      </div>
      <p style="margin-top: 30px;">Please review and approve or reject this verification request from the admin dashboard.</p>
    </div>
    <div class="footer">
      <p>© 2024 ShubhVenue. All rights reserved.</p>
      <p style="font-size: 12px; color: #9CA3AF;">This is an automated notification email.</p>
    </div>
  </div>
</body>
</html>`,
    description: 'Email notification sent to admin when vendor submits verification request',
    variables: [
      { name: 'vendorName', description: 'Vendor name', example: 'John Vendor' },
      { name: 'vendorEmail', description: 'Vendor email', example: 'vendor@example.com' },
      { name: 'businessName', description: 'Business name', example: 'Grand Events' },
      { name: 'businessAddress', description: 'Business address', example: '123 Main St' },
      { name: 'businessPhone', description: 'Business phone', example: '+91 9876543210' },
      { name: 'businessEmail', description: 'Business email', example: 'business@example.com' },
      { name: 'gstNumber', description: 'GST number', example: 'GST123456' },
      { name: 'panNumber', description: 'PAN number', example: 'PAN123456' },
      { name: 'planName', description: 'Plan name', example: 'Premium Plan' },
      { name: 'requestDate', description: 'Request date', example: '15 January 2024' },
      { name: 'frontendUrl', description: 'Frontend URL', example: 'http://localhost:5175' }
    ],
    isActive: true,
  },
  {
    name: 'Verification Approval Vendor',
    type: 'verification_approval_vendor',
    subject: 'Verification Approved - {{vendorName}}',
    html: `<!DOCTYPE html>
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
      <img src="{{frontendUrl}}/image/venuebook.png" alt="ShubhVenue Logo" class="logo" />
      <h1>🎉 Verification Approved!</h1>
    </div>
    <div class="content">
      <p>Dear {{vendorName}},</p>
      <div class="success-box">
        <h2>✅ Great News!</h2>
        <p>Your verification request has been approved!</p>
        <p>Your venues are now verified and visible to customers.</p>
      </div>
      <div class="info-card">
        <div class="info-row">
          <span class="label">Business Name:</span>
          <span class="value">{{businessName}}</span>
        </div>
        <div class="info-row">
          <span class="label">Plan:</span>
          <span class="value">{{planName}}</span>
        </div>
        <div class="info-row">
          <span class="label">Verified Venues:</span>
          <span class="value">{{venueNames}}</span>
        </div>
        <div class="info-row">
          <span class="label">Approval Date:</span>
          <span class="value">{{approvalDate}}</span>
        </div>
        <div class="info-row">
          <span class="label">Status:</span>
          <span class="value" style="color: #10B981; font-weight: 600;">Verified & Active</span>
        </div>
      </div>
      <div class="button-wrapper">
        <a href="{{frontendUrl}}/vendor/dashboard" class="button">View Dashboard</a>
      </div>
      <p style="margin-top: 30px;">Your verified venues are now live and visible to customers. Thank you for choosing ShubhVenue!</p>
      <p style="margin-top: 30px;">Best regards,<br><strong>The ShubhVenue Team</strong></p>
    </div>
    <div class="footer">
      <p>© 2024 ShubhVenue. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
    description: 'Email sent to vendor when admin approves verification request',
    variables: [
      { name: 'vendorName', description: 'Vendor name', example: 'John Vendor' },
      { name: 'businessName', description: 'Business name', example: 'Grand Events' },
      { name: 'planName', description: 'Plan name', example: 'Premium Plan' },
      { name: 'venueNames', description: 'Verified venue names', example: 'Grand Palace, Royal Hall' },
      { name: 'approvalDate', description: 'Approval date', example: '15 January 2024' },
      { name: 'frontendUrl', description: 'Frontend URL', example: 'http://localhost:5175' }
    ],
    isActive: true,
  },
  {
    name: 'Monthly Revenue Vendor',
    type: 'monthly_revenue_vendor',
    subject: 'Monthly Revenue Report - {{monthName}} {{year}}',
    html: `<!DOCTYPE html>
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
    .info-row { margin: 12px 0; padding: 10px 0; border-bottom: 1px solid #E5E7EB; display: flex; justify-content: space-between; }
    .info-row:last-child { border-bottom: none; }
    .label { font-weight: 600; color: #8F61EF; }
    .value { color: #1F2937; font-weight: 600; }
    .revenue-highlight { background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(143, 97, 239, 0.1) 100%); border-left: 4px solid #10B981; padding: 20px; margin: 30px 0; border-radius: 8px; }
    .revenue-highlight h2 { color: #10B981; font-size: 24px; margin-bottom: 12px; }
    .revenue-highlight .amount { font-size: 32px; font-weight: 700; color: #10B981; }
    .button-wrapper { text-align: center; margin: 30px 0; }
    .button { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #8F61EF 0%, #F9A826 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(143, 97, 239, 0.3); }
    .footer { background-color: #F9FAFB; padding: 30px; text-align: center; border-top: 1px solid #E5E7EB; }
    .footer p { color: #6B7280; font-size: 14px; margin-bottom: 8px; }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="header">
      <img src="{{frontendUrl}}/image/venuebook.png" alt="ShubhVenue Logo" class="logo" />
      <h1>Monthly Revenue Report</h1>
    </div>
    <div class="content">
      <p>Dear {{vendorName}},</p>
      <p>Here's your monthly revenue report for <strong>{{monthName}} {{year}}</strong>:</p>
      <div class="revenue-highlight">
        <h2>Total Revenue</h2>
        <div class="amount">₹{{totalRevenue}}</div>
      </div>
      <div class="info-card">
        <div class="info-row">
          <span class="label">Total Bookings:</span>
          <span class="value">{{totalBookings}}</span>
        </div>
        <div class="info-row">
          <span class="label">Confirmed Bookings:</span>
          <span class="value" style="color: #10B981;">{{confirmedBookings}}</span>
        </div>
        <div class="info-row">
          <span class="label">Pending Bookings:</span>
          <span class="value" style="color: #F9A826;">{{pendingBookings}}</span>
        </div>
        <div class="info-row">
          <span class="label">Cancelled Bookings:</span>
          <span class="value" style="color: #EF4444;">{{cancelledBookings}}</span>
        </div>
      </div>
      <div class="button-wrapper">
        <a href="{{frontendUrl}}/vendor/dashboard" class="button">View Dashboard</a>
      </div>
      <p style="margin-top: 30px;">Thank you for being a valued partner with ShubhVenue!</p>
      <p style="margin-top: 30px;">Best regards,<br><strong>The ShubhVenue Team</strong></p>
    </div>
    <div class="footer">
      <p>© 2024 ShubhVenue. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
    description: 'Monthly revenue report email sent to vendor',
    variables: [
      { name: 'vendorName', description: 'Vendor name', example: 'John Vendor' },
      { name: 'monthName', description: 'Month name', example: 'January' },
      { name: 'year', description: 'Year', example: '2024' },
      { name: 'totalRevenue', description: 'Total revenue', example: '50000' },
      { name: 'totalBookings', description: 'Total bookings', example: '10' },
      { name: 'confirmedBookings', description: 'Confirmed bookings', example: '8' },
      { name: 'pendingBookings', description: 'Pending bookings', example: '1' },
      { name: 'cancelledBookings', description: 'Cancelled bookings', example: '1' },
      { name: 'frontendUrl', description: 'Frontend URL', example: 'http://localhost:5175' }
    ],
    isActive: true,
  },
  {
    name: 'Monthly Revenue Admin',
    type: 'monthly_revenue_admin',
    subject: 'Monthly Revenue Report - {{monthName}} {{year}}',
    html: `<!DOCTYPE html>
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
    .info-row { margin: 12px 0; padding: 10px 0; border-bottom: 1px solid #E5E7EB; display: flex; justify-content: space-between; }
    .info-row:last-child { border-bottom: none; }
    .label { font-weight: 600; color: #8F61EF; }
    .value { color: #1F2937; font-weight: 600; }
    .revenue-highlight { background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(143, 97, 239, 0.1) 100%); border-left: 4px solid #10B981; padding: 20px; margin: 30px 0; border-radius: 8px; }
    .revenue-highlight h2 { color: #10B981; font-size: 24px; margin-bottom: 12px; }
    .revenue-highlight .amount { font-size: 32px; font-weight: 700; color: #10B981; }
    .button-wrapper { text-align: center; margin: 30px 0; }
    .button { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #8F61EF 0%, #F9A826 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(143, 97, 239, 0.3); }
    .footer { background-color: #F9FAFB; padding: 30px; text-align: center; border-top: 1px solid #E5E7EB; }
    .footer p { color: #6B7280; font-size: 14px; margin-bottom: 8px; }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="header">
      <img src="{{frontendUrl}}/image/venuebook.png" alt="ShubhVenue Logo" class="logo" />
      <h1>Monthly Revenue Report</h1>
    </div>
    <div class="content">
      <p>Dear Admin,</p>
      <p>Here's the monthly revenue report for <strong>{{monthName}} {{year}}</strong>:</p>
      <div class="revenue-highlight">
        <h2>Total Revenue</h2>
        <div class="amount">₹{{totalRevenue}}</div>
      </div>
      <div class="info-card">
        <div class="info-row">
          <span class="label">Booking Revenue:</span>
          <span class="value">₹{{bookingRevenue}}</span>
        </div>
        <div class="info-row">
          <span class="label">Plan Subscription Revenue:</span>
          <span class="value">₹{{planRevenue}}</span>
        </div>
        <div class="info-row">
          <span class="label">Total Bookings:</span>
          <span class="value">{{totalBookings}}</span>
        </div>
        <div class="info-row">
          <span class="label">Confirmed Bookings:</span>
          <span class="value" style="color: #10B981;">{{confirmedBookings}}</span>
        </div>
        <div class="info-row">
          <span class="label">Pending Bookings:</span>
          <span class="value" style="color: #F9A826;">{{pendingBookings}}</span>
        </div>
        <div class="info-row">
          <span class="label">Cancelled Bookings:</span>
          <span class="value" style="color: #EF4444;">{{cancelledBookings}}</span>
        </div>
        <div class="info-row">
          <span class="label">Plan Subscriptions:</span>
          <span class="value">{{planSubscriptions}}</span>
        </div>
        <div class="info-row">
          <span class="label">Total Vendors:</span>
          <span class="value">{{totalVendors}}</span>
        </div>
        <div class="info-row">
          <span class="label">Active Vendors:</span>
          <span class="value" style="color: #10B981;">{{activeVendors}}</span>
        </div>
      </div>
      <div class="button-wrapper">
        <a href="{{frontendUrl}}/admin/dashboard" class="button">View Dashboard</a>
      </div>
      <p style="margin-top: 30px;">Best regards,<br><strong>The ShubhVenue Team</strong></p>
    </div>
    <div class="footer">
      <p>© 2024 ShubhVenue. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
    description: 'Monthly revenue report email sent to admin',
    variables: [
      { name: 'monthName', description: 'Month name', example: 'January' },
      { name: 'year', description: 'Year', example: '2024' },
      { name: 'totalRevenue', description: 'Total revenue', example: '500000' },
      { name: 'bookingRevenue', description: 'Booking revenue', example: '400000' },
      { name: 'planRevenue', description: 'Plan subscription revenue', example: '100000' },
      { name: 'totalBookings', description: 'Total bookings', example: '50' },
      { name: 'confirmedBookings', description: 'Confirmed bookings', example: '40' },
      { name: 'pendingBookings', description: 'Pending bookings', example: '5' },
      { name: 'cancelledBookings', description: 'Cancelled bookings', example: '5' },
      { name: 'planSubscriptions', description: 'Plan subscriptions', example: '10' },
      { name: 'totalVendors', description: 'Total vendors', example: '25' },
      { name: 'activeVendors', description: 'Active vendors', example: '20' },
      { name: 'frontendUrl', description: 'Frontend URL', example: 'http://localhost:5175' }
    ],
    isActive: true,
  },
  {
    name: 'Test Email',
    type: 'test_email',
    subject: 'Test Email - ShubhVenue Email Configuration',
    html: `<!DOCTYPE html>
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
      <img src="{{frontendUrl}}/image/venuebook.png" alt="ShubhVenue Logo" class="logo" />
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
          <span class="value">{{smtpHost}}</span>
        </div>
        <div class="info-row">
          <span class="label">SMTP Port:</span>
          <span class="value">{{smtpPort}}</span>
        </div>
        <div class="info-row">
          <span class="label">Security:</span>
          <span class="value">{{smtpSecurity}}</span>
        </div>
        <div class="info-row">
          <span class="label">From Address:</span>
          <span class="value">{{fromAddress}}</span>
        </div>
        <div class="info-row">
          <span class="label">Test Date:</span>
          <span class="value">{{testDate}}</span>
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
</html>`,
    description: 'Test email template for verifying email configuration',
    variables: [
      { name: 'frontendUrl', description: 'Frontend URL', example: 'http://localhost:5175' },
      { name: 'smtpHost', description: 'SMTP host', example: 'smtp.zeptomail.in' },
      { name: 'smtpPort', description: 'SMTP port', example: '465' },
      { name: 'smtpSecurity', description: 'SMTP security', example: 'SSL' },
      { name: 'fromAddress', description: 'From email address', example: 'no-reply@synilogicitsolution.com' },
      { name: 'testDate', description: 'Test date', example: '15 January 2024' }
    ],
    isActive: true,
  },
];

async function seedEmailTemplates() {
  try {
    console.log('🔗 Connecting to database...');
    await connectToDatabase();
    console.log('✅ Database connected');

    console.log('\n📧 Seeding email templates...\n');

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const template of defaultTemplates) {
      try {
        // Check if template with same type already exists
        const existing = await EmailTemplate.findOne({ type: template.type });

        if (existing) {
          // Update existing template with new design
          existing.name = template.name;
          existing.html = template.html;
          existing.subject = template.subject || existing.subject || '';
          existing.description = template.description || existing.description || '';
          existing.variables = template.variables || existing.variables || [];
          existing.isActive = template.isActive !== undefined ? template.isActive : existing.isActive;
          await existing.save();
          console.log(`   ✅ Updated: ${template.name} (${template.type})`);
          updated++;
        } else {
          // Create new template
          await EmailTemplate.create(template);
          console.log(`   ✅ Created: ${template.name} (${template.type})`);
          created++;
        }
      } catch (error) {
        console.error(`   ❌ Error processing ${template.name}:`, error.message);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Created: ${created}`);
    console.log(`   🔄 Updated: ${updated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   📧 Total: ${defaultTemplates.length}`);

    console.log('\n✅ Email templates seeding completed!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding email templates:', error);
    process.exit(1);
  }
}

seedEmailTemplates();

