import { useEffect, useState } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/admin/ui/Table';
import { Card } from '../../../components/admin/ui/Card';
import { Button } from '../../../components/admin/ui/Button';
import { Badge } from '../../../components/admin/ui/Badge';
import { Input } from '../../../components/admin/ui/Input';
import { Modal } from '../../../components/admin/ui/Modal';
import { bannersAPI } from '../../../services/admin/api';
import { getImageUrl } from '../../../utils/admin/imageUrl';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Search, Image as ImageIcon } from 'lucide-react';

export const Banners = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: '',
    link: '',
    isActive: true,
    sortOrder: 0,
    startDate: '',
    endDate: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const response = await bannersAPI.getAll({ active: 'all' });
      console.log('Banners API Response:', response.data);
      
      let bannersData = [];
      if (response.data) {
        if (response.data.banners && Array.isArray(response.data.banners)) {
          bannersData = response.data.banners;
        } else if (Array.isArray(response.data)) {
          bannersData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          bannersData = response.data.data;
        }
      }
      
      console.log('Parsed banners:', bannersData);
      setBanners(bannersData);
      
      if (bannersData.length === 0) {
        console.log('No banners found. You can create a new banner using the "Add Banner" button.');
      }
    } catch (error) {
      console.error('Error fetching banners:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to load banners';
      toast.error(errorMessage);
      setBanners([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (banner = null) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        title: banner.title || '',
        description: banner.description || '',
        image: banner.image || '',
        link: banner.link || '',
        isActive: banner.isActive !== undefined ? banner.isActive : true,
        sortOrder: banner.sortOrder || 0,
        startDate: banner.startDate ? new Date(banner.startDate).toISOString().split('T')[0] : '',
        endDate: banner.endDate ? new Date(banner.endDate).toISOString().split('T')[0] : '',
      });
      // Handle image preview
      const imageUrl = banner.image ? getImageUrl(banner.image) : null;
      setImagePreview(imageUrl);
      setImageFile(null);
    } else {
      setEditingBanner(null);
      setFormData({
        title: '',
        description: '',
        image: '',
        link: '',
        isActive: true,
        sortOrder: 0,
        startDate: '',
        endDate: '',
      });
      setImagePreview(null);
      setImageFile(null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBanner(null);
    setFormData({
      title: '',
      description: '',
      image: '',
      link: '',
      isActive: true,
      sortOrder: 0,
      startDate: '',
      endDate: '',
    });
    setImageFile(null);
    setImagePreview(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      // Clear URL input if file is selected
      setFormData({ ...formData, image: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Banner title is required');
      return;
    }

    if (!imageFile && !formData.image && !editingBanner) {
      toast.error('Banner image is required');
      return;
    }

    try {
      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description || '');
      submitData.append('link', formData.link || '');
      submitData.append('isActive', formData.isActive);
      submitData.append('sortOrder', formData.sortOrder);
      
      if (formData.startDate) {
        submitData.append('startDate', formData.startDate);
      }
      if (formData.endDate) {
        submitData.append('endDate', formData.endDate);
      }
      
      // Add image file if selected
      if (imageFile) {
        submitData.append('image', imageFile);
      } else if (formData.image && editingBanner) {
        // Keep existing image if editing and no new file uploaded
        submitData.append('image', formData.image);
      }

      if (editingBanner) {
        await bannersAPI.update(editingBanner._id, submitData);
        toast.success('Banner updated successfully');
      } else {
        await bannersAPI.create(submitData);
        toast.success('Banner created successfully');
      }
      handleCloseModal();
      fetchBanners();
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to save banner';
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this banner? This action cannot be undone.')) return;
    
    try {
      await bannersAPI.delete(id);
      toast.success('Banner deleted successfully');
      fetchBanners();
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to delete banner';
      toast.error(errorMessage);
    }
  };

  const handleToggleActive = async (banner) => {
    try {
      await bannersAPI.toggleActive(banner._id);
      toast.success(`Banner ${!banner.isActive ? 'activated' : 'deactivated'} successfully`);
      fetchBanners();
    } catch (error) {
      toast.error('Failed to update banner status');
    }
  };

  const filteredBanners = banners.filter(banner => {
    const matchesSearch = 
      banner.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      banner.description?.toLowerCase().includes(searchTerm.toLowerCase());
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Banners</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage promotional banners</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Banner
        </Button>
      </div>

      <Card>
        <div className="p-6 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search banners..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Link</TableHead>
                <TableHead>Sort Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBanners.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                          {searchTerm ? 'No banners match your search' : 'No banners yet'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                          {searchTerm 
                            ? 'Try adjusting your search terms'
                            : 'Create your first banner to promote your services'
                          }
                        </p>
                        {!searchTerm && (
                          <Button onClick={() => handleOpenModal()} size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Your First Banner
                          </Button>
                        )}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredBanners.map((banner) => (
                  <TableRow key={banner._id}>
                    <TableCell>
                      {banner.image ? (
                        <img 
                          src={getImageUrl(banner.image)} 
                          alt={banner.title}
                          className="w-20 h-12 object-cover rounded"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {banner.title}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {banner.description || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {banner.link ? (
                        <a 
                          href={banner.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline truncate max-w-xs block"
                        >
                          {banner.link}
                        </a>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>{banner.sortOrder || 0}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={banner.isActive ? 'success' : 'danger'}
                        className="cursor-pointer"
                        onClick={() => handleToggleActive(banner)}
                      >
                        {banner.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleOpenModal(banner)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDelete(banner._id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingBanner ? 'Edit Banner' : 'Add New Banner'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Banner Title *"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Summer Sale, New Venue Launch"
            required
          />

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Banner description..."
              rows={3}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Banner Image *
            </label>
            <div className="space-y-4">
              {/* File Upload */}
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2.5 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-semibold
                    file:bg-gradient-to-r file:from-purple-600 file:to-orange-600 file:text-white
                    hover:file:from-purple-700 hover:file:to-orange-700
                    cursor-pointer transition-colors"
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Upload an image file (JPG, PNG, GIF, WEBP - Max 5MB)
                </p>
              </div>
              
              {/* Image Preview */}
              {imagePreview && (
                <div className="relative">
                  <div className="relative w-full max-w-xs mx-auto">
                    <img 
                      src={getImageUrl(imagePreview)} 
                      alt="Banner Preview" 
                      className="w-full h-40 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-700 shadow-sm"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    {imageFile && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                        New
                      </div>
                    )}
                  </div>
                  {imageFile && (
                    <p className="mt-2 text-xs text-center text-gray-500 dark:text-gray-400">
                      New image will replace the current one
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

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

          <div className="grid grid-cols-2 gap-4">
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

          <div className="flex items-center gap-2">
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

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              {editingBanner ? 'Update Banner' : 'Create Banner'}
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


