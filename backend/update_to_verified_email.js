import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectToDatabase } from './src/config/db.js';
import EmailConfig from './src/models/EmailConfig.js';

const VERIFIED_EMAIL = 'no-reply@synilogicitsolution.com';

async function updateToVerifiedEmail() {
  try {
    console.log('🔌 Connecting to database...');
    await connectToDatabase();
    console.log('✅ Database connected\n');

    console.log('📝 Updating to ZeptoMail verified email:', VERIFIED_EMAIL);
    console.log('─────────────────────────────────────────\n');
    
    let config = await EmailConfig.findOne();
    
    if (!config) {
      console.log('Creating new email configuration...');
      config = await EmailConfig.create({
        smtpUsername: 'emailapikey',
        smtpPassword: 'PHtE6r1eRe662md69BdR4qW4EsXxNo99r+llKlJEsocXXPEDH00Hoo1/ljHlrxwuBPJBFfDKyNg9suua5biHJTm8YD4fXGqyqK3sx/VYSPOZsbq6x00euFoTc0fUUYfset5s1yTeu9vdNA==',
        smtpHost: 'smtp.zeptomail.in',
        mailDriver: 'smtp',
        smtpPort: 465,
        smtpSecurity: 'ssl',
        smtpAuthDomain: 'true',
        smtpAddress: VERIFIED_EMAIL,
        emailFromAddress: VERIFIED_EMAIL,
        emailFromName: 'ShubhVenue',
        replyEmailAddress: VERIFIED_EMAIL,
        replyEmailName: 'ShubhVenue',
      });
      console.log('✅ New configuration created\n');
    } else {
      console.log('Updating existing configuration...');
      config.smtpAddress = VERIFIED_EMAIL;
      config.emailFromAddress = VERIFIED_EMAIL;
      config.replyEmailAddress = VERIFIED_EMAIL;
      await config.save();
      console.log('✅ Configuration updated\n');
    }

    console.log('Updated Email Configuration:');
    console.log('─────────────────────────────────────────');
    console.log('SMTP Host:', config.smtpHost);
    console.log('SMTP Port:', config.smtpPort);
    console.log('SMTP Security:', config.smtpSecurity);
    console.log('SMTP Username:', config.smtpUsername);
    console.log('From Email:', config.emailFromAddress);
    console.log('From Name:', config.emailFromName);
    console.log('Reply Email:', config.replyEmailAddress);
    console.log('─────────────────────────────────────────\n');

    console.log('✅ Email configured with ZeptoMail verified email!');
    console.log('   This email is already verified in ZeptoMail dashboard\n');
    console.log('📧 Now you can test:');
    console.log('   node test_email.js\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

updateToVerifiedEmail();

