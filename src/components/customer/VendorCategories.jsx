import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import { publicVendorCategoriesAPI } from '../../services/customer/api'
import './VendorCategories.css'

// Get base URL for images (without /api)
const getImageBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8030/api';
  // Remove /api from the end if present
  return apiUrl.replace('/api', '');
};

function VendorCategories() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchVendorCategories()
  }, [])

  const fetchVendorCategories = async () => {
    try {
      const response = await publicVendorCategoriesAPI.getAll()
      console.log('Vendor Categories API Response:', response)
      // Handle different response structures
      let categoriesData = []
      if (response.data) {
        if (Array.isArray(response.data)) {
          categoriesData = response.data
        } else if (response.data.categories && Array.isArray(response.data.categories)) {
          categoriesData = response.data.categories
        } else if (response.data.data && Array.isArray(response.data.data)) {
          categoriesData = response.data.data
        }
      }
      console.log('Parsed Categories:', categoriesData)
      const activeCategories = categoriesData.filter(cat => cat.isActive !== false)
      console.log('Active Categories:', activeCategories)
      setCategories(activeCategories)
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch vendor categories:', error)
      console.error('Error details:', error.response || error.message)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <section className="vendor-categories">
        <div className="vendor-categories-container">
          <h2 className="vendor-categories-title">Vendors By Category</h2>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        </div>
      </section>
    )
  }

  if (categories.length === 0) {
    console.log('No categories to display - returning null')
    return null
  }

  console.log('Rendering', categories.length, 'categories')

  return (
    <section className="vendor-categories">
      <div className="vendor-categories-container">
        <h2 className="vendor-categories-title">Vendors By Category</h2>
        
        <div className="vendor-categories-wrapper">
          <Swiper
            modules={[Navigation, Autoplay]}
            spaceBetween={20}
            slidesPerView="auto"
            loop={true}
            autoplay={{
              delay: 3000,
              disableOnInteraction: false,
            }}
            navigation={{
              nextEl: '.vendor-categories-nav-next',
              prevEl: '.vendor-categories-nav-prev',
            }}
            breakpoints={{
              320: {
                slidesPerView: 1.2,
                spaceBetween: 15,
              },
              480: {
                slidesPerView: 2,
                spaceBetween: 15,
              },
              768: {
                slidesPerView: 3,
                spaceBetween: 20,
              },
              1024: {
                slidesPerView: 4,
                spaceBetween: 20,
              },
              1200: {
                slidesPerView: 4,
                spaceBetween: 20,
              },
            }}
            className="vendor-categories-swiper"
          >
            {categories.map((category) => (
              <SwiperSlide key={category._id}>
                <div 
                  className="vendor-category-card"
                  onClick={() => {
                    navigate(`/venues?vendorCategoryId=${category._id}&vendorCategoryName=${encodeURIComponent(category.name)}`, {
                      state: {
                        vendorCategoryId: category._id,
                        vendorCategoryName: category.name
                      }
                    })
                  }}
                >
                  <div className="vendor-category-image-wrapper">
                    {category.image ? (
                      <img
                        src={category.image.startsWith('http') ? category.image : `${getImageBaseUrl()}${category.image}`}
                        alt={category.name}
                        className="vendor-category-image"
                        onError={(e) => {
                          e.target.src = '/image/placeholder-category.jpg'
                        }}
                      />
                    ) : (
                      <div className="vendor-category-placeholder">
                        <span className="vendor-category-placeholder-text">
                          {category.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="vendor-category-name">
                    {category.name}
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          <button 
            className="vendor-categories-nav-btn vendor-categories-nav-prev"
            aria-label="Previous"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button 
            className="vendor-categories-nav-btn vendor-categories-nav-next"
            aria-label="Next"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </section>
  )
}

export default VendorCategories

