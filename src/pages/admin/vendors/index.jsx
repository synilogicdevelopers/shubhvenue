import { useEffect, useState } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/admin/ui/Table';
import { Card } from '../../../components/admin/ui/Card';
import { Button } from '../../../components/admin/ui/Button';
import { Badge } from '../../../components/admin/ui/Badge';
import { Modal } from '../../../components/admin/ui/Modal';
import { Input } from '../../../components/admin/ui/Input';
import { Pagination } from '../../../components/admin/ui/Pagination';
import { vendorsAPI } from '../../../services/admin/api';
import { hasPermission } from '../../../utils/admin/permissions';
import toast from 'react-hot-toast';
import { Check, X, Eye, Trash2, Plus } from 'lucide-react';

export const Vendors = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [vendorDetail, setVendorDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const response = await vendorsAPI.getAll();
      setVendors(response.data || []);
    } catch (error) {
      toast.error('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id, skipConfirm = false) => {
    if (!skipConfirm) {
      const vendor = vendors.find((v) => v._id === id);
      setConfirmAction({ id, name: vendor?.name, type: 'approve' });
      return;
    }
    setActionLoading(true);
    try {
      const response = await vendorsAPI.approve(id);
      toast.success(response.data?.message || 'Vendor approved successfully');
      fetchVendors();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve vendor');
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  };

  const handleReject = async (id, skipConfirm = false) => {
    if (!skipConfirm) {
      const vendor = vendors.find((v) => v._id === id);
      setConfirmAction({ id, name: vendor?.name, type: 'reject' });
      return;
    }
    setActionLoading(true);
    try {
      const response = await vendorsAPI.reject(id);
      toast.success(response.data?.message || 'Vendor rejected successfully');
      fetchVendors();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject vendor');
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  };

  const handleDelete = async (id, skipConfirm = false) => {
    if (!skipConfirm) {
      const vendor = vendors.find((v) => v._id === id);
      setConfirmAction({ id, name: vendor?.name, type: 'delete' });
      return;
    }
    setActionLoading(true);
    try {
      const response = await vendorsAPI.delete(id);
      toast.success(response.data?.message || 'Vendor deleted successfully');
      fetchVendors();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete vendor');
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  };

  const handleViewVendor = async (id) => {
    setSelectedVendor(id);
    setLoadingDetail(true);
    try {
      const response = await vendorsAPI.getById(id);
      // Handle different response formats
      const vendorData = response.data?.vendor || response.data?.data || response.data;
      setVendorDetail(vendorData);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load vendor details');
      setSelectedVendor(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Pagination logic
  const totalItems = vendors.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedVendors = vendors.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Vendors</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage all vendors</p>
        </div>
        {hasPermission('create_vendors') && (
          <Button onClick={() => setCreateOpen(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Vendor
          </Button>
        )}
      </div>

      <Card>
        <div className="p-6 space-y-4">
          {/* Total Count */}
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total Vendors: <span className="font-medium text-gray-900 dark:text-gray-100">{totalItems}</span>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">S.No</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedVendors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No vendors found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedVendors.map((vendor, idx) => (
                  <TableRow key={vendor._id}>
                    <TableCell className="text-center font-medium">{startIndex + idx + 1}</TableCell>
                    <TableCell className="font-medium">{vendor.name}</TableCell>
                    <TableCell>{vendor.email}</TableCell>
                    <TableCell>{vendor.phone || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={vendor.status === 'approved' ? 'success' : vendor.status === 'pending' ? 'warning' : 'danger'}>
                        {vendor.status || 'pending'}
                      </Badge>
                    </TableCell>
                    <TableCell>₹{vendor.totalRevenue || 0}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {hasPermission('view_vendors') && (
                          <Button variant="ghost" size="sm" onClick={() => handleViewVendor(vendor._id)} title="View Details">
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                        {hasPermission('edit_vendors') && vendor.status !== 'approved' && (
                          <Button variant="ghost" size="sm" onClick={() => handleApprove(vendor._id)}>
                            <Check className="w-4 h-4 text-green-500" />
                          </Button>
                        )}
                        {hasPermission('edit_vendors') && vendor.status !== 'rejected' && (
                          <Button variant="ghost" size="sm" onClick={() => handleReject(vendor._id)}>
                            <X className="w-4 h-4 text-red-500" />
                          </Button>
                        )}
                        {hasPermission('delete_vendors') && (
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(vendor._id)}>
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
        title={confirmAction?.type === 'approve' ? 'Approve Vendor' : confirmAction?.type === 'reject' ? 'Reject Vendor' : 'Delete Vendor'}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-200">
            {confirmAction?.type === 'approve'
              ? `Approve ${confirmAction?.name || 'this vendor'}?`
              : confirmAction?.type === 'reject'
              ? `Reject ${confirmAction?.name || 'this vendor'}? This will also reject all their venues.`
              : `Delete ${confirmAction?.name || 'this vendor'}? This action cannot be undone. All their venues will be rejected.`}
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
              variant={confirmAction?.type === 'approve' ? 'secondary' : 'danger'}
              onClick={() => {
                if (confirmAction?.type === 'approve') {
                  handleApprove(confirmAction.id, true)
                } else if (confirmAction?.type === 'reject') {
                  handleReject(confirmAction.id, true)
                } else if (confirmAction?.type === 'delete') {
                  handleDelete(confirmAction.id, true)
                }
              }}
              disabled={actionLoading}
            >
              {actionLoading ? 'Please wait...' : confirmAction?.type === 'approve' ? 'Approve' : confirmAction?.type === 'reject' ? 'Reject' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create Vendor Modal */}
      <Modal
        isOpen={createOpen}
        onClose={() => {
          if (!createLoading) setCreateOpen(false);
        }}
        title="Add Vendor"
        size="md"
      >
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setCreateLoading(true);
            try {
              await vendorsAPI.create(createForm);
              toast.success('Vendor created successfully');
              setCreateOpen(false);
              setCreateForm({ name: '', email: '', phone: '', password: '' });
              fetchVendors();
            } catch (error) {
              toast.error(error.response?.data?.message || 'Failed to create vendor');
            } finally {
              setCreateLoading(false);
            }
          }}
        >
          <Input
            label="Name"
            value={createForm.name}
            onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
            disabled={createLoading}
            required
          />
          <Input
            label="Email"
            type="email"
            value={createForm.email}
            onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
            disabled={createLoading}
            required
          />
          <Input
            label="Phone"
            value={createForm.phone}
            onChange={(e) => setCreateForm((p) => ({ ...p, phone: e.target.value }))}
            disabled={createLoading}
          />
          <Input
            label="Password"
            type="password"
            value={createForm.password}
            onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))}
            disabled={createLoading}
            required
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateOpen(false)}
              disabled={createLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createLoading}>
              {createLoading ? 'Creating...' : 'Create Vendor'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Vendor Detail Modal */}
      <Modal
        isOpen={!!selectedVendor}
        onClose={() => {
          setSelectedVendor(null);
          setVendorDetail(null);
        }}
        title="Vendor Details"
        size="lg"
      >
        {loadingDetail ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : vendorDetail ? (
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Name</label>
                  <p className="text-gray-900 dark:text-gray-100 mt-1">{vendorDetail.name || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</label>
                  <p className="text-gray-900 dark:text-gray-100 mt-1">{vendorDetail.email || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Phone</label>
                  <p className="text-gray-900 dark:text-gray-100 mt-1">{vendorDetail.phone || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</label>
                  <div className="mt-1">
                    <Badge variant={vendorDetail.vendorStatus === 'approved' ? 'success' : vendorDetail.vendorStatus === 'pending' ? 'warning' : 'danger'}>
                      {vendorDetail.vendorStatus || vendorDetail.status || 'pending'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Role</label>
                  <p className="text-gray-900 dark:text-gray-100 mt-1">{vendorDetail.role || 'vendor'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Verified</label>
                  <p className="text-gray-900 dark:text-gray-100 mt-1">{vendorDetail.verified ? 'Yes' : 'No'}</p>
                </div>
                {vendorDetail.createdAt && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Created At</label>
                    <p className="text-gray-900 dark:text-gray-100 mt-1">
                      {new Date(vendorDetail.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {vendorDetail.updatedAt && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Last Updated</label>
                    <p className="text-gray-900 dark:text-gray-100 mt-1">
                      {new Date(vendorDetail.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Revenue & Venues Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Revenue</h3>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    ₹{vendorDetail.totalRevenue || 0}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total Revenue</p>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Venues</h3>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {vendorDetail.venueCount || (Array.isArray(vendorDetail.venues) ? vendorDetail.venues.length : 0)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total Venues</p>
                </div>
              </div>
            </div>

            {/* Venue Status Breakdown */}
            {vendorDetail.venueStatusCounts && (
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Venue Status Breakdown</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {vendorDetail.venueStatusCounts.pending || 0}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Pending</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {vendorDetail.venueStatusCounts.approved || 0}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Approved</p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {vendorDetail.venueStatusCounts.rejected || 0}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Rejected</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {vendorDetail.venueStatusCounts.active || 0}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Active</p>
                  </div>
                </div>
              </div>
            )}

            {/* Venues List */}
            {vendorDetail.venues && Array.isArray(vendorDetail.venues) && vendorDetail.venues.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Venues List</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {vendorDetail.venues.map((venue) => (
                    <div key={venue._id} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{venue.name}</p>
                          {venue.location && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {typeof venue.location === 'string' 
                                ? venue.location 
                                : `${venue.location.city || ''}${venue.location.state ? `, ${venue.location.state}` : ''}`}
                            </p>
                          )}
                        </div>
                        <Badge variant={venue.status === 'approved' ? 'success' : venue.status === 'pending' ? 'warning' : 'danger'}>
                          {venue.status}
                        </Badge>
                      </div>
                      {venue.price && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">₹{venue.price}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Raw Data (for debugging) */}
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
                View Raw Data
              </summary>
              <pre className="mt-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg overflow-auto text-xs">
                {JSON.stringify(vendorDetail, null, 2)}
              </pre>
            </details>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">No vendor details available</div>
        )}
      </Modal>
    </div>
  );
};







