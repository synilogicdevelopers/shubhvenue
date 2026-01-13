import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Footer from '../../components/customer/Footer'
import SEO from '../../components/SEO'
import { publicBannersAPI, publicDecorationCategoriesAPI, publicOccasionSpecialsAPI, publicVenuesAPI } from '../../services/customer/api'
import { createSlug } from '../../utils/customer/slug'
import toast from 'react-hot-toast'
import './BabyVenues.css'

function BabyVenues() {
  const navigate = useNavigate()
  const [babyBanner, setBabyBanner] = useState(null)
  const [babyVenues, setBabyVenues] = useState([])
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
    if (!images || images.length === 0) {
      return 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&h=300&fit=crop'
    }
    const image = Array.isArray(images) ? images[0] : images
    if (image.startsWith('/uploads/')) {
      const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://shubhvenue.com'
      return `${baseUrl}${image}`
    }
    if (image.startsWith('http://') || image.startsWith('https://')) {
      return image
    }
    return `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://shubhvenue.com'}/uploads/venues/${image}`
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

  // Fetch baby banner (babysection category)
  useEffect(() => {
    const fetchBabyBanner = async () => {
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
        
        const babyBannerCategory = allBannersData.find(banner => 
          banner.categoryId && 
          (banner.categoryId.name || banner.categoryId) && 
          (banner.categoryId.name?.toLowerCase() === 'babysection' || 
           (typeof banner.categoryId === 'string' && banner.categoryId.toLowerCase() === 'babysection'))
        )
        
        let babyBannerData = null
        let babyBannerCategoryId = null
        
        if (babyBannerCategory && babyBannerCategory.categoryId) {
          if (typeof babyBannerCategory.categoryId === 'object' && babyBannerCategory.categoryId._id) {
            babyBannerCategoryId = babyBannerCategory.categoryId._id
          } else if (typeof babyBannerCategory.categoryId === 'string') {
            babyBannerCategoryId = babyBannerCategory.categoryId
          }
        }
        
        if (babyBannerCategoryId) {
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
        setBannerLoading(false)
      }
    }

    fetchBabyBanner()
  }, [])

  // Fetch all baby venues
  useEffect(() => {
    const fetchBabyVenues = async () => {
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
        
        const babyDecorationCategories = decorationCategories.filter(cat => 
          cat.name && (
            cat.name.toLowerCase().includes('baby shower') || 
            cat.name.toLowerCase().includes('baby welcome')
          )
        )
        
        const babyOccasionSpecials = occasionSpecials.filter(special => 
          special.name && (
            special.name.toLowerCase().includes('baby shower') || 
            special.name.toLowerCase().includes('baby welcome')
          )
        )
        
        const venueIds = new Set()
        const allVenues = []
        
        for (const category of babyDecorationCategories) {
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
        
        for (const special of babyOccasionSpecials) {
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
        
        setBabyVenues(formattedVenues)
      } catch (error) {
        console.error('Error fetching baby venues:', error)
        toast.error('Failed to load baby venues')
      } finally {
        setVenuesLoading(false)
        setLoading(false)
      }
    }

    fetchBabyVenues()
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
        title="Baby Shower & Welcome Venues | ShubhVenue"
        description="Explore all baby shower and baby welcome venues and decoration services"
        keywords="baby shower venues, baby welcome, baby decoration, party venues"
      />
      <div className="baby-venues-page">
        {/* Baby Banner */}
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
          </div>
        )}

        <div className="baby-venues-container">
          {venuesLoading ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', width: '100%' }}>
              <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
              <p style={{ marginTop: '20px', color: 'var(--gray-medium)' }}>Loading baby venues...</p>
            </div>
          ) : babyVenues.length > 0 ? (
            <>
              <h2 className="baby-venues-page-title">All Baby Shower & Welcome Venues</h2>
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
                        src={venue.image} 
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
            </>
          ) : (
            <div style={{ padding: '60px 20px', textAlign: 'center', width: '100%' }}>
              <p style={{ color: 'var(--gray-medium)', fontSize: '1.1rem' }}>No baby venues found at the moment.</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}

export default BabyVenues

