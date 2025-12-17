import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Footer from '../../components/customer/Footer'
import { bookingAPI } from '../../services/customer/api'
import './Booking.css'

function ContactVenue() {
  const navigate = useNavigate()
  const location = useLocation()

  const venueData = location.state?.venue

  // If user directly hits URL without state
  useEffect(() => {
    if (!venueData) {
      toast.error('Venue information is missing')
      navigate('/venues')
    }
  }, [venueData, navigate])

  const venue = venueData
    ? {
        ...venueData,
        id: venueData.id || venueData._id,
        image:
          venueData.images?.[0] ||
          venueData.coverImage ||
          venueData.image ||
          'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&h=300&fit=crop',
      }
    : null

  const [formData, setFormData] = useState({
    checkIn: '',
    checkOut: '',
    guests: '',
    rooms: '',
    fullName: '',
    email: '',
    phone: '',
    eventType: '',
    foodPreference: 'both',
    specialRequests: '',
  })

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const calculateNights = () => {
    if (formData.checkIn && formData.checkOut) {
      const checkIn = new Date(formData.checkIn)
      const checkOut = new Date(formData.checkOut)
      const diffTime = Math.abs(checkOut - checkIn)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays > 0 ? diffDays : 0
    }
    return 0
  }

  const nights = calculateNights()

  const getDeviceId = () => {
    let deviceId = localStorage.getItem('deviceId')
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('deviceId', deviceId)
    }
    return deviceId
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.checkIn) newErrors.checkIn = 'Check-in date is required'
    if (!formData.checkOut) newErrors.checkOut = 'Check-out date is required'
    if (formData.checkIn && formData.checkOut) {
      const checkIn = new Date(formData.checkIn)
      const checkOut = new Date(formData.checkOut)
      if (checkOut <= checkIn) {
        newErrors.checkOut = 'Check-out must be after check-in'
      }
    }
    if (!formData.guests) newErrors.guests = 'Number of guests is required'
    if (!formData.fullName) newErrors.fullName = 'Full name is required'
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }
    if (!formData.phone) {
      newErrors.phone = 'Phone number is required'
    } else if (!/^[0-9]{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit phone number'
    }
    if (!formData.eventType) newErrors.eventType = 'Event type is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!venue?.id) {
      toast.error('Venue information is missing')
      navigate('/venues')
      return
    }

    if (!validateForm()) return

    try {
      setIsSubmitting(true)

      const checkInDate = new Date(formData.checkIn)
      const checkOutDate = new Date(formData.checkOut)
      const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)) || 1
      const baseAmount = 10000
      const totalAmount = baseAmount * nights

      const bookingData = {
        venueId: venue.id,
        date: formData.checkIn,
        dateFrom: formData.checkIn,
        dateTo: formData.checkOut,
        guests: parseInt(formData.guests),
        rooms: formData.rooms && formData.rooms !== '' ? parseInt(formData.rooms) || 0 : 0,
        eventType: formData.eventType,
        marriageFor: 'boy',
        name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        foodPreference: formData.foodPreference,
        totalAmount,
        deviceId: getDeviceId(),
        specialRequests: formData.specialRequests,
      }

      const response = await bookingAPI.create(bookingData)

      if (response.data?.success) {
        toast.success(response.data.message || 'Inquiry submitted successfully! Venue will contact you soon.')
        navigate(-1)
      } else {
        toast.error(response.data?.error || 'Failed to submit inquiry')
      }
    } catch (error) {
      console.error('Contact venue error:', error)
      toast.error(error.message || 'Failed to submit inquiry')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!venue) return null

  return (
    <div className="booking-page">
      <button type="button" className="back-button" onClick={() => navigate(-1)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
        Back
      </button>

      <div className="booking-hero">
        <div className="hero-decoration">
          <div className="decoration-circle circle-1"></div>
          <div className="decoration-circle circle-2"></div>
          <div className="decoration-circle circle-3"></div>
        </div>
        <div className="booking-hero-content">
          <h1 className="booking-page-title">Contact Venue</h1>
          <p className="booking-page-subtitle">Share your event details and the venue will contact you soon.</p>
        </div>
      </div>

      <div className="booking-container">
        <div className="booking-content">
          <div className="booking-form-section">
            <div className="section-header">
              <h2 className="section-title">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Inquiry Form
              </h2>
              <div className="section-underline"></div>
            </div>

            <form className="booking-form" onSubmit={handleSubmit}>
              {/* Dates */}
              <div>
                <h3 className="section-subtitle">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  Dates & Guests
                </h3>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Check-in Date *</label>
                    <input
                      type="date"
                      name="checkIn"
                      value={formData.checkIn}
                      onChange={handleChange}
                      className={`form-input ${errors.checkIn ? 'error' : ''}`}
                      required
                      min={new Date().toISOString().split('T')[0]}
                    />
                    {errors.checkIn && <span className="error-message">{errors.checkIn}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Check-out Date *</label>
                    <input
                      type="date"
                      name="checkOut"
                      value={formData.checkOut}
                      onChange={handleChange}
                      className={`form-input ${errors.checkOut ? 'error' : ''}`}
                      required
                      min={formData.checkIn || new Date().toISOString().split('T')[0]}
                    />
                    {errors.checkOut && <span className="error-message">{errors.checkOut}</span>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Guests *</label>
                    <input
                      type="number"
                      name="guests"
                      value={formData.guests}
                      onChange={handleChange}
                      className={`form-input ${errors.guests ? 'error' : ''}`}
                      placeholder="e.g. 200"
                      min="1"
                      required
                    />
                    {errors.guests && <span className="error-message">{errors.guests}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Rooms (Optional)</label>
                    <input
                      type="number"
                      name="rooms"
                      value={formData.rooms}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="e.g. 10"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div>
                <h3 className="section-subtitle">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  Your Details
                </h3>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className={`form-input ${errors.fullName ? 'error' : ''}`}
                      placeholder="Your name"
                      required
                    />
                    {errors.fullName && <span className="error-message">{errors.fullName}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`form-input ${errors.email ? 'error' : ''}`}
                      placeholder="you@example.com"
                      required
                    />
                    {errors.email && <span className="error-message">{errors.email}</span>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Phone *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`form-input ${errors.phone ? 'error' : ''}`}
                      placeholder="10-digit number"
                      required
                    />
                    {errors.phone && <span className="error-message">{errors.phone}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Event Type *</label>
                    <select
                      name="eventType"
                      value={formData.eventType}
                      onChange={handleChange}
                      className={`form-input ${errors.eventType ? 'error' : ''}`}
                      required
                    >
                      <option value="">Select event type</option>
                      <option value="wedding">Wedding</option>
                      <option value="party">Party</option>
                      <option value="birthday party">Birthday Party</option>
                      <option value="anniversary">Anniversary</option>
                      <option value="engagement">Engagement</option>
                      <option value="reception">Reception</option>
                      <option value="other">Other</option>
                    </select>
                    {errors.eventType && <span className="error-message">{errors.eventType}</span>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Food Preference *</label>
                    <select
                      name="foodPreference"
                      value={formData.foodPreference}
                      onChange={handleChange}
                      className="form-input"
                      required
                    >
                      <option value="both">Both (Veg & Non-Veg)</option>
                      <option value="veg">Vegetarian</option>
                      <option value="non-veg">Non-Vegetarian</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Special Requests</label>
                  <textarea
                    name="specialRequests"
                    value={formData.specialRequests}
                    onChange={handleChange}
                    className="form-input form-textarea"
                    placeholder="Any special requirements or requests..."
                    rows="4"
                  />
                </div>
              </div>

              <button type="submit" className="submit-btn" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <svg className="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 2L11 13"></path>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                    Submit Inquiry
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="booking-summary">
            <div className="summary-header">
              <h3 className="summary-title">Inquiry Summary</h3>
              <div className="summary-underline"></div>
            </div>

            <div className="venue-card-summary">
              <div className="venue-image-summary">
                <img src={venue.image} alt={venue.name} />
              </div>
              <div className="venue-info-summary">
                <h4 className="venue-name-summary">{venue.name}</h4>
                <p className="venue-location-summary">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  {typeof venue.location === 'object'
                    ? `${venue.location.city || ''}${venue.location.state ? `, ${venue.location.state}` : ''}`
                    : venue.location}
                </p>
                {venue.capacity && (
                  <div className="venue-capacity-summary">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    {typeof venue.capacity === 'object'
                      ? `${venue.capacity.minGuests || ''}${venue.capacity.maxGuests ? `-${venue.capacity.maxGuests}` : ''}`
                      : venue.capacity}
                  </div>
                )}
              </div>
            </div>

            <div className="summary-details">
              {formData.checkIn && (
                <div className="summary-row">
                  <span className="summary-label">Check-in</span>
                  <span className="summary-value">{formData.checkIn}</span>
                </div>
              )}
              {formData.checkOut && (
                <div className="summary-row">
                  <span className="summary-label">Check-out</span>
                  <span className="summary-value">{formData.checkOut}</span>
                </div>
              )}
              {nights > 0 && (
                <div className="summary-row">
                  <span className="summary-label">Duration</span>
                  <span className="summary-value">{nights} {nights === 1 ? 'night' : 'nights'}</span>
                </div>
              )}
              {formData.guests && (
                <div className="summary-row">
                  <span className="summary-label">Guests</span>
                  <span className="summary-value">{formData.guests}</span>
                </div>
              )}
              {formData.rooms && (
                <div className="summary-row">
                  <span className="summary-label">Rooms</span>
                  <span className="summary-value">{formData.rooms}</span>
                </div>
              )}
              {formData.eventType && (
                <div className="summary-row">
                  <span className="summary-label">Event Type</span>
                  <span className="summary-value">{formData.eventType}</span>
                </div>
              )}
            </div>

            <div className="summary-note">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              <p>Your inquiry will be shared with the venue. They will contact you soon.</p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default ContactVenue


