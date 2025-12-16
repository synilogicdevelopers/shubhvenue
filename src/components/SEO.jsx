import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

// List of major Indian cities for location-based SEO
const majorCities = [
  'Jaipur', 'Kota', 'Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata', 
  'Hyderabad', 'Pune', 'Ahmedabad', 'Surat', 'Lucknow', 'Kanpur', 'Nagpur',
  'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Patna', 'Vadodara',
  'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik', 'Faridabad', 'Meerut',
  'Rajkot', 'Varanasi', 'Srinagar', 'Amritsar', 'Jodhpur', 'Udaipur',
  'Bikaner', 'Ajmer', 'Jalandhar', 'Patiala', 'Chandigarh', 'Gurgaon',
  'Noida', 'Greater Noida', 'Gwalior', 'Jabalpur', 'Raipur', 'Bhubaneswar',
  'Coimbatore', 'Madurai', 'Mysore', 'Vijayawada', 'Kochi', 'Thiruvananthapuram'
]

const SEO = ({ 
  title, 
  description, 
  keywords, 
  image = '/image/venuebook.png',
  location = null,
  type = 'website',
  url = null
}) => {
  const currentLocation = useLocation()
  const baseUrl = 'https://shubhvenue.com'
  const currentUrl = url || `${baseUrl}${currentLocation.pathname}`
  
  // Default values optimized for venue searches
  const defaultTitle = location 
    ? `Best Wedding Venues in ${location} | ${location} Venues | ShubhVenue`
    : 'Best Wedding Venues in India | Jaipur, Kota, Delhi, Mumbai | ShubhVenue'
  
  const defaultDescription = location
    ? `Find the perfect wedding venue in ${location}. Book banquet halls, hotels, palaces, resorts, and convention centers in ${location}. Best ${location.toLowerCase()} venues for weddings, parties, and events.`
    : 'Find the perfect wedding venue in Jaipur, Kota, Delhi, Mumbai, and all major cities in India. Book banquet halls, hotels, palaces, resorts, and convention centers for your special day. Best venues for weddings, parties, and events.'
  
  const defaultKeywords = location
    ? `${location.toLowerCase()} venues, wedding venues in ${location.toLowerCase()}, ${location.toLowerCase()} wedding halls, ${location.toLowerCase()} banquet halls, ${location.toLowerCase()} marriage venues, ${location.toLowerCase()} event venues, ${location.toLowerCase()} party venues, best venues in ${location.toLowerCase()}, affordable venues ${location.toLowerCase()}, luxury venues ${location.toLowerCase()}, venues near ${location.toLowerCase()}, wedding booking ${location.toLowerCase()}, venue booking ${location.toLowerCase()}, wedding venues, venues, banquet halls, wedding halls, marriage venues, event venues, party venues`
    : 'wedding venues, venues, jaipur venues, kota venues, delhi venues, mumbai venues, banquet halls, wedding halls, marriage venues, event venues, party venues, hotel venues, palace venues, resort venues, convention centers, wedding booking, venue booking, best wedding venues, affordable wedding venues, luxury wedding venues, wedding venues near me, venues in jaipur, venues in kota, venues in delhi, venues in mumbai, venues in rajasthan, venues in india'
  
  const finalTitle = title || defaultTitle
  const finalDescription = description || defaultDescription
  const finalKeywords = keywords || defaultKeywords
  
  // Generate structured data (JSON-LD) for better SEO
  const generateStructuredData = () => {
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: 'ShubhVenue',
      description: finalDescription,
      url: baseUrl,
      logo: `${baseUrl}${image}`,
      image: `${baseUrl}${image}`,
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'IN',
        addressRegion: location || 'India'
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        reviewCount: '500'
      },
      priceRange: '$$',
      servesCuisine: 'Indian',
      areaServed: majorCities.map(city => ({
        '@type': 'City',
        name: city
      })),
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Wedding Venues',
        itemListElement: [
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Wedding Venue Booking',
              description: 'Book wedding venues in multiple cities across India'
            }
          }
        ]
      }
    }
    
    // Add location-specific data if provided
    if (location) {
      structuredData.address.addressLocality = location
      structuredData.areaServed = [{
        '@type': 'City',
        name: location
      }]
    }
    
    return structuredData
  }
  
  // Generate breadcrumb structured data
  const generateBreadcrumbData = () => {
    const pathSegments = currentLocation.pathname.split('/').filter(Boolean)
    const breadcrumbItems = [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: baseUrl
      }
    ]
    
    let currentPath = ''
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`
      breadcrumbItems.push({
        '@type': 'ListItem',
        position: index + 2,
        name: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
        item: `${baseUrl}${currentPath}`
      })
    })
    
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbItems
    }
  }
  
  // Generate FAQ structured data for venue searches
  const generateFAQData = () => {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: `What are the best wedding venues in ${location || 'India'}?`,
          acceptedAnswer: {
            '@type': 'Answer',
            text: `ShubhVenue offers the best wedding venues in ${location || 'major cities across India'} including Jaipur, Kota, Delhi, Mumbai, and more. We provide banquet halls, hotels, palaces, resorts, and convention centers for all types of events.`
          }
        },
        {
          '@type': 'Question',
          name: `How do I book a venue in ${location || 'my city'}?`,
          acceptedAnswer: {
            '@type': 'Answer',
            text: `You can easily book a venue through ShubhVenue by browsing our extensive collection of venues, checking availability, and making a reservation online. We offer venues in ${location || 'all major cities'} including Jaipur, Kota, Delhi, Mumbai, and more.`
          }
        },
        {
          '@type': 'Question',
          name: 'What types of venues are available?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'We offer various types of venues including banquet halls, hotels, palaces, resorts, convention centers, marriage gardens, rooftop venues, and clubs. All venues are available in major cities like Jaipur, Kota, Delhi, Mumbai, and across India.'
          }
        }
      ]
    }
  }
  
  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{finalTitle}</title>
      <meta name="title" content={finalTitle} />
      <meta name="description" content={finalDescription} />
      <meta name="keywords" content={finalKeywords} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={`${baseUrl}${image}`} />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={currentUrl} />
      <meta property="twitter:title" content={finalTitle} />
      <meta property="twitter:description" content={finalDescription} />
      <meta property="twitter:image" content={`${baseUrl}${image}`} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={currentUrl} />
      
      {/* Geo Tags for Location-based SEO */}
      {location && (
        <>
          <meta name="geo.region" content="IN" />
          <meta name="geo.placename" content={location} />
        </>
      )}
      
      {/* Structured Data - LocalBusiness */}
      <script type="application/ld+json">
        {JSON.stringify(generateStructuredData())}
      </script>
      
      {/* Structured Data - Breadcrumb */}
      <script type="application/ld+json">
        {JSON.stringify(generateBreadcrumbData())}
      </script>
      
      {/* Structured Data - FAQ */}
      <script type="application/ld+json">
        {JSON.stringify(generateFAQData())}
      </script>
    </Helmet>
  )
}

export default SEO

