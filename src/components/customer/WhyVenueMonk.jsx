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
                <img src="/image/saving.png" alt="Save Money" />
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
                <img src="/image/checklist.png" alt="Verified Listing" />
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
                <img src="/image/hassle-free.png" alt="Hassle Free Booking" />
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

