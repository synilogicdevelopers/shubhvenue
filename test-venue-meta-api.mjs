// Test script to check if metaTitle and metaDescription are returned by API
// Using built-in fetch (Node 18+)

const API_BASE_URL = 'http://localhost:8030/api';

async function testVenueMetaData() {
  try {
    console.log('🔍 Testing Venue API for metaTitle and metaDescription...\n');

    // First, get list of venues to find a venue ID
    console.log('1. Fetching list of venues...');
    const venuesResponse = await fetch(`${API_BASE_URL}/vendor/venues?limit=5`);
    const venuesData = await venuesResponse.json();

    if (!venuesData.success || !venuesData.data || venuesData.data.length === 0) {
      console.error('❌ No venues found');
      return;
    }

    const firstVenue = venuesData.data[0];
    const venueId = firstVenue._id || firstVenue.id;

    console.log(`✅ Found venue: ${firstVenue.name} (ID: ${venueId})\n`);

    // Now fetch the full venue details
    console.log(`2. Fetching full venue details for ID: ${venueId}...`);
    const venueResponse = await fetch(`${API_BASE_URL}/vendor/venues/${venueId}`);
    const venueData = await venueResponse.json();

    if (!venueResponse.ok) {
      console.error('❌ Error fetching venue:', venueData);
      return;
    }

    if (!venueData.success || !venueData.data) {
      console.error('❌ Invalid response format:', venueData);
      return;
    }

    const venue = venueData.data;

    console.log('\n📦 Venue Data from API:');
    console.log('================================');
    console.log(`Venue ID: ${venue._id || venue.id}`);
    console.log(`Venue Name: ${venue.name}`);
    console.log(`\n🔍 Meta Data Check:`);
    console.log(`  metaTitle: ${JSON.stringify(venue.metaTitle)}`);
    console.log(`  metaTitle Type: ${typeof venue.metaTitle}`);
    console.log(`  metaTitle Exists: ${venue.metaTitle !== undefined && venue.metaTitle !== null}`);
    console.log(`  metaTitle Length: ${venue.metaTitle?.length || 0}`);
    console.log(`\n  metaDescription: ${JSON.stringify(venue.metaDescription)}`);
    console.log(`  metaDescription Type: ${typeof venue.metaDescription}`);
    console.log(`  metaDescription Exists: ${venue.metaDescription !== undefined && venue.metaDescription !== null}`);
    console.log(`  metaDescription Length: ${venue.metaDescription?.length || 0}`);
    console.log('================================\n');

    // Check if metaTitle and metaDescription are present
    if (venue.metaTitle && venue.metaTitle.trim() !== '') {
      console.log('✅ metaTitle is present and not empty');
    } else {
      console.log('⚠️  metaTitle is missing or empty');
    }

    if (venue.metaDescription && venue.metaDescription.trim() !== '') {
      console.log('✅ metaDescription is present and not empty');
    } else {
      console.log('⚠️  metaDescription is missing or empty');
    }

    // Show full response structure
    console.log('\n📋 Full API Response Structure:');
    console.log(JSON.stringify({
      success: venueData.success,
      data: {
        _id: venue._id,
        name: venue.name,
        metaTitle: venue.metaTitle,
        metaDescription: venue.metaDescription,
        // Show a few other fields to verify structure
        location: venue.location,
        capacity: venue.capacity
      }
    }, null, 2));

  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    console.error(error.stack);
  }
}

testVenueMetaData();

