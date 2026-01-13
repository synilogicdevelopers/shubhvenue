import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Venue from '../models/Venue.js';
import User from '../models/User.js';
import VendorPlanSubscription from '../models/VendorPlanSubscription.js';
import { sendEmail, getAdminEmails } from './emailService.js';

/**
 * Calculate monthly revenue for a vendor
 */
export async function calculateVendorMonthlyRevenue(vendorId, year, month) {
  try {
    // Get vendor venues
    const vendorVenues = await Venue.find({ vendorId }).select('_id');
    const venueIds = vendorVenues.map(v => v._id.toString());

    if (venueIds.length === 0) {
      return {
        revenue: 0,
        bookings: 0,
        confirmedBookings: 0,
        cancelledBookings: 0,
        pendingBookings: 0
      };
    }

    // Calculate date range for the month
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    // Get all bookings for vendor venues
    const allBookings = await Booking.find({
      venueId: { $in: venueIds },
      adminApproved: true
    });

    // Filter bookings for the month
    const monthlyBookings = allBookings.filter(booking => {
      if (booking.dateFrom && booking.dateTo) {
        const dateFrom = new Date(booking.dateFrom);
        const dateTo = new Date(booking.dateTo);
        return (dateFrom <= endOfMonth && dateTo >= startOfMonth);
      }
      if (booking.date) {
        const bookingDate = new Date(booking.date);
        return bookingDate >= startOfMonth && bookingDate <= endOfMonth;
      }
      const bookingDate = new Date(booking.createdAt || booking.updatedAt);
      return bookingDate >= startOfMonth && bookingDate <= endOfMonth;
    });

    // Calculate revenue from confirmed bookings
    const confirmedBookings = monthlyBookings.filter(b => b.status === 'confirmed');
    const revenue = confirmedBookings.reduce((sum, booking) => {
      return sum + (Number(booking.totalAmount) || 0);
    }, 0);

    return {
      revenue,
      bookings: monthlyBookings.length,
      confirmedBookings: confirmedBookings.length,
      cancelledBookings: monthlyBookings.filter(b => b.status === 'cancelled').length,
      pendingBookings: monthlyBookings.filter(b => b.status === 'pending').length
    };
  } catch (error) {
    console.error('Error calculating vendor monthly revenue:', error);
    return {
      revenue: 0,
      bookings: 0,
      confirmedBookings: 0,
      cancelledBookings: 0,
      pendingBookings: 0
    };
  }
}

/**
 * Calculate monthly revenue for admin (all vendors)
 */
export async function calculateAdminMonthlyRevenue(year, month) {
  try {
    // Calculate date range for the month
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    // Get all bookings
    const allBookings = await Booking.find({
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    });

    // Get all plan subscriptions
    const planSubscriptions = await VendorPlanSubscription.find({
      createdAt: { $gte: startOfMonth, $lte: endOfMonth },
      paymentStatus: 'completed'
    });

    // Calculate booking revenue
    const bookingRevenue = allBookings.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);
    
    // Calculate plan subscription revenue
    const planRevenue = planSubscriptions.reduce((sum, sub) => sum + (Number(sub.amountPaid) || 0), 0);
    
    const totalRevenue = bookingRevenue + planRevenue;

    // Get vendor count
    const vendorCount = await User.countDocuments({ role: 'vendor' });

    // Get active vendors (vendors with at least one venue)
    const activeVendors = await Venue.distinct('vendorId');

    return {
      revenue: totalRevenue,
      bookingRevenue,
      planRevenue,
      bookings: allBookings.length,
      confirmedBookings: allBookings.filter(b => b.status === 'confirmed').length,
      cancelledBookings: allBookings.filter(b => b.status === 'cancelled').length,
      pendingBookings: allBookings.filter(b => b.status === 'pending').length,
      planSubscriptions: planSubscriptions.length,
      totalVendors: vendorCount,
      activeVendors: activeVendors.length
    };
  } catch (error) {
    console.error('Error calculating admin monthly revenue:', error);
    return {
      revenue: 0,
      bookingRevenue: 0,
      planRevenue: 0,
      bookings: 0,
      confirmedBookings: 0,
      cancelledBookings: 0,
      pendingBookings: 0,
      planSubscriptions: 0,
      totalVendors: 0,
      activeVendors: 0
    };
  }
}

/**
 * Send monthly revenue email to vendor
 */
export async function sendMonthlyRevenueEmailToVendor(vendor, revenueData, year, month) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5175';
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  const monthName = monthNames[month - 1];

  const subject = `Monthly Revenue Report - ${monthName} ${year}`;
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
          <img src="${frontendUrl}/image/venuebook.png" alt="ShubhVenue Logo" class="logo" />
          <h1>Monthly Revenue Report</h1>
        </div>
        <div class="content">
          <p>Dear ${vendor.name},</p>
          <p>Here's your monthly revenue report for <strong>${monthName} ${year}</strong>:</p>
          <div class="revenue-highlight">
            <h2>Total Revenue</h2>
            <div class="amount">₹${revenueData.revenue.toLocaleString('en-IN')}</div>
          </div>
          <div class="info-card">
            <div class="info-row">
              <span class="label">Total Bookings:</span>
              <span class="value">${revenueData.bookings}</span>
            </div>
            <div class="info-row">
              <span class="label">Confirmed Bookings:</span>
              <span class="value" style="color: #10B981;">${revenueData.confirmedBookings}</span>
            </div>
            <div class="info-row">
              <span class="label">Pending Bookings:</span>
              <span class="value" style="color: #F9A826;">${revenueData.pendingBookings}</span>
            </div>
            <div class="info-row">
              <span class="label">Cancelled Bookings:</span>
              <span class="value" style="color: #EF4444;">${revenueData.cancelledBookings}</span>
            </div>
          </div>
          <div class="button-wrapper">
            <a href="${frontendUrl}/vendor/dashboard" class="button">View Dashboard</a>
          </div>
          <p style="margin-top: 30px;">Thank you for being a valued partner with ShubhVenue!</p>
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
      console.log(`✅ Monthly revenue email sent successfully to vendor: ${vendor.email}`);
    } else {
      console.error(`❌ Failed to send monthly revenue email to vendor: ${vendor.email}`, result?.error);
    }
    
    return result || { success: false, error: 'Unknown error occurred' };
  } catch (error) {
    console.error('❌ Exception in sendMonthlyRevenueEmailToVendor:', error);
    return { success: false, error: error.message || 'Exception occurred while sending email' };
  }
}

/**
 * Send monthly revenue email to admin
 */
export async function sendMonthlyRevenueEmailToAdmin(revenueData, year, month, adminEmails) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5175';
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  const monthName = monthNames[month - 1];

  const subject = `Monthly Revenue Report - ${monthName} ${year}`;
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
          <img src="${frontendUrl}/image/venuebook.png" alt="ShubhVenue Logo" class="logo" />
          <h1>Monthly Revenue Report</h1>
        </div>
        <div class="content">
          <p>Dear Admin,</p>
          <p>Here's the monthly revenue report for <strong>${monthName} ${year}</strong>:</p>
          <div class="revenue-highlight">
            <h2>Total Revenue</h2>
            <div class="amount">₹${revenueData.revenue.toLocaleString('en-IN')}</div>
          </div>
          <div class="info-card">
            <div class="info-row">
              <span class="label">Booking Revenue:</span>
              <span class="value">₹${revenueData.bookingRevenue.toLocaleString('en-IN')}</span>
            </div>
            <div class="info-row">
              <span class="label">Plan Subscription Revenue:</span>
              <span class="value">₹${revenueData.planRevenue.toLocaleString('en-IN')}</span>
            </div>
            <div class="info-row">
              <span class="label">Total Bookings:</span>
              <span class="value">${revenueData.bookings}</span>
            </div>
            <div class="info-row">
              <span class="label">Confirmed Bookings:</span>
              <span class="value" style="color: #10B981;">${revenueData.confirmedBookings}</span>
            </div>
            <div class="info-row">
              <span class="label">Pending Bookings:</span>
              <span class="value" style="color: #F9A826;">${revenueData.pendingBookings}</span>
            </div>
            <div class="info-row">
              <span class="label">Cancelled Bookings:</span>
              <span class="value" style="color: #EF4444;">${revenueData.cancelledBookings}</span>
            </div>
            <div class="info-row">
              <span class="label">Plan Subscriptions:</span>
              <span class="value">${revenueData.planSubscriptions}</span>
            </div>
            <div class="info-row">
              <span class="label">Total Vendors:</span>
              <span class="value">${revenueData.totalVendors}</span>
            </div>
            <div class="info-row">
              <span class="label">Active Vendors:</span>
              <span class="value" style="color: #10B981;">${revenueData.activeVendors}</span>
            </div>
          </div>
          <div class="button-wrapper">
            <a href="${frontendUrl}/admin/dashboard" class="button">View Dashboard</a>
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
      to: adminEmails,
      subject,
      html,
    });
    
    if (result && result.success) {
      console.log(`✅ Monthly revenue email sent successfully to admin`);
    } else {
      console.error(`❌ Failed to send monthly revenue email to admin:`, result?.error);
    }
    
    return result || { success: false, error: 'Unknown error occurred' };
  } catch (error) {
    console.error('❌ Exception in sendMonthlyRevenueEmailToAdmin:', error);
    return { success: false, error: error.message || 'Exception occurred while sending email' };
  }
}

/**
 * Send monthly revenue emails to all vendors and admin
 */
export async function sendMonthlyRevenueEmails() {
  try {
    console.log('📧 Starting monthly revenue email process...');
    
    // Get previous month (month just completed)
    const now = new Date();
    const previousMonth = now.getMonth(); // 0-indexed (0 = January)
    const year = now.getFullYear();
    
    // If current month is January, previous month was December of last year
    const reportMonth = previousMonth === 0 ? 12 : previousMonth;
    const reportYear = previousMonth === 0 ? year - 1 : year;

    console.log(`📊 Calculating revenue for ${reportMonth}/${reportYear}`);

    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      const { connectToDatabase } = await import('../config/db.js');
      await connectToDatabase();
    }

    // Get all vendors
    const vendors = await User.find({ role: 'vendor' }).select('name email _id');
    console.log(`📧 Found ${vendors.length} vendors to send emails to`);

    // Send emails to all vendors
    let vendorEmailsSent = 0;
    for (const vendor of vendors) {
      try {
        const revenueData = await calculateVendorMonthlyRevenue(vendor._id, reportYear, reportMonth);
        
        // Only send email if vendor has revenue or bookings
        if (revenueData.revenue > 0 || revenueData.bookings > 0) {
          await sendMonthlyRevenueEmailToVendor(vendor, revenueData, reportYear, reportMonth);
          vendorEmailsSent++;
        }
      } catch (error) {
        console.error(`❌ Error sending email to vendor ${vendor.email}:`, error);
      }
    }

    // Calculate and send admin email
    try {
      const adminRevenueData = await calculateAdminMonthlyRevenue(reportYear, reportMonth);
      const adminEmails = await getAdminEmails();
      
      if (adminEmails && adminEmails.length > 0) {
        await sendMonthlyRevenueEmailToAdmin(adminRevenueData, reportYear, reportMonth, adminEmails);
        console.log(`✅ Admin monthly revenue email sent`);
      }
    } catch (error) {
      console.error('❌ Error sending admin monthly revenue email:', error);
    }

    console.log(`✅ Monthly revenue email process completed. Sent ${vendorEmailsSent} vendor emails.`);
    return { success: true, vendorEmailsSent };
  } catch (error) {
    console.error('❌ Error in sendMonthlyRevenueEmails:', error);
    return { success: false, error: error.message };
  }
}

