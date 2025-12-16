import HeroSection from './HeroSection'
import HowItWorks from './HowItWorks'
import SelectVenue from './SelectVenue'
import WhyVenueMonk from './WhyVenueMonk'
import FeaturedVenues from './FeaturedVenues'
import CTASection from './CTASection'
import Testimonials from './Testimonials'
import FAQ from './FAQ'
import Footer from './Footer'
import SEO from '../SEO'

function Home() {
  return (
    <>
      <SEO />
      <HeroSection />
      <HowItWorks />
      <SelectVenue />
      <WhyVenueMonk />
      <FeaturedVenues />
      <CTASection />
      <Testimonials />
      <FAQ />
      <Footer />
    </>
  )
}

export default Home

