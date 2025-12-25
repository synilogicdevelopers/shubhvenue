# Welcome Email Flow - Kaise Kaam Karta Hai

## 📧 Complete Flow Diagram

```
Customer Registration
        ↓
POST /api/auth/register
        ↓
User Created in Database
        ↓
Check User Role
        ↓
┌─────────────────────┐
│  Role = 'customer'? │
└─────────────────────┘
        ↓ YES
        ↓
sendCustomerWelcomeEmail(user)
        ↓
getTransporter() → EmailConfig se SMTP settings
        ↓
sendEmail() → Nodemailer se email send
        ↓
Email Sent Successfully ✅
        ↓
Registration Complete
```

## 🔄 Step-by-Step Process

### Step 1: Customer Registration
**File:** `backend/src/controllers/auth.controller.js`

```javascript
// User register karta hai
POST /api/auth/register
{
  name: "John Doe",
  email: "john@example.com",
  password: "password123",
  role: "customer"  // Default role
}
```

### Step 2: User Save Hota Hai
```javascript
const user = new User({
  name,
  email: email.toLowerCase(),
  password: hashedPassword,
  role: 'customer'
});
await user.save();
```

### Step 3: Role Check
```javascript
if (user.role === 'customer') {
  // Customer welcome email bhejo
  const welcomeResult = await sendCustomerWelcomeEmail(user);
}
```

### Step 4: Email Service Call
**File:** `backend/src/utils/emailService.js`

```javascript
export async function sendCustomerWelcomeEmail(user) {
  // Email template banata hai
  const html = `...welcome email HTML...`;
  
  // sendEmail function call karta hai
  const result = await sendEmail({
    to: user.email,
    subject: 'Welcome to ShubhVenue - Registration Successful!',
    html: html
  });
  
  return result;
}
```

### Step 5: SMTP Configuration
```javascript
async function getTransporter() {
  // EmailConfig se settings lete hain
  const config = await EmailConfig.getConfig();
  
  // Nodemailer transporter banate hain
  const transporter = nodemailer.createTransport({
    host: config.smtpHost,        // smtp.zeptomail.in
    port: config.smtpPort,        // 465
    secure: true,                 // SSL
    auth: {
      user: config.smtpUsername,  // emailapikey
      pass: config.smtpPassword   // API key
    }
  });
  
  return { transporter, config };
}
```

### Step 6: Email Send
```javascript
export async function sendEmail({ to, subject, html }) {
  const { transporter, config } = await getTransporter();
  
  const mailOptions = {
    from: `"ShubhVenue" <no-reply@synilogicitsolution.com>`,
    to: user.email,
    subject: subject,
    html: html
  };
  
  // Email send karta hai
  const info = await transporter.sendMail(mailOptions);
  
  return { success: true, messageId: info.messageId };
}
```

## 📋 Files Involved

### 1. Registration Controller
**File:** `backend/src/controllers/auth.controller.js`
- User registration handle karta hai
- Role check karta hai
- Customer welcome email trigger karta hai

### 2. Email Service
**File:** `backend/src/utils/emailService.js`
- `sendCustomerWelcomeEmail()` - Customer welcome email function
- `sendEmail()` - Generic email sending function
- `getTransporter()` - SMTP configuration

### 3. Email Configuration Model
**File:** `backend/src/models/EmailConfig.js`
- SMTP settings store karta hai
- ZeptoMail configuration

## 🎯 Different User Roles

### Customer Registration
```javascript
role: 'customer'
→ sendCustomerWelcomeEmail(user)
→ Welcome email with features list
```

### Vendor Registration
```javascript
role: 'vendor'
→ sendVendorWelcomeEmail(user)        // Vendor ko welcome email
→ sendVendorRegistrationEmailToAdmin(user)  // Admin ko notification
→ Vendor status: 'pending'
```

## 📧 Email Content

### Customer Welcome Email Includes:
- ✅ Welcome message
- ✅ Account creation confirmation
- ✅ Features list (browse venues, book, save favorites, manage bookings)
- ✅ "Start Exploring Venues" button
- ✅ Support contact information

## 🔍 Logs Me Kya Dikhega

### Success Case:
```
✅ User registered successfully
   User Role: customer
📧 Customer detected, sending customer welcome email...
📧 Preparing to send customer welcome email...
📧 Getting email configuration...
📧 Creating nodemailer transporter...
📧 Verifying transporter connection...
   ✅ Transporter connection verified successfully
📤 Attempting to send email...
✅✅✅ Email sent successfully!
✅✅✅ Customer welcome email sent successfully!
   Message ID: <message-id>
```

### Error Case:
```
❌❌❌ Failed to send customer welcome email
   Error: [error message]
```

## ⚙️ Configuration

### SMTP Settings (EmailConfig Model):
- **Host:** smtp.zeptomail.in
- **Port:** 465
- **Security:** SSL
- **Username:** emailapikey
- **From Email:** no-reply@synilogicitsolution.com
- **From Name:** ShubhVenue

### Environment Variables:
- `FRONTEND_URL` - Email me button ke liye URL
- `JWT_SECRET` - Token generation ke liye

## 🧪 Testing

### Test Script:
```bash
cd backend
node test_customer_welcome_email.js customer@example.com "John Doe"
```

### Manual Test:
1. Customer register karo
2. Backend logs check karo
3. Email inbox check karo (spam folder bhi)

## ⚠️ Important Points

1. **Email Failure Doesn't Block Registration**
   - Agar email fail ho jaye, registration phir bhi successful hota hai
   - Error logs me dikh jayega

2. **Email Configuration Required**
   - Admin settings me email config set hona chahiye
   - Sender email ZeptoMail me verified hona chahiye

3. **Role-Based Emails**
   - Customer → Welcome email
   - Vendor → Welcome email + Admin notification
   - Other roles → No email

4. **Async Process**
   - Email sending async hai
   - Registration response immediately return hota hai

## 🐛 Common Issues

1. **Email Not Sending**
   - Check SMTP configuration
   - Verify sender email in ZeptoMail
   - Check backend logs for errors

2. **Email Going to Spam**
   - Sender email verify karo
   - Check email content
   - Verify SPF/DKIM records

3. **No Logs Appearing**
   - Backend server running hai?
   - Registration endpoint call ho raha hai?
   - User role 'customer' hai?

