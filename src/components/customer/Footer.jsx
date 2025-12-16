import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { publicCompanyAPI } from '../../services/customer/api'
import './Footer.css'

function Footer() {
  const navigate = useNavigate()
  const [companyData, setCompanyData] = useState({
    companyName: 'ShubhVenue',
    description: 'Your trusted partner in finding the perfect venue for every occasion. Making event planning simple and stress-free.',
    address: '',
    phone: '',
    email: '',
    facebook: '',
    twitter: '',
    instagram: '',
    linkedin: '',
    copyright: '© 2024 ShubhVenue. All rights reserved.',
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        setLoading(true)
        const response = await publicCompanyAPI.get()
        if (response.data?.success && response.data?.company) {
          setCompanyData(response.data.company)
        }
      } catch (error) {
        console.error('Error fetching company data:', error)
        // Keep default values on error
      } finally {
        setLoading(false)
      }
    }

    fetchCompanyData()
  }, [])

  if (loading) {
    return (
      <footer className="footer">
        <div className="footer-container">
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255, 255, 255, 0.7)' }}>
            <img 
              src="/image/venuebook.png" 
              alt="ShubhVenue Logo" 
              style={{ 
                height: '70px', 
                width: 'auto', 
                objectFit: 'contain',
                marginBottom: '20px',
                margin: '0 auto 20px',
                animation: 'pulse 2s ease-in-out infinite',
                filter: 'brightness(0) invert(1)'
              }}
              onError={(e) => {
                e.target.onerror = null
                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiByeD0iMTAiIGZpbGw9InVybCgjZ3JhZGllbnQpIi8+CjxzdmcgeD0iMTMiIHk9IjEzIiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSI+CjxwYXRoIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0wIDNjMS42NiAwIDMgMS4zNCAzIDNzLTEuMzQgMy0zIDMtMy0xLjM0LTMtMyAxLjM0LTMgMy0zem0wIDE0LjJjLTIuNjcgMC04IDEuMzQtOCA0djEuOGgxNnYtMS44YzAtMi42Ni01LjMzLTQtOC00eiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9ImdyYWRpZW50IiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj4KPHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6Izk0NDg3QTtzdG9wLW9wYWNpdHk6MSIgLz4KPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojRUM0ODk5O3N0b3Atb3BhY2l0eToxIiAvPgo8L2xpbmVhckdyYWRpZW50Pgo8L2RlZnM+Cjwvc3ZnPg=='
              }}
            />
            Loading...
          </div>
        </div>
      </footer>
    )
  }

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-column">
            <div className="footer-logo-container">
              <div className="footer-logo-wrapper">
                <img 
                  src="/image/venuebook.png" 
                  alt="ShubhVenue Logo" 
                  className="footer-logo-img"
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDUiIGhlaWdodD0iNDUiIHZpZXdCb3g9IjAgMCA0NSA0NSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ1IiBoZWlnaHQ9IjQ1IiByeD0iOCIgZmlsbD0idXJsKCNncmFkaWVudCkiLz4KPHN2ZyB4PSIxMC41IiB5PSIxMC41IiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSI+CjxwYXRoIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0wIDNjMS42NiAwIDMgMS4zNCAzIDNzLTEuMzQgMy0zIDMtMy0xLjM0LTMtMyAxLjM0LTMgMy0zem0wIDE0LjJjLTIuNjcgMC04IDEuMzQtOCA0djEuOGgxNnYtMS44YzAtMi42Ni01LjMzLTQtOC00eiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9ImdyYWRpZW50IiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj4KPHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6Izk0NDg3QTtzdG9wLW9wYWNpdHk6MSIgLz4KPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojRUM0ODk5O3N0b3Atb3BhY2l0eToxIiAvPgo8L2xpbmVhckdyYWRpZW50Pgo8L2RlZnM+Cjwvc3ZnPg=='
                  }}
                />
              </div>
              <h3 className="footer-logo">{companyData.companyName || 'ShubhVenue'}</h3>
            </div>
            <p className="footer-description">
              {companyData.description || 'Your trusted partner in finding the perfect venue for every occasion. Making event planning simple and stress-free.'}
            </p>
            <div className="footer-social">
              {companyData.facebook && (
                <a href={companyData.facebook} target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Facebook">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                  </svg>
                </a>
              )}
              {companyData.twitter && (
                <a href={companyData.twitter} target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Twitter">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                  </svg>
                </a>
              )}
              {companyData.instagram && (
                <a href={companyData.instagram} target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Instagram">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </a>
              )}
              {companyData.linkedin && (
                <a href={companyData.linkedin} target="_blank" rel="noopener noreferrer" className="social-link" aria-label="LinkedIn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                    <rect x="2" y="9" width="4" height="12"></rect>
                    <circle cx="4" cy="4" r="2"></circle>
                  </svg>
                </a>
              )}
            </div>
          </div>

          <div className="footer-column">
            <h4 className="footer-heading">Quick Links</h4>
            <ul className="footer-links">
              <li><Link to="/about-us">About Us</Link></li>
              <li><Link to="/how-it-works">How It Works</Link></li>
              <li><Link to="/venues">Featured Venues</Link></li>
              <li><a href="/#testimonials" onClick={(e) => { 
                e.preventDefault()
                if (window.location.pathname === '/') {
                  window.scrollTo({ top: document.getElementById('testimonials')?.offsetTop || 0, behavior: 'smooth' })
                } else {
                  navigate('/#testimonials')
                  setTimeout(() => {
                    window.scrollTo({ top: document.getElementById('testimonials')?.offsetTop || 0, behavior: 'smooth' })
                  }, 100)
                }
              }}>Testimonials</a></li>
              <li><Link to="/blog">Blog</Link></li>
            </ul>
          </div>

          <div className="footer-column">
            <h4 className="footer-heading">Services</h4>
            <ul className="footer-links">
              <li><a href="/venues" onClick={(e) => { e.preventDefault(); navigate('/venues', { state: { categoryName: 'Wedding' } }) }}>Wedding Venues</a></li>
              <li><a href="/venues" onClick={(e) => { e.preventDefault(); navigate('/venues', { state: { categoryName: 'Corporate Event' } }) }}>Corporate Events</a></li>
              <li><a href="/venues" onClick={(e) => { e.preventDefault(); navigate('/venues', { state: { categoryName: 'Birthday' } }) }}>Birthday Parties</a></li>
              <li><a href="/venues" onClick={(e) => { e.preventDefault(); navigate('/venues', { state: { categoryName: 'Conference' } }) }}>Conferences</a></li>
              <li><a href="/venues" onClick={(e) => { e.preventDefault(); navigate('/venues', { state: { categoryName: 'Anniversary' } }) }}>Anniversaries</a></li>
            </ul>
          </div>

          <div className="footer-column">
            <h4 className="footer-heading">Contact</h4>
            <ul className="footer-contact">
              {companyData.address && (
                <li>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <span>{companyData.address}</span>
                </li>
              )}
              {companyData.phone && (
                <li>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                  <span>{companyData.phone}</span>
                </li>
              )}
              {companyData.email && (
                <li>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  <span>{companyData.email}</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-copyright">
            <p>{companyData.copyright || '© 2024 ShubhVenue. All rights reserved.'}</p>
            <p className="footer-version">Version 1.0.0</p>
          </div>
          <div className="footer-legal">
            <Link to="/privacy-policy">Privacy Policy</Link>
            <Link to="/terms-of-service">Terms of Service</Link>
            <Link to="/cookie-policy">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer

