import './HowItWorks.css'

function HowItWorks() {
  return (
    <section className="how-it-works">
      <div className="how-it-works-container">
        <h2 className="how-it-works-title">How it Works?</h2>
        <div className="steps-container">
          <div className="step">
            <div className="step-number">01</div>
            <div className="step-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                {/* Document with lines */}
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="9" y1="12" x2="15" y2="12"></line>
                <line x1="9" y1="16" x2="15" y2="16"></line>
                <line x1="9" y1="20" x2="15" y2="20"></line>
                {/* Magnifying glass pointing at document */}
                <circle cx="17" cy="17" r="2.5" fill="none"></circle>
                <line x1="19" y1="19" x2="21" y2="21" strokeWidth="1.5"></line>
              </svg>
            </div>
            <div className="step-content">
              <h3 className="step-title">Discover</h3>
              <p className="step-description">Browse Venues to create your shortlist</p>
            </div>
          </div>

          <div className="step-connector">
            <svg width="60" height="20" viewBox="0 0 60 20" fill="none">
              <path d="M5 10 L55 10" stroke="url(#gradient)" strokeWidth="2" strokeLinecap="round"/>
              <path d="M50 5 L55 10 L50 15" stroke="url(#gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6B46C1" />
                  <stop offset="100%" stopColor="#EC4899" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="step">
            <div className="step-number">02</div>
            <div className="step-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                {/* Clipboard base */}
                <path d="M9 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-2"></path>
                {/* Clipboard top */}
                <path d="M9 2v4h6V2"></path>
                <line x1="9" y1="6" x2="15" y2="6"></line>
                {/* Lines on clipboard */}
                <line x1="9" y1="10" x2="15" y2="10"></line>
                <line x1="9" y1="14" x2="15" y2="14"></line>
                <line x1="9" y1="18" x2="15" y2="18"></line>
                {/* Pen clipped to top right */}
                <path d="M16 2l2 2M16 4l2-2" strokeWidth="1.5"></path>
                <line x1="18" y1="2" x2="18" y2="4" strokeWidth="1.5"></line>
              </svg>
            </div>
            <div className="step-content">
              <h3 className="step-title">Shortlist</h3>
              <p className="step-description">Get negotiated rates for your shortlisted venues</p>
            </div>
          </div>

          <div className="step-connector">
            <svg width="60" height="20" viewBox="0 0 60 20" fill="none">
              <path d="M5 10 L55 10" stroke="url(#gradient2)" strokeWidth="2" strokeLinecap="round"/>
              <path d="M50 5 L55 10 L50 15" stroke="url(#gradient2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <defs>
                <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6B46C1" />
                  <stop offset="100%" stopColor="#EC4899" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="step">
            <div className="step-number">03</div>
            <div className="step-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                {/* Calendar */}
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
                {/* Checkmark badge in bottom right */}
                <circle cx="18" cy="18" r="3" fill="none"></circle>
                <polyline points="17 18 18 19 20 17" strokeWidth="2"></polyline>
              </svg>
            </div>
            <div className="step-content">
              <h3 className="step-title">Book</h3>
              <p className="step-description">
                Book online at our guaranteed lowest price <span className="discount-badge">Upto 30% off</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HowItWorks

