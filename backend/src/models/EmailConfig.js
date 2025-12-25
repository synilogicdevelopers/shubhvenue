import mongoose from 'mongoose';

const emailConfigSchema = new mongoose.Schema(
  {
    smtpUsername: { type: String, required: true },
    smtpPassword: { type: String, required: true },
    smtpHost: { type: String, required: true, default: 'smtp.zeptomail.in' },
    mailDriver: { type: String, required: true, default: 'smtp' },
    smtpPort: { type: Number, required: true, default: 465 },
    smtpSecurity: { type: String, required: true, default: 'ssl' },
    smtpAuthDomain: { type: String, default: 'true' },
    smtpAddress: { type: String, required: true },
    emailFromAddress: { type: String, required: true },
    emailFromName: { type: String, required: true },
    replyEmailAddress: { type: String },
    replyEmailName: { type: String },
    adminNotificationEmail: { type: String }, // Email where vendor registration notifications are sent
  },
  { timestamps: true }
);

// Only one email config should exist
emailConfigSchema.statics.getConfig = async function() {
  let config = await this.findOne();
  if (!config) {
    // Create default config with ZeptoMail settings
    config = await this.create({
      smtpUsername: 'emailapikey',
      smtpPassword: 'PHtE6r1eRe662md69BdR4qW4EsXxNo99r+llKlJEsocXXPEDH00Hoo1/ljHlrxwuBPJBFfDKyNg9suua5biHJTm8YD4fXGqyqK3sx/VYSPOZsbq6x00euFoTc0fUUYfset5s1yTeu9vdNA==',
      smtpHost: 'smtp.zeptomail.in',
      mailDriver: 'smtp',
      smtpPort: 465,
      smtpSecurity: 'ssl',
      smtpAuthDomain: 'true',
      smtpAddress: 'no-reply@synilogicitsolution.com',
      emailFromAddress: 'no-reply@synilogicitsolution.com',
      emailFromName: 'ShubhVenue',
      replyEmailAddress: 'no-reply@synilogicitsolution.com',
      replyEmailName: 'ShubhVenue',
    });
  }
  return config;
};

export default mongoose.model('EmailConfig', emailConfigSchema);

