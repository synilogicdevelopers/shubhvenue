import { useEffect, useState } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/admin/ui/Table';
import { Card } from '../../../components/admin/ui/Card';
import { Button } from '../../../components/admin/ui/Button';
import { Badge } from '../../../components/admin/ui/Badge';
import { Input } from '../../../components/admin/ui/Input';
import { Modal } from '../../../components/admin/ui/Modal';
import { categoriesAPI } from '../../../services/admin/api';
import { getImageUrl } from '../../../utils/admin/imageUrl';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Search, Tag } from 'lucide-react';

export const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    isActive: true
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      console.log('Fetching categories...');
      
      // For admin, fetch all categories (active and inactive)
      const response = await categoriesAPI.getAll({ active: 'all' });
      
      console.log('Full API Response:', response);
      console.log('Response Data:', response.data);
      console.log('Response Status:', response.status);
      
      // Handle different response structures
      let categoriesData = [];
      if (response && response.data) {
        // Check for response.data.categories (most common structure)
        if (response.data.categories && Array.isArray(response.data.categories)) {
          categoriesData = response.data.categories;
          console.log('Found categories in response.data.categories:', categoriesData.length);
        } 
        // Check if response.data is directly an array
        else if (Array.isArray(response.data)) {
          categoriesData = response.data;
          console.log('Found categories in response.data (array):', categoriesData.length);
        } 
        // Check for nested data structure
        else if (response.data.data && Array.isArray(response.data.data)) {
          categoriesData = response.data.data;
          console.log('Found categories in response.data.data:', categoriesData.length);
        }
        // Check for success response with categories
        else if (response.data.success && response.data.categories) {
          categoriesData = response.data.categories;
          console.log('Found categories in success response:', categoriesData.length);
        }
        else {
          console.warn('Unexpected response structure:', response.data);
        }
      } else {
        console.warn('No response.data found:', response);
      }
      
      console.log('Final parsed categories:', categoriesData);
      console.log('Categories count:', categoriesData.length);
      if (categoriesData.length > 0) {
        console.log('Sample category:', categoriesData[0]);
        console.log('Categories with isActive:', categoriesData.map(c => ({ 
          name: c.name, 
          isActive: c.isActive,
          _id: c._id 
        })));
      }
      
      setCategories(categoriesData);
      
      // Show message if no categories found
      if (categoriesData.length === 0) {
        console.log('No categories found in database. You can create a new category using the "Add Category" button.');
        // No toast message needed - empty state is visible in UI
      } else {
        console.log(`Successfully loaded ${categoriesData.length} categories`);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data
      });
      
      const errorMessage = error.response?.data?.error 
        || error.response?.data?.message 
        || error.message 
        || 'Failed to load categories';
      
      toast.error(`Failed to load categories: ${errorMessage}`);
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
        isActive: category.isActive !== undefined ? category.isActive : true
      });
      // Handle image preview - convert local path to full URL if needed
      const imageUrl = category.image ? getImageUrl(category.image) : null;
      setImagePreview(imageUrl);
      setImageFile(null);
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        description: '',
        image: '',
        isActive: true
      });
      setImagePreview(null);
      setImageFile(null);
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
      isActive: true
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
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('description', formData.description || '');
      submitData.append('isActive', formData.isActive);
      
      // Add image file if selected
      if (imageFile) {
        submitData.append('image', imageFile);
      }

      if (editingCategory) {
        await categoriesAPI.update(editingCategory._id, submitData);
        toast.success('Category updated successfully');
      } else {
        await categoriesAPI.create(submitData);
        toast.success('Category created successfully');
      }
      handleCloseModal();
      fetchCategories();
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to save category';
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
      await categoriesAPI.delete(id);
      toast.success('Category deleted successfully');
      fetchCategories();
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to delete category';
      toast.error(errorMessage);
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  };

  const handleToggleActive = async (category) => {
    try {
      // Send JSON data for toggle (no file upload needed)
      const updateData = {
        name: category.name,
        description: category.description || '',
        image: category.image || '',
        isActive: !category.isActive // Toggle the status
      };
      
      await categoriesAPI.update(category._id, updateData);
      toast.success(`Category ${!category.isActive ? 'activated' : 'deactivated'} successfully`);
      fetchCategories();
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to update category status';
      toast.error(errorMessage);
      console.error('Toggle active error:', error);
    }
  };

  const filteredCategories = categories.filter(category => {
    // Search filter
    const matchesSearch = 
      !searchTerm || // If no search term, match all
      category.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status filter - check isActive field
    // isActive can be true, false, or undefined (defaults to true in backend)
    const isCategoryActive = category.isActive !== false; // undefined or true means active
    
    let matchesStatus = true;
    if (statusFilter === 'active') {
      matchesStatus = isCategoryActive;
    } else if (statusFilter === 'inactive') {
      matchesStatus = !isCategoryActive; // inactive means isActive === false
    }
    // If statusFilter === 'all', matchesStatus remains true
    
    const matches = matchesSearch && matchesStatus;
    
    // Debug logging for first few categories
    if (categories.indexOf(category) < 3) {
      console.log('Filtering category:', {
        name: category.name,
        isActive: category.isActive,
        isCategoryActive,
        matchesSearch,
        matchesStatus,
        statusFilter,
        matches
      });
    }
    
    return matches;
  });
  
  // Debug: Log filter results
  console.log('Categories before filter:', categories.length);
  console.log('Search term:', searchTerm);
  console.log('Status filter:', statusFilter);
  console.log('Filtered categories:', filteredCategories.length);

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Categories</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage venue categories</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      <Card>
        <div className="p-6 space-y-4">
          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search categories..."
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

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">S.No</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Image</TableHead>
                <TableHead>Venues</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No categories found
                  </TableCell>
                </TableRow>
              ) : (
                filteredCategories.map((category, idx) => (
                  <TableRow key={category._id}>
                    <TableCell className="text-center font-medium">{idx + 1}</TableCell>
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
                      <Badge variant="info">{category.venueCount || 0}</Badge>
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
        </div>
      </Card>

      {/* Confirmation Modal */}
      <Modal
        isOpen={!!confirmAction}
        onClose={() => {
          if (!actionLoading) setConfirmAction(null);
        }}
        title="Delete Category"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-200">
            Delete {confirmAction?.name || 'this category'}? This action cannot be undone.
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
        title={editingCategory ? 'Edit Category' : 'Add New Category'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Category Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Banquet Hall, Garden, Resort"
            required
          />

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Category description..."
              rows={3}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Category Image
            </label>
            <div className="space-y-3">
              {/* File Upload */}
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
              
              {/* Image Preview */}
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
              {editingCategory ? 'Update Category' : 'Create Category'}
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

