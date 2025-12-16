import { useState, useEffect } from 'react'
import Footer from '../../components/customer/Footer'
import { publicLegalPagesAPI } from '../../services/customer/api'
import toast from 'react-hot-toast'
import './TermsOfService.css'

function TermsOfService() {
  const [pageData, setPageData] = useState({
    title: 'Terms of Service',
    content: '',
    lastUpdated: new Date()
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPageData = async () => {
      try {
        setLoading(true)
        const response = await publicLegalPagesAPI.getByType('terms-of-service')
        if (response.data?.success && response.data?.legalPage) {
          setPageData({
            title: response.data.legalPage.title || 'Terms of Service',
            content: response.data.legalPage.content || '',
            lastUpdated: response.data.legalPage.lastUpdated ? new Date(response.data.legalPage.lastUpdated) : new Date()
          })
        }
      } catch (error) {
        console.error('Error fetching terms of service:', error)
        toast.error('Failed to load terms of service')
      } finally {
        setLoading(false)
      }
    }

    fetchPageData()
  }, [])

  if (loading) {
    return (
      <div className="terms-page">
        <div className="terms-container">
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
            <p style={{ marginTop: '20px', color: 'var(--gray-medium)' }}>Loading...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="terms-page">
      <div className="terms-container">
        <div className="terms-hero">
          <h1 className="terms-title">{pageData.title}</h1>
          <p className="terms-subtitle">Last updated: {pageData.lastUpdated.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <div className="terms-content">
          <div 
            className="terms-html-content" 
            dangerouslySetInnerHTML={{ __html: pageData.content.replace(/\n/g, '<br />') }}
          />
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default TermsOfService

