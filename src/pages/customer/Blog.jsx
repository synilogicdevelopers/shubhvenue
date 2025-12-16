import Footer from '../../components/customer/Footer'
import './Blog.css'

function Blog() {
  return (
    <div className="blog-page">
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

