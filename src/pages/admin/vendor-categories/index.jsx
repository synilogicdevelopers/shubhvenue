import { useEffect, useState } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/admin/ui/Table';
import { Card } from '../../../components/admin/ui/Card';
import { Button } from '../../../components/admin/ui/Button';
import { Badge } from '../../../components/admin/ui/Badge';
import { Modal } from '../../../components/admin/ui/Modal';
import { Input } from '../../../components/admin/ui/Input';
import { vendorCategoriesAPI } from '../../../services/admin/api';
import { hasPermission } from '../../../utils/admin/permissions';
import { getImageUrl } from '../../../utils/admin/imageUrl';
import { VendorCategoryFormEditor } from '../../../components/admin/VendorCategoryFormEditor';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Tag, Image as ImageIcon, X, Settings } from 'lucide-react';

export const VendorCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
    image: null,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formEditorOpen, setFormEditorOpen] = useState(false);
  const [formConfig, setFormConfig] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await vendorCategoriesAPI.getAll();
      setCategories(response.data.categories || []);
    } catch (error) {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      // Validate name before sending
      if (!formData.name || !formData.name.trim()) {
        toast.error('Category name is required');
        setFormLoading(false);
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name.trim());
      formDataToSend.append('description', formData.description || '');
      formDataToSend.append('isActive', formData.isActive ? 'true' : 'false');
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }
      
      console.log('Sending FormData:', {
        name: formData.name.trim(),
        description: formData.description || '',
        isActive: formData.isActive,
        hasImage: !!imageFile
      });
      
      const response = await vendorCategoriesAPI.create(formDataToSend);
      toast.success('Category created successfully');
      setCreateOpen(false);
      
      // Open form editor after creation
      if (response.data?.category?._id) {
        setSelectedCategory(response.data.category);
        setFormConfig(response.data.category.formConfig || null);
        setFormEditorOpen(true);
      }
      
      setFormData({ name: '', description: '', isActive: true, image: null });
      setImagePreview(null);
      setImageFile(null);
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create category');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      isActive: category.isActive,
      image: category.image || null,
    });
    setImagePreview(category.image ? getImageUrl(category.image) : null);
    setImageFile(null);
    setFormConfig(category.formConfig || null);
    setEditOpen(true);
  };

  const handleOpenFormEditor = (category) => {
    console.log('Opening form editor for category:', category);
    setSelectedCategory(category);
    // Ensure formConfig is properly set
    if (category.formConfig) {
      console.log('Loading existing formConfig:', category.formConfig);
      setFormConfig(category.formConfig);
    } else {
      console.log('No formConfig found, will use defaults');
      setFormConfig(null);
    }
    setFormEditorOpen(true);
  };

  const handleSaveFormConfig = async () => {
    if (!selectedCategory) {
      toast.error('No category selected');
      return;
    }
    
    if (!formConfig) {
      toast.error('No form configuration to save');
      return;
    }
    
    try {
      setFormLoading(true);
      const formDataToSend = new FormData();
      
      // Ensure formConfig is properly stringified
      const configString = typeof formConfig === 'string' 
        ? formConfig 
        : JSON.stringify(formConfig);
      
      formDataToSend.append('formConfig', configString);
      
      console.log('Saving form config:', {
        categoryId: selectedCategory._id,
        formConfig: formConfig
      });
      
      await vendorCategoriesAPI.update(selectedCategory._id, formDataToSend);
      toast.success('Form configuration saved successfully');
      setFormEditorOpen(false);
      setSelectedCategory(null);
      setFormConfig(null);
      fetchCategories();
    } catch (error) {
      console.error('Error saving form config:', error);
      toast.error(error.response?.data?.message || 'Failed to save form configuration');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description || '');
      formDataToSend.append('isActive', formData.isActive);
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      } else if (formData.image) {
        formDataToSend.append('image', formData.image);
      }
      
      await vendorCategoriesAPI.update(selectedCategory._id, formDataToSend);
      toast.success('Category updated successfully');
      setEditOpen(false);
      setSelectedCategory(null);
      setFormData({ name: '', description: '', isActive: true, image: null });
      setImagePreview(null);
      setImageFile(null);
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update category');
    } finally {
      setFormLoading(false);
    }
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

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData({ ...formData, image: null });
  };

  const handleDelete = async () => {
    setFormLoading(true);
    try {
      await vendorCategoriesAPI.delete(selectedCategory._id);
      toast.success('Category deleted successfully');
      setDeleteOpen(false);
      setSelectedCategory(null);
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete category');
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Vendor Categories</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage vendor categories</p>
        </div>
        {hasPermission('edit_vendors') && (
          <Button onClick={() => setCreateOpen(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Category
          </Button>
        )}
      </div>

      <Card>
        <div className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>S.No</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No categories found
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((category, idx) => (
                  <TableRow key={category._id}>
                    <TableCell className="font-medium">{idx + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {category.image ? (
                          <img
                            src={getImageUrl(category.image)}
                            alt={category.name}
                            className="w-10 h-10 object-cover rounded-lg flex-shrink-0"
                            onError={(e) => {
                              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAzMkMyNy4zMTM3IDMyIDMwIDI5LjMxMzcgMzAgMjZDMzAgMjIuNjg2MyAyNy4zMTM3IDIwIDI0IDIwQzIwLjY4NjMgMjAgMTggMjIuNjg2MyAxOCAyNkMxOCAyOS4zMTM3IDIwLjY4NjMgMzIgMjQgMzJaIiBmaWxsPSIjOUI5Q0E0Ii8+CjxwYXRoIGQ9Ik0xMiA0MEMxMiA0MCAxNiAzNCAyNCAzNEMzMiAzNCAzNiA0MCAzNiA0MEgxMloiIGZpbGw9IiM5QjlDQTQiLz4KPC9zdmc+';
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                            <ImageIcon className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <span className="font-medium text-gray-900 dark:text-gray-100">{category.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{category.description || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={category.isActive ? 'success' : 'danger'}>
                        {category.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {category.createdAt
                        ? new Date(category.createdAt).toLocaleDateString()
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {hasPermission('edit_vendors') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(category)}
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {hasPermission('edit_vendors') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenFormEditor(category)}
                            title="Configure Forms"
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                        )}
                        {hasPermission('edit_vendors') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedCategory(category);
                              setDeleteOpen(true);
                            }}
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
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

      {/* Create Modal */}
      <Modal
        isOpen={createOpen}
      onClose={() => {
        if (!formLoading) {
          setCreateOpen(false);
          setFormData({ name: '', description: '', isActive: true, image: null });
          setImagePreview(null);
          setImageFile(null);
        }
      }}
        title="Create Vendor Category"
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Category Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            disabled={formLoading}
            required
            placeholder="e.g., Wedding Venues, Catering, Photography"
          />
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={formLoading}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              placeholder="Optional description"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Category Image</label>
            <div className="space-y-2">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                  <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">No image selected</p>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={formLoading}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">Recommended: Square image, max 5MB</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              disabled={formLoading}
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium">
              Active (visible in registration)
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateOpen(false)}
              disabled={formLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={formLoading}>
              {formLoading ? 'Creating...' : 'Create Category'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={editOpen}
      onClose={() => {
        if (!formLoading) {
          setEditOpen(false);
          setSelectedCategory(null);
          setFormData({ name: '', description: '', isActive: true, image: null });
          setImagePreview(null);
          setImageFile(null);
        }
      }}
        title="Edit Vendor Category"
        size="md"
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <Input
            label="Category Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            disabled={formLoading}
            required
          />
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={formLoading}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Category Image</label>
            <div className="space-y-2">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                  <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">No image selected</p>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={formLoading}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">Recommended: Square image, max 5MB</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActiveEdit"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              disabled={formLoading}
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
            <label htmlFor="isActiveEdit" className="text-sm font-medium">
              Active (visible in registration)
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditOpen(false)}
              disabled={formLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={formLoading}>
              {formLoading ? 'Updating...' : 'Update Category'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Form Editor Modal */}
      <Modal
        isOpen={formEditorOpen}
        onClose={() => {
          if (!formLoading) {
            setFormEditorOpen(false);
            setSelectedCategory(null);
            setFormConfig(null);
          }
        }}
        title={`Configure Forms - ${selectedCategory?.name || ''}`}
        size="lg"
      >
        <VendorCategoryFormEditor
          formConfig={formConfig}
          onChange={(newConfig) => {
            console.log('Form config changed:', newConfig);
            setFormConfig(newConfig);
          }}
          onClose={() => {
            if (!formLoading) {
              setFormEditorOpen(false);
            }
          }}
        />
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
          <Button
            variant="outline"
            onClick={() => {
              if (!formLoading) {
                setFormEditorOpen(false);
                setSelectedCategory(null);
                setFormConfig(null);
              }
            }}
            disabled={formLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleSaveFormConfig} disabled={formLoading}>
            {formLoading ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteOpen}
        onClose={() => {
          if (!formLoading) {
            setDeleteOpen(false);
            setSelectedCategory(null);
          }
        }}
        title="Delete Category"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-200">
            Are you sure you want to delete <strong>{selectedCategory?.name}</strong>? This action cannot be undone.
          </p>
          <p className="text-sm text-red-600 dark:text-red-400">
            Note: You cannot delete a category if any vendors are using it.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={formLoading}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={formLoading}>
              {formLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

