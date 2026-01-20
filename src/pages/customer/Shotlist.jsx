import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Footer from '../../components/customer/Footer'
import SEO from '../../components/SEO'
import { shotlistAPI } from '../../services/customer/api'
import { createSlug } from '../../utils/customer/slug'
import toast from 'react-hot-toast'
import './Shotlist.css'

const Shotlist = () => {
  const navigate = useNavigate()
  const [venues, setVenues] = useState([])
  const [loading, setLoading] = useState(true)
  const [removingVenueId, setRemovingVenueId] = useState(null)

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
    if (!images || (Array.isArray(images) && images.length === 0)) {
      return 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&h=300&fit=crop'
    }
    
    let image = Array.isArray(images) ? images[0] : images
    
    // Handle if image is an object (e.g., {url: "...", ...})
    if (image && typeof image === 'object') {
      image = image.url || image.path || image.src || image.image || null
    }
    
    // Ensure image is a string
    if (!image || typeof image !== 'string') {
      return 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&h=300&fit=crop'
    }
    
    // Trim whitespace
    image = image.trim()
    
    if (!image) {
      return 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&h=300&fit=crop'
    }
    
    if (image.startsWith('http://') || image.startsWith('https://')) {
      return image
    }
    
    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://shubhvenue.com'
    
    if (image.startsWith('/uploads/')) {
      return `${baseUrl}${image}`
    }
    
    return `${baseUrl}/uploads/venues/${image}`
  }

  // Helper function to format price
  const formatPrice = (price) => {
    if (!price) return 'Price on request'
    if (typeof price === 'number') {
      return `₹${price.toLocaleString('en-IN')}`
    }
    const numPrice = parseFloat(price)
    if (isNaN(numPrice)) return 'Price on request'
    return `₹${numPrice.toLocaleString('en-IN')}`
  }

  // Helper function to format location
  const formatLocation = (location) => {
    if (!location) return 'Location not specified'
    if (typeof location === 'object' && location.city) {
      return `${location.city}${location.state ? `, ${location.state}` : ''}`
    }
    if (typeof location === 'string') return location
    return 'Location not specified'
  }

  // Helper function to format capacity
  const formatCapacity = (capacity) => {
    if (!capacity) return 'Not specified'
    if (typeof capacity === 'object' && capacity.minGuests && capacity.maxGuests) {
      return `${capacity.minGuests} - ${capacity.maxGuests} guests`
    }
    if (typeof capacity === 'number') {
      return `Up to ${capacity} guests`
    }
    return String(capacity)
  }

  // Fetch shotlisted venues
  useEffect(() => {
    const fetchShotlist = async () => {
      try {
        setLoading(true)
        const deviceId = getDeviceId()
        const response = await shotlistAPI.getAll(deviceId)
        
        if (response.data?.success) {
          setVenues(response.data.venues || [])
        } else {
          toast.error(response.data?.error || 'Failed to load shotlist')
          setVenues([])
        }
      } catch (error) {
        console.error('Error fetching shotlist:', error)
        toast.error(error.message || 'Failed to load shotlist')
        setVenues([])
      } finally {
        setLoading(false)
      }
    }

    fetchShotlist()
  }, [])

  // Handle remove from shotlist
  const handleRemoveFromShotlist = async (venueId) => {
    try {
      setRemovingVenueId(venueId)
      const deviceId = getDeviceId()
      const response = await shotlistAPI.toggleLike(venueId, deviceId)
      
      if (response.data?.success && !response.data.isLiked) {
        // Remove from local state
        setVenues(prevVenues => prevVenues.filter(v => v.id !== venueId))
        toast.success('Venue removed from shotlist')
      } else {
        toast.error(response.data?.error || 'Failed to remove venue')
      }
    } catch (error) {
      console.error('Error removing from shotlist:', error)
      toast.error(error.message || 'Failed to remove venue')
    } finally {
      setRemovingVenueId(null)
    }
  }

  // Handle venue click - navigate to venue detail
  const handleVenueClick = (venue) => {
    const slug = venue.slug || createSlug(venue.name)
    navigate(`/venue/${slug}`)
  }

  return (
    <>
      <SEO
        title="My Shotlist - ShubhVenue"
        description="View your saved venues on ShubhVenue"
        keywords="shotlist, saved venues, favorite venues, wedding venues"
      />
      <div className="shotlist-page">
        <div className="container">
          <div className="shotlist-header">
            <h1>My Shotlist</h1>
            <p className="shotlist-subtitle">
              {venues.length === 0 
                ? 'No venues in your shotlist yet' 
                : `${venues.length} ${venues.length === 1 ? 'venue' : 'venues'} saved`}
            </p>
          </div>

          {loading ? (
            <div className="shotlist-loading">
              <div className="loading-spinner"></div>
              <p>Loading your shotlist...</p>
            </div>
          ) : venues.length === 0 ? (
            <div className="shotlist-empty">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              <h2>Your shotlist is empty</h2>
              <p>Start exploring venues and add them to your shotlist!</p>
              <button 
                className="btn-primary"
                onClick={() => navigate('/venues')}
              >
                Browse Venues
              </button>
            </div>
          ) : (
            <div className="venues-grid">
              {venues.map((venue) => {
                const locationText = venue.location?.city || (typeof venue.location === 'string' ? venue.location.split(',')[0] : 'Location not specified')
                const locationState = venue.location?.state ? `, ${venue.location.state}` : (typeof venue.location === 'string' && venue.location.includes(',') ? venue.location.split(',')[1] : '')
                const typeText = venue.categoryId?.name || venue.category?.name || venue.venueType || 'Venue'
                const ratingValue = venue.ratingInfo?.average || venue.rating?.average || (typeof venue.rating === 'number' ? venue.rating : 0)
                const reviewsCount = venue.ratingInfo?.totalReviews || venue.rating?.totalReviews || venue.reviews || 0
                
                return (
                  <div 
                    key={venue.id} 
                    className="venue-card"
                    onClick={() => handleVenueClick(venue)}
                  >
                    <div className="venue-image-wrapper">
                      <img 
                        src={getVenueImageUrl(venue.images)} 
                        alt={venue.name}
                        className="venue-image"
                        loading="lazy"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&h=300&fit=crop'
                        }}
                      />
                      <button
                        className="venue-shortlist-btn liked"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveFromShotlist(venue.id)
                        }}
                        disabled={removingVenueId === venue.id}
                        title="Remove from shortlist"
                      >
                        <svg 
                          width="20" 
                          height="20" 
                          viewBox="0 0 24 24" 
                          fill="currentColor" 
                          stroke="currentColor" 
                          strokeWidth="2"
                        >
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                      </button>
                    </div>
                    <div className="venue-content">
                      <h3 className="venue-name">{venue.name}</h3>
                      {ratingValue > 0 && reviewsCount > 0 && (
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
                      )}
                      <div className="venue-location">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                          <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        <span>{locationText}{locationState}</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="9" y1="3" x2="9" y2="21"></line>
                          <line x1="15" y1="3" x2="15" y2="21"></line>
                          <line x1="3" y1="9" x2="21" y2="9"></line>
                          <line x1="3" y1="15" x2="21" y2="15"></line>
                        </svg>
                        <span>{typeText}</span>
                      </div>
                      {venue.capacity && (
                        <div className="venue-tags">
                          <span className="venue-tag">
                            {typeof venue.capacity === 'object' && venue.capacity.minGuests && venue.capacity.maxGuests
                              ? `${venue.capacity.minGuests} - ${venue.capacity.maxGuests} Guests`
                              : typeof venue.capacity === 'number'
                              ? `Up to ${venue.capacity} Guests`
                              : formatCapacity(venue.capacity)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}

export default Shotlist
















