import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Footer from '../../components/customer/Footer'
import SEO from '../../components/SEO'
import { publicVenuesAPI, shotlistAPI } from '../../services/customer/api'
import { createSlug } from '../../utils/customer/slug'
import toast from 'react-hot-toast'
import './Search.css'

const Search = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  
  // State management
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [selectedCity, setSelectedCity] = useState(searchParams.get('city') || '')
  const [selectedState, setSelectedState] = useState(searchParams.get('state') || '')
  const [venues, setVenues] = useState([])
  const [loading, setLoading] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page')) || 1)
  const [totalPages, setTotalPages] = useState(1)
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'createdAt')
  const [sortOrder, setSortOrder] = useState(searchParams.get('sortOrder') || 'desc')
  const [states, setStates] = useState([])
  const [cities, setCities] = useState([])
  const [showFilters, setShowFilters] = useState(false)
  const [likedVenues, setLikedVenues] = useState(new Set())
  const [togglingVenueId, setTogglingVenueId] = useState(null)
  const itemsPerPage = 12

  // Generate device ID for tracking
  const getDeviceId = () => {
    let deviceId = localStorage.getItem('deviceId')
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('deviceId', deviceId)
    }
    return deviceId
  }

  // Fetch states
  useEffect(() => {
    const fetchStates = async () => {
      try {
        const response = await publicVenuesAPI.getStates()
        if (response.data && response.data.states) {
          setStates(response.data.states)
        }
      } catch (error) {
        console.error('Error fetching states:', error)
      }
    }
    fetchStates()
  }, [])

  // Fetch cities when state is selected
  useEffect(() => {
    const fetchCities = async () => {
      if (selectedState) {
        try {
          const response = await publicVenuesAPI.getCities(selectedState)
          if (response.data && response.data.cities) {
            setCities(response.data.cities)
          }
        } catch (error) {
          console.error('Error fetching cities:', error)
        }
      } else {
        setCities([])
      }
    }
    fetchCities()
  }, [selectedState])

  // Search venues
  const searchVenues = async (page = 1) => {
    try {
      setLoading(true)
      
      const params = {
        page,
        limit: itemsPerPage,
        sortBy,
        sortOrder
      }

      if (searchQuery.trim()) {
        params.q = searchQuery.trim()
      }
      if (selectedCity.trim()) {
        params.city = selectedCity.trim()
      }
      if (selectedState.trim()) {
        params.state = selectedState.trim()
      }

      const response = await publicVenuesAPI.search(params)

      if (response.data) {
        setVenues(response.data.venues || [])
        setTotalCount(response.data.totalCount || 0)
        setTotalPages(response.data.totalPages || 1)
        setCurrentPage(response.data.page || 1)

        // Update URL without reload
        const newParams = new URLSearchParams()
        if (params.q) newParams.set('q', params.q)
        if (params.city) newParams.set('city', params.city)
        if (params.state) newParams.set('state', params.state)
        if (page > 1) newParams.set('page', page.toString())
        if (sortBy !== 'createdAt') newParams.set('sortBy', sortBy)
        if (sortOrder !== 'desc') newParams.set('sortOrder', sortOrder)
        
        navigate(`/search?${newParams.toString()}`, { replace: true })
      }
    } catch (error) {
      console.error('Search error:', error)
      toast.error('Search failed. Please try again.')
      setVenues([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }

  // Initial search on mount or when params change
  useEffect(() => {
    searchVenues(currentPage)
  }, [location.search])

  // Check shortlist status for all venues
  useEffect(() => {
    const checkShortlistStatus = async () => {
      if (venues.length === 0) return
      
      try {
        const deviceId = getDeviceId()
        const statusPromises = venues.map(async (venue) => {
          try {
            const venueId = venue._id || venue.id
            const response = await shotlistAPI.checkStatus(venueId, deviceId)
            return { venueId, isLiked: response.data?.isLiked || false }
          } catch (error) {
            return { venueId: venue._id || venue.id, isLiked: false }
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

  // Handle search form submit
  const handleSearch = (e) => {
    e.preventDefault()
    setCurrentPage(1)
    searchVenues(1)
  }

  // Handle sort change
  const handleSortChange = (newSortBy, newSortOrder) => {
    setSortBy(newSortBy)
    setSortOrder(newSortOrder)
    setCurrentPage(1)
    const params = new URLSearchParams(location.search)
    params.set('sortBy', newSortBy)
    params.set('sortOrder', newSortOrder)
    params.set('page', '1')
    navigate(`/search?${params.toString()}`)
  }

  // Get venue image URL
  const getVenueImageUrl = (venue) => {
    // Extract image from venue - check multiple possible sources
    let image = null
    
    // 1. Check coverImage first (primary image field)
    if (venue.coverImage) {
      image = venue.coverImage
    }
    // 2. Check images array
    else if (venue.images && Array.isArray(venue.images) && venue.images.length > 0) {
      image = venue.images[0]
    }
    // 3. Check gallery.photos if gallery is an object
    else if (venue.gallery && typeof venue.gallery === 'object' && venue.gallery.photos && Array.isArray(venue.gallery.photos) && venue.gallery.photos.length > 0) {
      image = venue.gallery.photos[0]
    }
    // 4. Check galleryInfo.photos
    else if (venue.galleryInfo && venue.galleryInfo.photos && Array.isArray(venue.galleryInfo.photos) && venue.galleryInfo.photos.length > 0) {
      image = venue.galleryInfo.photos[0]
    }
    // 5. Check if gallery is an array (legacy format)
    else if (venue.gallery && Array.isArray(venue.gallery) && venue.gallery.length > 0) {
      image = venue.gallery[0]
    }
    // 6. Check image field (legacy)
    else if (venue.image) {
      image = venue.image
    }
    
    // If no image found, return default
    if (!image) {
      return 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&h=300&fit=crop'
    }
    
    // Handle if image is still an object (e.g., {url: "...", ...})
    if (typeof image === 'object') {
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
      const pathParts = image.split('/')
      const filename = pathParts.pop()
      const encodedFilename = encodeURIComponent(filename)
      const encodedPath = pathParts.join('/') + '/' + encodedFilename
      return `${baseUrl}${encodedPath}`
    }
    
    if (image.startsWith('uploads/')) {
      const pathParts = image.split('/')
      const filename = pathParts.pop()
      const encodedFilename = encodeURIComponent(filename)
      const encodedPath = pathParts.join('/') + '/' + encodedFilename
      return `${baseUrl}/${encodedPath}`
    }
    
    const encodedImage = encodeURIComponent(image)
    return `${baseUrl}/uploads/venues/${encodedImage}`
  }

  // Format price
  const formatPrice = (price) => {
    if (!price) return 'Contact for price'
    return `₹${price.toLocaleString('en-IN')}`
  }

  // Get venue slug
  const getVenueSlug = (venue) => {
    if (venue.slug) return venue.slug
    return createSlug(venue.name)
  }

  return (
    <>
      <SEO 
        title={`Search Venues${searchQuery ? ` - ${searchQuery}` : ''} | ShubhVenue`}
        description="Search and find the perfect venue for your event. Filter by location, city, state and more."
        keywords="venue search, event venues, wedding venues, party venues"
      />
      
      <div className="search-page">
        {/* Search Header */}
        <div className="search-header">
          <div className="container">
            <h1 className="search-title">Search Venues</h1>
            <p className="search-subtitle">Find your perfect venue</p>
            
            {/* Search Form */}
            <form onSubmit={handleSearch} className="search-form">
              <div className="search-form-bar">
                <div className="search-input-group">
                  <select
                    value={selectedState}
                    onChange={(e) => {
                      setSelectedState(e.target.value)
                      setSelectedCity('')
                    }}
                    className="search-select"
                  >
                    <option value="">Select State</option>
                    {states.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="search-input-group">
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="search-select"
                    disabled={!selectedState}
                  >
                    <option value="">Select City</option>
                    {cities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="search-input-group search-input-wrapper">
                  <input
                    type="text"
                    placeholder="Search Venues by Name, Sub Area..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                  />
                </div>
                
                <button type="submit" className="search-button" disabled={loading}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Results Section */}
        <div className="search-results">
          <div className="container">

            {/* Venues Grid */}
            {loading && venues.length === 0 ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Searching venues...</p>
              </div>
            ) : venues.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <h3>No venues found</h3>
                <p>Try adjusting your search criteria or filters</p>
                <button 
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedCity('')
                    setSelectedState('')
                    navigate('/search')
                  }}
                  className="clear-filters-btn"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div className="venues-grid">
                  {venues.map((venue) => {
                    const venueSlug = getVenueSlug(venue)
                    const locationText = venue.location?.city || venue.location || 'Location not specified'
                    const locationState = venue.location?.state ? `, ${venue.location.state}` : ''
                    const typeText = venue.categoryId?.name || venue.category?.name || venue.venueType || 'Venue'
                    const ratingValue = venue.rating?.average || 0
                    const reviewsCount = venue.rating?.totalReviews || 0
                    
                    return (
                      <div
                        key={venue._id || venue.id}
                        className="venue-card"
                        onClick={() => {
                          navigate(`/venue/${venueSlug}`)
                        }}
                      >
                        <div className="venue-image-wrapper">
                          <img
                            src={getVenueImageUrl(venue)}
                            alt={venue.name}
                            className="venue-image"
                            loading="lazy"
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&h=300&fit=crop'
                            }}
                          />
                          <button
                            className={`venue-shortlist-btn ${likedVenues.has(venue._id || venue.id) ? 'liked' : ''}`}
                            onClick={(e) => handleToggleLike(e, venue._id || venue.id)}
                            disabled={togglingVenueId === (venue._id || venue.id)}
                            title={likedVenues.has(venue._id || venue.id) ? 'Remove from shortlist' : 'Add to shortlist'}
                          >
                            <svg 
                              width="20" 
                              height="20" 
                              viewBox="0 0 24 24" 
                              fill={likedVenues.has(venue._id || venue.id) ? "currentColor" : "none"} 
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
                                {venue.capacity.minGuests || 0} - {venue.capacity.maxGuests || 0} Guests
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="pagination">
                    <button
                      onClick={() => searchVenues(currentPage - 1)}
                      disabled={currentPage === 1 || loading}
                      className="pagination-btn"
                    >
                      Previous
                    </button>
                    <div className="pagination-info">
                      Page {currentPage} of {totalPages}
                    </div>
                    <button
                      onClick={() => searchVenues(currentPage + 1)}
                      disabled={currentPage === totalPages || loading}
                      className="pagination-btn"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      
      <Footer />
    </>
  )
}

export default Search

