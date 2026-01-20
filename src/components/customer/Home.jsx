import { useState, useEffect, useRef } from 'react'
import HeroSection from './HeroSection'
import Categories from './Categories'
import VenueListingSection from './VenueListingSection'
import FeaturedVenues from './FeaturedVenues'
import VendorCategories from './VendorCategories'
import HowItWorks from './HowItWorks'
import WhyVenueMonk from './WhyVenueMonk'
import Testimonials from './Testimonials'
import FAQ from './FAQ'
import CTASection from './CTASection'
import SEOContentSection from './SEOContentSection'
import Footer from './Footer'
import './Home.css'

function Home() {
  const [isLoading, setIsLoading] = useState(true)
  const loadedComponents = useRef({
    hero: false,
    categories: false,
    featuredVenues: false,
    marriageGarden: false,
    banquetHall: false,
    farmHouse: false,
    hotel: false,
    resort: false,
    vendorCategories: false
  })
  const hasShownContent = useRef(false)

  const checkAllLoaded = () => {
    // Progressive loading: show content after critical components load
    const criticalComponents = ['hero', 'categories']
    const criticalLoaded = criticalComponents.every(key => loadedComponents.current[key] === true)
    
    // Show content if critical components are loaded OR if featured venues are loaded
    if ((criticalLoaded || loadedComponents.current.featuredVenues) && !hasShownContent.current) {
      hasShownContent.current = true
      setTimeout(() => {
        setIsLoading(false)
      }, 300)
    }
    
    // Also check if all loaded (optional - but doesn't block showing content)
    const allLoaded = Object.values(loadedComponents.current).every(loaded => loaded === true)
    if (allLoaded && isLoading) {
      setTimeout(() => {
        setIsLoading(false)
      }, 300)
    }
  }

  const handleHeroLoadComplete = () => {
    loadedComponents.current.hero = true
    checkAllLoaded()
  }

  const handleFeaturedLoadComplete = () => {
    loadedComponents.current.featuredVenues = true
    checkAllLoaded()
  }

  const handleCategoriesLoadComplete = () => {
    loadedComponents.current.categories = true
    checkAllLoaded()
  }

  const handleMarriageGardenLoadComplete = () => {
    loadedComponents.current.marriageGarden = true
    checkAllLoaded()
  }

  const handleBanquetHallLoadComplete = () => {
    loadedComponents.current.banquetHall = true
    checkAllLoaded()
  }

  const handleFarmHouseLoadComplete = () => {
    loadedComponents.current.farmHouse = true
    checkAllLoaded()
  }

  const handleHotelLoadComplete = () => {
    loadedComponents.current.hotel = true
    checkAllLoaded()
  }

  const handleResortLoadComplete = () => {
    loadedComponents.current.resort = true
    checkAllLoaded()
  }

  const handleVendorCategoriesLoadComplete = () => {
    loadedComponents.current.vendorCategories = true
    checkAllLoaded()
  }

  // Fallback: hide loader after 3 seconds to ensure fast page load
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!hasShownContent.current) {
        hasShownContent.current = true
        setIsLoading(false)
      }
    }, 3000)

    return () => clearTimeout(timeout)
  }, [])

  return (
    <>
      {isLoading && (
        <div className="home-page-loader">
          <div className="home-loader-content">
            <img 
              src="/image/logo.png" 
              alt="ShubhVenue Logo" 
              className="home-loader-logo"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
            <div className="home-loading-spinner"></div>
            <div className="home-loading-text">Loading...</div>
          </div>
        </div>
      )}
      <div className={`home-content ${isLoading ? 'home-content-hidden' : ''}`}>
        <HeroSection onLoadComplete={handleHeroLoadComplete} />
        <Categories onLoadComplete={handleCategoriesLoadComplete} />
        <FeaturedVenues onLoadComplete={handleFeaturedLoadComplete} />
        <VenueListingSection 
          categoryName="Marriage Garden" 
          title="Marriage Gardens" 
          limit={6}
          onLoadComplete={handleMarriageGardenLoadComplete}
        />
        <VenueListingSection 
          categoryName="Banquet Hall" 
          title="Banquet Halls" 
          limit={6}
          onLoadComplete={handleBanquetHallLoadComplete}
        />
        <VenueListingSection 
          categoryName="Farm House" 
          title="Farm Houses" 
          limit={6}
          onLoadComplete={handleFarmHouseLoadComplete}
        />
        <VenueListingSection 
          categoryName="Hotel" 
          title="Hotels" 
          limit={6}
          onLoadComplete={handleHotelLoadComplete}
        />
        <VenueListingSection 
          categoryName="Resort" 
          title="Resorts" 
          limit={6}
          onLoadComplete={handleResortLoadComplete}
        />
        <VendorCategories onLoadComplete={handleVendorCategoriesLoadComplete} />
        <HowItWorks />
        <WhyVenueMonk />
        <Testimonials />
        <FAQ />
        <CTASection />
        <SEOContentSection />
        <Footer />
      </div>
    </>
  )
}

export default Home
