import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { bookingAPI } from '../../services/customer/api'
import { createSlug } from '../../utils/customer/slug'
import toast from 'react-hot-toast'
import Footer from '../../components/customer/Footer'
import LoginModal from '../../components/customer/LoginModal'
import './BookingHistory.css'

function BookingHistory() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // Default to 'all' to show all bookings including pending
  const [sortBy, setSortBy] = useState('newest')
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [showLoginModal, setShowLoginModal] = useState(false)

  // Helper function to get image URL
  const getImageUrl = (image) => {
    if (!image) return 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&h=300&fit=crop'
    if (image.startsWith('http://') || image.startsWith('https://')) {
      return image
    }
    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://shubhvenue.com'
    
    // Handle different path formats
    if (image.startsWith('/uploads/') || image.startsWith('/uploads')) {
      return `${baseUrl}${image}`
    }
    if (image.startsWith('uploads/')) {
      return `${baseUrl}/${image}`
    }
    
    // Handle other paths
    return `${baseUrl}${image.startsWith('/') ? image : `/${image}`}`
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

  // Generate device ID for tracking (same as Booking.jsx)
  const getDeviceId = () => {
    let deviceId = localStorage.getItem('deviceId')
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('deviceId', deviceId)
    }
    return deviceId
  }

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      toast.error('Please login to view your bookings')
      setShowLoginModal(true)
    }
  }, [])

  // Fetch bookings from API
  const fetchBookings = async (showLoading = true) => {
    try {
      // Check authentication
      const token = localStorage.getItem('token')
      if (!token) {
        setShowLoginModal(true)
        return
      }

      if (showLoading) setLoading(true)
      // Get deviceId to fetch bookings for this device
      const deviceId = getDeviceId()
      // Fetch all bookings without any status filter, include deviceId
      const response = await bookingAPI.getBookings({ deviceId })
      
      console.log('📥 Full API Response:', response.data)
      
      // Handle different response formats
      let bookingsData = []
      if (response.data?.success) {
        bookingsData = response.data.bookings || response.data.data || []
      } else if (Array.isArray(response.data)) {
        bookingsData = response.data
      }
      
      console.log('📦 Extracted Bookings Data:', bookingsData)
      console.log('📊 Total Bookings Count:', bookingsData.length)

        // Transform API response to component format
        const transformedBookings = bookingsData.map((booking) => {
          const venue = booking.venueId || booking.venue || {}
          const checkInDate = booking.dateFrom || booking.date
          const checkOutDate = booking.dateTo || booking.date
          
          // Extract status - ensure we use the exact value from API
          // If booking type is 'lead', set status to 'lead' to show "Lead" badge
          let bookingStatus = booking.status
          if (booking.type === 'lead') {
            bookingStatus = 'lead'
          } else if (!bookingStatus || bookingStatus === '') {
            // Only use fallback if status is truly missing
            bookingStatus = 'pending'
          }
          
          // Extract payment status
          let paymentStatus = booking.paymentStatus
          if (!paymentStatus || paymentStatus === '') {
            paymentStatus = 'pending'
          }
          
          console.log('📥 Booking from API:', {
            id: booking._id || booking.id,
            rooms: booking.rooms,
            roomsType: typeof booking.rooms,
            status: booking.status,
            extractedStatus: bookingStatus,
            paymentStatus: booking.paymentStatus,
            extractedPaymentStatus: paymentStatus,
            type: booking.type,
            deviceId: booking.deviceId,
            fullBooking: booking
          })
          
          // Extract image from multiple possible locations
          const venueImage = venue.images?.[0] || venue.coverImage || venue.image || null
          
          console.log('🖼️ Venue Image Debug:', {
            venueId: venue._id || venue.id,
            venueName: venue.name,
            images: venue.images,
            coverImage: venue.coverImage,
            image: venue.image,
            extractedImage: venueImage,
            formattedImage: getImageUrl(venueImage)
          })
          
          return {
            id: booking._id || booking.id,
            bookingId: booking._id || booking.id,
      venue: {
              id: venue._id || venue.id,
              name: venue.name || 'Unnamed Venue',
              image: getImageUrl(venueImage),
              location: formatLocation(venue.location)
      },
            checkIn: checkInDate ? (typeof checkInDate === 'string' ? checkInDate.split('T')[0] : new Date(checkInDate).toISOString().split('T')[0]) : '',
            checkOut: checkOutDate ? (typeof checkOutDate === 'string' ? checkOutDate.split('T')[0] : new Date(checkOutDate).toISOString().split('T')[0]) : '',
            guests: booking.guests || 0,
            rooms: booking.rooms !== undefined && booking.rooms !== null ? Number(booking.rooms) : 0,
            eventType: booking.eventType || 'Wedding',
            totalAmount: booking.totalAmount || 0, // Amount in rupees
            status: bookingStatus, // Use extracted status (exact value from API)
            paymentStatus: paymentStatus, // Use extracted payment status
            type: booking.type || null, // Store booking type to check if it's a lead
            bookingDate: booking.createdAt || booking.bookingDate || new Date().toISOString()
          }
        })

        console.log('✅ Transformed Bookings:', transformedBookings)
        console.log('📈 Transformed Count:', transformedBookings.length)
        console.log('📋 Status Breakdown:', transformedBookings.reduce((acc, b) => {
          acc[b.status] = (acc[b.status] || 0) + 1
          return acc
        }, {}))

        setBookings(transformedBookings)
      } catch (error) {
        console.error('Error fetching bookings:', error)
        if (showLoading) {
          toast.error('Failed to load bookings')
        }
        setBookings([])
      } finally {
        if (showLoading) setLoading(false)
      }
    }

  // Auto-refresh and initial fetch
  useEffect(() => {
    fetchBookings()
    
    // Auto-refresh bookings every 30 seconds to show newly approved bookings
    const refreshInterval = setInterval(() => {
      fetchBookings(false) // Refresh without showing loading spinner
    }, 30000) // Refresh every 30 seconds
    
    // Also refresh when page becomes visible (user switches back to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchBookings(false) // Refresh without showing loading spinner
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Cleanup
    return () => {
      clearInterval(refreshInterval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // Filter and sort bookings
  const filteredBookings = useMemo(() => {
    console.log('🔍 Filtering bookings:', {
      totalBookings: bookings.length,
      statusFilter: statusFilter,
      searchQuery: searchQuery
    })
    
    let filtered = bookings.filter(booking => {
      const matchesSearch = searchQuery === '' || 
        booking.venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.venue.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (booking.bookingId && booking.bookingId.toString().toLowerCase().includes(searchQuery.toLowerCase()))

      // Normalize status for comparison (case-insensitive)
      const normalizedBookingStatus = booking.status ? booking.status.toString().toLowerCase().trim() : 'pending'
      const normalizedFilterStatus = statusFilter ? statusFilter.toString().toLowerCase().trim() : 'all'
      
      const matchesStatus = normalizedFilterStatus === 'all' || normalizedBookingStatus === normalizedFilterStatus
      
      console.log('🔍 Booking filter check:', {
        id: booking.id,
        status: booking.status,
        normalizedStatus: normalizedBookingStatus,
        filterStatus: normalizedFilterStatus,
        matchesStatus: matchesStatus,
        matchesSearch: matchesSearch
      })

      return matchesSearch && matchesStatus
    })
    
    console.log('✅ Filtered bookings count:', filtered.length)

    // Sort bookings
    if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate))
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.bookingDate) - new Date(b.bookingDate))
    } else if (sortBy === 'amount-high') {
      filtered.sort((a, b) => {
        const amountA = typeof a.totalAmount === 'number' ? a.totalAmount : parseFloat(a.totalAmount) || 0
        const amountB = typeof b.totalAmount === 'number' ? b.totalAmount : parseFloat(b.totalAmount) || 0
        return amountB - amountA
      })
    } else if (sortBy === 'amount-low') {
      filtered.sort((a, b) => {
        const amountA = typeof a.totalAmount === 'number' ? a.totalAmount : parseFloat(a.totalAmount) || 0
        const amountB = typeof b.totalAmount === 'number' ? b.totalAmount : parseFloat(b.totalAmount) || 0
        return amountA - amountB
      })
    }

    return filtered
  }, [searchQuery, statusFilter, sortBy, bookings])

  const getStatusBadge = (status) => {
    // Normalize status to lowercase for comparison
    const normalizedStatus = status ? status.toString().toLowerCase().trim() : 'pending'
    
    const statusConfig = {
      confirmed: { label: 'Confirmed', class: 'status-confirmed' },
      pending: { label: 'Pending', class: 'status-pending' },
      completed: { label: 'Completed', class: 'status-completed' },
      cancelled: { label: 'Cancelled', class: 'status-cancelled' },
      canceled: { label: 'Cancelled', class: 'status-cancelled' }, // Handle alternate spelling
      failed: { label: 'Failed', class: 'status-cancelled' },
      new: { label: 'New', class: 'status-pending' },
      lead: { label: 'Lead', class: 'status-pending' }, // Lead status badge
      contacted: { label: 'Contacted', class: 'status-pending' },
      qualified: { label: 'Qualified', class: 'status-confirmed' },
      converted: { label: 'Converted', class: 'status-confirmed' },
      lost: { label: 'Lost', class: 'status-cancelled' }
    }
    
    // Return matching config or default to pending
    return statusConfig[normalizedStatus] || statusConfig.pending
  }

  const getPaymentStatusBadge = (paymentStatus) => {
    // Normalize payment status to lowercase for comparison
    const normalizedStatus = paymentStatus ? paymentStatus.toString().toLowerCase().trim() : 'pending'
    
    const paymentConfig = {
      paid: { label: 'Paid', class: 'payment-paid' },
      pending: { label: 'Pending', class: 'payment-pending' },
      failed: { label: 'Failed', class: 'payment-failed' },
      refunded: { label: 'Refunded', class: 'payment-refunded' }
    }
    
    // Return matching config or default to pending
    return paymentConfig[normalizedStatus] || paymentConfig.pending
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const calculateNights = (checkIn, checkOut) => {
    const checkInDate = new Date(checkIn)
    const checkOutDate = new Date(checkOut)
    const diffTime = Math.abs(checkOutDate - checkInDate)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <>
      <div className="booking-history-page">
        {/* Hero Section */}
        <div className="booking-history-hero">
          <div className="booking-history-hero-content">
            <h1 className="booking-history-page-title">
              My Booking
              <span className="gradient-text"> History</span>
            </h1>
            <p className="booking-history-page-subtitle">
              View and manage all your venue bookings in one place
            </p>
          </div>
          <div className="hero-decoration">
            <div className="decoration-circle circle-1"></div>
            <div className="decoration-circle circle-2"></div>
            <div className="decoration-circle circle-3"></div>
          </div>
        </div>

        <div className="booking-history-container">
          {/* Search and Filter Bar */}
          <div className="booking-history-toolbar">
            <div className="search-bar-wrapper">
              <div className="search-bar">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
                <input
                  type="text"
                  placeholder="Search by venue name, location, or booking ID..."
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
              <select 
                className="filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="lead">Lead</option>
                <option value="new">New</option>
                <option value="qualified">Qualified</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="failed">Failed</option>
              </select>

              <select 
                className="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Sort: Newest First</option>
                <option value="oldest">Sort: Oldest First</option>
                <option value="amount-high">Sort: Amount (High to Low)</option>
                <option value="amount-low">Sort: Amount (Low to High)</option>
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="results-info">
            <span className="results-count">
              <strong>{filteredBookings.length}</strong> {filteredBookings.length === 1 ? 'booking' : 'bookings'} found
            </span>
          </div>

          {/* Bookings List */}
          {filteredBookings.length > 0 ? (
            <div className="bookings-list">
              {filteredBookings.map((booking) => {
                const statusConfig = getStatusBadge(booking.status)
                const paymentStatusConfig = getPaymentStatusBadge(booking.paymentStatus)
                const nights = calculateNights(booking.checkIn, booking.checkOut)
                
                return (
                  <div key={booking.id} className="booking-card">
                    <div className="booking-card-image">
                      <img 
                        src={booking.venue.image} 
                        alt={booking.venue.name}
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&h=300&fit=crop'
                        }}
                      />
                      <div className="status-badges-container">
                      <div className={`status-badge ${statusConfig.class}`}>
                        {statusConfig.label}
                        </div>
                        {/* Hide payment status badge for leads */}
                        {booking.type !== 'lead' && (
                          <div className={`status-badge payment-badge ${paymentStatusConfig.class}`}>
                            {paymentStatusConfig.label}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="booking-card-content">
                      <div className="booking-card-header">
                        <div>
                          <h3 className="booking-venue-name">{booking.venue.name}</h3>
                          <p className="booking-venue-location">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                              <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                            {booking.venue.location}
                          </p>
                        </div>
                        <div className="booking-id">
                          <span className="booking-id-label">
                            {booking.type === 'lead' ? 'Lead Booking ID' : 'Booking ID'}
                          </span>
                          <span className="booking-id-value">{booking.bookingId}</span>
                        </div>
                      </div>

                      <div className="booking-details-grid">
                        <div className="booking-detail-item">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                          </svg>
                          <div>
                            <span className="detail-label">Check-in</span>
                            <span className="detail-value">{formatDate(booking.checkIn)}</span>
                          </div>
                        </div>

                        <div className="booking-detail-item">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                          </svg>
                          <div>
                            <span className="detail-label">Check-out</span>
                            <span className="detail-value">{formatDate(booking.checkOut)}</span>
                          </div>
                        </div>

                        <div className="booking-detail-item">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                          </svg>
                          <div>
                            <span className="detail-label">Guests</span>
                            <span className="detail-value">{booking.guests} guests</span>
                          </div>
                        </div>

                        <div className="booking-detail-item">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                            <polyline points="9 22 9 12 15 12 15 22"></polyline>
                          </svg>
                          <div>
                            <span className="detail-label">Rooms</span>
                            <span className="detail-value">{booking.rooms} rooms</span>
                          </div>
                        </div>

                        <div className="booking-detail-item">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                          </svg>
                          <div>
                            <span className="detail-label">Event Type</span>
                            <span className="detail-value">{booking.eventType}</span>
                          </div>
                        </div>

                        <div className="booking-detail-item">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="1" x2="12" y2="23"></line>
                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                          </svg>
                          <div>
                            <span className="detail-label">Duration</span>
                            <span className="detail-value">{nights} {nights === 1 ? 'night' : 'nights'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="booking-card-footer">
                        {/* Hide Total Amount for leads */}
                        {booking.type !== 'lead' && (
                          <div className="booking-amount">
                            <span className="amount-label">Total Amount</span>
                            <span className="amount-value">₹ {typeof booking.totalAmount === 'number' ? booking.totalAmount.toLocaleString('en-IN') : booking.totalAmount}</span>
                          </div>
                        )}
                        <div className="booking-actions">
                          <button 
                            className="action-btn view-btn"
                            onClick={() => navigate(`/venue/${createSlug(booking.venue.name)}`)}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                              <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                            View Venue
                          </button>
                          {(booking.status === 'pending' || booking.status === 'confirmed') && (
                            <button 
                              className="action-btn cancel-btn"
                              onClick={async () => {
                                if (window.confirm('Are you sure you want to cancel this booking?')) {
                                  try {
                                    await bookingAPI.updateStatus(booking.id, 'cancelled')
                                    toast.success('Booking cancelled successfully')
                                    fetchBookings(false) // Refresh without showing loading
                                  } catch (error) {
                                    console.error('Error cancelling booking:', error)
                                    toast.error('Failed to cancel booking')
                                  }
                                }
                              }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                              </svg>
                              Cancel
                            </button>
                          )}
                          {booking.status === 'completed' && (
                            <button className="action-btn review-btn">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                              </svg>
                              Write Review
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="no-bookings">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                <polyline points="7 3 7 8 15 8"></polyline>
              </svg>
              <h3>No bookings found</h3>
              <p>Try adjusting your filters or search query</p>
              <button className="browse-venues-btn" onClick={() => navigate('/venues')}>
                Browse Venues
              </button>
            </div>
          )}
        </div>
      </div>
      <Footer />
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => {
          setShowLoginModal(false)
          navigate('/')
        }}
        onLoginSuccess={() => {
          setShowLoginModal(false)
          // Reload to fetch bookings
          window.location.reload()
        }}
      />
    </>
  )
}

export default BookingHistory

