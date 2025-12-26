import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { vendorAPI, categoryAPI, reviewAPI, menuAPI, vendorCategoriesAPI } from '../../services/vendor/api'
import { useAuth } from '../../contexts/vendor/AuthContext'
import { 
  Plus, 
  Edit, 
  Trash2, 
  MapPin, 
  Users, 
  RefreshCw,
  Image as ImageIcon,
  X,
  CheckCircle,
  Clock,
  XCircle,
  Power,
  PowerOff,
  Star,
  MessageSquare,
  Play,
  Video
} from 'lucide-react'
import { format } from 'date-fns'
import { getImageUrl } from '../../utils/vendor/imageUrl'
import { hasVendorPermission } from '../../utils/vendor/permissions'
import { Pagination } from '../../components/admin/ui/Pagination'


export default function Venues() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const isAddPage = location.pathname.startsWith('/vendor/venues/add')

  const [venues, setVenues] = useState([])
  const [categories, setCategories] = useState([])
  const [vendorCategories, setVendorCategories] = useState([]) // Vendor categories for form config
  const [selectedVendorCategoryId, setSelectedVendorCategoryId] = useState('') // Selected vendor category for form config
  const [menus, setMenus] = useState([])
  const [submenus, setSubmenus] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  })
  const [showAddModal, setShowAddModal] = useState(isAddPage)
  const [editingVenue, setEditingVenue] = useState(null)
  
  // Get form configuration from selected vendor category or user's vendor category
  // When editing, ignore formConfig to show all fields
  // Use useMemo to recalculate when dependencies change
  const formConfig = useMemo(() => {
    if (editingVenue) return null
    
    // If vendor category is selected in dropdown, use that
    if (selectedVendorCategoryId) {
      const selectedCategory = vendorCategories.find(cat => cat._id === selectedVendorCategoryId)
      console.log('Selected Category:', {
        id: selectedVendorCategoryId,
        name: selectedCategory?.name,
        hasFormConfig: !!selectedCategory?.formConfig,
        hasVenueConfig: !!selectedCategory?.formConfig?.venue,
        formConfig: selectedCategory?.formConfig
      })
      if (selectedCategory?.formConfig?.venue) {
        return selectedCategory.formConfig.venue
      }
    }
    
    // Otherwise use user's vendor category
    const userFormConfig = user?.vendorCategory?.formConfig?.venue || null
    console.log('Using user vendor category formConfig:', {
      hasUserCategory: !!user?.vendorCategory,
      hasFormConfig: !!user?.vendorCategory?.formConfig,
      hasVenueConfig: !!userFormConfig
    })
    return userFormConfig
  }, [editingVenue, selectedVendorCategoryId, vendorCategories, user?.vendorCategory?.formConfig?.venue])
  const [statusFilter, setStatusFilter] = useState('all') // Status filter
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    price: '',
    capacity: '',
    description: '',
    categoryId: '',
    menuId: '',
    subMenuId: '',
    amenities: [],
    highlights: [],
    rooms: '',
    openTime: '',
    closeTime: '',
    openDays: [],
  })
  const [selectedImage, setSelectedImage] = useState(null)
  const [existingImageUrl, setExistingImageUrl] = useState(null) // For showing existing image when editing
  const [galleryImages, setGalleryImages] = useState([])
  const [existingGalleryUrls, setExistingGalleryUrls] = useState([]) // For showing existing gallery when editing
  const [videoFiles, setVideoFiles] = useState([])
  const [videoUrls, setVideoUrls] = useState([])
  const [playingVideo, setPlayingVideo] = useState(null) // Track which video is playing (object with url, title) (for modal)
  const [videoModalOpen, setVideoModalOpen] = useState(false) // Track if video modal is open
  const [currentStep, setCurrentStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [states, setStates] = useState([])
  const [cities, setCities] = useState([])
  const [loadingCities, setLoadingCities] = useState(false)
  const [showReviewsModal, setShowReviewsModal] = useState(false)
  const [selectedVenueForReviews, setSelectedVenueForReviews] = useState(null)
  const [venueReviews, setVenueReviews] = useState([])
  const [loadingReviews, setLoadingReviews] = useState(false)
  const [venueRatings, setVenueRatings] = useState({}) // Store ratings for each venue
  const [confirmAction, setConfirmAction] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [feedbackModal, setFeedbackModal] = useState(null)

  const availableAmenities = [
    'Parking', 'AC', 'WiFi', 'Catering', 'Decoration', 'Sound System',
    'Stage', 'Dance Floor', 'Photography', 'Videography', 'Bridal Room',
    'Groom Room', 'Garden', 'Pool', 'Bar'
  ]

  const weekDays = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ]

  useEffect(() => {
    loadVenues()
    loadCategories()
    loadVendorCategories()
    loadMenus()
    loadStates()
  }, [])

  useEffect(() => {
    loadVenues()
  }, [pagination.page, statusFilter])

  useEffect(() => {
    if (isAddPage) {
      resetForm()
      setEditingVenue(null)
      setCurrentStep(0)
      setShowAddModal(true)
      loadMenus()
      loadVendorCategories()
    } else if (!editingVenue) {
      setShowAddModal(false)
    }
  }, [isAddPage])
  
  // Update selected category when user's vendor category changes
  useEffect(() => {
    if (user?.vendorCategory?._id && !selectedVendorCategoryId && vendorCategories.length > 0) {
      setSelectedVendorCategoryId(user.vendorCategory._id)
    }
  }, [user?.vendorCategory?._id, vendorCategories.length])

  // Load reviews for all venues when venues are loaded
  useEffect(() => {
    if (venues.length > 0) {
      loadAllVenueReviews()
    }
  }, [venues])

  // Load cities when state changes
  useEffect(() => {
    if (formData.state && formData.state.trim()) {
      loadCities(formData.state)
    } else {
      setCities([])
    }
  }, [formData.state])

  // Load submenus when menuId changes
  useEffect(() => {
    if (formData.menuId) {
      loadSubmenus(formData.menuId)
    } else {
      setSubmenus([])
      // Clear subMenuId when menuId is cleared
      if (formData.subMenuId) {
        setFormData(prev => ({ ...prev, subMenuId: '' }))
      }
    }
  }, [formData.menuId])

  // Ensure subMenuId is set correctly after submenus load when editing
  useEffect(() => {
    if (formData.menuId && formData.subMenuId && submenus.length > 0) {
      // Normalize subMenuId to string and check if it exists in loaded submenus
      const normalizedSubMenuId = String(formData.subMenuId)
      const submenuExists = submenus.some(submenu => {
        const submenuId = String(submenu._id || submenu.id || '')
        return submenuId === normalizedSubMenuId
      })
      
      // If submenu doesn't exist in loaded list, try to find it by matching ID
      if (!submenuExists) {
        const foundSubmenu = submenus.find(submenu => {
          const submenuId = String(submenu._id || submenu.id || '')
          return submenuId === normalizedSubMenuId
        })
        
        // If still not found, clear subMenuId
        if (!foundSubmenu && formData.subMenuId) {
          console.warn('Submenu not found in loaded list, clearing subMenuId')
          // Don't clear automatically, let user see the issue
        }
      }
    }
  }, [submenus, formData.menuId, formData.subMenuId])

  const loadVenues = async () => {
    try {
      setLoading(true)
      const params = {
        page: pagination.page,
        limit: pagination.limit
      }
      if (statusFilter !== 'all') {
        params.status = statusFilter
      }
      const response = await vendorAPI.getVenues(params)
      const venuesData = response.data?.venues || response.data?.data || response.data || []
      // Ensure it's always an array
      setVenues(Array.isArray(venuesData) ? venuesData : [])
      
      // Update pagination from response
      if (response.data?.pagination) {
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total || response.data.totalCount || venuesData.length,
          pages: response.data.pagination.pages || response.data.totalPages || 1
        }))
      } else if (response.data?.totalCount) {
        setPagination(prev => ({
          ...prev,
          total: response.data.totalCount,
          pages: Math.ceil(response.data.totalCount / pagination.limit)
        }))
      }
    } catch (error) {
      console.error('Failed to load venues:', error)
      setVenues([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  const loadAllVenueReviews = async () => {
    try {
      const response = await reviewAPI.getReviewsByVendor()
      const reviewsData = response.data?.reviews || []
      
      // Group reviews by venue and calculate ratings
      const ratingsMap = {}
      reviewsData.forEach(review => {
        const venueId = (review.venueId?._id || review.venueId?.id || review.venueId)?.toString()
        if (venueId) {
          if (!ratingsMap[venueId]) {
            ratingsMap[venueId] = { reviews: [], totalRating: 0, count: 0 }
          }
          ratingsMap[venueId].reviews.push(review)
          ratingsMap[venueId].totalRating += review.rating || 0
          ratingsMap[venueId].count += 1
        }
      })
      
      // Calculate averages
      const finalRatings = {}
      Object.keys(ratingsMap).forEach(venueId => {
        const data = ratingsMap[venueId]
        finalRatings[venueId] = {
          average: data.count > 0 ? (data.totalRating / data.count).toFixed(1) : 0,
          count: data.count,
          reviews: data.reviews
        }
      })
      
      setVenueRatings(finalRatings)
    } catch (error) {
      console.error('Failed to load venue reviews:', error)
    }
  }

  const handleViewReviews = async (venue) => {
    const venueId = venue.id || venue._id
    setSelectedVenueForReviews(venue)
    setShowReviewsModal(true)
    setLoadingReviews(true)
    
    try {
      const response = await reviewAPI.getReviewsByVenue(venueId)
      const reviewsData = response.data?.reviews || []
      setVenueReviews(reviewsData)
    } catch (error) {
      console.error('Failed to load reviews:', error)
      alert(error.response?.data?.error || 'Failed to load reviews')
      setVenueReviews([])
    } finally {
      setLoadingReviews(false)
    }
  }

  const loadCategories = async () => {
    try {
      const response = await categoryAPI.getCategories()
      const categoriesData = response.data?.categories || response.data?.data || response.data || []
      // Ensure it's always an array
      setCategories(Array.isArray(categoriesData) ? categoriesData : [])
    } catch (error) {
      console.error('Failed to load categories:', error)
      setCategories([]) // Set empty array on error
    }
  }

  const loadVendorCategories = async () => {
    try {
      const response = await vendorCategoriesAPI.getPublic()
      const vendorCategoriesData = response.data?.categories || response.data || []
      setVendorCategories(Array.isArray(vendorCategoriesData) ? vendorCategoriesData : [])
      
      // Set default to user's vendor category if available
      if (user?.vendorCategory?._id) {
        setSelectedVendorCategoryId(user.vendorCategory._id)
      }
    } catch (error) {
      console.error('Failed to load vendor categories:', error)
      setVendorCategories([])
    }
  }

  const loadMenus = async () => {
    try {
      const response = await menuAPI.getMenus({ active: 'all' })
      console.log('Menus API Response:', response)
      console.log('Response Data:', response.data)
      
      let menusData = []
      if (response && response.data) {
        // Backend returns: { success: true, count: X, menus: [...] }
        if (response.data.menus && Array.isArray(response.data.menus)) {
          menusData = response.data.menus
          console.log('✅ Found menus in response.data.menus:', menusData.length)
        } 
        // Check if response.data is directly an array
        else if (Array.isArray(response.data)) {
          menusData = response.data
          console.log('✅ Found menus in response.data (array):', menusData.length)
        } 
        // Check for success response with menus
        else if (response.data.success && response.data.menus) {
          menusData = response.data.menus
          console.log('✅ Found menus in success response:', menusData.length)
        }
        else {
          console.warn('⚠️ Unexpected response structure:', response.data)
        }
      } else {
        console.warn('⚠️ No response data found')
      }
      
      console.log('📋 Final menus data:', menusData)
      console.log('📋 Menus count:', menusData.length)
      if (menusData.length > 0) {
        console.log('📋 Sample menu:', menusData[0])
        console.log('📋 Sample menu keys:', Object.keys(menusData[0]))
        console.log('📋 Sample menu _id:', menusData[0]._id)
        console.log('📋 Sample menu id:', menusData[0].id)
        console.log('📋 Sample menu name:', menusData[0].name)
      }
      // Normalize menu IDs to strings for consistent comparison
      const finalMenus = Array.isArray(menusData) ? menusData.map(menu => ({
        ...menu,
        _id: String(menu._id || menu.id || ''),
        id: String(menu._id || menu.id || '')
      })) : []
      setMenus(finalMenus)
      return finalMenus // Return menus data for use in handleEdit
    } catch (error) {
      console.error('❌ Failed to load menus:', error)
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      })
      setMenus([])
      return [] // Return empty array on error
    }
  }

  const loadSubmenus = async (menuId) => {
    if (!menuId) {
      setSubmenus([])
      return
    }
    try {
      const response = await menuAPI.getMenus({ parentMenuId: menuId, active: 'all' })
      const submenusData = response.data?.menus || response.data || []
      // Normalize submenu IDs to strings for consistent comparison
      const normalizedSubmenus = Array.isArray(submenusData) ? submenusData.map(submenu => ({
        ...submenu,
        _id: String(submenu._id || submenu.id || ''),
        id: String(submenu._id || submenu.id || '')
      })) : []
      setSubmenus(normalizedSubmenus)
    } catch (error) {
      console.error('Failed to load submenus:', error)
      setSubmenus([])
    }
  }

  const loadStates = async () => {
    try {
      const response = await vendorAPI.getStates()
      if (response.data?.success && response.data?.states) {
        setStates(response.data.states)
      } else if (response.data?.states) {
        // Handle case where states are directly in data
        setStates(response.data.states)
      } else {
        console.warn('Unexpected response structure:', response.data)
        setStates([])
      }
    } catch (error) {
      console.error('Failed to load states:', error)
      setStates([])
    }
  }

  const loadCities = async (stateName) => {
    if (!stateName || !stateName.trim()) {
      setCities([])
      return
    }
    
    try {
      setLoadingCities(true)
      const response = await vendorAPI.getCities(stateName.trim())
      if (response.data?.success && response.data?.cities) {
        setCities(response.data.cities)
        // Clear city if it's not in the new list
        if (formData.city && !response.data.cities.some(c => c.toLowerCase() === formData.city.toLowerCase())) {
          setFormData(prev => ({ ...prev, city: '' }))
        }
      } else if (response.data?.cities) {
        // Handle case where cities are directly in data
        setCities(response.data.cities)
      } else {
        console.warn('Unexpected response structure:', response.data)
        setCities([])
      }
    } catch (error) {
      console.error('Failed to load cities:', error)
      setCities([])
    } finally {
      setLoadingCities(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    
    // If state changes, clear city
    if (name === 'state') {
      setFormData({
        ...formData,
        [name]: value,
        city: '' // Clear city when state changes
      })
    } else if (name === 'menuId') {
      // If menu changes, clear submenu and load submenus
      // Normalize value to string
      const normalizedValue = value ? String(value) : ''
      setFormData({
        ...formData,
        [name]: normalizedValue,
        subMenuId: '' // Clear submenu when menu changes
      })
      if (normalizedValue) {
        loadSubmenus(normalizedValue)
      } else {
        setSubmenus([])
      }
    } else {
      setFormData({
        ...formData,
        [name]: value,
      })
    }
  }

  const handleAmenityToggle = (amenity) => {
    setFormData({
      ...formData,
      amenities: formData.amenities.includes(amenity)
        ? formData.amenities.filter(a => a !== amenity)
        : [...formData.amenities, amenity],
    })
  }

  const handleDayToggle = (day) => {
    setFormData({
      ...formData,
      openDays: formData.openDays.includes(day)
        ? formData.openDays.filter(d => d !== day)
        : [...formData.openDays, day],
    })
  }

  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedImage(file)
      setExistingImageUrl(null) // Clear existing image when new one is selected
    }
  }

  // Helper function to convert 24-hour time to 12-hour format (HH:mm -> hh:mm AM/PM)
  const convertTo12Hour = (time24) => {
    if (!time24 || !time24.includes(':')) return ''
    const [hours, minutes] = time24.split(':')
    const hour24 = parseInt(hours, 10)
    if (isNaN(hour24)) return time24
    
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24
    const ampm = hour24 >= 12 ? 'PM' : 'AM'
    return `${hour12}:${minutes} ${ampm}`
  }

  // Helper function to convert 12-hour time to 24-hour format (hh:mm AM/PM -> HH:mm)
  const convertTo24Hour = (time12) => {
    if (!time12) return ''
    
    // Check if already in 24-hour format (no AM/PM)
    if (!time12.includes('AM') && !time12.includes('PM')) {
      return time12
    }
    
    const match = time12.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
    if (!match) return time12
    
    let hours = parseInt(match[1], 10)
    const minutes = match[2]
    const ampm = match[3].toUpperCase()
    
    if (ampm === 'PM' && hours !== 12) {
      hours += 12
    } else if (ampm === 'AM' && hours === 12) {
      hours = 0
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes}`
  }

  // Handle time input change with AM/PM format
  const handleTimeChange = (e) => {
    const { name, value } = e.target
    // Store in 12-hour format for display (user types in format like "9:00 AM" or "2:30 PM")
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleGallerySelect = (e) => {
    const files = Array.from(e.target.files)
    setGalleryImages([...galleryImages, ...files])
  }

  const handleVideoFileSelect = (e) => {
    const files = Array.from(e.target.files)
    setVideoFiles([...videoFiles, ...files])
  }

  const handleVideoUrlAdd = () => {
    const urlInput = document.getElementById('videoUrlInput')
    if (urlInput && urlInput.value.trim()) {
      const url = urlInput.value.trim()
      try {
        new URL(url) // Validate URL
        setVideoUrls([...videoUrls, url])
        urlInput.value = ''
      } catch {
        alert('Please enter a valid URL')
      }
    }
  }

  const removeVideoFile = (index) => {
    setVideoFiles(videoFiles.filter((_, i) => i !== index))
  }

  const removeVideoUrl = (index) => {
    setVideoUrls(videoUrls.filter((_, i) => i !== index))
  }

  const removeExistingGalleryImage = (index) => {
    setExistingGalleryUrls(existingGalleryUrls.filter((_, i) => i !== index))
  }

  const removeExistingVideo = (index) => {
    setVideoUrls(videoUrls.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      // Validation
      if (!formData.name || !formData.name.trim()) {
        alert('Venue name is required')
        setSubmitting(false)
        return
      }
      
      if (!formData.capacity || formData.capacity <= 0) {
        alert('Capacity is required and must be greater than 0')
        setSubmitting(false)
        return
      }
      
      // Location validation - state and city are required
      if (!formData.state || !formData.state.trim()) {
        alert('State is required')
        setSubmitting(false)
        return
      }
      if (!formData.city || !formData.city.trim()) {
        alert('City is required')
        setSubmitting(false)
        return
      }

      const formDataToSend = new FormData()
      
      // Required fields - always send these
      formDataToSend.append('name', formData.name.trim())
      formDataToSend.append('capacity', formData.capacity.toString())
      
      // Location - create location object with state and city (required)
      const locationObj = {
        address: formData.address || '',
        city: formData.city || '',
        state: formData.state || ''
      }
      formDataToSend.append('location', JSON.stringify(locationObj))
      
      // Optional basic fields - always send, even if empty (for updates)
      formDataToSend.append('price', formData.price || '0')
      formDataToSend.append('description', formData.description || '')
      if (formData.categoryId) {
        formDataToSend.append('categoryId', formData.categoryId)
      }
      // Always send menuId and subMenuId (even if empty) so backend can clear them if needed
      formDataToSend.append('menuId', formData.menuId || '')
      formDataToSend.append('subMenuId', formData.subMenuId || '')
      
      // Amenities array - always send, even if empty
      if (formData.amenities && formData.amenities.length > 0) {
        formData.amenities.forEach(amenity => formDataToSend.append('amenities', amenity))
      }
      
      // Highlights array - always send, even if empty
      if (formData.highlights && formData.highlights.length > 0) {
        formData.highlights.filter(h => h.trim()).forEach(highlight => formDataToSend.append('highlights', highlight.trim()))
      }
      
      // Rooms - always send if defined
      if (formData.rooms !== undefined && formData.rooms !== '') {
        formDataToSend.append('rooms', formData.rooms.toString())
      }
      
      // Availability - always send if any field exists
      // Convert 12-hour format to 24-hour format for backend
      const availability = {
        status: 'Open',
        openTime: formData.openTime ? convertTo24Hour(formData.openTime) : '',
        closeTime: formData.closeTime ? convertTo24Hour(formData.closeTime) : '',
        openDays: formData.openDays || []
      }
      formDataToSend.append('availability', JSON.stringify(availability))
      
      // Main Image field removed - not sending image field
      
      // Gallery images - handle both new uploads and existing (when editing)
      if (editingVenue) {
        // When editing: always send existing URLs as JSON string (even if empty) to avoid FormData conflict with files
        // Backend will parse both files from req.files.gallery and URLs from req.body.existingGallery
        // This ensures backend knows to update gallery even if all images are removed
        const existingGalleryJson = JSON.stringify(existingGalleryUrls || [])
        formDataToSend.append('existingGallery', existingGalleryJson)
        console.log('📤 Sending gallery data:', {
          existingUrls: existingGalleryUrls.length,
          existingUrlsData: existingGalleryUrls,
          newFiles: galleryImages?.length || 0,
          existingGalleryJson
        })
        // Send new file uploads - these will be merged with existing
        if (galleryImages && galleryImages.length > 0) {
          galleryImages.forEach(file => {
            console.log('📤 Adding gallery file:', file.name, file.type)
            formDataToSend.append('gallery', file)
          })
        }
      } else {
        // When creating: only send new uploads as files
        if (galleryImages && galleryImages.length > 0) {
          console.log('📤 Creating venue - sending gallery files:', galleryImages.length)
          galleryImages.forEach(file => {
            console.log('📤 Adding gallery file:', file.name, file.type)
            formDataToSend.append('gallery', file)
          })
        }
      }
      
      // Videos - handle both new uploads and existing (when editing)
      // Backend now replaces videos instead of merging, so we send the complete list we want to keep
      if (editingVenue) {
        // When editing: send existing video URLs (minus removed ones) via body
        // Always send videos field when editing to allow updates/deletions
        const totalVideos = videoUrls.length + (videoFiles?.length || 0)
        
        if (totalVideos === 0) {
          // If all videos are removed, send a special marker to clear all videos
          // Backend will interpret empty array as "clear all"
          formDataToSend.append('clearVideos', 'true')
        } else {
          // Send existing video URLs
          if (videoUrls.length > 0) {
            videoUrls.forEach(url => {
              formDataToSend.append('videos', url)
            })
          }
          // Send new video file uploads
          if (videoFiles && videoFiles.length > 0) {
            videoFiles.forEach(file => formDataToSend.append('videos', file))
          }
        }
      } else {
        // When creating: only send new videos
        if (videoFiles && videoFiles.length > 0) {
          videoFiles.forEach(file => formDataToSend.append('videos', file))
        }
        if (videoUrls && videoUrls.length > 0) {
          videoUrls.forEach(url => {
            formDataToSend.append('videos', url)
          })
        }
      }
      
      if (editingVenue) {
        const venueId = editingVenue.id || editingVenue._id
        if (!venueId) {
          alert('Venue ID not found. Please try again.')
          setSubmitting(false)
          return
        }
        
        // Check authentication before updating
        const token = localStorage.getItem('vendor_token')
        
        if (!token) {
          alert('Please login to update venue')
          setSubmitting(false)
          return
        }
        
        try {
          await vendorAPI.updateVenue(venueId, formDataToSend)
          setFeedbackModal({
            title: 'Venue Updated',
            message: 'Venue updated successfully!',
            status: 'success'
          })
        } catch (updateError) {
          throw updateError // Re-throw to be caught by outer catch
        }
      } else {
        await vendorAPI.createVenue(formDataToSend)
        setFeedbackModal({
          title: 'Venue Added',
          message: 'Venue added successfully!',
          status: 'success'
        })
      }

      // Close modal and reset form immediately for better UX
      setShowAddModal(false)
      setEditingVenue(null)
      resetForm()
      
      // Navigate first if needed
      if (isAddPage) {
        navigate('/vendor/venues')
      }
      
      // Reload venues in background (non-blocking) so it doesn't slow down the submit
      loadVenues().catch(err => console.error('Failed to reload venues:', err))
    } catch (error) {
      console.error('Save venue error:', error)
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to save venue'
      const errorDetails = error.response?.data?.details
      
      // More detailed error message
      let fullErrorMessage = errorMessage
      let modalTitle = 'Unable to Add Venue'
      
      if (error.response?.status === 403) {
        // Check if it's a rejection error
        if (errorMessage.includes('rejected') || errorMessage.includes('Rejected')) {
          modalTitle = 'Account Status'
          fullErrorMessage = 'Your vendor account has been rejected.\n\nYou cannot add venues. Please contact support for more information.'
        } else if (errorMessage.includes('pending admin approval') || errorMessage.includes('approval')) {
          modalTitle = 'Approval Required'
          fullErrorMessage = 'Your vendor account is pending admin approval.\n\nYou cannot add venues until your account is approved by the admin. Please wait for approval or contact support if you have any questions.'
        } else if (errorMessage.includes('permission') || errorMessage.includes('Permission')) {
          modalTitle = 'Access Denied'
          fullErrorMessage = `${errorMessage}\n\nYou do not have the required permissions to perform this action. Please contact your administrator.`
        } else {
          modalTitle = 'Access Denied'
          fullErrorMessage = errorMessage
          if (errorDetails) {
            fullErrorMessage += `\n\nDetails: ${JSON.stringify(errorDetails, null, 2)}`
          }
        }
      } else if (error.response?.status === 401) {
        modalTitle = 'Session Expired'
        fullErrorMessage = 'Your session has expired. Please login again.'
        localStorage.removeItem('vendor_token')
        localStorage.removeItem('vendor_user')
        window.location.href = '/vendor/login'
        return
      } else {
        modalTitle = 'Unable to Save'
      }
      
      // Use feedback modal instead of alert for better UX
      setFeedbackModal({
        title: modalTitle,
        message: fullErrorMessage,
        status: 'error'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleStatus = async (venue, skipConfirm = false) => {
    const venueId = venue.id || venue._id
    const isVendorActive = venue.vendorActive !== false // default true if missing
    const action = isVendorActive ? 'deactivate' : 'activate'
    
    if (!skipConfirm) {
      setConfirmAction({
        type: 'toggle',
        venue,
        action,
        name: venue.name
      })
      return
    }

    setActionLoading(true)
    // Close confirmation modal first
    setConfirmAction(null)
    
    try {
      const response = await vendorAPI.toggleVenueStatus(venueId)
      loadVenues()
      const message = response.data?.message || `Venue ${action}d successfully!`
      setFeedbackModal({
        title: 'Success',
        message: message,
        status: 'success'
      })
    } catch (error) {
      let errorMsg = error.response?.data?.error || error.response?.data?.message || `Failed to ${action} venue`
      let modalTitle = 'Unable to Update Venue'
      
      if (error.response?.status === 403) {
        if (errorMsg.includes('rejected') || errorMsg.includes('Rejected')) {
          modalTitle = 'Account Status'
          errorMsg = 'Your vendor account has been rejected.\n\nYou cannot perform this action. Please contact support for more information.'
        } else if (errorMsg.includes('pending admin approval') || errorMsg.includes('approval')) {
          modalTitle = 'Approval Required'
          errorMsg = 'Your vendor account is pending admin approval.\n\nYou cannot perform this action until your account is approved by the admin.'
        } else if (errorMsg.includes('permission') || errorMsg.includes('Permission')) {
          modalTitle = 'Access Denied'
          errorMsg = `${errorMsg}\n\nYou do not have the required permissions. Please contact your administrator.`
        } else {
          modalTitle = 'Access Denied'
        }
      }
      
      setFeedbackModal({
        title: modalTitle,
        message: errorMsg,
        status: 'error'
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async (venueId, venueName, skipConfirm = false) => {
    if (!skipConfirm) {
      setConfirmAction({
        type: 'delete',
        id: venueId,
        name: venueName
      })
      return
    }

    setActionLoading(true)
    // Close confirmation modal first
    setConfirmAction(null)
    
    try {
      await vendorAPI.deleteVenue(venueId)
      loadVenues()
      setFeedbackModal({
        title: 'Success',
        message: 'Venue deleted successfully!',
        status: 'success'
      })
    } catch (error) {
      let errorMsg = error.response?.data?.error || 'Failed to delete venue'
      let modalTitle = 'Unable to Delete Venue'
      
      // Better error messages for vendor_staff
      if (error.response?.status === 403) {
        if (errorMsg.includes('rejected') || errorMsg.includes('Rejected')) {
          modalTitle = 'Account Status'
          errorMsg = 'Your vendor account has been rejected.\n\nYou cannot perform this action. Please contact support for more information.'
        } else if (errorMsg.includes('pending admin approval') || errorMsg.includes('approval')) {
          modalTitle = 'Approval Required'
          errorMsg = 'Your vendor account is pending admin approval.\n\nYou cannot add venues until your account is approved by the admin. Please wait for approval or contact support if you have any questions.'
        } else if (errorMsg.includes('permission') || errorMsg.includes('Permission')) {
          modalTitle = 'Access Denied'
          errorMsg = `${errorMsg}\n\nYou do not have the required permissions. Please contact your administrator.`
        } else {
          modalTitle = 'Access Denied'
          errorMsg = errorMsg
        }
      }
      
      setFeedbackModal({
        title: modalTitle,
        message: errorMsg,
        status: 'error'
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleEdit = async (venue) => {
    try {
      // Fetch full venue details to ensure we have all data
      const venueId = venue.id || venue._id
      let fullVenueData = venue
      
      // Try to fetch full venue details if we have an ID
      if (venueId) {
        try {
          const response = await vendorAPI.getVenueById(venueId)
          if (response.data) {
            if (response.data.success && response.data.data) {
              fullVenueData = response.data.data
            } else if (response.data.venue) {
              fullVenueData = response.data.venue
            } else if (response.data) {
              fullVenueData = response.data
            }
          }
        } catch (error) {
          console.warn('Could not fetch full venue details, using provided data:', error)
          // Continue with provided venue data
        }
      }
      
      setEditingVenue(fullVenueData)
      // Wait for menus to load before setting formData to ensure menuId matches
      const loadedMenus = await loadMenus() // Reload menus when editing and get the data
      
      // Format capacity for editing (convert object to string if needed)
      const capacityValue = typeof fullVenueData.capacity === 'object'
        ? (fullVenueData.capacity.maxGuests?.toString() || fullVenueData.capacity.minGuests?.toString() || '')
        : (fullVenueData.capacity?.toString() || '')
      
      // Extract location fields if location is an object
      const locationObj = typeof fullVenueData.location === 'object' ? fullVenueData.location : {}
      
      // Extract categoryId - handle both ObjectId and populated object
      let categoryIdValue = ''
      if (fullVenueData.categoryId) {
        if (typeof fullVenueData.categoryId === 'object' && fullVenueData.categoryId._id) {
          categoryIdValue = fullVenueData.categoryId._id.toString()
        } else if (typeof fullVenueData.categoryId === 'string') {
          categoryIdValue = fullVenueData.categoryId
        } else {
          categoryIdValue = fullVenueData.categoryId.toString()
        }
      }

      // Extract menuId - handle both ObjectId and populated object (same as categoryId)
      let menuIdValue = ''
      if (fullVenueData.menuId) {
        if (typeof fullVenueData.menuId === 'object' && fullVenueData.menuId._id) {
          menuIdValue = String(fullVenueData.menuId._id)
        } else if (typeof fullVenueData.menuId === 'string') {
          menuIdValue = fullVenueData.menuId
        } else {
          menuIdValue = String(fullVenueData.menuId)
        }
        console.log('📥 Extracted menuId for editing:', menuIdValue)
        console.log('📥 Available menus:', loadedMenus.map(m => ({ id: String(m._id || m.id), name: m.name })))
      }

      // Extract subMenuId - handle both ObjectId and populated object (same as categoryId and menuId)
      let subMenuIdValue = ''
      if (fullVenueData.subMenuId) {
        if (typeof fullVenueData.subMenuId === 'object' && fullVenueData.subMenuId._id) {
          subMenuIdValue = String(fullVenueData.subMenuId._id)
        } else if (typeof fullVenueData.subMenuId === 'string') {
          subMenuIdValue = fullVenueData.subMenuId
        } else {
          subMenuIdValue = String(fullVenueData.subMenuId)
        }
        console.log('📥 Extracted subMenuId for editing:', subMenuIdValue)
      }
      
      // Ensure highlights is always an array
      let highlightsArray = []
      if (fullVenueData.highlights) {
        if (Array.isArray(fullVenueData.highlights)) {
          highlightsArray = fullVenueData.highlights
        } else if (typeof fullVenueData.highlights === 'string') {
          highlightsArray = [fullVenueData.highlights]
        }
      }
      
      // Ensure amenities is always an array
      let amenitiesArray = []
      if (fullVenueData.amenities) {
        if (Array.isArray(fullVenueData.amenities)) {
          amenitiesArray = fullVenueData.amenities
        } else {
          amenitiesArray = [fullVenueData.amenities]
        }
      }
      
      // Ensure openDays is always an array
      let openDaysArray = []
      if (fullVenueData.availability?.openDays) {
        if (Array.isArray(fullVenueData.availability.openDays)) {
          openDaysArray = fullVenueData.availability.openDays
        } else {
          openDaysArray = [fullVenueData.availability.openDays]
        }
      }
      
      // Get description - check multiple possible fields
      const description = fullVenueData.description || fullVenueData.about || ''
      
      setFormData({
        name: fullVenueData.name || '',
        address: locationObj.address || '',
        city: locationObj.city || '',
        state: locationObj.state || '',
        price: fullVenueData.price?.toString() || '',
        capacity: capacityValue,
        description: description,
        categoryId: categoryIdValue,
        menuId: menuIdValue,
        subMenuId: subMenuIdValue,
        amenities: amenitiesArray,
        highlights: highlightsArray,
        rooms: fullVenueData.rooms?.toString() || '',
        // Convert 24-hour time to 12-hour format for display
        openTime: fullVenueData.availability?.openTime ? convertTo12Hour(fullVenueData.availability.openTime) : '',
        closeTime: fullVenueData.availability?.closeTime ? convertTo12Hour(fullVenueData.availability.closeTime) : '',
        openDays: openDaysArray,
      })

      // Submenus will be loaded automatically by useEffect when menuId is set
      // But we also need to normalize subMenuId after submenus are loaded
      // So we'll do it in a separate effect after submenus load
      
      // Set existing image preview if available - check all possible image fields
      const mainImage = fullVenueData.image || fullVenueData.coverImage || 
                       (fullVenueData.images && Array.isArray(fullVenueData.images) && fullVenueData.images[0]) ||
                       (fullVenueData.gallery && typeof fullVenueData.gallery === 'object' && fullVenueData.gallery.photos && Array.isArray(fullVenueData.gallery.photos) && fullVenueData.gallery.photos[0]) ||
                       (fullVenueData.galleryInfo?.photos && Array.isArray(fullVenueData.galleryInfo.photos) && fullVenueData.galleryInfo.photos[0])
      
      if (mainImage) {
        setExistingImageUrl(mainImage)
        setSelectedImage(null) // Clear new image selection
      } else {
        setExistingImageUrl(null)
        setSelectedImage(null)
      }
      
      // Set existing gallery images - check multiple possible sources
      let galleryImagesList = []
      
      // Check gallery.photos (formatted response structure)
      if (fullVenueData.gallery && typeof fullVenueData.gallery === 'object' && fullVenueData.gallery.photos && Array.isArray(fullVenueData.gallery.photos) && fullVenueData.gallery.photos.length > 0) {
        galleryImagesList = fullVenueData.gallery.photos
      }
      // Check if gallery is an array (legacy format)
      else if (fullVenueData.gallery && Array.isArray(fullVenueData.gallery) && fullVenueData.gallery.length > 0) {
        galleryImagesList = fullVenueData.gallery
      }
      // Check galleryInfo.photos (alternative structure)
      else if (fullVenueData.galleryInfo?.photos && Array.isArray(fullVenueData.galleryInfo.photos) && fullVenueData.galleryInfo.photos.length > 0) {
        galleryImagesList = fullVenueData.galleryInfo.photos
      }
      // Check images array (skip first one if it's the main image)
      else if (fullVenueData.images && Array.isArray(fullVenueData.images) && fullVenueData.images.length > 0) {
        // Use images array, but skip first one if it's the main image
        galleryImagesList = fullVenueData.images.slice(1)
      }
      
      console.log('🖼️ Loading gallery images:', {
        gallery: fullVenueData.gallery,
        galleryInfo: fullVenueData.galleryInfo,
        images: fullVenueData.images,
        galleryImagesList
      })
      
      if (galleryImagesList.length > 0) {
        setExistingGalleryUrls(galleryImagesList)
        setGalleryImages([]) // Clear new gallery uploads
      } else {
        setExistingGalleryUrls([])
        setGalleryImages([])
      }
      
      // Set existing videos - check multiple possible sources
      let existingVideosList = []
      
      // Check videos in multiple locations for compatibility
      if (fullVenueData.videos && Array.isArray(fullVenueData.videos) && fullVenueData.videos.length > 0) {
        existingVideosList = fullVenueData.videos
      } else if (fullVenueData.galleryInfo?.videos && Array.isArray(fullVenueData.galleryInfo.videos) && fullVenueData.galleryInfo.videos.length > 0) {
        existingVideosList = fullVenueData.galleryInfo.videos
      } else if (fullVenueData.gallery?.videos && Array.isArray(fullVenueData.gallery.videos) && fullVenueData.gallery.videos.length > 0) {
        existingVideosList = fullVenueData.gallery.videos
      }
      
      if (existingVideosList.length > 0) {
        // Filter valid video URLs/paths
        const validVideos = existingVideosList.filter(v => {
          if (!v || typeof v !== 'string') return false
          return v.startsWith('http') || v.startsWith('https') || v.startsWith('/uploads')
        })
        setVideoUrls(validVideos)
        setVideoFiles([]) // Existing videos are URLs, not files
      } else {
        setVideoUrls([])
        setVideoFiles([])
      }
      
      // Load cities if state is already set
      if (locationObj.state && locationObj.state.trim()) {
        await loadCities(locationObj.state)
      }
      
      setShowAddModal(true)
      setCurrentStep(0)
    } catch (error) {
      console.error('Error loading venue for editing:', error)
      alert('Failed to load venue data. Please try again.')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      city: '',
      state: '',
      price: '',
      capacity: '',
      description: '',
    categoryId: '',
    menuId: '',
    subMenuId: '',
    amenities: [],
    highlights: [],
    rooms: '',
      openTime: '',
      closeTime: '',
      openDays: [],
    })
    setSelectedImage(null)
    setExistingImageUrl(null)
    setGalleryImages([])
    setExistingGalleryUrls([])
    setVideoFiles([])
    setVideoUrls([])
    setPlayingVideo(null)
    setCurrentStep(0)
    setEditingVenue(null)
    setSubmenus([])
  }

  // Helper function to format location (handles both string and object)
  const formatLocation = (location) => {
    if (!location) return 'N/A'
    if (typeof location === 'string') return location
    if (typeof location === 'object') {
      const parts = []
      if (location.address) parts.push(location.address)
      if (location.city) parts.push(location.city)
      if (location.state) parts.push(location.state)
      if (location.pincode) parts.push(location.pincode)
      return parts.length > 0 ? parts.join(', ') : 'N/A'
    }
    return 'N/A'
  }

  // Helper function to format capacity (handles both number and object)
  const formatCapacity = (capacity) => {
    if (!capacity) return 'N/A'
    if (typeof capacity === 'number') return capacity.toString()
    if (typeof capacity === 'object') {
      if (capacity.minGuests && capacity.maxGuests) {
        return `${capacity.minGuests} - ${capacity.maxGuests}`
      }
      if (capacity.minGuests) return capacity.minGuests.toString()
      if (capacity.maxGuests) return capacity.maxGuests.toString()
      return 'N/A'
    }
    return capacity.toString()
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      approved: { icon: CheckCircle, color: 'green', text: 'Approved (Inactive)' },
      active: { icon: Power, color: 'green', text: 'Active' },
      pending: { icon: Clock, color: 'orange', text: 'Pending' },
      rejected: { icon: XCircle, color: 'red', text: 'Rejected' },
    }
    const config = statusConfig[status] || { icon: Clock, color: 'gray', text: status }
    const Icon = config.icon
    return (
      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-${config.color}-100 text-${config.color}-700`}>
        <Icon className="w-3 h-3" />
        <span>{config.text}</span>
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {!isAddPage && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Venues</h1>
              <p className="text-gray-600 mt-1">Manage your wedding venues</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={loadVenues}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
              {hasVendorPermission('vendor_create_venues') && (
                <button
                  onClick={() => navigate('/vendor/venues/add')}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Venue</span>
                </button>
              )}
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Venues</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved (Inactive)</option>
              <option value="active">Active</option>
              <option value="rejected">Rejected</option>
            </select>
            {statusFilter !== 'all' && (
              <span className="text-sm text-gray-600">
                Showing {venues.filter(v => v.status === statusFilter).length} {statusFilter === 'approved' ? 'approved (inactive)' : statusFilter} venue(s)
              </span>
            )}
          </div>

          {/* Venues List */}
          {venues.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-50 rounded-full mb-4">
                <MapPin className="w-10 h-10 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Venues Yet</h3>
              <p className="text-gray-600 mb-6">Start by adding your first venue to showcase it to customers</p>
              <button
                onClick={() => navigate('/vendor/venues/add')}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
              >
                Add Your First Venue
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.isArray(venues) && venues
                  .filter(venue => statusFilter === 'all' || venue.status === statusFilter)
                  .map((venue) => (
                <div key={venue.id || venue._id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition">
                  <div className="relative h-48 bg-gray-200">
                    {venue.images && venue.images[0] ? (
                      <img
                        src={getImageUrl(venue.images[0])}
                        alt={venue.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      {getStatusBadge(venue.status)}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{venue.name}</h3>
                    <div className="flex items-center text-gray-600 mb-4">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span className="text-sm">{formatLocation(venue.location)}</span>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center text-gray-600">
                        <Users className="w-4 h-4 mr-1" />
                        <span className="text-sm">{formatCapacity(venue.capacity)} guests</span>
                      </div>
                      <div className="flex items-center text-primary-600 font-semibold">
                        <span>₹{((venue.price || venue.pricingInfo?.rentalPrice || 0) > 0) ? (venue.price || venue.pricingInfo?.rentalPrice || 0).toLocaleString() : 'N/A'}</span>
                      </div>
                    </div>
                    {venue.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{venue.description}</p>
                    )}
                    
                    {/* Active/Inactive Toggle (vendor visibility) */}
                    {(venue.status === 'approved' || venue.status === 'active') && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {venue.vendorActive !== false ? (
                              <Power className="w-4 h-4 text-green-600" />
                            ) : (
                              <PowerOff className="w-4 h-4 text-gray-400" />
                            )}
                            <span className="text-sm font-medium text-gray-700">
                              {venue.vendorActive !== false ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <button
                            onClick={() => handleToggleStatus(venue)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              venue.vendorActive !== false
                                ? 'bg-green-500'
                                : 'bg-gray-300'
                            }`}
                            title={venue.vendorActive !== false ? 'Deactivate venue' : 'Activate venue'}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                venue.vendorActive !== false ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Rating and Reviews */}
                    {(() => {
                      const venueId = (venue.id || venue._id)?.toString()
                      const ratingData = venueRatings[venueId]
                      const rating = venue.ratingInfo?.average || venue.ratingAverage || (ratingData?.average || 0)
                      const reviewCount = venue.ratingInfo?.totalReviews || venue.totalReviews || (ratingData?.count || 0)
                      
                      if (rating > 0 || reviewCount > 0) {
                        return (
                          <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <div className="flex items-center space-x-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < Math.round(Number(rating))
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm font-semibold text-gray-900">{Number(rating).toFixed(1)}</span>
                              <span className="text-sm text-gray-600">({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})</span>
                            </div>
                            <button
                              onClick={() => handleViewReviews(venue)}
                              className="flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
                            >
                              <MessageSquare className="w-4 h-4" />
                              <span>View Reviews</span>
                            </button>
                          </div>
                        )
                      }
                      return null
                    })()}
                    
                    <div className="flex items-center space-x-2">
                      {hasVendorPermission('vendor_edit_venues') && (
                        <button
                          onClick={() => handleEdit(venue)}
                          className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition"
                        >
                          <Edit className="w-4 h-4" />
                          <span>Edit</span>
                        </button>
                      )}
                      {hasVendorPermission('vendor_delete_venues') && (
                        <button
                          onClick={() => handleDelete(venue.id || venue._id, venue.name)}
                          className="flex items-center justify-center px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                ))}
              </div>
              {pagination.pages > 1 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.pages}
                    totalItems={pagination.total}
                    itemsPerPage={pagination.limit}
                    onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
                  />
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Add/Edit Modal or Page */}
      {(showAddModal || isAddPage) && (
        <div className={isAddPage ? 'max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8' : 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'}>
          <div className={isAddPage ? 'bg-white rounded-2xl shadow-sm border border-gray-200 w-full my-6' : 'bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto'}>
            <div className={`sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between ${isAddPage ? 'relative' : ''}`}>
              <h2 className="text-2xl font-bold text-gray-900">
                {editingVenue ? 'Edit Venue' : 'Add New Venue'} ({currentStep + 1}/4)
              </h2>
              <button
                onClick={() => {
                  if (isAddPage) {
                    navigate('/vendor/venues')
                  } else {
                    setShowAddModal(false)
                  }
                  resetForm()
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Step Indicator */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex space-x-2">
                {[0, 1, 2, 3].map((step) => (
                  <div
                    key={step}
                    className={`flex-1 h-2 rounded ${
                      step <= currentStep ? 'bg-primary-600' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {currentStep === 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                  
                  {/* Vendor Category Dropdown - Always show */}
                  {!editingVenue && vendorCategories.length > 0 && (
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Venue Category <span className="text-xs text-gray-500">(Form fields will change based on selection)</span>
                      </label>
                      <select
                        value={selectedVendorCategoryId}
                        onChange={(e) => {
                          setSelectedVendorCategoryId(e.target.value)
                          // Reset form data when category changes
                          setFormData(prev => ({
                            ...prev,
                            name: '',
                            address: '',
                            city: '',
                            state: '',
                            price: '',
                            capacity: '',
                            description: '',
                            amenities: [],
                            highlights: [],
                            rooms: '',
                            openTime: '',
                            closeTime: '',
                            openDays: []
                          }))
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                      >
                        <option value="">Select Category (Default: Your Category)</option>
                        {vendorCategories.map((category) => (
                          <option key={category._id} value={category._id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                      {selectedVendorCategoryId && (
                        <p className="text-xs text-gray-600 mt-2">
                          Form fields are now configured based on: <strong>{vendorCategories.find(c => c._id === selectedVendorCategoryId)?.name}</strong>
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Venue Name - Show if enabled in formConfig or if no formConfig */}
                  {(formConfig === null || formConfig.name !== false) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Venue Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  )}
                  
                  {/* Location Fields - Show if enabled in formConfig or if no formConfig */}
                  {(formConfig === null || formConfig.location?.enabled !== false) && (
                    <div className="mt-4">
                      <h4 className="text-md font-semibold mb-4">Location *</h4>
                      {(formConfig === null || formConfig.location?.address !== false) && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                          <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            placeholder="Street address, building name"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        {(formConfig === null || formConfig.location?.state !== false) && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
                            <select
                              name="state"
                              value={formData.state}
                              onChange={handleInputChange}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                              <option value="">Select State</option>
                              {states.map((state) => (
                                <option key={state} value={state}>
                                  {state}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                        {(formConfig === null || formConfig.location?.city !== false) && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                            <select
                              name="city"
                              value={formData.city}
                              onChange={handleInputChange}
                              disabled={!formData.state || loadingCities}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                              <option value="">
                                {!formData.state 
                                  ? 'Select State First' 
                                  : loadingCities 
                                  ? 'Loading Cities...' 
                                  : 'Select City'}
                              </option>
                              {cities.map((city) => (
                                <option key={city} value={city}>
                                  {city}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Price (₹) *</label>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    {(formConfig === null || formConfig.numberOfGuests !== false) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Capacity (Number of Guests) *</label>
                        <input
                          type="number"
                          name="capacity"
                          value={formData.capacity}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold mb-4">Images & Videos</h3>
                  
                  {/* Gallery Images - Show if enabled in formConfig or if no formConfig */}
                  {(formConfig === null || formConfig.galleryImages !== false) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Gallery Images</label>
                    {editingVenue && existingGalleryUrls.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-2">Current Gallery Images (click X to remove):</p>
                        <div className="grid grid-cols-4 gap-2">
                          {existingGalleryUrls.map((img, idx) => (
                            <div key={idx} className="relative group">
                              <img
                                src={getImageUrl(img)}
                                alt={`Gallery ${idx + 1}`}
                                className="w-full h-24 object-cover rounded-lg border border-gray-300"
                                onError={(e) => {
                                  e.target.style.display = 'none'
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => removeExistingGalleryImage(idx)}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Remove image"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Upload new images to add to gallery</p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleGallerySelect}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                    {galleryImages.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-2">New Gallery Images:</p>
                        <div className="grid grid-cols-4 gap-2">
                          {galleryImages.map((img, idx) => (
                            <div key={idx} className="relative">
                              <img
                                src={URL.createObjectURL(img)}
                                alt={`Gallery ${idx + 1}`}
                                className="w-full h-24 object-cover rounded-lg border border-gray-300"
                              />
                              <button
                                type="button"
                                onClick={() => setGalleryImages(galleryImages.filter((_, i) => i !== idx))}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  )}
                  
                  {/* Videos - Show if enabled in formConfig or if no formConfig */}
                  {(formConfig === null || formConfig.videos !== false) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Videos</label>
                      <p className="text-xs text-gray-500 mb-2">Upload video files or add video URLs (max 5 videos, 100MB per file)</p>
                      
                      {/* Existing Videos Display */}
                      {editingVenue && videoUrls.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-2">Current Videos (click X to remove):</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {videoUrls.map((video, idx) => {
                            const videoUrl = getImageUrl(video)
                            
                            return (
                              <div key={idx} className="relative group bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                                {/* Video Preview */}
                                <div className="relative aspect-video bg-gray-900">
                                  {/* Video Thumbnail/Preview */}
                                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                                    <Video className="w-16 h-16 text-gray-400" />
                                  </div>
                                  {/* Play Button Overlay */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      console.log('Opening video modal:', videoUrl)
                                      setPlayingVideo({ url: videoUrl, index: idx, title: `Video ${idx + 1}` })
                                    }}
                                    className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 hover:bg-opacity-50 transition-opacity group cursor-pointer"
                                    title="Play video"
                                  >
                                    <div className="bg-white bg-opacity-90 rounded-full p-4 group-hover:bg-opacity-100 transition transform group-hover:scale-110">
                                      <Play className="w-8 h-8 text-primary-600 fill-primary-600" />
                                    </div>
                                  </button>
                                </div>
                                
                                {/* Video Info and Remove Button */}
                                <div className="p-2 flex items-center justify-between">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-gray-600 truncate" title={videoUrl}>
                                      {videoUrl.length > 40 ? `${videoUrl.substring(0, 40)}...` : videoUrl}
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeExistingVideo(idx)}
                                    className="ml-2 text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition"
                                    title="Remove video"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Click play button to preview video. Upload new videos or add URLs to add more</p>
                      </div>
                    )}
                    
                    {/* Video File Upload */}
                    <div className="mb-3">
                      <label className="block text-xs text-gray-600 mb-1">Upload Video Files:</label>
                      <input
                        type="file"
                        accept="video/*"
                        multiple
                        onChange={handleVideoFileSelect}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      {videoFiles.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500 mb-2">Selected Video Files:</p>
                          <div className="space-y-1">
                            {videoFiles.map((file, idx) => (
                              <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                <span className="text-sm text-gray-700 truncate flex-1">{file.name}</span>
                                <button
                                  type="button"
                                  onClick={() => removeVideoFile(idx)}
                                  className="ml-2 text-red-500 hover:text-red-700"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Video URL Input */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Or Add Video URL:</label>
                      <div className="flex space-x-2">
                        <input
                          id="videoUrlInput"
                          type="url"
                          placeholder="https://example.com/video.mp4"
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleVideoUrlAdd()
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleVideoUrlAdd}
                          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm"
                        >
                          Add
                        </button>
                      </div>
                      {videoUrls.length > 0 && !editingVenue && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500 mb-2">Video URLs (click play to preview):</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {videoUrls.map((url, idx) => {
                              const videoUrl = getImageUrl(url)
                              const isPlaying = playingVideo === `new-${idx}`
                              
                              return (
                                <div key={idx} className="relative group bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                                  {/* Video Preview/Player */}
                                  <div className="relative aspect-video bg-gray-900">
                                    {isPlaying ? (
                                      <video
                                        key={`new-video-${idx}`}
                                        controls
                                        autoPlay
                                        playsInline
                                        className="w-full h-full object-contain"
                                        onEnded={() => setPlayingVideo(null)}
                                        onError={(e) => {
                                          console.error('Video playback error:', e, videoUrl)
                                          alert(`Video could not be loaded.\nURL: ${videoUrl}\n\nPlease check:\n1. Video URL is accessible\n2. Video format is supported (MP4, WebM, etc.)\n3. CORS is enabled on server`)
                                          setPlayingVideo(null)
                                        }}
                                        onLoadedData={(e) => {
                                          // Video loaded successfully, try to play
                                          console.log('Video loaded:', videoUrl)
                                          const videoElement = e.target
                                          videoElement.play().catch(err => {
                                            console.error('Auto-play failed:', err)
                                            // User interaction required, that's okay
                                          })
                                        }}
                                        onCanPlay={() => {
                                          console.log('Video can play:', videoUrl)
                                        }}
                                        preload="auto"
                                        crossOrigin="anonymous"
                                      >
                                        <source src={videoUrl} type="video/mp4" />
                                        Your browser does not support the video tag.
                                      </video>
                                    ) : (
                                      <>
                                        {/* Video Thumbnail/Preview */}
                                        <div className="w-full h-full flex items-center justify-center">
                                          <Video className="w-12 h-12 text-gray-400" />
                                        </div>
                                        {/* Play Button Overlay */}
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            console.log('Playing video:', videoUrl)
                                            setPlayingVideo(`new-${idx}`)
                                          }}
                                          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 hover:bg-opacity-50 transition-opacity group cursor-pointer"
                                          title="Play video"
                                        >
                                          <div className="bg-white bg-opacity-90 rounded-full p-3 group-hover:bg-opacity-100 transition">
                                            <Play className="w-6 h-6 text-primary-600 fill-primary-600" />
                                          </div>
                                        </button>
                                      </>
                                    )}
                                  </div>
                                  
                                  {/* Video Info and Remove Button */}
                                  <div className="p-2 flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs text-gray-600 truncate" title={videoUrl}>
                                        {videoUrl.length > 40 ? `${videoUrl.substring(0, 40)}...` : videoUrl}
                                      </p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (isPlaying) setPlayingVideo(null)
                                        removeVideoUrl(idx)
                                      }}
                                      className="ml-2 text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition"
                                      title="Remove video"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  )}
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold mb-4">Category & Amenities</h3>
                  
                  {/* Category - Show if enabled in formConfig or if no formConfig */}
                  {(formConfig === null || formConfig.category !== false) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <select
                        name="categoryId"
                        value={formData.categoryId}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="">No Category</option>
                        {categories.map((cat) => (
                          <option key={cat.id || cat._id} value={cat.id || cat._id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Menu - Show if enabled in formConfig or if no formConfig */}
                  {(formConfig === null || formConfig.menu !== false) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Menu</label>
                      <select
                        name="menuId"
                        value={String(formData.menuId || '')}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="">No Menu</option>
                        {menus.map((menu) => {
                          const menuId = String(menu._id || menu.id || '')
                          return (
                            <option key={menuId} value={menuId}>
                              {menu.name}
                            </option>
                          )
                        })}
                      </select>
                      {menus.length === 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          {loading ? 'Loading menus...' : 'No menus available. Please contact admin.'}
                        </p>
                      )}
                      {/* Debug info - remove in production */}
                      {process.env.NODE_ENV === 'development' && (
                        <p className="text-xs text-gray-400 mt-1">
                          Debug: {menus.length} menus loaded
                        </p>
                      )}
                    </div>
                  )}

                  {/* Submenu - Show if enabled in formConfig or if no formConfig */}
                  {(formConfig === null || formConfig.submenu !== false) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Submenu</label>
                      <select
                        name="subMenuId"
                        value={String(formData.subMenuId || '')}
                        onChange={handleInputChange}
                        disabled={!formData.menuId}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="">
                          {!formData.menuId 
                            ? 'Select Menu First' 
                            : submenus.length === 0
                            ? 'No Submenus Available'
                            : 'Select Submenu'}
                        </option>
                        {submenus.map((submenu) => {
                          const submenuId = String(submenu._id || submenu.id || '')
                          return (
                            <option key={submenuId} value={submenuId}>
                              {submenu.name}
                            </option>
                          )
                        })}
                      </select>
                    </div>
                  )}

                  {/* Amenities - Show if enabled in formConfig or if no formConfig */}
                  {(formConfig === null || formConfig.amenities !== false) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
                    <div className="flex flex-wrap gap-2">
                      {availableAmenities.map((amenity) => (
                        <button
                          key={amenity}
                          type="button"
                          onClick={() => handleAmenityToggle(amenity)}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                            formData.amenities.includes(amenity)
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {amenity}
                        </button>
                      ))}
                    </div>
                  </div>
                  )}
                  
                  {/* Highlights - Show if enabled in formConfig or if no formConfig */}
                  {(formConfig === null || formConfig.highlights !== false) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Highlights</label>
                      <div className="space-y-2">
                        {(formData.highlights || []).map((highlight, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={highlight}
                              onChange={(e) => {
                                const currentHighlights = formData.highlights || []
                                const newHighlights = [...currentHighlights]
                                newHighlights[index] = e.target.value
                                setFormData({ ...formData, highlights: newHighlights })
                              }}
                              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              placeholder="Enter highlight"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const currentHighlights = formData.highlights || []
                                const newHighlights = currentHighlights.filter((_, i) => i !== index)
                                setFormData({ ...formData, highlights: newHighlights })
                              }}
                              className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, highlights: [...(formData.highlights || []), ''] })}
                          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                        >
                          + Add Highlight
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Number of Rooms - Show if enabled in formConfig or if no formConfig */}
                  {(formConfig === null || formConfig.numberOfRooms !== false) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Number of Rooms</label>
                      <input
                        type="number"
                        name="rooms"
                        value={formData.rooms}
                        onChange={handleInputChange}
                        min="0"
                      placeholder="Enter number of rooms"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  )}
                  
                  {/* Availability Section - Show if timing or openDays enabled */}
                  {((formConfig === null || formConfig.timing?.enabled !== false) || 
                    (formConfig === null || formConfig.openDays?.enabled !== false)) && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h4 className="text-md font-semibold mb-4">Availability & Timing</h4>
                    {/* Timing Fields - Show if enabled in formConfig or if no formConfig */}
                    {(formConfig === null || formConfig.timing?.enabled !== false) && (
                      <div className="grid grid-cols-2 gap-4">
                        {(formConfig === null || formConfig.timing?.openTime !== false) && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Opening Time</label>
                        <div className="flex items-center gap-2">
                          <select
                            name="openTimeHour"
                            value={(() => {
                              if (!formData.openTime) return 9
                              const match = formData.openTime.match(/(\d{1,2}):/)
                              return match ? parseInt(match[1]) : 9
                            })()}
                            onChange={(e) => {
                              const hour = parseInt(e.target.value)
                              const currentTime = formData.openTime || '9:00 AM'
                              const match = currentTime.match(/:(\d{2})\s*(AM|PM)/i)
                              const minutes = match ? match[1] : '00'
                              const ampm = currentTime.includes('PM') || currentTime.includes('pm') ? 'PM' : 'AM'
                              setFormData(prev => ({
                                ...prev,
                                openTime: `${hour}:${minutes} ${ampm}`
                              }))
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          >
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(hour => (
                              <option key={hour} value={hour}>{hour}</option>
                            ))}
                          </select>
                          <span className="text-gray-600">:</span>
                          <select
                            name="openTimeMinute"
                            value={(() => {
                              if (!formData.openTime) return '00'
                              const match = formData.openTime.match(/:(\d{2})\s*(AM|PM)/i)
                              return match ? match[1] : '00'
                            })()}
                            onChange={(e) => {
                              const minutes = e.target.value
                              const currentTime = formData.openTime || '9:00 AM'
                              const match = currentTime.match(/(\d{1,2}):/)
                              const hour = match ? match[1] : '9'
                              const ampm = currentTime.includes('PM') || currentTime.includes('pm') ? 'PM' : 'AM'
                              setFormData(prev => ({
                                ...prev,
                                openTime: `${hour}:${minutes} ${ampm}`
                              }))
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          >
                            {Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')).map(minute => (
                              <option key={minute} value={minute}>{minute}</option>
                            ))}
                          </select>
                          <select
                            name="openTimeAmPm"
                            value={(() => {
                              if (!formData.openTime) return 'AM'
                              return formData.openTime.includes('PM') || formData.openTime.includes('pm') ? 'PM' : 'AM'
                            })()}
                            onChange={(e) => {
                              const ampm = e.target.value
                              const currentTime = formData.openTime || '9:00 AM'
                              const match = currentTime.match(/(\d{1,2}):(\d{2})/)
                              const hour = match ? match[1] : '9'
                              const minutes = match ? match[2] : '00'
                              setFormData(prev => ({
                                ...prev,
                                openTime: `${hour}:${minutes} ${ampm}`
                              }))
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          >
                            <option value="AM">AM</option>
                            <option value="PM">PM</option>
                          </select>
                        </div>
                      </div>
                      )}
                      {(formConfig === null || formConfig.timing?.closeTime !== false) && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Closing Time</label>
                        <div className="flex items-center gap-2">
                          <select
                            name="closeTimeHour"
                            value={(() => {
                              if (!formData.closeTime) return 6
                              const match = formData.closeTime.match(/(\d{1,2}):/)
                              return match ? parseInt(match[1]) : 6
                            })()}
                            onChange={(e) => {
                              const hour = parseInt(e.target.value)
                              const currentTime = formData.closeTime || '6:00 PM'
                              const match = currentTime.match(/:(\d{2})\s*(AM|PM)/i)
                              const minutes = match ? match[1] : '00'
                              const ampm = currentTime.includes('PM') || currentTime.includes('pm') ? 'PM' : 'AM'
                              setFormData(prev => ({
                                ...prev,
                                closeTime: `${hour}:${minutes} ${ampm}`
                              }))
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          >
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(hour => (
                              <option key={hour} value={hour}>{hour}</option>
                            ))}
                          </select>
                          <span className="text-gray-600">:</span>
                          <select
                            name="closeTimeMinute"
                            value={(() => {
                              if (!formData.closeTime) return '00'
                              const match = formData.closeTime.match(/:(\d{2})\s*(AM|PM)/i)
                              return match ? match[1] : '00'
                            })()}
                            onChange={(e) => {
                              const minutes = e.target.value
                              const currentTime = formData.closeTime || '6:00 PM'
                              const match = currentTime.match(/(\d{1,2}):/)
                              const hour = match ? match[1] : '6'
                              const ampm = currentTime.includes('PM') || currentTime.includes('pm') ? 'PM' : 'AM'
                              setFormData(prev => ({
                                ...prev,
                                closeTime: `${hour}:${minutes} ${ampm}`
                              }))
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          >
                            {Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')).map(minute => (
                              <option key={minute} value={minute}>{minute}</option>
                            ))}
                          </select>
                          <select
                            name="closeTimeAmPm"
                            value={(() => {
                              if (!formData.closeTime) return 'PM'
                              return formData.closeTime.includes('PM') || formData.closeTime.includes('pm') ? 'PM' : 'AM'
                            })()}
                            onChange={(e) => {
                              const ampm = e.target.value
                              const currentTime = formData.closeTime || '6:00 PM'
                              const match = currentTime.match(/(\d{1,2}):(\d{2})/)
                              const hour = match ? match[1] : '6'
                              const minutes = match ? match[2] : '00'
                              setFormData(prev => ({
                                ...prev,
                                closeTime: `${hour}:${minutes} ${ampm}`
                              }))
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          >
                            <option value="AM">AM</option>
                            <option value="PM">PM</option>
                          </select>
                        </div>
                      </div>
                      )}
                    </div>
                    )}
                    
                    {/* Open Days - Show if enabled in formConfig or if no formConfig */}
                    {(formConfig === null || formConfig.openDays?.enabled !== false) && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Open Days</label>
                        {(formConfig === null || formConfig.openDays?.allowAllDays !== false) && (
                          <div className="mb-3">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={formData.openDays.length === weekDays.length}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormData({ ...formData, openDays: [...weekDays] })
                                  } else {
                                    setFormData({ ...formData, openDays: [] })
                                  }
                                }}
                                className="w-4 h-4"
                              />
                              <span className="text-sm">All Days Open</span>
                            </label>
                          </div>
                        )}
                        {!(formConfig?.openDays?.allowAllDays === false && formData.openDays.length === weekDays.length) && (
                          <div className="flex flex-wrap gap-2">
                            {weekDays.map((day) => (
                              <button
                                key={day}
                                type="button"
                                onClick={() => handleDayToggle(day)}
                                className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                                  formData.openDays.includes(day)
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                {day}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    </div>
                  )}
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold mb-4">Review & Submit</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Venue Name:</span>
                      <span className="font-medium">{formData.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Location:</span>
                      <span className="font-medium">
                        {`${formData.address || ''}${formData.address && formData.city ? ', ' : ''}${formData.city || ''}${(formData.address || formData.city) && formData.state ? ', ' : ''}${formData.state || ''}`.trim() || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Price:</span>
                      <span className="font-medium">₹{formData.price}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Capacity:</span>
                      <span className="font-medium">{formData.capacity} guests</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Category:</span>
                      <span className="font-medium">
                        {formData.categoryId 
                          ? categories.find(c => (c.id || c._id) === formData.categoryId)?.name || 'N/A'
                          : 'No Category'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amenities:</span>
                      <span className="font-medium">{formData.amenities.length} selected</span>
                    </div>
                    {(formData.openTime || formData.closeTime) && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Timing:</span>
                        <span className="font-medium">
                          {formData.openTime || 'N/A'} - {formData.closeTime || 'N/A'}
                        </span>
                      </div>
                    )}
                    {formData.openDays.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Open Days:</span>
                        <span className="font-medium">{formData.openDays.join(', ')}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Status:</span>
                      <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                        <Clock className="w-3 h-3" />
                        <span>Pending (Awaiting Admin Approval)</span>
                      </span>
                    </div>
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-700">
                        <strong>Note:</strong> Your venue will be submitted for admin approval. It will be visible to customers once approved.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    if (currentStep > 0) setCurrentStep(currentStep - 1)
                    else {
                      if (isAddPage) navigate('/vendor/venues')
                      else setShowAddModal(false)
                      resetForm()
                    }
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  {currentStep === 0 ? 'Cancel' : 'Previous'}
                </button>
                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(currentStep + 1)}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : editingVenue ? 'Update Venue' : 'Submit'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reviews Modal */}
      {showReviewsModal && selectedVenueForReviews && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Reviews</h2>
                <p className="text-gray-600 mt-1">{selectedVenueForReviews.name}</p>
              </div>
              <button
                onClick={() => {
                  setShowReviewsModal(false)
                  setSelectedVenueForReviews(null)
                  setVenueReviews([])
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {loadingReviews ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
              ) : venueReviews.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-50 rounded-full mb-4">
                    <MessageSquare className="w-10 h-10 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Reviews Yet</h3>
                  <p className="text-gray-600">This venue hasn't received any reviews yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {venueReviews.map((review) => {
                    const user = review.userId
                    const userName = user?.name || user?.email || 'Anonymous'
                    const userEmail = user?.email || ''
                    const rating = review.rating || 0
                    const comment = review.comment || ''
                    const createdAt = review.createdAt ? new Date(review.createdAt) : new Date()

                    return (
                      <div key={review._id || review.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <div className="flex items-center space-x-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < rating
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm font-medium text-gray-900">{userName}</span>
                              {userEmail && <span className="text-sm text-gray-500">({userEmail})</span>}
                            </div>
                            <p className="text-xs text-gray-500">
                              {format(createdAt, 'MMM dd, yyyy')}
                            </p>
                          </div>
                        </div>
                        {comment && (
                          <p className="text-gray-700 mt-2">{comment}</p>
                        )}
                        
                        {/* Vendor Reply */}
                        {review.reply && (
                          <div className="mt-3 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-sm font-semibold text-blue-900">Vendor Reply</span>
                              {review.reply.repliedAt && (
                                <span className="text-xs text-blue-600">
                                  {format(new Date(review.reply.repliedAt), 'MMM dd, yyyy')}
                                </span>
                              )}
                            </div>
                            <p className="text-blue-800 text-sm">{review.reply.message}</p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {confirmAction.type === 'delete' ? 'Delete Venue' : confirmAction.action === 'deactivate' ? 'Deactivate Venue' : 'Activate Venue'}
              </h3>
              <p className="text-sm text-gray-600">
                {confirmAction.type === 'delete'
                  ? `Delete ${confirmAction.name || 'this venue'}? This action cannot be undone.`
                  : `Are you sure you want to ${confirmAction.action} ${confirmAction.name || 'this venue'}?`}
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  confirmAction.type === 'delete'
                    ? handleDelete(confirmAction.id, confirmAction.name, true)
                    : handleToggleStatus(confirmAction.venue, true)
                }
                className={`px-4 py-2 rounded-lg ${confirmAction.type === 'delete' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-primary-600 hover:bg-primary-700 text-white'} disabled:opacity-50`}
                disabled={actionLoading}
              >
                {actionLoading ? 'Please wait...' : confirmAction.type === 'delete' ? 'Delete' : confirmAction.action === 'deactivate' ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Player Modal - Similar to venue_book */}
      {playingVideo && playingVideo.url && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setPlayingVideo(null)}
        >
          <div 
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {playingVideo.title || 'Video Preview'}
              </h3>
              <button
                onClick={() => setPlayingVideo(null)}
                className="text-gray-400 hover:text-gray-600 transition"
                title="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="relative bg-black">
              <video
                key={playingVideo.url}
                className="w-full h-auto max-h-[70vh]"
                controls
                autoPlay
                playsInline
                onError={(e) => {
                  console.error('Video playback error:', e, playingVideo.url)
                  alert(`Video could not be loaded.\n\nURL: ${playingVideo.url}\n\nPossible reasons:\n1. Video file does not exist on server (404)\n2. Video format not supported\n3. CORS issue\n4. Network error\n\nPlease verify the video file exists and is accessible.`)
                }}
                onLoadedData={() => {
                  console.log('Video loaded successfully:', playingVideo.url)
                }}
                preload="auto"
              >
                <source src={playingVideo.url} type="video/mp4" />
                <source src={playingVideo.url} type="video/webm" />
                <source src={playingVideo.url} type="video/ogg" />
                Your browser does not support the video tag.
              </video>
            </div>
            <div className="p-4 bg-gray-50">
              <p className="text-xs text-gray-600 break-all">
                <strong>Video URL:</strong> {playingVideo.url}
              </p>
            </div>
          </div>
        </div>
      )}

      {feedbackModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className={`rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4 ${
            feedbackModal.status === 'error' 
              ? 'bg-red-50 border-2 border-red-200' 
              : feedbackModal.status === 'success'
              ? 'bg-green-50 border-2 border-green-200'
              : 'bg-white border-2 border-gray-200'
          }`}>
            <div className="space-y-2">
              <h3 className={`text-lg font-semibold ${
                feedbackModal.status === 'error' 
                  ? 'text-red-900' 
                  : feedbackModal.status === 'success'
                  ? 'text-green-900'
                  : 'text-gray-900'
              }`}>
                {feedbackModal.title || 'Notice'}
              </h3>
              <p className={`text-sm ${
                feedbackModal.status === 'error' 
                  ? 'text-red-700' 
                  : feedbackModal.status === 'success'
                  ? 'text-green-700'
                  : 'text-gray-700'
              }`}>
                {feedbackModal.message}
              </p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setFeedbackModal(null)}
                className={`px-4 py-2 rounded-lg text-white hover:opacity-90 transition ${
                  feedbackModal.status === 'error' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : feedbackModal.status === 'success'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-primary-600 hover:bg-primary-700'
                }`}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

