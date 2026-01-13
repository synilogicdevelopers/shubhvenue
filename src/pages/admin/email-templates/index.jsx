import { useEffect, useState } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/admin/ui/Table';
import { Card } from '../../../components/admin/ui/Card';
import { Button } from '../../../components/admin/ui/Button';
import { Badge } from '../../../components/admin/ui/Badge';
import { Input } from '../../../components/admin/ui/Input';
import { Modal } from '../../../components/admin/ui/Modal';
import { Pagination } from '../../../components/admin/ui/Pagination';
import { emailTemplatesAPI, emailConfigAPI } from '../../../services/admin/api';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Search, Mail, Eye, Code, Layout, FileCode, Monitor } from 'lucide-react';
import { getImageUrl } from '../../../utils/admin/imageUrl';

export const EmailTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [formData, setFormData] = useState({
    name: '',
    type: 'custom',
    subject: '',
    html: '',
    text: '',
    description: '',
    logoUrl: '',
    variables: [],
    isActive: true,
  });
  const [newVariable, setNewVariable] = useState({ name: '', description: '', example: '' });
  const [htmlViewMode, setHtmlViewMode] = useState('code'); // 'code' or 'preview'
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [testingTemplateId, setTestingTemplateId] = useState(null);
  const [adminEmail, setAdminEmail] = useState('');

  const templateTypes = [
    { value: 'customer_welcome', label: 'Customer Welcome' },
    { value: 'vendor_welcome', label: 'Vendor Welcome' },
    { value: 'vendor_approval', label: 'Vendor Approval' },
    { value: 'vendor_rejection', label: 'Vendor Rejection' },
    { value: 'vendor_registration_admin', label: 'Vendor Registration (Admin)' },
    { value: 'booking_confirmation', label: 'Booking Confirmation' },
    { value: 'booking_cancellation', label: 'Booking Cancellation' },
    { value: 'booking_notification_admin', label: 'Booking Notification (Admin)' },
    { value: 'booking_approval_vendor', label: 'Booking Approval (Vendor)' },
    { value: 'vendor_booking_confirmation', label: 'Vendor Booking Confirmation' },
    { value: 'lead_notification_admin', label: 'Lead Notification (Admin)' },
    { value: 'review_notification_vendor', label: 'Review Notification (Vendor)' },
    { value: 'review_reply_customer', label: 'Review Reply (Customer)' },
    { value: 'verification_request_vendor', label: 'Verification Request (Vendor)' },
    { value: 'verification_request_admin', label: 'Verification Request (Admin)' },
    { value: 'verification_approval_vendor', label: 'Verification Approval (Vendor)' },
    { value: 'monthly_revenue_vendor', label: 'Monthly Revenue (Vendor)' },
    { value: 'monthly_revenue_admin', label: 'Monthly Revenue (Admin)' },
    { value: 'password_reset', label: 'Password Reset' },
    { value: 'test_email', label: 'Test Email' },
    { value: 'custom', label: 'Custom' },
  ];

  useEffect(() => {
    fetchTemplates();
    fetchAdminEmail();
  }, []);

  const fetchAdminEmail = async () => {
    try {
      const response = await emailConfigAPI.get();
      if (response.data?.success && response.data?.config?.adminNotificationEmail) {
        setAdminEmail(response.data.config.adminNotificationEmail);
      }
    } catch (error) {
      console.error('Failed to fetch admin email:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await emailTemplatesAPI.getAll();
      console.log('Email Templates API Response:', response);
      
      let templatesData = [];
      if (response.data) {
        if (response.data.success && response.data.templates && Array.isArray(response.data.templates)) {
          templatesData = response.data.templates;
        } else if (response.data.templates && Array.isArray(response.data.templates)) {
          templatesData = response.data.templates;
        } else if (Array.isArray(response.data)) {
          templatesData = response.data;
        }
      }
      
      setTemplates(templatesData);
    } catch (error) {
      console.error('Error fetching email templates:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to load email templates';
      toast.error(errorMessage);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (template = null) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name || '',
        type: template.type || 'custom',
        subject: template.subject || '',
        html: template.html || '',
        text: template.text || '',
        description: template.description || '',
        logoUrl: template.logoUrl || '',
        variables: template.variables || [],
        isActive: template.isActive !== undefined ? template.isActive : true,
      });
      setLogoFile(null);
      // Set preview if logoUrl exists
      if (template.logoUrl) {
        setLogoPreview(getImageUrl(template.logoUrl));
      } else {
        setLogoPreview(null);
      }
      setHtmlViewMode('code'); // Reset to code view when editing
    } else {
      setEditingTemplate(null);
      setFormData({
        name: '',
        type: 'custom',
        subject: '',
        html: '',
        text: '',
        description: '',
        logoUrl: '',
        variables: [],
        isActive: true,
      });
      setLogoFile(null);
      setLogoPreview(null);
      setHtmlViewMode('code'); // Reset to code view for new template
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTemplate(null);
    setFormData({
      name: '',
      type: 'custom',
      subject: '',
      html: '',
      text: '',
      description: '',
      logoUrl: '',
      variables: [],
      isActive: true,
    });
    setNewVariable({ name: '', description: '', example: '' });
    setLogoFile(null);
    setLogoPreview(null);
    setHtmlViewMode('code');
  };

  const handleAddVariable = () => {
    if (!newVariable.name.trim()) {
      toast.error('Variable name is required');
      return;
    }
    setFormData({
      ...formData,
      variables: [...formData.variables, { ...newVariable }]
    });
    setNewVariable({ name: '', description: '', example: '' });
  };

  const handleRemoveVariable = (index) => {
    setFormData({
      ...formData,
      variables: formData.variables.filter((_, i) => i !== index)
    });
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      // Validate file size (2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Logo file size should be less than 2MB');
        return;
      }
      setLogoFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
      // Clear URL input if file is selected
      setFormData({ ...formData, logoUrl: '' });
    }
  };

  const handlePreview = (template) => {
    setPreviewTemplate(template);
    setIsPreviewModalOpen(true);
  };

  const handleClosePreview = () => {
    setIsPreviewModalOpen(false);
    setPreviewTemplate(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Template name is required');
      return;
    }
    
    if (!formData.type) {
      toast.error('Template type is required');
      return;
    }
    
    if (!formData.html.trim()) {
      toast.error('Email HTML content is required');
      return;
    }

    try {
      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('name', formData.name.trim());
      submitData.append('type', formData.type);
      submitData.append('subject', formData.subject || '');
      submitData.append('html', formData.html);
      submitData.append('text', formData.text || '');
      submitData.append('description', formData.description || '');
      submitData.append('variables', JSON.stringify(formData.variables || []));
      submitData.append('isActive', formData.isActive ? 'true' : 'false');
      
      // Add logo file if selected
      if (logoFile) {
        submitData.append('logo', logoFile);
      } else {
        // Send logoUrl if provided (or empty string to remove logo when editing)
        // When editing, always send logoUrl so controller knows whether to update or preserve
        const logoUrlToSend = formData.logoUrl !== undefined ? formData.logoUrl : (editingTemplate?.logoUrl || '');
        submitData.append('logoUrl', logoUrlToSend);
      }

      if (editingTemplate) {
        await emailTemplatesAPI.update(editingTemplate._id, submitData);
        toast.success('Email template updated successfully');
      } else {
        await emailTemplatesAPI.create(submitData);
        toast.success('Email template created successfully');
      }
      handleCloseModal();
      fetchTemplates();
    } catch (error) {
      console.error('Error saving email template:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to save email template';
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (id, skipConfirm = false, templateMeta = {}) => {
    if (!skipConfirm) {
      setConfirmAction({ id, name: templateMeta.name });
      return;
    }

    setActionLoading(true);
    try {
      await emailTemplatesAPI.delete(id);
      toast.success('Email template deleted successfully');
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting email template:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to delete email template';
      toast.error(errorMessage);
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  };

  const handleToggleActive = async (id) => {
    try {
      await emailTemplatesAPI.toggleActive(id);
      toast.success('Template status updated successfully');
      fetchTemplates();
    } catch (error) {
      console.error('Error toggling template status:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to update template status';
      toast.error(errorMessage);
    }
  };

  const handleTestTemplate = async (template) => {
    if (!adminEmail) {
      toast.error('Admin notification email is not configured. Please set it in Settings > Email Configuration.');
      return;
    }

    if (!template.isActive) {
      toast.error('Template is inactive. Please activate it first before testing.');
      return;
    }

    try {
      setTestingTemplateId(template._id);
      const response = await emailTemplatesAPI.test(template._id, template.type, adminEmail);
      
      if (response.data?.success) {
        toast.success(`Test email sent successfully to ${adminEmail}`);
      } else {
        toast.error(response.data?.message || 'Failed to send test email');
      }
    } catch (error) {
      console.error('Error testing template:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to send test email';
      toast.error(errorMessage);
    } finally {
      setTestingTemplateId(null);
    }
  };

  const filteredTemplates = templates.filter((template) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      template.name?.toLowerCase().includes(searchLower) ||
      template.type?.toLowerCase().includes(searchLower)
    );
  });

  const totalPages = Math.ceil(filteredTemplates.length / itemsPerPage);
  const paginatedTemplates = filteredTemplates.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getTypeLabel = (type) => {
    const typeObj = templateTypes.find(t => t.value === type);
    return typeObj ? typeObj.label : type;
  };

  return (
    <div className="space-y-6 w-full max-w-none mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Email Templates</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage email templates for automated emails</p>
        </div>
        <Button 
          onClick={() => handleOpenModal()} 
          className="flex items-center gap-2 w-full md:w-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          Add Template
        </Button>
      </div>

      {/* Main Card */}
      <Card className="w-full max-w-none overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search templates by name or type..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 w-full"
              />
            </div>
            {filteredTemplates.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">{filteredTemplates.length}</span>
                <span>template{filteredTemplates.length !== 1 ? 's' : ''} found</span>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="w-full overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading templates...</p>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="p-12 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-800">
                  <Mail className="h-12 w-12 text-gray-400" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No templates found</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                {searchTerm ? 'Try adjusting your search criteria' : 'Get started by creating a new email template'}
              </p>
              {!searchTerm && (
                <Button onClick={() => handleOpenModal()} className="flex items-center gap-2 mx-auto">
                  <Plus className="w-4 h-4" />
                  Add Template
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table className="min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[250px]">Template Name</TableHead>
                      <TableHead className="min-w-[150px]">Type</TableHead>
                      <TableHead className="min-w-[100px] text-center">Status</TableHead>
                      <TableHead className="min-w-[200px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTemplates.map((template) => (
                      <TableRow key={template._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                          <div className="flex flex-col">
                            <span className="font-semibold">{template.name}</span>
                            {template.html && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate max-w-md" title={template.html.substring(0, 200)}>
                                {template.html.replace(/<[^>]*>/g, '').substring(0, 80)}...
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="whitespace-nowrap">
                            {getTypeLabel(template.type)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={template.isActive ? 'success' : 'secondary'} className="whitespace-nowrap">
                            {template.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1 flex-wrap">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleTestTemplate(template)}
                              title="Test Email"
                              disabled={testingTemplateId === template._id || !template.isActive}
                              loading={testingTemplateId === template._id}
                              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            >
                              <Mail className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePreview(template)}
                              title="Preview"
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenModal(template)}
                              title="Edit"
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleActive(template._id)}
                              title={template.isActive ? 'Deactivate' : 'Activate'}
                              className="h-8 px-2 text-xs"
                            >
                              {template.isActive ? 'Off' : 'On'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(template._id, false, template)}
                              title="Delete"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
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
              {totalPages > 1 && (
                <div className="p-4 md:p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={filteredTemplates.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingTemplate ? 'Edit Email Template' : 'Create Email Template'}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Template Name <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Customer Welcome Email"
                required
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Template Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              >
                {templateTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Email Subject
            </label>
            <Input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="e.g., Welcome to ShubhVenue!"
              className="w-full"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Email subject line. You can use variables like {`{{user.name}}`} or {`{{booking.id}}`}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of this email template..."
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent resize-y"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Optional description to help identify this template
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Logo (optional)
            </label>
            <div className="space-y-4">
              {/* File Upload */}
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="block w-full text-sm text-gray-500 dark:text-gray-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-semibold
                    file:bg-gradient-to-r file:from-primary file:to-accent file:text-white
                    hover:file:from-primary-dark hover:file:to-accent-dark
                    cursor-pointer transition-colors
                    border border-gray-300 dark:border-gray-600 rounded-lg p-2
                    bg-white dark:bg-gray-800"
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Upload logo image (JPG, PNG, GIF, WEBP - Max 2MB) or enter URL below
                </p>
              </div>
              
              {/* Logo Preview */}
              {logoPreview && (
                <div className="relative">
                  <div className="relative w-full max-w-xs mx-auto border-2 border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800 p-4">
                    <img 
                      src={logoPreview} 
                      alt="Logo Preview" 
                      className="w-full h-auto max-h-32 object-contain mx-auto"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    {logoFile && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                        New
                      </div>
                    )}
                  </div>
                  {logoFile && (
                    <p className="mt-2 text-xs text-center text-gray-500 dark:text-gray-400">
                      New logo will replace the current one
                    </p>
                  )}
                </div>
              )}
              
              {/* URL Input (fallback) */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">Or</span>
                </div>
              </div>
              
              <div>
                <Input
                  type="url"
                  value={formData.logoUrl}
                  onChange={(e) => {
                    const url = e.target.value;
                    setFormData({ ...formData, logoUrl: url });
                    // Clear file if URL is entered
                    if (url) {
                      setLogoFile(null);
                      // Set preview if valid URL
                      if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/uploads/')) {
                        setLogoPreview(getImageUrl(url));
                      } else {
                        setLogoPreview(null);
                      }
                    } else {
                      setLogoPreview(null);
                    }
                  }}
                  placeholder="https://example.com/image/logo.png or use {{frontendUrl}} variable"
                  className="w-full"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Enter full URL or use {`{{`}frontendUrl{`}}`} variable. Leave empty to hide logo.
                </p>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                HTML Email Content <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setHtmlViewMode('code')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    htmlViewMode === 'code'
                      ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <FileCode className="w-4 h-4" />
                  Code
                </button>
                <button
                  type="button"
                  onClick={() => setHtmlViewMode('preview')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    htmlViewMode === 'preview'
                      ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <Monitor className="w-4 h-4" />
                  Preview
                </button>
              </div>
            </div>
            
            {htmlViewMode === 'code' ? (
              <div className="space-y-2">
                <div className="relative border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-gray-900">
                  <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
                    <div className="flex items-center gap-2">
                      <Code className="w-4 h-4 text-gray-400" />
                      <span className="text-xs font-mono text-gray-400">HTML Editor</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formData.html.length} characters
                    </span>
                  </div>
                  <textarea
                    value={formData.html}
                    onChange={(e) => setFormData({ ...formData, html: e.target.value })}
                    placeholder="<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
  </style>
</head>
<body>
  <h1>Welcome {{user.name}}!</h1>
  <p>Your email: {{user.email}}</p>
</body>
</html>"
                    rows="18"
                    className="w-full px-4 py-3 bg-gray-900 text-gray-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-y min-h-[400px]"
                    required
                    spellCheck="false"
                  />
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{'{{user.name}}'}</span>
                  <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{'{{user.email}}'}</span>
                  <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{'{{user.phone}}'}</span>
                  <span className="ml-2">- Use these variables for dynamic content</span>
                </div>
              </div>
            ) : (
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
                <div className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-900 border-b border-gray-300 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Live Preview</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setHtmlViewMode('code')}
                    className="text-xs"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit Code
                  </Button>
                </div>
                <div className="p-6 bg-white dark:bg-gray-800 min-h-[400px] max-h-[600px] overflow-auto">
                  {formData.html ? (
                    <div 
                      className="email-preview"
                      dangerouslySetInnerHTML={{ __html: formData.html }}
                      style={{
                        fontFamily: 'Arial, sans-serif',
                        lineHeight: '1.6',
                        color: '#333'
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
                      <div className="text-center">
                        <Code className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">No HTML content to preview</p>
                        <p className="text-xs mt-1">Switch to Code view to add HTML content</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Variables Section */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
            <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
              Template Variables
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Define variables that can be used in this template (e.g., {`{{user.name}}`}, {`{{booking.id}}`})
            </p>
            
            {/* Existing Variables */}
            {formData.variables && formData.variables.length > 0 && (
              <div className="space-y-2 mb-4">
                {formData.variables.map((variable, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                    <div className="flex-1">
                      <span className="font-mono text-sm font-semibold text-primary">{`{{${variable.name}}}`}</span>
                      {variable.description && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">{variable.description}</span>
                      )}
                      {variable.example && (
                        <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">(e.g., {variable.example})</span>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveVariable(index)}
                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Add New Variable */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Input
                type="text"
                value={newVariable.name}
                onChange={(e) => setNewVariable({ ...newVariable, name: e.target.value })}
                placeholder="Variable name (e.g., user.name)"
                className="w-full"
              />
              <Input
                type="text"
                value={newVariable.description}
                onChange={(e) => setNewVariable({ ...newVariable, description: e.target.value })}
                placeholder="Description (optional)"
                className="w-full"
              />
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={newVariable.example}
                  onChange={(e) => setNewVariable({ ...newVariable, example: e.target.value })}
                  placeholder="Example (optional)"
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={handleAddVariable}
                  variant="outline"
                  size="sm"
                  className="whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Plain Text Version */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Plain Text Version (Optional)
            </label>
            <textarea
              value={formData.text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              placeholder="Plain text version of the email (auto-generated from HTML if not provided)"
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent resize-y font-mono text-sm"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Plain text version for email clients that don't support HTML. Auto-generated from HTML if left empty.
            </p>
          </div>

          <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 mt-0.5 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer flex-1">
              <span className="block font-semibold">Active Template</span>
              <span className="text-xs text-gray-600 dark:text-gray-400 mt-1 block">
                This template will be used for sending emails when this type is triggered
              </span>
            </label>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={handleCloseModal}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="w-full sm:w-auto"
            >
              {editingTemplate ? 'Update Template' : 'Create Template'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={isPreviewModalOpen}
        onClose={handleClosePreview}
        title={
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            <span>Preview: {previewTemplate?.name || 'Email Template'}</span>
          </div>
        }
        size="xl"
      >
        {previewTemplate && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">HTML Email Preview</label>
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
                <div className="p-6 bg-white dark:bg-gray-800 min-h-[400px] max-h-[600px] overflow-auto">
                  {previewTemplate.html ? (
                    <div 
                      className="email-preview"
                      dangerouslySetInnerHTML={{ __html: previewTemplate.html }}
                      style={{
                        fontFamily: 'Arial, sans-serif',
                        lineHeight: '1.6',
                        color: '#333'
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
                      <div className="text-center">
                        <Code className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">No HTML content to preview</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-semibold">Note:</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                This is how the email will look when sent. The HTML code you entered will be sent exactly as-is.
              </p>
            </div>
            <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button onClick={handleClosePreview}>
                Close Preview
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      {confirmAction && (
        <Modal
          isOpen={!!confirmAction}
          onClose={() => setConfirmAction(null)}
          title="Delete Email Template"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Are you sure you want to delete the template <strong>{confirmAction.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="ghost"
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
                {actionLoading ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

