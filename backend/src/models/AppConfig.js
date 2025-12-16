import mongoose from 'mongoose';

const appConfigSchema = new mongoose.Schema({
  googleMapsApiKey: {
    type: String,
    default: '',
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Ensure only one app config document exists
appConfigSchema.statics.getConfig = async function() {
  let config = await this.findOne();
  if (!config) {
    // Create default config if none exists
    config = await this.create({
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
      isActive: true,
    });
  }
  return config;
};

const AppConfig = mongoose.model('AppConfig', appConfigSchema);

export default AppConfig;

