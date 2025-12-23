import { useEffect, useState } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/admin/ui/Table';
import { Card } from '../../../components/admin/ui/Card';
import { Button } from '../../../components/admin/ui/Button';
import { Badge } from '../../../components/admin/ui/Badge';
import { Input } from '../../../components/admin/ui/Input';
import { Modal } from '../../../components/admin/ui/Modal';
import { Pagination } from '../../../components/admin/ui/Pagination';
import { testimonialsAPI } from '../../../services/admin/api';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Search, MessageSquare } from 'lucide-react';

export const Testimonials = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [formData, setFormData] = useState({
    name: '',
    text: '',
    event: '',
    rating: 5,
    image: '',
    isActive: true,
    sortOrder: 0,
  });

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      // Don't pass isActive filter to get all testimonials
      const response = await testimonialsAPI.getAll();
      console.log('Testimonials API Response:', response);
      console.log('Testimonials API Response Data:', response.data);
      
      let testimonialsData = [];
      if (response.data) {
        if (response.data.success && response.data.testimonials && Array.isArray(response.data.testimonials)) {
          testimonialsData = response.data.testimonials;
        } else if (response.data.testimonials && Array.isArray(response.data.testimonials)) {
          testimonialsData = response.data.testimonials;
        } else if (Array.isArray(response.data)) {
          testimonialsData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          testimonialsData = response.data.data;
        }
      }
      
      console.log('Parsed testimonials:', testimonialsData);
      console.log('Testimonials count:', testimonialsData.length);
      setTestimonials(testimonialsData);
      
      if (testimonialsData.length === 0) {
        console.log('No testimonials found. You can create a new testimonial using the "Add Testimonial" button.');
      }
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      console.error('Error response:', error.response);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to load testimonials';
      toast.error(errorMessage);
      setTestimonials([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (testimonial = null) => {
    if (testimonial) {
      setEditingTestimonial(testimonial);
      setFormData({
        name: testimonial.name || '',
        text: testimonial.text || '',
        event: testimonial.event || '',
        rating: testimonial.rating || 5,
        image: testimonial.image || '',
        isActive: testimonial.isActive !== undefined ? testimonial.isActive : true,
        sortOrder: testimonial.sortOrder || 0,
      });
    } else {
      setEditingTestimonial(null);
      setFormData({
        name: '',
        text: '',
        event: '',
        rating: 5,
        image: '',
        isActive: true,
        sortOrder: 0,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTestimonial(null);
    setFormData({
      name: '',
      text: '',
      event: '',
      rating: 5,
      image: '',
      isActive: true,
      sortOrder: 0,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }
    
    if (!formData.text.trim()) {
      toast.error('Testimonial text is required');
      return;
    }

    try {
      if (editingTestimonial) {
        await testimonialsAPI.update(editingTestimonial._id, formData);
        toast.success('Testimonial updated successfully');
      } else {
        await testimonialsAPI.create(formData);
        toast.success('Testimonial created successfully');
      }
      handleCloseModal();
      fetchTestimonials();
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to save testimonial';
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (id, skipConfirm = false, testimonialMeta = {}) => {
    if (!skipConfirm) {
      setConfirmAction({ id, name: testimonialMeta.name });
      return;
    }
    
    setActionLoading(true);
    try {
      await testimonialsAPI.delete(id);
      toast.success('Testimonial deleted successfully');
      fetchTestimonials();
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to delete testimonial';
      toast.error(errorMessage);
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  };

  const handleToggleActive = async (testimonial) => {
    try {
      await testimonialsAPI.toggleActive(testimonial._id);
      toast.success(`Testimonial ${!testimonial.isActive ? 'activated' : 'deactivated'} successfully`);
      fetchTestimonials();
    } catch (error) {
      toast.error('Failed to update testimonial status');
    }
  };

  const filteredTestimonials = testimonials.filter(testimonial => {
    const matchesSearch = 
      testimonial.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      testimonial.text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      testimonial.event?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Pagination logic
  const totalItems = filteredTestimonials.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTestimonials = filteredTestimonials.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Testimonials</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage customer testimonials</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Testimonial
        </Button>
      </div>

      <Card>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search testimonials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Total Count */}
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total Testimonials: <span className="font-medium text-gray-900 dark:text-gray-100">{totalItems}</span>
          </div>

          {paginatedTestimonials.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm ? 'No testimonials found matching your search' : 'No testimonials found. Create your first testimonial!'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">S.No</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Text</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Sort Order</TableHead>
                    <TableHead className="min-w-[100px]">Status</TableHead>
                    <TableHead className="text-right min-w-[180px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTestimonials.map((testimonial, idx) => (
                    <TableRow key={testimonial._id}>
                      <TableCell className="text-center font-medium">{startIndex + idx + 1}</TableCell>
                      <TableCell className="font-medium">{testimonial.name}</TableCell>
                      <TableCell className="max-w-md">
                        <div className="truncate" title={testimonial.text}>
                          {testimonial.text}
                        </div>
                      </TableCell>
                      <TableCell>{testimonial.event || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i} className={i < (testimonial.rating || 5) ? 'text-yellow-400' : 'text-gray-300'}>
                              ★
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{testimonial.sortOrder || 0}</TableCell>
                      <TableCell className="min-w-[100px]">
                        <Badge variant={testimonial.isActive ? 'success' : 'secondary'} className="whitespace-nowrap">
                          {testimonial.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right min-w-[180px]">
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(testimonial)}
                            className="whitespace-nowrap text-xs px-2"
                          >
                            {testimonial.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenModal(testimonial)}
                            className="p-2"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(testimonial._id, false, { name: testimonial.name })}
                            className="p-2"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalItems > 10 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      </Card>

      {/* Confirmation Modal */}
      <Modal
        isOpen={!!confirmAction}
        onClose={() => {
          if (!actionLoading) setConfirmAction(null);
        }}
        title="Delete Testimonial"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-200">
            Delete {confirmAction?.name || 'this testimonial'}? This action cannot be undone.
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

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingTestimonial ? 'Edit Testimonial' : 'Add Testimonial'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Customer name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Testimonial Text <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              placeholder="Enter testimonial text"
              required
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Event
            </label>
            <Input
              type="text"
              value={formData.event}
              onChange={(e) => setFormData({ ...formData, event: e.target.value })}
              placeholder="e.g., Booked a Wedding Venue"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Rating
            </label>
            <Input
              type="number"
              min="1"
              max="5"
              value={formData.rating}
              onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) || 5 })}
              placeholder="Rating (1-5)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Image URL
            </label>
            <Input
              type="text"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              placeholder="Optional image URL"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Sort Order
            </label>
            <Input
              type="number"
              value={formData.sortOrder}
              onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
              placeholder="Sort order (lower numbers appear first)"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Active
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit">
              {editingTestimonial ? 'Update' : 'Create'} Testimonial
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

