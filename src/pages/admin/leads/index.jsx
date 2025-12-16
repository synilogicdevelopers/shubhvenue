import { useEffect, useState } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/admin/ui/Table';
import { Card } from '../../../components/admin/ui/Card';
import { Button } from '../../../components/admin/ui/Button';
import { Badge } from '../../../components/admin/ui/Badge';
import { Modal } from '../../../components/admin/ui/Modal';
import { Input } from '../../../components/admin/ui/Input';
import { leadsAPI } from '../../../services/admin/api';
import toast from 'react-hot-toast';
import { Calendar, Phone, Mail, User, MapPin, Eye, CreditCard } from 'lucide-react';

export const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [paymentIdInput, setPaymentIdInput] = useState('');

  useEffect(() => {
    fetchLeads();
  }, [statusFilter]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const response = await leadsAPI.getAll(params);
      setLeads(response.data?.leads || []);
    } catch (error) {
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedLead || !newStatus) return;
    try {
      await leadsAPI.updateStatus(selectedLead._id, { status: newStatus, notes });
      toast.success('Lead status updated');
      setStatusModalOpen(false);
      setNotes('');
      fetchLeads();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleConvertToBooking = async (lead, skipConfirm = false) => {
    if (!skipConfirm) {
      setConfirmAction({
        type: 'convert',
        id: lead._id,
        name: lead.name || lead.customerId?.name,
        amount: lead.totalAmount || 0,
      });
      setPaymentIdInput('');
      return;
    }
    
    try {
      setActionLoading(true);
      const response = await leadsAPI.convertToBooking(lead._id, paymentIdInput?.trim() || null);
      toast.success(response.data?.message || 'Lead converted to booking successfully');
      fetchLeads();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to convert lead to booking');
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
      setPaymentIdInput('');
    }
  };

  const openStatusModal = (lead) => {
    setSelectedLead(lead);
    setNewStatus(lead.status);
    setNotes(lead.notes || '');
    setStatusModalOpen(true);
  };

  const openDetailModal = (lead) => {
    setSelectedLead(lead);
    setDetailModalOpen(true);
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'new':
        return 'warning';
      case 'contacted':
        return 'info';
      case 'qualified':
        return 'success';
      case 'converted':
        return 'success';
      case 'lost':
        return 'danger';
      default:
        return 'default';
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Leads</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage all customer inquiries and leads</p>
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="converted">Converted</option>
            <option value="lost">Lost</option>
          </select>
        </div>
      </div>

      <Card>
        <div className="p-6">
          <div className="w-full overflow-x-auto">
            <Table className="min-w-full table-auto">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">S.No</TableHead>
                  <TableHead className="min-w-[80px]">Lead ID</TableHead>
                  <TableHead className="min-w-[120px]">Customer</TableHead>
                  <TableHead className="min-w-[100px]">Contact</TableHead>
                  <TableHead className="min-w-[150px]">Venue</TableHead>
                  <TableHead className="min-w-[140px] max-w-[160px]">Date</TableHead>
                  <TableHead className="w-20 text-center">Guests</TableHead>
                  <TableHead className="min-w-[100px] text-right">Amount</TableHead>
                  <TableHead className="min-w-[100px]">Status</TableHead>
                  <TableHead className="min-w-[90px]">Source</TableHead>
                  <TableHead className="min-w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {leads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                    No leads found
                  </TableCell>
                </TableRow>
              ) : (
                leads.map((lead, idx) => (
                  <TableRow key={lead._id}>
                    <TableCell className="text-center font-medium">{idx + 1}</TableCell>
                    <TableCell className="font-mono text-sm whitespace-nowrap">{lead._id.slice(-8)}</TableCell>
                    <TableCell>
                      <div className="min-w-0">
                        <div className="font-medium truncate" title={lead.name || lead.customerId?.name || 'N/A'}>{lead.name || lead.customerId?.name || 'N/A'}</div>
                        {lead.personName && (
                          <div className="text-xs text-gray-500 truncate" title={`For: ${lead.personName}`}>For: {lead.personName}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {lead.phone && (
                        <div className="flex items-center gap-1 text-sm whitespace-nowrap">
                          <Phone className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{lead.phone}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="truncate max-w-[150px]" title={lead.venueId?.name || 'N/A'}>
                        {lead.venueId?.name || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[160px]">
                      <div className="space-y-0.5 text-xs">
                        {lead.dateFrom && lead.dateTo ? (
                          <>
                            <div className="flex items-center gap-1 whitespace-nowrap">
                              <Calendar className="w-3 h-3 flex-shrink-0" />
                              <span className="font-medium text-[10px]">From:</span>
                              <span className="truncate">{new Date(lead.dateFrom).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                            </div>
                            <div className="flex items-center gap-1 text-gray-600 whitespace-nowrap">
                              <span className="font-medium text-[10px]">To:</span>
                              <span className="truncate">{new Date(lead.dateTo).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                            </div>
                          </>
                        ) : lead.date ? (
                          <div className="flex items-center gap-1 whitespace-nowrap">
                            <Calendar className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{new Date(lead.date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                          </div>
                        ) : (
                          'N/A'
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center whitespace-nowrap">{lead.guests || 0}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">₹{lead.totalAmount?.toLocaleString() || 0}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(lead.status)}>
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={lead.source === 'booking' ? 'success' : 'default'}>
                        {lead.source || 'inquiry'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 whitespace-nowrap">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => openDetailModal(lead)}
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => openStatusModal(lead)}
                          title="Edit Status"
                        >
                          Edit
                        </Button>
                        {!lead.bookingId && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleConvertToBooking(lead)}
                            className="text-green-600 hover:text-green-700"
                            title="Convert to Booking"
                          >
                            <CreditCard className="w-4 h-4" />
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
        </div>
      </Card>

      {/* Confirmation Modal */}
      <Modal
        isOpen={!!confirmAction}
        onClose={() => {
          if (!actionLoading) setConfirmAction(null);
        }}
        title="Convert Lead to Booking"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-200">
            Convert lead {confirmAction?.name ? `"${confirmAction.name}"` : ''} to booking? This will create a booking for ₹{(confirmAction?.amount || 0).toLocaleString()}.
          </p>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Payment ID (optional)
            </label>
            <Input
              type="text"
              value={paymentIdInput}
              onChange={(e) => setPaymentIdInput(e.target.value)}
              placeholder="Razorpay Payment ID"
            />
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
              variant="secondary"
              onClick={() => handleConvertToBooking({ _id: confirmAction?.id }, true)}
              disabled={actionLoading}
            >
              {actionLoading ? 'Please wait...' : 'Convert'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Lead Detail Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="Lead Details"
      >
        {selectedLead && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Name</label>
                <p className="text-gray-900 dark:text-gray-100">{selectedLead.name || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Phone</label>
                <p className="text-gray-900 dark:text-gray-100">{selectedLead.phone || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-gray-900 dark:text-gray-100">{selectedLead.email || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <Badge variant={getStatusBadgeVariant(selectedLead.status)}>
                  {selectedLead.status}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Venue</label>
                <p className="text-gray-900 dark:text-gray-100">{selectedLead.venueId?.name || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Booking Dates</label>
                <div className="text-gray-900 dark:text-gray-100 space-y-1">
                  {selectedLead.dateFrom && selectedLead.dateTo ? (
                    <>
                      <div>
                        <span className="font-medium">From: </span>
                        {new Date(selectedLead.dateFrom).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                      <div>
                        <span className="font-medium">To: </span>
                        {new Date(selectedLead.dateTo).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                    </>
                  ) : selectedLead.date ? (
                    <div>
                      {new Date(selectedLead.date).toLocaleDateString('en-IN', {
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
                <p className="text-gray-900 dark:text-gray-100">{selectedLead.guests || 0}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Amount</label>
                <p className="text-gray-900 dark:text-gray-100">₹{selectedLead.totalAmount?.toLocaleString() || 0}</p>
              </div>
              {selectedLead.marriageFor && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Marriage For</label>
                  <p className="text-gray-900 dark:text-gray-100">{selectedLead.marriageFor}</p>
                </div>
              )}
              {selectedLead.personName && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Person Name</label>
                  <p className="text-gray-900 dark:text-gray-100">{selectedLead.personName}</p>
                </div>
              )}
              {selectedLead.eventType && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Event Type</label>
                  <p className="text-gray-900 dark:text-gray-100 capitalize">{selectedLead.eventType}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-500">Food Preference</label>
                <p className="text-gray-900 dark:text-gray-100 capitalize">{selectedLead.foodPreference || 'both'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Source</label>
                <Badge variant={selectedLead.source === 'booking' ? 'success' : 'default'}>
                  {selectedLead.source || 'inquiry'}
                </Badge>
              </div>
            </div>
            {selectedLead.notes && (
              <div>
                <label className="text-sm font-medium text-gray-500">Notes</label>
                <p className="text-gray-900 dark:text-gray-100 mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  {selectedLead.notes}
                </p>
              </div>
            )}
            {selectedLead.bookingId && (
              <div>
                <label className="text-sm font-medium text-gray-500">Linked Booking</label>
                <p className="text-gray-900 dark:text-gray-100 font-mono text-sm">
                  {selectedLead.bookingId}
                </p>
              </div>
            )}
            <div className="flex gap-2 justify-end">
              {!selectedLead.bookingId && (
                <Button 
                  variant="default" 
                  onClick={() => {
                    setDetailModalOpen(false);
                    handleConvertToBooking(selectedLead);
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Convert to Booking
                </Button>
              )}
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
        title="Update Lead Status"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
            >
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="converted">Converted</option>
              <option value="lost">Lost</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
              placeholder="Add notes about this lead..."
            />
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

