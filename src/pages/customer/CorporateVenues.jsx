import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Footer from '../../components/customer/Footer'
import SEO from '../../components/SEO'
import { publicBannersAPI, publicDecorationCategoriesAPI, publicOccasionSpecialsAPI, publicVenuesAPI } from '../../services/customer/api'
import { createSlug } from '../../utils/customer/slug'
import toast from 'react-hot-toast'
import './CorporateVenues.css'

function CorporateVenues() {
  const navigate = useNavigate()
  const [corporateBanner, setCorporateBanner] = useState(null)
  const [corporateVenues, setCorporateVenues] = useState([])
  const [loading, setLoading] = useState(true)
  const [bannerLoading, setBannerLoading] = useState(true)
  const [venuesLoading, setVenuesLoading] = useState(true)

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

  // Helper function to get venue image URL
  const getVenueImageUrl = (images) => {
    if (!images || (Array.isArray(images) && images.length === 0)) {
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
    return { price: '₹4999', suffix: 'per day' }
  }

  // Fetch corporate banner (corporatesection category)
  useEffect(() => {
    const fetchCorporateBanner = async () => {
      try {
        setBannerLoading(true)
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
        
        const corporateBannerCategory = allBannersData.find(banner => 
          banner.categoryId && 
          (banner.categoryId.name || banner.categoryId) && 
          (banner.categoryId.name?.toLowerCase() === 'corporatesection' || 
           (typeof banner.categoryId === 'string' && banner.categoryId.toLowerCase() === 'corporatesection'))
        )
        
        let corporateBannerData = null
        let corporateBannerCategoryId = null
        
        if (corporateBannerCategory && corporateBannerCategory.categoryId) {
          if (typeof corporateBannerCategory.categoryId === 'object' && corporateBannerCategory.categoryId._id) {
            corporateBannerCategoryId = corporateBannerCategory.categoryId._id
          } else if (typeof corporateBannerCategory.categoryId === 'string') {
            corporateBannerCategoryId = corporateBannerCategory.categoryId
          }
        }
        
        if (corporateBannerCategoryId) {
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
        setBannerLoading(false)
      }
    }

    fetchCorporateBanner()
  }, [])

  // Fetch all corporate venues
  useEffect(() => {
    const fetchCorporateVenues = async () => {
      try {
        setVenuesLoading(true)
        
        const [categoriesResponse, specialsResponse] = await Promise.all([
          publicDecorationCategoriesAPI.getAll({ active: 'true' }),
          publicOccasionSpecialsAPI.getAll({ active: 'true' })
        ])
        
        let decorationCategories = []
        if (categoriesResponse.data) {
          if (categoriesResponse.data.categories && Array.isArray(categoriesResponse.data.categories)) {
            decorationCategories = categoriesResponse.data.categories
          } else if (Array.isArray(categoriesResponse.data)) {
            decorationCategories = categoriesResponse.data
          } else if (categoriesResponse.data.data && Array.isArray(categoriesResponse.data.data)) {
            decorationCategories = categoriesResponse.data.data
          }
        }
        
        let occasionSpecials = []
        if (specialsResponse.data) {
          if (specialsResponse.data.occasionSpecials && Array.isArray(specialsResponse.data.occasionSpecials)) {
            occasionSpecials = specialsResponse.data.occasionSpecials
          } else if (Array.isArray(specialsResponse.data)) {
            occasionSpecials = specialsResponse.data
          } else if (specialsResponse.data.data && Array.isArray(specialsResponse.data.data)) {
            occasionSpecials = specialsResponse.data.data
          }
        }
        
        const corporateDecorationCategories = decorationCategories.filter(cat => {
          if (!cat.name) return false
          const nameLower = cat.name.toLowerCase()
          return (
            nameLower.includes('corporate') && nameLower.includes('event') ||
            nameLower.includes('corporate event') ||
            nameLower === 'corporate events'
          )
        })
        
        const corporateOccasionSpecials = occasionSpecials.filter(special => {
          if (!special.name) return false
          const nameLower = special.name.toLowerCase()
          return (
            nameLower.includes('corporate') && nameLower.includes('event') ||
            nameLower.includes('corporate event') ||
            nameLower === 'corporate events'
          )
        })
        
        const venueIds = new Set()
        const allVenues = []
        
        for (const category of corporateDecorationCategories) {
          try {
            const categoryId = category._id || category.id
            let venuesResponse = await publicVenuesAPI.getAll({ 
              decorationCategoryId: categoryId,
              status: 'active',
              limit: '100'
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
                limit: '100'
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
            console.error(`Error fetching venues for decoration category ${category.name}:`, error)
          }
        }
        
        for (const special of corporateOccasionSpecials) {
          try {
            const specialId = special._id || special.id
            let venuesResponse = await publicVenuesAPI.getAll({ 
              occasionSpecialId: specialId,
              status: 'active',
              limit: '100'
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
                limit: '100'
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
            console.error(`Error fetching venues for occasion special ${special.name}:`, error)
          }
        }
        
        const formattedVenues = allVenues.map(venue => {
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
        console.error('Error fetching corporate venues:', error)
        toast.error('Failed to load corporate venues')
      } finally {
        setVenuesLoading(false)
        setLoading(false)
      }
    }

    fetchCorporateVenues()
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

  return (
    <>
      <SEO 
        title="Corporate Events Venues | ShubhVenue"
        description="Explore all corporate events venues"
        keywords="corporate events, corporate venues, business events"
      />
      <div className="corporate-venues-page">
        {/* Corporate Banner */}
        {corporateBanner && (
          <div className="corporate-banner-section">
            <h2 className="corporate-banner-heading">Corporate Events</h2>
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
          </div>
        )}

        <div className="corporate-venues-container">
          {venuesLoading ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', width: '100%' }}>
              <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
              <p style={{ marginTop: '20px', color: 'var(--gray-medium)' }}>Loading corporate venues...</p>
            </div>
          ) : corporateVenues.length > 0 ? (
            <>
              <h2 className="corporate-venues-page-title">All Corporate Events Venues</h2>
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
            </>
          ) : (
            <div style={{ padding: '60px 20px', textAlign: 'center', width: '100%' }}>
              <p style={{ color: 'var(--gray-medium)', fontSize: '1.1rem' }}>No corporate venues found at the moment.</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}

export default CorporateVenues

