import { useEffect, useState } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/admin/ui/Table';
import { Card } from '../../../components/admin/ui/Card';
import { Button } from '../../../components/admin/ui/Button';
import { Badge } from '../../../components/admin/ui/Badge';
import { Input } from '../../../components/admin/ui/Input';
import { Modal } from '../../../components/admin/ui/Modal';
import { Pagination } from '../../../components/admin/ui/Pagination';
import { faqsAPI } from '../../../services/admin/api';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Search, HelpCircle } from 'lucide-react';

export const FAQs = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: '',
    isActive: true,
    sortOrder: 0,
  });

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    try {
      setLoading(true);
      const response = await faqsAPI.getAll();
      console.log('FAQs API Response:', response);
      console.log('FAQs API Response Data:', response.data);
      
      let faqsData = [];
      if (response.data) {
        if (response.data.success && response.data.faqs && Array.isArray(response.data.faqs)) {
          faqsData = response.data.faqs;
        } else if (response.data.faqs && Array.isArray(response.data.faqs)) {
          faqsData = response.data.faqs;
        } else if (Array.isArray(response.data)) {
          faqsData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          faqsData = response.data.data;
        }
      }
      
      console.log('Parsed FAQs:', faqsData);
      console.log('FAQs count:', faqsData.length);
      setFaqs(faqsData);
      
      if (faqsData.length === 0) {
        console.log('No FAQs found. You can create a new FAQ using the "Add FAQ" button.');
      }
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      console.error('Error response:', error.response);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to load FAQs';
      toast.error(errorMessage);
      setFaqs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (faq = null) => {
    if (faq) {
      setEditingFAQ(faq);
      setFormData({
        question: faq.question || '',
        answer: faq.answer || '',
        category: faq.category || '',
        isActive: faq.isActive !== undefined ? faq.isActive : true,
        sortOrder: faq.sortOrder || 0,
      });
    } else {
      setEditingFAQ(null);
      setFormData({
        question: '',
        answer: '',
        category: '',
        isActive: true,
        sortOrder: 0,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingFAQ(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.question.trim()) {
      toast.error('Question is required');
      return;
    }
    
    if (!formData.answer.trim()) {
      toast.error('Answer is required');
      return;
    }

    try {
      if (editingFAQ) {
        await faqsAPI.update(editingFAQ._id, formData);
        toast.success('FAQ updated successfully');
      } else {
        await faqsAPI.create(formData);
        toast.success('FAQ created successfully');
      }
      handleCloseModal();
      fetchFAQs();
    } catch (error) {
      console.error('Error saving FAQ:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to save FAQ';
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (id, skipConfirm = false, faqMeta = {}) => {
    if (!skipConfirm) {
      setConfirmAction({ id, name: faqMeta.question });
      return;
    }

    setActionLoading(true);
    try {
      await faqsAPI.delete(id);
      toast.success('FAQ deleted successfully');
      fetchFAQs();
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to delete FAQ';
      toast.error(errorMessage);
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  };

  const handleToggleActive = async (faq) => {
    try {
      await faqsAPI.toggleActive(faq._id);
      toast.success(`FAQ ${faq.isActive ? 'deactivated' : 'activated'} successfully`);
      fetchFAQs();
    } catch (error) {
      console.error('Error toggling FAQ active status:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to update FAQ status';
      toast.error(errorMessage);
    }
  };

  const filteredFAQs = faqs.filter((faq) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      faq.question.toLowerCase().includes(searchLower) ||
      faq.answer.toLowerCase().includes(searchLower) ||
      (faq.category && faq.category.toLowerCase().includes(searchLower))
    );
  });

  // Pagination logic
  const totalItems = filteredFAQs.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedFAQs = filteredFAQs.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading FAQs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">FAQs</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage frequently asked questions</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Add FAQ
        </Button>
      </div>

      <Card>
        <div className="p-6 w-full">
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search FAQs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Total Count */}
          <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Total FAQs: <span className="font-medium text-gray-900 dark:text-gray-100">{totalItems}</span>
          </div>

          {paginatedFAQs.length === 0 ? (
            <div className="text-center py-12">
              <HelpCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm ? 'No FAQs found matching your search' : 'No FAQs found. Create your first FAQ!'}
              </p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">S.No</TableHead>
                    <TableHead>Question</TableHead>
                    <TableHead>Answer</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Sort Order</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedFAQs.map((faq, idx) => (
                    <TableRow key={faq._id}>
                      <TableCell className="text-center font-medium">{startIndex + idx + 1}</TableCell>
                      <TableCell className="font-medium">
                        <div className="break-words" title={faq.question}>
                          {faq.question}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="break-words line-clamp-2" title={faq.answer}>
                          {faq.answer}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{faq.category || '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{faq.sortOrder || 0}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant={faq.isActive ? 'success' : 'secondary'}>
                          {faq.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(faq)}
                            title={faq.isActive ? 'Deactivate' : 'Activate'}
                            className="whitespace-nowrap min-w-[90px] text-center"
                          >
                            <span className="block w-full">{faq.isActive ? 'Deactivate' : 'Activate'}</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenModal(faq)}
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(faq._id, false, { question: faq.question })}
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

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
        title="Delete FAQ"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-200">
            Delete {confirmAction?.name || 'this FAQ'}? This action cannot be undone.
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

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingFAQ ? 'Edit FAQ' : 'Add FAQ'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Question <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              placeholder="Enter question"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Answer <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.answer}
              onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
              placeholder="Enter answer"
              required
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category
            </label>
            <Input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="e.g., Booking, Payment, Cancellation"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Sort Order
            </label>
            <Input
              type="number"
              value={formData.sortOrder}
              onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
              placeholder="Sort order (lower numbers appear first)"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Active
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit">
              {editingFAQ ? 'Update' : 'Create'} FAQ
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

