import { useState, useEffect, useRef } from 'react'
import { publicTestimonialsAPI } from '../../services/customer/api'
import toast from 'react-hot-toast'
import './Testimonials.css'

function Testimonials({ onLoadComplete }) {
  const [testimonials, setTestimonials] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [testimonialsPerPage, setTestimonialsPerPage] = useState(2)
  const hasFetched = useRef(false)
  const hasNotified = useRef(false)
  const onLoadCompleteRef = useRef(onLoadComplete)

  useEffect(() => {
    onLoadCompleteRef.current = onLoadComplete
  }, [onLoadComplete])

  // Fetch testimonials from API
  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true
    
    const fetchTestimonials = async () => {
      try {
        setLoading(true)
        const response = await publicTestimonialsAPI.getAll()
        if (response.data?.success && response.data?.testimonials) {
          setTestimonials(response.data.testimonials)
        } else {
          setTestimonials([])
        }
      } catch (error) {
        console.error('Error fetching testimonials:', error)
        toast.error('Failed to load testimonials')
        setTestimonials([])
      } finally {
        setLoading(false)
        if (onLoadCompleteRef.current && !hasNotified.current) {
          hasNotified.current = true
          onLoadCompleteRef.current(true)
        }
      }
    }

    fetchTestimonials()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const handleResize = () => {
      const newPerPage = window.innerWidth <= 768 ? 1 : 2
      setTestimonialsPerPage(newPerPage)
    }

    // Set initial value
    handleResize()

    // Add event listener
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const totalPages = Math.ceil(testimonials.length / testimonialsPerPage)

  // Reset index when testimonialsPerPage changes
  useEffect(() => {
    setCurrentIndex(0)
  }, [testimonialsPerPage])

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? totalPages - 1 : prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === totalPages - 1 ? 0 : prev + 1))
  }

  const handleDotClick = (index) => {
    setCurrentIndex(index)
  }

  const getCurrentTestimonials = () => {
    const start = currentIndex * testimonialsPerPage
    return testimonials.slice(start, start + testimonialsPerPage)
  }

  if (loading) {
    return (
      <section className="testimonials">
        <div className="testimonials-container">
          <h2 className="testimonials-title">Testimonials</h2>
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <img 
              src="/image/venuebook.png" 
              alt="ShubhVenue Logo" 
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
            <p style={{ marginTop: '20px', color: 'var(--gray-medium)' }}>Loading testimonials...</p>
          </div>
        </div>
      </section>
    )
  }

  if (testimonials.length === 0) {
    return null // Don't show testimonials section if no testimonials
  }

  return (
    <section id="testimonials" className="testimonials">
      <div className="testimonials-container">
        <h2 className="testimonials-title">Testimonials</h2>
        <div className="testimonials-slider">
          <button 
            className="testimonials-arrow testimonials-arrow-left" 
            onClick={handlePrevious}
            aria-label="Previous testimonials"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          
          <div className="testimonials-content">
            {getCurrentTestimonials().map((testimonial) => (
              <div key={testimonial._id || testimonial.id} className="testimonial-card">
                <div className="testimonial-quote-open">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.996 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.984zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
                  </svg>
                </div>
                <p className="testimonial-text">{testimonial.text}</p>
                <div className="testimonial-quote-close">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.996 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.984zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
                  </svg>
                </div>
                <div className="testimonial-author">
                  <div className="testimonial-name">{testimonial.name}</div>
                  {testimonial.event && (
                    <div className="testimonial-event">{testimonial.event}</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button 
            className="testimonials-arrow testimonials-arrow-right" 
            onClick={handleNext}
            aria-label="Next testimonials"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>

        <div className="testimonials-dots">
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              className={`testimonial-dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => handleDotClick(index)}
              aria-label={`Go to page ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default Testimonials

