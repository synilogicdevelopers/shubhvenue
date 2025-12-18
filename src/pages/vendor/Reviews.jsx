import { useState, useEffect } from 'react'
import { reviewAPI, vendorAPI } from '../../services/vendor/api'
import { 
  Star, 
  RefreshCw,
  Filter,
  MessageSquare,
  MapPin,
  Calendar,
  User,
  Reply,
  Send,
  Edit,
  Trash2,
  X,
  Plus
} from 'lucide-react'
import { format } from 'date-fns'
import { getImageUrl } from '../../utils/vendor/imageUrl'

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : 'https://shubhvenue.com/api')

export default function Reviews() {
  const [reviews, setReviews] = useState([])
  const [venues, setVenues] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedVenue, setSelectedVenue] = useState('all')
  const [selectedRating, setSelectedRating] = useState('all')
  const [stats, setStats] = useState({
    total: 0,
    average: 0,
    byRating: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  })
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyMessage, setReplyMessage] = useState('')
  const [editingReply, setEditingReply] = useState(null)
  const [submittingReply, setSubmittingReply] = useState(false)
  const [showAddReviewModal, setShowAddReviewModal] = useState(false)
  const [reviewFormData, setReviewFormData] = useState({
    venueId: '',
    rating: 5,
    comment: ''
  })
  const [confirmAction, setConfirmAction] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [submittingReview, setSubmittingReview] = useState(false)
  const [feedbackModal, setFeedbackModal] = useState(null)

  useEffect(() => {
    loadReviews()
  }, [])

  const loadReviews = async () => {
    try {
      setLoading(true)
      const response = await reviewAPI.getReviewsByVendor()
      const reviewsData = response.data?.reviews || []
      const venuesData = response.data?.venues || []
      
      setReviews(reviewsData)
      
      // Load all vendor venues to ensure we have complete list for adding reviews
      try {
        const venuesResponse = await vendorAPI.getVenues()
        const allVenuesData = venuesResponse.data?.venues || venuesResponse.data?.data || venuesResponse.data || []
        
        // Merge venues from reviews and all venues
        const venueMap = new Map()
        // Add venues from reviews response
        venuesData.forEach(v => {
          const id = v.id || v._id
          venueMap.set(id, { id, name: v.name })
        })
        // Add all vendor venues (this ensures we have all venues even without reviews)
        if (Array.isArray(allVenuesData)) {
          allVenuesData.forEach(v => {
            const id = v.id || v._id
            if (!venueMap.has(id)) {
              venueMap.set(id, { id, name: v.name })
            } else {
              // Update with full name if available
              venueMap.set(id, { id, name: v.name || venueMap.get(id).name })
            }
          })
        }
        setVenues(Array.from(venueMap.values()))
      } catch (venueError) {
        console.error('Failed to load vendor venues:', venueError)
        // Fallback to venues from reviews
        setVenues(venuesData)
      }
      
      // Calculate statistics
      calculateStats(reviewsData)
    } catch (error) {
      console.error('Failed to load reviews:', error)
      setFeedbackModal({
        title: 'Error',
        message: error.response?.data?.error || 'Failed to load reviews',
        status: 'error'
      })
      setReviews([])
      setVenues([])
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (reviewsData) => {
    if (reviewsData.length === 0) {
      setStats({
        total: 0,
        average: 0,
        byRating: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      })
      return
    }

    const total = reviewsData.length
    const sum = reviewsData.reduce((acc, review) => acc + (review.rating || 0), 0)
    const average = sum / total

    const byRating = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    reviewsData.forEach(review => {
      const rating = review.rating || 0
      if (rating >= 5) byRating[5]++
      else if (rating >= 4) byRating[4]++
      else if (rating >= 3) byRating[3]++
      else if (rating >= 2) byRating[2]++
      else if (rating >= 1) byRating[1]++
    })

    setStats({ total, average, byRating })
  }

  const filteredReviews = reviews.filter(review => {
    const venueMatch = selectedVenue === 'all' || 
      (review.venueId?._id || review.venueId?.id || review.venueId)?.toString() === selectedVenue
    const ratingMatch = selectedRating === 'all' || 
      review.rating?.toString() === selectedRating
    return venueMatch && ratingMatch
  })

  const handleReply = async (reviewId, message, isUpdate = false) => {
    if (!message || !message.trim()) {
      setFeedbackModal({
        title: 'Validation Error',
        message: 'Please enter a reply message',
        status: 'error'
      })
      return
    }

    try {
      setSubmittingReply(true)
      if (isUpdate) {
        await reviewAPI.updateReplyToReview(reviewId, message)
        setFeedbackModal({
          title: 'Success',
          message: 'Reply updated successfully!',
          status: 'success'
        })
      } else {
        await reviewAPI.addReplyToReview(reviewId, message)
        setFeedbackModal({
          title: 'Success',
          message: 'Reply added successfully!',
          status: 'success'
        })
      }
      
      setReplyingTo(null)
      setEditingReply(null)
      setReplyMessage('')
      await loadReviews()
    } catch (error) {
      console.error('Failed to submit reply:', error)
      setFeedbackModal({
        title: 'Error',
        message: error.response?.data?.error || 'Failed to submit reply',
        status: 'error'
      })
    } finally {
      setSubmittingReply(false)
    }
  }

  const handleDeleteReply = async (reviewId, skipConfirm = false) => {
    if (!skipConfirm) {
      setConfirmAction({ type: 'delete-reply', reviewId })
      return
    }

    setActionLoading(true)
    // Close confirmation modal first
    setConfirmAction(null)
    
    try {
      await reviewAPI.deleteReplyFromReview(reviewId)
      setFeedbackModal({
        title: 'Success',
        message: 'Reply deleted successfully!',
        status: 'success'
      })
      await loadReviews()
    } catch (error) {
      console.error('Failed to delete reply:', error)
      setFeedbackModal({
        title: 'Error',
        message: error.response?.data?.error || 'Failed to delete reply',
        status: 'error'
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleAddReview = async (e) => {
    e.preventDefault()
    
    if (!reviewFormData.venueId) {
      setFeedbackModal({
        title: 'Validation Error',
        message: 'Please select a venue',
        status: 'error'
      })
      return
    }

    if (!reviewFormData.rating || reviewFormData.rating < 1 || reviewFormData.rating > 5) {
      setFeedbackModal({
        title: 'Validation Error',
        message: 'Please select a rating',
        status: 'error'
      })
      return
    }

    try {
      setSubmittingReview(true)
      await reviewAPI.createReview({
        venueId: reviewFormData.venueId,
        rating: reviewFormData.rating,
        comment: reviewFormData.comment || ''
      })
      
      setFeedbackModal({
        title: 'Success',
        message: 'Review added successfully!',
        status: 'success'
      })
      setShowAddReviewModal(false)
      setReviewFormData({ venueId: '', rating: 5, comment: '' })
      await loadReviews()
    } catch (error) {
      console.error('Failed to add review:', error)
      setFeedbackModal({
        title: 'Error',
        message: error.response?.data?.error || 'Failed to add review',
        status: 'error'
      })
    } finally {
      setSubmittingReview(false)
    }
  }

  const handleReviewInputChange = (e) => {
    const { name, value } = e.target
    setReviewFormData(prev => ({
      ...prev,
      [name]: name === 'rating' ? Number(value) : value
    }))
  }

  const formatLocation = (location) => {
    if (!location) return 'N/A'
    if (typeof location === 'string') return location
    if (typeof location === 'object') {
      const parts = []
      if (location.address) parts.push(location.address)
      if (location.city) parts.push(location.city)
      if (location.state) parts.push(location.state)
      return parts.length > 0 ? parts.join(', ') : 'N/A'
    }
    return 'N/A'
  }

  const getVenueImage = (venue) => {
    if (!venue) return null
    const images = venue.images || []
    if (images.length > 0) {
      const img = images[0]
      return getImageUrl(img)
    }
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reviews</h1>
          <p className="text-gray-600 mt-1">View and manage reviews for your venues</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAddReviewModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Review</span>
          </button>
          <button
            onClick={loadReviews}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Reviews</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average Rating</p>
              <div className="flex items-center space-x-2 mt-1">
                <p className="text-2xl font-bold text-gray-900">{stats.average.toFixed(1)}</p>
                <div className="flex items-center">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                </div>
              </div>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Star className="w-6 h-6 text-yellow-600 fill-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">5 Star Reviews</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.byRating[5]}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Star className="w-6 h-6 text-green-600 fill-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Venues Reviewed</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{venues.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Venue</label>
            <select
              value={selectedVenue}
              onChange={(e) => setSelectedVenue(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Venues</option>
              {venues.map((venue) => (
                <option key={venue.id || venue._id} value={venue.id || venue._id}>
                  {venue.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Rating</label>
            <select
              value={selectedRating}
              onChange={(e) => setSelectedRating(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      {filteredReviews.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-50 rounded-full mb-4">
            <MessageSquare className="w-10 h-10 text-primary-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Reviews Yet</h3>
          <p className="text-gray-600">
            {reviews.length === 0 
              ? "You haven't received any reviews yet. Reviews will appear here once customers review your venues."
              : "No reviews match your current filters."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Showing {filteredReviews.length} review{filteredReviews.length !== 1 ? 's' : ''}
            </h3>
          </div>
          
          {filteredReviews.map((review) => {
            const venue = review.venueId
            const user = review.userId
            const venueId = venue?._id || venue?.id || venue
            const venueName = venue?.name || 'Unknown Venue'
            const userName = user?.name || user?.email || 'Anonymous'
            const userEmail = user?.email || ''
            const rating = review.rating || 0
            const comment = review.comment || ''
            const createdAt = review.createdAt ? new Date(review.createdAt) : new Date()

            return (
              <div key={review._id || review.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition">
                <div className="flex items-start space-x-4">
                  {/* Venue Image */}
                  {getVenueImage(venue) && (
                    <div className="flex-shrink-0">
                      <img
                        src={getVenueImage(venue)}
                        alt={venueName}
                        className="w-20 h-20 object-cover rounded-lg"
                        onError={(e) => {
                          e.target.style.display = 'none'
                        }}
                      />
                    </div>
                  )}

                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="text-lg font-semibold text-gray-900">{venueName}</h4>
                          <span className="text-gray-400">•</span>
                          <div className="flex items-center space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <User className="w-4 h-4" />
                            <span>{userName}</span>
                            {userEmail && <span className="text-gray-400">({userEmail})</span>}
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{format(createdAt, 'MMM dd, yyyy')}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Comment */}
                    {comment && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-gray-700">{comment}</p>
                      </div>
                    )}

                    {/* Venue Location */}
                    {venue?.location && (
                      <div className="mt-3 flex items-center space-x-1 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{formatLocation(venue.location)}</span>
                      </div>
                    )}

                    {/* Vendor Reply */}
                    {review.reply && (
                      <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-semibold text-blue-900">Vendor Reply</span>
                            {review.reply.repliedBy && (
                              <span className="text-xs text-blue-700">
                                by {review.reply.repliedBy?.name || 'Vendor'}
                              </span>
                            )}
                            {review.reply.repliedAt && (
                              <span className="text-xs text-blue-600">
                                {format(new Date(review.reply.repliedAt), 'MMM dd, yyyy')}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setEditingReply(review._id || review.id)
                                setReplyMessage(review.reply.message || '')
                              }}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteReply(review._id || review.id)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        {editingReply === (review._id || review.id) ? (
                          <div className="mt-2">
                            <textarea
                              value={replyMessage}
                              onChange={(e) => setReplyMessage(e.target.value)}
                              rows={3}
                              className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Enter your reply..."
                            />
                            <div className="flex items-center space-x-2 mt-2">
                              <button
                                onClick={() => handleReply(review._id || review.id, replyMessage, true)}
                                disabled={submittingReply}
                                className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50"
                              >
                                {submittingReply ? 'Updating...' : 'Update'}
                              </button>
                              <button
                                onClick={() => {
                                  setEditingReply(null)
                                  setReplyMessage('')
                                }}
                                className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-blue-800">{review.reply.message}</p>
                        )}
                      </div>
                    )}

                    {/* Reply Button */}
                    {!review.reply && (
                      <div className="mt-4">
                        {replyingTo === (review._id || review.id) ? (
                          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                            <textarea
                              value={replyMessage}
                              onChange={(e) => setReplyMessage(e.target.value)}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              placeholder="Enter your reply..."
                            />
                            <div className="flex items-center space-x-2 mt-2">
                              <button
                                onClick={() => handleReply(review._id || review.id, replyMessage)}
                                disabled={submittingReply}
                                className="flex items-center space-x-1 px-3 py-1 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm disabled:opacity-50"
                              >
                                <Send className="w-4 h-4" />
                                <span>{submittingReply ? 'Sending...' : 'Send Reply'}</span>
                              </button>
                              <button
                                onClick={() => {
                                  setReplyingTo(null)
                                  setReplyMessage('')
                                }}
                                className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setReplyingTo(review._id || review.id)
                              setReplyMessage('')
                            }}
                            className="flex items-center space-x-1 text-primary-600 hover:text-primary-700 text-sm font-medium"
                          >
                            <Reply className="w-4 h-4" />
                            <span>Reply</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Review Modal */}
      {showAddReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Add Review</h2>
              <button
                onClick={() => {
                  setShowAddReviewModal(false)
                  setReviewFormData({ venueId: '', rating: 5, comment: '' })
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddReview} className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Venue <span className="text-red-500">*</span>
                </label>
                <select
                  name="venueId"
                  value={reviewFormData.venueId}
                  onChange={handleReviewInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select a venue</option>
                  {venues.map((venue) => (
                    <option key={venue.id || venue._id} value={venue.id || venue._id}>
                      {venue.name}
                    </option>
                  ))}
                </select>
                {venues.length === 0 && (
                  <p className="text-sm text-gray-500 mt-2">No venues available. Please add venues first.</p>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Rating <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewFormData({ ...reviewFormData, rating: star })}
                      className="focus:outline-none"
                    >
                      <Star
                        size={32}
                        className={
                          star <= reviewFormData.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-gray-600">
                    {reviewFormData.rating} {reviewFormData.rating === 1 ? 'star' : 'stars'}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Review Comment
                </label>
                <textarea
                  name="comment"
                  value={reviewFormData.comment}
                  onChange={handleReviewInputChange}
                  rows={6}
                  placeholder="Write your review about this venue..."
                  maxLength={500}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {reviewFormData.comment.length}/500 characters
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddReviewModal(false)
                    setReviewFormData({ venueId: '', rating: 5, comment: '' })
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview || !reviewFormData.venueId || !reviewFormData.rating}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingReview ? 'Adding...' : 'Add Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">Delete Reply</h3>
              <p className="text-sm text-gray-600">
                Are you sure you want to delete this reply? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteReply(confirmAction.reviewId, true)}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                disabled={actionLoading}
              >
                {actionLoading ? 'Please wait...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {feedbackModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className={`rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4 ${
            feedbackModal.status === 'error' 
              ? 'bg-red-50 border-2 border-red-200' 
              : feedbackModal.status === 'success'
              ? 'bg-green-50 border-2 border-green-200'
              : 'bg-white border-2 border-gray-200'
          }`}>
            <div className="space-y-2">
              <h3 className={`text-lg font-semibold ${
                feedbackModal.status === 'error' 
                  ? 'text-red-900' 
                  : feedbackModal.status === 'success'
                  ? 'text-green-900'
                  : 'text-gray-900'
              }`}>
                {feedbackModal.title || 'Notice'}
              </h3>
              <p className={`text-sm ${
                feedbackModal.status === 'error' 
                  ? 'text-red-700' 
                  : feedbackModal.status === 'success'
                  ? 'text-green-700'
                  : 'text-gray-700'
              }`}>
                {feedbackModal.message}
              </p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setFeedbackModal(null)}
                className={`px-4 py-2 rounded-lg text-white hover:opacity-90 transition ${
                  feedbackModal.status === 'error' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : feedbackModal.status === 'success'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-primary-600 hover:bg-primary-700'
                }`}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

