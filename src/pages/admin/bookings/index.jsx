import { useEffect, useState } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/admin/ui/Table';
import { Card } from '../../../components/admin/ui/Card';
import { Button } from '../../../components/admin/ui/Button';
import { Badge } from '../../../components/admin/ui/Badge';
import { Modal } from '../../../components/admin/ui/Modal';
import { Input } from '../../../components/admin/ui/Input';
import { Pagination } from '../../../components/admin/ui/Pagination';
import { bookingsAPI } from '../../../services/admin/api';
import { hasPermission } from '../../../utils/admin/permissions';
import toast from 'react-hot-toast';
import { Calendar, Phone, Mail, User, MapPin, Eye, Search, CheckCircle, XCircle } from 'lucide-react';

export const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const response = await bookingsAPI.getAll(params);
      setBookings(response.data?.bookings || response.data || []);
    } catch (error) {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedBooking || !newStatus) return;
    try {
      setLoading(true);
      const response = await bookingsAPI.updateStatus(selectedBooking._id, newStatus);
      console.log('Status update response:', response);
      
      if (response.data?.success || response.data?.message) {
        toast.success(response.data?.message || 'Booking status updated successfully');
      } else {
        toast.success('Booking status updated successfully');
      }
      
      setStatusModalOpen(false);
      // Refresh bookings list
      await fetchBookings();
    } catch (error) {
      console.error('Status update error:', error);
      console.error('Error response:', error.response);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Failed to update status';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (bookingOrId, skipConfirm = false) => {
    const bookingData = typeof bookingOrId === 'object' ? bookingOrId : bookings.find(b => b._id === bookingOrId);
    const id = bookingData?._id || bookingOrId;

    if (!skipConfirm) {
      setConfirmAction({
        id,
        type: 'approve',
        venue: bookingData?.venueId?.name,
        customer: bookingData?.customerId?.name || bookingData?.customerName,
      });
      setRejectReason('');
      return;
    }

    setActionLoading(true);
    try {
      setLoading(true);
      const response = await bookingsAPI.approve(id);
      console.log('Approve response:', response);
      
      if (response.data?.success || response.data?.message) {
        toast.success(response.data?.message || 'Booking approved successfully');
      } else {
        toast.success('Booking approved successfully');
      }
      
      // Refresh bookings list
      await fetchBookings();
    } catch (error) {
      console.error('Approve error:', error);
      console.error('Error response:', error.response);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Failed to approve booking';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setActionLoading(false);
      setConfirmAction(null);
    }
  };

  const handleReject = async (bookingOrId, skipConfirm = false) => {
    const bookingData = typeof bookingOrId === 'object' ? bookingOrId : bookings.find(b => b._id === bookingOrId);
    const id = bookingData?._id || bookingOrId;

    if (!skipConfirm) {
      setConfirmAction({
        id,
        type: 'reject',
        venue: bookingData?.venueId?.name,
        customer: bookingData?.customerId?.name || bookingData?.customerName,
      });
      setRejectReason('');
      return;
    }

    if (!rejectReason.trim()) {
      toast.error('Rejection reason is required');
      return;
    }

    setActionLoading(true);
    try {
      setLoading(true);
      const response = await bookingsAPI.reject(id, rejectReason.trim());
      console.log('Reject response:', response);
      
      if (response.data?.success || response.data?.message) {
        toast.success(response.data?.message || 'Booking rejected successfully');
      } else {
        toast.success('Booking rejected successfully');
      }
      
      // Refresh bookings list
      await fetchBookings();
    } catch (error) {
      console.error('Reject error:', error);
      console.error('Error response:', error.response);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Failed to reject booking';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setActionLoading(false);
      setConfirmAction(null);
    }
  };

  const openStatusModal = (booking) => {
    setSelectedBooking(booking);
    setNewStatus(booking.status);
    setStatusModalOpen(true);
  };

  const openDetailModal = (booking) => {
    setSelectedBooking(booking);
    setDetailModalOpen(true);
  };

  const getStatusBadgeVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'warning';
      case 'confirmed':
      case 'approved':
        return 'success';
      case 'rejected':
      case 'cancelled':
        return 'danger';
      case 'completed':
        return 'info';
      default:
        return 'default';
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customerId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customerId?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.venueId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.phone?.includes(searchTerm);
    return matchesSearch;
  });

  // Pagination logic
  const totalItems = filteredBookings.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBookings = filteredBookings.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
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
    <div className="space-y-6 w-full max-w-none mx-auto px-2 sm:px-4 md:px-6 lg:px-8 overflow-x-hidden">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Bookings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage all venue bookings</p>
        </div>
      </div>

      <Card className="w-full max-w-none">
        <div className="p-6 space-y-4 w-full">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search bookings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Total Count */}
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total Bookings: <span className="font-medium text-gray-900 dark:text-gray-100">{totalItems}</span>
          </div>

          {/* Table */}
          <div className="w-full">
            <Table className="w-full table-auto text-xs md:text-sm leading-tight">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14 text-center">S.No</TableHead>
                  <TableHead>Booking ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Event Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Guests</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedBookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-8 text-gray-500">
                      No bookings found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedBookings.map((booking, idx) => (
                    <TableRow key={booking._id}>
                      <TableCell className="text-center font-medium px-2 py-2">{startIndex + idx + 1}</TableCell>
                      <TableCell className="font-mono text-xs md:text-sm break-words px-2 py-2">{booking._id?.slice(-8) || 'N/A'}</TableCell>
                      <TableCell className="whitespace-normal break-words max-w-[9rem] px-2 py-2">
                        <div>
                          <div className="font-medium">
                            {booking.customerId?.name || booking.customerName || 'N/A'}
                          </div>
                          {booking.personName && (
                            <div className="text-xs text-gray-500">For: {booking.personName}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-normal break-words max-w-[10rem] px-2 py-2">
                        {booking.phone && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="w-3 h-3 shrink-0" />
                            <span className="truncate">{booking.phone}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-normal break-words max-w-[9rem] px-2 py-2">{booking.venueId?.name || booking.venueName || 'N/A'}</TableCell>
                      <TableCell className="whitespace-normal break-words max-w-[8rem] px-2 py-2">
                        <span className="capitalize">{booking.eventType || 'N/A'}</span>
                      </TableCell>
                      <TableCell className="whitespace-normal break-words max-w-[10rem] px-2 py-2">
                        <div className="space-y-1">
                          {booking.dateFrom && booking.dateTo ? (
                            <>
                              <div className="flex items-center gap-1 text-sm">
                                <Calendar className="w-3 h-3" />
                                <span className="font-medium">From:</span>
                                <span>{new Date(booking.dateFrom).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <span className="font-medium">To:</span>
                                <span>{new Date(booking.dateTo).toLocaleDateString()}</span>
                              </div>
                            </>
                          ) : booking.date ? (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(booking.date).toLocaleDateString()}
                            </div>
                          ) : (
                            'N/A'
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-2 py-1 text-center">{booking.guests || booking.numberOfGuests || 0}</TableCell>
                      <TableCell className="whitespace-nowrap px-2 py-1 text-center">₹{booking.totalAmount?.toLocaleString() || booking.amount?.toLocaleString() || 0}</TableCell>
                      <TableCell className="whitespace-nowrap px-2 py-1 text-center">
                        <Badge variant={getStatusBadgeVariant(booking.status)}>
                          {booking.status || 'pending'}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-2 py-1 text-center">
                        <Badge variant={booking.paymentStatus === 'paid' ? 'success' : 'warning'}>
                          {booking.paymentStatus || 'pending'}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-2 py-1 text-center">
                        <div className="flex gap-2 flex-wrap">
                          {hasPermission('view_bookings') && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => openDetailModal(booking)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                          {hasPermission('edit_bookings') && !booking.adminApproved && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleApprove(booking)}
                                className="text-green-600 hover:text-green-700"
                                title="Approve Booking"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleReject(booking)}
                                className="text-red-600 hover:text-red-700"
                                title="Reject Booking"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          {hasPermission('edit_bookings') && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => openStatusModal(booking)}
                            >
                              Edit
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

      {/* Confirmations Modal */}
      {confirmAction && (
        <Modal
          isOpen={!!confirmAction}
          onClose={() => {
            if (!actionLoading) {
              setConfirmAction(null);
              setRejectReason('');
            }
          }}
          title={confirmAction?.type === 'approve' ? 'Approve Booking' : 'Reject Booking'}
          size="sm"
        >
        <div className="space-y-4">
          <div className="space-y-1 text-sm text-gray-700 dark:text-gray-200">
            <p>
              {confirmAction?.type === 'approve'
                ? `Approve booking for ${confirmAction?.customer || 'customer'} at ${confirmAction?.venue || 'this venue'}?`
                : `Reject booking for ${confirmAction?.customer || 'customer'} at ${confirmAction?.venue || 'this venue'}?`}
            </p>
            {confirmAction?.type === 'reject' && (
              <div className="space-y-2 pt-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Reason</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Provide rejection reason"
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                />
              </div>
            )}
          </div>
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
      )}

      {/* Booking Detail Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="Booking Details"
      >
        {selectedBooking && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Booking ID</label>
                <p className="text-gray-900 dark:text-gray-100 font-mono text-sm">
                  {selectedBooking._id}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <div className="mt-1">
                  <Badge variant={getStatusBadgeVariant(selectedBooking.status)}>
                    {selectedBooking.status || 'pending'}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Customer Name</label>
                <p className="text-gray-900 dark:text-gray-100">
                  {selectedBooking.customerId?.name || selectedBooking.customerName || 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Phone</label>
                <p className="text-gray-900 dark:text-gray-100">{selectedBooking.phone || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-gray-900 dark:text-gray-100">
                  {selectedBooking.customerId?.email || selectedBooking.email || 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Venue</label>
                <p className="text-gray-900 dark:text-gray-100">
                  {selectedBooking.venueId?.name || selectedBooking.venueName || 'N/A'}
                </p>
              </div>
              {selectedBooking.venueId?.location && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Venue Location</label>
                  <p className="text-gray-900 dark:text-gray-100">
                    {typeof selectedBooking.venueId.location === 'string' 
                      ? selectedBooking.venueId.location 
                      : selectedBooking.venueId.location?.address 
                        ? `${selectedBooking.venueId.location.address}, ${selectedBooking.venueId.location.city || ''}, ${selectedBooking.venueId.location.state || ''}`.trim().replace(/^,\s*|,\s*$/g, '')
                        : 'N/A'}
                  </p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-500">Booking Dates</label>
                <div className="text-gray-900 dark:text-gray-100 space-y-1">
                  {selectedBooking.dateFrom && selectedBooking.dateTo ? (
                    <>
                      <div>
                        <span className="font-medium">From: </span>
                        {new Date(selectedBooking.dateFrom).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                      <div>
                        <span className="font-medium">To: </span>
                        {new Date(selectedBooking.dateTo).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                    </>
                  ) : selectedBooking.date ? (
                    <div>
                      {new Date(selectedBooking.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </div>
                  ) : (
                    'N/A'
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Guests</label>
                <p className="text-gray-900 dark:text-gray-100">
                  {selectedBooking.guests || selectedBooking.numberOfGuests || 0}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Total Amount</label>
                <p className="text-gray-900 dark:text-gray-100">
                  ₹{selectedBooking.totalAmount?.toLocaleString() || selectedBooking.amount?.toLocaleString() || 0}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Payment Status</label>
                <div className="mt-1">
                  <Badge variant={selectedBooking.paymentStatus === 'paid' ? 'success' : 'warning'}>
                    {selectedBooking.paymentStatus || 'pending'}
                  </Badge>
                </div>
              </div>
              {selectedBooking.paymentId && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Payment ID</label>
                  <p className="text-gray-900 dark:text-gray-100 font-mono text-sm">
                    {selectedBooking.paymentId}
                  </p>
                </div>
              )}
              {selectedBooking.eventType && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Event Type</label>
                  <p className="text-gray-900 dark:text-gray-100 capitalize">{selectedBooking.eventType}</p>
                </div>
              )}
              {selectedBooking.personName && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Person Name</label>
                  <p className="text-gray-900 dark:text-gray-100">{selectedBooking.personName}</p>
                </div>
              )}
              {selectedBooking.foodPreference && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Food Preference</label>
                  <p className="text-gray-900 dark:text-gray-100 capitalize">{selectedBooking.foodPreference}</p>
                </div>
              )}
              {selectedBooking.createdAt && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Booked On</label>
                  <p className="text-gray-900 dark:text-gray-100">
                    {new Date(selectedBooking.createdAt).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </p>
                </div>
              )}
            </div>
            {selectedBooking.notes && (
              <div>
                <label className="text-sm font-medium text-gray-500">Notes</label>
                <p className="text-gray-900 dark:text-gray-100 mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  {selectedBooking.notes}
                </p>
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setDetailModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Status Update Modal */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title="Update Booking Status"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
            >
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setStatusModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleStatusUpdate}>
              Update Status
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
