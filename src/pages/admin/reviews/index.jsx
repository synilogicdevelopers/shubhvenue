import { useEffect, useState } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/admin/ui/Table';
import { Card } from '../../../components/admin/ui/Card';
import { Button } from '../../../components/admin/ui/Button';
import { Badge } from '../../../components/admin/ui/Badge';
import { Input } from '../../../components/admin/ui/Input';
import { Modal } from '../../../components/admin/ui/Modal';
import { reviewsAPI } from '../../../services/admin/api';
import { hasPermission } from '../../../utils/admin/permissions';
import toast from 'react-hot-toast';
import { Search, Eye, Trash2, Edit, Star, User, MapPin, MessageSquare } from 'lucide-react';

export const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [selectedReview, setSelectedReview] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [loadingReview, setLoadingReview] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [formData, setFormData] = useState({
    rating: '',
    comment: '',
  });

  useEffect(() => {
    fetchReviews();
  }, [ratingFilter]);

  const fetchReviews = async () => {
    try {
      const params = {};
      if (ratingFilter !== 'all') params.rating = ratingFilter;
      const response = await reviewsAPI.getAll(params);
      setReviews(response.data?.reviews || []);
    } catch (error) {
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleViewReview = async (id) => {
    setLoadingReview(true);
    setIsModalOpen(true);
    try {
      const response = await reviewsAPI.getById(id);
      setSelectedReview(response.data?.review);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to load review details');
      setIsModalOpen(false);
    } finally {
      setLoadingReview(false);
    }
  };

  const handleEditReview = async (id) => {
    setLoadingReview(true);
    setIsEditModalOpen(true);
    try {
      const response = await reviewsAPI.getById(id);
      const reviewData = response.data?.review;
      setFormData({
        rating: reviewData.rating || '',
        comment: reviewData.comment || '',
      });
      setSelectedReview(reviewData);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to load review details');
      setIsEditModalOpen(false);
    } finally {
      setLoadingReview(false);
    }
  };

  const handleDelete = async (id, skipConfirm = false) => {
    if (!skipConfirm) {
      const targetReview = reviews.find((r) => r._id === id) || selectedReview;
      setConfirmAction({
        id,
        name: targetReview?.comment?.substring(0, 30) || 'this review',
        type: 'delete',
      });
      return;
    }

    setActionLoading(true);
    try {
      await reviewsAPI.delete(id);
      toast.success('Review deleted successfully');
      fetchReviews();
      if (selectedReview && selectedReview._id === id) {
        setIsModalOpen(false);
        setSelectedReview(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete review');
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  };

  const handleUpdate = async () => {
    if (!formData.rating || !formData.comment) {
      toast.error('Please fill all fields');
      return;
    }

    setActionLoading(true);
    try {
      await reviewsAPI.update(selectedReview._id, formData);
      toast.success('Review updated successfully');
      setIsEditModalOpen(false);
      resetForm();
      fetchReviews();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update review');
    } finally {
      setActionLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      rating: '',
      comment: '',
    });
    setSelectedReview(null);
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-gray-300 dark:text-gray-600'
        }`}
      />
    ));
  };

  const filteredReviews = reviews.filter((r) => {
    const matchesSearch =
      r.comment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.venueId?.name?.toLowerCase().includes(searchTerm.toLowerCase());
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Reviews</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage all venue reviews</p>
        </div>
      </div>

      <Card>
        <div className="p-6 space-y-4">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search reviews..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">S.No</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Venue</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Comment</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReviews.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No reviews found
                  </TableCell>
                </TableRow>
              ) : (
                filteredReviews.map((r, idx) => (
                  <TableRow key={r._id}>
                    <TableCell className="text-center font-medium">{idx + 1}</TableCell>
                    <TableCell className="font-medium">
                      {r.userId?.name || 'Unknown User'}
                    </TableCell>
                    <TableCell>{r.venueId?.name || 'Unknown Venue'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {renderStars(r.rating)}
                        <span className="ml-1 text-sm text-gray-600 dark:text-gray-400">
                          ({r.rating})
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{r.comment || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {hasPermission('view_reviews') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewReview(r._id)}
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                        {hasPermission('edit_reviews') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditReview(r._id)}
                            title="Edit Review"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {hasPermission('delete_reviews') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(r._id)}
                            title="Delete Review"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Edit Modal */}
      {hasPermission('edit_reviews') && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            if (!actionLoading) {
              setIsEditModalOpen(false);
              resetForm();
            }
          }}
          title="Edit Review"
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Rating *</label>
              <select
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
              >
                <option value="">Select rating</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Comment *</label>
              <textarea
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                placeholder="Enter review comment"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                rows="4"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditModalOpen(false);
                  resetForm();
                }}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={actionLoading}>
                {actionLoading ? 'Updating...' : 'Update Review'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirmation Modal */}
      <Modal
        isOpen={!!confirmAction}
        onClose={() => {
          if (!actionLoading) setConfirmAction(null);
        }}
        title="Delete Review"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-200">
            Are you sure you want to delete {confirmAction?.name || 'this review'}? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setConfirmAction(null)} disabled={actionLoading}>
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

      {/* Review Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedReview(null);
        }}
        title="Review Details"
        size="lg"
      >
        {loadingReview ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : selectedReview ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">User</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {selectedReview.userId?.name || 'Unknown User'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {selectedReview.userId?.email || ''}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Venue</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {selectedReview.venueId?.name || 'Unknown Venue'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <Star className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Rating</p>
                  <div className="flex items-center gap-1 mt-1">
                    {renderStars(selectedReview.rating)}
                    <span className="ml-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {selectedReview.rating}/5
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Date</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {selectedReview.createdAt
                      ? new Date(selectedReview.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Comment</p>
              <p className="text-gray-900 dark:text-gray-100">{selectedReview.comment || 'N/A'}</p>
            </div>
            {selectedReview.reply && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Reply</p>
                <p className="text-gray-900 dark:text-gray-100">{selectedReview.reply.comment}</p>
                {selectedReview.reply.repliedBy && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    By: {selectedReview.reply.repliedBy.name || 'Unknown'}
                  </p>
                )}
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

