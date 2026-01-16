import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './QuotationSection.css'

function QuotationSection() {
  const navigate = useNavigate()
  const [selectedEventType, setSelectedEventType] = useState('')

  const eventTypes = [
    { id: 'wedding', label: 'Wedding', value: 'Wedding' },
    { id: 'birthday', label: 'Birthday', value: 'Birthday' },
    { id: 'corporate', label: 'Corporate Event', value: 'Corporate Event' },
    { id: 'haldi', label: 'Haldi / Mehndi', value: 'Haldi / Mehndi' }
  ]

  const handleCheckAvailability = () => {
    // Scroll to enquiry form or open enquiry modal
    // For now, navigate to contact page or venues page with event type filter
    if (selectedEventType) {
      navigate(`/venues?occasion=${encodeURIComponent(selectedEventType)}`)
    } else {
      // Scroll to enquiry section if exists, otherwise navigate to contact
      const enquirySection = document.getElementById('enquiry-section') || document.getElementById('contact-section')
      if (enquirySection) {
        enquirySection.scrollIntoView({ behavior: 'smooth', block: 'start' })
      } else {
        navigate('/contact-us')
      }
    }
  }

  return (
    <section className="quotation-section">
      <div className="quotation-container">
        <div className="quotation-content">
          <h2 className="quotation-title">Get Best Venue Quotation</h2>
          <p className="quotation-description">
            Select your event type and get instant availability & pricing for the best venues
          </p>
          <div className="quotation-event-types">
            {eventTypes.map((eventType) => (
              <button
                key={eventType.id}
                className={`quotation-event-btn ${selectedEventType === eventType.value ? 'active' : ''}`}
                onClick={() => setSelectedEventType(eventType.value)}
              >
                {eventType.label}
              </button>
            ))}
          </div>
          <button
            className="quotation-cta-btn"
            onClick={handleCheckAvailability}
          >
            Check Availability & Price
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </div>
    </section>
  )
}

export default QuotationSection



