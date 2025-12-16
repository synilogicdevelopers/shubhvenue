import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './FeaturedVenues.css'
import { publicVenuesAPI } from '../../services/customer/api'
import { createSlug } from '../../utils/customer/slug'
import toast from 'react-hot-toast'

function FeaturedVenues() {
  const navigate = useNavigate()
  const [venues, setVenues] = useState([])
  const [loading, setLoading] = useState(true)

  // Helper function to get venue image URL
  const getVenueImageUrl = (images) => {
    if (!images || images.length === 0) {
      return 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&h=300&fit=crop'
    }
    const image = Array.isArray(images) ? images[0] : images
    if (image.startsWith('/uploads/')) {
      const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://shubhvenue.com'
      return `${baseUrl}${image}`
    }
    if (image.startsWith('http://') || image.startsWith('https://')) {
      return image
    }
    return `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://shubhvenue.com'}/uploads/venues/${image}`
  }

  // Helper function to format price
  const formatPrice = (price) => {
    if (!price) return 'Price on request'
    if (typeof price === 'number') {
      return `${price.toFixed(2)} Lakh`
    }
    return price
  }

  // Helper function to format location
  const formatLocation = (location) => {
    if (!location) return 'Location not specified'
    if (typeof location === 'object' && location.city) {
      return `${location.city}${location.state ? `, ${location.state}` : ''}`
    }
    if (typeof location === 'string') {
      return location.length > 20 ? `${location.substring(0, 20)}...` : location
    }
    return 'Location not specified'
  }

  // Fetch featured venues from API
  useEffect(() => {
    const fetchFeaturedVenues = async () => {
      // Normalize different API response shapes into a simple array
      const extractVenues = (apiResponse) => {
        const data = apiResponse?.data
        let venuesData = []

        if (data?.success && data?.data) {
          venuesData = Array.isArray(data.data) ? data.data : []
        } else if (data?.venues) {
          venuesData = Array.isArray(data.venues) ? data.venues : []
        } else if (data?.data) {
          venuesData = Array.isArray(data.data) ? data.data : []
        } else if (Array.isArray(data)) {
          venuesData = data
        } else if (data?.results && Array.isArray(data.results)) {
          venuesData = data.results
        }

        return Array.isArray(venuesData) ? venuesData : []
      }

      try {
        setLoading(true)
        const response = await publicVenuesAPI.getAll({ 
          isFeatured: 'true',
          limit: '6',
          // Customers should see only active venues
          status: 'active'
        })
        
        console.log('Featured Venues API Response:', response)
        console.log('Response Data:', response.data)
        
        if (response.data) {
          // API returns: { success: true, data: [...], count: number }
          let venuesData = extractVenues(response)
          
          // If no featured venues with active status, include admin-approved ones
          if (venuesData.length === 0) {
            console.log('No active featured venues, trying approved featured venues...')
            const approvedFeaturedResp = await publicVenuesAPI.getAll({
              isFeatured: 'true',
              limit: '6',
              status: 'approved'
            })
            venuesData = extractVenues(approvedFeaturedResp)
          }
          
          console.log('Extracted Featured Venues Data:', venuesData)
          console.log('Featured Venues Count:', venuesData.length)
          
          // If no featured venues, fallback to showing approved venues
          if (venuesData.length === 0) {
            console.log('No featured venues found, fetching approved venues as fallback...')
            const fallbackResponse = await publicVenuesAPI.getAll({ 
              status: 'active',
              limit: '6'
            })
            
            venuesData = extractVenues(fallbackResponse)

            // Still empty? Use admin-approved venues so newly approved ones appear.
            if (venuesData.length === 0) {
              console.log('No active venues found, trying admin-approved venues...')
              const approvedFallbackResp = await publicVenuesAPI.getAll({
                status: 'approved',
                limit: '6'
              })
              venuesData = extractVenues(approvedFallbackResp)
            }
            
            console.log('Fallback Venues Count:', venuesData.length)
          }
          
          const formattedVenues = venuesData.slice(0, 6).map(venue => {
            // Extract rating - handle both object and number formats
            let ratingValue = 0
            if (venue.rating) {
              if (typeof venue.rating === 'object' && venue.rating.average !== undefined) {
                ratingValue = Number(venue.rating.average) || 0
              } else if (typeof venue.rating === 'number') {
                ratingValue = venue.rating
              } else if (venue.averageRating) {
                ratingValue = Number(venue.averageRating) || 0
              }
            }
            
            // Extract reviews count
            let reviewsCount = 0
            if (venue.reviewCount !== undefined) {
              reviewsCount = Number(venue.reviewCount) || 0
            } else if (venue.rating && typeof venue.rating === 'object' && venue.rating.totalReviews !== undefined) {
              reviewsCount = Number(venue.rating.totalReviews) || 0
            } else if (venue.reviews !== undefined) {
              reviewsCount = Number(venue.reviews) || 0
            }
            
            return {
              id: venue._id || venue.id,
              name: venue.name || 'Unnamed Venue',
              image: getVenueImageUrl(venue.images || venue.image || venue.coverImage),
              rating: ratingValue,
              reviews: reviewsCount,
              location: formatLocation(venue.location),
              type: venue.categoryId?.name || venue.category?.name || venue.venueType || 'Venue',
              price: formatPrice(venue.price || venue.pricingInfo?.rentalPrice),
              rooms: venue.rooms || venue.roomCount || 0,
              capacity: venue.capacity ? 
                (typeof venue.capacity === 'object' ? 
                  `${venue.capacity.minGuests || venue.capacity.min || 0}-${venue.capacity.maxGuests || venue.capacity.max || 0}` : 
                  `${venue.capacity}`) : 
                null,
              highlights: venue.highlights || [],
              moreTags: venue.tags?.length || 0
            }
          })
          
          console.log('Formatted Featured Venues:', formattedVenues)
          setVenues(formattedVenues)
        } else {
          console.error('Invalid API response:', response.data)
          toast.error('Failed to load featured venues')
          setVenues([])
        }
      } catch (error) {
        console.error('Error fetching featured venues:', error)
        toast.error('Failed to load featured venues')
        setVenues([])
      } finally {
        setLoading(false)
      }
    }

    fetchFeaturedVenues()
  }, [])

  return (
    <section className="featured-venues">
      <div className="featured-venues-container">
        <h2 className="featured-venues-title">Featured Venues</h2>
        {loading ? (
          <div className="featured-venues-loading">
            <img 
              src="/image/venuebook.png" 
              alt="ShubhVenue Logo" 
              className="featured-venues-loading-logo"
              onError={(e) => {
                e.target.onerror = null
                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiByeD0iMTIiIGZpbGw9InVybCgjZ3JhZGllbnQpIi8+CjxzdmcgeD0iMTgiIHk9IjE4IiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSI+CjxwYXRoIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0wIDNjMS42NiAwIDMgMS4zNCAzIDNzLTEuMzQgMy0zIDMtMy0xLjM0LTMtMyAxLjM0LTMgMy0zem0wIDE0LjJjLTIuNjcgMC04IDEuMzQtOCA0djEuOGgxNnYtMS44YzAtMi42Ni01LjMzLTQtOC00eiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9ImdyYWRpZW50IiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj4KPHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6Izk0NDg3QTtzdG9wLW9wYWNpdHk6MSIgLz4KPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojRUM0ODk5O3N0b3Atb3BhY2l0eToxIiAvPgo8L2xpbmVhckdyYWRpZW50Pgo8L2RlZnM+Cjwvc3ZnPg=='
              }}
            />
            <div className="featured-venues-loading-text">
              Loading featured venues...
            </div>
          </div>
        ) : venues.length > 0 ? (
          <div className="venues-grid">
            {venues.map((venue) => (
              <div 
                key={venue.id} 
                className="venue-card"
                onClick={() => navigate(`/venue/${createSlug(venue.name)}`)}
              >
                <div className="venue-image-wrapper">
                  <img 
                    src={venue.image} 
                    alt={venue.name} 
                    className="venue-image"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&h=300&fit=crop'
                    }}
                  />
                </div>
                <div className="venue-content">
                  <h3 className="venue-name">{venue.name}</h3>
                  <div className="venue-rating">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                    <span className="rating-value">
                      {typeof venue.rating === 'number' && venue.rating > 0 ? venue.rating.toFixed(1) : 'N/A'}
                    </span>
                    <span className="rating-reviews">({venue.reviews} reviews)</span>
                  </div>
                  <div className="venue-location">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <span>{venue.location}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="9" y1="3" x2="9" y2="21"></line>
                      <line x1="15" y1="3" x2="15" y2="21"></line>
                      <line x1="3" y1="9" x2="21" y2="9"></line>
                      <line x1="3" y1="15" x2="21" y2="15"></line>
                    </svg>
                    <span>{venue.type}</span>
                  </div>
                  <div className="venue-tags">
                    {venue.capacity && venue.capacity !== 'Capacity not specified' && (
                      <span className="venue-tag">{venue.capacity} Guests</span>
                    )}
                    {venue.rooms > 0 && <span className="venue-tag">{venue.rooms} Rooms</span>}
                    {venue.highlights && venue.highlights.length > 0 && (
                      <span className="venue-tag">{venue.highlights.length} Highlights</span>
                    )}
                    {venue.moreTags > 0 && <span className="venue-tag">+{venue.moreTags} more</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '18px', color: 'var(--gray-medium)' }}>No featured venues available</div>
          </div>
        )}
        <div className="view-all-container">
          <button className="view-all-btn" onClick={() => navigate('/venues')}>
            View All
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </div>
    </section>
  )
}

export default FeaturedVenues

