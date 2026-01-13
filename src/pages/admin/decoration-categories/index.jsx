import { useEffect, useState } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/admin/ui/Table';
import { Card } from '../../../components/admin/ui/Card';
import { Button } from '../../../components/admin/ui/Button';
import { Badge } from '../../../components/admin/ui/Badge';
import { Input } from '../../../components/admin/ui/Input';
import { Modal } from '../../../components/admin/ui/Modal';
import { Pagination } from '../../../components/admin/ui/Pagination';
import { decorationCategoriesAPI } from '../../../services/admin/api';
import { getImageUrl } from '../../../utils/admin/imageUrl';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Search, Tag } from 'lucide-react';

export const DecorationCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    bannerImage: '',
    isActive: true
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [bannerImageFile, setBannerImageFile] = useState(null);
  const [bannerImagePreview, setBannerImagePreview] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      
      const response = await decorationCategoriesAPI.getAll({ active: 'all' });
      
      let categoriesData = [];
      if (response && response.data) {
        if (response.data.categories && Array.isArray(response.data.categories)) {
          categoriesData = response.data.categories;
        } 
        else if (Array.isArray(response.data)) {
          categoriesData = response.data;
        } 
        else if (response.data.data && Array.isArray(response.data.data)) {
          categoriesData = response.data.data;
        }
        else if (response.data.success && response.data.categories) {
          categoriesData = response.data.categories;
        }
      }
      
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching decoration categories:', error);
      const errorMessage = error.response?.data?.error 
        || error.response?.data?.message 
        || error.message 
        || 'Failed to load decoration categories';
      
      toast.error(`Failed to load decoration categories: ${errorMessage}`);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name || '',
        description: category.description || '',
        image: category.image || '',
        bannerImage: category.bannerImage || '',
        isActive: category.isActive !== undefined ? category.isActive : true
      });
      const imageUrl = category.image ? getImageUrl(category.image) : null;
      setImagePreview(imageUrl);
      setImageFile(null);
      const bannerImageUrl = category.bannerImage ? getImageUrl(category.bannerImage) : null;
      setBannerImagePreview(bannerImageUrl);
      setBannerImageFile(null);
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        description: '',
        image: '',
        bannerImage: '',
        isActive: true
      });
      setImagePreview(null);
      setImageFile(null);
      setBannerImagePreview(null);
      setBannerImageFile(null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      image: '',
      bannerImage: '',
      isActive: true
    });
    setImageFile(null);
    setImagePreview(null);
    setBannerImageFile(null);
    setBannerImagePreview(null);
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

  const handleBannerImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBannerImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Decoration category name is required');
      return;
    }

    try {
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('description', formData.description || '');
      submitData.append('isActive', formData.isActive);
      
      if (imageFile) {
        submitData.append('image', imageFile);
      } else if (formData.image && !imageFile) {
        submitData.append('image', formData.image);
      }

      if (bannerImageFile) {
        submitData.append('bannerImage', bannerImageFile);
      } else if (formData.bannerImage && !bannerImageFile) {
        submitData.append('bannerImage', formData.bannerImage);
      }

      if (editingCategory) {
        await decorationCategoriesAPI.update(editingCategory._id, submitData);
        toast.success('Decoration category updated successfully');
      } else {
        await decorationCategoriesAPI.create(submitData);
        toast.success('Decoration category created successfully');
      }
      handleCloseModal();
      fetchCategories();
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to save decoration category';
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (id, skipConfirm = false, categoryMeta = {}) => {
    if (!skipConfirm) {
      setConfirmAction({
        id,
        name: categoryMeta.name,
        type: 'delete',
      });
      return;
    }

    setActionLoading(true);
    try {
      await decorationCategoriesAPI.delete(id);
      toast.success('Decoration category deleted successfully');
      fetchCategories();
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to delete decoration category';
      toast.error(errorMessage);
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  };

  const handleToggleActive = async (category) => {
    try {
      const updateData = {
        name: category.name,
        description: category.description || '',
        image: category.image || '',
        bannerImage: category.bannerImage || '',
        isActive: !category.isActive
      };
      
      await decorationCategoriesAPI.update(category._id, updateData);
      toast.success(`Decoration category ${!category.isActive ? 'activated' : 'deactivated'} successfully`);
      fetchCategories();
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to update decoration category status';
      toast.error(errorMessage);
    }
  };

  const filteredCategories = categories.filter(category => {
    const matchesSearch = 
      !searchTerm ||
      category.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const isCategoryActive = category.isActive !== false;
    
    let matchesStatus = true;
    if (statusFilter === 'active') {
      matchesStatus = isCategoryActive;
    } else if (statusFilter === 'inactive') {
      matchesStatus = !isCategoryActive;
    }
    
    return matchesSearch && matchesStatus;
  });

  const totalItems = filteredCategories.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCategories = filteredCategories.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Decoration Categories</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage decoration categories</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Decoration Category
        </Button>
      </div>

      <Card>
        <div className="p-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search decoration categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total Decoration Categories: <span className="font-medium text-gray-900 dark:text-gray-100">{totalItems}</span>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">S.No</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Image</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCategories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No decoration categories found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCategories.map((category, idx) => (
                  <TableRow key={category._id}>
                    <TableCell className="text-center font-medium">{startIndex + idx + 1}</TableCell>
                    <TableCell className="font-medium">
                      {category.name}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {category.description || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {category.image ? (
                        <img 
                          src={getImageUrl(category.image)} 
                          alt={category.name}
                          className="w-12 h-12 object-cover rounded"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={category.isActive ? 'success' : 'danger'}
                        className="cursor-pointer"
                        onClick={() => handleToggleActive(category)}
                      >
                        {category.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleOpenModal(category)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDelete(category._id, false, { name: category.name })}
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

      <Modal
        isOpen={!!confirmAction}
        onClose={() => {
          if (!actionLoading) setConfirmAction(null);
        }}
        title="Delete Decoration Category"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-200">
            Delete {confirmAction?.name || 'this decoration category'}? This action cannot be undone.
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
        title={editingCategory ? 'Edit Decoration Category' : 'Add New Decoration Category'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Decoration Category Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Floral Decoration, Theme Decoration"
            required
          />

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Decoration category description..."
              rows={3}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Category Image
            </label>
            <div className="space-y-3">
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-semibold
                    file:bg-primary file:text-white
                    hover:file:bg-primary/90
                    cursor-pointer"
                />
                <p className="mt-1 text-xs text-gray-500">Upload an image file (JPG, PNG, GIF, WEBP - Max 5MB)</p>
              </div>
              
              {imagePreview && (
                <div className="mt-2">
                  <img 
                    src={getImageUrl(imagePreview)} 
                    alt="Preview" 
                    className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Banner Image
            </label>
            <div className="space-y-3">
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBannerImageChange}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-semibold
                    file:bg-primary file:text-white
                    hover:file:bg-primary/90
                    cursor-pointer"
                />
                <p className="mt-1 text-xs text-gray-500">Upload a banner image file (JPG, PNG, GIF, WEBP - Max 5MB)</p>
              </div>
              
              {bannerImagePreview && (
                <div className="mt-2">
                  <img 
                    src={getImageUrl(bannerImagePreview)} 
                    alt="Banner Preview" 
                    className="w-full max-w-md h-48 object-cover rounded-lg border border-gray-300"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
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
              {editingCategory ? 'Update Decoration Category' : 'Create Decoration Category'}
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

