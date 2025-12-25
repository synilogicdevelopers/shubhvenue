import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectToDatabase } from './src/config/db.js';
import EmailConfig from './src/models/EmailConfig.js';

async function updateEmailConfig() {
  try {
    console.log('🔌 Connecting to database...');
    await connectToDatabase();
    console.log('✅ Database connected\n');

    console.log('📝 Updating Email Configuration...\n');
    
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
        smtpAddress: '',
        emailFromAddress: '',
        emailFromName: 'ShubhVenue',
        replyEmailAddress: '',
        replyEmailName: 'ShubhVenue',
      });
      console.log('✅ New configuration created\n');
    } else {
      console.log('Updating existing configuration...');
      config.smtpUsername = 'emailapikey';
      config.smtpPassword = 'PHtE6r1eRe662md69BdR4qW4EsXxNo99r+llKlJEsocXXPEDH00Hoo1/ljHlrxwuBPJBFfDKyNg9suua5biHJTm8YD4fXGqyqK3sx/VYSPOZsbq6x00euFoTc0fUUYfset5s1yTeu9vdNA==';
      config.smtpHost = 'smtp.zeptomail.in';
      config.mailDriver = 'smtp';
      config.smtpPort = 465;
      config.smtpSecurity = 'ssl';
      config.smtpAuthDomain = 'true';
      config.smtpAddress = '';
      config.emailFromAddress = '';
      config.emailFromName = 'ShubhVenue';
      config.replyEmailAddress = '';
      config.replyEmailName = 'ShubhVenue';
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

    console.log('⚠️  Next Step: Verify Email in ZeptoMail Dashboard\n');
    console.log('   1. Go to: https://www.zeptomail.com/');
    console.log('   2. Login and go to "Senders" section');
    console.log('   3. Add: synilogicflutterdevelopers@gmail.com');
    console.log('   4. Check Gmail for verification email');
    console.log('   5. Click verification link');
    console.log('   6. Then run: node test_email.js\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

updateEmailConfig();

