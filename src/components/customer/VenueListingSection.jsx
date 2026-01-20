import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './VenueListingSection.css'
import { publicVenuesAPI, publicCategoriesAPI, shotlistAPI } from '../../services/customer/api'
import { createSlug } from '../../utils/customer/slug'
import toast from 'react-hot-toast'

function VenueListingSection({ categoryName, title, limit = 6, onLoadComplete }) {
  const navigate = useNavigate()
  const [venues, setVenues] = useState([])
  const [loading, setLoading] = useState(true)
  const [categoryId, setCategoryId] = useState(null)
  const [likedVenues, setLikedVenues] = useState(new Set())
  const [togglingVenueId, setTogglingVenueId] = useState(null)

  // Generate device ID for tracking
  const getDeviceId = () => {
    let deviceId = localStorage.getItem('deviceId')
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('deviceId', deviceId)
    }
    return deviceId
  }

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
      return location.length > 25 ? `${location.substring(0, 25)}...` : location
    }
    return 'Location not specified'
  }

  // Helper function to format capacity
  const formatCapacity = (capacity) => {
    if (!capacity) return null
    if (typeof capacity === 'object') {
      const min = capacity.minGuests || capacity.min || 0
      const max = capacity.maxGuests || capacity.max || 0
      if (min > 0 && max > 0) {
        return `${min}-${max}`
      }
      return max > 0 ? `${max}` : null
    }
    return `${capacity}`
  }

  // Load category ID first
  useEffect(() => {
    const loadCategoryId = async () => {
      try {
        const response = await publicCategoriesAPI.getAll({ active: 'true' })
        if (response.data?.success && response.data?.categories) {
          // Try exact match first
          let category = response.data.categories.find(
            cat => cat.name === categoryName
          )
          
          // If not found, try case-insensitive match
          if (!category) {
            category = response.data.categories.find(
              cat => cat.name.toLowerCase() === categoryName.toLowerCase()
            )
          }
          
          // If still not found, try partial match (contains)
          if (!category) {
            category = response.data.categories.find(
              cat => cat.name.toLowerCase().includes(categoryName.toLowerCase()) ||
                     categoryName.toLowerCase().includes(cat.name.toLowerCase())
            )
          }
          
          if (category) {
            setCategoryId(category._id)
          }
        }
      } catch (error) {
        console.error('Error loading category:', error)
      }
    }

    if (categoryName) {
      loadCategoryId()
    }
  }, [categoryName])

  // Fetch venues for this category
  useEffect(() => {
    // If categoryId is not found yet, wait a bit for it to load
    if (!categoryId && categoryName) {
      // Set a timeout to try fetching by name if categoryId doesn't load
      const timeoutId = setTimeout(() => {
        // Category ID loading timeout
      }, 2000)
      return () => clearTimeout(timeoutId)
    }

    if (!categoryId) return

    const fetchVenues = async () => {
      try {
        setLoading(true)
        const response = await publicVenuesAPI.getAll({
          categoryId: categoryId,
          status: 'active',
          limit: limit.toString()
        })

        let venuesData = []
        if (response.data?.success && response.data?.data) {
          venuesData = Array.isArray(response.data.data) ? response.data.data : []
        } else if (response.data?.venues) {
          venuesData = Array.isArray(response.data.venues) ? response.data.venues : []
        } else if (Array.isArray(response.data?.data)) {
          venuesData = response.data.data
        } else if (Array.isArray(response.data)) {
          venuesData = response.data
        } else if (response.data?.results && Array.isArray(response.data.results)) {
          venuesData = response.data.results
        }

        // If no active venues, try approved
        if (venuesData.length === 0) {
          const approvedResponse = await publicVenuesAPI.getAll({
            categoryId: categoryId,
            status: 'approved',
            limit: limit.toString()
          })
          
          if (approvedResponse.data?.success && approvedResponse.data?.data) {
            venuesData = Array.isArray(approvedResponse.data.data) ? approvedResponse.data.data : []
          }
        }

        // Filter out venues where vendorActive is false (client-side safety check)
        const activeVenues = venuesData.filter(venue => venue.vendorActive !== false)

        const formattedVenues = activeVenues.slice(0, limit).map(venue => {
          let ratingValue = 0
          if (venue.rating) {
            if (typeof venue.rating === 'object' && venue.rating.average !== undefined) {
              ratingValue = Number(venue.rating.average) || 0
            } else if (typeof venue.rating === 'number') {
              ratingValue = venue.rating
            }
          }

          let reviewsCount = 0
          if (venue.reviewCount !== undefined) {
            reviewsCount = Number(venue.reviewCount) || 0
          } else if (venue.rating && typeof venue.rating === 'object' && venue.rating.totalReviews !== undefined) {
            reviewsCount = Number(venue.rating.totalReviews) || 0
          }

          return {
            id: venue._id || venue.id,
            name: venue.name || 'Unnamed Venue',
            image: getVenueImageUrl(venue.images || venue.image || venue.coverImage),
            rating: ratingValue,
            reviews: reviewsCount,
            location: formatLocation(venue.location),
            capacity: formatCapacity(venue.capacity),
            price: formatPrice(venue.price || venue.pricingInfo?.rentalPrice),
            categoryId: venue.categoryId,
            category: venue.category
          }
        })

        setVenues(formattedVenues)
      } catch (error) {
        console.error(`Error fetching ${categoryName} venues:`, error)
        setVenues([])
      } finally {
        setLoading(false)
        if (onLoadComplete) {
          onLoadComplete()
        }
      }
    }

    fetchVenues()
  }, [categoryId, categoryName, limit, onLoadComplete])

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

  const handleViewAll = () => {
    navigate(`/venues?categoryId=${categoryId}&categoryName=${encodeURIComponent(categoryName)}`, {
      state: {
        categoryId: categoryId,
        categoryName: categoryName
      }
    })
  }

  const handleVenueClick = (venue) => {
    const venueSlug = createSlug(venue.name)
    const categoryNameSlug = categoryName ? createSlug(categoryName) : null
    const url = categoryNameSlug 
      ? `/venue/${categoryNameSlug}/${venueSlug}`
      : `/venue/${venueSlug}`
    navigate(url)
  }

  if (loading) {
    return (
      <section className="venue-listing-section">
        <div className="venue-listing-container">
          <h2 className="venue-listing-title">{title}</h2>
          <div className="venue-listing-loading">
            <div className="loading-spinner"></div>
            <p>Loading venues...</p>
          </div>
        </div>
      </section>
    )
  }

  if (venues.length === 0) {
    return null
  }

  return (
    <section className="venue-listing-section">
      <div className="venue-listing-container">
        <h2 className="venue-listing-title">{title}</h2>
        <div className="venue-listing-grid">
          {venues.map((venue) => (
            <div
              key={venue.id}
              className="venue-listing-card"
              onClick={() => handleVenueClick(venue)}
            >
              <div className="venue-listing-image-wrapper">
                <img
                  src={venue.image}
                  alt={venue.name}
                  className="venue-listing-image"
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
              <div className="venue-listing-content">
                <h3 className="venue-listing-name">{venue.name}</h3>
                {venue.rating > 0 && venue.reviews > 0 && (
                  <div className="venue-listing-rating">
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
                    <span>{venue.rating.toFixed(1)}</span>
                  </div>
                )}
                <div className="venue-listing-location">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <span>{venue.location}</span>
                  {venue.type && (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="9" y1="3" x2="9" y2="21"></line>
                        <line x1="15" y1="3" x2="15" y2="21"></line>
                        <line x1="3" y1="9" x2="21" y2="9"></line>
                        <line x1="3" y1="15" x2="21" y2="15"></line>
                      </svg>
                      <span>{venue.type}</span>
                    </>
                  )}
                </div>
                {venue.capacity && (
                  <div className="venue-listing-tags">
                    <span className="venue-listing-tag">{venue.capacity} Guests</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="venue-listing-view-all">
          <button className="venue-listing-view-all-btn" onClick={handleViewAll}>
            View All {title}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </div>
    </section>
  )
}

export default VenueListingSection

