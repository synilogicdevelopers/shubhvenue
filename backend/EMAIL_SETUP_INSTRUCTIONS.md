# Email Setup Instructions - ZeptoMail

## Current Error
```
553 Sender is not allowed to relay emails
```

## Solution

ZeptoMail requires the **sender email address (FROM)** to be verified in their dashboard before you can send emails.

### Important Clarification:
- ✅ **Only SENDER email needs verification** - Your configured sender email (one time)
- ✅ **Recipient emails (TO) don't need verification** - You can send to any email address
- ✅ **Once verified, you can send emails to ANY email** - vendors, admins, customers, etc.
- ❌ **You DON'T need to verify every new user's email** - Only the sender email is verified once

### Steps to Fix:

1. **Login to ZeptoMail Dashboard**
   - Go to: https://www.zeptomail.com/
   - Login with your account

2. **Add and Verify Sender Email**
   - Go to "Senders" or "Verified Senders" section
   - Add your sender email address (configured in admin settings)
   - Verify the email by clicking the verification link sent to that email

3. **After Verification**
   - The email will be marked as "Verified"
   - You can now send emails using this address

4. **Test Again**
   ```bash
   cd backend
   node test_email.js
   ```

## Alternative: Use ZeptoMail API

If SMTP continues to have issues, you can use ZeptoMail's REST API instead:

1. Get your API token from ZeptoMail dashboard
2. Use their API endpoint: `https://api.zeptomail.com/v1.1/email`

## Current Configuration

- **SMTP Host**: smtp.zeptomail.in
- **Port**: 465
- **Security**: SSL
- **Username**: emailapikey
- **From Email**: Configure in Admin Settings → Email Configuration (needs verification in ZeptoMail)

## Quick Check Setup

Run this to check your current email configuration:
```bash
cd backend
node verify_email_setup.js
```

This will show:
- Current email configuration
- Step-by-step verification instructions
- What to do after verification

## Test Email Endpoint

Once verified, you can also test via API:
```
POST /api/admin/email-config/test
Headers: Authorization: Bearer <admin_token>
Body: { "email": "your-test-email@example.com" }
```

