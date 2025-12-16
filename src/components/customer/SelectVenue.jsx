import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './SelectVenue.css'
import { publicCategoriesAPI } from '../../services/customer/api'
import toast from 'react-hot-toast'

function SelectVenue() {
  const navigate = useNavigate()
  const [scrollPosition, setScrollPosition] = useState(0)
  const [maxScroll, setMaxScroll] = useState(0)
  const [venueTypes, setVenueTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const sliderRef = useRef(null)

  // Helper function to get category image URL
  const getCategoryImageUrl = (image) => {
    if (!image) {
      // Default placeholder image if no image provided
      return 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=200&h=200&fit=crop'
    }
    if (image.startsWith('/uploads/')) {
      const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://shubhvenue.com'
      return `${baseUrl}${image}`
    }
    if (image.startsWith('http://') || image.startsWith('https://')) {
      return image
    }
    // If it's a relative URL without /uploads, add it
    return `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://shubhvenue.com'}/uploads/categories/${image}`
  }

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true)
        const response = await publicCategoriesAPI.getAll({ active: 'true' })
        
        if (response.data?.success && response.data?.categories) {
          const categories = response.data.categories.map(category => ({
            id: category._id,
            name: category.name,
            image: getCategoryImageUrl(category.image),
            description: category.description,
            venueCount: category.venueCount || 0
          }))
          setVenueTypes(categories)
        } else {
          console.error('Invalid API response:', response.data)
          toast.error('Failed to load categories')
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
        toast.error('Failed to load venue categories')
        // Keep empty array on error
        setVenueTypes([])
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  useEffect(() => {
    const updateMaxScroll = () => {
      if (sliderRef.current) {
        const max = sliderRef.current.scrollWidth - sliderRef.current.clientWidth
        setMaxScroll(Math.max(0, max))
        setScrollPosition(sliderRef.current.scrollLeft)
      }
    }

    // Initial calculation
    updateMaxScroll()
    
    // Recalculate on resize
    window.addEventListener('resize', updateMaxScroll)
    
    // Recalculate when images load or venueTypes change
    const images = sliderRef.current?.querySelectorAll('img')
    if (images) {
      images.forEach(img => {
        img.addEventListener('load', updateMaxScroll)
      })
    }

    return () => {
      window.removeEventListener('resize', updateMaxScroll)
      if (images) {
        images.forEach(img => {
          img.removeEventListener('load', updateMaxScroll)
        })
      }
    }
  }, [venueTypes])

  const scrollLeft = () => {
    if (sliderRef.current) {
      const scrollAmount = 300
      const newPosition = Math.max(0, sliderRef.current.scrollLeft - scrollAmount)
      sliderRef.current.scrollTo({
        left: newPosition,
        behavior: 'smooth'
      })
    }
  }

  const scrollRight = () => {
    if (sliderRef.current) {
      const scrollAmount = 300
      const newPosition = Math.min(maxScroll, sliderRef.current.scrollLeft + scrollAmount)
      sliderRef.current.scrollTo({
        left: newPosition,
        behavior: 'smooth'
      })
    }
  }

  const handleScroll = () => {
    if (sliderRef.current) {
      setScrollPosition(sliderRef.current.scrollLeft)
    }
  }

  return (
    <section className="select-venue">
      <div className="select-venue-container">
        <h2 className="select-venue-title">Select Venue</h2>
        <div className="slider-wrapper">
          <button 
            className="slider-arrow slider-arrow-left" 
            onClick={scrollLeft}
            disabled={scrollPosition <= 0}
            aria-label="Scroll left"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <div 
            className="venue-types" 
            ref={sliderRef}
            onScroll={handleScroll}
          >
            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center', width: '100%' }}>
                Loading categories...
              </div>
            ) : venueTypes.length > 0 ? (
              venueTypes.map((venue) => (
                <div 
                  key={venue.id} 
                  className="venue-type-item"
                  onClick={() => {
                    // Navigate to venues page with category filter
                    navigate('/venues', { 
                      state: { categoryId: venue.id, categoryName: venue.name } 
                    })
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="venue-thumbnail">
                    <img src={venue.image} alt={venue.name} onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=200&h=200&fit=crop'
                    }} />
                  </div>
                  <p className="venue-label">{venue.name}</p>
                </div>
              ))
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', width: '100%' }}>
                No categories available
              </div>
            )}
          </div>
          <button 
            className="slider-arrow slider-arrow-right" 
            onClick={scrollRight}
            disabled={scrollPosition >= maxScroll - 1}
            aria-label="Scroll right"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </div>
    </section>
  )
}

export default SelectVenue

