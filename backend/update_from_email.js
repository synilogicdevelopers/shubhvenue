import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectToDatabase } from './src/config/db.js';
import EmailConfig from './src/models/EmailConfig.js';

const FROM_EMAIL = 'synilogicflutterdevelopers@gmail.com';
const FROM_NAME = 'ShubhVenue';

async function updateFromEmail() {
  try {
    console.log('🔌 Connecting to database...');
    await connectToDatabase();
    console.log('✅ Database connected\n');

    console.log('📝 Updating Email From Address...\n');
    console.log('   New From Email:', FROM_EMAIL);
    console.log('   From Name:', FROM_NAME);
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
        smtpAddress: FROM_EMAIL,
        emailFromAddress: FROM_EMAIL,
        emailFromName: FROM_NAME,
        replyEmailAddress: FROM_EMAIL,
        replyEmailName: FROM_NAME,
      });
      console.log('✅ New configuration created\n');
    } else {
      console.log('Updating existing configuration...');
      config.smtpAddress = FROM_EMAIL;
      config.emailFromAddress = FROM_EMAIL;
      config.emailFromName = FROM_NAME;
      config.replyEmailAddress = FROM_EMAIL;
      config.replyEmailName = FROM_NAME;
      await config.save();
      console.log('✅ Configuration updated\n');
    }

    console.log('Updated Email Configuration:');
    console.log('─────────────────────────────────────────');
    console.log('SMTP Host:', config.smtpHost);
    console.log('SMTP Port:', config.smtpPort);
    console.log('SMTP Security:', config.smtpSecurity);
    console.log('From Email:', config.emailFromAddress);
    console.log('From Name:', config.emailFromName);
    console.log('Reply Email:', config.replyEmailAddress || 'Not set');
    console.log('─────────────────────────────────────────\n');

    console.log('✅ Email configuration updated successfully!');
    console.log('📧 Now using:', FROM_EMAIL, 'as sender email\n');
    
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌❌❌ Error:', error.message);
    console.error('   Stack:', error.stack);
    process.exit(1);
  }
}

console.log('🚀 Updating Email From Address...\n');
updateFromEmail();

