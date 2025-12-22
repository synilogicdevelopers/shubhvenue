import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Categories.css'
import { publicCategoriesAPI } from '../../services/customer/api'

function Categories() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [scrollPosition, setScrollPosition] = useState(0)
  const [maxScroll, setMaxScroll] = useState(0)
  const categoriesRef = useRef(null)

  // Helper function to get category image URL
  const getCategoryImageUrl = (image) => {
    if (!image) {
      return 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=200&h=200&fit=crop'
    }
    if (image.startsWith('/uploads/')) {
      const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://shubhvenue.com'
      return `${baseUrl}${image}`
    }
    if (image.startsWith('http://') || image.startsWith('https://')) {
      return image
    }
    return `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://shubhvenue.com'}/uploads/categories/${image}`
  }

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true)
        const response = await publicCategoriesAPI.getAll({ active: 'true' })
        if (response.data?.success && response.data?.categories) {
          const categoriesData = response.data.categories.map(category => ({
            ...category,
            image: getCategoryImageUrl(category.image)
          }))
          setCategories(categoriesData)
        }
      } catch (error) {
        console.error('Error loading categories:', error)
      } finally {
        setLoading(false)
      }
    }

    loadCategories()
  }, [])

  // Update scroll info on mount and when categories change
  useEffect(() => {
    if (!loading && categories.length > 0 && categoriesRef.current) {
      const updateScroll = () => {
        if (categoriesRef.current) {
          const element = categoriesRef.current
          const max = element.scrollWidth - element.clientWidth
          setMaxScroll(Math.max(0, max))
          setScrollPosition(element.scrollLeft)
        }
      }

      // Update immediately and after a delay for images
      updateScroll()
      const timeout1 = setTimeout(updateScroll, 100)
      const timeout2 = setTimeout(updateScroll, 500)

      window.addEventListener('resize', updateScroll)
      
      return () => {
        clearTimeout(timeout1)
        clearTimeout(timeout2)
        window.removeEventListener('resize', updateScroll)
      }
    }
  }, [categories, loading])

  const scrollLeft = () => {
    if (categoriesRef.current) {
      categoriesRef.current.scrollBy({
        left: -300,
        behavior: 'smooth'
      })
    }
  }

  const scrollRight = () => {
    if (categoriesRef.current) {
      categoriesRef.current.scrollBy({
        left: 300,
        behavior: 'smooth'
      })
    }
  }

  const handleCategoryScroll = () => {
    if (categoriesRef.current) {
      const element = categoriesRef.current
      const currentScroll = element.scrollLeft
      const max = element.scrollWidth - element.clientWidth
      setScrollPosition(currentScroll)
      setMaxScroll(Math.max(0, max))
    }
  }

  const handleCategoryClick = (category) => {
    navigate('/venues', { 
      state: { 
        categoryId: category._id, 
        categoryName: category.name 
      }
    })
  }

  return (
    <section className="categories">
      <img
        src="/image/Flowers.webp"
        alt="Decorative flowers"
        className="categories-flower"
      />
      <div className="categories-container">
        <div className="categories-wrapper">
          <button 
            className="category-arrow category-arrow-left" 
            onClick={scrollLeft}
            aria-label="Scroll left"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <div 
            className="categories-list" 
            ref={categoriesRef}
            onScroll={handleCategoryScroll}
          >
            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center', width: '100%' }}>
                Loading categories...
              </div>
            ) : categories.length > 0 ? (
              categories.map((category) => (
                <div 
                  key={category._id} 
                  className="category-item"
                  onClick={() => handleCategoryClick(category)}
                >
                  <div className="category-icon">
                    <img 
                      src={category.image} 
                      alt={category.name} 
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=200&h=200&fit=crop'
                      }} 
                    />
                  </div>
                  <p className="category-label">{category.name}</p>
                </div>
              ))
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', width: '100%' }}>
                No categories available
              </div>
            )}
          </div>
          <button 
            className="category-arrow category-arrow-right" 
            onClick={scrollRight}
            aria-label="Scroll right"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </div>
    </section>
  )
}

export default Categories

