import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Footer from '../../components/customer/Footer'
import SEO from '../../components/SEO'
import { publicBannersAPI, publicDecorationCategoriesAPI, publicOccasionSpecialsAPI, publicVenuesAPI } from '../../services/customer/api'
import { createSlug } from '../../utils/customer/slug'
import toast from 'react-hot-toast'
import './BirthdayVenues.css'

function BirthdayVenues() {
  const navigate = useNavigate()
  const [birthdayBanner, setBirthdayBanner] = useState(null)
  const [birthdayVenues, setBirthdayVenues] = useState([])
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

  // Fetch birthday banner
  useEffect(() => {
    const fetchBirthdayBanner = async () => {
      try {
        setBannerLoading(true)
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
        
        const birthdayBanner = allBanners.find(banner => 
          banner.title && banner.title.toLowerCase().includes('birthday')
        )
        
        if (birthdayBanner) {
          setBirthdayBanner(birthdayBanner)
        }
      } catch (error) {
        console.error('Error fetching birthday banner:', error)
      } finally {
        setBannerLoading(false)
      }
    }

    fetchBirthdayBanner()
  }, [])

  // Fetch all birthday venues
  useEffect(() => {
    const fetchBirthdayVenues = async () => {
      try {
        setVenuesLoading(true)
        
        // Fetch decoration categories and occasion specials
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
        
        // Find birthday categories and specials
        const birthdayDecorationCategories = decorationCategories.filter(cat => 
          cat.name && cat.name.toLowerCase().includes('birthday')
        )
        
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
        
        // Fetch venues for birthday occasion specials
        for (const special of birthdayOccasionSpecials) {
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
        
        // Format venues for display
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
        
        setBirthdayVenues(formattedVenues)
      } catch (error) {
        console.error('Error fetching birthday venues:', error)
        toast.error('Failed to load birthday venues')
      } finally {
        setVenuesLoading(false)
        setLoading(false)
      }
    }

    fetchBirthdayVenues()
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
        title="Birthday Party Venues | ShubhVenue"
        description="Explore all birthday party venues and decoration services"
        keywords="birthday venues, birthday decoration, party venues"
      />
      <div className="birthday-venues-page">
        {/* Birthday Banner */}
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

        <div className="birthday-venues-container">
          {venuesLoading ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', width: '100%' }}>
              <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
              <p style={{ marginTop: '20px', color: 'var(--gray-medium)' }}>Loading birthday venues...</p>
            </div>
          ) : birthdayVenues.length > 0 ? (
            <>
              <h2 className="birthday-venues-page-title">All Birthday Party Venues</h2>
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
                        src={venue.image} 
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
            </>
          ) : (
            <div style={{ padding: '60px 20px', textAlign: 'center', width: '100%' }}>
              <p style={{ color: 'var(--gray-medium)', fontSize: '1.1rem' }}>No birthday venues found at the moment.</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}

export default BirthdayVenues

