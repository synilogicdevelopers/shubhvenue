import { useEffect, useState } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/admin/ui/Table';
import { Card } from '../../../components/admin/ui/Card';
import { Button } from '../../../components/admin/ui/Button';
import { Badge } from '../../../components/admin/ui/Badge';
import { Input } from '../../../components/admin/ui/Input';
import { Modal } from '../../../components/admin/ui/Modal';
import { staffAPI, rolesAPI } from '../../../services/admin/api';
import { getImageUrl } from '../../../utils/admin/imageUrl';
import { hasPermission } from '../../../utils/admin/permissions';
import toast from 'react-hot-toast';
import { Search, Eye, Trash2, Plus, Edit, User, Mail, Phone, MapPin, Shield, Upload, X } from 'lucide-react';

export const Staff = () => {
  const [staff, setStaff] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isActiveFilter, setIsActiveFilter] = useState('all');
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    location: '',
    gender: '',
    role: '',
    isActive: true,
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    fetchStaff();
    fetchRoles();
  }, [roleFilter, isActiveFilter]);

  const fetchStaff = async () => {
    try {
      const params = {};
      if (roleFilter !== 'all') params.role = roleFilter;
      if (isActiveFilter !== 'all') params.isActive = isActiveFilter === 'true';
      const response = await staffAPI.getAll(params);
      setStaff(response.data?.staff || []);
    } catch (error) {
      toast.error('Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await rolesAPI.getAll({ isActive: 'true' });
      setRoles(response.data?.roles || []);
    } catch (error) {
      console.error('Failed to load roles:', error);
    }
  };

  const handleViewStaff = async (id) => {
    setLoadingStaff(true);
    setIsModalOpen(true);
    try {
      const response = await staffAPI.getById(id);
      setSelectedStaff(response.data?.staff);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to load staff details');
      setIsModalOpen(false);
    } finally {
      setLoadingStaff(false);
    }
  };

  const handleEditStaff = async (id) => {
    setLoadingStaff(true);
    setIsEditModalOpen(true);
    try {
      const response = await staffAPI.getById(id);
      const staffData = response.data?.staff;
      setFormData({
        name: staffData.name || '',
        email: staffData.email || '',
        phone: staffData.phone || '',
        password: '',
        location: staffData.location || '',
        gender: staffData.gender || '',
        role: staffData.role?._id || staffData.role || '',
        isActive: staffData.isActive !== undefined ? staffData.isActive : true,
      });
      setImagePreview(staffData.img ? getImageUrl(staffData.img) : null);
      setSelectedStaff(staffData);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to load staff details');
      setIsEditModalOpen(false);
    } finally {
      setLoadingStaff(false);
    }
  };

  const handleDelete = async (id, skipConfirm = false) => {
    if (!skipConfirm) {
      const targetStaff = staff.find((s) => s._id === id) || selectedStaff;
      setConfirmAction({
        id,
        name: targetStaff?.name,
        type: 'delete',
      });
      return;
    }

    setActionLoading(true);
    try {
      await staffAPI.delete(id);
      toast.success('Staff deleted successfully');
      fetchStaff();
      if (selectedStaff && selectedStaff._id === id) {
        setIsModalOpen(false);
        setSelectedStaff(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete staff');
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.password || !formData.role) {
      toast.error('Please fill all required fields');
      return;
    }

    setActionLoading(true);
    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('email', formData.email);
      data.append('phone', formData.phone);
      data.append('password', formData.password);
      data.append('role', formData.role);
      if (formData.location) data.append('location', formData.location);
      if (formData.gender) data.append('gender', formData.gender);
      if (imageFile) data.append('image', imageFile);

      await staffAPI.create(data);
      toast.success('Staff created successfully');
      setIsCreateModalOpen(false);
      resetForm();
      fetchStaff();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create staff');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.role) {
      toast.error('Please fill all required fields');
      return;
    }

    setActionLoading(true);
    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('email', formData.email);
      data.append('phone', formData.phone);
      data.append('role', formData.role);
      if (formData.location) data.append('location', formData.location);
      if (formData.gender) data.append('gender', formData.gender);
      if (formData.password) data.append('password', formData.password);
      if (formData.isActive !== undefined) data.append('isActive', formData.isActive);
      if (imageFile) data.append('image', imageFile);

      await staffAPI.update(selectedStaff._id, data);
      toast.success('Staff updated successfully');
      setIsEditModalOpen(false);
      resetForm();
      fetchStaff();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update staff');
    } finally {
      setActionLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      location: '',
      gender: '',
      role: '',
      isActive: true,
    });
    setImageFile(null);
    setImagePreview(null);
    setSelectedStaff(null);
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

  const filteredStaff = staff.filter((s) => {
    const matchesSearch =
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.phone?.includes(searchTerm);
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Staff</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage all staff members</p>
        </div>
        {hasPermission('create_staff') && (
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Staff
          </Button>
        )}
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
                  placeholder="Search staff..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
            >
              <option value="all">All Roles</option>
              {roles.map((role) => (
                <option key={role._id} value={role._id}>
                  {role.name}
                </option>
              ))}
            </select>
            <select
              value={isActiveFilter}
              onChange={(e) => setIsActiveFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
            >
              <option value="all">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">S.No</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No staff found
                  </TableCell>
                </TableRow>
              ) : (
                filteredStaff.map((s, idx) => (
                  <TableRow key={s._id}>
                    <TableCell className="text-center font-medium">{idx + 1}</TableCell>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="whitespace-normal break-words max-w-[12rem] text-sm">
                      {s.email}
                    </TableCell>
                    <TableCell>{s.phone || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant="info">{s.role?.name || 'N/A'}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.isActive ? 'success' : 'warning'}>
                        {s.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {hasPermission('view_staff') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewStaff(s._id)}
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                        {hasPermission('edit_staff') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditStaff(s._id)}
                            title="Edit Staff"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {hasPermission('delete_staff') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(s._id)}
                            title="Delete Staff"
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

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          if (!actionLoading) {
            setIsCreateModalOpen(false);
            resetForm();
          }
        }}
        title="Add New Staff"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email *</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone *</label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter phone"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password *</label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Role *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
              >
                <option value="">Select role</option>
                {roles.map((role) => (
                  <option key={role._id} value={role._id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Enter location"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Image</label>
              <div className="flex items-center gap-4">
                <label className="cursor-pointer">
                  <div className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    <span>Upload Image</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
                {imagePreview && (
                  <div className="relative">
                    <img src={imagePreview} alt="Preview" className="w-16 h-16 rounded-lg object-cover" />
                    <button
                      onClick={() => {
                        setImagePreview(null);
                        setImageFile(null);
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => {
              setIsCreateModalOpen(false);
              resetForm();
            }} disabled={actionLoading}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={actionLoading}>
              {actionLoading ? 'Creating...' : 'Create Staff'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          if (!actionLoading) {
            setIsEditModalOpen(false);
            resetForm();
          }
        }}
        title="Edit Staff"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email *</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone *</label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter phone"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password (leave blank to keep current)</label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter new password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Role *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
              >
                <option value="">Select role</option>
                {roles.map((role) => (
                  <option key={role._id} value={role._id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Enter location"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
              >
                <option value={true}>Active</option>
                <option value={false}>Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Image</label>
              <div className="flex items-center gap-4">
                <label className="cursor-pointer">
                  <div className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    <span>Upload Image</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
                {imagePreview && (
                  <div className="relative">
                    <img src={imagePreview} alt="Preview" className="w-16 h-16 rounded-lg object-cover" />
                    <button
                      onClick={() => {
                        setImagePreview(null);
                        setImageFile(null);
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => {
              setIsEditModalOpen(false);
              resetForm();
            }} disabled={actionLoading}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={actionLoading}>
              {actionLoading ? 'Updating...' : 'Update Staff'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        isOpen={!!confirmAction}
        onClose={() => {
          if (!actionLoading) setConfirmAction(null);
        }}
        title="Delete Staff"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-200">
            Are you sure you want to delete {confirmAction?.name || 'this staff member'}? This action cannot be undone.
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

      {/* Staff Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedStaff(null);
        }}
        title="Staff Details"
        size="lg"
      >
        {loadingStaff ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : selectedStaff ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{selectedStaff.name || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{selectedStaff.email || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Phone className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{selectedStaff.phone || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <Shield className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Role</p>
                  <div className="mt-1">
                    <Badge variant="info">{selectedStaff.role?.name || 'N/A'}</Badge>
                  </div>
                </div>
              </div>
              {selectedStaff.location && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                    <MapPin className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{selectedStaff.location}</p>
                  </div>
                </div>
              )}
              {selectedStaff.gender && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                    <User className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Gender</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 capitalize">{selectedStaff.gender}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                  <Shield className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                  <div className="mt-1">
                    <Badge variant={selectedStaff.isActive ? 'success' : 'warning'}>
                      {selectedStaff.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            {selectedStaff.img && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Image</p>
                <img
                  src={getImageUrl(selectedStaff.img)}
                  alt={selectedStaff.name}
                  className="w-32 h-32 rounded-lg object-cover"
                />
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

