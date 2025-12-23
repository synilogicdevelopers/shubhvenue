import React, { useEffect, useState } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/admin/ui/Table';
import { Card } from '../../../components/admin/ui/Card';
import { Button } from '../../../components/admin/ui/Button';
import { Badge } from '../../../components/admin/ui/Badge';
import { Input } from '../../../components/admin/ui/Input';
import { Modal } from '../../../components/admin/ui/Modal';
import { Pagination } from '../../../components/admin/ui/Pagination';
import { menusAPI } from '../../../services/admin/api';
import { getImageUrl } from '../../../utils/admin/imageUrl';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Search, Menu as MenuIcon, ChevronDown, ChevronRight, X } from 'lucide-react';

export const Menus = () => {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  const [expandedMenus, setExpandedMenus] = useState(new Set());
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
    image: '',
    parentMenuId: null,
    isActive: true,
    sortOrder: 0
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmenu, setIsSubmenu] = useState(false);
  const [selectedParentMenu, setSelectedParentMenu] = useState(null);
  const [submenus, setSubmenus] = useState([]); // Array to store submenus being added

  useEffect(() => {
    fetchMenus();
  }, []);

  const fetchMenus = async () => {
    try {
      setLoading(true);
      const response = await menusAPI.getAll({ active: 'all' });
      
      let menusData = [];
      let allMenusFlat = []; // Flat list of all menus (main + submenus)
      
      if (response && response.data) {
        if (response.data.menus && Array.isArray(response.data.menus)) {
          menusData = response.data.menus;
        } else if (Array.isArray(response.data)) {
          menusData = response.data;
        } else if (response.data.success && response.data.menus) {
          menusData = response.data.menus;
        }
      }
      
      // Create flat list: main menus + all submenus
      menusData.forEach(mainMenu => {
        // Add main menu
        allMenusFlat.push(mainMenu);
        // Add submenus if they exist
        if (mainMenu.submenus && Array.isArray(mainMenu.submenus)) {
          mainMenu.submenus.forEach(submenu => {
            allMenusFlat.push(submenu);
          });
        }
      });
      
      // Store both: structured data for display and flat list for searching
      setMenus(menusData);
      // Store flat list in a ref or separate state for easy access
      // We'll use menusData to get submenus from main menu's submenus array
      
      if (menusData.length === 0) {
        // No toast message needed for empty list - user can see the empty state
      }
    } catch (error) {
      console.error('Error fetching menus:', error);
      const errorMessage = error.response?.data?.error 
        || error.response?.data?.message 
        || error.message 
        || 'Failed to load menus';
      
      toast.error(`Failed to load menus: ${errorMessage}`);
      setMenus([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (menu = null, isSubmenuMode = false, parentMenu = null) => {
    if (menu) {
      setEditingMenu(menu);
      setFormData({
        name: menu.name || '',
        description: menu.description || '',
        icon: menu.icon || '',
        image: menu.image || '',
        parentMenuId: menu.parentMenuId || null,
        isActive: menu.isActive !== undefined ? menu.isActive : true,
        sortOrder: menu.sortOrder || 0
      });
      const imageUrl = menu.image ? getImageUrl(menu.image) : null;
      setImagePreview(imageUrl);
      setImageFile(null);
      setIsSubmenu(!!menu.parentMenuId);
      setSelectedParentMenu(parentMenu || null);
      // Load existing submenus if editing a main menu
      if (!menu.parentMenuId) {
        // Find the main menu in menus array and get its submenus
        const mainMenuWithSubmenus = menus.find(m => m._id === menu._id);
        const existingSubmenus = mainMenuWithSubmenus?.submenus || [];
        
        setSubmenus(existingSubmenus.map(s => ({
          name: s.name || '',
          description: s.description || '',
          icon: s.icon || '',
          isActive: s.isActive !== undefined ? s.isActive : true,
          sortOrder: s.sortOrder || 0,
          _id: s._id // For editing existing submenus
        })));
      } else {
        setSubmenus([]);
      }
    } else {
      setEditingMenu(null);
      setFormData({
        name: '',
        description: '',
        icon: '',
        image: '',
        parentMenuId: isSubmenuMode ? (parentMenu?._id || null) : null,
        isActive: true,
        sortOrder: 0
      });
      setImagePreview(null);
      setImageFile(null);
      setIsSubmenu(isSubmenuMode);
      setSelectedParentMenu(parentMenu);
      setSubmenus([]); // Reset submenus for new menu
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMenu(null);
    setFormData({
      name: '',
      description: '',
      icon: '',
      image: '',
      parentMenuId: null,
      isActive: true,
      sortOrder: 0
    });
    setImageFile(null);
    setImagePreview(null);
    setIsSubmenu(false);
    setSelectedParentMenu(null);
    setSubmenus([]);
  };

  const addSubmenu = () => {
    setSubmenus([...submenus, {
      name: '',
      description: '',
      icon: '',
      isActive: true,
      sortOrder: submenus.length
    }]);
  };

  const removeSubmenu = (index) => {
    setSubmenus(submenus.filter((_, i) => i !== index));
  };

  const updateSubmenu = (index, field, value) => {
    const updated = [...submenus];
    updated[index] = { ...updated[index], [field]: value };
    setSubmenus(updated);
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
      toast.error('Menu name is required');
      return;
    }

    // Validate submenus if adding to main menu
    if (!isSubmenu && submenus.length > 0) {
      for (let i = 0; i < submenus.length; i++) {
        if (!submenus[i].name.trim()) {
          toast.error(`Submenu ${i + 1} name is required`);
          return;
        }
      }
    }

    try {
      let mainMenuId;

      // Create or update main menu
      if (isSubmenu) {
        // This is a submenu, handle normally
        const submitData = new FormData();
        submitData.append('name', formData.name);
        submitData.append('description', formData.description || '');
        submitData.append('icon', formData.icon || '');
        submitData.append('isActive', formData.isActive);
        submitData.append('sortOrder', formData.sortOrder || 0);
        submitData.append('parentMenuId', formData.parentMenuId);
        
        if (imageFile) {
          submitData.append('image', imageFile);
        } else if (formData.image && !imageFile) {
          submitData.append('image', formData.image);
        }

        if (editingMenu) {
          await menusAPI.update(editingMenu._id, submitData);
          toast.success('Submenu updated successfully');
        } else {
          await menusAPI.create(submitData);
          toast.success('Submenu created successfully');
        }
      } else {
        // This is a main menu, create/update it first
        const submitData = new FormData();
        submitData.append('name', formData.name);
        submitData.append('description', formData.description || '');
        submitData.append('icon', formData.icon || '');
        submitData.append('isActive', formData.isActive);
        submitData.append('sortOrder', formData.sortOrder || 0);
        submitData.append('parentMenuId', 'null');
        
        if (imageFile) {
          submitData.append('image', imageFile);
        } else if (formData.image && !imageFile) {
          submitData.append('image', formData.image);
        }

        if (editingMenu) {
          await menusAPI.update(editingMenu._id, submitData);
          mainMenuId = editingMenu._id;
          toast.success('Menu updated successfully');
        } else {
          const response = await menusAPI.create(submitData);
          mainMenuId = response.data.menu._id;
          toast.success('Menu created successfully');
        }

        // Now create/update submenus
        if (submenus.length > 0 && mainMenuId) {
          for (let i = 0; i < submenus.length; i++) {
            const submenu = submenus[i];
            const submenuData = new FormData();
            submenuData.append('name', submenu.name);
            submenuData.append('description', submenu.description || '');
            submenuData.append('icon', submenu.icon || '');
            submenuData.append('isActive', submenu.isActive);
            submenuData.append('sortOrder', submenu.sortOrder || i);
            submenuData.append('parentMenuId', mainMenuId);

            if (submenu._id) {
              // Update existing submenu
              await menusAPI.update(submenu._id, submenuData);
            } else {
              // Create new submenu
              await menusAPI.create(submenuData);
            }
          }
          toast.success(`${submenus.length} submenu(s) ${editingMenu ? 'updated' : 'created'} successfully`);
        }
      }

      handleCloseModal();
      fetchMenus();
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to save menu';
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (id, skipConfirm = false, menuMeta = {}) => {
    if (!skipConfirm) {
      setConfirmAction({
        id,
        name: menuMeta.name,
        type: 'delete',
      });
      return;
    }

    setActionLoading(true);
    try {
      await menusAPI.delete(id);
      toast.success('Menu deleted successfully');
      fetchMenus();
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to delete menu';
      toast.error(errorMessage);
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  };

  const handleToggleActive = async (menu) => {
    try {
      const updateData = {
        name: menu.name,
        description: menu.description || '',
        icon: menu.icon || '',
        image: menu.image || '',
        parentMenuId: menu.parentMenuId || null,
        isActive: !menu.isActive,
        sortOrder: menu.sortOrder || 0
      };
      
      await menusAPI.update(menu._id, updateData);
      toast.success(`Menu ${!menu.isActive ? 'activated' : 'deactivated'} successfully`);
      fetchMenus();
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to update menu status';
      toast.error(errorMessage);
    }
  };

  const toggleExpand = (menuId) => {
    const newExpanded = new Set(expandedMenus);
    if (newExpanded.has(menuId)) {
      newExpanded.delete(menuId);
    } else {
      newExpanded.add(menuId);
    }
    setExpandedMenus(newExpanded);
  };

  const filteredMenus = menus.filter(menu => {
    const matchesSearch = 
      !searchTerm ||
      menu.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      menu.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const isMenuActive = menu.isActive !== false;
    
    let matchesStatus = true;
    if (statusFilter === 'active') {
      matchesStatus = isMenuActive;
    } else if (statusFilter === 'inactive') {
      matchesStatus = !isMenuActive;
    }
    
    // Only show main menus in the main list (parentMenuId is null)
    const isMainMenu = !menu.parentMenuId;
    
    return matchesSearch && matchesStatus && isMainMenu;
  });

  // Pagination logic
  const totalItems = filteredMenus.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedMenus = filteredMenus.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const getSubmenus = (menuId) => {
    // Find the main menu and return its submenus array
    const mainMenu = menus.find(m => m._id === menuId);
    return mainMenu?.submenus || [];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const mainMenus = menus.filter(m => !m.parentMenuId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Menus & Submenus</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage menu structure and submenus</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Main Menu
          </Button>
        </div>
      </div>

      <Card>
        <div className="p-6 space-y-4">
          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search menus..."
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

          {/* Total Count */}
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total Menus: <span className="font-medium text-gray-900 dark:text-gray-100">{totalItems}</span>
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead className="w-12 text-center">S.No</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Image</TableHead>
                <TableHead>Submenus</TableHead>
                <TableHead>Venues</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedMenus.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                    No menus found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedMenus.map((menu, idx) => {
                  const submenus = getSubmenus(menu._id);
                  const isExpanded = expandedMenus.has(menu._id);
                  
                  return (
                    <React.Fragment key={menu._id}>
                      <TableRow>
                        <TableCell>
                          {submenus.length > 0 && (
                            <button
                              onClick={() => toggleExpand(menu._id)}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </TableCell>
                        <TableCell className="text-center font-medium">{startIndex + idx + 1}</TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <MenuIcon className="w-4 h-4 text-primary" />
                            {menu.name}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {menu.description || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {menu.image ? (
                            <img 
                              src={getImageUrl(menu.image)} 
                              alt={menu.name}
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
                          <Badge variant="info">{submenus.length}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="info">{menu.venueCount || 0}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={menu.isActive ? 'success' : 'danger'}
                            className="cursor-pointer"
                            onClick={() => handleToggleActive(menu)}
                          >
                            {menu.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleOpenModal(null, true, menu)}
                              title="Add Submenu"
                            >
                              <Plus className="w-4 h-4 text-green-500" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleOpenModal(menu)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDelete(menu._id, false, { name: menu.name })}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {/* Submenus */}
                      {isExpanded && submenus.map((submenu, subIdx) => (
                        <TableRow key={submenu._id} className="bg-gray-50 dark:bg-gray-800/50">
                          <TableCell></TableCell>
                          <TableCell className="text-center text-sm text-gray-500">
                            {idx + 1}.{subIdx + 1}
                          </TableCell>
                          <TableCell className="font-medium pl-8">
                            <div className="flex items-center gap-2">
                              <div className="w-1 h-4 bg-primary"></div>
                              {submenu.name}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs truncate text-sm">
                            {submenu.description || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {submenu.image ? (
                              <img 
                                src={getImageUrl(submenu.image)} 
                                alt={submenu.name}
                                className="w-10 h-10 object-cover rounded"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <span className="text-gray-400 text-sm">N/A</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-400">-</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="info" className="text-xs">{submenu.venueCount || 0}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={submenu.isActive ? 'success' : 'danger'}
                              className="cursor-pointer text-xs"
                              onClick={() => handleToggleActive(submenu)}
                            >
                              {submenu.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleOpenModal(submenu, false, menu)}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                              onClick={() => handleDelete(submenu._id, false, { name: submenu.name })}
                              >
                                <Trash2 className="w-3 h-3 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </React.Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>

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
        title="Delete Menu"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-200">
            Delete {confirmAction?.name || 'this item'}? This action cannot be undone.
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
        title={editingMenu ? `Edit ${isSubmenu ? 'Submenu' : 'Menu'}` : `Add New ${isSubmenu ? 'Submenu' : 'Menu'}`}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-full">
          {isSubmenu && selectedParentMenu && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Parent Menu:</strong> {selectedParentMenu.name}
              </p>
            </div>
          )}

          <Input
            label={`${isSubmenu ? 'Submenu' : 'Menu'} Name *`}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder={isSubmenu ? "e.g., Tent Booking, DJ Booking" : "e.g., Event Services, Venue & Hall Bookings"}
            required
          />

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Menu description..."
              rows={3}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <Input
            label="Icon"
            value={formData.icon}
            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
            placeholder="Icon name or URL"
          />

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Menu Image
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

          <Input
            label="Sort Order"
            type="number"
            value={formData.sortOrder}
            onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
            placeholder="0"
          />

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

          {/* Submenus Section - Only show for main menus (not submenus) */}
          {!isSubmenu && (
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Submenus ({submenus.length})
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addSubmenu}
                  className="text-primary"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Submenu
                </Button>
              </div>

              {submenus.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  No submenus added. Click "Add Submenu" to add one.
                </p>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {submenus.map((submenu, index) => (
                    <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Submenu {index + 1}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSubmenu(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        <Input
                          label="Submenu Name *"
                          value={submenu.name}
                          onChange={(e) => updateSubmenu(index, 'name', e.target.value)}
                          placeholder="e.g., Tent Booking, DJ Booking"
                          required
                        />
                        
                        <div>
                          <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
                            Description
                          </label>
                          <textarea
                            value={submenu.description}
                            onChange={(e) => updateSubmenu(index, 'description', e.target.value)}
                            placeholder="Submenu description..."
                            rows={2}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            label="Icon"
                            value={submenu.icon}
                            onChange={(e) => updateSubmenu(index, 'icon', e.target.value)}
                            placeholder="Icon name"
                            className="text-sm"
                          />
                          
                          <Input
                            label="Sort Order"
                            type="number"
                            value={submenu.sortOrder}
                            onChange={(e) => updateSubmenu(index, 'sortOrder', parseInt(e.target.value) || 0)}
                            placeholder="0"
                            className="text-sm"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`submenu-active-${index}`}
                            checked={submenu.isActive}
                            onChange={(e) => updateSubmenu(index, 'isActive', e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <label htmlFor={`submenu-active-${index}`} className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            Active
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t">
            <Button type="submit" className="flex-1">
              {editingMenu ? `Update ${isSubmenu ? 'Submenu' : 'Menu'}` : `Create ${isSubmenu ? 'Submenu' : 'Menu'}`}
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

