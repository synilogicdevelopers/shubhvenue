# Customer Welcome Email Testing Guide

## Problem
Customer welcome email is not being sent when a new customer registers.

## Testing Steps

### 1. Test Email Service Directly
Run the test script to verify email sending works:
```bash
cd backend
node test_customer_welcome_email.js your-email@example.com "Your Name"
```

### 2. Check Backend Logs
When a customer registers, you should see these logs:
```
✅ User registered successfully
   User Role: customer
📧 Checking user role for email sending...
   Is customer? true
📧 Customer detected, sending customer welcome email...
   Email service imported successfully
📧 Preparing to send customer welcome email...
📧 sendEmail function called
📧 Getting email configuration...
📧 Creating nodemailer transporter...
📧 Verifying transporter connection...
   ✅ Transporter connection verified successfully
📤 Attempting to send email...
✅✅✅ Email sent successfully!
✅✅✅ Customer welcome email sent successfully!
```

### 3. Common Issues

#### Issue 1: Email Configuration Not Set
**Check:** Go to Admin Settings → Email Configuration
**Fix:** Ensure all SMTP settings are configured correctly

#### Issue 2: Sender Email Not Verified
**Error:** `553 Sender is not allowed to relay emails`
**Fix:** 
1. Go to ZeptoMail dashboard
2. Verify the sender email: `no-reply@synilogicitsolution.com`
3. Check email for verification link

#### Issue 3: Email Going to Spam
**Check:** Check spam/junk folder
**Fix:** 
- Ensure sender email is verified
- Check email content (no spam trigger words)
- Verify SPF/DKIM records in ZeptoMail

#### Issue 4: No Logs Appearing
**Check:** 
- Backend server is running
- Registration endpoint is being called
- User role is 'customer' (not 'vendor')

### 4. Verify Registration Flow

1. **Customer Registration:**
   - Frontend sends: `POST /api/auth/register` with `role: 'customer'`
   - Backend creates user with `role: 'customer'`
   - Backend calls `sendCustomerWelcomeEmail(user)`
   - Email should be sent

2. **Check Registration Response:**
   - Registration should succeed even if email fails
   - Check backend logs for email status

### 5. Debug Commands

```bash
# Test email service directly
cd backend
node test_customer_welcome_email.js test@example.com "Test User"

# Check email configuration
node verify_email_setup.js

# Check MongoDB for email config
node -e "import('./src/models/EmailConfig.js').then(m => m.default.getConfig().then(c => console.log(JSON.stringify(c, null, 2))))"
```

### 6. Expected Behavior

✅ **Success Case:**
- Customer registers
- Backend logs show email sending process
- Email arrives in customer's inbox (or spam folder)
- Success message in logs: `✅✅✅ Customer welcome email sent successfully!`

❌ **Failure Case:**
- Customer registers
- Backend logs show error
- Error message in logs: `❌❌❌ Failed to send customer welcome email`
- Registration still succeeds (email failure doesn't block registration)

## Current Configuration

- **SMTP Host:** smtp.zeptomail.in
- **Port:** 465
- **Security:** SSL
- **From Email:** no-reply@synilogicitsolution.com
- **From Name:** ShubhVenue

## Next Steps

1. Run test script with your email
2. Check backend logs during customer registration
3. Verify email configuration in admin settings
4. Check spam folder if email doesn't arrive
5. Verify sender email in ZeptoMail dashboard

