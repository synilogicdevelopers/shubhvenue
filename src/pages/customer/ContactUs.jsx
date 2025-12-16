import { useState, useEffect } from 'react'
import Footer from '../../components/customer/Footer'
import { publicCompanyAPI, publicContactAPI } from '../../services/customer/api'
import toast from 'react-hot-toast'
import './ContactUs.css'

function ContactUs() {
  const [companyData, setCompanyData] = useState({
    companyName: 'ShubhVenue',
    email: '',
    phone: '',
    address: '',
  })
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [checkEmail, setCheckEmail] = useState('')
  const [checking, setChecking] = useState(false)
  const [submissionData, setSubmissionData] = useState(null)
  const [showCheckSection, setShowCheckSection] = useState(false)

  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        setLoading(true)
        const response = await publicCompanyAPI.get()
        if (response.data?.success && response.data?.company) {
          setCompanyData({
            companyName: response.data.company.companyName || 'ShubhVenue',
            email: response.data.company.email || '',
            phone: response.data.company.phone || '',
            address: response.data.company.address || '',
          })
        }
      } catch (error) {
        console.error('Error fetching company data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCompanyData()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    try {
      const response = await publicContactAPI.submit({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        subject: formData.subject,
        message: formData.message,
      })
      
      if (response.data?.success) {
        toast.success(response.data.message || 'Thank you for contacting us! We will get back to you soon.')
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: '',
        })
      } else {
        toast.error(response.data?.error || 'Failed to send message')
      }
    } catch (error) {
      console.error('Error submitting contact form:', error)
      const errorMessage = error.response?.data?.error || error.message || 'Failed to send message. Please try again.'
      toast.error(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCheckSubmission = async (e) => {
    e.preventDefault()
    
    if (!checkEmail || !checkEmail.trim()) {
      toast.error('Please enter your email address')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(checkEmail)) {
      toast.error('Please enter a valid email address')
      return
    }

    setChecking(true)
    try {
      const response = await publicContactAPI.getByEmail(checkEmail.trim())
      
      if (response.data?.success && response.data?.contacts) {
        if (response.data.contacts.length > 0) {
          // Show the latest submission
          setSubmissionData(response.data.contacts[0])
          toast.success('Submission found!')
        } else {
          toast.error('No submissions found for this email')
          setSubmissionData(null)
        }
      } else {
        toast.error(response.data?.error || 'No submissions found')
        setSubmissionData(null)
      }
    } catch (error) {
      console.error('Error checking submission:', error)
      const errorMessage = error.response?.data?.error || error.message || 'Failed to check submission. Please try again.'
      toast.error(errorMessage)
      setSubmissionData(null)
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="contact-us-page">
      <div className="contact-us-container">
        <div className="contact-hero">
          <h1 className="contact-title">Contact Us</h1>
          <p className="contact-subtitle">We'd love to hear from you. Get in touch with us!</p>
        </div>

        {/* Check Submission Status Section */}
        <div className="check-submission-section">
          <button
            className="check-submission-toggle"
            onClick={() => setShowCheckSection(!showCheckSection)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 16 12 12 16 8"></polyline>
              <line x1="8" y1="12" x2="12" y2="12"></line>
            </svg>
            {showCheckSection ? 'Hide' : 'Check'} Your Submission Status
          </button>

          {showCheckSection && (
            <div className="check-submission-form">
              <h3 className="check-title">Check Your Submission</h3>
              <p className="check-description">Enter your email to view your submission status and replies</p>
              <form onSubmit={handleCheckSubmission} className="check-form">
                <div className="form-group">
                  <label htmlFor="checkEmail" className="form-label">Email Address</label>
                  <input
                    type="email"
                    id="checkEmail"
                    className="form-input"
                    value={checkEmail}
                    onChange={(e) => setCheckEmail(e.target.value)}
                    placeholder="Enter the email you used to contact us"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="check-btn"
                  disabled={checking}
                >
                  {checking ? (
                    <>
                      <div className="spinner"></div>
                      Checking...
                    </>
                  ) : (
                    <>
                      Check Status
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </>
                  )}
                </button>
              </form>

              {submissionData && (
                <div className="submission-details">
                  <h4 className="details-title">Your Submission</h4>
                  <div className="details-content">
                    <div className="detail-item">
                      <span className="detail-label">Status:</span>
                      <span className={`detail-value status-${submissionData.status}`}>
                        {submissionData.status === 'new' ? 'New' : 
                         submissionData.status === 'read' ? 'Read' :
                         submissionData.status === 'replied' ? 'Replied' :
                         submissionData.status === 'resolved' ? 'Resolved' : submissionData.status}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Submitted:</span>
                      <span className="detail-value">
                        {new Date(submissionData.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {submissionData.replyMessage && (
                      <div className="reply-section">
                        <h5 className="reply-title">Reply from ShubhVenue:</h5>
                        <div className="reply-message">
                          {submissionData.replyMessage}
                        </div>
                        {submissionData.repliedAt && (
                          <p className="reply-date">
                            Replied on: {new Date(submissionData.repliedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="contact-content">
          <div className="contact-info-section">
            <div className="info-card">
              <div className="info-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </div>
              <h3 className="info-title">Address</h3>
              <p className="info-text">
                {companyData.address || '123 Event Street, City, State 12345'}
              </p>
            </div>

            <div className="info-card">
              <div className="info-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
              </div>
              <h3 className="info-title">Phone</h3>
              <p className="info-text">
                {companyData.phone ? (
                  <a href={`tel:${companyData.phone}`} className="info-link">
                    {companyData.phone}
                  </a>
                ) : (
                  '+1 (555) 123-4567'
                )}
              </p>
            </div>

            <div className="info-card">
              <div className="info-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
              </div>
              <h3 className="info-title">Email</h3>
              <p className="info-text">
                {companyData.email ? (
                  <a href={`mailto:${companyData.email}`} className="info-link">
                    {companyData.email}
                  </a>
                ) : (
                  'info@shubhvenue.com'
                )}
              </p>
            </div>
          </div>

          <div className="contact-form-section">
            <form onSubmit={handleSubmit} className="contact-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name" className="form-label">
                    Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Your full name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    Email <span className="required">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="form-input"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phone" className="form-label">Phone</label>
                  <input
                    type="tel"
                    id="phone"
                    className="form-input"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="subject" className="form-label">Subject</label>
                  <input
                    type="text"
                    id="subject"
                    className="form-input"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="What is this regarding?"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="message" className="form-label">
                  Message <span className="required">*</span>
                </label>
                <textarea
                  id="message"
                  className="form-textarea"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Tell us how we can help you..."
                  rows={6}
                  required
                />
              </div>

              <button
                type="submit"
                className="submit-btn"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <div className="spinner"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    Send Message
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="22" y1="2" x2="11" y2="13"></line>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default ContactUs

