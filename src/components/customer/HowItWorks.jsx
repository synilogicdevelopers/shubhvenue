import './HowItWorks.css'

function HowItWorks() {
  return (
    <section className="how-it-works">
      <div className="how-it-works-container">
        <h2 className="how-it-works-title">How it Works?</h2>
        <div className="steps-container">
          {/* Card 1: Browse Venues */}
          <div className="step">
            <div className="step-icon-wrapper">
              <div className="step-icon browse-icon">
                <img src="/image/find.png" alt="Browse Venues" />
              </div>
            </div>
            <div className="step-content">
              <h3 className="step-title">Browse Venues</h3>
              <p className="step-description">
                Check out the best suited Venues, compare photos, special offers and function packages.
              </p>
            </div>
          </div>

          {/* Card 2: Request Quotes */}
          <div className="step">
            <div className="step-icon-wrapper">
              <div className="step-icon quote-icon">
                <img src="/image/request.png" alt="Request Quotes" />
              </div>
            </div>
            <div className="step-content">
              <h3 className="step-title">Request Quotes</h3>
              <p className="step-description">
                Get custom quotes of your short-listed Venues at the click of GET FREE QUOTES button.
              </p>
            </div>
          </div>

          {/* Card 3: Book a Venue */}
          <div className="step">
            <div className="step-icon-wrapper">
              <div className="step-icon book-icon">
                <img src="/image/booking.png" alt="Book a Venue" />
              </div>
            </div>
            <div className="step-content">
              <h3 className="step-title">Book a Venue</h3>
              <p className="step-description">
                Select and Book the perfect venue in no time at all. Time is money, save both.
              </p>
            </div>
          </div>

          {/* Card 4: Event Planning */}
          <div className="step">
            <div className="step-icon-wrapper">
              <div className="step-icon planning-icon">
                <img src="/image/banner.png" alt="Event Planning" />
              </div>
            </div>
            <div className="step-content">
              <h3 className="step-title">Event Planning</h3>
              <p className="step-description">
                Plan your event effortlessly with expert guidance. Save time, stay stress-free.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HowItWorks


