import './WhyVenueMonk.css'

function WhyVenueMonk() {
  return (
    <section className="why-venuemonk">
      <div className="why-venuemonk-container">
        <h2 className="why-venuemonk-title">Why ShubhVenue?</h2>
        <div className="features-container">
          <div className="feature">
            <div className="feature-icon-wrapper">
              <div className="feature-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  {/* Money box */}
                  <rect x="6" y="10" width="12" height="10" rx="1"></rect>
                  <line x1="8" y1="10" x2="8" y2="8"></line>
                  <line x1="16" y1="10" x2="16" y2="8"></line>
                  <line x1="6" y1="8" x2="18" y2="8"></line>
                  <line x1="10" y1="15" x2="14" y2="15"></line>
                  {/* Rupee symbol being dropped */}
                  <path d="M11 3L12 2L13 3" strokeWidth="1.5"></path>
                  <line x1="12" y1="2" x2="12" y2="8" strokeWidth="1.5"></line>
                  <line x1="11.5" y1="3" x2="12.5" y2="3" strokeWidth="1.5"></line>
                </svg>
              </div>
              <div className="feature-icon-badge">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              </div>
            </div>
            <div className="feature-content">
              <h3 className="feature-title">Save Money</h3>
              <p className="feature-subtitle">Lowest Price Guaranteed</p>
            </div>
          </div>

          <div className="feature">
            <div className="feature-icon-wrapper">
              <div className="feature-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  {/* Smartphone/tablet */}
                  <rect x="7" y="4" width="10" height="16" rx="2"></rect>
                  <line x1="9" y1="8" x2="15" y2="8"></line>
                  <line x1="9" y1="11" x2="15" y2="11"></line>
                  {/* Document with checkmark */}
                  <rect x="9" y="13" width="6" height="4" rx="0.5"></rect>
                  <polyline points="10 15 11 16 12 15" strokeWidth="1.5"></polyline>
                  {/* Hand with pencil from top right */}
                  <path d="M17 3L19 1M19 1L21 3M19 1V5" strokeWidth="1.5"></path>
                </svg>
              </div>
              <div className="feature-icon-badge">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
            </div>
            <div className="feature-content">
              <h3 className="feature-title">Verified Listing</h3>
              <p className="feature-subtitle">Dependable & Accurate</p>
            </div>
          </div>

          <div className="feature">
            <div className="feature-icon-wrapper">
              <div className="feature-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  {/* Calendar */}
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                  {/* Checkmark badge on calendar */}
                  <circle cx="18" cy="18" r="2.5" fill="none"></circle>
                  <polyline points="17 18 18 19 20 17" strokeWidth="2"></polyline>
                  {/* Hand pointing from left */}
                  <path d="M4 14L6 12M6 12L8 14M6 12V16" strokeWidth="1.5"></path>
                </svg>
              </div>
              <div className="feature-icon-badge">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
              </div>
            </div>
            <div className="feature-content">
              <h3 className="feature-title">Hassle Free Booking</h3>
              <p className="feature-subtitle">Convenience</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default WhyVenueMonk

