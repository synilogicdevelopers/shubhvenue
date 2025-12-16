import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/admin/ui/Card';
import { Button } from '../../../components/admin/ui/Button';
import { Input } from '../../../components/admin/ui/Input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/admin/ui/Table';
import { Badge } from '../../../components/admin/ui/Badge';
import { Modal } from '../../../components/admin/ui/Modal';
import { contactsAPI } from '../../../services/admin/api';
import toast from 'react-hot-toast';
import { MessageSquare, Eye, Trash2, CheckCircle, XCircle, Clock, Mail } from 'lucide-react';

export const Contacts = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchContacts();
  }, [statusFilter, pagination.page]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const response = await contactsAPI.getAll(params);
      if (response.data?.success) {
        setContacts(response.data.contacts || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination?.total || 0,
          pages: response.data.pagination?.pages || 0,
        }));
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast.error('Failed to load contact submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleViewContact = async (id) => {
    try {
      const response = await contactsAPI.getById(id);
      if (response.data?.success) {
        setSelectedContact(response.data.contact);
        setIsModalOpen(true);
        // Mark as read if status is new
        if (response.data.contact.status === 'new') {
          await contactsAPI.updateStatus(id, { status: 'read' });
          fetchContacts();
        }
      }
    } catch (error) {
      console.error('Error fetching contact:', error);
      toast.error('Failed to load contact details');
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await contactsAPI.updateStatus(id, { status });
      toast.success('Status updated successfully');
      fetchContacts();
      if (isModalOpen) {
        const response = await contactsAPI.getById(id);
        if (response.data?.success) {
          setSelectedContact(response.data.contact);
        }
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleReply = async () => {
    if (!replyMessage.trim()) {
      toast.error('Please enter a reply message');
      return;
    }

    try {
      await contactsAPI.updateStatus(selectedContact._id, {
        status: 'replied',
        replyMessage: replyMessage.trim(),
      });
      toast.success('Reply sent successfully');
      setIsReplyModalOpen(false);
      setReplyMessage('');
      fetchContacts();
      if (isModalOpen) {
        const response = await contactsAPI.getById(selectedContact._id);
        if (response.data?.success) {
          setSelectedContact(response.data.contact);
        }
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Failed to send reply');
    }
  };

  const handleDelete = async (id, skipConfirm = false) => {
    if (!skipConfirm) {
      const target = contacts.find(c => c._id === id) || selectedContact;
      setConfirmAction({ id, name: target?.name || target?.email });
      return;
    }

    setActionLoading(true);
    try {
      await contactsAPI.delete(id);
      toast.success('Contact submission deleted successfully');
      fetchContacts();
      if (isModalOpen && selectedContact?._id === id) {
        setIsModalOpen(false);
        setSelectedContact(null);
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error('Failed to delete contact submission');
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      new: { label: 'New', color: 'blue', icon: Clock },
      read: { label: 'Read', color: 'yellow', icon: Eye },
      replied: { label: 'Replied', color: 'green', icon: CheckCircle },
      resolved: { label: 'Resolved', color: 'gray', icon: XCircle },
    };

    const config = statusConfig[status] || statusConfig.new;
    const Icon = config.icon;

    return (
      <Badge color={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Contact Submissions</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage customer contact form submissions</p>
        </div>
      </div>

      {/* Status Filter */}
      <Card>
        <div className="p-4 flex gap-2 flex-wrap">
          <Button
            variant={statusFilter === 'all' ? 'primary' : 'secondary'}
            onClick={() => setStatusFilter('all')}
            size="sm"
          >
            All
          </Button>
          <Button
            variant={statusFilter === 'new' ? 'primary' : 'secondary'}
            onClick={() => setStatusFilter('new')}
            size="sm"
          >
            New
          </Button>
          <Button
            variant={statusFilter === 'read' ? 'primary' : 'secondary'}
            onClick={() => setStatusFilter('read')}
            size="sm"
          >
            Read
          </Button>
          <Button
            variant={statusFilter === 'replied' ? 'primary' : 'secondary'}
            onClick={() => setStatusFilter('replied')}
            size="sm"
          >
            Replied
          </Button>
          <Button
            variant={statusFilter === 'resolved' ? 'primary' : 'secondary'}
            onClick={() => setStatusFilter('resolved')}
            size="sm"
          >
            Resolved
          </Button>
        </div>
      </Card>

      {/* Contacts Table */}
      <Card>
        <CardContent>
          {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading contacts...</p>
          </div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No contact submissions found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">S.No</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((contact, idx) => (
                    <TableRow key={contact._id}>
                      <TableCell className="text-center font-medium">{idx + 1}</TableCell>
                      <TableCell className="font-medium">{contact.name}</TableCell>
                      <TableCell>
                        <a href={`mailto:${contact.email}`} className="text-purple-600 hover:underline">
                          {contact.email}
                        </a>
                      </TableCell>
                      <TableCell>{contact.phone || '-'}</TableCell>
                      <TableCell>{contact.subject || '-'}</TableCell>
                      <TableCell>{getStatusBadge(contact.status)}</TableCell>
                      <TableCell>{new Date(contact.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleViewContact(contact._id)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDelete(contact._id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="p-4 flex items-center justify-between border-t">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} contacts
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page >= pagination.pages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
        </CardContent>
      </Card>

      {/* Confirmation Modal */}
      <Modal
        isOpen={!!confirmAction}
        onClose={() => {
          if (!actionLoading) setConfirmAction(null);
        }}
        title="Delete Contact Submission"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-200">
            Delete {confirmAction?.name || 'this contact submission'}? This action cannot be undone.
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

      {/* View Contact Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedContact(null);
        }}
        title="Contact Submission Details"
        size="lg"
      >
        {selectedContact && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <p className="text-gray-900 dark:text-gray-100">{selectedContact.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <a href={`mailto:${selectedContact.email}`} className="text-purple-600 hover:underline">
                  {selectedContact.email}
                </a>
              </div>
              {selectedContact.phone && (
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <a href={`tel:${selectedContact.phone}`} className="text-gray-900 dark:text-gray-100">
                    {selectedContact.phone}
                  </a>
                </div>
              )}
              {selectedContact.subject && (
                <div>
                  <label className="block text-sm font-medium mb-1">Subject</label>
                  <p className="text-gray-900 dark:text-gray-100">{selectedContact.subject}</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Message</label>
              <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{selectedContact.message}</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              {getStatusBadge(selectedContact.status)}
            </div>

            {selectedContact.replyMessage && (
              <div>
                <label className="block text-sm font-medium mb-1">Reply</label>
                <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap bg-gray-50 dark:bg-gray-800 p-3 rounded">
                  {selectedContact.replyMessage}
                </p>
                {selectedContact.repliedBy && (
                  <p className="text-xs text-gray-500 mt-1">
                    Replied by {selectedContact.repliedBy.name} on {new Date(selectedContact.repliedAt).toLocaleString()}
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-4 border-t">
              {selectedContact.status !== 'replied' && (
                <Button
                  variant="primary"
                  onClick={() => {
                    setReplyMessage('');
                    setIsReplyModalOpen(true);
                  }}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Reply
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={() => handleStatusUpdate(selectedContact._id, 'read')}
                disabled={selectedContact.status === 'read'}
              >
                Mark as Read
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleStatusUpdate(selectedContact._id, 'resolved')}
                disabled={selectedContact.status === 'resolved'}
              >
                Mark as Resolved
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reply Modal */}
      <Modal
        isOpen={isReplyModalOpen}
        onClose={() => {
          setIsReplyModalOpen(false);
          setReplyMessage('');
        }}
        title="Reply to Contact"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Reply Message</label>
            <textarea
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder="Enter your reply message..."
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-y"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                setIsReplyModalOpen(false);
                setReplyMessage('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleReply}
            >
              Send Reply
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

