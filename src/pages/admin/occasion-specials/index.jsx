import { useEffect, useState } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/admin/ui/Table';
import { Card } from '../../../components/admin/ui/Card';
import { Button } from '../../../components/admin/ui/Button';
import { Badge } from '../../../components/admin/ui/Badge';
import { Input } from '../../../components/admin/ui/Input';
import { Modal } from '../../../components/admin/ui/Modal';
import { Pagination } from '../../../components/admin/ui/Pagination';
import { occasionSpecialsAPI } from '../../../services/admin/api';
import { getImageUrl } from '../../../utils/admin/imageUrl';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Search, Sparkles } from 'lucide-react';

export const OccasionSpecials = () => {
  const [occasionSpecials, setOccasionSpecials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOccasionSpecial, setEditingOccasionSpecial] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    isActive: true,
    sortOrder: 0
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    fetchOccasionSpecials();
  }, []);

  const fetchOccasionSpecials = async () => {
    try {
      setLoading(true);
      
      const response = await occasionSpecialsAPI.getAll({ active: 'all' });
      
      let occasionSpecialsData = [];
      if (response && response.data) {
        if (response.data.occasionSpecials && Array.isArray(response.data.occasionSpecials)) {
          occasionSpecialsData = response.data.occasionSpecials;
        } 
        else if (Array.isArray(response.data)) {
          occasionSpecialsData = response.data;
        } 
        else if (response.data.data && Array.isArray(response.data.data)) {
          occasionSpecialsData = response.data.data;
        }
        else if (response.data.success && response.data.occasionSpecials) {
          occasionSpecialsData = response.data.occasionSpecials;
        }
      }
      
      setOccasionSpecials(occasionSpecialsData);
    } catch (error) {
      console.error('Error fetching occasion specials:', error);
      const errorMessage = error.response?.data?.error 
        || error.response?.data?.message 
        || error.message 
        || 'Failed to load occasion specials';
      
      toast.error(`Failed to load occasion specials: ${errorMessage}`);
      setOccasionSpecials([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (occasionSpecial = null) => {
    if (occasionSpecial) {
      setEditingOccasionSpecial(occasionSpecial);
      setFormData({
        name: occasionSpecial.name || '',
        description: occasionSpecial.description || '',
        image: occasionSpecial.image || '',
        isActive: occasionSpecial.isActive !== undefined ? occasionSpecial.isActive : true,
        sortOrder: occasionSpecial.sortOrder || 0
      });
      const imageUrl = occasionSpecial.image ? getImageUrl(occasionSpecial.image) : null;
      setImagePreview(imageUrl);
      setImageFile(null);
    } else {
      setEditingOccasionSpecial(null);
      setFormData({
        name: '',
        description: '',
        image: '',
        isActive: true,
        sortOrder: 0
      });
      setImagePreview(null);
      setImageFile(null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingOccasionSpecial(null);
    setFormData({
      name: '',
      description: '',
      image: '',
      isActive: true,
      sortOrder: 0
    });
    setImageFile(null);
    setImagePreview(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Occasion special name is required');
      return;
    }

    if (!imageFile && !formData.image) {
      toast.error('Image is required');
      return;
    }

    try {
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('description', formData.description || '');
      submitData.append('isActive', formData.isActive);
      submitData.append('sortOrder', formData.sortOrder || 0);
      
      if (imageFile) {
        submitData.append('image', imageFile);
      } else if (formData.image && !imageFile) {
        submitData.append('image', formData.image);
      }

      if (editingOccasionSpecial) {
        await occasionSpecialsAPI.update(editingOccasionSpecial._id, submitData);
        toast.success('Occasion special updated successfully');
      } else {
        await occasionSpecialsAPI.create(submitData);
        toast.success('Occasion special created successfully');
      }
      
      handleCloseModal();
      fetchOccasionSpecials();
    } catch (error) {
      console.error('Error saving occasion special:', error);
      const errorMessage = error.response?.data?.error 
        || error.response?.data?.message 
        || error.message 
        || 'Failed to save occasion special';
      toast.error(errorMessage);
    }
  };

  const handleDelete = async () => {
    if (!confirmAction) return;
    
    try {
      setActionLoading(true);
      await occasionSpecialsAPI.delete(confirmAction.id);
      toast.success('Occasion special deleted successfully');
      setConfirmAction(null);
      fetchOccasionSpecials();
    } catch (error) {
      console.error('Error deleting occasion special:', error);
      const errorMessage = error.response?.data?.error 
        || error.response?.data?.message 
        || error.message 
        || 'Failed to delete occasion special';
      toast.error(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  // Filter occasion specials
  const filteredOccasionSpecials = occasionSpecials.filter(occasionSpecial => {
    const matchesSearch = occasionSpecial.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         occasionSpecial.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && occasionSpecial.isActive) ||
                         (statusFilter === 'inactive' && !occasionSpecial.isActive);
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredOccasionSpecials.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOccasionSpecials = filteredOccasionSpecials.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Occasion Specials</h1>
          <p className="text-gray-600 mt-1">Manage occasion special menus</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Occasion Special
        </Button>
      </div>

      <Card>
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search occasion specials..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">Loading occasion specials...</p>
          </div>
        ) : paginatedOccasionSpecials.length === 0 ? (
          <div className="p-8 text-center">
            <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchTerm || statusFilter !== 'all' 
                ? 'No occasion specials found matching your criteria' 
                : 'No occasion specials found. Create your first one!'}
            </p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Sort Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedOccasionSpecials.map((occasionSpecial) => (
                  <TableRow key={occasionSpecial._id}>
                    <TableCell>
                      {occasionSpecial.image ? (
                        <img
                          src={getImageUrl(occasionSpecial.image)}
                          alt={occasionSpecial.name}
                          className="w-16 h-16 object-cover rounded"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/64?text=No+Image';
                          }}
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                          <Sparkles className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{occasionSpecial.name}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {occasionSpecial.description || '-'}
                    </TableCell>
                    <TableCell>{occasionSpecial.sortOrder || 0}</TableCell>
                    <TableCell>
                      <Badge variant={occasionSpecial.isActive ? 'success' : 'danger'}>
                        {occasionSpecial.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenModal(occasionSpecial)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setConfirmAction({ type: 'delete', id: occasionSpecial._id })}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-200">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingOccasionSpecial ? 'Edit Occasion Special' : 'Add Occasion Special'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter occasion special name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter description (optional)"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Image <span className="text-red-500">*</span>
            </label>
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="mb-2"
            />
            {imagePreview && (
              <div className="mt-2">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded border"
                />
              </div>
            )}
            {!imageFile && formData.image && (
              <div className="mt-2">
                <p className="text-sm text-gray-500 mb-1">Current image URL:</p>
                <Input
                  type="text"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="Or enter image URL"
                  className="text-sm"
                />
              </div>
            )}
            {!imageFile && !formData.image && (
              <Input
                type="text"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="Or enter image URL"
                className="mt-2"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort Order
            </label>
            <Input
              type="number"
              value={formData.sortOrder}
              onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
              placeholder="0"
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
              Active
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit">
              {editingOccasionSpecial ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        title="Delete Occasion Special"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete this occasion special? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmAction(null)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={actionLoading}
            >
              {actionLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

