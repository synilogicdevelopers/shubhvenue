import { useState, useEffect } from 'react'
import { videosAPI } from '../../services/vendor/api'
import { getImageUrl } from '../../utils/vendor/imageUrl'
import { 
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  X,
  Play,
  Video as VideoIcon,
  Search
} from 'lucide-react'

export default function Videos() {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingVideo, setEditingVideo] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    video: '',
    thumbnail: '',
    link: '',
    isActive: true,
    sortOrder: 0,
    startDate: '',
    endDate: '',
  })
  const [videoFile, setVideoFile] = useState(null)
  const [videoPreview, setVideoPreview] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchVideos()
  }, [])

  const fetchVideos = async () => {
    try {
      setLoading(true)
      const response = await videosAPI.getAll({ isActive: 'all' })
      let videosData = []
      if (response.data) {
        if (response.data.videos && Array.isArray(response.data.videos)) {
          videosData = response.data.videos
        } else if (Array.isArray(response.data)) {
          videosData = response.data
        } else if (response.data.data && Array.isArray(response.data.data)) {
          videosData = response.data.data
        }
      }
      setVideos(videosData)
    } catch (error) {
      console.error('Error fetching videos:', error)
      alert(error.response?.data?.error || error.response?.data?.message || 'Failed to load videos')
      setVideos([])
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (video = null) => {
    if (video) {
      setEditingVideo(video)
      setFormData({
        title: video.title || '',
        description: video.description || '',
        video: video.video || '',
        thumbnail: video.thumbnail || '',
        link: video.link || '',
        isActive: video.isActive !== undefined ? video.isActive : true,
        sortOrder: video.sortOrder || 0,
        startDate: video.startDate ? new Date(video.startDate).toISOString().split('T')[0] : '',
        endDate: video.endDate ? new Date(video.endDate).toISOString().split('T')[0] : '',
      })
      // Handle video preview
      const videoUrl = video.video ? getImageUrl(video.video) : null
      setVideoPreview(videoUrl)
      setVideoFile(null)
    } else {
      setEditingVideo(null)
      setFormData({
        title: '',
        description: '',
        video: '',
        thumbnail: '',
        link: '',
        isActive: true,
        sortOrder: 0,
        startDate: '',
        endDate: '',
      })
      setVideoPreview(null)
      setVideoFile(null)
    }
    setShowAddModal(true)
  }

  const handleCloseModal = () => {
    setShowAddModal(false)
    setEditingVideo(null)
    setFormData({
      title: '',
      description: '',
      video: '',
      thumbnail: '',
      link: '',
      isActive: true,
      sortOrder: 0,
      startDate: '',
      endDate: '',
    })
    setVideoFile(null)
    setVideoPreview(null)
  }

  const handleVideoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setVideoFile(file)
      // Create preview URL for video
      const videoUrl = URL.createObjectURL(file)
      setVideoPreview(videoUrl)
      // Clear URL input if file is selected
      setFormData({ ...formData, video: '' })
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      alert('Video title is required')
      return
    }

    if (!videoFile && !formData.video) {
      alert('Video file or URL is required')
      return
    }

    try {
      setSubmitting(true)
      // Create FormData for file upload
      const submitData = new FormData()
      submitData.append('title', formData.title)
      submitData.append('description', formData.description || '')
      submitData.append('link', formData.link || '')
      submitData.append('thumbnail', formData.thumbnail || '')
      submitData.append('isActive', formData.isActive)
      submitData.append('sortOrder', formData.sortOrder)
      
      if (formData.startDate) {
        submitData.append('startDate', formData.startDate)
      }
      if (formData.endDate) {
        submitData.append('endDate', formData.endDate)
      }
      
      // Add video file if selected, otherwise add video URL
      if (videoFile) {
        submitData.append('video', videoFile)
      } else if (formData.video) {
        submitData.append('video', formData.video)
      }

      if (editingVideo) {
        await videosAPI.update(editingVideo._id || editingVideo.id, submitData)
        alert('Video updated successfully!')
      } else {
        await videosAPI.create(submitData)
        alert('Video created successfully!')
      }
      handleCloseModal()
      fetchVideos()
    } catch (error) {
      console.error('Error saving video:', error)
      alert(error.response?.data?.error || error.response?.data?.message || 'Failed to save video')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id, skipConfirm = false, videoMeta = {}) => {
    if (!skipConfirm) {
      setConfirmAction({ id, name: videoMeta.title })
      return
    }
    
    setActionLoading(true)
    try {
      await videosAPI.delete(id)
      alert('Video deleted successfully!')
      fetchVideos()
    } catch (error) {
      console.error('Error deleting video:', error)
      alert(error.response?.data?.error || error.response?.data?.message || 'Failed to delete video')
    } finally {
      setActionLoading(false)
      setConfirmAction(null)
    }
  }

  const handleToggleActive = async (id) => {
    try {
      await videosAPI.toggleActive(id)
      fetchVideos()
    } catch (error) {
      console.error('Error toggling video status:', error)
      alert(error.response?.data?.error || error.response?.data?.message || 'Failed to toggle video status')
    }
  }

  const getVideoUrl = (video) => {
    if (!video) return null
    return getImageUrl(video)
  }

  const filteredVideos = videos.filter(video =>
    video.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    video.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
          <h1 className="text-3xl font-bold text-gray-900">Videos</h1>
          <p className="text-gray-600 mt-1">Manage and upload videos</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Video</span>
          </button>
          <button
            onClick={fetchVideos}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search videos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Videos Grid */}
      {filteredVideos.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <VideoIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Videos</h3>
          <p className="text-gray-600 mb-4">Get started by uploading your first video</p>
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            Add Video
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => {
            const videoUrl = getVideoUrl(video.video)
            return (
              <div key={video._id || video.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Video Player */}
                <div className="relative aspect-video bg-gray-900">
                  {videoUrl ? (
                    <video
                      src={videoUrl}
                      controls
                      className="w-full h-full object-contain"
                      poster={video.thumbnail || undefined}
                    >
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <VideoIcon className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      video.isActive 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {video.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {/* Video Info */}
                <div className="p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{video.title}</h3>
                  {video.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{video.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleActive(video._id || video.id)}
                        className={`px-3 py-1 rounded text-xs font-medium ${
                          video.isActive
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {video.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleOpenModal(video)}
                        className="text-primary-600 hover:text-primary-800"
                        title="Edit video"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(video._id || video.id, false, { title: video.title })}
                        className="text-red-600 hover:text-red-800"
                        title="Delete video"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">Delete Video</h3>
              <p className="text-sm text-gray-600">
                Delete {confirmAction?.name || 'this video'}? This action cannot be undone.
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
                onClick={() => handleDelete(confirmAction.id, true)}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                disabled={actionLoading}
              >
                {actionLoading ? 'Please wait...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Video Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingVideo ? 'Edit Video' : 'Add Video'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter video title"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Enter video description"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video <span className="text-red-500">*</span>
                </label>
                <div className="space-y-3">
                  {/* File Upload */}
                  <div>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoChange}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-lg file:border-0
                        file:text-sm file:font-semibold
                        file:bg-primary-600 file:text-white
                        hover:file:bg-primary-700
                        cursor-pointer"
                    />
                    <p className="mt-1 text-xs text-gray-500">Upload a video file (MP4, WebM, MOV, AVI, MKV - Max 100MB)</p>
                  </div>
                  
                  {/* Video Preview */}
                  {videoPreview && (
                    <div className="mt-2">
                      <video
                        src={videoPreview}
                        controls
                        className="w-full max-w-md h-48 object-contain rounded-lg border border-gray-300"
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  )}
                  
                  {/* OR Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">OR</span>
                    </div>
                  </div>
                  
                  {/* URL Input */}
                  <input
                    type="url"
                    name="video"
                    value={formData.video}
                    onChange={handleInputChange}
                    placeholder="Enter video URL (e.g., https://example.com/video.mp4)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thumbnail URL (Optional)
                </label>
                <input
                  type="url"
                  name="thumbnail"
                  value={formData.thumbnail}
                  onChange={handleInputChange}
                  placeholder="Enter thumbnail image URL"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Link (Optional)
                  </label>
                  <input
                    type="url"
                    name="link"
                    value={formData.link}
                    onChange={handleInputChange}
                    placeholder="Enter link URL"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    name="sortOrder"
                    value={formData.sortOrder}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date (Optional)
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Active</span>
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Saving...' : editingVideo ? 'Update Video' : 'Add Video'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

