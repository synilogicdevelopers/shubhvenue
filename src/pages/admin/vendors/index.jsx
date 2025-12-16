import { useEffect, useState } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/admin/ui/Table';
import { Card } from '../../../components/admin/ui/Card';
import { Button } from '../../../components/admin/ui/Button';
import { Badge } from '../../../components/admin/ui/Badge';
import { Modal } from '../../../components/admin/ui/Modal';
import { vendorsAPI } from '../../../services/admin/api';
import toast from 'react-hot-toast';
import { Check, X, Eye } from 'lucide-react';

export const Vendors = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Vendors</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage all vendors</p>
      </div>

      <Card>
        <div className="p-6">
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
              {vendors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No vendors found
                  </TableCell>
                </TableRow>
              ) : (
                vendors.map((vendor, idx) => (
                  <TableRow key={vendor._id}>
                    <TableCell className="text-center font-medium">{idx + 1}</TableCell>
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
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        {vendor.status !== 'approved' && (
                          <Button variant="ghost" size="sm" onClick={() => handleApprove(vendor._id)}>
                            <Check className="w-4 h-4 text-green-500" />
                          </Button>
                        )}
                        {vendor.status !== 'rejected' && (
                          <Button variant="ghost" size="sm" onClick={() => handleReject(vendor._id)}>
                            <X className="w-4 h-4 text-red-500" />
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

      {/* Confirmation Modal */}
      <Modal
        isOpen={!!confirmAction}
        onClose={() => {
          if (!actionLoading) setConfirmAction(null);
        }}
        title={confirmAction?.type === 'approve' ? 'Approve Vendor' : 'Reject Vendor'}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-200">
            {confirmAction?.type === 'approve'
              ? `Approve ${confirmAction?.name || 'this vendor'}?`
              : `Reject ${confirmAction?.name || 'this vendor'}?`}
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
              onClick={() =>
                confirmAction?.type === 'approve'
                  ? handleApprove(confirmAction.id, true)
                  : handleReject(confirmAction.id, true)
              }
              disabled={actionLoading}
            >
              {actionLoading ? 'Please wait...' : confirmAction?.type === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};







