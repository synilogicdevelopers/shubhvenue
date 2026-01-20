import axios from 'axios';

// Configuration
const BASE_URL = 'http://localhost:8030/api';
const SEARCH_ENDPOINT = `${BASE_URL}/vendor/venues/search`;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function searchVenues(query, filters = {}) {
  try {
    log(`\n${'='.repeat(60)}`, 'cyan');
    log(`🔍 Searching for: "${query}"`, 'cyan');
    if (Object.keys(filters).length > 0) {
      log(`📍 Filters: ${JSON.stringify(filters)}`, 'blue');
    }
    log('='.repeat(60), 'cyan');
    
    const params = {
      q: query,
      ...filters
    };
    
    const response = await axios.get(SEARCH_ENDPOINT, { params });
    
    log(`✅ Search successful!`, 'green');
    log(`📊 Status: ${response.status}`, 'blue');
    log(`🔢 Total Results: ${response.data.totalCount}`, 'blue');
    log(`📄 Page: ${response.data.page}/${response.data.totalPages}`, 'blue');
    log(`📋 Results Returned: ${response.data.count}`, 'blue');
    
    if (response.data.venues && response.data.venues.length > 0) {
      log(`\n📌 Found Venues:`, 'yellow');
      response.data.venues.forEach((venue, index) => {
        log(`\n${index + 1}. ${venue.name || 'N/A'}`, 'green');
        log(`   ID: ${venue._id || venue.id}`, 'blue');
        log(`   Location: ${venue.location?.city || venue.location || 'N/A'}, ${venue.location?.state || 'N/A'}`, 'blue');
        log(`   Status: ${venue.status || 'N/A'}`, 'blue');
        if (venue.rating) {
          log(`   Rating: ${venue.rating.average || 0} (${venue.rating.totalReviews || 0} reviews)`, 'blue');
        }
        if (venue.capacity) {
          log(`   Capacity: ${venue.capacity.minGuests || 0} - ${venue.capacity.maxGuests || 0} guests`, 'blue');
        }
      });
    } else {
      log(`\n⚠️  No venues found for this search`, 'yellow');
    }
    
    return response.data;
  } catch (error) {
    log(`\n❌ Search failed!`, 'red');
    if (error.code === 'ECONNREFUSED') {
      log(`❌ Connection refused - Is the backend server running on port 8030?`, 'red');
    } else if (error.response) {
      log(`❌ Status: ${error.response.status}`, 'red');
      log(`❌ Error: ${error.response.data?.error || error.response.data?.message || 'Unknown error'}`, 'red');
      if (error.response.data?.hint) {
        log(`💡 Hint: ${error.response.data.hint}`, 'yellow');
      }
      if (error.response.data?.stack) {
        log(`\n📋 Stack trace:\n${error.response.data.stack.substring(0, 1000)}`, 'red');
      }
    } else {
      log(`❌ Error: ${error.message}`, 'red');
    }
    throw error;
  }
}

async function runTests() {
  log('\n' + '='.repeat(60), 'yellow');
  log('🚀 Testing Search API with Specific Query', 'yellow');
  log('='.repeat(60), 'yellow');
  log(`📍 Endpoint: ${SEARCH_ENDPOINT}`, 'blue');
  log(`⏰ Started at: ${new Date().toLocaleString()}`, 'blue');
  
  const searchQuery = 'rajastan kota 5 Flowers Ananta Elite 123';
  
  // Test 1: Full query search
  await searchVenues(searchQuery);
  
  // Test 2: Search with Rajasthan filter
  await searchVenues('Flowers Ananta Elite', { state: 'Rajasthan' });
  
  // Test 3: Search with Kota city filter
  await searchVenues('Ananta Elite', { city: 'Kota' });
  
  // Test 4: Search individual terms
  await searchVenues('Ananta Elite');
  await searchVenues('Flowers');
  await searchVenues('Kota');
  
  // Test 5: Search with combined filters
  await searchVenues('Elite', { city: 'Kota', state: 'Rajasthan' });
  
  log('\n' + '='.repeat(60), 'yellow');
  log('✅ All tests completed!', 'green');
  log('='.repeat(60) + '\n', 'yellow');
}

// Run tests
runTests()
  .catch(error => {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    process.exit(1);
  });

