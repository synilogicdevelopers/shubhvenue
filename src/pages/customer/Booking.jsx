import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { bookingAPI, paymentAPI } from '../../services/customer/api'
import toast from 'react-hot-toast'
import Footer from '../../components/customer/Footer'
import LoginModal from '../../components/customer/LoginModal'
import './Booking.css'

function Booking() {
  const navigate = useNavigate()
  const location = useLocation()
  const [showLoginModal, setShowLoginModal] = useState(false)
  // Get venue from location state or use default
  const venueData = location.state?.venue || {
    id: 1,
    name: 'Riva Beach Resort',
    image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&h=300&fit=crop',
    location: 'Mandrem, Goa',
    price: 16.00,
    priceDisplay: '16.00 Lakh',
    rooms: 140,
    capacity: '100-500 pax'
  }

  // Normalize venue data to handle different formats
  const venue = {
    ...venueData,
    image: venueData.images?.[0] || venueData.image || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&h=300&fit=crop',
    price: typeof venueData.price === 'string' 
      ? parseFloat(venueData.price.replace(/[^0-9.]/g, '')) 
      : venueData.price || 16.00,
    priceDisplay: venueData.priceDisplay || venueData.price || '16.00 Lakh',
    pricingInfo: venueData.pricingInfo || null, // Preserve pricingInfo
    rooms: venueData.rooms || 0,
    capacity: venueData.capacity || '100-500 pax'
  }

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
    specialRequests: ''
  })

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [razorpayKey, setRazorpayKey] = useState(null)

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      toast.error('Please login to continue with booking')
      setShowLoginModal(true)
    }
  }, [])

  // Load Razorpay script and get payment config
  useEffect(() => {
    const loadRazorpay = async () => {
      try {
        // Load Razorpay script
        const script = document.createElement('script')
        script.src = 'https://checkout.razorpay.com/v1/checkout.js'
        script.async = true
        document.body.appendChild(script)

        // Get payment config
        const configResponse = await paymentAPI.getConfig()
        if (configResponse.data?.success && configResponse.data?.razorpayKeyId) {
          setRazorpayKey(configResponse.data.razorpayKeyId)
        }
      } catch (error) {
        console.error('Error loading Razorpay:', error)
      }
    }

    loadRazorpay()
  }, [])

  // Generate device ID for tracking
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
    setFormData({
      ...formData,
      [name]: value
    })
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      })
    }
  }

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

  const calculateTotal = () => {
    const nights = calculateNights()
    if (nights > 0 && venue.price) {
      // Convert price to number if it's a string (remove "Lakh" and convert)
      const priceValue = typeof venue.price === 'number' 
        ? venue.price 
        : parseFloat((venue.priceDisplay || venue.price || '0').toString().replace(' Lakh', '').replace(/[^0-9.]/g, '')) * 100000 || 0
      return priceValue * nights
    }
    // Convert price to number if it's a string
    const priceValue = typeof venue.price === 'number' 
      ? venue.price 
      : parseFloat((venue.priceDisplay || venue.price || '0').toString().replace(' Lakh', '').replace(/[^0-9.]/g, '')) * 100000 || 0
    return priceValue
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
    
    // Check authentication
    const token = localStorage.getItem('token')
    if (!token) {
      toast.error('Please login to continue with booking')
      setShowLoginModal(true)
      return
    }
    
    if (!validateForm()) {
      return
    }

    if (!venue.id) {
      toast.error('Venue information is missing')
      navigate('/venues')
      return
    }

    // Check date availability FIRST before doing anything else
    console.log('🔍 Checking availability for venue:', venue.id, 'dates:', formData.checkIn, 'to', formData.checkOut);
    
    try {
      setProcessingPayment(true)
      
      const availabilityCheck = await bookingAPI.checkAvailability(
        venue.id,
        formData.checkIn,
        formData.checkOut
      )
      
      console.log('🔍 Availability check result:', availabilityCheck);
      
      if (!availabilityCheck.data?.available) {
        const errorMsg = availabilityCheck.data?.message || 'Selected dates are already booked. Please choose different dates.';
        console.error('❌ Date not available:', errorMsg);
        toast.error(errorMsg, { 
          duration: 6000,
          style: {
            background: '#ef4444',
            color: '#fff',
            fontSize: '16px',
            padding: '16px'
          }
        });
        setProcessingPayment(false)
        return
      }
      
      console.log('✅ Dates are available, proceeding with payment');
    } catch (availabilityError) {
      console.error('❌ Availability check error:', availabilityError);
      const errorMsg = availabilityError.message || 'Unable to verify date availability. Please try again.';
      toast.error(errorMsg, { 
        duration: 6000,
        style: {
          background: '#ef4444',
          color: '#fff',
          fontSize: '16px',
          padding: '16px'
        }
      });
      setProcessingPayment(false)
      return
    }

    try {
      // Calculate total amount using venue price
      const checkInDate = new Date(formData.checkIn)
      const checkOutDate = new Date(formData.checkOut)
      const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)) || 1
      
      // Get venue price - handle different formats (Lakh, direct number, etc.)
      console.log('🔍 Venue Object for Price:', {
        venue: venue,
        venuePrice: venue.price,
        venuePriceType: typeof venue.price,
        venuePriceDisplay: venue.priceDisplay,
        venuePricingInfo: venue.pricingInfo
      })
      
      let venuePrice = 0
      
      // First check pricingInfo.rentalPrice (most accurate)
      if (venue.pricingInfo && venue.pricingInfo.rentalPrice) {
        venuePrice = typeof venue.pricingInfo.rentalPrice === 'number' 
          ? venue.pricingInfo.rentalPrice 
          : parseFloat(venue.pricingInfo.rentalPrice) || 0
        console.log('✅ Using pricingInfo.rentalPrice:', venuePrice)
      }
      
      // If pricingInfo not available, check venue.price
      if (venuePrice <= 0 && venue.price) {
        if (typeof venue.price === 'number') {
          venuePrice = venue.price
          console.log('✅ Using venue.price (number):', venuePrice)
        } else if (typeof venue.price === 'string') {
          // Try to parse price string
          const priceStr = venue.price.toString().replace(' Lakh', '').replace(/[^0-9.]/g, '')
          venuePrice = parseFloat(priceStr) || 0
          console.log('✅ Using venue.price (string):', venuePrice)
        }
      }
      
      // If still 0, check priceDisplay
      if (venuePrice <= 0 && venue.priceDisplay) {
        // Extract price from "16.00 Lakh" format
        const priceStr = venue.priceDisplay.toString().replace(' Lakh', '').replace(/[^0-9.]/g, '')
        venuePrice = parseFloat(priceStr) || 0
        console.log('✅ Using venue.priceDisplay:', venuePrice)
      }
      
      // Only convert to rupees if priceDisplay explicitly mentions "Lakh"
      // Don't auto-convert small numbers as they might already be in rupees
      if (venuePrice > 0 && venuePrice < 1000 && venue.priceDisplay && venue.priceDisplay.toString().toLowerCase().includes('lakh')) {
        const originalPrice = venuePrice
        venuePrice = venuePrice * 100000 // Convert Lakh to rupees
        console.log(`✅ Converted from Lakh: ${originalPrice} Lakh = ₹${venuePrice}`)
      }
      
      // If price is still 0, use default
      if (venuePrice <= 0) {
        console.warn('⚠️ Venue price not found, using default ₹10,000')
        venuePrice = 10000 // Default fallback
      }
      
      // Calculate total amount: venue price per night
      // Ensure amount is in paise (multiply by 100)
      let totalAmount = Math.round(venuePrice * nights * 100) // Convert to paise
      
      // Ensure minimum amount is ₹1 (100 paise)
      if (totalAmount < 100) {
        console.warn('⚠️ Amount too low, setting minimum ₹1')
        totalAmount = 100
      }
      
      console.log('💰 Final Payment Calculation:', {
        venuePrice: venuePrice,
        nights: nights,
        totalAmountRupees: totalAmount / 100,
        totalAmountPaise: totalAmount
      })

      // Prepare booking data
      const roomsValue = formData.rooms && formData.rooms.toString().trim() !== '' 
        ? parseInt(formData.rooms) 
        : 0
      
      console.log('📦 Booking Data - Rooms:', {
        formDataRooms: formData.rooms,
        roomsValue: roomsValue,
        type: typeof formData.rooms
      })
      
      const bookingData = {
        venueId: venue.id,
        date: formData.checkIn,
        dateFrom: formData.checkIn,
        dateTo: formData.checkOut,
        guests: parseInt(formData.guests),
        rooms: roomsValue,
        eventType: formData.eventType,
        marriageFor: 'boy', // Default value as API requires it
        name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        foodPreference: formData.foodPreference,
        totalAmount: totalAmount / 100, // Amount in rupees
        deviceId: getDeviceId(),
        specialRequests: formData.specialRequests
      }
      
      console.log('📤 Sending Booking Data:', bookingData)

      // Create payment order
      let orderResponse;
      try {
        orderResponse = await paymentAPI.createOrder({
          amount: totalAmount,
          currency: 'INR',
          bookingData: bookingData
        })
      } catch (orderError) {
        console.error('❌ Payment order creation error:', orderError);
        const errorMessage = orderError.data?.error || orderError.data?.message || orderError.message || 'Failed to create payment order';
        
        // Check if it's a date conflict error
        if (errorMessage.includes('already booked') || 
            errorMessage.includes('not available') || 
            errorMessage.includes('blocked') ||
            orderError.status === 409) {
          toast.error(errorMessage, { duration: 5000 });
        } else {
          toast.error(errorMessage, { duration: 5000 });
        }
        setProcessingPayment(false)
        return
      }

      // Check if order creation failed due to date conflict
      if (!orderResponse.data?.success) {
        const errorMessage = orderResponse.data?.error || orderResponse.data?.message || 'Failed to create payment order'
        console.error('❌ Payment order creation failed:', errorMessage);
        toast.error(errorMessage, { duration: 5000 })
        setProcessingPayment(false)
        return
      }

      if (orderResponse.data?.success && orderResponse.data?.order) {
        const order = orderResponse.data.order

        // Initialize Razorpay
        if (window.Razorpay && razorpayKey) {
          const options = {
            key: razorpayKey,
            amount: order.amount,
            currency: order.currency,
            name: 'Wedding Venue Booking',
            description: `Booking for ${venue.name}`,
            order_id: order.id,
            prefill: {
              name: formData.fullName,
              email: formData.email,
              contact: formData.phone
            },
            handler: async function (response) {
              try {
                // Verify payment with booking data
                const verifyResponse = await paymentAPI.verify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  bookingData: bookingData // Include booking data in verification
                })

                if (verifyResponse.data?.success) {
                  toast.success('Payment successful! Booking confirmed.')
                  setProcessingPayment(false)
                  navigate('/booking-history')
                } else {
                  // Check if it's a date conflict error
                  const errorMsg = verifyResponse.data?.error || verifyResponse.data?.message || 'Payment verification failed';
                  if (errorMsg.includes('already booked') || 
                      errorMsg.includes('not available') || 
                      errorMsg.includes('blocked')) {
                    toast.error(errorMsg + ' Please choose different dates.', { duration: 6000 });
                  } else {
                    toast.error(errorMsg);
                  }
                  setProcessingPayment(false);
                }
              } catch (error) {
                console.error('Payment verification error:', error);
                // Check if it's a date conflict error
                const errorMsg = error.data?.error || error.data?.message || error.message || 'Payment verification failed';
                if (errorMsg.includes('already booked') || 
                    errorMsg.includes('not available') || 
                    errorMsg.includes('blocked') ||
                    error.status === 409) {
                  toast.error(errorMsg + ' Please choose different dates.', { 
                    duration: 6000,
                    style: {
                      background: '#ef4444',
                      color: '#fff',
                      fontSize: '16px',
                      padding: '16px'
                    }
                  });
                } else {
                  toast.error(errorMsg);
                }
                setProcessingPayment(false);
              }
            },
            modal: {
              ondismiss: function() {
                setProcessingPayment(false)
                toast.error('Payment cancelled')
              }
            }
          }

          const razorpay = new window.Razorpay(options)
          razorpay.open()
        } else {
          toast.error('Payment gateway not loaded. Please refresh the page.')
          setProcessingPayment(false)
        }
      } else {
        const errorMessage = orderResponse.data?.error || orderResponse.data?.message || 'Failed to create payment order'
        if (errorMessage.includes('already booked') || 
            errorMessage.includes('not available') || 
            errorMessage.includes('blocked')) {
          toast.error(errorMessage)
        } else {
          toast.error(errorMessage)
        }
        setProcessingPayment(false)
      }
    } catch (error) {
      console.error('Booking error:', error)
      toast.error(error.message || 'Failed to process booking')
      setProcessingPayment(false)
    }
  }

  const nights = calculateNights()
  const total = calculateTotal()

  return (
    <>
      <div className="booking-page">
        {/* Back Button */}
        <button 
          className="back-button" 
          onClick={() => navigate(-1)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          Back
        </button>
        
        {/* Hero Section */}
        <div className="booking-hero">
          <div className="booking-hero-content">
            <h1 className="booking-page-title">
              Complete Your
              <span className="gradient-text"> Booking</span>
            </h1>
            <p className="booking-page-subtitle">
              Fill in the details below to secure your venue reservation
            </p>
          </div>
          <div className="hero-decoration">
            <div className="decoration-circle circle-1"></div>
            <div className="decoration-circle circle-2"></div>
            <div className="decoration-circle circle-3"></div>
          </div>
        </div>

        <div className="booking-container">
          <div className="booking-content">
            {/* Booking Form */}
            <div className="booking-form-section">
              <div className="section-header">
                <h2 className="section-title">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                    <polyline points="7 3 7 8 15 8"></polyline>
                  </svg>
                  Booking Details
                </h2>
                <div className="section-underline"></div>
              </div>

              <form className="booking-form" onSubmit={handleSubmit}>
                {/* Date Selection */}
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="checkIn" className="form-label">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                      Check-in Date
                    </label>
                    <input
                      type="date"
                      id="checkIn"
                      name="checkIn"
                      value={formData.checkIn}
                      onChange={handleChange}
                      className={`form-input ${errors.checkIn ? 'error' : ''}`}
                      min={new Date().toISOString().split('T')[0]}
                    />
                    {errors.checkIn && <span className="error-message">{errors.checkIn}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="checkOut" className="form-label">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                      Check-out Date
                    </label>
                    <input
                      type="date"
                      id="checkOut"
                      name="checkOut"
                      value={formData.checkOut}
                      onChange={handleChange}
                      className={`form-input ${errors.checkOut ? 'error' : ''}`}
                      min={formData.checkIn || new Date().toISOString().split('T')[0]}
                    />
                    {errors.checkOut && <span className="error-message">{errors.checkOut}</span>}
                  </div>
                </div>

                {/* Guests and Rooms */}
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="guests" className="form-label">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                      </svg>
                      Number of Guests
                    </label>
                    <input
                      type="number"
                      id="guests"
                      name="guests"
                      value={formData.guests}
                      onChange={handleChange}
                      className={`form-input ${errors.guests ? 'error' : ''}`}
                      placeholder="Enter number of guests"
                      min="1"
                    />
                    {errors.guests && <span className="error-message">{errors.guests}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="rooms" className="form-label">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                        <polyline points="9 22 9 12 15 12 15 22"></polyline>
                      </svg>
                      Number of Rooms {venue.rooms > 0 && `(Max: ${venue.rooms})`}
                    </label>
                    <input
                      type="number"
                      id="rooms"
                      name="rooms"
                      value={formData.rooms}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Enter number of rooms"
                      min="1"
                    />
                  </div>
                </div>

                {/* Event Type */}
                <div className="form-group">
                  <label htmlFor="eventType" className="form-label">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                    Event Type *
                  </label>
                  <select
                    id="eventType"
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

                {/* Food Preference */}
                <div className="form-group">
                  <label htmlFor="foodPreference" className="form-label">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                      <line x1="3" y1="6" x2="21" y2="6"></line>
                      <path d="M16 10a4 4 0 0 1-8 0"></path>
                    </svg>
                    Food Preference *
                  </label>
                  <select
                    id="foodPreference"
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

                {/* Contact Information */}
                <div className="section-header">
                  <h3 className="section-subtitle">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    Contact Information
                  </h3>
                </div>

                <div className="form-group">
                  <label htmlFor="fullName" className="form-label">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className={`form-input ${errors.fullName ? 'error' : ''}`}
                    placeholder="Enter your full name"
                  />
                  {errors.fullName && <span className="error-message">{errors.fullName}</span>}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="email" className="form-label">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                        <polyline points="22,6 12,13 2,6"></polyline>
                      </svg>
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`form-input ${errors.email ? 'error' : ''}`}
                      placeholder="Enter your email"
                    />
                    {errors.email && <span className="error-message">{errors.email}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone" className="form-label">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                      </svg>
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`form-input ${errors.phone ? 'error' : ''}`}
                      placeholder="Enter your phone number"
                    />
                    {errors.phone && <span className="error-message">{errors.phone}</span>}
                  </div>
                </div>

                {/* Special Requests */}
                <div className="form-group">
                  <label htmlFor="specialRequests" className="form-label">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    Special Requests (Optional)
                  </label>
                  <textarea
                    id="specialRequests"
                    name="specialRequests"
                    value={formData.specialRequests}
                    onChange={handleChange}
                    className="form-input form-textarea"
                    placeholder="Any special requests or additional information..."
                    rows="4"
                  ></textarea>
                </div>

                <button type="submit" className="submit-btn" disabled={processingPayment || isSubmitting}>
                  {processingPayment ? (
                    <>
                      <svg className="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                      </svg>
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                      </svg>
                      Proceed to Payment
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Booking Summary */}
            <div className="booking-summary">
              <div className="summary-header">
                <h3 className="summary-title">Booking Summary</h3>
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
                    {venue.location}
                  </p>
                  <div className="venue-capacity-summary">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    {venue.capacity}
                  </div>
                </div>
              </div>

              <div className="summary-details">
                <div className="summary-row">
                  <span className="summary-label">Price per day</span>
                  <span className="summary-value">
                    ₹ {typeof venue.price === 'number' ? venue.price.toLocaleString('en-IN') : (venue.priceDisplay || '0').replace(' Lakh', '').replace(/[^0-9.]/g, '')}
                  </span>
                </div>
                {nights > 0 && (
                  <>
                    <div className="summary-row">
                      <span className="summary-label">Duration</span>
                      <span className="summary-value">{nights} {nights === 1 ? 'night' : 'nights'}</span>
                    </div>
                    <div className="summary-row summary-total">
                      <span className="summary-label">Total Amount</span>
                      <span className="summary-value">₹ {typeof total === 'number' ? total.toLocaleString('en-IN') : total}</span>
                    </div>
                  </>
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
              </div>

              <div className="summary-note">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
                <p>Your booking is subject to availability. We'll confirm within 24 hours.</p>
              </div>
            </div>
          </div>
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
          // Reload to refresh the page
          window.location.reload()
        }}
      />
    </>
  )
}

export default Booking

