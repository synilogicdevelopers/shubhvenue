import { useNavigate } from 'react-router-dom'
import './CTASection.css'

function CTASection() {
  const navigate = useNavigate()

  return (
    <section className="cta-section">
      <img
        src="/image/Flowers-bottom.png"
        alt="Decorative flowers"
        className="cta-flower cta-flower--top-left"
      />
      <img
        src="/image/Flowers-bottom.png"
        alt="Decorative flowers"
        className="cta-flower cta-flower--bottom-right"
      />
      <div className="cta-container">
        <div className="cta-content">
          <h2 className="cta-title">Ready to Book Your Perfect Venue?</h2>
          <p className="cta-description">
            Join thousands of satisfied customers who found their dream venue with us. 
            Start your journey today and make your event unforgettable.
          </p>
          <div className="cta-buttons">
            <button 
              className="cta-btn-primary"
              onClick={() => navigate('/venues')}
            >
              Browse All Venues
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
            <button 
              className="cta-btn-secondary"
              onClick={() => navigate('/contact-us')}
            >
              Contact Us
            </button>
          </div>
        </div>
        <div className="cta-stats">
          <div className="stat-item">
            <div className="stat-number">500+</div>
            <div className="stat-label">Venues</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">10K+</div>
            <div className="stat-label">Happy Customers</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">50+</div>
            <div className="stat-label">Cities</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">98%</div>
            <div className="stat-label">Satisfaction Rate</div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CTASection

