import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import './HeroSection.css'
import { publicVideosAPI, publicVenuesAPI, publicCategoriesAPI } from '../../services/customer/api'

function HeroSection({ onLoadComplete }) {
  const navigate = useNavigate()
  const [videos, setVideos] = useState([])
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [videoUrl, setVideoUrl] = useState(null)
  const videoRef = useRef(null)
  const [selectedCity, setSelectedCity] = useState('')
  const [selectedOccasion, setSelectedOccasion] = useState('')
  const [cities, setCities] = useState([])
  const [categories, setCategories] = useState([])
  const [loadingCities, setLoadingCities] = useState(false)
  const hasFetched = useRef(false)
  const hasNotified = useRef(false)
  const loadingStates = useRef({
    videos: true,
    cities: true,
    categories: true
  })
  const onLoadCompleteRef = useRef(onLoadComplete)

  // Keep ref updated
  useEffect(() => {
    onLoadCompleteRef.current = onLoadComplete
  }, [onLoadComplete])

  // Load cities for Rajasthan (default state)
  const loadCities = async () => {
    try {
      setLoadingCities(true)
      const response = await publicVenuesAPI.getCities('Rajasthan')
      if (response.data?.success && response.data?.cities) {
        setCities(response.data.cities)
        // Set Kota as default city
        const kotaCity = response.data.cities.find(city => 
          city.toLowerCase() === 'kota'
        )
        if (kotaCity) {
          setSelectedCity(kotaCity)
        }
      }
    } catch (error) {
      console.error('Error loading cities:', error)
    } finally {
      setLoadingCities(false)
      loadingStates.current.cities = false
      checkAndNotify()
    }
  }

  // Load categories for occasion dropdown
  const loadCategories = async () => {
    try {
      const response = await publicCategoriesAPI.getAll({ active: 'true' })
      if (response.data?.success && response.data?.categories) {
        setCategories(response.data.categories)
      }
    } catch (error) {
      console.error('Error loading categories:', error)
    } finally {
      loadingStates.current.categories = false
      checkAndNotify()
    }
  }

  // Check if all loaded and notify parent
  const checkAndNotify = () => {
    const allLoaded = Object.values(loadingStates.current).every(loading => !loading)
    if (allLoaded && onLoadCompleteRef.current && !hasNotified.current) {
      hasNotified.current = true
      onLoadCompleteRef.current(true)
    }
  }

  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true
    
    fetchVideos()
    loadCities()
    loadCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Handle search button click
  const handleSearch = () => {
    const params = {}
    if (selectedCity && selectedCity.trim()) {
      params.city = selectedCity.trim()
      params.state = 'Rajasthan' // Default state
    }
    if (selectedOccasion) {
      // Find category ID from selected occasion name
      const category = categories.find(cat => cat.name === selectedOccasion)
      if (category) {
        params.categoryId = category._id
      }
    }
    
    // Navigate to venues page with filters
    navigate('/venues', { 
      state: { 
        searchParams: params,
        categoryName: selectedOccasion || undefined,
        categoryId: params.categoryId || undefined
      }
    })
  }

  const fetchVideos = async () => {
    try {
      const response = await publicVideosAPI.getAll()
      const videosData = response.data?.videos || []
      setVideos(videosData)
      
      if (videosData.length > 0) {
        // Get video URL for first video
        const firstVideo = videosData[0]
        const url = getVideoUrl(firstVideo.video)
        setVideoUrl(url)
      } else {
        // Fallback to default video if no videos
        setVideoUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4')
      }
    } catch (error) {
      console.error('Error fetching videos:', error)
      // Fallback to default video if API fails
      setVideoUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4')
    } finally {
      loadingStates.current.videos = false
      checkAndNotify()
    }
  }

  const getVideoUrl = (video) => {
    if (!video) return null
    if (video.startsWith('/uploads/')) {
      const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://shubhvenue.com'
      return `${baseUrl}${video}`
    }
    if (video.startsWith('http://') || video.startsWith('https://')) {
      return video
    }
    return `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://shubhvenue.com'}/uploads/videos/${video}`
  }

  // Handle video end - play next video if available
  const handleVideoEnd = () => {
    if (videos.length > 1) {
      const nextIndex = (currentVideoIndex + 1) % videos.length
      setCurrentVideoIndex(nextIndex)
      const nextVideo = videos[nextIndex]
      const url = getVideoUrl(nextVideo.video)
      setVideoUrl(url)
    }
  }

  // Update video when videoUrl changes
  useEffect(() => {
    if (videoRef.current && videoUrl) {
      // Preload video for smooth playback
      videoRef.current.preload = 'auto'
      videoRef.current.load()
      
      // Play video when ready
      const playVideo = () => {
        if (videoRef.current) {
          videoRef.current.play().catch(err => {
            console.error('Video play error:', err)
          })
        }
      }
      
      videoRef.current.addEventListener('loadeddata', playVideo)
      videoRef.current.addEventListener('canplay', playVideo)
      
      return () => {
        if (videoRef.current) {
          videoRef.current.removeEventListener('loadeddata', playVideo)
          videoRef.current.removeEventListener('canplay', playVideo)
        }
      }
    }
  }, [videoUrl])

  return (
    <section className="hero-section">
      {videoUrl ? (
        <video 
          ref={videoRef}
          className="hero-video" 
          autoPlay 
          loop={videos.length <= 1}
          muted 
          playsInline
          preload="auto"
          // Performance optimizations
          disablePictureInPicture
          disableRemotePlayback
          onEnded={handleVideoEnd}
          onError={(e) => {
            console.error('Video load error:', e)
            // Fallback to default video on error
            setVideoUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4')
          }}
          onLoadedMetadata={(e) => {
            // Ensure video plays smoothly
            if (e.target) {
              e.target.play().catch(() => {})
            }
          }}
        >
          <source src={videoUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      ) : (
      <video 
        className="hero-video" 
        autoPlay 
        loop 
        muted 
        playsInline
          preload="auto"
          disablePictureInPicture
          disableRemotePlayback
      >
        <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      )}
      <div className="hero-overlay"></div>
      <div className="hero-content">
        <h1 className="hero-title">Find Your Perfect Event Venue</h1>
        <div className="hero-search">
          <select 
            className="hero-select"
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            disabled={loadingCities}
          >
            <option value="">Select City</option>
            {loadingCities ? (
              <option>Loading cities...</option>
            ) : (
              cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))
            )}
          </select>
          <select 
            className="hero-select"
            value={selectedOccasion}
            onChange={(e) => setSelectedOccasion(e.target.value)}
          >
            <option value="">Select Occasion</option>
            {categories.map(category => (
              <option key={category._id} value={category.name}>{category.name}</option>
            ))}
          </select>
          <button className="hero-search-btn" onClick={handleSearch}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          </button>
        </div>
      </div>
      
    </section>
  )
}

export default HeroSection

