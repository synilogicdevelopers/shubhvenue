import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Footer from '../../components/customer/Footer'
import SEO from '../../components/SEO'
import { publicBannersAPI, publicDecorationCategoriesAPI, publicOccasionSpecialsAPI } from '../../services/customer/api'
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
  const [loading, setLoading] = useState(true)
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [occasionSpecialsLoading, setOccasionSpecialsLoading] = useState(true)
  const [birthdayBannerLoading, setBirthdayBannerLoading] = useState(true)
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

  // Helper function to get category image URL
  const getCategoryImageUrl = (image) => {
    if (!image) {
      return 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=300&h=300&fit=crop'
    }
    if (image.startsWith('/uploads/')) {
      const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://shubhvenue.com'
      return `${baseUrl}${image}`
    }
    if (image.startsWith('http://') || image.startsWith('https://')) {
      return image
    }
    return `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://shubhvenue.com'}/uploads/decoration-categories/${image}`
  }

  // Helper function to get occasion special image URL
  const getOccasionSpecialImageUrl = (image) => {
    if (!image) {
      return 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=300&h=300&fit=crop'
    }
    if (image.startsWith('/uploads/')) {
      const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://shubhvenue.com'
      return `${baseUrl}${image}`
    }
    if (image.startsWith('http://') || image.startsWith('https://')) {
      return image
    }
    return `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://shubhvenue.com'}/uploads/occasion-specials/${image}`
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
        } else {
          console.log('No birthday banner found')
        }
      } catch (error) {
        console.error('Error fetching birthday banner:', error)
      } finally {
        setBirthdayBannerLoading(false)
      }
    }

    fetchBirthdayBanner()
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

          {/* Decoration Categories Section */}
          {decorationCategories.length > 0 && (
            <div className="decoration-categories-section">
              {categoriesLoading ? (
                <div style={{ padding: '20px', textAlign: 'center', width: '100%' }}>
                  Loading categories...
                </div>
              ) : (
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
              )}
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
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}

export default Decoration

