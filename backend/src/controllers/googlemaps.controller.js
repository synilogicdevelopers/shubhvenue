// Helper function to get Google Maps API key (from database or env)
const getGoogleMapsApiKey = async () => {
  try {
    // Try to get from database first (admin configured)
    const { default: AppConfig } = await import('../models/AppConfig.js');
    const config = await AppConfig.getConfig();
    if (config && config.googleMapsApiKey && config.googleMapsApiKey.trim()) {
      return config.googleMapsApiKey.trim();
    }
  } catch (error) {
    console.log('Could not get API key from database, falling back to env:', error.message);
  }
  
  // Fallback to environment variable
  return process.env.GOOGLE_MAPS_API_KEY || '';
};

/**
 * Google Maps Places Autocomplete API
 * Get location suggestions based on user input
 */
export const getLocationSuggestions = async (req, res) => {
  try {
    const { input, language = 'en' } = req.query;

    if (!input || !input.trim()) {
      return res.status(400).json({ 
        error: 'Input parameter is required',
        message: 'Please provide a search query for location suggestions'
      });
    }

    // Get Google Maps API key (from database or env)
    const googleMapsApiKey = await getGoogleMapsApiKey();
    if (!googleMapsApiKey) {
      return res.status(500).json({ 
        error: 'Google Maps API key not configured',
        message: 'Please configure Google Maps API key from admin panel or set GOOGLE_MAPS_API_KEY in environment variables'
      });
    }

    // Call Google Places Autocomplete API
    const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
    url.searchParams.set('input', input.trim());
    url.searchParams.set('key', googleMapsApiKey);
    url.searchParams.set('language', language);
    url.searchParams.set('components', 'country:in'); // Restrict to India (optional, remove if you want worldwide)
    url.searchParams.set('types', 'establishment|geocode'); // Can be: establishment, geocode, address, (cities), etc.

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status === 'OK' || data.status === 'ZERO_RESULTS') {
      // Format the response
      const suggestions = data.predictions.map(prediction => ({
        placeId: prediction.place_id,
        description: prediction.description,
        mainText: prediction.structured_formatting?.main_text || prediction.description,
        secondaryText: prediction.structured_formatting?.secondary_text || '',
        types: prediction.types
      }));

      return res.status(200).json({
        success: true,
        query: input.trim(),
        count: suggestions.length,
        suggestions: suggestions,
        status: data.status
      });
    } else {
      // Handle API errors
      let errorMessage = 'Failed to get location suggestions';
      switch (data.status) {
        case 'REQUEST_DENIED':
          errorMessage = 'Google Maps API request denied. Please check API key and billing.';
          break;
        case 'INVALID_REQUEST':
          errorMessage = 'Invalid request to Google Maps API';
          break;
        case 'OVER_QUERY_LIMIT':
          errorMessage = 'Google Maps API quota exceeded';
          break;
        default:
          errorMessage = `Google Maps API error: ${data.status}`;
      }

      return res.status(400).json({
        error: errorMessage,
        status: data.status,
        message: data.error_message || 'Unknown error'
      });
    }
  } catch (error) {
    console.error('Google Maps Autocomplete error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message || 'Failed to fetch location suggestions'
    });
  }
};

/**
 * Google Maps Place Details API
 * Get detailed location information including coordinates
 */
export const getLocationDetails = async (req, res) => {
  try {
    const { placeId } = req.query;

    if (!placeId || !placeId.trim()) {
      return res.status(400).json({ 
        error: 'Place ID is required',
        message: 'Please provide a place_id from autocomplete suggestions'
      });
    }

    // Get Google Maps API key (from database or env)
    const googleMapsApiKey = await getGoogleMapsApiKey();
    if (!googleMapsApiKey) {
      return res.status(500).json({ 
        error: 'Google Maps API key not configured',
        message: 'Please configure Google Maps API key from admin panel or set GOOGLE_MAPS_API_KEY in environment variables'
      });
    }

    // Call Google Places Details API
    const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    url.searchParams.set('place_id', placeId.trim());
    url.searchParams.set('key', googleMapsApiKey);
    url.searchParams.set('fields', 'place_id,name,formatted_address,address_components,geometry,formatted_phone_number,international_phone_number,website,url,types');

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status === 'OK') {
      const place = data.result;
      
      // Extract address components
      const addressComponents = place.address_components || [];
      let city = '';
      let state = '';
      let country = '';
      let pincode = '';
      let streetNumber = '';
      let route = '';

      addressComponents.forEach(component => {
        const types = component.types;
        if (types.includes('postal_code')) {
          pincode = component.long_name;
        } else if (types.includes('locality') || types.includes('sublocality')) {
          city = component.long_name;
        } else if (types.includes('administrative_area_level_1')) {
          state = component.long_name;
        } else if (types.includes('country')) {
          country = component.long_name;
        } else if (types.includes('street_number')) {
          streetNumber = component.long_name;
        } else if (types.includes('route')) {
          route = component.long_name;
        }
      });

      // Build full address
      const address = place.formatted_address || '';
      const fullAddress = [streetNumber, route].filter(Boolean).join(' ').trim() || address;

      // Extract coordinates
      const location = place.geometry?.location;
      const latitude = location?.lat || null;
      const longitude = location?.lng || null;

      // Build map link
      const mapLink = place.url || (latitude && longitude 
        ? `https://www.google.com/maps?q=${latitude},${longitude}` 
        : '');

      // Format response
      const locationData = {
        placeId: place.place_id,
        name: place.name || '',
        address: fullAddress,
        formattedAddress: address,
        city: city,
        state: state,
        country: country,
        pincode: pincode,
        latitude: latitude,
        longitude: longitude,
        mapLink: mapLink,
        website: place.website || '',
        phone: place.formatted_phone_number || place.international_phone_number || '',
        types: place.types || []
      };

      return res.status(200).json({
        success: true,
        location: locationData
      });
    } else {
      // Handle API errors
      let errorMessage = 'Failed to get location details';
      switch (data.status) {
        case 'REQUEST_DENIED':
          errorMessage = 'Google Maps API request denied. Please check API key and billing.';
          break;
        case 'INVALID_REQUEST':
          errorMessage = 'Invalid place ID';
          break;
        case 'NOT_FOUND':
          errorMessage = 'Place not found';
          break;
        case 'OVER_QUERY_LIMIT':
          errorMessage = 'Google Maps API quota exceeded';
          break;
        default:
          errorMessage = `Google Maps API error: ${data.status}`;
      }

      return res.status(400).json({
        error: errorMessage,
        status: data.status,
        message: data.error_message || 'Unknown error'
      });
    }
  } catch (error) {
    console.error('Google Maps Place Details error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message || 'Failed to fetch location details'
    });
  }
};

/**
 * Get Google Maps API Key (for frontend use)
 * Returns the API key if configured (for client-side Maps JavaScript API)
 */
export const getMapsApiKey = async (req, res) => {
  try {
    // Get Google Maps API key (from database or env)
    const googleMapsApiKey = await getGoogleMapsApiKey();
    
    if (!googleMapsApiKey) {
      return res.status(200).json({
        success: false,
        hasApiKey: false,
        message: 'Google Maps API key not configured. Please configure from admin panel.'
      });
    }

    // Return API key for frontend (be careful with this in production)
    // In production, you might want to restrict this or use it server-side only
    return res.status(200).json({
      success: true,
      hasApiKey: true,
      apiKey: googleMapsApiKey,
      message: 'Google Maps API key available'
    });
  } catch (error) {
    console.error('Get Maps API Key error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message || 'Failed to get API key'
    });
  }
};

