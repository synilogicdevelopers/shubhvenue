import { useState, useEffect, useCallback, useRef } from 'react'
import HeroSection from './HeroSection'
import Categories from './Categories'
import HowItWorks from './HowItWorks'
import WhyVenueMonk from './WhyVenueMonk'
import VendorCategories from './VendorCategories'
import FeaturedVenues from './FeaturedVenues'
import CTASection from './CTASection'
import Testimonials from './Testimonials'
import FAQ from './FAQ'
import Footer from './Footer'
import SEO from '../SEO'
import { authAPI } from '../../services/customer/api'
import { forceLogout } from '../../utils/auth/logout'
import toast from 'react-hot-toast'
import './Home.css'

function Home() {
  const [loadingStates, setLoadingStates] = useState({
    heroSection: true,
    featuredVenues: true,
    testimonials: true,
    faq: true
  })
  const [showLoader, setShowLoader] = useState(true)

  const updateLoadingState = useCallback((component, isLoaded) => {
    setLoadingStates(prev => {
      // Only update if value changed
      if (prev[component] === !isLoaded) {
        return prev
      }
      return {
        ...prev,
        [component]: !isLoaded
      }
    })
  }, [])

  // Check if all data is loaded
  useEffect(() => {
    const allLoaded = Object.values(loadingStates).every(loading => !loading)
    if (allLoaded) {
      // Small delay for smooth transition
      const timer = setTimeout(() => {
        setShowLoader(false)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [loadingStates])

  // Memoized callbacks
  const handleHeroLoadComplete = useCallback((loaded) => {
    updateLoadingState('heroSection', loaded)
  }, [updateLoadingState])

  const handleFeaturedVenuesLoadComplete = useCallback((loaded) => {
    updateLoadingState('featuredVenues', loaded)
  }, [updateLoadingState])

  const handleTestimonialsLoadComplete = useCallback((loaded) => {
    updateLoadingState('testimonials', loaded)
  }, [updateLoadingState])

  const handleFAQLoadComplete = useCallback((loaded) => {
    updateLoadingState('faq', loaded)
  }, [updateLoadingState])

  // Check user status on mount/refresh (welcome API)
  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          // No token - user not logged in, skip check
          return
        }

        const response = await authAPI.welcome()
        
        if (response.data?.isBlocked) {
          // User is blocked - logout immediately
          toast.error('Your account has been blocked. Please contact support.')
          forceLogout('blocked', '/')
        } else if (response.data?.isDeleted) {
          // User is deleted - logout immediately
          toast.error('Your account has been deleted. Please contact support.')
          forceLogout('deleted', '/')
        }
        // If user is authenticated and not blocked, continue normally
      } catch (error) {
        // If error response indicates blocked user
        if (error.response?.status === 403 && error.response?.data?.isBlocked) {
          toast.error('Your account has been blocked. Please contact support.')
          forceLogout('blocked', '/')
        } else {
          // Other errors - silently fail (don't break the page)
          console.error('Welcome API error:', error)
        }
      }
    }

    // Call on mount and when page becomes visible (handles refresh)
    checkUserStatus()
    
    // Also check when page becomes visible (handles tab switching/refresh)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkUserStatus()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return (
    <>
      {/* SEO component will use default values for home page */}
      <SEO 
        title="Best Wedding Venues in India | Jaipur, Kota, Delhi, Mumbai | ShubhVenue"
        description="Find the perfect wedding venue in Jaipur, Kota, Delhi, Mumbai, and all major cities in India. Book banquet halls, hotels, palaces, resorts, and convention centers for your special day. Best venues for weddings, parties, and events."
        keywords="wedding venues, venues, jaipur venues, kota venues, delhi venues, mumbai venues, banquet halls, wedding halls, marriage venues, event venues, party venues, hotel venues, palace venues, resort venues, convention centers, wedding booking, venue booking, best wedding venues, affordable wedding venues, luxury wedding venues, wedding venues near me, venues in jaipur, venues in kota, venues in delhi, venues in mumbai, venues in rajasthan, venues in india"
      />
      {showLoader && (
        <div className="home-page-loader">
          <div className="home-loader-content">
            <div className="home-loading-spinner"></div>
          </div>
        </div>
      )}
      <div className={`home-content ${showLoader ? 'home-content-hidden' : ''}`}>
        <HeroSection onLoadComplete={handleHeroLoadComplete} />
        <Categories />
        <HowItWorks />
        <WhyVenueMonk />
        <VendorCategories />
        <FeaturedVenues onLoadComplete={handleFeaturedVenuesLoadComplete} />
        <CTASection />
        <Testimonials onLoadComplete={handleTestimonialsLoadComplete} />
        <FAQ onLoadComplete={handleFAQLoadComplete} />
        <Footer />
      </div>
    </>
  )
}

export default Home

