import mongoose from 'mongoose';

const legalPageSchema = new mongoose.Schema(
  {
    type: { 
      type: String, 
      required: true, 
      enum: ['privacy-policy', 'terms-of-service', 'cookie-policy', 'about-us'],
      unique: true,
      trim: true 
    },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    lastUpdated: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Ensure only one document per type exists
legalPageSchema.statics.getByType = async function(type) {
  let page = await this.findOne({ type, isActive: true });
  if (!page) {
    // Create default page if none exists
    const defaultContent = getDefaultContent(type);
    page = await this.create({
      type,
      title: defaultContent.title,
      content: defaultContent.content,
      isActive: true,
    });
  }
  return page;
};

function getDefaultContent(type) {
  const defaults = {
    'privacy-policy': {
      title: 'Privacy Policy',
      content: 'Privacy Policy content will be updated soon.'
    },
    'terms-of-service': {
      title: 'Terms of Service',
      content: 'Terms of Service content will be updated soon.'
    },
    'cookie-policy': {
      title: 'Cookie Policy',
      content: 'Cookie Policy content will be updated soon.'
    },
    'about-us': {
      title: 'About VenueBook',
      content: 'About Us content will be updated soon.'
    }
  };
  return defaults[type] || { title: 'Page', content: 'Content will be updated soon.' };
}

export default mongoose.model('LegalPage', legalPageSchema);

