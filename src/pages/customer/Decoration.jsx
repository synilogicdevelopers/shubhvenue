import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Footer from '../../components/customer/Footer'
import SEO from '../../components/SEO'
import { publicBannersAPI } from '../../services/customer/api'
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
  const [loading, setLoading] = useState(true)
  const swiperRef = useRef(null)

  // Helper function to get banner image URL
  const getBannerImageUrl = (image) => {
    if (!image) {
      return 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200&h=400&fit=crop'
    }
    if (image.startsWith('/uploads/')) {
      const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://shubhvenue.com'
      return `${baseUrl}${image}`
    }
    if (image.startsWith('http://') || image.startsWith('https://')) {
      return image
    }
    return `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://shubhvenue.com'}/uploads/banners/${image}`
  }

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setLoading(true)
        const response = await publicBannersAPI.getAll()
        
        let bannersData = []
        if (response.data) {
          if (response.data.banners && Array.isArray(response.data.banners)) {
            bannersData = response.data.banners
          } else if (Array.isArray(response.data)) {
            bannersData = response.data
          } else if (response.data.data && Array.isArray(response.data.data)) {
            bannersData = response.data.data
          }
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

  const handleBannerClick = (banner) => {
    if (banner.link) {
      if (banner.link.startsWith('http://') || banner.link.startsWith('https://')) {
        window.open(banner.link, '_blank')
      } else {
        navigate(banner.link)
      }
    }
  }

  if (loading) {
    return (
      <div className="decoration-page">
        <div className="decoration-container">
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <img 
              src="/image/venuebook.png" 
              alt="VenueBook Logo" 
              style={{ 
                height: '60px', 
                width: 'auto', 
                objectFit: 'contain',
                marginBottom: '20px',
                margin: '0 auto 20px',
                animation: 'pulse 2s ease-in-out infinite'
              }}
              onError={(e) => {
                e.target.onerror = null
                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiByeD0iMTIiIGZpbGw9InVybCgjZ3JhZGllbnQpIi8+CjxzdmcgeD0iMTgiIHk9IjE4IiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSI+CjxwYXRoIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0wIDNjMS42NiAwIDMgMS4zNCAzIDNzLTEuMzQgMy0zIDMtMy0xLjM0LTMtMyAxLjM0LTMgMy0zem0wIDE0LjJjLTIuNjcgMC04IDEuMzQtOCA0djEuOGgxNnYtMS44YzAtMi42Ni01LjMzLTQtOC00eiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9ImdyYWRpZW50IiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj4KPHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6Izk0NDg3QTtzdG9wLW9wYWNpdHk6MSIgLz4KPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojRUM0ODk5O3N0b3Atb3BhY2l0eToxIiAvPgo8L2xpbmVhckdyYWRpZW50Pgo8L2RlZnM+Cjwvc3ZnPg=='
              }}
            />
            <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
            <p style={{ marginTop: '20px', color: 'var(--gray-medium)' }}>Loading banners...</p>
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
        </div>
      </div>
      <Footer />
    </>
  )
}

export default Decoration

