import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import './FeaturedVenues.css'
import { publicVenuesAPI, shotlistAPI } from '../../services/customer/api'
import { createSlug } from '../../utils/customer/slug'
import toast from 'react-hot-toast'

function FeaturedVenues({ onLoadComplete }) {
  const navigate = useNavigate()
  const [venues, setVenues] = useState([])
  const [loading, setLoading] = useState(true)
  const [likedVenues, setLikedVenues] = useState(new Set())
  const [togglingVenueId, setTogglingVenueId] = useState(null)
  const hasFetched = useRef(false)
  const hasNotified = useRef(false)
  const onLoadCompleteRef = useRef(onLoadComplete)

  // Generate device ID for tracking
  const getDeviceId = () => {
    let deviceId = localStorage.getItem('deviceId')
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('deviceId', deviceId)
    }
    return deviceId
  }

  useEffect(() => {
    onLoadCompleteRef.current = onLoadComplete
  }, [onLoadComplete])

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
    if (hasFetched.current) return
    hasFetched.current = true
    
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
        // Fetch all active venues (not just featured)
        const response = await publicVenuesAPI.getAll({ 
          limit: '6',
          // Customers should see only active venues
          status: 'active'
        })
        
        if (response.data) {
          // API returns: { success: true, data: [...], count: number }
          let venuesData = extractVenues(response)
          
          // Filter out Decoration category venues
          let filteredVenues = venuesData.filter(venue => {
            const categoryName = venue.categoryId?.name || venue.category?.name || venue.venueType || ''
            const isDecoration = categoryName && categoryName.toLowerCase().includes('decoration')
            return !isDecoration
          })
          
          // If we don't have enough venues after filtering, try approved venues
          if (filteredVenues.length < 6) {
            const approvedResp = await publicVenuesAPI.getAll({
              limit: '20', // Fetch more to account for filtering
              status: 'approved'
            })
            const approvedVenues = extractVenues(approvedResp)
            
            // Filter out Decoration from approved venues too
            const filteredApproved = approvedVenues.filter(venue => {
              const categoryName = venue.categoryId?.name || venue.category?.name || venue.venueType || ''
              const isDecoration = categoryName && categoryName.toLowerCase().includes('decoration')
              return !isDecoration
            })
            
            // Combine and remove duplicates
            const existingIds = new Set(filteredVenues.map(v => v._id || v.id))
            const newVenues = filteredApproved.filter(v => !existingIds.has(v._id || v.id))
            filteredVenues = [...filteredVenues, ...newVenues]
          }
          
          const formattedVenues = filteredVenues.slice(0, 6).map(venue => {
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
              moreTags: venue.tags?.length || 0,
              // Store category data for URL generation
              categoryId: venue.categoryId,
              category: venue.category
            }
          })
          
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
        if (onLoadCompleteRef.current && !hasNotified.current) {
          hasNotified.current = true
          onLoadCompleteRef.current(true)
        }
      }
    }

    fetchFeaturedVenues()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Check shortlist status for all venues
  useEffect(() => {
    const checkShortlistStatus = async () => {
      if (venues.length === 0) return
      
      try {
        const deviceId = getDeviceId()
        const statusPromises = venues.map(async (venue) => {
          try {
            const venueId = venue.id
            const response = await shotlistAPI.checkStatus(venueId, deviceId)
            return { venueId, isLiked: response.data?.isLiked || false }
          } catch (error) {
            return { venueId: venue.id, isLiked: false }
          }
        })
        
        const statuses = await Promise.all(statusPromises)
        const likedSet = new Set()
        statuses.forEach(({ venueId, isLiked }) => {
          if (isLiked) likedSet.add(venueId)
        })
        setLikedVenues(likedSet)
      } catch (error) {
        console.error('Error checking shortlist status:', error)
      }
    }

    checkShortlistStatus()
  }, [venues])

  // Handle toggle like/unlike
  const handleToggleLike = async (e, venueId) => {
    e.stopPropagation() // Prevent card click
    
    try {
      setTogglingVenueId(venueId)
      const deviceId = getDeviceId()
      const response = await shotlistAPI.toggleLike(venueId, deviceId)
      
      if (response.data?.success) {
        const isLiked = response.data.isLiked
        setLikedVenues(prev => {
          const newSet = new Set(prev)
          if (isLiked) {
            newSet.add(venueId)
          } else {
            newSet.delete(venueId)
          }
          return newSet
        })
        if (isLiked) {
          toast.success('Venue added to shortlist')
        } else {
          toast.success('Venue removed from shortlist')
        }
      } else {
        toast.error(response.data?.error || 'Failed to update shortlist')
      }
    } catch (error) {
      console.error('Error toggling like:', error)
      toast.error(error.message || 'Failed to update shortlist')
    } finally {
      setTogglingVenueId(null)
    }
  }

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
          <>
            <div className="venues-grid">
              {venues.map((venue) => (
                <div 
                  key={venue.id} 
                  className="venue-card"
                  onClick={() => {
                    const venueSlug = createSlug(venue.name)
                    // Check for category in multiple possible locations
                    const categoryName = venue.categoryId?.name || venue.category?.name || venue.type
                    const venueCategorySlug = categoryName ? createSlug(categoryName) : null
                    
                    const url = venueCategorySlug 
                      ? `/venue/${venueCategorySlug}/${venueSlug}`
                      : `/venue/${venueSlug}`
                    
                    navigate(url)
                  }}
                >
                  <div className="venue-image-wrapper">
                    <img 
                      src={venue.image} 
                      alt={venue.name} 
                      className="venue-image"
                      loading="lazy"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&h=300&fit=crop'
                      }}
                    />
                    <button
                      className={`venue-shortlist-btn ${likedVenues.has(venue.id) ? 'liked' : ''}`}
                      onClick={(e) => handleToggleLike(e, venue.id)}
                      disabled={togglingVenueId === venue.id}
                      title={likedVenues.has(venue.id) ? 'Remove from shortlist' : 'Add to shortlist'}
                    >
                      <svg 
                        width="20" 
                        height="20" 
                        viewBox="0 0 24 24" 
                        fill={likedVenues.has(venue.id) ? "currentColor" : "none"} 
                        stroke="currentColor" 
                        strokeWidth="2"
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                      </svg>
                    </button>
                  </div>
                  <div className="venue-content">
                    <h3 className="venue-name">{venue.name}</h3>
                    {(() => {
                      // Get rating value
                      const ratingValue = typeof venue.rating === 'number' 
                        ? venue.rating 
                        : (venue.rating?.average || 0);
                      
                      // Get reviews count
                      const reviewsCount = venue.reviews || venue.rating?.totalReviews || 0;
                      
                      // Only show if rating > 0 AND reviews > 0
                      if (ratingValue > 0 && reviewsCount > 0) {
                        return (
                          <div className="venue-rating">
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="#FFB800"
                              stroke="#FFB800"
                              strokeWidth="2"
                              style={{ flexShrink: 0 }}
                            >
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                            </svg>
                            <span className="rating-value">{ratingValue.toFixed(1)}</span>
                          </div>
                        );
                      }
                      return null;
                    })()}
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
            <div className="view-all-container">
              <button className="view-all-btn" onClick={() => navigate('/venues')}>
                View All
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          </>
        ) : null}
      </div>
    </section>
  )
}

export default FeaturedVenues

