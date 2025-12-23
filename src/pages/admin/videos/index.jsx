import { useEffect, useState } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/admin/ui/Table';
import { Card } from '../../../components/admin/ui/Card';
import { Button } from '../../../components/admin/ui/Button';
import { Badge } from '../../../components/admin/ui/Badge';
import { Input } from '../../../components/admin/ui/Input';
import { Modal } from '../../../components/admin/ui/Modal';
import { videosAPI } from '../../../services/admin/api';
import { getImageUrl } from '../../../utils/admin/imageUrl';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Search, Video as VideoIcon, Play } from 'lucide-react';

export const Videos = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
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
  });
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);

  // Helper function to get video URL
  const getVideoUrl = (video) => {
    if (!video) return null;
    if (video.startsWith('/uploads/')) {
      return getImageUrl(video);
    }
    if (video.startsWith('http://') || video.startsWith('https://')) {
      return video;
    }
    // If it's a relative URL without /uploads, add it
    return getImageUrl(`/uploads/videos/${video}`);
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      console.log('Fetching videos...');
      // Don't send isActive parameter if we want all videos
      const response = await videosAPI.getAll();
      console.log('Videos API Full Response:', response);
      console.log('Videos API Response Data:', response?.data);
      
      let videosData = [];
      if (response && response.data) {
        // Check for response.data.videos (expected format: { success: true, videos: [...] })
        if (response.data.videos && Array.isArray(response.data.videos)) {
          videosData = response.data.videos;
          console.log('Found videos in response.data.videos:', videosData.length);
        } 
        // Check if response.data is directly an array
        else if (Array.isArray(response.data)) {
          videosData = response.data;
          console.log('Found videos in response.data (array):', videosData.length);
        } 
        // Check for nested data structure
        else if (response.data.data && Array.isArray(response.data.data)) {
          videosData = response.data.data;
          console.log('Found videos in response.data.data:', videosData.length);
        }
        else {
          console.warn('Unexpected response structure:', response.data);
        }
      } else {
        console.warn('No response data found');
      }
      
      console.log('Final parsed videos:', videosData);
      console.log('Total videos found:', videosData.length);
      setVideos(videosData);
      
      if (videosData.length === 0) {
        console.log('No videos found. You can create a new video using the "Add Video" button.');
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
      console.error('Error response:', error.response);
      console.error('Error details:', error.response?.data);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to load videos';
      toast.error(errorMessage);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (video = null) => {
    if (video) {
      setEditingVideo(video);
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
      });
      // Handle video preview
      const videoUrl = video.video ? getVideoUrl(video.video) : null;
      setVideoPreview(videoUrl);
      setVideoFile(null);
    } else {
      setEditingVideo(null);
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
      });
      setVideoPreview(null);
      setVideoFile(null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingVideo(null);
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
    });
    setVideoFile(null);
    setVideoPreview(null);
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoFile(file);
      // Create preview URL for video
      const videoUrl = URL.createObjectURL(file);
      setVideoPreview(videoUrl);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Video title is required');
      return;
    }

    // For new videos, file is required. For editing, file is optional (existing video will be preserved)
    if (!editingVideo && !videoFile) {
      toast.error('Video file is required');
      return;
    }

    try {
      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description || '');
      submitData.append('link', formData.link || '');
      submitData.append('thumbnail', formData.thumbnail || '');
      submitData.append('isActive', formData.isActive);
      submitData.append('sortOrder', formData.sortOrder);
      
      if (formData.startDate) {
        submitData.append('startDate', formData.startDate);
      }
      if (formData.endDate) {
        submitData.append('endDate', formData.endDate);
      }
      
      // Add video file if new file uploaded
      if (videoFile) {
        submitData.append('video', videoFile);
      } else if (editingVideo && formData.video && formData.video.trim()) {
        // When editing without new file, send existing video URL to preserve it
        // Backend will preserve existing video if no file and no video field sent
        // But we send it explicitly to ensure it's preserved
        submitData.append('video', formData.video.trim());
      }

      if (editingVideo) {
        await videosAPI.update(editingVideo._id, submitData);
        toast.success('Video updated successfully');
      } else {
        await videosAPI.create(submitData);
        toast.success('Video created successfully');
      }
      handleCloseModal();
      fetchVideos();
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to save video';
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (id, skipConfirm = false, videoMeta = {}) => {
    if (!skipConfirm) {
      setConfirmAction({ id, name: videoMeta.title });
      return;
    }
    
    setActionLoading(true);
    try {
      await videosAPI.delete(id);
      toast.success('Video deleted successfully');
      fetchVideos();
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to delete video';
      toast.error(errorMessage);
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  };

  const handleToggleActive = async (video) => {
    try {
      await videosAPI.toggleActive(video._id);
      toast.success(`Video ${!video.isActive ? 'activated' : 'deactivated'} successfully`);
      fetchVideos();
    } catch (error) {
      toast.error('Failed to update video status');
    }
  };

  const filteredVideos = videos.filter(video => {
    const matchesSearch = 
      video.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Videos</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage and upload videos</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Video
        </Button>
      </div>

      <Card>
        <div className="p-6 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search videos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">S.No</TableHead>
                <TableHead>Video</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Link</TableHead>
                <TableHead>Sort Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVideos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <VideoIcon className="w-8 h-8 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                          {searchTerm ? 'No videos match your search' : 'No videos yet'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                          {searchTerm 
                            ? 'Try adjusting your search terms'
                            : 'Create your first video to showcase your services'
                          }
                        </p>
                        {!searchTerm && (
                          <Button onClick={() => handleOpenModal()} size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Your First Video
                          </Button>
                        )}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredVideos.map((video, idx) => {
                  const videoUrl = getVideoUrl(video.video);
                  return (
                    <TableRow key={video._id}>
                      <TableCell className="text-center font-medium">{idx + 1}</TableCell>
                      <TableCell>
                        {videoUrl ? (
                          <div className="relative w-32 h-20 bg-gray-900 rounded overflow-hidden">
                            <video
                              src={videoUrl}
                              className="w-full h-full object-cover"
                              poster={video.thumbnail ? getVideoUrl(video.thumbnail) : undefined}
                              controls
                              preload="metadata"
                              onError={(e) => {
                                console.error('Video load error:', videoUrl, e);
                                e.target.style.display = 'none';
                              }}
                            >
                              Your browser does not support the video tag.
                            </video>
                          </div>
                        ) : (
                          <div className="w-32 h-20 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
                            <VideoIcon className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {video.title}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {video.description || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {video.link ? (
                          <a 
                            href={video.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline truncate max-w-xs block"
                          >
                            {video.link}
                          </a>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>{video.sortOrder || 0}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={video.isActive ? 'success' : 'danger'}
                          className="cursor-pointer"
                          onClick={() => handleToggleActive(video)}
                        >
                          {video.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleOpenModal(video)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                              onClick={() => handleDelete(video._id, false, { title: video.title })}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Confirmation Modal */}
      <Modal
        isOpen={!!confirmAction}
        onClose={() => {
          if (!actionLoading) setConfirmAction(null);
        }}
        title="Delete Video"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-200">
            Delete {confirmAction?.name || 'this video'}? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setConfirmAction(null)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => handleDelete(confirmAction.id, true)}
              disabled={actionLoading}
            >
              {actionLoading ? 'Please wait...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingVideo ? 'Edit Video' : 'Add New Video'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-2.5 max-h-[75vh] overflow-y-auto px-1">
          <Input
            label="Video Title *"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Venue Tour, Wedding Highlights"
            required
          />

          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Video description..."
              rows={2}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
              Video *
            </label>
            <div className="space-y-2">
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
                    file:bg-primary file:text-white
                    hover:file:bg-primary/90
                    cursor-pointer"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Upload a video file (MP4, WebM, MOV, AVI, MKV - Max 100MB)</p>
              </div>
              
              {/* Video Preview */}
              {videoPreview && (
                <div className="mt-1.5">
                  <video
                    src={videoPreview}
                    controls
                    className="w-full h-24 object-contain rounded border border-gray-300 dark:border-gray-600"
                    style={{ maxHeight: '96px' }}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}
            </div>
          </div>

          <Input
            label="Thumbnail URL (Optional)"
            value={formData.thumbnail}
            onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
            placeholder="https://example.com/thumbnail.jpg"
            type="url"
          />

          <Input
            label="Link (Optional)"
            value={formData.link}
            onChange={(e) => setFormData({ ...formData, link: e.target.value })}
            placeholder="https://example.com"
            type="url"
          />

          <Input
            label="Sort Order"
            value={formData.sortOrder}
            onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
            type="number"
            min="0"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Date (Optional)"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              type="date"
            />
            <Input
              label="End Date (Optional)"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              type="date"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Active
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1">
              {editingVideo ? 'Update Video' : 'Create Video'}
            </Button>
            <Button type="button" variant="ghost" onClick={handleCloseModal} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

