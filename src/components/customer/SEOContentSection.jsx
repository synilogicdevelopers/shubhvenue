import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './SEOContentSection.css'
import { publicHomepageContentAPI, publicVenuesAPI } from '../../services/customer/api'

function SEOContentSection() {
  const navigate = useNavigate()
  const [seoContent, setSeoContent] = useState(null)
  const [citySeoContent, setCitySeoContent] = useState(null)
  const [loading, setLoading] = useState(true)

  // Load SEO content from backend
  useEffect(() => {
    const loadContent = async () => {
      try {
        setLoading(true)
        
        // Load SEO content
        try {
          const seoResponse = await publicHomepageContentAPI.getByType('seo-content')
          console.log('SEO Content API Response:', seoResponse)
          if (seoResponse.data?.success && seoResponse.data?.content) {
            setSeoContent(seoResponse.data.content)
          } else {
            console.warn('SEO Content API response format unexpected:', seoResponse.data)
          }
        } catch (seoError) {
          console.error('Error loading SEO content:', seoError)
        }
        
        // Load City SEO content
        try {
          const cityResponse = await publicHomepageContentAPI.getByType('city-seo')
          console.log('City SEO API Response:', cityResponse)
          if (cityResponse.data?.success && cityResponse.data?.content) {
            setCitySeoContent(cityResponse.data.content)
          } else {
            console.warn('City SEO API response format unexpected:', cityResponse.data)
          }
        } catch (cityError) {
          console.error('Error loading City SEO content:', cityError)
        }
      } catch (error) {
        console.error('Error loading homepage content:', error)
        // Fallback to default content if API fails
        setSeoContent({
          title: 'About Shubh Venue',
          content: `Shubh Venue is your trusted partner in finding the perfect venue for your special occasions. 
We specialize in connecting you with the finest wedding venues, banquet halls, farm houses, 
resorts, and hotels across Rajasthan and beyond.`
        })
      } finally {
        setLoading(false)
      }
    }

    loadContent()
  }, [])

  const handleCityClick = (city) => {
    navigate(`/venues?city=${encodeURIComponent(city)}&state=Rajasthan`)
  }

  // Helper function to parse markdown-like content and convert to HTML
  const parseContent = (content) => {
    if (!content) return ''
    
    // Split by double newlines to create paragraphs
    let html = content
      // First convert headers
      .replace(/##\s+(.+?)(\n|$)/g, '<h3 class="seo-heading-h3">$1</h3>')
      .replace(/###\s+(.+?)(\n|$)/g, '<h4 class="seo-heading-h4">$1</h4>')
      // Split by double newlines for paragraphs
      .split(/\n\n+/)
      .map(para => {
        para = para.trim()
        if (!para) return ''
        // Skip if it's already a header
        if (para.startsWith('<h3') || para.startsWith('<h4')) {
          return para
        }
        // Replace single newlines with <br> within paragraphs
        para = para.replace(/\n/g, '<br>')
        // Convert links - simple markdown link format [text](url)
        para = para.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="seo-link">$1</a>')
        return `<p class="seo-paragraph">${para}</p>`
      })
      .filter(p => p)
      .join('')
    
    return html
  }

  if (loading) {
    return (
      <section className="seo-content-section">
        <div className="seo-content-container">
          <div className="seo-loading">Loading content...</div>
        </div>
      </section>
    )
  }

  return (
    <section className="seo-content-section">
      <div className="seo-content-container">
        {/* Main SEO Content */}
        {seoContent && (
          <div className="seo-main-content">
            <h2 className="seo-heading-h2">{seoContent.title || 'About Shubh Venue'}</h2>
            <div 
              className="seo-content-html"
              dangerouslySetInnerHTML={{ __html: parseContent(seoContent.content) }}
            />
          </div>
        )}

        {/* City SEO Block */}
        {citySeoContent && citySeoContent.cities && citySeoContent.cities.length > 0 && (
          <div className="seo-city-block">
            <h3 className="seo-city-block-title">{citySeoContent.title || 'Popular Wedding Venue Destinations'}</h3>
            <div className="seo-city-list">
              {citySeoContent.cities.map((city, index) => (
                <div key={city.name || index} className="seo-city-item">
                  <div className="seo-city-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                  </div>
                  <h4 className="seo-city-name">
                    <a 
                      href={`/venues?city=${encodeURIComponent(city.name)}`}
                      className="seo-city-link"
                      onClick={(e) => {
                        e.preventDefault()
                        handleCityClick(city.name)
                      }}
                    >
                      Wedding Venues in {city.name}
                    </a>
                  </h4>
                  {city.description && (
                    <p className="seo-city-description">{city.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default SEOContentSection

