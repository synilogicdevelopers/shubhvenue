import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/admin/ui/Table';
import { Card } from '../../components/admin/ui/Card';
import { Button } from '../../components/admin/ui/Button';
import { Badge } from '../../components/admin/ui/Badge';
import { Input } from '../../components/admin/ui/Input';
import { Modal } from '../../components/admin/ui/Modal';
import { vendorRolesAPI } from '../../services/vendor/api';
import { hasVendorPermission } from '../../utils/vendor/permissions';
import toast from 'react-hot-toast';
import { Search, Eye, Trash2, Plus, Edit, Shield, X, ArrowLeft, Check } from 'lucide-react';

export default function VendorRoles() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [roles, setRoles] = useState([]);
  const [availablePermissions, setAvailablePermissions] = useState([]);
  const [permissionsByCategory, setPermissionsByCategory] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState('all');
  const [selectedRole, setSelectedRole] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingRole, setLoadingRole] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [],
    isActive: true,
  });

  const isFormMode = searchParams.get('mode') === 'create' || searchParams.get('mode') === 'edit';
  const isCreateMode = searchParams.get('mode') === 'create';
  const isEditMode = searchParams.get('mode') === 'edit';
  const roleId = searchParams.get('id');

  useEffect(() => {
    fetchRoles();
    fetchAvailablePermissions();
  }, [isActiveFilter]);

  useEffect(() => {
    if (isEditMode && roleId) {
      loadRoleForEdit();
    } else if (isCreateMode) {
      resetForm();
    }
  }, [isEditMode, isCreateMode, roleId]);

  const fetchRoles = async () => {
    try {
      const params = {};
      if (isActiveFilter !== 'all') params.isActive = isActiveFilter === 'true';
      const response = await vendorRolesAPI.getAll(params);
      setRoles(response.data?.roles || []);
    } catch (error) {
      toast.error('Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailablePermissions = async () => {
    try {
      const response = await vendorRolesAPI.getAvailablePermissions();
      setAvailablePermissions(response.data?.allPermissions || []);
      setPermissionsByCategory(response.data?.permissionsByCategory || {});
    } catch (error) {
      console.error('Failed to load available permissions:', error);
    }
  };

  const loadRoleForEdit = async () => {
    setLoadingRole(true);
    try {
      const response = await vendorRolesAPI.getById(roleId);
      const roleData = response.data?.role;
      setFormData({
        name: roleData.name || '',
        description: roleData.description || '',
        permissions: roleData.permissions || [],
        isActive: roleData.isActive !== undefined ? roleData.isActive : true,
      });
      setSelectedRole(roleData);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to load role details');
      navigate('/vendor/roles');
    } finally {
      setLoadingRole(false);
    }
  };

  const handleViewRole = async (id) => {
    setLoadingRole(true);
    setIsModalOpen(true);
    try {
      const response = await vendorRolesAPI.getById(id);
      setSelectedRole(response.data?.role);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to load role details');
      setIsModalOpen(false);
    } finally {
      setLoadingRole(false);
    }
  };

  const handleEditRole = (id) => {
    navigate(`/vendor/roles?mode=edit&id=${id}`);
  };

  const handleDelete = async (id, skipConfirm = false) => {
    if (!skipConfirm) {
      const targetRole = roles.find((r) => r._id === id) || selectedRole;
      setConfirmAction({
        id,
        name: targetRole?.name,
        type: 'delete',
      });
      return;
    }

    setActionLoading(true);
    try {
      await vendorRolesAPI.delete(id);
      toast.success('Role deleted successfully');
      fetchRoles();
      if (selectedRole && selectedRole._id === id) {
        setIsModalOpen(false);
        setSelectedRole(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete role');
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  };

  const handleCreate = async () => {
    if (!formData.name || formData.permissions.length === 0) {
      toast.error('Please fill name and select at least one permission');
      return;
    }

    setActionLoading(true);
    try {
      await vendorRolesAPI.create(formData);
      toast.success('Role created successfully');
      navigate('/vendor/roles');
      resetForm();
      fetchRoles();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create role');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!formData.name || formData.permissions.length === 0) {
      toast.error('Please fill name and select at least one permission');
      return;
    }

    setActionLoading(true);
    try {
      await vendorRolesAPI.update(selectedRole._id, formData);
      toast.success('Role updated successfully');
      navigate('/vendor/roles');
      resetForm();
      fetchRoles();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update role');
    } finally {
      setActionLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      permissions: [],
      isActive: true,
    });
    setSelectedRole(null);
  };

  const togglePermission = (permission) => {
    if (formData.permissions.includes(permission)) {
      setFormData({
        ...formData,
        permissions: formData.permissions.filter((p) => p !== permission),
      });
    } else {
      setFormData({
        ...formData,
        permissions: [...formData.permissions, permission],
      });
    }
  };

  const toggleCategoryPermissions = (category) => {
    const categoryPerms = permissionsByCategory[category] || [];
    const allSelected = categoryPerms.every((perm) => formData.permissions.includes(perm));

    if (allSelected) {
      setFormData({
        ...formData,
        permissions: formData.permissions.filter((p) => !categoryPerms.includes(p)),
      });
    } else {
      const newPermissions = [...formData.permissions];
      categoryPerms.forEach((perm) => {
        if (!newPermissions.includes(perm)) {
          newPermissions.push(perm);
        }
      });
      setFormData({
        ...formData,
        permissions: newPermissions,
      });
    }
  };

  const filteredRoles = roles.filter((r) => {
    const matchesSearch =
      r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getCategoryLabel = (category) => {
    const labels = {
      dashboard: 'Dashboard',
      venues: 'Venues Management',
      bookings: 'Bookings Management',
      payouts: 'Payouts Management',
      ledger: 'Ledger Management',
      blocked_dates: 'Blocked Dates Management',
      reviews: 'Reviews Management',
      staff: 'Staff Management',
      roles: 'Roles Management',
      profile: 'Profile Management',
    };
    return labels[category] || category;
  };

  // If in form mode, show form page
  if (isFormMode) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/vendor/roles')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Roles
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {isCreateMode ? 'Create New Role' : 'Edit Role'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {isCreateMode ? 'Add a new role with permissions' : 'Update role details and permissions'}
            </p>
          </div>
        </div>

        <Card>
          <div className="p-6 space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Role Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter role name (e.g., Venue Manager, Booking Manager)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter role description"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                  rows="3"
                />
              </div>
              {isEditMode && (
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select
                    value={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                  >
                    <option value={true}>Active</option>
                    <option value={false}>Inactive</option>
                  </select>
                </div>
              )}
            </div>

            {/* Permissions Selection */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium">
                  Permissions * ({formData.permissions.length} selected)
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (formData.permissions.length === availablePermissions.length) {
                      setFormData({ ...formData, permissions: [] });
                    } else {
                      setFormData({ ...formData, permissions: [...availablePermissions] });
                    }
                  }}
                >
                  {formData.permissions.length === availablePermissions.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>

              <div className="space-y-4">
                {Object.keys(permissionsByCategory).length > 0 ? (
                  Object.keys(permissionsByCategory).map((category) => {
                    const categoryPerms = permissionsByCategory[category] || [];
                    const selectedCount = categoryPerms.filter((p) => formData.permissions.includes(p)).length;
                    const allSelected = categoryPerms.length > 0 && selectedCount === categoryPerms.length;

                    return (
                      <div key={category} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                            {getCategoryLabel(category)}
                          </h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleCategoryPermissions(category)}
                          >
                            {allSelected ? 'Deselect All' : 'Select All'}
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {categoryPerms.map((perm) => {
                            const isSelected = formData.permissions.includes(perm);
                            return (
                              <button
                                key={perm}
                                type="button"
                                onClick={() => togglePermission(perm)}
                                className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                                  isSelected
                                    ? 'bg-primary/10 border-primary text-primary'
                                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary/50'
                                }`}
                              >
                                <div
                                  className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                    isSelected
                                      ? 'bg-primary border-primary'
                                      : 'border-gray-300 dark:border-gray-600'
                                  }`}
                                >
                                  {isSelected && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <span className="text-sm font-medium">{perm}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {availablePermissions.map((perm) => {
                      const isSelected = formData.permissions.includes(perm);
                      return (
                        <button
                          key={perm}
                          type="button"
                          onClick={() => togglePermission(perm)}
                          className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                            isSelected
                              ? 'bg-primary/10 border-primary text-primary'
                              : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary/50'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                              isSelected
                                ? 'bg-primary border-primary'
                                : 'border-gray-300 dark:border-gray-600'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <span className="text-sm font-medium">{perm}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => navigate('/vendor/roles')}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={isCreateMode ? handleCreate : handleUpdate}
                disabled={actionLoading}
              >
                {actionLoading
                  ? isCreateMode
                    ? 'Creating...'
                    : 'Updating...'
                  : isCreateMode
                  ? 'Create Role'
                  : 'Update Role'}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Main roles list view
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Roles</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage user roles and permissions</p>
        </div>
        <Button onClick={() => navigate('/vendor/roles?mode=create')}>
          <Plus className="w-4 h-4 mr-2" />
          Add Role
        </Button>
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
                  placeholder="Search roles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
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
                <TableHead>Description</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No roles found
                  </TableCell>
                </TableRow>
              ) : (
                filteredRoles.map((r, idx) => (
                  <TableRow key={r._id}>
                    <TableCell className="text-center font-medium">{idx + 1}</TableCell>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="max-w-xs truncate">{r.description || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant="info">{r.permissions?.length || 0} permissions</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.isActive ? 'success' : 'warning'}>
                        {r.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewRole(r._id)}
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditRole(r._id)}
                          title="Edit Role"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(r._id)}
                          title="Delete Role"
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
        title="Delete Role"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-200">
            Are you sure you want to delete {confirmAction?.name || 'this role'}? This action cannot be undone.
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

      {/* Role Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedRole(null);
        }}
        title="Role Details"
        size="lg"
      >
        {loadingRole ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : selectedRole ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{selectedRole.name || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                  <Shield className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                  <div className="mt-1">
                    <Badge variant={selectedRole.isActive ? 'success' : 'warning'}>
                      {selectedRole.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            {selectedRole.description && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Description</p>
                <p className="text-gray-900 dark:text-gray-100">{selectedRole.description}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Permissions ({selectedRole.permissions?.length || 0})
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedRole.permissions?.map((perm) => (
                  <Badge key={perm} variant="info">
                    {perm}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

