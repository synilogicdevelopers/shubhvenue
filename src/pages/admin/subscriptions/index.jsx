import { useEffect, useState } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/admin/ui/Table';
import { Card } from '../../../components/admin/ui/Card';
import { Badge } from '../../../components/admin/ui/Badge';
import { Button } from '../../../components/admin/ui/Button';
import { Input } from '../../../components/admin/ui/Input';
import { Modal } from '../../../components/admin/ui/Modal';
import { planSubscriptionsAPI } from '../../../services/admin/api';
import toast from 'react-hot-toast';
import { Search, Calendar, CreditCard, CheckCircle2, XCircle, Clock, Eye, AlertCircle } from 'lucide-react';
import { hasPermission } from '../../../utils/admin/permissions';

export const Subscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchSubscriptions();
    fetchPendingVerificationRequests();
  }, [statusFilter]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const response = await planSubscriptionsAPI.getAll(params);
      setSubscriptions(response.data?.subscriptions || []);
    } catch (error) {
      toast.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingVerificationRequests = async () => {
    try {
      setPendingLoading(true);
      const response = await planSubscriptionsAPI.getPendingVerificationRequests();
      setPendingRequests(response.data?.requests || []);
    } catch (error) {
      console.error('Failed to load pending verification requests:', error);
    } finally {
      setPendingLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    setActionLoading(true);
    try {
      await planSubscriptionsAPI.approveVerificationRequest(requestId);
      toast.success('Verification request approved successfully');
      fetchPendingVerificationRequests();
      fetchSubscriptions();
      setShowDetailModal(false);
      setSelectedRequest(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve verification request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setActionLoading(true);
    try {
      await planSubscriptionsAPI.rejectVerificationRequest(selectedRequest._id, rejectReason);
      toast.success('Verification request rejected successfully');
      fetchPendingVerificationRequests();
      fetchSubscriptions();
      setShowRejectModal(false);
      setShowDetailModal(false);
      setSelectedRequest(null);
      setRejectReason('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject verification request');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (subscription) => {
    const now = new Date();
    const endDate = new Date(subscription.endDate);
    const isExpired = endDate < now;
    
    if (subscription.paymentStatus === 'completed' && subscription.status === 'active' && !isExpired) {
      return <Badge variant="success">Active</Badge>;
    } else if (subscription.paymentStatus === 'pending') {
      return <Badge variant="warning">Pending Payment</Badge>;
    } else if (subscription.paymentStatus === 'failed') {
      return <Badge variant="destructive">Payment Failed</Badge>;
    } else if (isExpired || subscription.status === 'expired') {
      return <Badge variant="secondary">Expired</Badge>;
    } else if (subscription.status === 'cancelled') {
      return <Badge variant="secondary">Cancelled</Badge>;
    } else if (subscription.status === 'pending_verification') {
      return <Badge variant="warning">Pending Verification</Badge>;
    }
    return <Badge variant="secondary">Unknown</Badge>;
  };

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesSearch =
      !searchQuery ||
      sub.vendorId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.planId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.vendorId?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  // Get user permissions
  const userPermissions = JSON.parse(localStorage.getItem('admin_permissions') || '[]');

  return (
    <div className="p-6 space-y-6">
      {/* Pending Verification Requests Section */}
      {pendingRequests.length > 0 && hasPermission('view_vendors', userPermissions) && (
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <h2 className="text-xl font-bold">Pending Verification Requests</h2>
                <Badge variant="warning">{pendingRequests.length}</Badge>
              </div>
            </div>
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <div key={request._id} className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{request.vendorId?.name || 'N/A'}</h3>
                        <span className="text-sm text-gray-500">({request.vendorId?.email || ''})</span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div><span className="font-medium">Plan:</span> {request.planId?.name || 'N/A'}</div>
                        <div><span className="font-medium">Amount Paid:</span> ₹{request.amountPaid?.toLocaleString('en-IN') || '0'}</div>
                        <div><span className="font-medium">Submitted:</span> {new Date(request.verificationRequestDetails?.submittedAt || request.createdAt).toLocaleString('en-IN')}</div>
                        <div><span className="font-medium">Venues:</span> {request.venueIds?.map(v => v.name || v._id).join(', ') || 'None'}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {hasPermission('edit_vendors', userPermissions) && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowDetailModal(true);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(request._id)}
                            disabled={actionLoading}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowRejectModal(true);
                            }}
                            disabled={actionLoading}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Plan Subscriptions</h1>
      </div>

      <div className="mb-4 flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by vendor name, email, or plan name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="pending_verification">Pending Verification</option>
          <option value="expired">Expired</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendor</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Venues</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Payment Status</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSubscriptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No subscriptions found.
                </TableCell>
              </TableRow>
            ) : (
              filteredSubscriptions.map((sub) => (
                <TableRow key={sub._id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{sub.vendorId?.name || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{sub.vendorId?.email || ''}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{sub.planId?.name || 'N/A'}</TableCell>
                  <TableCell>
                    {sub.venueIds && sub.venueIds.length > 0 ? (
                      <div className="text-sm">
                        {sub.venueIds.map((v, idx) => (
                          <div key={idx}>{v.name || v._id}</div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400">No venues</span>
                    )}
                  </TableCell>
                  <TableCell>₹{sub.amountPaid?.toLocaleString('en-IN') || '0'}</TableCell>
                  <TableCell>
                    {new Date(sub.startDate).toLocaleDateString('en-IN')}
                  </TableCell>
                  <TableCell>
                    {new Date(sub.endDate).toLocaleDateString('en-IN')}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        sub.paymentStatus === 'completed'
                          ? 'success'
                          : sub.paymentStatus === 'pending'
                          ? 'warning'
                          : 'destructive'
                      }
                    >
                      {sub.paymentStatus || 'Pending'}
                    </Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(sub)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Verification Details Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedRequest(null);
        }}
        title="Verification Request Details"
        size="lg"
      >
        {selectedRequest && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Vendor Name</label>
                <p className="text-gray-900 mt-1">{selectedRequest.vendorId?.name || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Vendor Email</label>
                <p className="text-gray-900 mt-1">{selectedRequest.vendorId?.email || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Plan Name</label>
                <p className="text-gray-900 mt-1">{selectedRequest.planId?.name || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Amount Paid</label>
                <p className="text-gray-900 mt-1">₹{selectedRequest.amountPaid?.toLocaleString('en-IN') || '0'}</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Business Name</label>
              <p className="text-gray-900 mt-1">{selectedRequest.verificationRequestDetails?.businessName || 'N/A'}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Business Address</label>
              <p className="text-gray-900 mt-1">{selectedRequest.verificationRequestDetails?.businessAddress || 'N/A'}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Business Phone</label>
                <p className="text-gray-900 mt-1">{selectedRequest.verificationRequestDetails?.businessPhone || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Business Email</label>
                <p className="text-gray-900 mt-1">{selectedRequest.verificationRequestDetails?.businessEmail || 'N/A'}</p>
              </div>
            </div>

            {(selectedRequest.verificationRequestDetails?.businessRegistrationNumber || 
              selectedRequest.verificationRequestDetails?.gstNumber || 
              selectedRequest.verificationRequestDetails?.panNumber) && (
              <div className="grid grid-cols-3 gap-4">
                {selectedRequest.verificationRequestDetails?.businessRegistrationNumber && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Registration Number</label>
                    <p className="text-gray-900 mt-1">{selectedRequest.verificationRequestDetails.businessRegistrationNumber}</p>
                  </div>
                )}
                {selectedRequest.verificationRequestDetails?.gstNumber && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">GST Number</label>
                    <p className="text-gray-900 mt-1">{selectedRequest.verificationRequestDetails.gstNumber}</p>
                  </div>
                )}
                {selectedRequest.verificationRequestDetails?.panNumber && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">PAN Number</label>
                    <p className="text-gray-900 mt-1">{selectedRequest.verificationRequestDetails.panNumber}</p>
                  </div>
                )}
              </div>
            )}

            {selectedRequest.verificationRequestDetails?.additionalDetails && (
              <div>
                <label className="text-sm font-medium text-gray-600">Additional Details</label>
                <p className="text-gray-900 mt-1 whitespace-pre-wrap">{selectedRequest.verificationRequestDetails.additionalDetails}</p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-600">Venues to Verify</label>
              <div className="mt-1 space-y-1">
                {selectedRequest.venueIds && selectedRequest.venueIds.length > 0 ? (
                  selectedRequest.venueIds.map((venue, idx) => (
                    <div key={idx} className="text-gray-900">• {venue.name || venue._id}</div>
                  ))
                ) : (
                  <p className="text-gray-500">No venues selected</p>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedRequest(null);
                }}
                className="flex-1"
              >
                Close
              </Button>
              {hasPermission('edit_vendors', userPermissions) && (
                <>
                  <Button
                    variant="danger"
                    onClick={() => {
                      setShowDetailModal(false);
                      setShowRejectModal(true);
                    }}
                    className="flex-1"
                    disabled={actionLoading}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => handleApprove(selectedRequest._id)}
                    className="flex-1"
                    disabled={actionLoading}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setRejectReason('');
          if (!showDetailModal) {
            setSelectedRequest(null);
          }
        }}
        title="Reject Verification Request"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Please provide a reason for rejection..."
            />
          </div>
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectModal(false);
                setRejectReason('');
                if (!showDetailModal) {
                  setSelectedRequest(null);
                }
              }}
              className="flex-1"
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleReject}
              className="flex-1"
              disabled={actionLoading || !rejectReason.trim()}
            >
              {actionLoading ? 'Rejecting...' : 'Reject Request'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};


