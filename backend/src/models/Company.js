import mongoose from 'mongoose';

const companySchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true, trim: true, default: 'VenueBook' },
    description: { type: String, trim: true },
    address: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true },
    facebook: { type: String, trim: true },
    twitter: { type: String, trim: true },
    instagram: { type: String, trim: true },
    linkedin: { type: String, trim: true },
    copyright: { type: String, trim: true, default: '© 2024 VenueBook. All rights reserved.' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Ensure only one company document exists
companySchema.statics.getCompany = async function() {
  let company = await this.findOne();
  if (!company) {
    // Create default company if none exists
    company = await this.create({
      companyName: 'VenueBook',
      description: 'Your trusted partner in finding the perfect venue for every occasion. Making event planning simple and stress-free.',
      address: '123 Event Street, City, State 12345',
      phone: '+1 (555) 123-4567',
      email: 'info@venuebook.com',
      copyright: '© 2024 VenueBook. All rights reserved.',
      isActive: true,
    });
  }
  return company;
};

export default mongoose.model('Company', companySchema);

