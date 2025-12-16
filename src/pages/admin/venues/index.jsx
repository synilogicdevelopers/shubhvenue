import { useEffect, useState } from 'react';
import { Card, CardContent } from '../../../components/admin/ui/Card';
import { Button } from '../../../components/admin/ui/Button';
import { Badge } from '../../../components/admin/ui/Badge';
import { Modal } from '../../../components/admin/ui/Modal';
import { venuesAPI } from '../../../services/admin/api';
import { getImageUrl } from '../../../utils/admin/imageUrl';
import toast from 'react-hot-toast';
import { Check, X, MapPin, Users, DollarSign, Calendar, MessageSquare, User } from 'lucide-react';

export const Venues = () => {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchVenues();
  }, [statusFilter]);

  const fetchVenues = async () => {
    try {
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const response = await venuesAPI.getAll(params);
      setVenues(response.data || []);
    } catch (error) {
      toast.error('Failed to load venues');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id, skipConfirm = false) => {
    if (!skipConfirm) {
      const venue = venues.find((v) => v._id === id);
      setConfirmAction({ id, name: venue?.name, type: 'approve' });
      return;
    }
    setActionLoading(true);
    try {
      await venuesAPI.approve(id);
      toast.success('Venue approved successfully');
      fetchVenues();
    } catch (error) {
      toast.error('Failed to approve venue');
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  };

  const handleReject = async (id, skipConfirm = false) => {
    if (!skipConfirm) {
      const venue = venues.find((v) => v._id === id);
      setConfirmAction({ id, name: venue?.name, type: 'reject' });
      return;
    }
    setActionLoading(true);
    try {
      await venuesAPI.reject(id);
      toast.success('Venue rejected');
      fetchVenues();
    } catch (error) {
      toast.error('Failed to reject venue');
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  };

  const handleToggleBookingButton = async (id, currentStatus) => {
    try {
      await venuesAPI.updateButtonSettings(id, { 
        bookingButtonEnabled: !currentStatus 
      });
      toast.success(`Booking button ${!currentStatus ? 'enabled' : 'disabled'}`);
      fetchVenues();
    } catch (error) {
      toast.error('Failed to update booking button setting');
    }
  };

  const handleToggleLeadsButton = async (id, currentStatus) => {
    try {
      await venuesAPI.updateButtonSettings(id, { 
        leadsButtonEnabled: !currentStatus 
      });
      toast.success(`Leads button ${!currentStatus ? 'enabled' : 'disabled'}`);
      fetchVenues();
    } catch (error) {
      toast.error('Failed to update leads button setting');
    }
  };

  // Helper function to format location (can be string or object)
  const formatLocation = (location) => {
    if (!location) return 'N/A';
    if (typeof location === 'string') return location;
    if (typeof location === 'object') {
      const parts = [];
      if (location.address) parts.push(location.address);
      if (location.city) parts.push(location.city);
      if (location.state) parts.push(location.state);
      if (location.pincode) parts.push(location.pincode);
      return parts.length > 0 ? parts.join(', ') : 'N/A';
    }
    return 'N/A';
  };

  // Helper function to format capacity (can be number or object)
  const formatCapacity = (capacity) => {
    if (!capacity) return 'N/A';
    if (typeof capacity === 'number') return capacity.toString();
    if (typeof capacity === 'object') {
      if (capacity.minGuests && capacity.maxGuests) {
        return `${capacity.minGuests} - ${capacity.maxGuests}`;
      }
      if (capacity.maxGuests) return capacity.maxGuests.toString();
      if (capacity.minGuests) return capacity.minGuests.toString();
    }
    return 'N/A';
  };

  const filteredVenues = statusFilter === 'all' 
    ? venues 
    : venues.filter(v => v.status === statusFilter);

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Venues</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage all venues</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVenues.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            No venues found
          </div>
        ) : (
          filteredVenues.map((venue, idx) => (
            <Card key={venue._id} className="overflow-hidden relative">
              <span className="absolute top-3 left-3 z-10 px-2 py-1 rounded-md text-xs font-semibold bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-200">
                {idx + 1}
              </span>
              <div className="h-48 bg-gradient-primary flex items-center justify-center">
                {venue.images && venue.images.length > 0 ? (
                  <img 
                    src={getImageUrl(venue.images[0])} 
                    alt={venue.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : venue.coverImage ? (
                  <img 
                    src={getImageUrl(venue.coverImage)} 
                    alt={venue.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <MapPin className="w-16 h-16 text-white opacity-50" />
                )}
              </div>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {venue.name}
                  </h3>
                  <Badge variant={venue.status === 'approved' ? 'success' : venue.status === 'pending' ? 'warning' : 'danger'}>
                    {venue.status}
                  </Badge>
                </div>
                
                {/* Vendor Information */}
                {(venue.vendorId || venue.vendor) && (
                  <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="font-medium text-blue-900 dark:text-blue-100">Vendor:</span>
                      <span className="text-blue-700 dark:text-blue-300">
                        {venue.vendorId?.name || venue.vendor?.name || venue.vendorId?.email || venue.vendor?.email || 'N/A'}
                      </span>
                    </div>
                    {venue.vendorId?.email || venue.vendor?.email ? (
                      <div className="flex items-center gap-2 text-xs mt-1 text-blue-600 dark:text-blue-400 ml-6">
                        {venue.vendorId?.email || venue.vendor?.email}
                      </div>
                    ) : null}
                  </div>
                )}
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <MapPin className="w-4 h-4" />
                    <span>{formatLocation(venue.location)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Users className="w-4 h-4" />
                    <span>Capacity: {formatCapacity(venue.capacity)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <DollarSign className="w-4 h-4" />
                    <span>₹{venue.price?.toLocaleString() || venue.pricingInfo?.rentalPrice?.toLocaleString() || '0'}</span>
                  </div>
                </div>

                {/* Button Settings Toggles */}
                <div className="mb-4 space-y-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-gray-700 dark:text-gray-300">Booking Button</span>
                    </div>
                    <button
                      onClick={() => handleToggleBookingButton(venue._id, venue.bookingButtonEnabled !== false)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        venue.bookingButtonEnabled !== false ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          venue.bookingButtonEnabled !== false ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <MessageSquare className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-gray-700 dark:text-gray-300">Leads Button</span>
                    </div>
                    <button
                      onClick={() => handleToggleLeadsButton(venue._id, venue.leadsButtonEnabled !== false)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        venue.leadsButtonEnabled !== false ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          venue.leadsButtonEnabled !== false ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  {venue.status !== 'approved' && (
                    <Button size="sm" onClick={() => handleApprove(venue._id)} className="flex-1">
                      Approve
                    </Button>
                  )}
                  {venue.status !== 'rejected' && (
                    <Button size="sm" variant="danger" onClick={() => handleReject(venue._id)} className="flex-1">
                      Reject
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={!!confirmAction}
        onClose={() => {
          if (!actionLoading) setConfirmAction(null);
        }}
        title={confirmAction?.type === 'approve' ? 'Approve Venue' : 'Reject Venue'}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-200">
            {confirmAction?.type === 'approve'
              ? `Approve ${confirmAction?.name || 'this venue'}?`
              : `Reject ${confirmAction?.name || 'this venue'}?`}
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






