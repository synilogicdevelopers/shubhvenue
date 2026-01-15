import mongoose from 'mongoose';

const homepageContentSchema = new mongoose.Schema(
  {
    type: { 
      type: String, 
      required: true, 
      enum: ['seo-content', 'city-seo'],
      unique: true,
      trim: true 
    },
    title: { type: String, trim: true },
    content: { type: String, required: false, default: '' },
    // For city-seo, store array of city objects
    cities: [{
      name: { type: String, trim: true },
      description: { type: String, trim: true }
    }],
    lastUpdated: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Helper function to get default content
function getDefaultContent(type) {
  const defaults = {
    'seo-content': {
      title: 'About Shubh Venue',
      content: `Shubh Venue is your trusted partner in finding the perfect venue for your special occasions. 
We specialize in connecting you with the finest wedding venues, banquet halls, farm houses, 
resorts, and hotels across Rajasthan and beyond. Whether you're planning a grand wedding, 
intimate birthday celebration, corporate event, or traditional Haldi/Mehndi ceremony, 
we have the perfect venue waiting for you.

## Venue Types We Offer

Our platform features a diverse range of venue types to suit every occasion and preference. 
From elegant Marriage Gardens with lush green surroundings to sophisticated Banquet Halls 
perfect for grand celebrations, we have it all. Explore our collection of Farm Houses for a rustic charm, 
luxurious Resorts for a complete experience, or premium Hotels for unmatched hospitality.

## City Coverage

Shubh Venue proudly serves customers across multiple cities in Rajasthan and India. 
Our extensive network includes premium venues in Kota, Jaipur, Udaipur, Jodhpur, Ajmer, and many more cities. 
No matter where you are planning your event, we have carefully curated venues that meet 
the highest standards of quality and service.

## Why Choose Shubh Venue?

Choosing Shubh Venue means choosing convenience, quality, and reliability. Our platform 
offers easy venue search and comparison, detailed venue information with high-quality images, 
transparent pricing, and dedicated customer support. We work with verified venue partners 
to ensure you get the best experience. With thousands of satisfied customers and hundreds 
of premium venues, Shubh Venue is your one-stop solution for all venue booking needs.

Browse through our extensive collection of venues, compare prices and amenities, and book 
your perfect venue today.`
    },
    'city-seo': {
      title: 'Popular Wedding Venue Destinations',
      content: 'City SEO content for homepage.',
      cities: [
        {
          name: 'Kota',
          description: 'Discover the best wedding venues in Kota with Shubh Venue. From luxurious banquet halls to beautiful marriage gardens, find your perfect venue for your special day in Kota.'
        },
        {
          name: 'Jaipur',
          description: 'Discover the best wedding venues in Jaipur with Shubh Venue. From luxurious banquet halls to beautiful marriage gardens, find your perfect venue for your special day in Jaipur.'
        },
        {
          name: 'Udaipur',
          description: 'Discover the best wedding venues in Udaipur with Shubh Venue. From luxurious banquet halls to beautiful marriage gardens, find your perfect venue for your special day in Udaipur.'
        },
        {
          name: 'Jodhpur',
          description: 'Discover the best wedding venues in Jodhpur with Shubh Venue. From luxurious banquet halls to beautiful marriage gardens, find your perfect venue for your special day in Jodhpur.'
        },
        {
          name: 'Ajmer',
          description: 'Discover the best wedding venues in Ajmer with Shubh Venue. From luxurious banquet halls to beautiful marriage gardens, find your perfect venue for your special day in Ajmer.'
        }
      ]
    }
  };
  return defaults[type] || { title: 'Content', content: 'Content will be updated soon.', cities: [] };
}

// Ensure only one document per type exists
homepageContentSchema.statics.getByType = async function(type) {
  let content = await this.findOne({ type, isActive: true });
  if (!content) {
    // Create default content if none exists
    const defaultContent = getDefaultContent(type);
    content = await this.create({
      type,
      title: defaultContent.title,
      content: defaultContent.content,
      cities: defaultContent.cities || [],
      isActive: true,
    });
  }
  return content;
};

export default mongoose.model('HomepageContent', homepageContentSchema);

