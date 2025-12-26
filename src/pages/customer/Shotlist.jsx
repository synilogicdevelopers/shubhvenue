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
            <div className="shotlist-grid">
              {venues.map((venue) => (
                <div key={venue.id} className="shotlist-card">
                  <div 
                    className="shotlist-card-image"
                    onClick={() => handleVenueClick(venue)}
                  >
                    <img 
                      src={getVenueImageUrl(venue.images)} 
                      alt={venue.name}
                      loading="lazy"
                    />
                    <button
                      className="shotlist-remove-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveFromShotlist(venue.id)
                      }}
                      disabled={removingVenueId === venue.id}
                      title="Remove from shotlist"
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
                    {venue.ratingInfo?.average > 0 && (
                      <div className="venue-rating-badge">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                        </svg>
                        <span>{venue.ratingInfo.average.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  <div className="shotlist-card-content">
                    <h3 
                      className="shotlist-card-title"
                      onClick={() => handleVenueClick(venue)}
                    >
                      {venue.name}
                    </h3>
                    <div className="shotlist-card-info">
                      <div className="info-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                          <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        <span>{formatLocation(venue.location)}</span>
                      </div>
                      <div className="info-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                          <circle cx="9" cy="7" r="4"></circle>
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                        <span>{formatCapacity(venue.capacity)}</span>
                      </div>
                      {venue.pricingInfo?.vegPerPlate > 0 || venue.pricingInfo?.nonVegPerPlate > 0 ? (
                        <div className="info-item">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="1" x2="12" y2="23"></line>
                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                          </svg>
                          <span>
                            {venue.pricingInfo.vegPerPlate > 0 && `₹${venue.pricingInfo.vegPerPlate}/plate (Veg)`}
                            {venue.pricingInfo.vegPerPlate > 0 && venue.pricingInfo.nonVegPerPlate > 0 && ' • '}
                            {venue.pricingInfo.nonVegPerPlate > 0 && `₹${venue.pricingInfo.nonVegPerPlate}/plate (Non-Veg)`}
                          </span>
                        </div>
                      ) : venue.price > 0 ? (
                        <div className="info-item">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="1" x2="12" y2="23"></line>
                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                          </svg>
                          <span>{formatPrice(venue.price)}</span>
                        </div>
                      ) : null}
                    </div>
                    <div className="shotlist-card-actions">
                      <button 
                        className="btn-primary"
                        onClick={() => handleVenueClick(venue)}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}

export default Shotlist




