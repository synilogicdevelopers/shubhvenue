import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { vendorAPI, categoryAPI, reviewAPI, menuAPI, vendorCategoriesAPI, decorationCategoriesAPI, occasionSpecialsAPI } from '../../services/vendor/api'
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
  const [decorationCategories, setDecorationCategories] = useState([])
  const [occasionSpecials, setOccasionSpecials] = useState([])
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
  // When editing, also use formConfig if a category is selected (allows changing category when editing)
  // Use useMemo to recalculate when dependencies change
  const formConfig = useMemo(() => {
    // If vendor category is selected in dropdown, use that (works for both Add and Edit)
    if (selectedVendorCategoryId) {
      const selectedCategory = vendorCategories.find(cat => cat._id === selectedVendorCategoryId)
      console.log('Selected Category:', {
        id: selectedVendorCategoryId,
        name: selectedCategory?.name,
        hasFormConfig: !!selectedCategory?.formConfig,
        hasVenueConfig: !!selectedCategory?.formConfig?.venue,
        formConfig: selectedCategory?.formConfig,
        editing: !!editingVenue
      })
      if (selectedCategory?.formConfig?.venue) {
        return selectedCategory.formConfig.venue
      }
    }
    
    // When editing, use selected category's formConfig if available, otherwise use user's default
    // Don't return null - use user's formConfig as fallback so formConfig still applies
    const userFormConfig = user?.vendorCategory?.formConfig?.venue || null
    console.log('Using user vendor category formConfig:', {
      hasUserCategory: !!user?.vendorCategory,
      hasFormConfig: !!user?.vendorCategory?.formConfig,
      hasVenueConfig: !!userFormConfig
    })
    return userFormConfig
  }, [editingVenue, selectedVendorCategoryId, vendorCategories, user?.vendorCategory?.formConfig?.venue])
  
  // Helper functions to convert between 24-hour and 12-hour format
  const convert24To12 = (time24) => {
    if (!time24 || !time24.trim()) return { hour: '', minute: '', period: '' }
    const match = time24.match(/^(\d{1,2}):(\d{2})$/)
    if (!match) return { hour: '', minute: '', period: '' }
    
    let hour24 = parseInt(match[1], 10)
    const minute = match[2]
    let period = 'AM'
    
    if (hour24 === 0) {
      hour24 = 12
    } else if (hour24 === 12) {
      period = 'PM'
    } else if (hour24 > 12) {
      hour24 = hour24 - 12
      period = 'PM'
    }
    
    return { hour: hour24.toString(), minute, period }
  }
  
  const convert12To24 = (hour, minute, period) => {
    if (!hour || !minute || !period) return ''
    
    let hour24 = parseInt(hour, 10)
    if (period === 'PM' && hour24 !== 12) {
      hour24 = hour24 + 12
    } else if (period === 'AM' && hour24 === 12) {
      hour24 = 0
    }
    
    return `${hour24.toString().padStart(2, '0')}:${minute}`
  }
  
  // Helper function to check if a field is enabled in formConfig
  // Works for both Add and Edit mode - formConfig applies in both cases
  const isFieldEnabled = (fieldPath) => {
    // If no formConfig, all fields are enabled (backward compatibility)
    if (formConfig === null) {
      return true
    }
    
    // Check field path (e.g., 'name', 'location.enabled', 'location.state')
    const parts = fieldPath.split('.')
    let config = formConfig
    
    for (const part of parts) {
      if (config === null || config === undefined) {
        // For decorationCategory and occasionSpecial, if not explicitly set, allow it
        if (fieldPath === 'decorationCategory' || fieldPath === 'occasionSpecial') {
          return true
        }
        return true
      }
      config = config[part]
    }
    
    // Field is enabled if it's not explicitly set to false
    // For decorationCategory and occasionSpecial, default to true if undefined
    if ((fieldPath === 'decorationCategory' || fieldPath === 'occasionSpecial') && config === undefined) {
      return true
    }
    return config !== false
  }
  
  const [statusFilter, setStatusFilter] = useState('all') // Status filter
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    price: '',
    capacity: '',
    description: '',
    metaTitle: '',
    metaDescription: '',
    categoryId: '',
    menuId: '',
    subMenuId: '',
    amenities: [],
    highlights: [],
    rooms: [], // Changed to array to support room names
    openTime: '',
    closeTime: '',
    openDays: [],
    services: [], // Array of { name, price (optional), description (optional) }
  })
  const [selectedImage, setSelectedImage] = useState(null)
  const [existingImageUrl, setExistingImageUrl] = useState(null) // For showing existing image when editing
  const [galleryImages, setGalleryImages] = useState([])
  const [existingGalleryUrls, setExistingGalleryUrls] = useState([]) // For showing existing gallery when editing
  const [videoFiles, setVideoFiles] = useState([])
  const [videoUrls, setVideoUrls] = useState([])
  const [playingVideo, setPlayingVideo] = useState(null) // Track which video is playing (object with url, title) (for modal)
  const [videoModalOpen, setVideoModalOpen] = useState(false) // Track if video modal is open
  // Removed step-based navigation - using single step form
  // const [currentStep, setCurrentStep] = useState(0)
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
    loadDecorationCategories()
    loadOccasionSpecials()
    loadStates()
  }, [])

  useEffect(() => {
    loadVenues()
  }, [pagination.page, statusFilter])

  useEffect(() => {
    if (isAddPage) {
      resetForm()
      setEditingVenue(null)
      // setCurrentStep(0) // Removed step navigation
      setShowAddModal(true)
      loadMenus()
      loadDecorationCategories()
      loadOccasionSpecials()
      loadVendorCategories()
    } else if (!editingVenue) {
      setShowAddModal(false)
    }
  }, [isAddPage])
  
  // Update selected category when user's vendor category changes
  // BUT only if NOT editing (to preserve venue's saved vendorCategoryId when editing)
  useEffect(() => {
    if (!editingVenue && user?.vendorCategory?._id && !selectedVendorCategoryId && vendorCategories.length > 0) {
      setSelectedVendorCategoryId(user.vendorCategory._id)
    }
  }, [editingVenue, user?.vendorCategory?._id, vendorCategories.length, selectedVendorCategoryId])

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

  const loadVendorCategories = async (skipDefaultSet = false) => {
    try {
      const response = await vendorCategoriesAPI.getPublic()
      const vendorCategoriesData = response.data?.categories || response.data || []
      const categoriesArray = Array.isArray(vendorCategoriesData) ? vendorCategoriesData : []
      setVendorCategories(categoriesArray)
      
      // Set default to user's vendor category if available
      // BUT only if skipDefaultSet is false (to avoid overriding venue's saved category when editing)
      if (!skipDefaultSet && user?.vendorCategory?._id && !selectedVendorCategoryId) {
        setSelectedVendorCategoryId(user.vendorCategory._id)
      }
      
      return categoriesArray
    } catch (error) {
      console.error('Failed to load vendor categories:', error)
      setVendorCategories([])
      return []
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

  const loadDecorationCategories = async () => {
    try {
      const response = await decorationCategoriesAPI.getAll({ active: 'true' })
      let categoriesData = []
      if (response && response.data) {
        if (response.data.categories && Array.isArray(response.data.categories)) {
          categoriesData = response.data.categories
        } else if (Array.isArray(response.data)) {
          categoriesData = response.data
        } else if (response.data.data && Array.isArray(response.data.data)) {
          categoriesData = response.data.data
        }
      }
      setDecorationCategories(categoriesData)
    } catch (error) {
      console.error('Failed to load decoration categories:', error)
      setDecorationCategories([])
    }
  }

  const loadOccasionSpecials = async () => {
    try {
      const response = await occasionSpecialsAPI.getAll({ active: 'true' })
      let occasionSpecialsData = []
      if (response && response.data) {
        if (response.data.occasionSpecials && Array.isArray(response.data.occasionSpecials)) {
          occasionSpecialsData = response.data.occasionSpecials
        } else if (Array.isArray(response.data)) {
          occasionSpecialsData = response.data
        } else if (response.data.data && Array.isArray(response.data.data)) {
          occasionSpecialsData = response.data.data
        }
      }
      setOccasionSpecials(occasionSpecialsData)
    } catch (error) {
      console.error('Failed to load occasion specials:', error)
      setOccasionSpecials([])
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

  const handleAddCustomAmenity = () => {
    const customAmenityInput = document.getElementById('customAmenityInput')
    const customAmenity = customAmenityInput?.value?.trim()
    
    if (customAmenity && customAmenity.length > 0) {
      // Check if amenity already exists (case-insensitive)
      const amenityExists = formData.amenities.some(
        a => a.toLowerCase() === customAmenity.toLowerCase()
      )
      
      if (!amenityExists) {
        setFormData({
          ...formData,
          amenities: [...formData.amenities, customAmenity],
        })
        // Clear input
        if (customAmenityInput) {
          customAmenityInput.value = ''
        }
      } else {
        alert('This amenity is already added')
      }
    }
  }

  const handleRemoveAmenity = (amenityToRemove) => {
    setFormData({
      ...formData,
      amenities: formData.amenities.filter(a => a !== amenityToRemove),
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
      // isFieldEnabled function is now defined at component level

      // Validation - Name is ALWAYS required, regardless of formConfig or edit mode
        if (!formData.name || !formData.name.trim()) {
          alert('Venue name is required')
          setSubmitting(false)
          return
        }
      
      // When editing, only name is required - all other fields are optional
      if (editingVenue) {
        console.log('✅ Edit mode: Only name is required, all other fields are optional')
        // Skip all other validations when editing
      } else {
        // When creating (not editing), validate enabled fields
        // Other field validations - only validate enabled fields
        
        if (isFieldEnabled('numberOfGuests')) {
          // Only validate if field is enabled AND has a value
          // If field is disabled, skip validation entirely
        if (!formData.capacity || formData.capacity <= 0) {
            console.log('❌ Capacity validation failed:', {
              capacity: formData.capacity,
              numberOfGuestsEnabled: isFieldEnabled('numberOfGuests'),
              formConfig: formConfig
            })
          alert('Capacity is required and must be greater than 0')
          setSubmitting(false)
          return
        }
        } else {
          console.log('✅ Skipping capacity validation (field disabled in formConfig)')
      }
      
        // Location validation - only if location is enabled
        if (isFieldEnabled('location.enabled')) {
          if (isFieldEnabled('location.state')) {
          if (!formData.state || !formData.state.trim()) {
            alert('State is required')
            setSubmitting(false)
            return
          }
        }
          if (isFieldEnabled('location.city')) {
          if (!formData.city || !formData.city.trim()) {
            alert('City is required')
            setSubmitting(false)
            return
            }
          }
        }
      }

      const formDataToSend = new FormData()
      
      // Name is ALWAYS required and sent, regardless of formConfig
      const venueName = formData.name.trim()
      if (!venueName) {
        alert('Venue name is required')
        setSubmitting(false)
        return
      }
      formDataToSend.append('name', venueName)
      
      console.log('📤 Sending venue data - Name:', venueName)
      console.log('📤 FormConfig:', formConfig)
      console.log('📤 numberOfGuests enabled?', isFieldEnabled('numberOfGuests'))
      console.log('📤 location.enabled?', isFieldEnabled('location.enabled'))
      
      // Only send other fields that are enabled in formConfig
      
      // Capacity field - only send if enabled AND not editing (when editing, only send if value is provided)
      if (editingVenue) {
        // When editing, only send capacity if it has a value (optional field)
        if (formData.capacity && formData.capacity.toString().trim() !== '' && formData.capacity > 0) {
          console.log('📤 Adding capacity (edit mode):', formData.capacity)
        formDataToSend.append('capacity', formData.capacity.toString())
        } else {
          console.log('📤 Skipping capacity (edit mode - no value provided)')
        }
      } else {
        // When creating, send if enabled in formConfig
        if (isFieldEnabled('numberOfGuests')) {
          console.log('📤 Adding capacity:', formData.capacity)
          formDataToSend.append('capacity', formData.capacity.toString())
        } else {
          console.log('📤 Skipping capacity (not enabled in formConfig)')
        }
      }
      
      // Location - only send if enabled
      if (isFieldEnabled('location.enabled')) {
        const locationObj = {}
        if (isFieldEnabled('location.address')) {
          locationObj.address = formData.address || ''
        }
        if (isFieldEnabled('location.city')) {
          locationObj.city = formData.city || ''
        }
        if (isFieldEnabled('location.state')) {
          locationObj.state = formData.state || ''
        }
        // Only send location if at least one field is enabled
        if (Object.keys(locationObj).length > 0) {
          formDataToSend.append('location', JSON.stringify(locationObj))
        }
      }
      
      // Price field
      if (isFieldEnabled('price')) {
      formDataToSend.append('price', formData.price || '0')
      }
      
      // Description field
      if (isFieldEnabled('description')) {
        formDataToSend.append('description', formData.description || '')
      }
      
      // SEO fields
      if (isFieldEnabled('metaTitle')) {
      formDataToSend.append('metaTitle', formData.metaTitle || '')
      }
      if (isFieldEnabled('metaDescription')) {
      formDataToSend.append('metaDescription', formData.metaDescription || '')
      }
      
      // Category field
      if (isFieldEnabled('category')) {
        if (formData.categoryId) {
        formDataToSend.append('categoryId', formData.categoryId)
      }
      }
      
      // Save "Select Venue Category" dropdown value - this is what user selected
      // This will be used when editing to show the same category in dropdown
      if (selectedVendorCategoryId && selectedVendorCategoryId.trim() !== '') {
        formDataToSend.append('vendorCategoryId', selectedVendorCategoryId)
        console.log('💾 Saving selected vendor category (from dropdown) with venue:', selectedVendorCategoryId)
      } else {
        console.log('⚠️ No vendor category selected in dropdown - vendorCategoryId will be null')
      }
      
      // Menu fields - only send if enabled
      if (isFieldEnabled('menu')) {
        formDataToSend.append('menuId', formData.menuId || '')
      }
      if (isFieldEnabled('submenu')) {
        formDataToSend.append('subMenuId', formData.subMenuId || '')
      }
      if (isFieldEnabled('decorationCategory')) {
        const decorationCategoryId = formData.decorationCategoryId && formData.decorationCategoryId.trim() !== '' ? formData.decorationCategoryId : '';
        formDataToSend.append('decorationCategoryId', decorationCategoryId)
        console.log('💾 Sending decorationCategoryId:', decorationCategoryId)
      }
      if (isFieldEnabled('occasionSpecial')) {
        const occasionSpecialId = formData.occasionSpecialId && formData.occasionSpecialId.trim() !== '' ? formData.occasionSpecialId : '';
        formDataToSend.append('occasionSpecialId', occasionSpecialId)
        console.log('💾 Sending occasionSpecialId:', occasionSpecialId)
      }
      
      // Amenities array - only send if enabled
      if (isFieldEnabled('amenities')) {
        if (formData.amenities && formData.amenities.length > 0) {
        formData.amenities.forEach(amenity => formDataToSend.append('amenities', amenity))
        }
      }
      
      // Highlights array - only send if enabled
      if (isFieldEnabled('highlights')) {
        if (formData.highlights && formData.highlights.length > 0) {
        formData.highlights.filter(h => h.trim()).forEach(highlight => formDataToSend.append('highlights', highlight.trim()))
        }
      }
      
      // Services array - only send if enabled (assuming there's a services field in formConfig)
      // For now, always send if no formConfig, or check if services field exists
      if (formConfig === null || formConfig.services !== false) {
      if (formData.services && formData.services.length > 0) {
        formDataToSend.append('services', JSON.stringify(formData.services))
      } else {
        formDataToSend.append('services', JSON.stringify([]))
        }
      }
      
      // Rooms - send as array of objects { name, count } or strings (for backward compatibility)
        if (formData.rooms && Array.isArray(formData.rooms) && formData.rooms.length > 0) {
          // Filter out empty entries and convert to proper format
          const validRooms = formData.rooms
            .filter(r => {
              if (typeof r === 'string') return r && r.trim()
              if (typeof r === 'object' && r !== null) return r.name && r.name.trim() && r.count > 0
              return false
            })
            .map(r => {
              if (typeof r === 'string') {
                // Legacy format: convert string to object
                return { name: r.trim(), count: 1 }
              }
              // New format: ensure count is valid
              return { name: r.name.trim(), count: r.count > 0 ? r.count : 1 }
            })
          
          if (validRooms.length > 0) {
            formDataToSend.append('rooms', JSON.stringify(validRooms))
          } else {
            formDataToSend.append('rooms', JSON.stringify([]))
          }
        } else {
          // Send empty array if no rooms
          formDataToSend.append('rooms', JSON.stringify([]))
      }
      
      // Availability - always send if any field exists
      // Time is already in 24-hour format (HH:MM)
        const availability = {
          status: 'Open',
        openTime: formData.openTime || '',
        closeTime: formData.closeTime || '',
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
      
      // Wait for vendor categories to load first (if not already loaded)
      // Pass skipDefaultSet=true to prevent loadVendorCategories from setting default
      let currentVendorCategories = vendorCategories
      if (currentVendorCategories.length === 0) {
        currentVendorCategories = await loadVendorCategories(true) // Skip default set
        setVendorCategories(currentVendorCategories)
      }
      
      // When editing, show the same "Select Venue Category" that was selected when creating
      // This value is stored in vendorCategoryId field (from "Select Venue Category" dropdown)
      console.log('🔍 Editing venue - Checking saved "Select Venue Category" value:', {
        savedVendorCategoryId: fullVenueData.vendorCategoryId,
        vendorCategoriesCount: currentVendorCategories.length,
        availableCategoryIds: currentVendorCategories.map(c => c._id || c.id)
      })
      
      if (fullVenueData.vendorCategoryId) {
        // Venue has vendorCategoryId stored (from "Select Venue Category" dropdown when created)
        const savedCategoryId = typeof fullVenueData.vendorCategoryId === 'object' 
          ? (fullVenueData.vendorCategoryId._id?.toString() || fullVenueData.vendorCategoryId.toString())
          : fullVenueData.vendorCategoryId.toString()
        
        // Verify the saved category exists in available categories
        const categoryExists = currentVendorCategories.some(cat => {
          const catId = cat._id?.toString() || cat.id?.toString()
          return catId === savedCategoryId
        })
        
        if (categoryExists) {
          // Set the dropdown to show the same category that was selected when creating
          setSelectedVendorCategoryId(savedCategoryId)
          const categoryName = currentVendorCategories.find(c => {
            const catId = c._id?.toString() || c.id?.toString()
            return catId === savedCategoryId
          })?.name
          console.log('✅ Setting "Select Venue Category" dropdown to saved value:', savedCategoryId, 'Category name:', categoryName)
        } else {
          console.warn('⚠️ Saved vendor category not found in available categories:', {
            savedCategoryId,
            availableIds: currentVendorCategories.map(c => c._id?.toString() || c.id?.toString())
          })
          // Fallback to user's default
          if (user?.vendorCategory?._id) {
            setSelectedVendorCategoryId(user.vendorCategory._id)
            console.log('📝 Fallback: Setting vendor category from user default:', user.vendorCategory._id)
          }
        }
      } else {
        // No vendorCategoryId stored (old venue or no category was selected when creating)
        console.log('📝 No saved vendor category in venue, using user default')
        if (user?.vendorCategory?._id) {
          setSelectedVendorCategoryId(user.vendorCategory._id)
          console.log('📝 Setting vendor category from user default (no saved category):', user.vendorCategory._id)
        }
      }
      
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

      // Extract decorationCategoryId - handle both ObjectId and populated object
      let decorationCategoryIdValue = ''
      if (fullVenueData.decorationCategoryId) {
        if (typeof fullVenueData.decorationCategoryId === 'object' && fullVenueData.decorationCategoryId._id) {
          decorationCategoryIdValue = String(fullVenueData.decorationCategoryId._id)
        } else if (typeof fullVenueData.decorationCategoryId === 'string') {
          decorationCategoryIdValue = fullVenueData.decorationCategoryId
        } else {
          decorationCategoryIdValue = String(fullVenueData.decorationCategoryId)
        }
        console.log('📥 Extracted decorationCategoryId for editing:', decorationCategoryIdValue)
      }

      // Extract occasionSpecialId - handle both ObjectId and populated object
      let occasionSpecialIdValue = ''
      if (fullVenueData.occasionSpecialId) {
        if (typeof fullVenueData.occasionSpecialId === 'object' && fullVenueData.occasionSpecialId._id) {
          occasionSpecialIdValue = String(fullVenueData.occasionSpecialId._id)
        } else if (typeof fullVenueData.occasionSpecialId === 'string') {
          occasionSpecialIdValue = fullVenueData.occasionSpecialId
        } else {
          occasionSpecialIdValue = String(fullVenueData.occasionSpecialId)
        }
        console.log('📥 Extracted occasionSpecialId for editing:', occasionSpecialIdValue)
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
      
      // Ensure services is always an array
      let servicesArray = []
      if (fullVenueData.services) {
        if (Array.isArray(fullVenueData.services)) {
          servicesArray = fullVenueData.services
        } else {
          servicesArray = []
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
        metaTitle: fullVenueData.metaTitle || '',
        metaDescription: fullVenueData.metaDescription || '',
        categoryId: categoryIdValue,
        menuId: menuIdValue,
        subMenuId: subMenuIdValue,
        decorationCategoryId: decorationCategoryIdValue,
        occasionSpecialId: occasionSpecialIdValue,
        amenities: amenitiesArray,
        highlights: highlightsArray,
        // Handle rooms - can be number (legacy), array of strings, or array of objects { name, count }
        rooms: (() => {
          if (Array.isArray(fullVenueData.rooms)) {
            // Convert array of strings to array of objects, or keep as is if already objects
            return fullVenueData.rooms.map(r => {
              if (typeof r === 'string') {
                return { name: r, count: 1 }
              }
              if (typeof r === 'object' && r !== null && r.name) {
                return { name: r.name, count: r.count || 1 }
              }
              return { name: String(r), count: 1 }
            })
          }
          if (fullVenueData.rooms) {
            // Legacy: convert number or string to array
            return [{ name: fullVenueData.rooms.toString(), count: 1 }]
          }
          return []
        })(),
        // Time is already in 24-hour format (HH:MM) - use directly
        openTime: fullVenueData.availability?.openTime || '',
        closeTime: fullVenueData.availability?.closeTime || '',
        openDays: openDaysArray,
        services: servicesArray,
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
      // setCurrentStep(0) // Removed step navigation
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
      metaTitle: '',
      metaDescription: '',
    categoryId: '',
    menuId: '',
    subMenuId: '',
    amenities: [],
    highlights: [],
    rooms: [], // Changed to array
      openTime: '',
      closeTime: '',
      openDays: [],
      services: [],
    })
    setSelectedImage(null)
    setExistingImageUrl(null)
    setGalleryImages([])
    setExistingGalleryUrls([])
    setVideoFiles([])
    setVideoUrls([])
    setPlayingVideo(null)
    // setCurrentStep(0) // Removed step navigation
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
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-900"
              >
                <RefreshCw className="w-4 h-4 text-gray-900" />
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
            <label className="text-sm font-medium text-gray-900">Filter by Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
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
                {editingVenue ? 'Edit Venue' : 'Add New Venue'}
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

            <form onSubmit={handleSubmit} className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
              {/* Basic Information Section */}
              <div className="space-y-6 mb-8">
                <div className="border-b border-gray-200 pb-3">
                  <h3 className="text-xl font-semibold text-gray-900">Basic Information</h3>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                  
                  {/* Vendor Category Dropdown - Show for both Add and Edit */}
                  {vendorCategories.length > 0 && (
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Venue Category <span className="text-xs text-gray-500">(Form fields will change based on selection)</span>
                      </label>
                      <select
                        value={selectedVendorCategoryId}
                        onChange={(e) => {
                          setSelectedVendorCategoryId(e.target.value)
                          // Only reset form data when category changes if NOT editing (to preserve existing data when editing)
                          if (!editingVenue) {
                          setFormData(prev => ({
                            ...prev,
                            name: '',
                            address: '',
                            city: '',
                            state: '',
                            price: '',
                            capacity: '',
                            description: '',
                            metaTitle: '',
                            metaDescription: '',
                            amenities: [],
                            highlights: [],
                            rooms: [], // Changed to array
                            openTime: '',
                            closeTime: '',
                            openDays: []
                          }))
                          }
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
                    {/* Capacity field - use isFieldEnabled helper function */}
                    {isFieldEnabled('numberOfGuests') ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Capacity (Number of Guests) *</label>
                        <input
                          type="number"
                          name="capacity"
                          value={formData.capacity}
                          onChange={handleInputChange}
                          required={!editingVenue}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                    ) : null}
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
                  
                  {/* SEO Fields */}
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="text-md font-semibold mb-3 text-gray-900">SEO Settings (Optional)</h4>
                    <p className="text-xs text-gray-600 mb-4">Add custom meta title and description for better search engine visibility. If left empty, default values will be used.</p>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Meta Title
                          <span className="text-xs text-gray-500 ml-2">(Recommended: 50-60 characters)</span>
                        </label>
                        <input
                          type="text"
                          name="metaTitle"
                          value={formData.metaTitle}
                          onChange={handleInputChange}
                          placeholder="e.g., Best Wedding Venue in Jaipur | ShubhVenue"
                          maxLength={70}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {formData.metaTitle.length}/70 characters
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Meta Description
                          <span className="text-xs text-gray-500 ml-2">(Recommended: 150-160 characters)</span>
                        </label>
                        <textarea
                          name="metaDescription"
                          value={formData.metaDescription}
                          onChange={handleInputChange}
                          rows={3}
                          placeholder="e.g., Book the perfect wedding venue in Jaipur. Best banquet halls, hotels, and resorts for your special day. Excellent facilities and affordable prices."
                          maxLength={200}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {formData.metaDescription.length}/200 characters
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Images & Videos Section */}
              <div className="space-y-6 mb-8">
                <div className="border-b border-gray-200 pb-3">
                  <h3 className="text-xl font-semibold text-gray-900">Images & Videos</h3>
                </div>
                  
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

              {/* Category & Amenities Section */}
              <div className="space-y-6 mb-8">
                <div className="border-b border-gray-200 pb-3">
                  <h3 className="text-xl font-semibold text-gray-900">Category & Amenities</h3>
                </div>
                  
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

                  {/* Decoration Category - Show if enabled in formConfig or if no formConfig */}
                  {(formConfig === null || formConfig.decorationCategory !== false || formConfig.decorationCategory === undefined) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Decoration Category</label>
                      <select
                        name="decorationCategoryId"
                        value={String(formData.decorationCategoryId || '')}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="">Select Decoration Category</option>
                        {decorationCategories.map((category) => {
                          const categoryId = String(category._id || category.id || '')
                          return (
                            <option key={categoryId} value={categoryId}>
                              {category.name}
                            </option>
                          )
                        })}
                      </select>
                      {decorationCategories.length === 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          No decoration categories available.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Occasion Special - Show if enabled in formConfig or if no formConfig */}
                  {(formConfig === null || formConfig.occasionSpecial !== false || formConfig.occasionSpecial === undefined) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Occasion Special</label>
                      <select
                        name="occasionSpecialId"
                        value={String(formData.occasionSpecialId || '')}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="">Select Occasion Special</option>
                        {occasionSpecials.map((occasionSpecial) => {
                          const occasionSpecialId = String(occasionSpecial._id || occasionSpecial.id || '')
                          return (
                            <option key={occasionSpecialId} value={occasionSpecialId}>
                              {occasionSpecial.name}
                            </option>
                          )
                        })}
                      </select>
                      {occasionSpecials.length === 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          No occasion specials available.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Amenities - Show if enabled in formConfig or if no formConfig */}
                  {(formConfig === null || formConfig.amenities !== false) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amenities
                        <span className="text-xs text-gray-500 font-normal ml-2">(Select from list or add your own)</span>
                      </label>
                      
                      {/* Predefined Amenities */}
                      <div className="mb-4">
                        <p className="text-xs text-gray-600 mb-2">Select from common amenities:</p>
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

                      {/* Add Custom Amenity */}
                      <div className="mb-4">
                        <p className="text-xs text-gray-600 mb-2">Or add your own amenity:</p>
                        <div className="flex gap-2">
                          <input
                            id="customAmenityInput"
                            type="text"
                            placeholder="Enter custom amenity (e.g., Fireplace, Library, etc.)"
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                handleAddCustomAmenity()
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={handleAddCustomAmenity}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm flex items-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Add
                          </button>
                        </div>
                      </div>

                      {/* Selected Amenities Display */}
                      {formData.amenities.length > 0 && (
                        <div className="mt-4">
                          <p className="text-xs text-gray-600 mb-2">
                            Selected Amenities ({formData.amenities.length}):
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {formData.amenities.map((amenity, index) => {
                              const isPredefined = availableAmenities.includes(amenity)
                              return (
                                <div
                                  key={`${amenity}-${index}`}
                                  className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-primary-600 text-white"
                                >
                                  <span>{amenity}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveAmenity(amenity)}
                                    className="ml-1 hover:bg-primary-700 rounded-full p-0.5 transition"
                                    title="Remove amenity"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
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
                  
                  {/* Services - Custom services with optional pricing */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Services <span className="text-xs text-gray-500 font-normal">(Add your custom services with optional pricing)</span>
                    </label>
                    <div className="space-y-3">
                      {(formData.services || []).map((service, index) => (
                        <div key={index} className="p-4 border border-gray-300 rounded-lg bg-gray-50">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="md:col-span-2">
                              <label className="block text-xs font-medium text-gray-700 mb-1">Service Name *</label>
                              <input
                                type="text"
                                value={service.name || ''}
                                onChange={(e) => {
                                  const currentServices = formData.services || []
                                  const newServices = [...currentServices]
                                  newServices[index] = { ...service, name: e.target.value }
                                  setFormData({ ...formData, services: newServices })
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                placeholder="e.g., Photography, Catering, Decoration"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Price (₹) <span className="text-xs text-gray-500 font-normal">(Optional)</span>
                              </label>
                              <input
                                type="number"
                                value={service.price !== null && service.price !== undefined ? service.price : ''}
                                onChange={(e) => {
                                  const currentServices = formData.services || []
                                  const newServices = [...currentServices]
                                  const priceValue = e.target.value === '' ? null : parseFloat(e.target.value)
                                  newServices[index] = { ...service, price: priceValue }
                                  setFormData({ ...formData, services: newServices })
                                }}
                                min="0"
                                step="0.01"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                placeholder="Leave empty if no price"
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const currentServices = formData.services || []
                              const newServices = currentServices.filter((_, i) => i !== index)
                              setFormData({ ...formData, services: newServices })
                            }}
                            className="mt-2 px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm flex items-center gap-1"
                          >
                            <X className="w-3 h-3" />
                            Remove Service
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, services: [...(formData.services || []), { name: '', price: null }] })}
                        className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Service
                      </button>
                      {(!formData.services || formData.services.length === 0) && (
                        <p className="text-xs text-gray-500 text-center py-2">
                          No services added yet. Click "Add Service" to add your custom services.
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Rooms - Show if enabled in formConfig or if no formConfig */}
                  {(formConfig === null || formConfig.numberOfRooms !== false) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rooms
                        <span className="text-xs text-gray-500 font-normal ml-2">(Add room name and count, e.g., "Bedroom" - 3 rooms, "Hall" - 2 rooms)</span>
                      </label>
                      <div className="space-y-3">
                        {(formData.rooms || []).map((room, index) => {
                          // Handle both old string format and new object format
                          const roomName = typeof room === 'string' ? room : (room?.name || '')
                          const roomCount = typeof room === 'object' && room?.count ? room.count : 1
                          
                          return (
                            <div key={index} className="p-4 border border-gray-300 rounded-lg bg-gray-50">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="md:col-span-2">
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Room Name *</label>
                                  <input
                                    type="text"
                                    value={roomName}
                                    onChange={(e) => {
                                      const currentRooms = formData.rooms || []
                                      const newRooms = [...currentRooms]
                                      if (typeof newRooms[index] === 'object') {
                                        newRooms[index] = { ...newRooms[index], name: e.target.value }
                                      } else {
                                        newRooms[index] = { name: e.target.value, count: 1 }
                                      }
                                      setFormData({ ...formData, rooms: newRooms })
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                    placeholder="e.g., Bedroom, Hall, Kitchen, etc."
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Number of Rooms *</label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={roomCount}
                                    onChange={(e) => {
                                      const currentRooms = formData.rooms || []
                                      const newRooms = [...currentRooms]
                                      const count = parseInt(e.target.value) || 1
                                      if (typeof newRooms[index] === 'object') {
                                        newRooms[index] = { ...newRooms[index], count: count }
                                      } else {
                                        newRooms[index] = { name: newRooms[index] || '', count: count }
                                      }
                                      setFormData({ ...formData, rooms: newRooms })
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                    placeholder="Count"
                                    required
                                  />
                                </div>
                              </div>
                              <div className="mt-2">
                                <p className="text-xs text-gray-600">
                                  {roomName && roomCount > 0 ? (
                                    <span className="font-medium text-primary-700">
                                      {roomCount} {roomName}{roomCount > 1 ? 's' : ''}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">Enter room name and count</span>
                                  )}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const currentRooms = formData.rooms || []
                                  const newRooms = currentRooms.filter((_, i) => i !== index)
                                  setFormData({ ...formData, rooms: newRooms })
                                }}
                                className="mt-2 px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm flex items-center gap-1"
                              >
                                <X className="w-3 h-3" />
                                Remove
                              </button>
                            </div>
                          )
                        })}
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, rooms: [...(formData.rooms || []), { name: '', count: 1 }] })}
                          className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition flex items-center justify-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Add Room Type
                        </button>
                      </div>
                      {(!formData.rooms || formData.rooms.length === 0) && (
                        <p className="text-xs text-gray-500 mt-2 text-center">
                          No rooms added yet. Click "Add Room Type" to add room names and counts.
                        </p>
                      )}
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
                            value={convert24To12(formData.openTime).hour}
                            onChange={(e) => {
                              const hour = e.target.value
                              const { minute, period } = convert24To12(formData.openTime)
                              const time24 = convert12To24(hour || '12', minute || '00', period || 'AM')
                              setFormData(prev => ({
                                ...prev,
                                openTime: time24
                              }))
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          >
                            <option value="">HH</option>
                            {Array.from({ length: 12 }, (_, i) => (i + 1).toString()).map(hour => (
                              <option key={hour} value={hour}>{hour}</option>
                            ))}
                          </select>
                          <span className="text-gray-600">:</span>
                          <select
                            name="openTimeMinute"
                            value={convert24To12(formData.openTime).minute}
                            onChange={(e) => {
                              const minutes = e.target.value
                              const { hour, period } = convert24To12(formData.openTime)
                              const time24 = convert12To24(hour || '12', minutes || '00', period || 'AM')
                              setFormData(prev => ({
                                ...prev,
                                openTime: time24
                              }))
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          >
                            <option value="">MM</option>
                            {Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')).map(minute => (
                              <option key={minute} value={minute}>{minute}</option>
                            ))}
                          </select>
                          <select
                            name="openTimePeriod"
                            value={convert24To12(formData.openTime).period || 'AM'}
                            onChange={(e) => {
                              const period = e.target.value
                              const { hour, minute } = convert24To12(formData.openTime)
                              const time24 = convert12To24(hour || '12', minute || '00', period || 'AM')
                              setFormData(prev => ({
                                ...prev,
                                openTime: time24
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
                            value={convert24To12(formData.closeTime).hour}
                            onChange={(e) => {
                              const hour = e.target.value
                              const { minute, period } = convert24To12(formData.closeTime)
                              const time24 = convert12To24(hour || '12', minute || '00', period || 'AM')
                              setFormData(prev => ({
                                ...prev,
                                closeTime: time24
                              }))
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          >
                            <option value="">HH</option>
                            {Array.from({ length: 12 }, (_, i) => (i + 1).toString()).map(hour => (
                              <option key={hour} value={hour}>{hour}</option>
                            ))}
                          </select>
                          <span className="text-gray-600">:</span>
                          <select
                            name="closeTimeMinute"
                            value={convert24To12(formData.closeTime).minute}
                            onChange={(e) => {
                              const minutes = e.target.value
                              const { hour, period } = convert24To12(formData.closeTime)
                              const time24 = convert12To24(hour || '12', minutes || '00', period || 'AM')
                              setFormData(prev => ({
                                ...prev,
                                closeTime: time24
                              }))
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          >
                            <option value="">MM</option>
                            {Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')).map(minute => (
                              <option key={minute} value={minute}>{minute}</option>
                            ))}
                          </select>
                          <select
                            name="closeTimePeriod"
                            value={convert24To12(formData.closeTime).period || 'AM'}
                            onChange={(e) => {
                              const period = e.target.value
                              const { hour, minute } = convert24To12(formData.closeTime)
                              const time24 = convert12To24(hour || '12', minute || '00', period || 'AM')
                              setFormData(prev => ({
                                ...prev,
                                closeTime: time24
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

              {/* Review Note Section */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Note:</strong> Your venue will be submitted for admin approval. It will be visible to customers once approved.
                </p>
              </div>

              <div className="flex items-center justify-end gap-4 mt-6 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    if (isAddPage) navigate('/vendor/venues')
                    else setShowAddModal(false)
                    resetForm()
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : editingVenue ? 'Update Venue' : 'Submit Venue'}
                </button>
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

