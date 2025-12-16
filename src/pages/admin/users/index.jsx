import { useEffect, useState } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/admin/ui/Table';
import { Card } from '../../../components/admin/ui/Card';
import { Button } from '../../../components/admin/ui/Button';
import { Badge } from '../../../components/admin/ui/Badge';
import { Input } from '../../../components/admin/ui/Input';
import { Modal } from '../../../components/admin/ui/Modal';
import { usersAPI } from '../../../services/admin/api';
import toast from 'react-hot-toast';
import { Search, Eye, Ban, Trash2, Mail, Phone, User, Calendar, Shield } from 'lucide-react';

export const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingUser, setLoadingUser] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const fetchUsers = async () => {
    try {
      const params = roleFilter !== 'all' ? { role: roleFilter } : {};
      const response = await usersAPI.getAll(params);
      setUsers(response.data || []);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleViewUser = async (id) => {
    setLoadingUser(true);
    setIsModalOpen(true);
    try {
      const response = await usersAPI.getById(id);
      setSelectedUser(response.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load user details');
      setIsModalOpen(false);
    } finally {
      setLoadingUser(false);
    }
  };

  const handleBlock = async (id, skipConfirm = false) => {
    if (!skipConfirm) {
      const targetUser = users.find((user) => user._id === id) || selectedUser;
      setConfirmAction({
        id,
        name: targetUser?.name,
        type: targetUser?.isBlocked ? 'unblock' : 'block',
      });
      return;
    }

    setActionLoading(true);
    try {
      const response = await usersAPI.block(id);
      toast.success(response.data?.message || 'User blocked successfully');
      fetchUsers();
      if (selectedUser && selectedUser._id === id) {
        setSelectedUser({ ...selectedUser, isBlocked: !selectedUser.isBlocked });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to block user');
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  };

  const handleDelete = async (id, { skipConfirm = false, forceDelete = false, userMeta } = {}) => {
    if (!skipConfirm) {
      setConfirmAction({
        id,
        name: userMeta?.name,
        type: forceDelete ? 'forceDelete' : 'delete',
        meta: userMeta,
      });
      return;
    }

    let shouldClearConfirm = true;
    setActionLoading(true);
    try {
      const config = forceDelete ? { params: { forceDelete: 'true' } } : {};
      const response = await usersAPI.delete(id, config);
      toast.success(response.data?.message || 'User deleted successfully');
      fetchUsers();
      if (selectedUser && selectedUser._id === id) {
        setIsModalOpen(false);
        setSelectedUser(null);
      }
    } catch (error) {
      const errorData = error.response?.data;
      if (errorData?.canForceDelete && (errorData?.bookingsCount > 0 || errorData?.leadsCount > 0)) {
        setConfirmAction({
          id,
          name: userMeta?.name || selectedUser?.name,
          type: 'forceDelete',
          meta: {
            bookingsCount: errorData.bookingsCount || 0,
            leadsCount: errorData.leadsCount || 0,
          },
        });
        shouldClearConfirm = false;
      } else {
        toast.error(errorData?.message || 'Failed to delete user');
      }
      return;
    } finally {
      setActionLoading(false);
      if (shouldClearConfirm) {
        setConfirmAction(null);
      }
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.includes(searchTerm);
    return matchesSearch;
  });

  const getRoleBadge = (role) => {
    const colors = {
      customer: 'info',
      vendor: 'warning',
      affiliate: 'success',
      admin: 'primary',
    };
    return <Badge variant={colors[role] || 'default'}>{role}</Badge>;
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Users</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage all users</p>
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
                  placeholder="Search users..."
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
              <option value="customer">Customer</option>
              <option value="vendor">Vendor</option>
              <option value="affiliate">Affiliate</option>
              <option value="admin">Admin</option>
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
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user, idx) => (
                  <TableRow key={user._id}>
                    <TableCell className="text-center font-medium">{idx + 1}</TableCell>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="whitespace-normal break-words max-w-[12rem] text-sm">
                      {user.email}
                    </TableCell>
                    <TableCell>{user.phone || 'N/A'}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Badge variant={user.verified ? 'success' : 'warning'}>
                          {user.verified ? 'Verified' : 'Pending'}
                        </Badge>
                        {user.isBlocked && (
                          <Badge variant="danger">Blocked</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleViewUser(user._id)}
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                  onClick={() => handleBlock(user._id)}
                          title={user.isBlocked ? "Unblock User" : "Block User"}
                          disabled={user.role === 'admin'}
                        >
                          <Ban className={`w-4 h-4 ${user.isBlocked ? 'text-red-500' : ''}`} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDelete(user._id, { userMeta: user })}
                          title="Delete User"
                          disabled={user.role === 'admin'}
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
        title={confirmAction?.type === 'unblock' ? 'Unblock User' : 'Block User'}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-200">
            {confirmAction?.type === 'unblock' && `Are you sure you want to unblock ${confirmAction?.name || 'this user'}?`}
            {confirmAction?.type === 'block' && `Are you sure you want to block ${confirmAction?.name || 'this user'}?`}
            {confirmAction?.type === 'delete' && `Delete ${confirmAction?.name || 'this user'}? This action cannot be undone.`}
            {confirmAction?.type === 'forceDelete' && (
              `This user has ${confirmAction?.meta?.bookingsCount || 0} booking(s) and ${confirmAction?.meta?.leadsCount || 0} lead(s). ` +
              'Do you want to delete the user along with all their bookings and leads?'
            )}
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setConfirmAction(null)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            {confirmAction?.type === 'block' || confirmAction?.type === 'unblock' ? (
              <Button
                variant={confirmAction?.type === 'unblock' ? 'secondary' : 'danger'}
                onClick={() => handleBlock(confirmAction.id, true)}
                disabled={actionLoading}
              >
                {actionLoading ? 'Please wait...' : confirmAction?.type === 'unblock' ? 'Unblock' : 'Block'}
              </Button>
            ) : null}
            {confirmAction?.type === 'delete' || confirmAction?.type === 'forceDelete' ? (
              <Button
                variant="danger"
                onClick={() => handleDelete(confirmAction.id, { skipConfirm: true, forceDelete: confirmAction?.type === 'forceDelete', userMeta: confirmAction?.meta })}
                disabled={actionLoading}
              >
                {actionLoading ? 'Please wait...' : 'Delete'}
              </Button>
            ) : null}
          </div>
        </div>
      </Modal>

      {/* User Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedUser(null);
        }}
        title="User Details"
        size="lg"
      >
        {loadingUser ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : selectedUser ? (
          <div className="space-y-6">
            {/* User Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{selectedUser.name || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{selectedUser.email || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Phone className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{selectedUser.phone || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <Shield className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Role</p>
                  <div className="mt-1">{getRoleBadge(selectedUser.role)}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Joined Date</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {selectedUser.createdAt 
                      ? new Date(selectedUser.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                  <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                  <div className="mt-1 flex gap-2">
                    <Badge variant={selectedUser.verified ? 'success' : 'warning'}>
                      {selectedUser.verified ? 'Verified' : 'Pending'}
                    </Badge>
                    {selectedUser.isBlocked && (
                      <Badge variant="danger">Blocked</Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="secondary"
                onClick={() => {
                  if (selectedUser.role !== 'admin') {
                    handleBlock(selectedUser._id);
                  } else {
                    toast.error('Cannot block admin user');
                  }
                }}
                disabled={selectedUser.role === 'admin'}
              >
                <Ban className="w-4 h-4 mr-2" />
                {selectedUser.isBlocked ? 'Unblock User' : 'Block User'}
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  if (selectedUser.role !== 'admin') {
                    handleDelete(selectedUser._id, false);
                  } else {
                    toast.error('Cannot delete admin user');
                  }
                }}
                disabled={selectedUser.role === 'admin'}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete User
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};







