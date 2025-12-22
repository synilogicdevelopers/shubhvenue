import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Footer from '../../components/customer/Footer'
import SEO from '../../components/SEO'
import './Venue.css'
import { publicVenuesAPI } from '../../services/customer/api'
import { createSlug } from '../../utils/customer/slug'
import toast from 'react-hot-toast'

const Venue = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('all')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedRating, setSelectedRating] = useState('all')
  const [priceRange, setPriceRange] = useState('all')
  const [sortBy, setSortBy] = useState('default')
  const [showFilters, setShowFilters] = useState(false)
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const [allVenues, setAllVenues] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(9) // 9 venues per page

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
    if (!price) return 0
    if (typeof price === 'number') return price
    return parseFloat(price) || 0
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

  // Get search params from location state (from navbar search)
  const searchParams = location.state?.searchParams || {}

  // Get category filter from location state, search params, or URL params
  const categoryId = location.state?.categoryId || searchParams.categoryId || new URLSearchParams(location.search).get('categoryId')
  const categoryName = location.state?.categoryName || searchParams.categoryName
  // Get submenu filter from location state
  const submenuId = location.state?.submenuId
  const submenuName = location.state?.submenuName
  const menuId = location.state?.menuId
  const menuName = location.state?.menuName
  
  // Debug logging
  useEffect(() => {
    if (submenuId) {
      console.log('Venue page - submenuId:', submenuId, 'submenuName:', submenuName)
    }
    if (menuId) {
      console.log('Venue page - menuId:', menuId, 'menuName:', menuName)
    }
  }, [submenuId, submenuName, menuId, menuName])

  // Fetch all venues from API
  useEffect(() => {
    const fetchVenues = async () => {
      try {
        setLoading(true)
        // Prepare API params
        // Note: Backend accepts both 'active' and 'approved' status for public access
        // For submenu/menu filters, we'll try 'active' first, then fallback to 'approved' if no results
        const apiParams = { 
          // Show only active venues to customers
          status: 'active'
        }
        
        console.log('Fetching venues with filters - submenuId:', submenuId, 'menuId:', menuId, 'categoryId:', categoryId)
        console.log('Location state:', location.state)
        
        // Add category filter if categoryId is provided
        if (categoryId) {
          apiParams.categoryId = categoryId
        }
        // Add search params if provided
        if (searchParams.q) {
          apiParams.search = searchParams.q
        }
        if (searchParams.city) {
          apiParams.city = searchParams.city
        }
        if (searchParams.state) {
          apiParams.state = searchParams.state
        }
        
        // Add submenu filter if submenuId is provided
        if (submenuId) {
          // Normalize submenuId to string (handle both string and object IDs)
          const normalizedSubmenuId = String(submenuId).trim()
          apiParams.subMenuId = normalizedSubmenuId
          console.log('Adding subMenuId filter:', normalizedSubmenuId, '(original:', submenuId, ')')
        }
        // Add menu filter if menuId is provided (backend will filter for venues directly assigned to menu, not submenus)
        if (menuId) {
          apiParams.menuId = menuId
          console.log('Adding menuId filter:', menuId)
        }
        
        console.log('API Params:', apiParams)
        
        // Use search API if search query is provided, otherwise use getAll
        let response
        if (searchParams.q || searchParams.city || searchParams.state) {
            // Use search API for better search results
            const searchApiParams = {}
            if (searchParams.q) searchApiParams.q = searchParams.q
            if (searchParams.city) searchApiParams.city = searchParams.city
            if (searchParams.state) searchApiParams.state = searchParams.state
            if (categoryId) searchApiParams.categoryId = categoryId
            if (submenuId) searchApiParams.subMenuId = submenuId
            if (menuId) searchApiParams.menuId = menuId
            // Ensure we only surface active venues in search results
            searchApiParams.status = 'active'
            searchApiParams.limit = 50
            
            response = await Promise.race([
              publicVenuesAPI.search(searchApiParams),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Request timeout')), 30000)
              )
            ])
          } else {
            // Fetch all approved venues
            response = await Promise.race([
              publicVenuesAPI.getAll(apiParams),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Request timeout')), 30000)
              )
            ])
          }
        
        console.log('Full API Response:', response)
        console.log('Response Data:', response.data)
        
        if (response.data) {
          let venuesData = []
          
          // Check multiple possible response formats
          if (response.data.success && response.data.data) {
            venuesData = Array.isArray(response.data.data) ? response.data.data : []
          } else if (response.data.venues) {
            venuesData = Array.isArray(response.data.venues) ? response.data.venues : []
          } else if (response.data.data) {
            venuesData = Array.isArray(response.data.data) ? response.data.data : []
          } else if (Array.isArray(response.data)) {
            venuesData = response.data
          } else if (response.data.results && Array.isArray(response.data.results)) {
            venuesData = response.data.results
          }
          
          console.log('Extracted Venues Data:', venuesData)
          console.log('Venues Count:', venuesData.length)
          
          // If no active venues found, try fetching approved venues as fallback
          if (venuesData.length === 0) {
            console.warn('No active venues found. Trying approved venues as fallback...')
            try {
              let fallbackResponse
              if (searchParams.q || searchParams.city || searchParams.state) {
                // Use search API for fallback if search was used
                const fallbackSearchParams = {}
                if (searchParams.q) fallbackSearchParams.q = searchParams.q
                if (searchParams.city) fallbackSearchParams.city = searchParams.city
                if (searchParams.state) fallbackSearchParams.state = searchParams.state
                if (categoryId) fallbackSearchParams.categoryId = categoryId
                if (submenuId) fallbackSearchParams.subMenuId = String(submenuId).trim()
                if (menuId) fallbackSearchParams.menuId = String(menuId).trim()
                fallbackSearchParams.status = 'approved'
                fallbackSearchParams.limit = 50
                
                fallbackResponse = await Promise.race([
                  publicVenuesAPI.search(fallbackSearchParams),
                  new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Request timeout')), 30000)
                  )
                ])
              } else {
                // Use getAll for fallback
                const fallbackParams = { ...apiParams, status: 'approved' }
                fallbackResponse = await Promise.race([
                  publicVenuesAPI.getAll(fallbackParams),
                  new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Request timeout')), 30000)
                  )
                ])
              }
              
              if (fallbackResponse.data) {
                if (fallbackResponse.data.success && fallbackResponse.data.data) {
                  venuesData = Array.isArray(fallbackResponse.data.data) ? fallbackResponse.data.data : []
                } else if (fallbackResponse.data.venues) {
                  venuesData = Array.isArray(fallbackResponse.data.venues) ? fallbackResponse.data.venues : []
                } else if (fallbackResponse.data.data) {
                  venuesData = Array.isArray(fallbackResponse.data.data) ? fallbackResponse.data.data : []
                } else if (Array.isArray(fallbackResponse.data)) {
                  venuesData = fallbackResponse.data
                }
                console.log('Fallback approved venues count:', venuesData.length)
              }
            } catch (fallbackError) {
              console.error('Error fetching fallback venues:', fallbackError)
            }
          }
          
          // If still no venues found, log the full response for debugging
          if (venuesData.length === 0) {
            console.warn('No venues found after fallback. Full response:', JSON.stringify(response.data, null, 2))
          }
          
          // Client-side guard: hide vendor deactivated venues (vendorActive === false)
          const visibleVenues = venuesData.filter(v => v.vendorActive !== false)

          // Optimize: Process data more efficiently with batch processing
          const formattedVenues = visibleVenues.map(venue => {
            // Debug capacity parsing
            const capacityValue = venue.capacity ? 
              (typeof venue.capacity === 'object' ? 
                `${venue.capacity.minGuests || venue.capacity.min || 0}-${venue.capacity.maxGuests || venue.capacity.max || 0}` : 
                `${venue.capacity}`) : 
              null;
            
            if (venue.name === 'test' || venue._id) {
              console.log('Venue capacity debug:', {
                name: venue.name,
                capacity: venue.capacity,
                capacityValue,
                rooms: venue.rooms
              });
            }
            
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
              image: getVenueImageUrl(venue.images || venue.image),
              rating: ratingValue,
              reviews: reviewsCount,
              location: formatLocation(venue.location),
              type: venue.categoryId?.name || venue.category?.name || venue.venueType || 'Venue',
              price: formatPrice(venue.price),
              priceDisplay: formatPrice(venue.price) > 0 ? `${formatPrice(venue.price).toFixed(2)} Lakh` : 'Price on request',
              rooms: venue.rooms || venue.roomCount || 0,
              capacity: capacityValue,
              highlights: venue.highlights || [],
              moreTags: venue.tags?.length || 0,
              // Store original location object for filtering
              locationObj: venue.location
            };
          })
          
          console.log('Formatted Venues:', formattedVenues)
          console.log('Formatted Venues Count:', formattedVenues.length)
          
          if (formattedVenues.length > 0) {
            setAllVenues(formattedVenues)
          } else {
            console.warn('No venues found in response')
            setAllVenues([])
          }
        } else {
          console.error('Invalid API response:', response.data)
          toast.error('Failed to load venues')
          setAllVenues([])
        }
      } catch (error) {
        console.error('Error fetching venues:', error)
        if (error.message === 'Request timeout') {
          toast.error('Request took too long. Please try again.')
        } else {
          toast.error('Failed to load venues')
        }
        setAllVenues([])
      } finally {
        setLoading(false)
      }
    }

    fetchVenues()
  }, [categoryId, submenuId, menuId, searchParams.q, searchParams.city, searchParams.state])

  // Get unique locations and types from API data
  const locations = useMemo(() => {
    const locationSet = new Set()
    allVenues.forEach(v => {
      if (v.locationObj && typeof v.locationObj === 'object') {
        if (v.locationObj.city) locationSet.add(v.locationObj.city)
        if (v.locationObj.state) locationSet.add(v.locationObj.state)
      } else if (v.location && typeof v.location === 'string') {
        const city = v.location.split(',')[0].trim()
        if (city) locationSet.add(city)
      }
    })
    return ['all', ...Array.from(locationSet).sort()]
  }, [allVenues])

  const types = useMemo(() => {
    const uniqueTypes = Array.from(new Set(allVenues.map(v => v.type).filter(Boolean)))
    return ['all', ...uniqueTypes.sort()]
  }, [allVenues])

  // Preselect type when category is provided from search/navigation
  useEffect(() => {
    if (categoryName) {
      setSelectedType(categoryName)
    } else {
      setSelectedType('all')
    }
  }, [categoryName])

  // Filter and sort venues
  const filteredVenues = useMemo(() => {
    console.log('=== FILTERING VENUES ===')
    console.log('Total venues in allVenues:', allVenues.length)
    console.log('All venues:', allVenues)
    console.log('Filters - Search:', searchQuery, 'Location:', selectedLocation, 'Type:', selectedType, 'Rating:', selectedRating, 'Price:', priceRange)
    
    let filtered = allVenues.filter(venue => {
      // Search query filter
      const matchesSearch = searchQuery === '' || 
        venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        venue.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        venue.type.toLowerCase().includes(searchQuery.toLowerCase())

      // Location filter
      const matchesLocation = selectedLocation === 'all' || 
        (venue.locationObj && typeof venue.locationObj === 'object' && 
         (venue.locationObj.city === selectedLocation || venue.locationObj.state === selectedLocation)) ||
        venue.location.toLowerCase().includes(selectedLocation.toLowerCase())

      // Type filter
      const matchesType = selectedType === 'all' || venue.type === selectedType

      // Rating filter
      const matchesRating = selectedRating === 'all' || 
        (selectedRating === '4+' && venue.rating >= 4) ||
        (selectedRating === '4.5+' && venue.rating >= 4.5) ||
        (selectedRating === '5' && venue.rating === 5)

      // Price range filter
      const matchesPrice = priceRange === 'all' ||
        (priceRange === 'low' && venue.price < 10) ||
        (priceRange === 'medium' && venue.price >= 10 && venue.price < 20) ||
        (priceRange === 'high' && venue.price >= 20)

      const matches = matchesSearch && matchesLocation && matchesType && matchesRating && matchesPrice
      
      // Debug individual venue filtering
      if (!matches && allVenues.length <= 5) {
        console.log(`Venue "${venue.name}" filtered out:`, {
          matchesSearch,
          matchesLocation,
          matchesType,
          matchesRating,
          matchesPrice,
          venueLocation: venue.location,
          venueType: venue.type,
          venueRating: venue.rating,
          venuePrice: venue.price
        })
      }
      
      return matches
    })

    // Sort venues
    if (sortBy === 'price-low') {
      filtered.sort((a, b) => a.price - b.price)
    } else if (sortBy === 'price-high') {
      filtered.sort((a, b) => b.price - a.price)
    } else if (sortBy === 'rating') {
      filtered.sort((a, b) => b.rating - a.rating)
    } else if (sortBy === 'reviews') {
      filtered.sort((a, b) => b.reviews - a.reviews)
    }

    console.log('Filtered venues count:', filtered.length)
    console.log('Filtered venues:', filtered)
    console.log('=== END FILTERING ===')
    return filtered
  }, [allVenues, searchQuery, selectedLocation, selectedType, selectedRating, priceRange, sortBy])

  // Pagination logic
  const totalPages = Math.ceil(filteredVenues.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedVenues = filteredVenues.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedLocation, selectedType, selectedRating, priceRange, sortBy])

  // Close sort dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSortDropdown && !event.target.closest('.sort-dropdown-wrapper')) {
        setShowSortDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showSortDropdown])

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedLocation('all')
    setSelectedType('all')
    setSelectedRating('all')
    setPriceRange('all')
    setSortBy('default')
  }

  const activeFiltersCount = [
    searchQuery,
    selectedLocation !== 'all',
    selectedType !== 'all',
    selectedRating !== 'all',
    priceRange !== 'all',
    sortBy !== 'default'
  ].filter(Boolean).length

  // Get location for SEO from search params or selected location
  const seoLocation = searchParams.city || searchParams.state || (selectedLocation !== 'all' ? selectedLocation : null)

  return (
    <div className="venues-page">
      <SEO location={seoLocation} />
      {/* Category/Submenu Filter Banner */}
      {(categoryName || submenuName || menuName) && (
        <div style={{ 
          background: 'linear-gradient(135deg, #92487a 0%, #b85a8f 100%)',
          color: 'white',
          padding: '16px 20px',
          textAlign: 'center',
          marginBottom: '20px'
        }}>
          <p style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
            Showing venues for: <strong>{submenuName || menuName || categoryName}</strong>
            <button 
              onClick={() => {
                navigate('/venues', { replace: true })
                window.location.reload()
              }}
              style={{
                marginLeft: '12px',
                padding: '6px 12px',
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '6px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Clear Filter
            </button>
          </p>
        </div>
      )}
      {/* Hero Header Section */}
      <div className="venues-hero">
        <div className="venues-hero-content">
          <h1 className="venues-page-title">
            Discover Your Perfect
            <span className="gradient-text"> Venue</span>
          </h1>
          <p className="venues-page-subtitle">
            Explore our curated collection of premium venues for your special occasions
          </p>
          
          {/* Search and Filter Bar inside Hero */}
          <div className="venues-toolbar">
          <div className="search-bar-wrapper">
            <div className="search-bar">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <input
                type="text"
                placeholder="Search venues by name, location, or type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              {searchQuery && (
                <button 
                  className="clear-search-btn"
                  onClick={() => setSearchQuery('')}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="toolbar-actions">
            <button 
              className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
              </svg>
              Filters
              {activeFiltersCount > 0 && (
                <span className="filter-badge">{activeFiltersCount}</span>
              )}
            </button>

            <div className={`sort-dropdown-wrapper ${showSortDropdown ? 'show' : ''}`}>
              <button
                className="sort-select"
                onClick={() => setShowSortDropdown(!showSortDropdown)}
              >
                <span>
                  {sortBy === 'default' && 'Sort by: Default'}
                  {sortBy === 'rating' && 'Sort by: Rating'}
                  {sortBy === 'reviews' && 'Sort by: Reviews'}
                  {sortBy === 'price-low' && 'Sort by: Price (Low to High)'}
                  {sortBy === 'price-high' && 'Sort by: Price (High to Low)'}
                </span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              {showSortDropdown && (
                <div className="sort-dropdown-menu">
                  <button
                    className={`sort-dropdown-item ${sortBy === 'default' ? 'active' : ''}`}
                    onClick={() => {
                      setSortBy('default')
                      setShowSortDropdown(false)
                    }}
                  >
                    Sort by: Default
                  </button>
                  <button
                    className={`sort-dropdown-item ${sortBy === 'rating' ? 'active' : ''}`}
                    onClick={() => {
                      setSortBy('rating')
                      setShowSortDropdown(false)
                    }}
                  >
                    Sort by: Rating
                  </button>
                  <button
                    className={`sort-dropdown-item ${sortBy === 'reviews' ? 'active' : ''}`}
                    onClick={() => {
                      setSortBy('reviews')
                      setShowSortDropdown(false)
                    }}
                  >
                    Sort by: Reviews
                  </button>
                  <button
                    className={`sort-dropdown-item ${sortBy === 'price-low' ? 'active' : ''}`}
                    onClick={() => {
                      setSortBy('price-low')
                      setShowSortDropdown(false)
                    }}
                  >
                    Sort by: Price (Low to High)
                  </button>
                  <button
                    className={`sort-dropdown-item ${sortBy === 'price-high' ? 'active' : ''}`}
                    onClick={() => {
                      setSortBy('price-high')
                      setShowSortDropdown(false)
                    }}
                  >
                    Sort by: Price (High to Low)
                  </button>
                </div>
              )}
            </div>
          </div>
          </div>
        </div>
        <div className="hero-decoration">
          <div className="decoration-circle circle-1"></div>
          <div className="decoration-circle circle-2"></div>
          <div className="decoration-circle circle-3"></div>
        </div>
      </div>

      <div className="venues-page-container">

        {/* Active Filters Tags */}
        {activeFiltersCount > 0 && (
          <div className="active-filters">
            <span className="active-filters-label">Active Filters:</span>
            <div className="filter-tags">
              {searchQuery && (
                <span className="filter-tag">
                  Search: "{searchQuery}"
                  <button onClick={() => setSearchQuery('')}>×</button>
                </span>
              )}
              {selectedLocation !== 'all' && (
                <span className="filter-tag">
                  {selectedLocation}
                  <button onClick={() => setSelectedLocation('all')}>×</button>
                </span>
              )}
              {selectedType !== 'all' && (
                <span className="filter-tag">
                  {selectedType}
                  <button onClick={() => setSelectedType('all')}>×</button>
                </span>
              )}
              {selectedRating !== 'all' && (
                <span className="filter-tag">
                  {selectedRating === '4+' ? '4+ Stars' : selectedRating === '4.5+' ? '4.5+ Stars' : '5 Stars'}
                  <button onClick={() => setSelectedRating('all')}>×</button>
                </span>
              )}
              {priceRange !== 'all' && (
                <span className="filter-tag">
                  {priceRange === 'low' ? 'Under ₹10L' : priceRange === 'medium' ? '₹10-20L' : 'Above ₹20L'}
                  <button onClick={() => setPriceRange('all')}>×</button>
                </span>
              )}
              <button className="clear-all-btn" onClick={clearFilters}>
                Clear All
              </button>
            </div>
          </div>
        )}

        {/* Filters Panel */}
        {showFilters && (
          <div className="filters-panel">
            <div className="filters-header">
              <h3>Filter Venues</h3>
              <button className="close-filters-btn" onClick={() => setShowFilters(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="filters-content">
              <div className="filter-group">
                <label>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  Location
                </label>
                <div className="filter-options">
                  {locations.map(location => (
                    <button
                      key={location}
                      className={`filter-chip ${selectedLocation === location ? 'active' : ''}`}
                      onClick={() => setSelectedLocation(location)}
                    >
                      {location === 'all' ? 'All Locations' : location}
                    </button>
                  ))}
                </div>
              </div>

              <div className="filter-group">
                <label>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  </svg>
                  Venue Type
                </label>
                <div className="filter-options">
                  {types.map(type => (
                    <button
                      key={type}
                      className={`filter-chip ${selectedType === type ? 'active' : ''}`}
                      onClick={() => setSelectedType(type)}
                    >
                      {type === 'all' ? 'All Types' : type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="filter-group">
                <label>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                  Rating
                </label>
                <div className="filter-options">
                  {['all', '4+', '4.5+', '5'].map(rating => (
                    <button
                      key={rating}
                      className={`filter-chip ${selectedRating === rating ? 'active' : ''}`}
                      onClick={() => setSelectedRating(rating)}
                    >
                      {rating === 'all' ? 'All Ratings' : rating === '4+' ? '4+ Stars' : rating === '4.5+' ? '4.5+ Stars' : '5 Stars Only'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="filter-group">
                <label>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="1" x2="12" y2="23"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                  Price Range
                </label>
                <div className="filter-options">
                  {[
                    { value: 'all', label: 'All Prices' },
                    { value: 'low', label: 'Under ₹10 Lakh' },
                    { value: 'medium', label: '₹10-20 Lakh' },
                    { value: 'high', label: 'Above ₹20 Lakh' }
                  ].map(price => (
                    <button
                      key={price.value}
                      className={`filter-chip ${priceRange === price.value ? 'active' : ''}`}
                      onClick={() => setPriceRange(price.value)}
                    >
                      {price.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Venues Grid */}
        {loading ? (
          <div className="venues-loading">
            <img 
              src="/image/venuebook.png" 
              alt="ShubhVenue Logo" 
              className="venues-loading-logo"
              onError={(e) => {
                e.target.onerror = null
                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiByeD0iMTIiIGZpbGw9InVybCgjZ3JhZGllbnQpIi8+CjxzdmcgeD0iMTgiIHk9IjE4IiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSI+CjxwYXRoIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0wIDNjMS42NiAwIDMgMS4zNCAzIDNzLTEuMzQgMy0zIDMtMy0xLjM0LTMtMyAxLjM0LTMgMy0zem0wIDE0LjJjLTIuNjcgMC04IDEuMzQtOCA0djEuOGgxNnYtMS44YzAtMi42Ni01LjMzLTQtOC00eiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9ImdyYWRpZW50IiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj4KPHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6Izk0NDg3QTtzdG9wLW9wYWNpdHk6MSIgLz4KPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojRUM0ODk5O3N0b3Atb3BhY2l0eToxIiAvPgo8L2xpbmVhckdyYWRpZW50Pgo8L2RlZnM+Cjwvc3ZnPg=='
              }}
            />
            <div className="venues-loading-text">Loading venues...</div>
          </div>
        ) : null}
        {loading ? (
          <div className="venues-grid">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="venue-card" style={{ opacity: 0.7 }}>
                <div className="venue-image-wrapper" style={{ 
                  background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.5s infinite'
                }}>
                  <div style={{ width: '100%', height: '100%' }}></div>
                </div>
                <div className="venue-content">
                  <div style={{ 
                    height: '24px', 
                    background: '#e0e0e0', 
                    borderRadius: '4px',
                    marginBottom: '12px',
                    width: '70%'
                  }}></div>
                  <div style={{ 
                    height: '16px', 
                    background: '#e0e0e0', 
                    borderRadius: '4px',
                    marginBottom: '8px',
                    width: '50%'
                  }}></div>
                  <div style={{ 
                    height: '16px', 
                    background: '#e0e0e0', 
                    borderRadius: '4px',
                    width: '60%'
                  }}></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredVenues.length > 0 ? (
          <>
          <div className="venues-grid">
            {paginatedVenues.map((venue) => (
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
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <div className="pagination-info">
                <span className="pagination-text">
                  Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
                </span>
              </div>
              
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
                Previous
              </button>
              
              <div className="pagination-numbers">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                  // Show first page, last page, current page, and pages around current
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    )
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return <span key={page} className="pagination-ellipsis">...</span>
                  }
                  return null
                })}
              </div>
              
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          )}
          </>
        ) : allVenues.length === 0 ? (
          <div className="no-results">
            <div className="no-results-content">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <h3>No venues available</h3>
              <p>Please check back later or contact support</p>
            </div>
          </div>
        ) : (
          <div className="no-results">
            <div className="no-results-content">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <h3>No venues found</h3>
              <p>Try adjusting your filters or search query</p>
              <button className="clear-filters-btn" onClick={clearFilters}>
                Clear All Filters
              </button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
    
  )
}

export default Venue
