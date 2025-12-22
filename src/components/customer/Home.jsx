import { useState, useEffect, useCallback, useRef } from 'react'
import HeroSection from './HeroSection'
import Categories from './Categories'
import HowItWorks from './HowItWorks'
import WhyVenueMonk from './WhyVenueMonk'
import FeaturedVenues from './FeaturedVenues'
import CTASection from './CTASection'
import Testimonials from './Testimonials'
import FAQ from './FAQ'
import Footer from './Footer'
import SEO from '../SEO'
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

  return (
    <>
      <SEO />
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

