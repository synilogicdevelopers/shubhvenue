import Footer from '../../components/customer/Footer'
import SEO from '../../components/SEO'
import './Blog.css'

function Blog() {
  return (
    <div className="blog-page">
      <SEO 
        title="Blog | ShubhVenue - Wedding Planning Tips & Venue Guides"
        description="Discover expert wedding planning tips, venue selection guides, and inspiration for your perfect event. Stay updated with the latest trends in wedding venues and event planning."
        keywords="wedding blog, wedding planning tips, venue selection guide, wedding inspiration, event planning blog, wedding trends, venue booking tips"
      />
      <div className="blog-container">
        <div className="blog-hero">
          <h1 className="blog-title">Blog</h1>
          <p className="blog-subtitle">Tips, guides, and inspiration for your perfect event</p>
        </div>

        <div className="blog-content">
          <div className="coming-soon">
            <div className="coming-soon-icon">📝</div>
            <h2 className="coming-soon-title">Coming Soon</h2>
            <p className="coming-soon-text">
              We're working on bringing you amazing content about event planning, venue selection tips, 
              and inspiration for your special occasions. Stay tuned!
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default Blog

