import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './VenueCategoryIcons.css'
import { publicCategoriesAPI } from '../../services/customer/api'

function VenueCategoryIcons() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  // Define the specific categories we want to show
  const targetCategories = [
    'Marriage Garden',
    'Banquet Hall',
    'Farm House',
    'Resort',
    'Hotel'
  ]

  // Helper function to get category icon/image URL
  const getCategoryImageUrl = (image) => {
    if (!image) {
      return 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=200&h=200&fit=crop'
    }
    if (image.startsWith('/uploads/')) {
      const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://shubhvenue.com'
      const pathParts = image.split('/')
      const filename = pathParts.pop()
      const encodedFilename = encodeURIComponent(filename)
      const encodedPath = pathParts.join('/') + '/' + encodedFilename
      return `${baseUrl}${encodedPath}`
    }
    if (image.startsWith('http://') || image.startsWith('https://')) {
      return image
    }
    const encodedImage = encodeURIComponent(image)
    return `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://shubhvenue.com'}/uploads/categories/${encodedImage}`
  }

  // Load categories and filter for target categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true)
        const response = await publicCategoriesAPI.getAll({ active: 'true' })
        if (response.data?.success && response.data?.categories) {
          // Filter categories to only show target categories
          const filteredCategories = response.data.categories
            .filter(category => targetCategories.includes(category.name))
            .map(category => ({
              ...category,
              image: getCategoryImageUrl(category.image)
            }))
            // Sort by targetCategories order
            .sort((a, b) => {
              const indexA = targetCategories.indexOf(a.name)
              const indexB = targetCategories.indexOf(b.name)
              return indexA - indexB
            })
          
          setCategories(filteredCategories)
        }
      } catch (error) {
        console.error('Error loading categories:', error)
      } finally {
        setLoading(false)
      }
    }

    loadCategories()
  }, [])

  const handleCategoryClick = (category) => {
    navigate(`/venues?categoryId=${category._id}&categoryName=${encodeURIComponent(category.name)}`, { 
      state: { 
        categoryId: category._id, 
        categoryName: category.name 
      }
    })
  }

  if (loading) {
    return (
      <section className="venue-category-icons">
        <div className="venue-category-icons-container">
          <div style={{ padding: '20px', textAlign: 'center' }}>
            Loading categories...
          </div>
        </div>
      </section>
    )
  }

  if (categories.length === 0) {
    return null
  }

  return (
    <section className="venue-category-icons">
      <div className="venue-category-icons-container">
        <div className="venue-category-icons-wrapper">
          {categories.map((category) => (
            <div 
              key={category._id}
              className="venue-category-icon-item"
              onClick={() => handleCategoryClick(category)}
            >
              <div className="venue-category-icon">
                <img 
                  src={category.image} 
                  alt={category.name}
                  loading="lazy"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=200&h=200&fit=crop'
                  }}
                />
              </div>
              <p className="venue-category-icon-label">{category.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default VenueCategoryIcons

