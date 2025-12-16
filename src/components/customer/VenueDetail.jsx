import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { publicVenuesAPI, reviewAPI, bookingAPI, paymentAPI } from '../../services/customer/api'
import toast from 'react-hot-toast'
import LoginModal from './LoginModal'
import SEO from '../SEO'
import { createSlug } from '../../utils/customer/slug'
import './VenueDetail.css'

function VenueDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [venue, setVenue] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submittingReview, setSubmittingReview] = useState(false)
  const [showWriteReview, setShowWriteReview] = useState(false)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [selectedAlbum, setSelectedAlbum] = useState(null)
  const [selectedImage, setSelectedImage] = useState(null)
  const [playingVideo, setPlayingVideo] = useState(null)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [processingBooking, setProcessingBooking] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [razorpayKey, setRazorpayKey] = useState(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isSliderPaused, setIsSliderPaused] = useState(false)
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false)
  const [touchStartX, setTouchStartX] = useState(null)
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: ''
  })
  const [bookingForm, setBookingForm] = useState({
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

  const handleVideoClick = (video) => {
    setPlayingVideo(video)
  }

  // Helper function to convert 24-hour time to 12-hour format with AM/PM
  const formatTime12Hour = (timeString) => {
    if (!timeString || timeString === 'Not specified') {
      return 'Not specified'
    }
    
    // Handle time formats like "10:13" or "16:19"
    const timeMatch = timeString.match(/(\d{1,2}):(\d{2})/)
    if (!timeMatch) {
      return timeString // Return as is if format doesn't match
    }
    
    let hours = parseInt(timeMatch[1])
    const minutes = timeMatch[2]
    const ampm = hours >= 12 ? 'PM' : 'AM'
    
    hours = hours % 12
    hours = hours ? hours : 12 // 0 should be 12
    
    return `${hours}:${minutes} ${ampm}`
  }

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

  // Handle Book Now with Payment
  const handleBookNow = async () => {
    // Check authentication first
    const token = localStorage.getItem('token')
    if (!token) {
      toast.error('Please login to continue with booking')
      setShowLoginModal(true)
      return
    }

    // Validate form
    if (!bookingForm.checkIn || !bookingForm.checkOut || !bookingForm.guests || 
        !bookingForm.fullName || !bookingForm.email || !bookingForm.phone || 
        !bookingForm.eventType) {
      toast.error('Please fill all required fields')
      return
    }

    // Check date availability FIRST before doing anything else
    console.log('🔍 Checking availability for venue:', venue.id, 'dates:', bookingForm.checkIn, 'to', bookingForm.checkOut);

    try {
      setProcessingPayment(true)

      const availabilityCheck = await bookingAPI.checkAvailability(
        venue.id,
        bookingForm.checkIn,
        bookingForm.checkOut
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
      const checkInDate = new Date(bookingForm.checkIn)
      const checkOutDate = new Date(bookingForm.checkOut)
      const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)) || 1
      
      // Get venue price - handle different formats (Lakh, direct number, etc.)
      console.log('🔍 Venue Object for Price (VenueDetail):', {
        venue: venue,
        venuePrice: venue?.price,
        venuePriceType: typeof venue?.price,
        venuePriceDisplay: venue?.priceDisplay,
        venuePricingInfo: venue?.pricingInfo
      })
      
      let venuePrice = 0
      
      // First check pricingInfo.rentalPrice (most accurate)
      if (venue?.pricingInfo && venue.pricingInfo.rentalPrice) {
        venuePrice = typeof venue.pricingInfo.rentalPrice === 'number' 
          ? venue.pricingInfo.rentalPrice 
          : parseFloat(venue.pricingInfo.rentalPrice) || 0
        console.log('✅ Using pricingInfo.rentalPrice:', venuePrice)
      }
      
      // If pricingInfo not available, check venue.price
      if (venuePrice <= 0 && venue?.price) {
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
      if (venuePrice <= 0 && venue?.priceDisplay) {
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
      
      console.log('💰 Final Payment Calculation (VenueDetail):', {
        venuePrice: venuePrice,
        nights: nights,
        totalAmountRupees: totalAmount / 100,
        totalAmountPaise: totalAmount,
        venue: venue ? { id: venue.id, name: venue.name, price: venue.price } : null
      })

      // Prepare booking data
      const bookingData = {
        venueId: venue.id,
        date: bookingForm.checkIn,
        dateFrom: bookingForm.checkIn,
        dateTo: bookingForm.checkOut,
        guests: parseInt(bookingForm.guests),
        rooms: bookingForm.rooms && bookingForm.rooms !== '' ? parseInt(bookingForm.rooms) || 0 : 0,
        eventType: bookingForm.eventType,
        marriageFor: 'boy', // Default value as API requires it
        name: bookingForm.fullName,
        email: bookingForm.email,
        phone: bookingForm.phone,
        foodPreference: bookingForm.foodPreference,
        totalAmount: totalAmount / 100, // Amount in rupees
        deviceId: getDeviceId(),
        specialRequests: bookingForm.specialRequests
      }

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
              name: bookingForm.fullName,
              email: bookingForm.email,
              contact: bookingForm.phone
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
                  setShowBookingModal(false)
                  setBookingForm({
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
      }
    } catch (error) {
      console.error('Booking error:', error)
      const errorMessage = error.message || 'Failed to process booking'
      if (errorMessage.includes('already booked') || 
          errorMessage.includes('not available') || 
          errorMessage.includes('blocked')) {
        toast.error(errorMessage)
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setProcessingPayment(false)
    }
  }

  // Handle Contact Venue (Booking without payment)
  const handleContactVenue = async () => {
    // Validate form
    if (!bookingForm.checkIn || !bookingForm.checkOut || !bookingForm.guests || 
        !bookingForm.fullName || !bookingForm.email || !bookingForm.phone || 
        !bookingForm.eventType) {
      toast.error('Please fill all required fields')
      return
    }

    try {
      setProcessingBooking(true)

      // Calculate total amount
      const checkInDate = new Date(bookingForm.checkIn)
      const checkOutDate = new Date(bookingForm.checkOut)
      const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)) || 1
      const baseAmount = 10000 // Base amount per day
      const totalAmount = baseAmount * nights

      // Create booking without payment (creates Lead)
      const bookingData = {
        venueId: venue.id,
        date: bookingForm.checkIn,
        dateFrom: bookingForm.checkIn,
        dateTo: bookingForm.checkOut,
        guests: parseInt(bookingForm.guests),
        rooms: bookingForm.rooms && bookingForm.rooms !== '' ? parseInt(bookingForm.rooms) || 0 : 0,
        eventType: bookingForm.eventType,
        marriageFor: 'boy', // Default value as API requires it
        name: bookingForm.fullName,
        email: bookingForm.email,
        phone: bookingForm.phone,
        foodPreference: bookingForm.foodPreference,
        totalAmount: totalAmount,
        deviceId: getDeviceId(),
        specialRequests: bookingForm.specialRequests
        // No paymentId - this will create a Lead
      }

      const response = await bookingAPI.create(bookingData)

      if (response.data?.success) {
        toast.success(response.data.message || 'Inquiry submitted successfully! Venue will contact you soon.')
        setShowContactModal(false)
        setBookingForm({
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
      } else {
        toast.error(response.data?.error || 'Failed to submit inquiry')
      }
    } catch (error) {
      console.error('Contact venue error:', error)
      toast.error(error.message || 'Failed to submit inquiry')
    } finally {
      setProcessingBooking(false)
    }
  }

  // Helper function to get image URL
  const getImageUrl = (image) => {
    if (!image) return 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200&h=600&fit=crop'
    if (image.startsWith('http://') || image.startsWith('https://')) {
      return image
    }
    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://shubhvenue.com'
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

  // Fetch venue data from API
  useEffect(() => {
    const fetchVenue = async () => {
      if (!slug) {
        toast.error('Venue not found')
        navigate('/venues')
        return
      }

      try {
        setLoading(true)
        
        // First, fetch all venues to find the one matching the slug
        const venuesResponse = await publicVenuesAPI.getAll()
        let venueId = null
        
        if (venuesResponse.data) {
          let venuesData = []
          
          // Check multiple possible response formats
          if (venuesResponse.data.success && venuesResponse.data.data) {
            venuesData = Array.isArray(venuesResponse.data.data) ? venuesResponse.data.data : []
          } else if (venuesResponse.data.venues) {
            venuesData = Array.isArray(venuesResponse.data.venues) ? venuesResponse.data.venues : []
          } else if (venuesResponse.data.data) {
            venuesData = Array.isArray(venuesResponse.data.data) ? venuesResponse.data.data : []
          } else if (Array.isArray(venuesResponse.data)) {
            venuesData = venuesResponse.data
          } else if (venuesResponse.data.results && Array.isArray(venuesResponse.data.results)) {
            venuesData = venuesResponse.data.results
          }
          
          // Find venue by matching slug
          const foundVenue = venuesData.find(venue => {
            const venueSlug = createSlug(venue.name || '')
            return venueSlug === slug
          })
          
          if (foundVenue) {
            venueId = foundVenue._id || foundVenue.id
          }
        }
        
        if (!venueId) {
          toast.error('Venue not found')
          navigate('/venues')
          return
        }
        
        // Now fetch the full venue details using the ID
        const response = await publicVenuesAPI.getById(venueId)
        
        if (response.data?.success && response.data?.data) {
          const venueData = response.data.data
          
          // Reviews with reply data are now included in venue API response
          const reviewsWithReplies = venueData.rating?.reviews || []
          
          console.log('Venue Data from API:', venueData)
          console.log('Booking Button Enabled:', venueData.bookingButtonEnabled)
          console.log('Leads Button Enabled:', venueData.leadsButtonEnabled)
          console.log('Highlights from API:', venueData.highlights)
          console.log('Reviews with Replies from Venue API:', reviewsWithReplies)
          // Debug: Check if any review has reply
          reviewsWithReplies.forEach((review, idx) => {
            if (review.reply && review.reply.message) {
              console.log(`✅ Review ${idx} HAS reply:`, {
                message: review.reply.message,
                repliedBy: review.reply.repliedBy,
                repliedAt: review.reply.repliedAt
              })
            } else {
              console.log(`❌ Review ${idx} has NO reply`, review)
            }
          })
          
          // Transform API response to component format
          // Extract rating - handle both object and number formats
          let ratingValue = 0
          if (venueData.rating) {
            if (typeof venueData.rating === 'object' && venueData.rating.average !== undefined) {
              ratingValue = Number(venueData.rating.average) || 0
            } else if (typeof venueData.rating === 'number') {
              ratingValue = venueData.rating
            }
          }
          
          // Extract reviews count
          let reviewsCount = 0
          if (venueData.reviewCount !== undefined) {
            reviewsCount = Number(venueData.reviewCount) || 0
          } else if (venueData.rating && typeof venueData.rating === 'object' && venueData.rating.totalReviews !== undefined) {
            reviewsCount = Number(venueData.rating.totalReviews) || 0
          }
          
          const formattedVenue = {
            id: venueData._id || venueData.id,
            name: venueData.name || 'Unnamed Venue',
            images: (venueData.gallery?.photos || venueData.images || (venueData.coverImage ? [venueData.coverImage] : [])).map(img => getImageUrl(img)),
            rating: ratingValue,
            reviews: reviewsCount,
            location: formatLocation(venueData.location),
            fullLocation: venueData.location && typeof venueData.location === 'object' 
              ? `${venueData.location.address || ''} ${venueData.location.city || ''} ${venueData.location.state || ''}`.trim() || formatLocation(venueData.location)
              : formatLocation(venueData.location),
            type: venueData.category?.name || venueData.categoryId?.name || venueData.venueType || 'Venue',
            price: venueData.price || venueData.pricingInfo?.rentalPrice || 0,
            pricingInfo: venueData.pricingInfo || null,
            rooms: venueData.rooms || 0,
            capacity: venueData.capacity ? 
              (typeof venueData.capacity === 'object' ? 
                `${venueData.capacity.minGuests || venueData.capacity.min || 0}-${venueData.capacity.maxGuests || venueData.capacity.max || 0}` : 
                `${venueData.capacity}`) : 
              'Not specified',
            description: venueData.about || venueData.description || 'No description available',
            amenities: Array.isArray(venueData.amenities) ? venueData.amenities : [],
            highlights: Array.isArray(venueData.highlights) ? venueData.highlights : [],
            policies: {
              checkIn: formatTime12Hour(venueData.availability?.openTime) || 'Not specified',
              checkOut: formatTime12Hour(venueData.availability?.closeTime) || 'Not specified',
              cancellation: venueData.bookingInfo?.cancellationPolicy || 'Contact venue for details',
              pets: 'Contact venue',
              smoking: 'Contact venue'
            },
            ratingBreakdown: (() => {
              // Calculate rating breakdown from reviews
              const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
              const reviews = venueData.rating?.reviews || []
              reviews.forEach(review => {
                const rating = review.rating || review.ratingValue || 0
                if (rating >= 1 && rating <= 5) {
                  breakdown[rating] = (breakdown[rating] || 0) + 1
                }
              })
              return breakdown
            })(),
            reviewsList: (() => {
              // Transform reviews from API format to component format
              const reviews = reviewsWithReplies
              return reviews.map((review, index) => {
                // Handle user name - backend sends 'user' field, not 'userId.name'
                const userName = review.user || review.userId?.name || review.userName || 'Anonymous'
                const userAvatar = userName ? userName.charAt(0).toUpperCase() : 'A'
                const rating = review.rating || review.ratingValue || 0
                const comment = review.comment || review.text || review.review || ''
                const date = review.date || review.createdAt || review.updatedAt || new Date().toISOString()
                
                // Format date
                let formattedDate = date
                if (date instanceof Date) {
                  formattedDate = date.toISOString().split('T')[0]
                } else if (typeof date === 'string') {
                  formattedDate = date.split('T')[0]
                }
                
                // Calculate relative date
                const dateObj = new Date(date)
                const now = new Date()
                const diffTime = Math.abs(now - dateObj)
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
                let relativeDate = formattedDate
                if (diffDays === 0) {
                  relativeDate = 'Today'
                } else if (diffDays === 1) {
                  relativeDate = '1 day ago'
                } else if (diffDays < 7) {
                  relativeDate = `${diffDays} days ago`
                } else if (diffDays < 30) {
                  const weeks = Math.floor(diffDays / 7)
                  relativeDate = `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`
                } else if (diffDays < 365) {
                  const months = Math.floor(diffDays / 30)
                  relativeDate = `${months} ${months === 1 ? 'month' : 'months'} ago`
                } else {
                  relativeDate = formattedDate
                }
                
                // Handle vendor reply - reply data comes directly from backend
                const reply = review.reply || null
                let replyData = null
                
                // Check if reply exists and has message
                if (reply && typeof reply === 'object' && reply.message && typeof reply.message === 'string' && reply.message.trim()) {
                  const replyDate = reply.repliedAt || reply.date || new Date()
                  let replyFormattedDate = replyDate
                  
                  // Handle date parsing
                  if (replyDate instanceof Date) {
                    replyFormattedDate = replyDate.toISOString().split('T')[0]
                  } else if (typeof replyDate === 'string') {
                    replyFormattedDate = replyDate.split('T')[0]
                  } else {
                    replyFormattedDate = new Date().toISOString().split('T')[0]
                  }
                  
                  // Calculate relative date
                  const replyDateObj = new Date(replyDate)
                  if (!isNaN(replyDateObj.getTime())) {
                    const replyDiffTime = Math.abs(now - replyDateObj)
                    const replyDiffDays = Math.floor(replyDiffTime / (1000 * 60 * 60 * 24))
                    let replyRelativeDate = replyFormattedDate
                    
                    if (replyDiffDays === 0) {
                      replyRelativeDate = 'Today'
                    } else if (replyDiffDays === 1) {
                      replyRelativeDate = '1 day ago'
                    } else if (replyDiffDays < 7) {
                      replyRelativeDate = `${replyDiffDays} days ago`
                    } else if (replyDiffDays < 30) {
                      const weeks = Math.floor(replyDiffDays / 7)
                      replyRelativeDate = `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`
                    } else if (replyDiffDays < 365) {
                      const months = Math.floor(replyDiffDays / 30)
                      replyRelativeDate = `${months} ${months === 1 ? 'month' : 'months'} ago`
                    } else {
                      replyRelativeDate = replyFormattedDate
                    }
                    
                    replyData = {
                      message: reply.message.trim(),
                      repliedBy: (reply.repliedBy && typeof reply.repliedBy === 'object' && reply.repliedBy.name) 
                        ? reply.repliedBy.name 
                        : (typeof reply.repliedBy === 'string' ? reply.repliedBy : 'Venue Owner'),
                      repliedAt: replyRelativeDate
                    }
                  } else {
                    // Invalid date, use message only
                    replyData = {
                      message: reply.message.trim(),
                      repliedBy: (reply.repliedBy && typeof reply.repliedBy === 'object' && reply.repliedBy.name) 
                        ? reply.repliedBy.name 
                        : (typeof reply.repliedBy === 'string' ? reply.repliedBy : 'Venue Owner'),
                      repliedAt: 'Recently'
                    }
                  }
                }
                
                return {
                  id: review._id || review.id || index,
                  userName: userName,
                  userAvatar: userAvatar,
                  rating: rating,
                  date: relativeDate,
                  comment: comment,
                  verified: review.verified || false,
                  reply: replyData // This will be null if no reply, or an object with message, repliedBy, repliedAt
                }
              })
            })(),
            albums: (() => {
              // Collect all photos from different sources
              const allPhotos = []
              
              // Add gallery photos
              if (venueData.gallery?.photos && Array.isArray(venueData.gallery.photos)) {
                allPhotos.push(...venueData.gallery.photos)
              }
              
              // Add images array
              if (venueData.images && Array.isArray(venueData.images)) {
                allPhotos.push(...venueData.images)
              }
              
              // Add coverImage if not already included
              if (venueData.coverImage && !allPhotos.includes(venueData.coverImage)) {
                allPhotos.push(venueData.coverImage)
              }
              
              // Remove duplicates
              const uniquePhotos = [...new Set(allPhotos)]
              
              // Create album with all photos
              if (uniquePhotos.length > 0) {
                return [{
                  id: 1,
                  title: 'Gallery',
                  coverImage: getImageUrl(uniquePhotos[0]),
                  imageCount: uniquePhotos.length,
                  images: uniquePhotos.map(img => getImageUrl(img))
                }]
              }
              
              return []
            })(),
            videos: (() => {
              // Get videos from multiple possible sources
              const videos = venueData.galleryInfo?.videos || venueData.gallery?.videos || venueData.videos || []
              if (Array.isArray(videos) && videos.length > 0) {
                return videos.map((video, idx) => ({
                  id: idx + 1,
                  title: `Video ${idx + 1}`,
                  thumbnail: getImageUrl(venueData.coverImage),
                  videoUrl: getImageUrl(video),
                  duration: '0:00'
                }))
              }
              return []
            })(),
            bookingButtonEnabled: venueData.bookingButtonEnabled !== undefined ? venueData.bookingButtonEnabled : true,
            leadsButtonEnabled: venueData.leadsButtonEnabled !== undefined ? venueData.leadsButtonEnabled : true
          }

          // Ensure at least one image
          if (formattedVenue.images.length === 0) {
            formattedVenue.images = ['https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200&h=600&fit=crop']
          }

          console.log('Formatted Venue:', formattedVenue)
          console.log('Formatted Highlights:', formattedVenue.highlights)
          console.log('Highlights Array Check:', Array.isArray(formattedVenue.highlights), formattedVenue.highlights.length)

          setVenue(formattedVenue)
        } else {
          toast.error('Venue not found')
          navigate('/venues')
        }
      } catch (error) {
        console.error('Error fetching venue:', error)
        toast.error('Failed to load venue details')
        navigate('/venues')
      } finally {
        setLoading(false)
      }
    }

    fetchVenue()
  }, [slug, navigate])

  // Reset slider index when venue changes
  useEffect(() => {
    setCurrentImageIndex(0)
  }, [venue?.id])

  // Track viewport for responsive slider layout
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Auto-play slider
  useEffect(() => {
    if (!venue || !venue.images || venue.images.length <= 1 || isSliderPaused) return

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev === venue.images.length - 1 ? 0 : prev + 1))
    }, 4000) // Change image every 4 seconds

    return () => clearInterval(interval)
  }, [venue?.images, venue?.images?.length, isSliderPaused])

  // Function to refresh venue data
  const refreshVenueData = async () => {
    if (!slug) return
    
    // Find venue ID from slug
    try {
      const venuesResponse = await publicVenuesAPI.getAll()
      let venueId = null
      
      if (venuesResponse.data) {
        let venuesData = []
        
        // Check multiple possible response formats
        if (venuesResponse.data.success && venuesResponse.data.data) {
          venuesData = Array.isArray(venuesResponse.data.data) ? venuesResponse.data.data : []
        } else if (venuesResponse.data.venues) {
          venuesData = Array.isArray(venuesResponse.data.venues) ? venuesResponse.data.venues : []
        } else if (venuesResponse.data.data) {
          venuesData = Array.isArray(venuesResponse.data.data) ? venuesResponse.data.data : []
        } else if (Array.isArray(venuesResponse.data)) {
          venuesData = venuesResponse.data
        } else if (venuesResponse.data.results && Array.isArray(venuesResponse.data.results)) {
          venuesData = venuesResponse.data.results
        }
        
        const foundVenue = venuesData.find(venue => {
          const venueSlug = createSlug(venue.name || '')
          return venueSlug === slug
        })
        
        if (foundVenue) {
          venueId = foundVenue._id || foundVenue.id
        }
      }
      
      if (!venueId) return
      
      const response = await publicVenuesAPI.getById(venueId)
      
      if (response.data?.success && response.data?.data) {
        const venueData = response.data.data
        
        // Reviews with reply data are now included in venue API response
        const reviewsWithReplies = venueData.rating?.reviews || []
        
        // Extract rating - handle both object and number formats
        let ratingValue = 0
        if (venueData.rating) {
          if (typeof venueData.rating === 'object' && venueData.rating.average !== undefined) {
            ratingValue = Number(venueData.rating.average) || 0
          } else if (typeof venueData.rating === 'number') {
            ratingValue = venueData.rating
          }
        }
        
        // Extract reviews count
        let reviewsCount = 0
        if (venueData.reviewCount !== undefined) {
          reviewsCount = Number(venueData.reviewCount) || 0
        } else if (venueData.rating && typeof venueData.rating === 'object' && venueData.rating.totalReviews !== undefined) {
          reviewsCount = Number(venueData.rating.totalReviews) || 0
        }
        
        // Transform API response to component format (same as in useEffect)
        const formattedVenue = {
          id: venueData._id || venueData.id,
          name: venueData.name || 'Unnamed Venue',
          images: (venueData.gallery?.photos || venueData.images || (venueData.coverImage ? [venueData.coverImage] : [])).map(img => getImageUrl(img)),
          rating: ratingValue,
          reviews: reviewsCount,
          location: formatLocation(venueData.location),
          fullLocation: venueData.location && typeof venueData.location === 'object' 
            ? `${venueData.location.address || ''} ${venueData.location.city || ''} ${venueData.location.state || ''}`.trim() || formatLocation(venueData.location)
            : formatLocation(venueData.location),
          type: venueData.category?.name || venueData.categoryId?.name || venueData.venueType || 'Venue',
          price: venueData.price || venueData.pricingInfo?.rentalPrice || 0,
          pricingInfo: venueData.pricingInfo || null,
          rooms: venueData.rooms || 0,
          capacity: venueData.capacity ? 
            (typeof venueData.capacity === 'object' ? 
              `${venueData.capacity.minGuests || venueData.capacity.min || 0}-${venueData.capacity.maxGuests || venueData.capacity.max || 0}` : 
              `${venueData.capacity}`) : 
            'Not specified',
          description: venueData.about || venueData.description || 'No description available',
          amenities: Array.isArray(venueData.amenities) ? venueData.amenities : [],
          highlights: Array.isArray(venueData.highlights) ? venueData.highlights : [],
          policies: {
            checkIn: formatTime12Hour(venueData.availability?.openTime) || 'Not specified',
            checkOut: formatTime12Hour(venueData.availability?.closeTime) || 'Not specified',
            cancellation: venueData.bookingInfo?.cancellationPolicy || 'Contact venue for details',
            pets: 'Contact venue',
            smoking: 'Contact venue'
          },
          ratingBreakdown: (() => {
            const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
            const reviews = reviewsWithReplies
            reviews.forEach(review => {
              const rating = review.rating || review.ratingValue || 0
              if (rating >= 1 && rating <= 5) {
                breakdown[rating] = (breakdown[rating] || 0) + 1
              }
            })
            return breakdown
          })(),
          reviewsList: (() => {
            const reviews = reviewsWithReplies
            return reviews.map((review, index) => {
              // Handle user name - backend sends 'user' field, not 'userId.name'
              const userName = review.user || review.userId?.name || review.userName || 'Anonymous'
              const userAvatar = userName ? userName.charAt(0).toUpperCase() : 'A'
              const rating = review.rating || review.ratingValue || 0
              const comment = review.comment || review.text || review.review || ''
              const date = review.date || review.createdAt || review.updatedAt || new Date().toISOString()
              
              let formattedDate = date
              if (date instanceof Date) {
                formattedDate = date.toISOString().split('T')[0]
              } else if (typeof date === 'string') {
                formattedDate = date.split('T')[0]
              }
              
              const dateObj = new Date(date)
              const now = new Date()
              const diffTime = Math.abs(now - dateObj)
              const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
              let relativeDate = formattedDate
              if (diffDays === 0) {
                relativeDate = 'Today'
              } else if (diffDays === 1) {
                relativeDate = '1 day ago'
              } else if (diffDays < 7) {
                relativeDate = `${diffDays} days ago`
              } else if (diffDays < 30) {
                const weeks = Math.floor(diffDays / 7)
                relativeDate = `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`
              } else if (diffDays < 365) {
                const months = Math.floor(diffDays / 30)
                relativeDate = `${months} ${months === 1 ? 'month' : 'months'} ago`
              } else {
                relativeDate = formattedDate
              }
              
              // Handle vendor reply - reply data comes directly from backend
              const reply = review.reply || null
              let replyData = null
              
              // Check if reply exists and has message
              if (reply && typeof reply === 'object' && reply.message && typeof reply.message === 'string' && reply.message.trim()) {
                const replyDate = reply.repliedAt || reply.date || new Date()
                let replyFormattedDate = replyDate
                
                // Handle date parsing
                if (replyDate instanceof Date) {
                  replyFormattedDate = replyDate.toISOString().split('T')[0]
                } else if (typeof replyDate === 'string') {
                  replyFormattedDate = replyDate.split('T')[0]
                } else {
                  replyFormattedDate = new Date().toISOString().split('T')[0]
                }
                
                // Calculate relative date
                const replyDateObj = new Date(replyDate)
                if (!isNaN(replyDateObj.getTime())) {
                  const replyDiffTime = Math.abs(now - replyDateObj)
                  const replyDiffDays = Math.floor(replyDiffTime / (1000 * 60 * 60 * 24))
                  let replyRelativeDate = replyFormattedDate
                  
                  if (replyDiffDays === 0) {
                    replyRelativeDate = 'Today'
                  } else if (replyDiffDays === 1) {
                    replyRelativeDate = '1 day ago'
                  } else if (replyDiffDays < 7) {
                    replyRelativeDate = `${replyDiffDays} days ago`
                  } else if (replyDiffDays < 30) {
                    const weeks = Math.floor(replyDiffDays / 7)
                    replyRelativeDate = `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`
                  } else if (replyDiffDays < 365) {
                    const months = Math.floor(replyDiffDays / 30)
                    replyRelativeDate = `${months} ${months === 1 ? 'month' : 'months'} ago`
                  } else {
                    replyRelativeDate = replyFormattedDate
                  }
                  
                  replyData = {
                    message: reply.message.trim(),
                    repliedBy: (reply.repliedBy && typeof reply.repliedBy === 'object' && reply.repliedBy.name) 
                      ? reply.repliedBy.name 
                      : (typeof reply.repliedBy === 'string' ? reply.repliedBy : 'Venue Owner'),
                    repliedAt: replyRelativeDate
                  }
                } else {
                  // Invalid date, use message only
                  replyData = {
                    message: reply.message.trim(),
                    repliedBy: (reply.repliedBy && typeof reply.repliedBy === 'object' && reply.repliedBy.name) 
                      ? reply.repliedBy.name 
                      : (typeof reply.repliedBy === 'string' ? reply.repliedBy : 'Venue Owner'),
                    repliedAt: 'Recently'
                  }
                }
              }
              
              return {
                id: review._id || review.id || index,
                userName: userName,
                userAvatar: userAvatar,
                rating: rating,
                date: relativeDate,
                comment: comment,
                verified: review.verified || false,
                reply: replyData // This will be null if no reply, or an object with message, repliedBy, repliedAt
              }
            })
          })(),
          albums: (() => {
            // Collect all photos from different sources
            const allPhotos = []
            
            // Add gallery photos
            if (venueData.gallery?.photos && Array.isArray(venueData.gallery.photos)) {
              allPhotos.push(...venueData.gallery.photos)
            }
            
            // Add images array
            if (venueData.images && Array.isArray(venueData.images)) {
              allPhotos.push(...venueData.images)
            }
            
            // Add coverImage if not already included
            if (venueData.coverImage && !allPhotos.includes(venueData.coverImage)) {
              allPhotos.push(venueData.coverImage)
            }
            
            // Remove duplicates
            const uniquePhotos = [...new Set(allPhotos)]
            
            // Create album with all photos
            if (uniquePhotos.length > 0) {
              return [{
                id: 1,
                title: 'Gallery',
                coverImage: getImageUrl(uniquePhotos[0]),
                imageCount: uniquePhotos.length,
                images: uniquePhotos.map(img => getImageUrl(img))
              }]
            }
            
            return []
          })(),
          videos: venueData.gallery?.videos ? venueData.gallery.videos.map((video, idx) => ({
            id: idx + 1,
            title: `Video ${idx + 1}`,
            thumbnail: getImageUrl(venueData.coverImage),
            videoUrl: getImageUrl(video),
            duration: '0:00'
          })) : [],
          bookingButtonEnabled: venueData.bookingButtonEnabled !== undefined ? venueData.bookingButtonEnabled : true,
          leadsButtonEnabled: venueData.leadsButtonEnabled !== undefined ? venueData.leadsButtonEnabled : true
        }

        if (formattedVenue.images.length === 0) {
          formattedVenue.images = ['https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200&h=600&fit=crop']
        }

        setVenue(formattedVenue)
      }
    } catch (error) {
      console.error('Error refreshing venue:', error)
    }
  }

  // Handle review submission
  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    
    // Check if user is logged in
    const token = localStorage.getItem('token')
    if (!token) {
      toast.error('Please login to submit a review')
      return
    }

    if (!venue || !venue.id) {
      toast.error('Venue information not available')
      return
    }

    try {
      setSubmittingReview(true)
      
      const response = await reviewAPI.create(
        venue.id,
        reviewForm.rating,
        reviewForm.comment
      )

      if (response.data?.success) {
        toast.success('Review submitted successfully!')
        setShowWriteReview(false)
        setReviewForm({ rating: 5, comment: '' })
        
        // Refresh venue data to show new review
        await refreshVenueData()
      } else {
        toast.error(response.data?.error || 'Failed to submit review')
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      toast.error(error.message || 'Failed to submit review. Please try again.')
    } finally {
      setSubmittingReview(false)
    }
  }

  // Mock venue data - in a real app, this would come from an API
  const venues = {
    1: {
      id: 1,
      name: 'Riva Beach Resort',
      images: [
        'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200&h=600&fit=crop',
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&h=600&fit=crop',
        'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&h=600&fit=crop',
        'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1200&h=600&fit=crop'
      ],
      rating: 4.8,
      reviews: 18,
      location: 'Mandrem, Goa',
      fullLocation: 'Mandrem Beach, North Goa, Goa 403512',
      type: 'Beach Front Resort',
      price: '16.00 Lakh',
      rooms: 140,
      capacity: '100-500 pax',
      description: 'Experience luxury at its finest at Riva Beach Resort, a stunning beachfront property offering breathtaking views of the Arabian Sea. Perfect for weddings, corporate events, and celebrations.',
      amenities: [
        'Swimming Pool',
        'Beach Access',
        'Parking',
        'Wi-Fi',
        'Air Conditioning',
        'Restaurant',
        'Bar',
        'Spa',
        'Gym',
        'Conference Hall',
        'Garden',
        'Sound System'
      ],
      highlights: [
        'Direct beach access',
        '140 luxury rooms',
        'Multiple event spaces',
        'In-house catering',
        'Professional event management'
      ],
      policies: {
        checkIn: '2:00 PM',
        checkOut: '11:00 AM',
        cancellation: 'Free cancellation up to 7 days before check-in',
        pets: 'Not allowed',
        smoking: 'Designated areas only'
      },
      ratingBreakdown: {
        5: 12,
        4: 5,
        3: 1,
        2: 0,
        1: 0
      },
      reviewsList: [
        {
          id: 1,
          userName: 'Priya Sharma',
          userAvatar: 'PS',
          rating: 5,
          date: '2 weeks ago',
          comment: 'Absolutely stunning venue! The beachfront location was perfect for our wedding. The staff was incredibly professional and the food was exceptional. Highly recommend!',
          verified: true
        },
        {
          id: 2,
          userName: 'Rajesh Kumar',
          userAvatar: 'RK',
          rating: 5,
          date: '1 month ago',
          comment: 'We hosted our corporate event here and it exceeded all expectations. The conference facilities are top-notch and the service is impeccable. Will definitely book again.',
          verified: true
        },
        {
          id: 3,
          userName: 'Anita Desai',
          userAvatar: 'AD',
          rating: 4,
          date: '2 months ago',
          comment: 'Beautiful resort with great amenities. The rooms are spacious and well-maintained. The only minor issue was the Wi-Fi speed in some areas, but overall a wonderful experience.',
          verified: true
        },
        {
          id: 4,
          userName: 'Vikram Singh',
          userAvatar: 'VS',
          rating: 5,
          date: '3 months ago',
          comment: 'Perfect destination for a family celebration! The kids loved the pool and beach access. The event management team handled everything flawlessly. Worth every penny!',
          verified: true
        },
        {
          id: 5,
          userName: 'Meera Patel',
          userAvatar: 'MP',
          rating: 4,
          date: '4 months ago',
          comment: 'Great venue with excellent facilities. The catering service was outstanding. The only suggestion would be to add more parking space during peak season.',
          verified: true
        }
      ],
      albums: [
        {
          id: 1,
          title: 'Wedding Events',
          coverImage: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&h=300&fit=crop',
          imageCount: 24,
          images: [
            'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=600&fit=crop'
          ]
        },
        {
          id: 2,
          title: 'Corporate Events',
          coverImage: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=300&fit=crop',
          imageCount: 18,
          images: [
            'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&h=600&fit=crop'
          ]
        },
        {
          id: 3,
          title: 'Birthday Celebrations',
          coverImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
          imageCount: 15,
          images: [
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&h=600&fit=crop'
          ]
        }
      ],
      videos: [
        {
          id: 1,
          title: 'Venue Tour',
          thumbnail: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&h=450&fit=crop',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          duration: '3:45'
        },
        {
          id: 2,
          title: 'Wedding Highlights',
          thumbnail: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=450&fit=crop',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
          duration: '5:20'
        },
        {
          id: 3,
          title: 'Event Showcase',
          thumbnail: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&h=450&fit=crop',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          duration: '2:15'
        }
      ]
    },
    2: {
      id: 2,
      name: 'Ramada By Wyndham',
      images: [
        'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&h=600&fit=crop',
        'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200&h=600&fit=crop',
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&h=600&fit=crop',
        'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1200&h=600&fit=crop'
      ],
      rating: 5.0,
      reviews: 3,
      location: 'Goa',
      fullLocation: 'Goa International Airport Road, Goa 403530',
      type: '4 Star Hotel',
      price: '15.00 Lakh',
      rooms: 64,
      capacity: '150-250 pax',
      description: 'A premium 4-star hotel offering world-class amenities and exceptional service. Ideal for corporate events, conferences, and elegant celebrations.',
      amenities: [
        'Swimming Pool',
        'Parking',
        'Wi-Fi',
        'Air Conditioning',
        'Restaurant',
        'Bar',
        'Spa',
        'Gym',
        'Conference Hall',
        'Business Center',
        'Room Service',
        'Laundry'
      ],
      highlights: [
        'Airport proximity',
        '64 deluxe rooms',
        'State-of-the-art conference facilities',
        'Fine dining restaurant',
        '24/7 concierge service'
      ],
      policies: {
        checkIn: '3:00 PM',
        checkOut: '12:00 PM',
        cancellation: 'Free cancellation up to 3 days before check-in',
        pets: 'Not allowed',
        smoking: 'Non-smoking property'
      },
      ratingBreakdown: {
        5: 3,
        4: 0,
        3: 0,
        2: 0,
        1: 0
      },
      reviewsList: [
        {
          id: 1,
          userName: 'Amit Verma',
          userAvatar: 'AV',
          rating: 5,
          date: '1 week ago',
          comment: 'Exceptional service and facilities! The hotel exceeded our expectations in every way. Perfect for business meetings and corporate events.',
          verified: true
        },
        {
          id: 2,
          userName: 'Sneha Reddy',
          userAvatar: 'SR',
          rating: 5,
          date: '3 weeks ago',
          comment: 'Luxury at its finest! The rooms are elegant, the food is delicious, and the staff goes above and beyond. Highly recommend for any special occasion.',
          verified: true
        },
        {
          id: 3,
          userName: 'Karan Malhotra',
          userAvatar: 'KM',
          rating: 5,
          date: '1 month ago',
          comment: 'Outstanding venue for conferences. The meeting rooms are well-equipped and the location near the airport is very convenient. Professional service throughout.',
          verified: true
        }
      ],
      albums: [
        {
          id: 1,
          title: 'Conference Events',
          coverImage: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=300&fit=crop',
          imageCount: 20,
          images: [
            'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=600&fit=crop'
          ]
        },
        {
          id: 2,
          title: 'Corporate Meetings',
          coverImage: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=400&h=300&fit=crop',
          imageCount: 16,
          images: [
            'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop'
          ]
        }
      ],
      videos: [
        {
          id: 1,
          title: 'Hotel Tour',
          thumbnail: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&h=450&fit=crop',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          duration: '4:10'
        },
        {
          id: 2,
          title: 'Conference Facilities',
          thumbnail: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=450&fit=crop',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
          duration: '3:30'
        }
      ]
    },
    3: {
      id: 3,
      name: 'White Wharf Beach Resort',
      images: [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&h=600&fit=crop',
        'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200&h=600&fit=crop',
        'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&h=600&fit=crop',
        'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1200&h=600&fit=crop'
      ],
      rating: 5.0,
      reviews: 2,
      location: 'Morjim, Goa',
      fullLocation: 'Morjim Beach, North Goa, Goa 403512',
      type: 'Resort',
      price: '20.00 Lakh',
      rooms: 100,
      capacity: '150-450 pax',
      description: 'Nestled along the pristine shores of Morjim Beach, White Wharf offers a perfect blend of luxury and natural beauty. An ideal destination for destination weddings and grand celebrations.',
      amenities: [
        'Swimming Pool',
        'Beach Access',
        'Parking',
        'Wi-Fi',
        'Air Conditioning',
        'Restaurant',
        'Bar',
        'Spa',
        'Gym',
        'Garden',
        'Sound System',
        'Fireworks Allowed'
      ],
      highlights: [
        'Private beach section',
        '100 elegant rooms',
        'Grand wedding lawns',
        'Beachside dining',
        'Water sports activities'
      ],
      policies: {
        checkIn: '2:00 PM',
        checkOut: '11:00 AM',
        cancellation: 'Free cancellation up to 14 days before check-in',
        pets: 'Allowed with restrictions',
        smoking: 'Designated areas only'
      },
      ratingBreakdown: {
        5: 2,
        4: 0,
        3: 0,
        2: 0,
        1: 0
      },
      reviewsList: [
        {
          id: 1,
          userName: 'Neha Kapoor',
          userAvatar: 'NK',
          rating: 5,
          date: '3 weeks ago',
          comment: 'Dream wedding venue! The beachside setting was magical and the staff made our special day absolutely perfect. The food was exquisite and the decor options are amazing.',
          verified: true
        },
        {
          id: 2,
          userName: 'Arjun Mehta',
          userAvatar: 'AM',
          rating: 5,
          date: '2 months ago',
          comment: 'Incredible resort with breathtaking views. The private beach section was perfect for our event. The water sports activities were a huge hit with our guests!',
          verified: true
        }
      ],
      albums: [
        {
          id: 1,
          title: 'Beach Weddings',
          coverImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
          imageCount: 30,
          images: [
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=800&h=600&fit=crop'
          ]
        },
        {
          id: 2,
          title: 'Destination Events',
          coverImage: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&h=300&fit=crop',
          imageCount: 22,
          images: [
            'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=600&fit=crop'
          ]
        }
      ],
      videos: [
        {
          id: 1,
          title: 'Resort Tour',
          thumbnail: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=450&fit=crop',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          duration: '4:30'
        },
        {
          id: 2,
          title: 'Wedding Highlights',
          thumbnail: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=450&fit=crop',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
          duration: '6:00'
        }
      ]
    }
  }

  // Show loading state
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '80vh',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <img 
          src="/image/venuebook.png" 
          alt="ShubhVenue Logo" 
          style={{ 
            height: '80px', 
            width: 'auto', 
            objectFit: 'contain',
            animation: 'pulse 2s ease-in-out infinite'
          }}
          onError={(e) => {
            e.target.onerror = null
            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiByeD0iMTYiIGZpbGw9InVybCgjZ3JhZGllbnQpIi8+CjxzdmcgeD0iMjgiIHk9IjI4IiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSI+CjxwYXRoIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0wIDNjMS42NiAwIDMgMS4zNCAzIDNzLTEuMzQgMy0zIDMtMy0xLjM0LTMtMyAxLjM0LTMgMy0zem0wIDE0LjJjLTIuNjcgMC04IDEuMzQtOCA0djEuOGgxNnYtMS44YzAtMi42Ni01LjMzLTQtOC00eiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9ImdyYWRpZW50IiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj4KPHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6Izk0NDg3QTtzdG9wLW9wYWNpdHk6MSIgLz4KPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojRUM0ODk5O3N0b3Atb3BhY2l0eToxIiAvPgo8L2xpbmVhckdyYWRpZW50Pgo8L2RlZnM+Cjwvc3ZnPg=='
          }}
        />
        <p style={{ color: 'var(--gray-medium)', fontSize: '16px' }}>Loading venue details...</p>
      </div>
    )
  }

  // Show error state if venue not found
  if (!venue) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '80vh',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <h2>Venue not found</h2>
        <button 
          onClick={() => navigate('/venues')}
          style={{
            padding: '12px 24px',
            backgroundColor: '#8B5CF6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Back to Venues
        </button>
      </div>
    )
  }

  // Get location for SEO
  const venueLocation = venue?.location?.city || venue?.location?.state || null
  const venueName = venue?.name || ''
  const venueDescription = venue?.description || venue?.highlights?.join(', ') || ''
  const venueImage = venue?.images?.[0] ? getImageUrl(venue.images[0]) : 'https://shubhvenue.com/image/venuebook.png'

  return (
    <div className="venue-detail">
      <SEO 
        title={venue ? `${venueName} - Best Wedding Venue in ${venueLocation || 'India'} | ShubhVenue` : 'Venue Details | ShubhVenue'}
        description={venue ? `Book ${venueName} in ${venueLocation || 'India'} for your wedding. ${venueDescription.substring(0, 150)}... Best wedding venue with excellent facilities.` : 'Find the perfect wedding venue for your special day.'}
        keywords={venue ? `${venueName}, ${venueLocation} venues, wedding venue ${venueLocation}, ${venueLocation} wedding halls, ${venueLocation} banquet halls, wedding booking ${venueLocation}, venue booking` : 'wedding venues, venues, venue booking'}
        location={venueLocation}
        image={venueImage}
        type="website"
      />
      {/* Image Gallery Slider */}
      <div className="venue-gallery-slider">
        {/* Back Button */}
        <button className="back-button" onClick={() => navigate(-1)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          Back
        </button>
        
        {/* Slider Container - 3 Images Layout */}
        <div 
          className="slider-container"
          onMouseEnter={() => setIsSliderPaused(true)}
          onMouseLeave={() => setIsSliderPaused(false)}
          onTouchStart={(e) => {
            if (!isMobile || !venue?.images?.length) return
            setTouchStartX(e.touches[0].clientX)
          }}
          onTouchMove={(e) => {
            if (!isMobile || touchStartX === null) return
            const deltaX = e.touches[0].clientX - touchStartX
            if (Math.abs(deltaX) > 10) {
              // prevent vertical scroll interference only when swiping horizontally
              e.preventDefault()
            }
          }}
          onTouchEnd={(e) => {
            if (!isMobile || touchStartX === null || !venue?.images?.length) return
            const endX = e.changedTouches[0].clientX
            const deltaX = endX - touchStartX
            const threshold = 40
            if (Math.abs(deltaX) > threshold) {
              if (deltaX < 0) {
                // swipe left -> next
                setCurrentImageIndex(prev => (prev === venue.images.length - 1 ? 0 : prev + 1))
              } else {
                // swipe right -> prev
                setCurrentImageIndex(prev => (prev === 0 ? venue.images.length - 1 : prev - 1))
              }
            }
            setTouchStartX(null)
          }}
        >
          {/* Previous Button */}
          {venue.images.length > 1 && (
            <button 
              className="slider-nav-btn slider-prev" 
              onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? venue.images.length - 1 : prev - 1))}
              aria-label="Previous image"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
          )}
          
          {/* 3 Images Layout Slider */}
          <div className="slider-wrapper">
            {isMobile ? (
              <div className="slider-track-single">
                <div className="slider-slide-single">
                  <img
                    src={getImageUrl(venue.images[currentImageIndex])}
                    alt={`${venue.name} ${currentImageIndex + 1}`}
                    onClick={() => setSelectedImage(getImageUrl(venue.images[currentImageIndex]))}
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200&h=600&fit=crop'
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="slider-track-3images">
                {/* Always show 3 images: previous, current, next */}
                {(() => {
                  const images = venue.images
                  const prevIndex = currentImageIndex === 0 ? images.length - 1 : currentImageIndex - 1
                  const nextIndex = currentImageIndex === images.length - 1 ? 0 : currentImageIndex + 1
                  
                  return (
                    <>
                      {/* Left Image */}
                      <div className="slider-slide-3images left">
                        <img 
                          src={getImageUrl(images[prevIndex])} 
                          alt={`${venue.name} previous`}
                          onClick={() => {
                            setSelectedImage(getImageUrl(images[prevIndex]))
                            setCurrentImageIndex(prevIndex)
                          }}
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200&h=600&fit=crop'
                          }}
                        />
                      </div>
                      
                      {/* Main Image */}
                      <div className="slider-slide-3images main">
                        <img 
                          src={getImageUrl(images[currentImageIndex])} 
                          alt={`${venue.name} ${currentImageIndex + 1}`}
                          onClick={() => {
                            setSelectedImage(getImageUrl(images[currentImageIndex]))
                          }}
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200&h=600&fit=crop'
                          }}
                        />
                      </div>
                      
                      {/* Right Image */}
                      <div className="slider-slide-3images right">
                        <img 
                          src={getImageUrl(images[nextIndex])} 
                          alt={`${venue.name} next`}
                          onClick={() => {
                            setSelectedImage(getImageUrl(images[nextIndex]))
                            setCurrentImageIndex(nextIndex)
                          }}
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200&h=600&fit=crop'
                          }}
                        />
                      </div>
                    </>
                  )
                })()}
              </div>
            )}
          </div>
          
          {/* Next Button */}
          {venue.images.length > 1 && (
            <button 
              className="slider-nav-btn slider-next" 
              onClick={() => setCurrentImageIndex((prev) => (prev === venue.images.length - 1 ? 0 : prev + 1))}
              aria-label="Next image"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          )}
        </div>
        
        {/* Slider Dots */}
        {venue.images.length > 1 && (
          <div className="slider-dots">
            {venue.images.map((_, index) => (
              <button
                key={index}
                className={`slider-dot ${index === currentImageIndex ? 'active' : ''}`}
                onClick={() => setCurrentImageIndex(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="venue-detail-container">
        <div className="venue-detail-content">
          {/* Left Column - Main Info */}
          <div className="venue-info-main">
            {/* Header */}
            <div className="venue-header">
              <div className="venue-title-section">
                <h1 className="venue-title">{venue.name}</h1>
                <div className="venue-meta">
                  <div className="venue-rating">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                    <span className="rating-value">
                      {typeof venue.rating === 'number' ? venue.rating.toFixed(1) : 'N/A'}
                    </span>
                    <span className="rating-reviews">({venue.reviews} reviews)</span>
                  </div>
                  <div className="venue-location">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <span>{venue.fullLocation}</span>
                  </div>
                  <div className="venue-type">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    </svg>
                    <span>{venue.type}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="venue-section">
              <h2 className="section-title">About This Venue</h2>
              <p className="venue-description">{venue.description}</p>
            </div>

            {/* Highlights */}
            {venue.highlights && venue.highlights.length > 0 && (
              <div className="venue-section">
                <h2 className="section-title">Highlights</h2>
                <ul className="highlights-list">
                  {venue.highlights.map((highlight, index) => (
                    <li key={index}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      {highlight}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Amenities */}
            <div className="venue-section">
              <h2 className="section-title">Amenities</h2>
              <div className="amenities-grid">
                {venue.amenities.map((amenity, index) => (
                  <div key={index} className="amenity-item">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Policies */}
            <div className="venue-section">
              <h2 className="section-title">Policies & Guidelines</h2>
              <div className="policies-grid">
                <div className="policy-item">
                  <span className="policy-label">Check-in</span>
                  <span className="policy-value">{venue.policies.checkIn}</span>
                </div>
                <div className="policy-item">
                  <span className="policy-label">Check-out</span>
                  <span className="policy-value">{venue.policies.checkOut}</span>
                </div>
                <div className="policy-item">
                  <span className="policy-label">Cancellation</span>
                  <span className="policy-value">{venue.policies.cancellation}</span>
                </div>
                <div className="policy-item">
                  <span className="policy-label">Pets</span>
                  <span className="policy-value">{venue.policies.pets}</span>
                </div>
                <div className="policy-item">
                  <span className="policy-label">Smoking</span>
                  <span className="policy-value">{venue.policies.smoking}</span>
                </div>
              </div>
            </div>

            {/* Rating & Reviews */}
            <div className="venue-section">
              <div className="reviews-header">
                <div>
                  <h2 className="section-title">Ratings & Reviews</h2>
                  <div className="reviews-summary">
                    <div className="overall-rating">
                      <span className="overall-rating-value">
                        {typeof venue.rating === 'number' ? venue.rating.toFixed(1) : '0.0'}
                      </span>
                      <div className="overall-rating-stars">
                        {[...Array(5)].map((_, i) => {
                          const starNumber = i + 1
                          const ratingNum = typeof venue.rating === 'number' ? venue.rating : 0
                          const isFilled = starNumber <= Math.floor(ratingNum)
                          return (
                            <svg 
                              key={i} 
                              width="24" 
                              height="24" 
                              viewBox="0 0 24 24" 
                              fill={isFilled ? "currentColor" : "none"} 
                              stroke="currentColor" 
                              strokeWidth="2"
                              className={isFilled ? "star-filled" : "star-empty"}
                            >
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                            </svg>
                          )
                        })}
                      </div>
                      <span className="overall-rating-count">Based on {venue.reviews} reviews</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rating Breakdown */}
              <div className="rating-breakdown">
                <h3 className="breakdown-title">Rating Breakdown</h3>
                <div className="breakdown-bars">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = venue.ratingBreakdown[star] || 0
                    const percentage = venue.reviews > 0 ? (count / venue.reviews) * 100 : 0
                    return (
                      <div key={star} className="breakdown-item">
                        <span className="breakdown-star">{star}</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                        <div className="breakdown-bar">
                          <div 
                            className="breakdown-bar-fill" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="breakdown-count">{count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Reviews List */}
              <div className="reviews-list">
                <h3 className="reviews-list-title">Guest Reviews</h3>
                {venue.reviewsList && venue.reviewsList.length > 0 ? (
                  venue.reviewsList.map((review) => (
                  <div key={review.id} className="review-card">
                    <div className="review-header">
                      <div className="review-user">
                        <div className="review-avatar">
                          {review.userAvatar}
                        </div>
                        <div className="review-user-info">
                          <div className="review-user-name">
                            {review.userName}
                            {review.verified && (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" className="verified-badge">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                              </svg>
                            )}
                          </div>
                          <div className="review-date">{review.date}</div>
                        </div>
                      </div>
                      <div className="review-rating">
                        {[...Array(5)].map((_, i) => (
                          <svg 
                            key={i} 
                            width="16" 
                            height="16" 
                            viewBox="0 0 24 24" 
                            fill={i < review.rating ? "currentColor" : "none"} 
                            stroke="currentColor" 
                            strokeWidth="2"
                            className={i < review.rating ? "star-filled" : "star-empty"}
                          >
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                          </svg>
                        ))}
                      </div>
                    </div>
                    <p className="review-comment">{review.comment}</p>
                    
                    {/* Vendor Reply - Show if reply data exists */}
                    {review.reply && review.reply.message && typeof review.reply.message === 'string' && review.reply.message.trim() && (
                      <div className="vendor-reply">
                        <div className="vendor-reply-header">
                          <div className="vendor-reply-badge">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                              <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                            <span>{review.reply.repliedBy || 'Venue Owner'}</span>
                          </div>
                          <span className="vendor-reply-date">{review.reply.repliedAt || 'Recently'}</span>
                        </div>
                        <p className="vendor-reply-message">{review.reply.message}</p>
                      </div>
                    )}
                  </div>
                  ))
                ) : (
                  <div className="no-reviews">
                    <p>No reviews yet. Be the first to review this venue!</p>
                  </div>
                )}
                <button className="write-review-btn" onClick={() => setShowWriteReview(true)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    <line x1="9" y1="10" x2="15" y2="10"></line>
                    <line x1="12" y1="7" x2="12" y2="13"></line>
                  </svg>
                  Write a Review
                </button>
              </div>
            </div>

            {/* Portfolio & Albums */}
            <div className="venue-section">
              <h2 className="section-title">Portfolio & Albums</h2>
              <div className="album-images-grid" style={{ marginTop: '24px' }}>
                {(() => {
                  // Collect all photos from albums
                  const allPhotos = []
                  if (venue.albums && Array.isArray(venue.albums)) {
                    venue.albums.forEach(album => {
                      if (album.images && Array.isArray(album.images)) {
                        allPhotos.push(...album.images)
                      }
                    })
                  }
                  
                  // Also add main images if not already included
                  if (venue.images && Array.isArray(venue.images)) {
                    venue.images.forEach(img => {
                      if (!allPhotos.includes(img)) {
                        allPhotos.push(img)
                      }
                    })
                  }
                  
                  // Remove duplicates
                  const uniquePhotos = [...new Set(allPhotos)]
                  
                  return uniquePhotos.length > 0 ? (
                    uniquePhotos.map((image, index) => (
                      <div 
                        key={index} 
                        className="album-image-item"
                        onClick={() => setSelectedImage(image)}
                        style={{ cursor: 'pointer' }}
                      >
                        <img src={image} alt={`Gallery ${index + 1}`} />
                      </div>
                    ))
                  ) : (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#666' }}>
                      No photos available
                    </div>
                  )
                })()}
              </div>
            </div>

            {/* Videos */}
            <div className="venue-section">
              <h2 className="section-title">Videos</h2>
              <div className="videos-grid">
                {venue.videos?.map((video) => (
                  <div key={video.id} className="video-card" onClick={() => handleVideoClick(video)}>
                    <div className="video-thumbnail-wrapper">
                      <img src={video.thumbnail} alt={video.title} />
                      <div className="video-play-overlay">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="12" cy="12" r="10" fill="rgba(0,0,0,0.5)"></circle>
                          <polygon points="10 8 16 12 10 16" fill="white"></polygon>
                        </svg>
                      </div>
                      <div className="video-duration">{video.duration}</div>
                    </div>
                    <h3 className="video-title">{video.title}</h3>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Booking Card */}
          <div className="venue-booking-card">
            <div className="booking-card-content">

              {(venue.bookingButtonEnabled === true || venue.bookingButtonEnabled === undefined) && (
                <button 
                  className="book-now-btn" 
                  onClick={() => {
                    const token = localStorage.getItem('token')
                    if (!token) {
                      toast.error('Please login to continue with booking')
                      setShowLoginModal(true)
                      return
                    }
                    navigate('/booking', { state: { venue } })
                  }}
                >
                  Book Now
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
              )}

              {(venue.leadsButtonEnabled === true || venue.leadsButtonEnabled === undefined) && (
                <button 
                  className="contact-btn"
                  onClick={() => setShowContactModal(true)}
                  disabled={processingBooking}
                >
                  {processingBooking ? 'Submitting...' : 'Contact Venue'}
                </button>
              )}

              <div className="booking-note">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
                <span>Best price guaranteed. Free cancellation.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Album Viewer Modal */}
      {selectedAlbum && (
        <div className="modal-overlay" onClick={() => setSelectedAlbum(null)}>
          <div className="album-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedAlbum.title}</h2>
              <button className="modal-close" onClick={() => setSelectedAlbum(null)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="album-images-grid">
              {selectedAlbum.images.map((image, index) => (
                <div 
                  key={index} 
                  className="album-image-item"
                  onClick={() => setSelectedImage(image)}
                >
                  <img src={image} alt={`${selectedAlbum.title} ${index + 1}`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Image Viewer Modal */}
      {selectedImage && (
        <div className="modal-overlay" onClick={() => setSelectedImage(null)}>
          <div className="image-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedImage(null)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <img src={selectedImage} alt="Full size" />
          </div>
        </div>
      )}

      {/* Video Player Modal */}
      {playingVideo && (
        <div className="modal-overlay" onClick={() => setPlayingVideo(null)}>
          <div className="video-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{playingVideo.title}</h2>
              <button className="modal-close" onClick={() => setPlayingVideo(null)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <video className="video-player-full" controls autoPlay>
              <source src={playingVideo.videoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      )}

      {/* Contact Venue Modal */}
      {showContactModal && (
        <div className="modal-overlay" onClick={() => setShowContactModal(false)}>
          <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Contact {venue?.name}</h2>
                <p className="booking-venue-info">{venue?.type} • {venue?.location}</p>
              </div>
              <button className="modal-close" onClick={() => setShowContactModal(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="booking-modal-content">
              <form 
                className="booking-form"
                onSubmit={(e) => {
                  e.preventDefault()
                  handleContactVenue()
                }}
              >
                <div className="booking-form-section">
                  <h3 className="form-section-title">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    Dates & Guests
                  </h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Check-in Date *</label>
                      <input
                        type="date"
                        value={bookingForm.checkIn}
                        onChange={(e) => setBookingForm({ ...bookingForm, checkIn: e.target.value })}
                        required
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div className="form-group">
                      <label>Check-out Date *</label>
                      <input
                        type="date"
                        value={bookingForm.checkOut}
                        onChange={(e) => setBookingForm({ ...bookingForm, checkOut: e.target.value })}
                        required
                        min={bookingForm.checkIn || new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Number of Guests *</label>
                      <input
                        type="number"
                        value={bookingForm.guests}
                        onChange={(e) => setBookingForm({ ...bookingForm, guests: e.target.value })}
                        placeholder="e.g., 100"
                        min="1"
                        max="1000"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Number of Rooms</label>
                      <input
                        type="number"
                        value={bookingForm.rooms}
                        onChange={(e) => setBookingForm({ ...bookingForm, rooms: e.target.value })}
                        placeholder="Number of rooms"
                        min="1"
                      />
                    </div>
                  </div>
                </div>

                <div className="booking-form-section">
                  <h3 className="form-section-title">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    Contact Information
                  </h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Full Name *</label>
                      <input
                        type="text"
                        value={bookingForm.fullName}
                        onChange={(e) => setBookingForm({ ...bookingForm, fullName: e.target.value })}
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Email Address *</label>
                      <input
                        type="email"
                        value={bookingForm.email}
                        onChange={(e) => setBookingForm({ ...bookingForm, email: e.target.value })}
                        placeholder="your.email@example.com"
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Phone Number *</label>
                    <input
                      type="tel"
                      value={bookingForm.phone}
                      onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      required
                    />
                  </div>
                </div>

                <div className="booking-form-section">
                  <h3 className="form-section-title">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    Event Details
                  </h3>
                  <div className="form-group">
                    <label>Event Type *</label>
                    <select
                      value={bookingForm.eventType}
                      onChange={(e) => setBookingForm({ ...bookingForm, eventType: e.target.value })}
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
                  </div>
                  <div className="form-group">
                    <label>Food Preference *</label>
                    <select
                      value={bookingForm.foodPreference}
                      onChange={(e) => setBookingForm({ ...bookingForm, foodPreference: e.target.value })}
                      required
                    >
                      <option value="both">Both (Veg & Non-Veg)</option>
                      <option value="veg">Vegetarian</option>
                      <option value="non-veg">Non-Vegetarian</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Special Requests</label>
                    <textarea
                      value={bookingForm.specialRequests}
                      onChange={(e) => setBookingForm({ ...bookingForm, specialRequests: e.target.value })}
                      placeholder="Any special requirements or requests..."
                      rows="4"
                    />
                  </div>
                </div>

                <div className="booking-form-actions">
                  <button 
                    type="button" 
                    className="cancel-booking-btn" 
                    onClick={() => setShowContactModal(false)}
                    disabled={processingBooking}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="confirm-booking-btn"
                    disabled={processingBooking}
                  >
                    {processingBooking ? 'Submitting...' : 'Submit Inquiry'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Write Review Modal */}
      {showWriteReview && (
        <div className="modal-overlay" onClick={() => setShowWriteReview(false)}>
          <div className="review-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Write a Review</h2>
              <button className="modal-close" onClick={() => setShowWriteReview(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <form 
              className="review-form"
              onSubmit={handleReviewSubmit}
            >
              <div className="form-group">
                <label>Rating</label>
                <div className="rating-input">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`star-btn ${star <= reviewForm.rating ? 'active' : ''}`}
                      onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                    >
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Your Review</label>
                <textarea
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  placeholder="Share your experience..."
                  rows="6"
                  required
                />
              </div>
              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-btn" 
                  onClick={() => setShowWriteReview(false)}
                  disabled={submittingReview}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={submittingReview}
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Login Modal */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={() => {
          setShowLoginModal(false)
          // User can now proceed with booking
        }}
      />
    </div>
  )
}

export default VenueDetail

