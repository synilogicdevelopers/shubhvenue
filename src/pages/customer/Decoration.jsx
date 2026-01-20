import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Footer from '../../components/customer/Footer'
import SEO from '../../components/SEO'
import { publicBannersAPI, publicDecorationCategoriesAPI, publicOccasionSpecialsAPI, publicVenuesAPI } from '../../services/customer/api'
import { createSlug } from '../../utils/customer/slug'
import toast from 'react-hot-toast'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination, Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'
import './Decoration.css'

function Decoration() {
  const navigate = useNavigate()
  const [banners, setBanners] = useState([])
  const [decorationCategories, setDecorationCategories] = useState([])
  const [occasionSpecials, setOccasionSpecials] = useState([])
  const [birthdayBanner, setBirthdayBanner] = useState(null)
  const [birthdayVenues, setBirthdayVenues] = useState([])
  const [babyBanner, setBabyBanner] = useState(null)
  const [babyVenues, setBabyVenues] = useState([])
  const [romanticBanner, setRomanticBanner] = useState(null)
  const [romanticVenues, setRomanticVenues] = useState([])
  const [sameDayBanner, setSameDayBanner] = useState(null)
  const [sameDayVenues, setSameDayVenues] = useState([])
  const [corporateBanner, setCorporateBanner] = useState(null)
  const [corporateVenues, setCorporateVenues] = useState([])
  const [loading, setLoading] = useState(true)
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [occasionSpecialsLoading, setOccasionSpecialsLoading] = useState(true)
  const [birthdayBannerLoading, setBirthdayBannerLoading] = useState(true)
  const [birthdayVenuesLoading, setBirthdayVenuesLoading] = useState(true)
  const [babyBannerLoading, setBabyBannerLoading] = useState(true)
  const [babyVenuesLoading, setBabyVenuesLoading] = useState(true)
  const [romanticBannerLoading, setRomanticBannerLoading] = useState(true)
  const [romanticVenuesLoading, setRomanticVenuesLoading] = useState(true)
  const [sameDayBannerLoading, setSameDayBannerLoading] = useState(true)
  const [sameDayVenuesLoading, setSameDayVenuesLoading] = useState(true)
  const [corporateBannerLoading, setCorporateBannerLoading] = useState(true)
  const [corporateVenuesLoading, setCorporateVenuesLoading] = useState(true)
  const swiperRef = useRef(null)
  const [showContent, setShowContent] = useState(false)
  const hasShownContent = useRef(false)

  // Helper function to get banner image URL
  const getBannerImageUrl = (image) => {
    if (!image) {
      return 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200&h=400&fit=crop'
    }
    if (image.startsWith('http://') || image.startsWith('https://')) {
      return image
    }
    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://shubhvenue.com'
    
    // Handle full path starting with /uploads/
    if (image.startsWith('/uploads/')) {
      const pathParts = image.split('/')
      const filename = pathParts.pop()
      const encodedFilename = encodeURIComponent(filename)
      const encodedPath = pathParts.join('/') + '/' + encodedFilename
      return `${baseUrl}${encodedPath}`
    }
    
    // Handle path starting with uploads/ (without leading /)
    if (image.startsWith('uploads/')) {
      const pathParts = image.split('/')
      const filename = pathParts.pop()
      const encodedFilename = encodeURIComponent(filename)
      const encodedPath = pathParts.join('/') + '/' + encodedFilename
      return `${baseUrl}/${encodedPath}`
    }
    
    // Handle just filename - assume it's a banner
    const encodedImage = encodeURIComponent(image)
    return `${baseUrl}/uploads/banners/${encodedImage}`
  }

  // Helper function to get category image URL
  const getCategoryImageUrl = (image) => {
    if (!image) {
      return 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=300&h=300&fit=crop'
    }
    if (image.startsWith('http://') || image.startsWith('https://')) {
      return image
    }
    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://shubhvenue.com'
    
    // Handle full path starting with /uploads/
    if (image.startsWith('/uploads/')) {
      const pathParts = image.split('/')
      const filename = pathParts.pop()
      const encodedFilename = encodeURIComponent(filename)
      const encodedPath = pathParts.join('/') + '/' + encodedFilename
      const finalUrl = `${baseUrl}${encodedPath}`
      return finalUrl
    }
    
    // Handle path starting with uploads/ (without leading /)
    if (image.startsWith('uploads/')) {
      const pathParts = image.split('/')
      const filename = pathParts.pop()
      const encodedFilename = encodeURIComponent(filename)
      const encodedPath = pathParts.join('/') + '/' + encodedFilename
      const finalUrl = `${baseUrl}/${encodedPath}`
      return finalUrl
    }
    
    // Handle just filename - assume it's a decoration category
    const encodedImage = encodeURIComponent(image)
    const finalUrl = `${baseUrl}/uploads/decoration-categories/${encodedImage}`
    return finalUrl
  }

  // Helper function to get occasion special image URL
  const getOccasionSpecialImageUrl = (image) => {
    if (!image) {
      return 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=300&h=300&fit=crop'
    }
    if (image.startsWith('http://') || image.startsWith('https://')) {
      return image
    }
    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://shubhvenue.com'
    
    // Handle full path starting with /uploads/
    if (image.startsWith('/uploads/')) {
      const pathParts = image.split('/')
      const filename = pathParts.pop()
      const encodedFilename = encodeURIComponent(filename)
      const encodedPath = pathParts.join('/') + '/' + encodedFilename
      return `${baseUrl}${encodedPath}`
    }
    
    // Handle path starting with uploads/ (without leading /)
    if (image.startsWith('uploads/')) {
      const pathParts = image.split('/')
      const filename = pathParts.pop()
      const encodedFilename = encodeURIComponent(filename)
      const encodedPath = pathParts.join('/') + '/' + encodedFilename
      return `${baseUrl}/${encodedPath}`
    }
    
    // Handle just filename - assume it's an occasion special
    const encodedImage = encodeURIComponent(image)
    return `${baseUrl}/uploads/occasion-specials/${encodedImage}`
  }

  // Helper function to get venue image URL
  const getVenueImageUrl = (images) => {
    if (!images || images.length === 0) {
      return 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&h=300&fit=crop'
    }
    const image = Array.isArray(images) ? images[0] : images
    if (image.startsWith('http://') || image.startsWith('https://')) {
      return image
    }
    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://shubhvenue.com'
    
    // Handle full path starting with /uploads/
    if (image.startsWith('/uploads/')) {
      const pathParts = image.split('/')
      const filename = pathParts.pop()
      const encodedFilename = encodeURIComponent(filename)
      const encodedPath = pathParts.join('/') + '/' + encodedFilename
      return `${baseUrl}${encodedPath}`
    }
    
    // Handle path starting with uploads/ (without leading /)
    if (image.startsWith('uploads/')) {
      const pathParts = image.split('/')
      const filename = pathParts.pop()
      const encodedFilename = encodeURIComponent(filename)
      const encodedPath = pathParts.join('/') + '/' + encodedFilename
      return `${baseUrl}/${encodedPath}`
    }
    
    // Handle just filename - assume it's a venue image
    const encodedImage = encodeURIComponent(image)
    return `${baseUrl}/uploads/venues/${encodedImage}`
  }

  // Helper function to format location
  const formatLocation = (location) => {
    if (!location) return 'Location not specified'
    if (typeof location === 'object' && location.city) {
      return `${location.city}${location.state ? `, ${location.state}` : ''}`
    }
    if (typeof location === 'string') {
      return location.length > 20 ? `${location.substring(0, 20)}...` : location
    }
    return 'Location not specified'
  }

  // Helper function to format price
  const formatPrice = (venue) => {
    // Try to get price from various possible fields
    if (venue.pricingInfo?.vegPerPlate) {
      return { price: `₹${venue.pricingInfo.vegPerPlate}`, suffix: 'per plate' }
    }
    if (venue.pricingInfo?.nonVegPerPlate) {
      return { price: `₹${venue.pricingInfo.nonVegPerPlate}`, suffix: 'per plate' }
    }
    if (venue.minPricePerPlateVeg) {
      return { price: `₹${venue.minPricePerPlateVeg}`, suffix: 'per plate' }
    }
    if (venue.minPricePerPlateNonVeg) {
      return { price: `₹${venue.minPricePerPlateNonVeg}`, suffix: 'per plate' }
    }
    if (venue.pricePerPlate?.veg) {
      return { price: `₹${venue.pricePerPlate.veg}`, suffix: 'per plate' }
    }
    if (venue.pricePerPlate?.nonVeg) {
      return { price: `₹${venue.pricePerPlate.nonVeg}`, suffix: 'per plate' }
    }
    if (venue.pricingInfo?.rentalPrice) {
      return { price: `₹${venue.pricingInfo.rentalPrice}`, suffix: 'per day' }
    }
    if (venue.minPrice) {
      return { price: `₹${venue.minPrice}`, suffix: 'per day' }
    }
    if (venue.price) {
      return { price: `₹${venue.price}`, suffix: 'per day' }
    }
    return { price: '₹4999', suffix: 'per day' } // Default price like in the image
  }

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setLoading(true)
        
        // First, fetch all banners to find the herobanner category ID
        const allBannersResponse = await publicBannersAPI.getAll()
        
        let allBannersData = []
        if (allBannersResponse.data) {
          if (allBannersResponse.data.banners && Array.isArray(allBannersResponse.data.banners)) {
            allBannersData = allBannersResponse.data.banners
          } else if (Array.isArray(allBannersResponse.data)) {
            allBannersData = allBannersResponse.data
          } else if (allBannersResponse.data.data && Array.isArray(allBannersResponse.data.data)) {
            allBannersData = allBannersResponse.data.data
          }
        }
        
        // Find the herobanner category ID from banners
        const heroBannerCategory = allBannersData.find(banner => 
          banner.categoryId && 
          (banner.categoryId.name || banner.categoryId) && 
          (banner.categoryId.name?.toLowerCase() === 'herobanner' || 
           (typeof banner.categoryId === 'string' && banner.categoryId.toLowerCase() === 'herobanner'))
        )
        
        let bannersData = []
        
        // Get categoryId - handle both populated object and string ID
        let heroBannerCategoryId = null
        if (heroBannerCategory && heroBannerCategory.categoryId) {
          if (typeof heroBannerCategory.categoryId === 'object' && heroBannerCategory.categoryId._id) {
            heroBannerCategoryId = heroBannerCategory.categoryId._id
          } else if (typeof heroBannerCategory.categoryId === 'string') {
            heroBannerCategoryId = heroBannerCategory.categoryId
          }
        }
        
        if (heroBannerCategoryId) {
          // Fetch banners filtered by herobanner category ID from API (as per requirement)
          const filteredResponse = await publicBannersAPI.getAll({ categoryId: heroBannerCategoryId })
          
          if (filteredResponse.data) {
            if (filteredResponse.data.banners && Array.isArray(filteredResponse.data.banners)) {
              bannersData = filteredResponse.data.banners
            } else if (Array.isArray(filteredResponse.data)) {
              bannersData = filteredResponse.data
            } else if (filteredResponse.data.data && Array.isArray(filteredResponse.data.data)) {
              bannersData = filteredResponse.data.data
            }
          }
        } else {
          // If herobanner category not found, filter client-side as fallback
          bannersData = allBannersData.filter(banner => {
            if (!banner.categoryId) return false
            if (typeof banner.categoryId === 'object' && banner.categoryId.name) {
              return banner.categoryId.name.toLowerCase() === 'herobanner'
            }
            return false
          })
        }
        
        setBanners(bannersData)
      } catch (error) {
        console.error('Error fetching banners:', error)
        toast.error('Failed to load banners')
      } finally {
        setLoading(false)
      }
    }

    fetchBanners()
  }, [])

  useEffect(() => {
    const fetchDecorationCategories = async () => {
      try {
        setCategoriesLoading(true)
        const response = await publicDecorationCategoriesAPI.getAll({ active: 'true' })
        
        let categoriesData = []
        if (response.data) {
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
        console.error('Error fetching decoration categories:', error)
        // Don't show error toast, just log it
      } finally {
        setCategoriesLoading(false)
      }
    }

    fetchDecorationCategories()
  }, [])

  useEffect(() => {
    const fetchOccasionSpecials = async () => {
      try {
        setOccasionSpecialsLoading(true)
        const response = await publicOccasionSpecialsAPI.getAll({ active: 'true' })
        
        let occasionSpecialsData = []
        if (response.data) {
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
        console.error('Error fetching occasion specials:', error)
        // Don't show error toast, just log it
      } finally {
        setOccasionSpecialsLoading(false)
      }
    }

    fetchOccasionSpecials()
  }, [])

  useEffect(() => {
    const fetchBirthdayBanner = async () => {
      try {
        setBirthdayBannerLoading(true)
        // Fetch all banners
        const bannerResponse = await publicBannersAPI.getAll()
        let allBanners = []
        if (bannerResponse.data) {
          if (bannerResponse.data.banners && Array.isArray(bannerResponse.data.banners)) {
            allBanners = bannerResponse.data.banners
          } else if (Array.isArray(bannerResponse.data)) {
            allBanners = bannerResponse.data
          } else if (bannerResponse.data.data && Array.isArray(bannerResponse.data.data)) {
            allBanners = bannerResponse.data.data
          }
        }
        
        // Find banner with "birthday" in title (case insensitive)
        const birthdayBanner = allBanners.find(banner => 
          banner.title && banner.title.toLowerCase().includes('birthday')
        )
        
        if (birthdayBanner) {
          setBirthdayBanner(birthdayBanner)
        }
      } catch (error) {
        console.error('Error fetching birthday banner:', error)
      } finally {
        setBirthdayBannerLoading(false)
      }
    }

    fetchBirthdayBanner()
  }, [])

  // Fetch baby banner (babysection category)
  useEffect(() => {
    const fetchBabyBanner = async () => {
      try {
        setBabyBannerLoading(true)
        // First, fetch all banners to find the babysection category ID
        const allBannersResponse = await publicBannersAPI.getAll()
        
        let allBannersData = []
        if (allBannersResponse.data) {
          if (allBannersResponse.data.banners && Array.isArray(allBannersResponse.data.banners)) {
            allBannersData = allBannersResponse.data.banners
          } else if (Array.isArray(allBannersResponse.data)) {
            allBannersData = allBannersResponse.data
          } else if (allBannersResponse.data.data && Array.isArray(allBannersResponse.data.data)) {
            allBannersData = allBannersResponse.data.data
          }
        }
        
        // Find the babysection category ID from banners
        const babyBannerCategory = allBannersData.find(banner => 
          banner.categoryId && 
          (banner.categoryId.name || banner.categoryId) && 
          (banner.categoryId.name?.toLowerCase() === 'babysection' || 
           (typeof banner.categoryId === 'string' && banner.categoryId.toLowerCase() === 'babysection'))
        )
        
        let babyBannerData = null
        
        // Get categoryId - handle both populated object and string ID
        let babyBannerCategoryId = null
        if (babyBannerCategory && babyBannerCategory.categoryId) {
          if (typeof babyBannerCategory.categoryId === 'object' && babyBannerCategory.categoryId._id) {
            babyBannerCategoryId = babyBannerCategory.categoryId._id
          } else if (typeof babyBannerCategory.categoryId === 'string') {
            babyBannerCategoryId = babyBannerCategory.categoryId
          }
        }
        
        if (babyBannerCategoryId) {
          // Fetch banners filtered by babysection category ID from API
          const filteredResponse = await publicBannersAPI.getAll({ categoryId: babyBannerCategoryId })
          
          if (filteredResponse.data) {
            if (filteredResponse.data.banners && Array.isArray(filteredResponse.data.banners)) {
              babyBannerData = filteredResponse.data.banners[0] || null
            } else if (Array.isArray(filteredResponse.data) && filteredResponse.data.length > 0) {
              babyBannerData = filteredResponse.data[0]
            } else if (filteredResponse.data.data && Array.isArray(filteredResponse.data.data) && filteredResponse.data.data.length > 0) {
              babyBannerData = filteredResponse.data.data[0]
            }
          }
        } else {
          // If babysection category not found, filter client-side as fallback
          const filteredBanners = allBannersData.filter(banner => {
            if (!banner.categoryId) return false
            if (typeof banner.categoryId === 'object' && banner.categoryId.name) {
              return banner.categoryId.name.toLowerCase() === 'babysection'
            }
            return false
          })
          babyBannerData = filteredBanners[0] || null
        }
        
        if (babyBannerData) {
          setBabyBanner(babyBannerData)
        }
      } catch (error) {
        console.error('Error fetching baby banner:', error)
      } finally {
        setBabyBannerLoading(false)
      }
    }

    fetchBabyBanner()
  }, [])

  // Fetch romantic banner (romanticsection category)
  useEffect(() => {
    const fetchRomanticBanner = async () => {
      try {
        setRomanticBannerLoading(true)
        // First, fetch all banners to find the romanticsection category ID
        const allBannersResponse = await publicBannersAPI.getAll()
        
        let allBannersData = []
        if (allBannersResponse.data) {
          if (allBannersResponse.data.banners && Array.isArray(allBannersResponse.data.banners)) {
            allBannersData = allBannersResponse.data.banners
          } else if (Array.isArray(allBannersResponse.data)) {
            allBannersData = allBannersResponse.data
          } else if (allBannersResponse.data.data && Array.isArray(allBannersResponse.data.data)) {
            allBannersData = allBannersResponse.data.data
          }
        }
        
        // Find the romanticsection category ID from banners
        const romanticBannerCategory = allBannersData.find(banner => 
          banner.categoryId && 
          (banner.categoryId.name || banner.categoryId) && 
          (banner.categoryId.name?.toLowerCase() === 'romanticsection' || 
           (typeof banner.categoryId === 'string' && banner.categoryId.toLowerCase() === 'romanticsection'))
        )
        
        let romanticBannerData = null
        
        // Get categoryId - handle both populated object and string ID
        let romanticBannerCategoryId = null
        if (romanticBannerCategory && romanticBannerCategory.categoryId) {
          if (typeof romanticBannerCategory.categoryId === 'object' && romanticBannerCategory.categoryId._id) {
            romanticBannerCategoryId = romanticBannerCategory.categoryId._id
          } else if (typeof romanticBannerCategory.categoryId === 'string') {
            romanticBannerCategoryId = romanticBannerCategory.categoryId
          }
        }
        
        if (romanticBannerCategoryId) {
          // Fetch banners filtered by romanticsection category ID from API
          const filteredResponse = await publicBannersAPI.getAll({ categoryId: romanticBannerCategoryId })
          
          if (filteredResponse.data) {
            if (filteredResponse.data.banners && Array.isArray(filteredResponse.data.banners)) {
              romanticBannerData = filteredResponse.data.banners[0] || null
            } else if (Array.isArray(filteredResponse.data) && filteredResponse.data.length > 0) {
              romanticBannerData = filteredResponse.data[0]
            } else if (filteredResponse.data.data && Array.isArray(filteredResponse.data.data) && filteredResponse.data.data.length > 0) {
              romanticBannerData = filteredResponse.data.data[0]
            }
          }
        } else {
          // If romanticsection category not found, filter client-side as fallback
          const filteredBanners = allBannersData.filter(banner => {
            if (!banner.categoryId) return false
            if (typeof banner.categoryId === 'object' && banner.categoryId.name) {
              return banner.categoryId.name.toLowerCase() === 'romanticsection'
            }
            return false
          })
          romanticBannerData = filteredBanners[0] || null
        }
        
        if (romanticBannerData) {
          setRomanticBanner(romanticBannerData)
        }
      } catch (error) {
        console.error('Error fetching romantic banner:', error)
      } finally {
        setRomanticBannerLoading(false)
      }
    }

    fetchRomanticBanner()
  }, [])

  // Fetch same day banner (samedaysection category)
  useEffect(() => {
    const fetchSameDayBanner = async () => {
      try {
        setSameDayBannerLoading(true)
        // First, fetch all banners to find the samedaysection category ID
        const allBannersResponse = await publicBannersAPI.getAll()
        
        let allBannersData = []
        if (allBannersResponse.data) {
          if (allBannersResponse.data.banners && Array.isArray(allBannersResponse.data.banners)) {
            allBannersData = allBannersResponse.data.banners
          } else if (Array.isArray(allBannersResponse.data)) {
            allBannersData = allBannersResponse.data
          } else if (allBannersResponse.data.data && Array.isArray(allBannersResponse.data.data)) {
            allBannersData = allBannersResponse.data.data
          }
        }
        
        // Find the samedaysection category ID from banners
        const sameDayBannerCategory = allBannersData.find(banner => 
          banner.categoryId && 
          (banner.categoryId.name || banner.categoryId) && 
          (banner.categoryId.name?.toLowerCase() === 'samedaysection' || 
           (typeof banner.categoryId === 'string' && banner.categoryId.toLowerCase() === 'samedaysection'))
        )
        
        let sameDayBannerData = null
        
        // Get categoryId - handle both populated object and string ID
        let sameDayBannerCategoryId = null
        if (sameDayBannerCategory && sameDayBannerCategory.categoryId) {
          if (typeof sameDayBannerCategory.categoryId === 'object' && sameDayBannerCategory.categoryId._id) {
            sameDayBannerCategoryId = sameDayBannerCategory.categoryId._id
          } else if (typeof sameDayBannerCategory.categoryId === 'string') {
            sameDayBannerCategoryId = sameDayBannerCategory.categoryId
          }
        }
        
        if (sameDayBannerCategoryId) {
          // Fetch banners filtered by samedaysection category ID from API
          const filteredResponse = await publicBannersAPI.getAll({ categoryId: sameDayBannerCategoryId })
          
          if (filteredResponse.data) {
            if (filteredResponse.data.banners && Array.isArray(filteredResponse.data.banners)) {
              sameDayBannerData = filteredResponse.data.banners[0] || null
            } else if (Array.isArray(filteredResponse.data) && filteredResponse.data.length > 0) {
              sameDayBannerData = filteredResponse.data[0]
            } else if (filteredResponse.data.data && Array.isArray(filteredResponse.data.data) && filteredResponse.data.data.length > 0) {
              sameDayBannerData = filteredResponse.data.data[0]
            }
          }
        } else {
          // If samedaysection category not found, filter client-side as fallback
          const filteredBanners = allBannersData.filter(banner => {
            if (!banner.categoryId) return false
            if (typeof banner.categoryId === 'object' && banner.categoryId.name) {
              return banner.categoryId.name.toLowerCase() === 'samedaysection'
            }
            return false
          })
          sameDayBannerData = filteredBanners[0] || null
        }
        
        if (sameDayBannerData) {
          setSameDayBanner(sameDayBannerData)
        }
      } catch (error) {
        console.error('Error fetching same day banner:', error)
      } finally {
        setSameDayBannerLoading(false)
      }
    }

    fetchSameDayBanner()
  }, [])

  // Fetch corporate banner (corporatesection category)
  useEffect(() => {
    const fetchCorporateBanner = async () => {
      try {
        setCorporateBannerLoading(true)
        // First, fetch all banners to find the corporatesection category ID
        const allBannersResponse = await publicBannersAPI.getAll()
        
        let allBannersData = []
        if (allBannersResponse.data) {
          if (allBannersResponse.data.banners && Array.isArray(allBannersResponse.data.banners)) {
            allBannersData = allBannersResponse.data.banners
          } else if (Array.isArray(allBannersResponse.data)) {
            allBannersData = allBannersResponse.data
          } else if (allBannersResponse.data.data && Array.isArray(allBannersResponse.data.data)) {
            allBannersData = allBannersResponse.data.data
          }
        }
        
        // Find the corporatesection category ID from banners
        const corporateBannerCategory = allBannersData.find(banner => 
          banner.categoryId && 
          (banner.categoryId.name || banner.categoryId) && 
          (banner.categoryId.name?.toLowerCase() === 'corporatesection' || 
           (typeof banner.categoryId === 'string' && banner.categoryId.toLowerCase() === 'corporatesection'))
        )
        
        let corporateBannerData = null
        
        // Get categoryId - handle both populated object and string ID
        let corporateBannerCategoryId = null
        if (corporateBannerCategory && corporateBannerCategory.categoryId) {
          if (typeof corporateBannerCategory.categoryId === 'object' && corporateBannerCategory.categoryId._id) {
            corporateBannerCategoryId = corporateBannerCategory.categoryId._id
          } else if (typeof corporateBannerCategory.categoryId === 'string') {
            corporateBannerCategoryId = corporateBannerCategory.categoryId
          }
        }
        
        if (corporateBannerCategoryId) {
          // Fetch banners filtered by corporatesection category ID from API
          const filteredResponse = await publicBannersAPI.getAll({ categoryId: corporateBannerCategoryId })
          
          if (filteredResponse.data) {
            if (filteredResponse.data.banners && Array.isArray(filteredResponse.data.banners)) {
              corporateBannerData = filteredResponse.data.banners[0] || null
            } else if (Array.isArray(filteredResponse.data) && filteredResponse.data.length > 0) {
              corporateBannerData = filteredResponse.data[0]
            } else if (filteredResponse.data.data && Array.isArray(filteredResponse.data.data) && filteredResponse.data.data.length > 0) {
              corporateBannerData = filteredResponse.data.data[0]
            }
          }
        } else {
          // If corporatesection category not found, filter client-side as fallback
          const filteredBanners = allBannersData.filter(banner => {
            if (!banner.categoryId) return false
            if (typeof banner.categoryId === 'object' && banner.categoryId.name) {
              return banner.categoryId.name.toLowerCase() === 'corporatesection'
            }
            return false
          })
          corporateBannerData = filteredBanners[0] || null
        }
        
        if (corporateBannerData) {
          setCorporateBanner(corporateBannerData)
        }
      } catch (error) {
        console.error('Error fetching corporate banner:', error)
      } finally {
        setCorporateBannerLoading(false)
      }
    }

    fetchCorporateBanner()
  }, [])

  // Fetch birthday venues from decoration categories and occasion specials
  useEffect(() => {
    const fetchBirthdayVenues = async () => {
      try {
        setBirthdayVenuesLoading(true)
        
        // Find decoration categories with "birthday" in name
        const birthdayDecorationCategories = decorationCategories.filter(cat => 
          cat.name && cat.name.toLowerCase().includes('birthday')
        )
        
        // Find occasion specials with "birthday" in name
        const birthdayOccasionSpecials = occasionSpecials.filter(special => 
          special.name && special.name.toLowerCase().includes('birthday')
        )
        
        // Collect all venue IDs to avoid duplicates
        const venueIds = new Set()
        const allVenues = []
        
        // Fetch venues for birthday decoration categories
        for (const category of birthdayDecorationCategories) {
          try {
            const categoryId = category._id || category.id
            
            // Try active status first, then fallback to approved
            // Reduced limit for faster loading
            let venuesResponse = await publicVenuesAPI.getAll({ 
              decorationCategoryId: categoryId,
              status: 'active',
              limit: '12'
            })
            
            // Parse venues data
            let venuesData = []
            if (venuesResponse.data) {
              if (venuesResponse.data.venues && Array.isArray(venuesResponse.data.venues)) {
                venuesData = venuesResponse.data.venues
              } else if (venuesResponse.data.data && Array.isArray(venuesResponse.data.data)) {
                venuesData = venuesResponse.data.data
              } else if (Array.isArray(venuesResponse.data)) {
                venuesData = venuesResponse.data
              }
            }
            
            // If no venues found with active status, try approved status
            if (venuesData.length === 0) {
              venuesResponse = await publicVenuesAPI.getAll({ 
                decorationCategoryId: categoryId,
                status: 'approved',
                limit: '12'
              })
              
              // Parse venues data again
              if (venuesResponse.data) {
                if (venuesResponse.data.venues && Array.isArray(venuesResponse.data.venues)) {
                  venuesData = venuesResponse.data.venues
                } else if (venuesResponse.data.data && Array.isArray(venuesResponse.data.data)) {
                  venuesData = venuesResponse.data.data
                } else if (Array.isArray(venuesResponse.data)) {
                  venuesData = venuesResponse.data
                }
              }
            }
            
            
            venuesData.forEach(venue => {
              const venueId = venue._id || venue.id
              if (!venueIds.has(venueId)) {
                venueIds.add(venueId)
                allVenues.push(venue)
              }
            })
          } catch (error) {
            console.error(`❌ Error fetching venues for decoration category ${category.name}:`, error)
          }
        }
        
        // Fetch venues for birthday occasion specials
        for (const special of birthdayOccasionSpecials) {
          try {
            const specialId = special._id || special.id
            
            // Try active status first, then fallback to approved
            let venuesResponse = await publicVenuesAPI.getAll({ 
              occasionSpecialId: specialId,
              status: 'active',
              limit: '12'
            })
            
            // If no venues found with active status, try approved status
            let venuesData = []
            if (venuesResponse.data) {
              if (venuesResponse.data.venues && Array.isArray(venuesResponse.data.venues)) {
                venuesData = venuesResponse.data.venues
              } else if (venuesResponse.data.data && Array.isArray(venuesResponse.data.data)) {
                venuesData = venuesResponse.data.data
              } else if (Array.isArray(venuesResponse.data)) {
                venuesData = venuesResponse.data
              }
            }
            
            if (venuesData.length === 0) {
              venuesResponse = await publicVenuesAPI.getAll({ 
                occasionSpecialId: specialId,
                status: 'approved',
                limit: '12'
              })
              
              // Parse venues data again
              if (venuesResponse.data) {
                if (venuesResponse.data.venues && Array.isArray(venuesResponse.data.venues)) {
                  venuesData = venuesResponse.data.venues
                } else if (venuesResponse.data.data && Array.isArray(venuesResponse.data.data)) {
                  venuesData = venuesResponse.data.data
                } else if (Array.isArray(venuesResponse.data)) {
                  venuesData = venuesResponse.data
                }
              }
            }
            
            
            
            venuesData.forEach(venue => {
              const venueId = venue._id || venue.id
              if (!venueIds.has(venueId)) {
                venueIds.add(venueId)
                allVenues.push(venue)
              }
            })
          } catch (error) {
            console.error(`❌ Error fetching venues for occasion special ${special.name}:`, error)
          }
        }
        
        // Format venues for display (limit to 5)
        const formattedVenues = allVenues.slice(0, 5).map(venue => {
          let ratingValue = 0
          if (venue.rating) {
            if (typeof venue.rating === 'object' && venue.rating.average !== undefined) {
              ratingValue = Number(venue.rating.average) || 0
            } else if (typeof venue.rating === 'number') {
              ratingValue = venue.rating
            }
          }
          
          let reviewsCount = 0
          if (venue.reviewCount !== undefined) {
            reviewsCount = Number(venue.reviewCount) || 0
          } else if (venue.rating && typeof venue.rating === 'object' && venue.rating.totalReviews !== undefined) {
            reviewsCount = Number(venue.rating.totalReviews) || 0
          }
          
          const priceInfo = formatPrice(venue)
          return {
            id: venue._id || venue.id,
            name: venue.name || 'Unnamed Venue',
            image: getVenueImageUrl(venue.images || venue.image || venue.coverImage),
            rating: ratingValue,
            reviews: reviewsCount,
            location: formatLocation(venue.location),
            categoryId: venue.categoryId,
            category: venue.category,
            price: priceInfo.price,
            priceSuffix: priceInfo.suffix,
            pricingInfo: venue.pricingInfo,
            minPricePerPlateVeg: venue.minPricePerPlateVeg,
            minPricePerPlateNonVeg: venue.minPricePerPlateNonVeg,
            pricePerPlate: venue.pricePerPlate,
            minPrice: venue.minPrice,
            originalPrice: venue.price
          }
        })
        
        setBirthdayVenues(formattedVenues)
      } catch (error) {
        console.error('❌ Error fetching birthday venues:', error)
      } finally {
        setBirthdayVenuesLoading(false)
      }
    }

    // Only fetch if decoration categories and occasion specials are loaded
    if (!categoriesLoading && !occasionSpecialsLoading && (decorationCategories.length > 0 || occasionSpecials.length > 0)) {
      fetchBirthdayVenues()
    }
  }, [decorationCategories, occasionSpecials, categoriesLoading, occasionSpecialsLoading])

  // Fetch baby venues from decoration categories and occasion specials
  useEffect(() => {
    const fetchBabyVenues = async () => {
      try {
        setBabyVenuesLoading(true)
        
        
        // Find decoration categories with "baby shower" or "baby welcome" in name
        const babyDecorationCategories = decorationCategories.filter(cat => 
          cat.name && (
            cat.name.toLowerCase().includes('baby shower') || 
            cat.name.toLowerCase().includes('baby welcome')
          )
        )
        
        // Find occasion specials with "baby shower" or "baby welcome" in name
        const babyOccasionSpecials = occasionSpecials.filter(special => 
          special.name && (
            special.name.toLowerCase().includes('baby shower') || 
            special.name.toLowerCase().includes('baby welcome')
          )
        )
        
        
        // Collect all venue IDs to avoid duplicates
        const venueIds = new Set()
        const allVenues = []
        
        // Fetch venues for baby decoration categories
        for (const category of babyDecorationCategories) {
          try {
            const categoryId = category._id || category.id
            
            let venuesResponse = await publicVenuesAPI.getAll({ 
              decorationCategoryId: categoryId,
              status: 'active',
              limit: '12'
            })
            
            
            let venuesData = []
            if (venuesResponse.data) {
              if (venuesResponse.data.venues && Array.isArray(venuesResponse.data.venues)) {
                venuesData = venuesResponse.data.venues
              } else if (venuesResponse.data.data && Array.isArray(venuesResponse.data.data)) {
                venuesData = venuesResponse.data.data
              } else if (Array.isArray(venuesResponse.data)) {
                venuesData = venuesResponse.data
              }
            }
            
            if (venuesData.length === 0) {
              venuesResponse = await publicVenuesAPI.getAll({ 
                decorationCategoryId: categoryId,
                status: 'approved',
                limit: '12'
              })
              
              
              if (venuesResponse.data) {
                if (venuesResponse.data.venues && Array.isArray(venuesResponse.data.venues)) {
                  venuesData = venuesResponse.data.venues
                } else if (venuesResponse.data.data && Array.isArray(venuesResponse.data.data)) {
                  venuesData = venuesResponse.data.data
                } else if (Array.isArray(venuesResponse.data)) {
                  venuesData = venuesResponse.data
                }
              }
            }
            
            
            venuesData.forEach(venue => {
              const venueId = venue._id || venue.id
              if (!venueIds.has(venueId)) {
                venueIds.add(venueId)
                allVenues.push(venue)
              }
            })
          } catch (error) {
            console.error(`❌ Error fetching venues for decoration category ${category.name}:`, error)
          }
        }
        
        // Fetch venues for baby occasion specials
        for (const special of babyOccasionSpecials) {
          try {
            const specialId = special._id || special.id
            
            let venuesResponse = await publicVenuesAPI.getAll({ 
              occasionSpecialId: specialId,
              status: 'active',
              limit: '12'
            })
            
            let venuesData = []
            if (venuesResponse.data) {
              if (venuesResponse.data.venues && Array.isArray(venuesResponse.data.venues)) {
                venuesData = venuesResponse.data.venues
              } else if (venuesResponse.data.data && Array.isArray(venuesResponse.data.data)) {
                venuesData = venuesResponse.data.data
              } else if (Array.isArray(venuesResponse.data)) {
                venuesData = venuesResponse.data
              }
            }
            
            if (venuesData.length === 0) {
              venuesResponse = await publicVenuesAPI.getAll({ 
                occasionSpecialId: specialId,
                status: 'approved',
                limit: '12'
              })
              
              if (venuesResponse.data) {
                if (venuesResponse.data.venues && Array.isArray(venuesResponse.data.venues)) {
                  venuesData = venuesResponse.data.venues
                } else if (venuesResponse.data.data && Array.isArray(venuesResponse.data.data)) {
                  venuesData = venuesResponse.data.data
                } else if (Array.isArray(venuesResponse.data)) {
                  venuesData = venuesResponse.data
                }
              }
            }
            
            
            
            venuesData.forEach(venue => {
              const venueId = venue._id || venue.id
              if (!venueIds.has(venueId)) {
                venueIds.add(venueId)
                allVenues.push(venue)
              }
            })
          } catch (error) {
            console.error(`❌ Error fetching venues for occasion special ${special.name}:`, error)
          }
        }
        
        
        // Format venues for display (limit to 5)
        const formattedVenues = allVenues.slice(0, 5).map(venue => {
          let ratingValue = 0
          if (venue.rating) {
            if (typeof venue.rating === 'object' && venue.rating.average !== undefined) {
              ratingValue = Number(venue.rating.average) || 0
            } else if (typeof venue.rating === 'number') {
              ratingValue = venue.rating
            }
          }
          
          let reviewsCount = 0
          if (venue.reviewCount !== undefined) {
            reviewsCount = Number(venue.reviewCount) || 0
          } else if (venue.rating && typeof venue.rating === 'object' && venue.rating.totalReviews !== undefined) {
            reviewsCount = Number(venue.rating.totalReviews) || 0
          }
          
          const priceInfo = formatPrice(venue)
          return {
            id: venue._id || venue.id,
            name: venue.name || 'Unnamed Venue',
            image: getVenueImageUrl(venue.images || venue.image || venue.coverImage),
            rating: ratingValue,
            reviews: reviewsCount,
            location: formatLocation(venue.location),
            categoryId: venue.categoryId,
            category: venue.category,
            price: priceInfo.price,
            priceSuffix: priceInfo.suffix
          }
        })
        
        
        setBabyVenues(formattedVenues)
      } catch (error) {
        console.error('❌ Error fetching baby venues:', error)
      } finally {
        setBabyVenuesLoading(false)
      }
    }

    // Only fetch if decoration categories and occasion specials are loaded
    if (!categoriesLoading && !occasionSpecialsLoading && (decorationCategories.length > 0 || occasionSpecials.length > 0)) {
      fetchBabyVenues()
    }
  }, [decorationCategories, occasionSpecials, categoriesLoading, occasionSpecialsLoading])

  // Fetch romantic venues from decoration categories and occasion specials
  useEffect(() => {
    const fetchRomanticVenues = async () => {
      try {
        setRomanticVenuesLoading(true)
        
        
        // Find decoration categories with romantic keywords
        const romanticDecorationCategories = decorationCategories.filter(cat => 
          cat.name && (
            cat.name.toLowerCase().includes('first night decoration') || 
            cat.name.toLowerCase().includes('anniversary decoration') || 
            cat.name.toLowerCase().includes('candlelight dinner')
          )
        )
        
        // Find occasion specials with romantic keywords
        const romanticOccasionSpecials = occasionSpecials.filter(special => 
          special.name && (
            special.name.toLowerCase().includes('first night decoration') || 
            special.name.toLowerCase().includes('anniversary decoration') || 
            special.name.toLowerCase().includes('candlelight dinner')
          )
        )
        
        
        // Collect all venue IDs to avoid duplicates
        const venueIds = new Set()
        const allVenues = []
        
        // Fetch venues for romantic decoration categories
        for (const category of romanticDecorationCategories) {
          try {
            const categoryId = category._id || category.id
            
            let venuesResponse = await publicVenuesAPI.getAll({ 
              decorationCategoryId: categoryId,
              status: 'active',
              limit: '12'
            })
            
            
            let venuesData = []
            if (venuesResponse.data) {
              if (venuesResponse.data.venues && Array.isArray(venuesResponse.data.venues)) {
                venuesData = venuesResponse.data.venues
              } else if (venuesResponse.data.data && Array.isArray(venuesResponse.data.data)) {
                venuesData = venuesResponse.data.data
              } else if (Array.isArray(venuesResponse.data)) {
                venuesData = venuesResponse.data
              }
            }
            
            if (venuesData.length === 0) {
              venuesResponse = await publicVenuesAPI.getAll({ 
                decorationCategoryId: categoryId,
                status: 'approved',
                limit: '12'
              })
              
              
              if (venuesResponse.data) {
                if (venuesResponse.data.venues && Array.isArray(venuesResponse.data.venues)) {
                  venuesData = venuesResponse.data.venues
                } else if (venuesResponse.data.data && Array.isArray(venuesResponse.data.data)) {
                  venuesData = venuesResponse.data.data
                } else if (Array.isArray(venuesResponse.data)) {
                  venuesData = venuesResponse.data
                }
              }
            }
            
            
            venuesData.forEach(venue => {
              const venueId = venue._id || venue.id
              if (!venueIds.has(venueId)) {
                venueIds.add(venueId)
                allVenues.push(venue)
              }
            })
          } catch (error) {
            console.error(`❌ Error fetching venues for decoration category ${category.name}:`, error)
          }
        }
        
        // Fetch venues for romantic occasion specials
        for (const special of romanticOccasionSpecials) {
          try {
            const specialId = special._id || special.id
            
            let venuesResponse = await publicVenuesAPI.getAll({ 
              occasionSpecialId: specialId,
              status: 'active',
              limit: '12'
            })
            
            let venuesData = []
            if (venuesResponse.data) {
              if (venuesResponse.data.venues && Array.isArray(venuesResponse.data.venues)) {
                venuesData = venuesResponse.data.venues
              } else if (venuesResponse.data.data && Array.isArray(venuesResponse.data.data)) {
                venuesData = venuesResponse.data.data
              } else if (Array.isArray(venuesResponse.data)) {
                venuesData = venuesResponse.data
              }
            }
            
            if (venuesData.length === 0) {
              venuesResponse = await publicVenuesAPI.getAll({ 
                occasionSpecialId: specialId,
                status: 'approved',
                limit: '12'
              })
              
              if (venuesResponse.data) {
                if (venuesResponse.data.venues && Array.isArray(venuesResponse.data.venues)) {
                  venuesData = venuesResponse.data.venues
                } else if (venuesResponse.data.data && Array.isArray(venuesResponse.data.data)) {
                  venuesData = venuesResponse.data.data
                } else if (Array.isArray(venuesResponse.data)) {
                  venuesData = venuesResponse.data
                }
              }
            }
            
            
            
            venuesData.forEach(venue => {
              const venueId = venue._id || venue.id
              if (!venueIds.has(venueId)) {
                venueIds.add(venueId)
                allVenues.push(venue)
              }
            })
          } catch (error) {
            console.error(`❌ Error fetching venues for occasion special ${special.name}:`, error)
          }
        }
        
        
        // Format venues for display (limit to 5)
        const formattedVenues = allVenues.slice(0, 5).map(venue => {
          let ratingValue = 0
          if (venue.rating) {
            if (typeof venue.rating === 'object' && venue.rating.average !== undefined) {
              ratingValue = Number(venue.rating.average) || 0
            } else if (typeof venue.rating === 'number') {
              ratingValue = venue.rating
            }
          }
          
          let reviewsCount = 0
          if (venue.reviewCount !== undefined) {
            reviewsCount = Number(venue.reviewCount) || 0
          } else if (venue.rating && typeof venue.rating === 'object' && venue.rating.totalReviews !== undefined) {
            reviewsCount = Number(venue.rating.totalReviews) || 0
          }
          
          const priceInfo = formatPrice(venue)
          return {
            id: venue._id || venue.id,
            name: venue.name || 'Unnamed Venue',
            image: getVenueImageUrl(venue.images || venue.image || venue.coverImage),
            rating: ratingValue,
            reviews: reviewsCount,
            location: formatLocation(venue.location),
            categoryId: venue.categoryId,
            category: venue.category,
            price: priceInfo.price,
            priceSuffix: priceInfo.suffix
          }
        })
        
        
        setRomanticVenues(formattedVenues)
      } catch (error) {
        console.error('❌ Error fetching romantic venues:', error)
      } finally {
        setRomanticVenuesLoading(false)
      }
    }

    // Only fetch if decoration categories and occasion specials are loaded
    if (!categoriesLoading && !occasionSpecialsLoading && (decorationCategories.length > 0 || occasionSpecials.length > 0)) {
      fetchRomanticVenues()
    }
  }, [decorationCategories, occasionSpecials, categoriesLoading, occasionSpecialsLoading])

  // Fetch same day venues from decoration categories and occasion specials
  useEffect(() => {
    const fetchSameDayVenues = async () => {
      try {
        setSameDayVenuesLoading(true)
        
        
        // Find decoration categories with same day keywords
        const sameDayDecorationCategories = decorationCategories.filter(cat => {
          if (!cat.name) return false
          const nameLower = cat.name.toLowerCase()
          return (
            nameLower.includes('games') && nameLower.includes('activities') ||
            nameLower.includes('games & activities') ||
            nameLower.includes('same day') && nameLower.includes('decoration') ||
            nameLower.includes('same day decoration') ||
            nameLower === 'games & activities' ||
            nameLower === 'same day decorations'
          )
        })
        
        // Find occasion specials with same day keywords
        const sameDayOccasionSpecials = occasionSpecials.filter(special => {
          if (!special.name) return false
          const nameLower = special.name.toLowerCase()
          return (
            nameLower.includes('games') && nameLower.includes('activities') ||
            nameLower.includes('games & activities') ||
            nameLower.includes('same day') && nameLower.includes('decoration') ||
            nameLower.includes('same day decoration') ||
            nameLower === 'games & activities' ||
            nameLower === 'same day decorations'
          )
        })
        
        
        // Collect all venue IDs to avoid duplicates
        const venueIds = new Set()
        const allVenues = []
        
        // Fetch venues for same day decoration categories
        for (const category of sameDayDecorationCategories) {
          try {
            const categoryId = category._id || category.id
            
            let venuesResponse = await publicVenuesAPI.getAll({ 
              decorationCategoryId: categoryId,
              status: 'active',
              limit: '12'
            })
            
            
            let venuesData = []
            if (venuesResponse.data) {
              if (venuesResponse.data.venues && Array.isArray(venuesResponse.data.venues)) {
                venuesData = venuesResponse.data.venues
              } else if (venuesResponse.data.data && Array.isArray(venuesResponse.data.data)) {
                venuesData = venuesResponse.data.data
              } else if (Array.isArray(venuesResponse.data)) {
                venuesData = venuesResponse.data
              }
            }
            
            if (venuesData.length === 0) {
              venuesResponse = await publicVenuesAPI.getAll({ 
                decorationCategoryId: categoryId,
                status: 'approved',
                limit: '12'
              })
              
              
              if (venuesResponse.data) {
                if (venuesResponse.data.venues && Array.isArray(venuesResponse.data.venues)) {
                  venuesData = venuesResponse.data.venues
                } else if (venuesResponse.data.data && Array.isArray(venuesResponse.data.data)) {
                  venuesData = venuesResponse.data.data
                } else if (Array.isArray(venuesResponse.data)) {
                  venuesData = venuesResponse.data
                }
              }
            }
            
            
            venuesData.forEach(venue => {
              const venueId = venue._id || venue.id
              if (!venueIds.has(venueId)) {
                venueIds.add(venueId)
                allVenues.push(venue)
              }
            })
          } catch (error) {
            console.error(`❌ Error fetching venues for decoration category ${category.name}:`, error)
          }
        }
        
        // Fetch venues for same day occasion specials
        for (const special of sameDayOccasionSpecials) {
          try {
            const specialId = special._id || special.id
            
            let venuesResponse = await publicVenuesAPI.getAll({ 
              occasionSpecialId: specialId,
              status: 'active',
              limit: '12'
            })
            
            let venuesData = []
            if (venuesResponse.data) {
              if (venuesResponse.data.venues && Array.isArray(venuesResponse.data.venues)) {
                venuesData = venuesResponse.data.venues
              } else if (venuesResponse.data.data && Array.isArray(venuesResponse.data.data)) {
                venuesData = venuesResponse.data.data
              } else if (Array.isArray(venuesResponse.data)) {
                venuesData = venuesResponse.data
              }
            }
            
            if (venuesData.length === 0) {
              venuesResponse = await publicVenuesAPI.getAll({ 
                occasionSpecialId: specialId,
                status: 'approved',
                limit: '12'
              })
              
              if (venuesResponse.data) {
                if (venuesResponse.data.venues && Array.isArray(venuesResponse.data.venues)) {
                  venuesData = venuesResponse.data.venues
                } else if (venuesResponse.data.data && Array.isArray(venuesResponse.data.data)) {
                  venuesData = venuesResponse.data.data
                } else if (Array.isArray(venuesResponse.data)) {
                  venuesData = venuesResponse.data
                }
              }
            }
            
            
            
            venuesData.forEach(venue => {
              const venueId = venue._id || venue.id
              if (!venueIds.has(venueId)) {
                venueIds.add(venueId)
                allVenues.push(venue)
              }
            })
          } catch (error) {
            console.error(`❌ Error fetching venues for occasion special ${special.name}:`, error)
          }
        }
        
        
        // Format venues for display (limit to 5)
        const formattedVenues = allVenues.slice(0, 5).map(venue => {
          let ratingValue = 0
          if (venue.rating) {
            if (typeof venue.rating === 'object' && venue.rating.average !== undefined) {
              ratingValue = Number(venue.rating.average) || 0
            } else if (typeof venue.rating === 'number') {
              ratingValue = venue.rating
            }
          }
          
          let reviewsCount = 0
          if (venue.reviewCount !== undefined) {
            reviewsCount = Number(venue.reviewCount) || 0
          } else if (venue.rating && typeof venue.rating === 'object' && venue.rating.totalReviews !== undefined) {
            reviewsCount = Number(venue.rating.totalReviews) || 0
          }
          
          const priceInfo = formatPrice(venue)
          return {
            id: venue._id || venue.id,
            name: venue.name || 'Unnamed Venue',
            image: getVenueImageUrl(venue.images || venue.image || venue.coverImage),
            rating: ratingValue,
            reviews: reviewsCount,
            location: formatLocation(venue.location),
            categoryId: venue.categoryId,
            category: venue.category,
            price: priceInfo.price,
            priceSuffix: priceInfo.suffix
          }
        })
        
        
        setSameDayVenues(formattedVenues)
      } catch (error) {
        console.error('❌ Error fetching same day venues:', error)
      } finally {
        setSameDayVenuesLoading(false)
      }
    }

    // Only fetch if decoration categories and occasion specials are loaded
    if (!categoriesLoading && !occasionSpecialsLoading && (decorationCategories.length > 0 || occasionSpecials.length > 0)) {
      fetchSameDayVenues()
    }
  }, [decorationCategories, occasionSpecials, categoriesLoading, occasionSpecialsLoading])

  // Fetch corporate venues from decoration categories and occasion specials
  useEffect(() => {
    const fetchCorporateVenues = async () => {
      try {
        setCorporateVenuesLoading(true)
        
        
        // Find decoration categories with corporate events keywords
        const corporateDecorationCategories = decorationCategories.filter(cat => {
          if (!cat.name) return false
          const nameLower = cat.name.toLowerCase()
          return (
            nameLower.includes('corporate') && nameLower.includes('event') ||
            nameLower.includes('corporate event') ||
            nameLower === 'corporate events'
          )
        })
        
        // Find occasion specials with corporate events keywords
        const corporateOccasionSpecials = occasionSpecials.filter(special => {
          if (!special.name) return false
          const nameLower = special.name.toLowerCase()
          return (
            nameLower.includes('corporate') && nameLower.includes('event') ||
            nameLower.includes('corporate event') ||
            nameLower === 'corporate events'
          )
        })
        
        
        // Collect all venue IDs to avoid duplicates
        const venueIds = new Set()
        const allVenues = []
        
        // Fetch venues for corporate decoration categories
        for (const category of corporateDecorationCategories) {
          try {
            const categoryId = category._id || category.id
            
            let venuesResponse = await publicVenuesAPI.getAll({ 
              decorationCategoryId: categoryId,
              status: 'active',
              limit: '12'
            })
            
            
            let venuesData = []
            if (venuesResponse.data) {
              if (venuesResponse.data.venues && Array.isArray(venuesResponse.data.venues)) {
                venuesData = venuesResponse.data.venues
              } else if (venuesResponse.data.data && Array.isArray(venuesResponse.data.data)) {
                venuesData = venuesResponse.data.data
              } else if (Array.isArray(venuesResponse.data)) {
                venuesData = venuesResponse.data
              }
            }
            
            if (venuesData.length === 0) {
              venuesResponse = await publicVenuesAPI.getAll({ 
                decorationCategoryId: categoryId,
                status: 'approved',
                limit: '12'
              })
              
              
              if (venuesResponse.data) {
                if (venuesResponse.data.venues && Array.isArray(venuesResponse.data.venues)) {
                  venuesData = venuesResponse.data.venues
                } else if (venuesResponse.data.data && Array.isArray(venuesResponse.data.data)) {
                  venuesData = venuesResponse.data.data
                } else if (Array.isArray(venuesResponse.data)) {
                  venuesData = venuesResponse.data
                }
              }
            }
            
            
            venuesData.forEach(venue => {
              const venueId = venue._id || venue.id
              if (!venueIds.has(venueId)) {
                venueIds.add(venueId)
                allVenues.push(venue)
              }
            })
          } catch (error) {
            console.error(`❌ Error fetching venues for decoration category ${category.name}:`, error)
          }
        }
        
        // Fetch venues for corporate occasion specials
        for (const special of corporateOccasionSpecials) {
          try {
            const specialId = special._id || special.id
            
            let venuesResponse = await publicVenuesAPI.getAll({ 
              occasionSpecialId: specialId,
              status: 'active',
              limit: '12'
            })
            
            let venuesData = []
            if (venuesResponse.data) {
              if (venuesResponse.data.venues && Array.isArray(venuesResponse.data.venues)) {
                venuesData = venuesResponse.data.venues
              } else if (venuesResponse.data.data && Array.isArray(venuesResponse.data.data)) {
                venuesData = venuesResponse.data.data
              } else if (Array.isArray(venuesResponse.data)) {
                venuesData = venuesResponse.data
              }
            }
            
            if (venuesData.length === 0) {
              venuesResponse = await publicVenuesAPI.getAll({ 
                occasionSpecialId: specialId,
                status: 'approved',
                limit: '12'
              })
              
              if (venuesResponse.data) {
                if (venuesResponse.data.venues && Array.isArray(venuesResponse.data.venues)) {
                  venuesData = venuesResponse.data.venues
                } else if (venuesResponse.data.data && Array.isArray(venuesResponse.data.data)) {
                  venuesData = venuesResponse.data.data
                } else if (Array.isArray(venuesResponse.data)) {
                  venuesData = venuesResponse.data
                }
              }
            }
            
            
            
            venuesData.forEach(venue => {
              const venueId = venue._id || venue.id
              if (!venueIds.has(venueId)) {
                venueIds.add(venueId)
                allVenues.push(venue)
              }
            })
          } catch (error) {
            console.error(`❌ Error fetching venues for occasion special ${special.name}:`, error)
          }
        }
        
        
        // Format venues for display (limit to 5)
        const formattedVenues = allVenues.slice(0, 5).map(venue => {
          let ratingValue = 0
          if (venue.rating) {
            if (typeof venue.rating === 'object' && venue.rating.average !== undefined) {
              ratingValue = Number(venue.rating.average) || 0
            } else if (typeof venue.rating === 'number') {
              ratingValue = venue.rating
            }
          }
          
          let reviewsCount = 0
          if (venue.reviewCount !== undefined) {
            reviewsCount = Number(venue.reviewCount) || 0
          } else if (venue.rating && typeof venue.rating === 'object' && venue.rating.totalReviews !== undefined) {
            reviewsCount = Number(venue.rating.totalReviews) || 0
          }
          
          const priceInfo = formatPrice(venue)
          return {
            id: venue._id || venue.id,
            name: venue.name || 'Unnamed Venue',
            image: getVenueImageUrl(venue.images || venue.image || venue.coverImage),
            rating: ratingValue,
            reviews: reviewsCount,
            location: formatLocation(venue.location),
            categoryId: venue.categoryId,
            category: venue.category,
            price: priceInfo.price,
            priceSuffix: priceInfo.suffix
          }
        })
        
        
        setCorporateVenues(formattedVenues)
      } catch (error) {
        console.error('❌ Error fetching corporate venues:', error)
      } finally {
        setCorporateVenuesLoading(false)
      }
    }

    // Only fetch if decoration categories and occasion specials are loaded
    if (!categoriesLoading && !occasionSpecialsLoading && (decorationCategories.length > 0 || occasionSpecials.length > 0)) {
      fetchCorporateVenues()
    }
  }, [decorationCategories, occasionSpecials, categoriesLoading, occasionSpecialsLoading])

  const handleBannerClick = (banner) => {
    if (banner.link) {
      if (banner.link.startsWith('http://') || banner.link.startsWith('https://')) {
        window.open(banner.link, '_blank')
      } else {
        navigate(banner.link)
      }
    }
  }

  // Progressive loading: Show content after critical data loads or 3 seconds timeout
  useEffect(() => {
    // Check if critical data is loaded (banners and categories)
    const criticalDataLoaded = !loading && !categoriesLoading
    
    // Show content if critical data is loaded OR after 3 seconds
    if (criticalDataLoaded || hasShownContent.current) {
      if (!hasShownContent.current) {
        hasShownContent.current = true
        setShowContent(true)
      }
    }
    
    // Fallback: Show content after 3 seconds regardless
    const timeout = setTimeout(() => {
      if (!hasShownContent.current) {
        hasShownContent.current = true
        setShowContent(true)
      }
    }, 3000)
    
    return () => clearTimeout(timeout)
  }, [loading, categoriesLoading])

  // Check if any data is still loading - but don't block showing content
  const isMainDataLoading = loading || categoriesLoading || occasionSpecialsLoading ||
    birthdayBannerLoading || birthdayVenuesLoading ||
    babyBannerLoading || babyVenuesLoading ||
    romanticBannerLoading || romanticVenuesLoading ||
    sameDayBannerLoading || sameDayVenuesLoading ||
    corporateBannerLoading || corporateVenuesLoading

  // Show shimmer only if critical data is loading AND we haven't shown content yet
  if (isMainDataLoading && !showContent) {
    return (
      <div className="decoration-page">
        <SEO 
          title="Decoration | ShubhVenue"
          description="Explore decoration categories and occasion specials"
          keywords="decoration, party decoration, event decoration"
        />
        <div className="decoration-shimmer-loader">
          {/* Hero Banner Shimmer */}
          <div className="decoration-shimmer-hero"></div>
          
          {/* Categories Section Shimmer */}
          <div className="decoration-shimmer-section">
            <div className="decoration-shimmer-heading"></div>
            <div className="decoration-shimmer-grid">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="decoration-shimmer-card">
                  <div className="decoration-shimmer-image"></div>
                  <div className="decoration-shimmer-content">
                    <div className="decoration-shimmer-title"></div>
                    <div className="decoration-shimmer-text"></div>
                    <div className="decoration-shimmer-row">
                      <div className="decoration-shimmer-rating"></div>
                      <div className="decoration-shimmer-price"></div>
                    </div>
                    <div className="decoration-shimmer-button"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Birthday Section Shimmer */}
          <div className="decoration-shimmer-section">
            <div className="decoration-shimmer-heading"></div>
            <div className="decoration-shimmer-banner"></div>
            <div className="decoration-shimmer-grid">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="decoration-shimmer-card">
                  <div className="decoration-shimmer-image"></div>
                  <div className="decoration-shimmer-content">
                    <div className="decoration-shimmer-title"></div>
                    <div className="decoration-shimmer-text"></div>
                    <div className="decoration-shimmer-row">
                      <div className="decoration-shimmer-rating"></div>
                      <div className="decoration-shimmer-price"></div>
                    </div>
                    <div className="decoration-shimmer-button"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <>
      <SEO 
        title="Decoration Services | ShubhVenue"
        description="Explore our beautiful decoration services for your special events"
        keywords="decoration, event decoration, wedding decoration, party decoration"
      />
      <div className="decoration-page">
        {/* Hero Section with Banner Slider */}
        {banners.length > 0 && (
          <div className="decoration-hero">
            <Swiper
              ref={swiperRef}
              modules={[Autoplay, Pagination, Navigation]}
              spaceBetween={0}
              slidesPerView={1}
              loop={banners.length > 1}
              autoplay={{
                delay: 5000,
                disableOnInteraction: false,
              }}
              pagination={{
                clickable: true,
                dynamicBullets: true,
              }}
              navigation={false}
              className="decoration-banner-swiper"
            >
              {banners.map((banner) => (
                <SwiperSlide key={banner._id || banner.id}>
                  <div 
                    className={`banner-slide ${banner.link ? 'clickable' : ''}`}
                    onClick={() => handleBannerClick(banner)}
                  >
                    <div className="banner-slide-image-wrapper">
                      <img 
                        src={getBannerImageUrl(banner.image)} 
                        alt={banner.title || 'Banner'} 
                        className="banner-slide-image"
                        loading="lazy"
                      />
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        )}

        <div className="decoration-container">
          {banners.length === 0 && !loading ? (
            <div className="no-banners">
              <p>No banners available at the moment.</p>
            </div>
          ) : null}

          {/* Decoration Categories Section */}
          {(decorationCategories.length > 0 || categoriesLoading) && (
            <div className="decoration-categories-section">
              {categoriesLoading ? (
                <div className="decoration-categories-skeleton">
                  {[...Array(6)].map((_, index) => (
                    <div key={index} className="decoration-category-skeleton-item">
                      <div className="decoration-category-skeleton-icon"></div>
                      <div className="decoration-category-skeleton-label"></div>
                    </div>
                  ))}
                </div>
              ) : decorationCategories.length > 0 ? (
                <>
                  {/* Desktop: Full Width List */}
                  <div className="decoration-categories-list decoration-categories-desktop">
                    {decorationCategories.map((category) => (
                      <div 
                        key={category._id || category.id} 
                        className="decoration-category-item clickable"
                        onClick={() => {
                          const categoryId = category._id || category.id
                          navigate(`/venues?decorationCategoryId=${categoryId}&decorationCategoryName=${encodeURIComponent(category.name)}`, {
                            state: {
                              decorationCategoryId: categoryId,
                              decorationCategoryName: category.name
                            }
                          })
                        }}
                      >
                        <div className="decoration-category-icon">
                          <img 
                            src={getCategoryImageUrl(category.image)} 
                            alt={category.name || 'Decoration Category'} 
                            loading="lazy"
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=200&h=200&fit=crop'
                            }} 
                          />
                        </div>
                        <p className="decoration-category-label">{category.name}</p>
                      </div>
                    ))}
                  </div>

                  {/* Tablet & Mobile: Slider */}
                  <div className="decoration-categories-slider-wrapper decoration-categories-mobile">
                    <button 
                      className="decoration-category-arrow decoration-category-arrow-prev" 
                      aria-label="Previous"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="15 18 9 12 15 6"></polyline>
                      </svg>
                    </button>
                    
                    <Swiper
                      modules={[Navigation, Autoplay]}
                      spaceBetween={20}
                      slidesPerView="auto"
                      loop={decorationCategories.length > 4}
                      autoplay={{
                        delay: 3000,
                        disableOnInteraction: false,
                      }}
                      navigation={{
                        nextEl: '.decoration-category-arrow-next',
                        prevEl: '.decoration-category-arrow-prev',
                      }}
                      breakpoints={{
                        320: {
                          slidesPerView: 3,
                          spaceBetween: 16,
                        },
                        480: {
                          slidesPerView: 4,
                          spaceBetween: 18,
                        },
                        768: {
                          slidesPerView: 5,
                          spaceBetween: 20,
                        },
                      }}
                      className="decoration-categories-swiper"
                    >
                      {decorationCategories.map((category) => (
                        <SwiperSlide key={category._id || category.id}>
                          <div className="decoration-category-item">
                            <div className="decoration-category-icon">
                              <img 
                                src={getCategoryImageUrl(category.image)} 
                                alt={category.name || 'Decoration Category'} 
                                loading="lazy"
                                onError={(e) => {
                                  e.target.src = 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=200&h=200&fit=crop'
                                }} 
                              />
                            </div>
                            <p className="decoration-category-label">{category.name}</p>
                          </div>
                        </SwiperSlide>
                      ))}
                    </Swiper>
                    
                    <button 
                      className="decoration-category-arrow decoration-category-arrow-next" 
                      aria-label="Next"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          )}

          {/* Occasion Special Section */}
          {occasionSpecials.length > 0 && (
            <div className="occasion-specials-section">
              <div className="occasion-specials-header">
                <h2 className="occasion-specials-title">Occasion Special</h2>
              </div>
              {occasionSpecialsLoading ? (
                <div style={{ padding: '20px', textAlign: 'center', width: '100%' }}>
                  Loading occasion specials...
                </div>
              ) : (
                <div className="occasion-specials-grid">
                  {occasionSpecials.map((occasionSpecial) => (
                    <div 
                      key={occasionSpecial._id || occasionSpecial.id} 
                      className="occasion-special-card clickable"
                      onClick={() => {
                        const occasionSpecialId = occasionSpecial._id || occasionSpecial.id
                        navigate(`/venues?occasionSpecialId=${occasionSpecialId}&occasionSpecialName=${encodeURIComponent(occasionSpecial.name)}`, {
                          state: {
                            occasionSpecialId: occasionSpecialId,
                            occasionSpecialName: occasionSpecial.name
                          }
                        })
                      }}
                    >
                      <div className="occasion-special-image-wrapper">
                        <img 
                          src={getOccasionSpecialImageUrl(occasionSpecial.image)} 
                          alt={occasionSpecial.name || 'Occasion Special'} 
                          className="occasion-special-image"
                          loading="lazy"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=300&h=300&fit=crop'
                          }} 
                        />
                      </div>
                      <p className="occasion-special-label">{occasionSpecial.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Birthday Party Category Banner */}
          {birthdayBanner && (
            <div className="birthday-banner-section">
              <h2 className="birthday-banner-heading">Level Up Your Birthday Party</h2>
              <div 
                className={`birthday-banner-wrapper ${birthdayBanner.link ? 'clickable' : ''}`}
                onClick={() => handleBannerClick(birthdayBanner)}
              >
                <img 
                  src={getBannerImageUrl(birthdayBanner.image)} 
                  alt={birthdayBanner.title || 'Birthday Party Banner'} 
                  className="birthday-banner-image"
                  loading="lazy"
                />
              </div>
              
              {/* Birthday Venues Section */}
              {birthdayVenuesLoading && birthdayVenues.length === 0 ? (
                <div className="venues-skeleton-grid">
                  {[...Array(6)].map((_, index) => (
                    <div key={index} className="venue-skeleton-card">
                      <div className="venue-skeleton-image"></div>
                      <div className="venue-skeleton-content">
                        <div className="venue-skeleton-title"></div>
                        <div className="venue-skeleton-text"></div>
                        <div className="venue-skeleton-row">
                          <div className="venue-skeleton-rating"></div>
                          <div className="venue-skeleton-price"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : birthdayVenues.length > 0 ? (
                <div className="birthday-venues-section">
                  <div className="birthday-venues-grid">
                    {birthdayVenues.map((venue) => (
                      <div 
                        key={venue.id} 
                        className="birthday-venue-card clickable"
                        onClick={() => {
                          const venueSlug = createSlug(venue.name)
                          const categoryName = venue.categoryId?.name || venue.category?.name || venue.type
                          const venueCategorySlug = categoryName ? createSlug(categoryName) : null
                          
                          const url = venueCategorySlug 
                            ? `/venue/${venueCategorySlug}/${venueSlug}`
                            : `/venue/${venueSlug}`
                          
                          navigate(url)
                        }}
                      >
                        <div className="birthday-venue-image-wrapper">
                          <img 
                            src={getVenueImageUrl(venue.images || venue.image || venue.coverImage)} 
                            alt={venue.name} 
                            className="birthday-venue-image"
                            loading="lazy"
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&h=300&fit=crop'
                            }}
                          />
                        </div>
                        <div className="birthday-venue-content">
                          <h4 className="birthday-venue-name">{venue.name}</h4>
                          <div className="birthday-venue-location-text">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                              <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                            <span>{venue.location || 'At your location'}</span>
                          </div>
                          <div className="birthday-venue-rating-price-row">
                            <div className="birthday-venue-rating">
                              <div className="birthday-rating-stars">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <svg 
                                    key={star} 
                                    width="14" 
                                    height="14" 
                                    viewBox="0 0 24 24" 
                                    fill={star <= Math.round(venue.rating) ? "#fbbf24" : "#e5e7eb"} 
                                    stroke={star <= Math.round(venue.rating) ? "#fbbf24" : "#e5e7eb"}
                                    strokeWidth="2"
                                  >
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                  </svg>
                                ))}
                              </div>
                              <span className="birthday-rating-value">
                                {typeof venue.rating === 'number' && venue.rating > 0 ? venue.rating.toFixed(1) : '4.0'}
                              </span>
                            </div>
                            <div className="birthday-venue-price">
                              <span className="birthday-price-amount">{venue.price}</span>
                              <span className="birthday-price-suffix"> {venue.priceSuffix}</span>
                            </div>
                          </div>
                          <button 
                            className="birthday-venue-book-btn"
                            onClick={(e) => {
                              e.stopPropagation()
                              const venueSlug = createSlug(venue.name)
                              const categoryName = venue.categoryId?.name || venue.category?.name || venue.type
                              const venueCategorySlug = categoryName ? createSlug(categoryName) : null
                              
                              const url = venueCategorySlug 
                                ? `/venue/${venueCategorySlug}/${venueSlug}`
                                : `/venue/${venueSlug}`
                              
                              navigate(url)
                            }}
                          >
                            BOOK NOW
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {birthdayVenues.length > 0 && (
                    <div style={{ textAlign: 'center', marginTop: '30px' }}>
                      <button 
                        className="birthday-view-more-btn"
                        onClick={() => navigate('/birthday-venues')}
                      >
                        View More
                      </button>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {/* Baby Section */}
          {babyBanner && (
            <div className="baby-banner-section">
              <h2 className="baby-banner-heading">Baby Shower & Welcome Your Little One</h2>
              <div 
                className={`baby-banner-wrapper ${babyBanner.link ? 'clickable' : ''}`}
                onClick={() => handleBannerClick(babyBanner)}
              >
                <img 
                  src={getBannerImageUrl(babyBanner.image)} 
                  alt={babyBanner.title || 'Baby Section Banner'} 
                  className="baby-banner-image"
                  loading="lazy"
                />
              </div>
              
              {/* Baby Venues Section */}
              {babyVenuesLoading && babyVenues.length === 0 ? (
                <div className="venues-skeleton-grid">
                  {[...Array(6)].map((_, index) => (
                    <div key={index} className="venue-skeleton-card">
                      <div className="venue-skeleton-image"></div>
                      <div className="venue-skeleton-content">
                        <div className="venue-skeleton-title"></div>
                        <div className="venue-skeleton-text"></div>
                        <div className="venue-skeleton-row">
                          <div className="venue-skeleton-rating"></div>
                          <div className="venue-skeleton-price"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : babyVenues.length > 0 ? (
                <div className="baby-venues-section">
                  <div className="baby-venues-grid">
                    {babyVenues.map((venue) => (
                      <div 
                        key={venue.id} 
                        className="baby-venue-card clickable"
                        onClick={() => {
                          const venueSlug = createSlug(venue.name)
                          const categoryName = venue.categoryId?.name || venue.category?.name || venue.type
                          const venueCategorySlug = categoryName ? createSlug(categoryName) : null
                          
                          const url = venueCategorySlug 
                            ? `/venue/${venueCategorySlug}/${venueSlug}`
                            : `/venue/${venueSlug}`
                          
                          navigate(url)
                        }}
                      >
                        <div className="baby-venue-image-wrapper">
                          <img 
                            src={getVenueImageUrl(venue.images || venue.image || venue.coverImage)} 
                            alt={venue.name} 
                            className="baby-venue-image"
                            loading="lazy"
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&h=300&fit=crop'
                            }}
                          />
                        </div>
                        <div className="baby-venue-content">
                          <h4 className="baby-venue-name">{venue.name}</h4>
                          <div className="baby-venue-location-text">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                              <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                            <span>{venue.location || 'At your location'}</span>
                          </div>
                          <div className="baby-venue-rating-price-row">
                            <div className="baby-venue-rating">
                              <div className="baby-rating-stars">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <svg 
                                    key={star} 
                                    width="14" 
                                    height="14" 
                                    viewBox="0 0 24 24" 
                                    fill={star <= Math.round(venue.rating) ? "#fbbf24" : "#e5e7eb"} 
                                    stroke={star <= Math.round(venue.rating) ? "#fbbf24" : "#e5e7eb"}
                                    strokeWidth="2"
                                  >
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                  </svg>
                                ))}
                              </div>
                              <span className="baby-rating-value">
                                {typeof venue.rating === 'number' && venue.rating > 0 ? venue.rating.toFixed(1) : '4.0'}
                              </span>
                            </div>
                            <div className="baby-venue-price">
                              <span className="baby-price-amount">{venue.price}</span>
                              <span className="baby-price-suffix"> {venue.priceSuffix}</span>
                            </div>
                          </div>
                          <button 
                            className="baby-venue-book-btn"
                            onClick={(e) => {
                              e.stopPropagation()
                              const venueSlug = createSlug(venue.name)
                              const categoryName = venue.categoryId?.name || venue.category?.name || venue.type
                              const venueCategorySlug = categoryName ? createSlug(categoryName) : null
                              
                              const url = venueCategorySlug 
                                ? `/venue/${venueCategorySlug}/${venueSlug}`
                                : `/venue/${venueSlug}`
                              
                              navigate(url)
                            }}
                          >
                            BOOK NOW
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {babyVenues.length > 0 && (
                    <div style={{ textAlign: 'center', marginTop: '30px' }}>
                      <button 
                        className="baby-view-more-btn"
                        onClick={() => navigate('/baby-venues')}
                      >
                        View More
                      </button>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {/* Romantic Section */}
          {romanticBanner && (
            <div className="romantic-banner-section">
              <h2 className="romantic-banner-heading">First Night Decorations, Anniversary & Candlelight Dinner</h2>
              <div 
                className={`romantic-banner-wrapper ${romanticBanner.link ? 'clickable' : ''}`}
                onClick={() => handleBannerClick(romanticBanner)}
              >
                <img 
                  src={getBannerImageUrl(romanticBanner.image)} 
                  alt={romanticBanner.title || 'Romantic Section Banner'} 
                  className="romantic-banner-image"
                  loading="lazy"
                />
              </div>
              
              {/* Romantic Venues Section */}
              {romanticVenuesLoading && romanticVenues.length === 0 ? (
                <div className="venues-skeleton-grid">
                  {[...Array(6)].map((_, index) => (
                    <div key={index} className="venue-skeleton-card">
                      <div className="venue-skeleton-image"></div>
                      <div className="venue-skeleton-content">
                        <div className="venue-skeleton-title"></div>
                        <div className="venue-skeleton-text"></div>
                        <div className="venue-skeleton-row">
                          <div className="venue-skeleton-rating"></div>
                          <div className="venue-skeleton-price"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : romanticVenues.length > 0 ? (
                <div className="romantic-venues-section">
                  <div className="romantic-venues-grid">
                    {romanticVenues.map((venue) => (
                      <div 
                        key={venue.id} 
                        className="romantic-venue-card clickable"
                        onClick={() => {
                          const venueSlug = createSlug(venue.name)
                          const categoryName = venue.categoryId?.name || venue.category?.name || venue.type
                          const venueCategorySlug = categoryName ? createSlug(categoryName) : null
                          
                          const url = venueCategorySlug 
                            ? `/venue/${venueCategorySlug}/${venueSlug}`
                            : `/venue/${venueSlug}`
                          
                          navigate(url)
                        }}
                      >
                        <div className="romantic-venue-image-wrapper">
                          <img 
                            src={getVenueImageUrl(venue.images || venue.image || venue.coverImage)} 
                            alt={venue.name} 
                            className="romantic-venue-image"
                            loading="lazy"
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&h=300&fit=crop'
                            }}
                          />
                        </div>
                        <div className="romantic-venue-content">
                          <h4 className="romantic-venue-name">{venue.name}</h4>
                          <div className="romantic-venue-location-text">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                              <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                            <span>{venue.location || 'At your location'}</span>
                          </div>
                          <div className="romantic-venue-rating-price-row">
                            <div className="romantic-venue-rating">
                              <div className="romantic-rating-stars">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <svg 
                                    key={star} 
                                    width="14" 
                                    height="14" 
                                    viewBox="0 0 24 24" 
                                    fill={star <= Math.round(venue.rating) ? "#fbbf24" : "#e5e7eb"} 
                                    stroke={star <= Math.round(venue.rating) ? "#fbbf24" : "#e5e7eb"}
                                    strokeWidth="2"
                                  >
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                  </svg>
                                ))}
                              </div>
                              <span className="romantic-rating-value">
                                {typeof venue.rating === 'number' && venue.rating > 0 ? venue.rating.toFixed(1) : '4.0'}
                              </span>
                            </div>
                            <div className="romantic-venue-price">
                              <span className="romantic-price-amount">{venue.price}</span>
                              <span className="romantic-price-suffix"> {venue.priceSuffix}</span>
                            </div>
                          </div>
                          <button 
                            className="romantic-venue-book-btn"
                            onClick={(e) => {
                              e.stopPropagation()
                              const venueSlug = createSlug(venue.name)
                              const categoryName = venue.categoryId?.name || venue.category?.name || venue.type
                              const venueCategorySlug = categoryName ? createSlug(categoryName) : null
                              
                              const url = venueCategorySlug 
                                ? `/venue/${venueCategorySlug}/${venueSlug}`
                                : `/venue/${venueSlug}`
                              
                              navigate(url)
                            }}
                          >
                            BOOK NOW
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {romanticVenues.length > 0 && (
                    <div style={{ textAlign: 'center', marginTop: '30px' }}>
                      <button 
                        className="romantic-view-more-btn"
                        onClick={() => navigate('/romantic-venues')}
                      >
                        View More
                      </button>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {/* Same Day Section */}
          {(sameDayBanner || (!sameDayVenuesLoading && sameDayVenues.length >= 0)) && (
            <div className="same-day-banner-section">
              <h2 className="same-day-banner-heading">Games & Activities & Same Day Decorations</h2>
              {sameDayBanner && (
                <div 
                  className={`same-day-banner-wrapper ${sameDayBanner.link ? 'clickable' : ''}`}
                  onClick={() => handleBannerClick(sameDayBanner)}
                >
                  <img 
                    src={getBannerImageUrl(sameDayBanner.image)} 
                    alt={sameDayBanner.title || 'Same Day Section Banner'} 
                    className="same-day-banner-image"
                    loading="lazy"
                  />
                </div>
              )}
              
              {/* Same Day Venues Section */}
              {sameDayVenuesLoading && sameDayVenues.length === 0 ? (
                <div className="venues-skeleton-grid">
                  {[...Array(6)].map((_, index) => (
                    <div key={index} className="venue-skeleton-card">
                      <div className="venue-skeleton-image"></div>
                      <div className="venue-skeleton-content">
                        <div className="venue-skeleton-title"></div>
                        <div className="venue-skeleton-text"></div>
                        <div className="venue-skeleton-row">
                          <div className="venue-skeleton-rating"></div>
                          <div className="venue-skeleton-price"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : sameDayVenues.length > 0 ? (
                <div className="same-day-venues-section">
                  <div className="same-day-venues-grid">
                    {sameDayVenues.map((venue) => (
                      <div 
                        key={venue.id} 
                        className="same-day-venue-card clickable"
                        onClick={() => {
                          const venueSlug = createSlug(venue.name)
                          const categoryName = venue.categoryId?.name || venue.category?.name || venue.type
                          const venueCategorySlug = categoryName ? createSlug(categoryName) : null
                          
                          const url = venueCategorySlug 
                            ? `/venue/${venueCategorySlug}/${venueSlug}`
                            : `/venue/${venueSlug}`
                          
                          navigate(url)
                        }}
                      >
                        <div className="same-day-venue-image-wrapper">
                          <img 
                            src={getVenueImageUrl(venue.images || venue.image || venue.coverImage)} 
                            alt={venue.name} 
                            className="same-day-venue-image"
                            loading="lazy"
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&h=300&fit=crop'
                            }}
                          />
                        </div>
                        <div className="same-day-venue-content">
                          <h4 className="same-day-venue-name">{venue.name}</h4>
                          <div className="same-day-venue-location-text">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                              <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                            <span>{venue.location || 'At your location'}</span>
                          </div>
                          <div className="same-day-venue-rating-price-row">
                            <div className="same-day-venue-rating">
                              <div className="same-day-rating-stars">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <svg 
                                    key={star} 
                                    width="14" 
                                    height="14" 
                                    viewBox="0 0 24 24" 
                                    fill={star <= Math.round(venue.rating) ? "#fbbf24" : "#e5e7eb"} 
                                    stroke={star <= Math.round(venue.rating) ? "#fbbf24" : "#e5e7eb"}
                                    strokeWidth="2"
                                  >
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                  </svg>
                                ))}
                              </div>
                              <span className="same-day-rating-value">
                                {typeof venue.rating === 'number' && venue.rating > 0 ? venue.rating.toFixed(1) : '4.0'}
                              </span>
                            </div>
                            <div className="same-day-venue-price">
                              <span className="same-day-price-amount">{venue.price}</span>
                              <span className="same-day-price-suffix"> {venue.priceSuffix}</span>
                            </div>
                          </div>
                          <button 
                            className="same-day-venue-book-btn"
                            onClick={(e) => {
                              e.stopPropagation()
                              const venueSlug = createSlug(venue.name)
                              const categoryName = venue.categoryId?.name || venue.category?.name || venue.type
                              const venueCategorySlug = categoryName ? createSlug(categoryName) : null
                              
                              const url = venueCategorySlug 
                                ? `/venue/${venueCategorySlug}/${venueSlug}`
                                : `/venue/${venueSlug}`
                              
                              navigate(url)
                            }}
                          >
                            BOOK NOW
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {sameDayVenues.length > 0 && (
                    <div style={{ textAlign: 'center', marginTop: '30px' }}>
                      <button 
                        className="same-day-view-more-btn"
                        onClick={() => navigate('/same-day-venues')}
                      >
                        View More
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ padding: '40px 20px', textAlign: 'center', width: '100%' }}>
                  <p style={{ color: 'var(--gray-medium)', fontSize: '1.1rem' }}>No venues found for Games & Activities & Same Day Decorations at the moment.</p>
                </div>
              )}
            </div>
          )}

          {/* Corporate Section */}
          {(corporateBanner || (!corporateVenuesLoading && corporateVenues.length >= 0)) && (
            <div className="corporate-banner-section">
              <h2 className="corporate-banner-heading">Corporate Events</h2>
              {corporateBanner && (
                <div 
                  className={`corporate-banner-wrapper ${corporateBanner.link ? 'clickable' : ''}`}
                  onClick={() => handleBannerClick(corporateBanner)}
                >
                  <img 
                    src={getBannerImageUrl(corporateBanner.image)} 
                    alt={corporateBanner.title || 'Corporate Section Banner'} 
                    className="corporate-banner-image"
                    loading="lazy"
                  />
                </div>
              )}
              
              {/* Corporate Venues Section */}
              {corporateVenuesLoading && corporateVenues.length === 0 ? (
                <div className="venues-skeleton-grid">
                  {[...Array(6)].map((_, index) => (
                    <div key={index} className="venue-skeleton-card">
                      <div className="venue-skeleton-image"></div>
                      <div className="venue-skeleton-content">
                        <div className="venue-skeleton-title"></div>
                        <div className="venue-skeleton-text"></div>
                        <div className="venue-skeleton-row">
                          <div className="venue-skeleton-rating"></div>
                          <div className="venue-skeleton-price"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : corporateVenues.length > 0 ? (
                <div className="corporate-venues-section">
                  <div className="corporate-venues-grid">
                    {corporateVenues.map((venue) => (
                      <div 
                        key={venue.id} 
                        className="corporate-venue-card clickable"
                        onClick={() => {
                          const venueSlug = createSlug(venue.name)
                          const categoryName = venue.categoryId?.name || venue.category?.name || venue.type
                          const venueCategorySlug = categoryName ? createSlug(categoryName) : null
                          
                          const url = venueCategorySlug 
                            ? `/venue/${venueCategorySlug}/${venueSlug}`
                            : `/venue/${venueSlug}`
                          
                          navigate(url)
                        }}
                      >
                        <div className="corporate-venue-image-wrapper">
                          <img 
                            src={getVenueImageUrl(venue.images || venue.image || venue.coverImage)} 
                            alt={venue.name} 
                            className="corporate-venue-image"
                            loading="lazy"
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&h=300&fit=crop'
                            }}
                          />
                        </div>
                        <div className="corporate-venue-content">
                          <h4 className="corporate-venue-name">{venue.name}</h4>
                          <div className="corporate-venue-location-text">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                              <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                            <span>{venue.location || 'At your location'}</span>
                          </div>
                          <div className="corporate-venue-rating-price-row">
                            <div className="corporate-venue-rating">
                              <div className="corporate-rating-stars">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <svg 
                                    key={star} 
                                    width="14" 
                                    height="14" 
                                    viewBox="0 0 24 24" 
                                    fill={star <= Math.round(venue.rating) ? "#fbbf24" : "#e5e7eb"} 
                                    stroke={star <= Math.round(venue.rating) ? "#fbbf24" : "#e5e7eb"}
                                    strokeWidth="2"
                                  >
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                  </svg>
                                ))}
                              </div>
                              <span className="corporate-rating-value">
                                {typeof venue.rating === 'number' && venue.rating > 0 ? venue.rating.toFixed(1) : '4.0'}
                              </span>
                            </div>
                            <div className="corporate-venue-price">
                              <span className="corporate-price-amount">{venue.price}</span>
                              <span className="corporate-price-suffix"> {venue.priceSuffix}</span>
                            </div>
                          </div>
                          <button 
                            className="corporate-venue-book-btn"
                            onClick={(e) => {
                              e.stopPropagation()
                              const venueSlug = createSlug(venue.name)
                              const categoryName = venue.categoryId?.name || venue.category?.name || venue.type
                              const venueCategorySlug = categoryName ? createSlug(categoryName) : null
                              
                              const url = venueCategorySlug 
                                ? `/venue/${venueCategorySlug}/${venueSlug}`
                                : `/venue/${venueSlug}`
                              
                              navigate(url)
                            }}
                          >
                            BOOK NOW
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {corporateVenues.length > 0 && (
                    <div style={{ textAlign: 'center', marginTop: '30px' }}>
                      <button 
                        className="corporate-view-more-btn"
                        onClick={() => navigate('/corporate-venues')}
                      >
                        View More
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ padding: '40px 20px', textAlign: 'center', width: '100%' }}>
                  <p style={{ color: 'var(--gray-medium)', fontSize: '1.1rem' }}>No venues found for Corporate Events at the moment.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}

export default Decoration

