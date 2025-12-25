import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import './Categories.css'
import { publicCategoriesAPI } from '../../services/customer/api'

function Categories() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

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


  const handleCategoryClick = (category) => {
    navigate(`/venues?categoryId=${category._id}&categoryName=${encodeURIComponent(category.name)}`, { 
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
            className="category-arrow category-arrow-prev" 
            aria-label="Previous"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          
          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center', width: '100%' }}>
              Loading categories...
            </div>
          ) : categories.length > 0 ? (
            <Swiper
              modules={[Navigation, Autoplay]}
              spaceBetween={24}
              slidesPerView="auto"
              loop={true}
              autoplay={{
                delay: 3000,
                disableOnInteraction: false,
              }}
              navigation={{
                nextEl: '.category-arrow-next',
                prevEl: '.category-arrow-prev',
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
                1024: {
                  slidesPerView: 6,
                  spaceBetween: 24,
                },
                1200: {
                  slidesPerView: 7,
                  spaceBetween: 24,
                },
              }}
              className="categories-swiper"
            >
              {categories.map((category) => (
                <SwiperSlide key={category._id}>
                  <div 
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
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', width: '100%' }}>
              No categories available
            </div>
          )}
          
          <button 
            className="category-arrow category-arrow-next" 
            aria-label="Next"
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

