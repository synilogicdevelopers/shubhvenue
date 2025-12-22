import { useState, useEffect, useRef } from 'react'
import { publicFAQsAPI } from '../../services/customer/api'
import toast from 'react-hot-toast'
import './FAQ.css'

function FAQ({ onLoadComplete }) {
  const [openIndex, setOpenIndex] = useState(0)
  const [faqs, setFaqs] = useState([])
  const [loading, setLoading] = useState(true)
  const hasFetched = useRef(false)
  const hasNotified = useRef(false)
  const onLoadCompleteRef = useRef(onLoadComplete)

  useEffect(() => {
    onLoadCompleteRef.current = onLoadComplete
  }, [onLoadComplete])

  // Fetch FAQs from API
  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true
    
    const fetchFAQs = async () => {
      try {
        setLoading(true)
        const response = await publicFAQsAPI.getAll()
        if (response.data?.success && response.data?.faqs) {
          setFaqs(response.data.faqs)
        } else {
          setFaqs([])
        }
      } catch (error) {
        console.error('Error fetching FAQs:', error)
        toast.error('Failed to load FAQs')
        setFaqs([])
      } finally {
        setLoading(false)
        if (onLoadCompleteRef.current && !hasNotified.current) {
          hasNotified.current = true
          onLoadCompleteRef.current(true)
        }
      }
    }

    fetchFAQs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  if (loading) {
    return (
      <section className="faq-section">
        <div className="faq-container">
          <h2 className="faq-title">Frequently Asked Questions</h2>
          <p className="faq-subtitle">Got questions? We've got answers!</p>
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
            <p style={{ marginTop: '20px', color: 'var(--gray-medium)' }}>Loading FAQs...</p>
          </div>
        </div>
      </section>
    )
  }

  if (faqs.length === 0) {
    return null // Don't show FAQ section if no FAQs
  }

  return (
    <section className="faq-section">
      <div className="faq-container">
        <h2 className="faq-title">Frequently Asked Questions</h2>
        <p className="faq-subtitle">Got questions? We've got answers!</p>
        <div className="faq-list">
          {faqs.map((faq, index) => (
            <div key={faq._id || faq.id} className={`faq-item ${openIndex === index ? 'open' : ''}`}>
              <button 
                className="faq-question"
                onClick={() => toggleFAQ(index)}
                aria-expanded={openIndex === index}
              >
                <div className="faq-question-content">
                  <span className="faq-number">{String(index + 1).padStart(2, '0')}</span>
                  <span className="faq-question-text">{faq.question}</span>
                </div>
                <div className="faq-icon-wrapper">
                  <svg 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className="faq-icon"
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
              </button>
              <div className="faq-answer">
                <p>{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FAQ

