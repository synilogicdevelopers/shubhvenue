import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent } from '../../../components/admin/ui/Card';
import { Button } from '../../../components/admin/ui/Button';
import { Badge } from '../../../components/admin/ui/Badge';
import { Modal } from '../../../components/admin/ui/Modal';
import { Pagination } from '../../../components/admin/ui/Pagination';
import { venuesAPI, vendorsAPI, categoriesAPI, menusAPI, vendorCategoriesAPI } from '../../../services/admin/api';
import { getImageUrl } from '../../../utils/admin/imageUrl';
import { hasPermission } from '../../../utils/admin/permissions';
import toast from 'react-hot-toast';
import { Check, X, MapPin, Users, DollarSign, Calendar, MessageSquare, User, Plus, Play, Video, Edit, Eye } from 'lucide-react';

export const Venues = () => {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [editingVenue, setEditingVenue] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Form data
  const [formData, setFormData] = useState({
    vendorId: '',
    name: '',
    address: '',
    city: '',
    state: '',
    price: '',
    capacity: '',
    description: '',
    categoryId: '',
    menuId: '',
    subMenuId: '',
    amenities: [],
    highlights: [],
    rooms: '',
    openTime: '',
    closeTime: '',
    openDays: [],
  });
  
  // Media
  const [selectedImage, setSelectedImage] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]); // New images (File objects)
  const [existingGalleryUrls, setExistingGalleryUrls] = useState([]); // Existing images (URLs from API)
  const [videoFiles, setVideoFiles] = useState([]);
  const [videoUrls, setVideoUrls] = useState([]);
  const [playingVideo, setPlayingVideo] = useState(null); // Track which video is playing (object with url, title)
  const [videoModalOpen, setVideoModalOpen] = useState(false); // Track if video modal is open
  
  // Dropdowns
  const [vendors, setVendors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [vendorCategories, setVendorCategories] = useState([]); // Vendor categories for form config
  const [selectedVendorCategoryId, setSelectedVendorCategoryId] = useState(''); // Selected vendor category for form config
  const [menus, setMenus] = useState([]);
  const [submenus, setSubmenus] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);
  
  const availableAmenities = [
    'Parking', 'AC', 'WiFi', 'Catering', 'Decoration', 'Sound System',
    'Stage', 'Dance Floor', 'Photography', 'Videography', 'Bridal Room',
    'Groom Room', 'Garden', 'Pool', 'Bar'
  ];
  
  const weekDays = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ];

  useEffect(() => {
    fetchVenues();
    loadVendors();
    loadCategories();
    loadVendorCategories();
    loadMenus();
    loadStates();
  }, [statusFilter]);

  // Load cities when state changes
  useEffect(() => {
    if (formData.state && formData.state.trim()) {
      loadCities(formData.state);
    } else {
      setCities([]);
    }
  }, [formData.state]);

  // Load submenus when menuId changes
  useEffect(() => {
    if (formData.menuId) {
      loadSubmenus(formData.menuId);
    } else {
      setSubmenus([]);
      if (formData.subMenuId) {
        setFormData(prev => ({ ...prev, subMenuId: '' }));
      }
    }
  }, [formData.menuId]);

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

  const loadVendors = async () => {
    try {
      const response = await vendorsAPI.getAll();
      setVendors(response.data || []);
    } catch (error) {
      console.error('Failed to load vendors:', error);
      setVendors([]);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      const categoriesData = response.data?.categories || response.data?.data || response.data || [];
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (error) {
      console.error('Failed to load categories:', error);
      setCategories([]);
    }
  };

  const loadVendorCategories = async () => {
    try {
      console.log('🔄 Loading vendor categories...');
      const response = await vendorCategoriesAPI.getPublic();
      console.log('📦 Vendor Categories API Response:', response);
      
      let vendorCategoriesData = [];
      if (response && response.data) {
        if (response.data.categories && Array.isArray(response.data.categories)) {
          vendorCategoriesData = response.data.categories;
        } else if (Array.isArray(response.data)) {
          vendorCategoriesData = response.data;
        } else if (response.data.success && response.data.categories) {
          vendorCategoriesData = response.data.categories;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          vendorCategoriesData = response.data.data;
        }
      }
      
      // Filter only active categories
      const activeCategories = vendorCategoriesData.filter(cat => cat.isActive !== false);
      console.log('✅ Loaded vendor categories:', activeCategories.length);
      setVendorCategories(activeCategories);
    } catch (error) {
      console.error('❌ Failed to load vendor categories:', error);
      toast.error('Failed to load vendor categories');
      setVendorCategories([]);
    }
  };

  const loadMenus = async () => {
    try {
      const response = await menusAPI.getAll({ active: 'all' });
      let menusData = [];
      if (response && response.data) {
        if (response.data.menus && Array.isArray(response.data.menus)) {
          menusData = response.data.menus;
        } else if (Array.isArray(response.data)) {
          menusData = response.data;
        } else if (response.data.success && response.data.menus) {
          menusData = response.data.menus;
        }
      }
      const finalMenus = Array.isArray(menusData) ? menusData.map(menu => ({
        ...menu,
        _id: String(menu._id || menu.id || ''),
        id: String(menu._id || menu.id || '')
      })) : [];
      setMenus(finalMenus);
    } catch (error) {
      console.error('Failed to load menus:', error);
      setMenus([]);
    }
  };

  const loadSubmenus = async (menuId) => {
    if (!menuId) {
      setSubmenus([]);
      return;
    }
    try {
      const response = await menusAPI.getAll({ parentMenuId: menuId, active: 'all' });
      const submenusData = response.data?.menus || response.data || [];
      const normalizedSubmenus = Array.isArray(submenusData) ? submenusData.map(submenu => ({
        ...submenu,
        _id: String(submenu._id || submenu.id || ''),
        id: String(submenu._id || submenu.id || '')
      })) : [];
      setSubmenus(normalizedSubmenus);
    } catch (error) {
      console.error('Failed to load submenus:', error);
      setSubmenus([]);
    }
  };

  const loadStates = async () => {
    try {
      const response = await venuesAPI.getStates();
      if (response.data?.success && response.data?.states) {
        setStates(response.data.states);
      } else if (response.data?.states) {
        setStates(response.data.states);
      } else {
        setStates([]);
      }
    } catch (error) {
      console.error('Failed to load states:', error);
      setStates([]);
    }
  };

  const loadCities = async (stateName) => {
    if (!stateName || !stateName.trim()) {
      setCities([]);
      return;
    }
    try {
      setLoadingCities(true);
      const response = await venuesAPI.getCities(stateName.trim());
      if (response.data?.success && response.data?.cities) {
        setCities(response.data.cities);
        if (formData.city && !response.data.cities.some(c => c.toLowerCase() === formData.city.toLowerCase())) {
          setFormData(prev => ({ ...prev, city: '' }));
        }
      } else if (response.data?.cities) {
        setCities(response.data.cities);
      } else {
        setCities([]);
      }
    } catch (error) {
      console.error('Failed to load cities:', error);
      setCities([]);
    } finally {
      setLoadingCities(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'state') {
      setFormData({
        ...formData,
        [name]: value,
        city: ''
      });
    } else if (name === 'menuId') {
      const normalizedValue = value ? String(value) : '';
      setFormData({
        ...formData,
        [name]: normalizedValue,
        subMenuId: ''
      });
      if (normalizedValue) {
        loadSubmenus(normalizedValue);
      } else {
        setSubmenus([]);
      }
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleAmenityToggle = (amenity) => {
    setFormData({
      ...formData,
      amenities: formData.amenities.includes(amenity)
        ? formData.amenities.filter(a => a !== amenity)
        : [...formData.amenities, amenity],
    });
  };

  const handleDayToggle = (day) => {
    setFormData({
      ...formData,
      openDays: formData.openDays.includes(day)
        ? formData.openDays.filter(d => d !== day)
        : [...formData.openDays, day],
    });
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
    }
  };

  const handleGallerySelect = (e) => {
    const files = Array.from(e.target.files);
    setGalleryImages([...galleryImages, ...files]);
  };

  const handleVideoFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setVideoFiles([...videoFiles, ...files]);
  };

  const handleVideoUrlAdd = () => {
    const urlInput = document.getElementById('videoUrlInput');
    if (urlInput && urlInput.value.trim()) {
      const url = urlInput.value.trim();
      try {
        new URL(url);
        setVideoUrls([...videoUrls, url]);
        urlInput.value = '';
      } catch {
        toast.error('Please enter a valid URL');
      }
    }
  };

  const removeVideoFile = (index) => {
    setVideoFiles(videoFiles.filter((_, i) => i !== index));
  };

  const removeVideoUrl = (index) => {
    setVideoUrls(videoUrls.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setFormData({
      vendorId: '',
      name: '',
      address: '',
      city: '',
      state: '',
      price: '',
      capacity: '',
      description: '',
      categoryId: '',
      menuId: '',
      subMenuId: '',
      amenities: [],
      highlights: [],
      rooms: '',
      openTime: '',
      closeTime: '',
      openDays: [],
    });
    setSelectedImage(null);
    setGalleryImages([]);
    setExistingGalleryUrls([]);
    setVideoFiles([]);
    setVideoUrls([]);
    setCurrentStep(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Validation
      if (!formData.vendorId) {
        toast.error('Please select a vendor');
        setSubmitting(false);
        return;
      }
      if (!formData.name || !formData.name.trim()) {
        toast.error('Venue name is required');
        setSubmitting(false);
        return;
      }
      if (!formData.capacity || formData.capacity <= 0) {
        toast.error('Capacity is required and must be greater than 0');
        setSubmitting(false);
        return;
      }
      if (!formData.state || !formData.state.trim()) {
        toast.error('State is required');
        setSubmitting(false);
        return;
      }
      if (!formData.city || !formData.city.trim()) {
        toast.error('City is required');
        setSubmitting(false);
        return;
      }

      const formDataToSend = new FormData();
      
      // Required fields
      formDataToSend.append('vendorId', formData.vendorId);
      formDataToSend.append('name', formData.name.trim());
      formDataToSend.append('capacity', formData.capacity.toString());
      
      // Location
      const locationObj = {
        address: formData.address || '',
        city: formData.city || '',
        state: formData.state || ''
      };
      formDataToSend.append('location', JSON.stringify(locationObj));
      
      // Optional fields
      formDataToSend.append('price', formData.price || '0');
      formDataToSend.append('description', formData.description || '');
      if (formData.categoryId) {
        formDataToSend.append('categoryId', formData.categoryId);
      }
      formDataToSend.append('menuId', formData.menuId || '');
      formDataToSend.append('subMenuId', formData.subMenuId || '');
      
      // Arrays
      if (formData.amenities && formData.amenities.length > 0) {
        formData.amenities.forEach(amenity => formDataToSend.append('amenities', amenity));
      }
      if (formData.highlights && formData.highlights.length > 0) {
        formData.highlights.filter(h => h.trim()).forEach(highlight => formDataToSend.append('highlights', highlight.trim()));
      }
      
      if (formData.rooms !== undefined && formData.rooms !== '') {
        formDataToSend.append('rooms', formData.rooms.toString());
      }
      
      // Availability
      const availability = {
        status: 'Open',
        openTime: formData.openTime || '',
        closeTime: formData.closeTime || '',
        openDays: formData.openDays || []
      };
      formDataToSend.append('availability', JSON.stringify(availability));
      
      // Images - Main image removed, only gallery images
      if (galleryImages && galleryImages.length > 0) {
        galleryImages.forEach(file => formDataToSend.append('gallery', file));
      }
      
      // Videos
      if (videoFiles && videoFiles.length > 0) {
        videoFiles.forEach(file => formDataToSend.append('videos', file));
      }
      if (videoUrls && videoUrls.length > 0) {
        videoUrls.forEach(url => formDataToSend.append('videos', url));
      }
      
      // Status - admin can set to approved directly
      formDataToSend.append('status', 'approved');
      
      await venuesAPI.create(formDataToSend);
      toast.success('Venue added successfully!');
      setShowAddModal(false);
      resetForm();
      fetchVenues();
    } catch (error) {
      console.error('Save venue error:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to save venue';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
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

  // Get form configuration from selected vendor category
  const formConfig = useMemo(() => {
    // If vendor category is selected in dropdown, use that
    if (selectedVendorCategoryId) {
      const selectedCategory = vendorCategories.find(cat => cat._id === selectedVendorCategoryId || cat.id === selectedVendorCategoryId);
      if (selectedCategory?.formConfig?.venue) {
        return selectedCategory.formConfig.venue;
      }
    }
    
    // If editing venue, try to get formConfig from venue's vendor category
    if (editingVenue && editingVenue.vendorId) {
      const vendor = vendors.find(v => (v._id || v.id) === (editingVenue.vendorId?._id || editingVenue.vendorId));
      if (vendor?.vendorCategory?._id || vendor?.vendorCategoryId) {
        const vendorCategoryId = vendor.vendorCategory?._id || vendor.vendorCategoryId;
        const vendorCategory = vendorCategories.find(cat => (cat._id || cat.id) === vendorCategoryId);
        if (vendorCategory?.formConfig?.venue) {
          return vendorCategory.formConfig.venue;
        }
      }
    }
    
    return null; // No formConfig - show all fields
  }, [selectedVendorCategoryId, vendorCategories, editingVenue, vendors]);

  // Helper function to check if a field is enabled in formConfig
  const isFieldEnabled = (fieldPath) => {
    // If no formConfig, all fields are enabled
    if (formConfig === null) {
      return true;
    }
    
    // Check field path (e.g., 'name', 'location.enabled', 'location.state')
    const parts = fieldPath.split('.');
    let config = formConfig;
    
    for (const part of parts) {
      if (config === null || config === undefined) {
        return true;
      }
      config = config[part];
    }
    
    // Field is enabled if it's not explicitly set to false
    return config !== false;
  };

  const handleViewVenue = async (venueId) => {
    try {
      console.log('🔍 Loading venue details for:', venueId);
      const response = await venuesAPI.getById(venueId);
      console.log('📦 Venue API Response:', response);
      console.log('📦 Response Data:', response.data);
      
      let venueData = null;
      // Try multiple response formats
      if (response.data?.success && response.data?.venue) {
        venueData = response.data.venue;
      } else if (response.data?.success && response.data?.data) {
        venueData = response.data.data;
      } else if (response.data?.venue) {
        venueData = response.data.venue;
      } else if (response.data?.data) {
        venueData = response.data.data;
      } else if (response.data && typeof response.data === 'object' && response.data._id) {
        venueData = response.data;
      } else if (Array.isArray(response.data) && response.data.length > 0) {
        venueData = response.data[0];
      }
      
      console.log('✅ Venue Data to display:', venueData);
      
      if (venueData) {
        setSelectedVenue(venueData);
        setShowViewModal(true);
      } else {
        console.error('❌ No venue data found in response');
        toast.error('Venue data not found');
      }
    } catch (error) {
      console.error('❌ Error loading venue:', error);
      console.error('❌ Error response:', error.response);
      toast.error(error.response?.data?.message || 'Failed to load venue details');
    }
  };

  const handleEditVenue = async (venueId) => {
    try {
      console.log('✏️ Loading venue for editing:', venueId);
      const response = await venuesAPI.getById(venueId);
      console.log('📦 Venue API Response for edit:', response);
      
      let venueData = null;
      if (response.data?.success && response.data?.venue) {
        venueData = response.data.venue;
      } else if (response.data?.success && response.data?.data) {
        venueData = response.data.data;
      } else if (response.data) {
        venueData = response.data;
      }
      
      if (!venueData) {
        toast.error('Venue data not found');
        return;
      }

      console.log('✅ Venue Data for form:', venueData);

      // Populate form with venue data
      const locationObj = typeof venueData.location === 'string' 
        ? (() => {
            try {
              return JSON.parse(venueData.location || '{}');
            } catch {
              return { address: venueData.location || '', city: '', state: '' };
            }
          })()
        : venueData.location || {};
      
      setFormData({
        vendorId: venueData.vendorId?._id || venueData.vendorId || '',
        name: venueData.name || '',
        address: locationObj.address || '',
        city: locationObj.city || '',
        state: locationObj.state || '',
        price: venueData.price || '',
        capacity: typeof venueData.capacity === 'object' 
          ? (venueData.capacity.minGuests || venueData.capacity.maxGuests || '')
          : venueData.capacity || '',
        description: venueData.description || '',
        categoryId: venueData.categoryId?._id || venueData.categoryId || '',
        menuId: venueData.menuId?._id || venueData.menuId || '',
        subMenuId: venueData.subMenuId?._id || venueData.subMenuId || '',
        amenities: Array.isArray(venueData.amenities) ? venueData.amenities : [],
        highlights: Array.isArray(venueData.highlights) ? venueData.highlights : [],
        rooms: venueData.rooms || '',
        openTime: venueData.availability?.openTime || '',
        closeTime: venueData.availability?.closeTime || '',
        openDays: Array.isArray(venueData.availability?.openDays) ? venueData.availability.openDays : [],
      });

      // Set media
      if (venueData.coverImage) {
        setSelectedImage(null);
      }
      
      // Load existing gallery images
      let galleryImagesList = [];
      if (venueData.gallery && Array.isArray(venueData.gallery) && venueData.gallery.length > 0) {
        galleryImagesList = venueData.gallery;
      } else if (venueData.galleryInfo?.photos && Array.isArray(venueData.galleryInfo.photos) && venueData.galleryInfo.photos.length > 0) {
        galleryImagesList = venueData.galleryInfo.photos;
      } else if (venueData.images && Array.isArray(venueData.images) && venueData.images.length > 0) {
        galleryImagesList = venueData.images;
      }
      
      if (galleryImagesList.length > 0) {
        // Extract URLs from gallery images (can be strings or objects)
        const existingUrls = galleryImagesList.map(img => {
          if (typeof img === 'string') {
            return img;
          } else if (img && typeof img === 'object') {
            return img.url || img.path || img;
          }
          return null;
        }).filter(url => url !== null);
        setExistingGalleryUrls(existingUrls);
        console.log('✅ Loaded existing gallery images:', existingUrls.length);
      } else {
        setExistingGalleryUrls([]);
      }
      
      // New gallery images (for upload) - start empty
      setGalleryImages([]);
      
      // Load existing videos - check multiple sources
      let existingVideosList = [];
      if (venueData.videos && Array.isArray(venueData.videos) && venueData.videos.length > 0) {
        existingVideosList = venueData.videos;
      } else if (venueData.galleryInfo?.videos && Array.isArray(venueData.galleryInfo.videos) && venueData.galleryInfo.videos.length > 0) {
        existingVideosList = venueData.galleryInfo.videos;
      } else if (venueData.gallery?.videos && Array.isArray(venueData.gallery.videos) && venueData.gallery.videos.length > 0) {
        existingVideosList = venueData.gallery.videos;
      }
      
      if (existingVideosList.length > 0) {
        // Filter valid video URLs/paths
        const validVideos = existingVideosList.filter(v => {
          if (!v || typeof v !== 'string') return false;
          return v.startsWith('http') || v.startsWith('https') || v.startsWith('/uploads');
        });
        setVideoUrls(validVideos);
        setVideoFiles([]); // Existing videos are URLs, not files
        console.log('✅ Loaded existing videos:', validVideos.length);
      } else {
        setVideoUrls([]);
        setVideoFiles([]);
      }

      // Load cities if state is set
      if (locationObj.state) {
        loadCities(locationObj.state);
      }

      // Load submenus if menuId is set
      if (venueData.menuId?._id || venueData.menuId) {
        loadSubmenus(venueData.menuId?._id || venueData.menuId);
      }

      // Set vendor category for formConfig
      // First, try to get from venue's vendorCategoryId (saved when venue was created/edited)
      if (venueData.vendorCategoryId) {
        const savedCategoryId = typeof venueData.vendorCategoryId === 'object' 
          ? (venueData.vendorCategoryId._id?.toString() || venueData.vendorCategoryId.toString())
          : venueData.vendorCategoryId.toString();
        
        // Verify the saved category exists in available categories
        const categoryExists = vendorCategories.some(cat => {
          const catId = cat._id?.toString() || cat.id?.toString();
          return catId === savedCategoryId;
        });
        
        if (categoryExists) {
          setSelectedVendorCategoryId(savedCategoryId);
          console.log('✅ Set vendor category from venue.vendorCategoryId:', savedCategoryId);
        } else {
          console.warn('⚠️ Saved vendor category not found in available categories, trying vendor default');
          // Fallback to vendor's category
          if (venueData.vendorId?._id || venueData.vendorId) {
            const vendorId = venueData.vendorId._id || venueData.vendorId;
            const vendor = vendors.find(v => (v._id || v.id) === vendorId);
            if (vendor?.vendorCategory?._id || vendor?.vendorCategoryId) {
              const vendorCategoryId = vendor.vendorCategory?._id || vendor.vendorCategoryId;
              setSelectedVendorCategoryId(String(vendorCategoryId));
              console.log('✅ Set vendor category from vendor default:', vendorCategoryId);
            }
          }
        }
      } else {
        // No vendorCategoryId stored, try to get from venue's vendor
        if (venueData.vendorId?._id || venueData.vendorId) {
          const vendorId = venueData.vendorId._id || venueData.vendorId;
          const vendor = vendors.find(v => (v._id || v.id) === vendorId);
          if (vendor?.vendorCategory?._id || vendor?.vendorCategoryId) {
            const vendorCategoryId = vendor.vendorCategory?._id || vendor.vendorCategoryId;
            setSelectedVendorCategoryId(String(vendorCategoryId));
            console.log('✅ Set vendor category from vendor default (no saved category):', vendorCategoryId);
          }
        }
      }

      setEditingVenue(venueData);
      setShowEditModal(true);
      setCurrentStep(0);
    } catch (error) {
      console.error('❌ Error loading venue for editing:', error);
      toast.error('Failed to load venue for editing');
    }
  };

  const handleUpdateVenue = async (e) => {
    e.preventDefault();
    if (!editingVenue) return;

    setSubmitting(true);
    try {
      const formDataToSend = new FormData();
      
      // Required fields
      if (formData.vendorId) formDataToSend.append('vendorId', formData.vendorId);
      if (formData.name) formDataToSend.append('name', formData.name.trim());
      if (formData.capacity) {
        formDataToSend.append('capacity', formData.capacity.toString());
      }
      
      // Vendor Category ID - save which vendor category was used for formConfig
      // This will be used when editing to show the same category
      // Always send vendorCategoryId (even if empty) so backend knows to update it
      if (selectedVendorCategoryId && selectedVendorCategoryId.trim() !== '') {
        formDataToSend.append('vendorCategoryId', selectedVendorCategoryId);
        console.log('💾 Frontend: Sending vendorCategoryId to backend:', selectedVendorCategoryId);
      } else {
        // If no category selected, send empty string to clear it
        formDataToSend.append('vendorCategoryId', '');
        console.log('💾 Frontend: Sending empty vendorCategoryId to clear it');
      }
      
      // Debug: Log all FormData entries
      console.log('📦 FormData entries being sent:');
      for (const [key, value] of formDataToSend.entries()) {
        console.log(`  ${key}:`, value);
      }
      
      // Location
      const locationObj = {
        address: formData.address || '',
        city: formData.city || '',
        state: formData.state || ''
      };
      formDataToSend.append('location', JSON.stringify(locationObj));
      
      // Optional fields
      if (formData.price) formDataToSend.append('price', formData.price);
      if (formData.description) formDataToSend.append('description', formData.description);
      if (formData.categoryId) formDataToSend.append('categoryId', formData.categoryId);
      if (formData.menuId) formDataToSend.append('menuId', formData.menuId);
      if (formData.subMenuId) formDataToSend.append('subMenuId', formData.subMenuId);
      
      // Arrays
      if (formData.amenities && formData.amenities.length > 0) {
        formData.amenities.forEach(amenity => formDataToSend.append('amenities', amenity));
      }
      if (formData.highlights && formData.highlights.length > 0) {
        formData.highlights.filter(h => h.trim()).forEach(highlight => formDataToSend.append('highlights', highlight.trim()));
      }
      
      // Availability
      if (formData.openTime || formData.closeTime || formData.openDays.length > 0) {
        const availability = {
          openTime: formData.openTime || '',
          closeTime: formData.closeTime || '',
          openDays: formData.openDays || []
        };
        formDataToSend.append('availability', JSON.stringify(availability));
      }
      
      // Media
      if (selectedImage) {
        formDataToSend.append('coverImage', selectedImage);
      }
      
      // Gallery Images - send existing URLs and new files
      // Backend will merge existing gallery with new uploads
      if (editingVenue && existingGalleryUrls.length > 0) {
        const existingGalleryJson = JSON.stringify(existingGalleryUrls || []);
        formDataToSend.append('existingGallery', existingGalleryJson);
        console.log('📤 Sending existing gallery URLs:', existingGalleryUrls.length);
      }
      
      // Send new gallery file uploads
      if (galleryImages.length > 0) {
        galleryImages.forEach(file => formDataToSend.append('gallery', file));
        console.log('📤 Sending new gallery files:', galleryImages.length);
      }
      // Videos - send existing URLs and new files
      // When editing: send existing video URLs (minus removed ones) via body
      if (editingVenue) {
        const totalVideos = videoUrls.length + (videoFiles?.length || 0);
        
        if (totalVideos === 0) {
          // If all videos are removed, send a special marker to clear all videos
          formDataToSend.append('clearVideos', 'true');
        } else {
          // Send existing video URLs
          if (videoUrls.length > 0) {
            videoUrls.forEach(url => {
              formDataToSend.append('videos', url);
            });
          }
          // Send new video file uploads
          if (videoFiles && videoFiles.length > 0) {
            videoFiles.forEach(file => formDataToSend.append('videos', file));
          }
        }
        console.log('📤 Sending videos:', { existingUrls: videoUrls.length, newFiles: videoFiles.length });
      } else {
        // For new venues, just send all videos
        if (videoFiles.length > 0) {
          videoFiles.forEach(file => formDataToSend.append('videos', file));
        }
        if (videoUrls.length > 0) {
          videoUrls.forEach(url => formDataToSend.append('videos', url));
        }
      }

      await venuesAPI.update(editingVenue._id, formDataToSend);
      toast.success('Venue updated successfully');
      setShowEditModal(false);
      setEditingVenue(null);
      resetForm();
      fetchVenues();
    } catch (error) {
      console.error('❌ Error updating venue:', error);
      toast.error(error.response?.data?.message || 'Failed to update venue');
    } finally {
      setSubmitting(false);
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

  // Pagination logic
  const totalItems = filteredVenues.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedVenues = filteredVenues.slice(startIndex, endIndex);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

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
        <div className="flex gap-2">
          {hasPermission('create_venues') && (
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Venue
            </Button>
          )}
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
      </div>

      {/* Total Count */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Total Venues: <span className="font-medium text-gray-900 dark:text-gray-100">{totalItems}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedVenues.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            No venues found
          </div>
        ) : (
          paginatedVenues.map((venue, idx) => (
            <Card key={venue._id} className="overflow-hidden relative">
              <span className="absolute top-3 left-3 z-10 px-2 py-1 rounded-md text-xs font-semibold bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-200">
                {startIndex + idx + 1}
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

                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    {hasPermission('edit_venues') && (
                      <Button size="sm" variant="outline" onClick={() => handleViewVenue(venue._id)} className="flex-1">
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </Button>
                    )}
                    {hasPermission('edit_venues') && (
                      <Button size="sm" variant="outline" onClick={() => handleEditVenue(venue._id)} className="flex-1">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {hasPermission('edit_venues') && venue.status !== 'approved' && (
                      <Button size="sm" onClick={() => handleApprove(venue._id)} className="flex-1">
                        Approve
                      </Button>
                    )}
                    {hasPermission('edit_venues') && venue.status !== 'rejected' && (
                      <Button size="sm" variant="danger" onClick={() => handleReject(venue._id)} className="flex-1">
                        Reject
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
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

      {/* Add Venue Modal - 4 Steps */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          if (!submitting) {
            setShowAddModal(false);
            resetForm();
          }
        }}
        title={`Add New Venue (${currentStep + 1}/4)`}
        size="lg"
      >
        <div className="space-y-4">
          {/* Step Indicator */}
          <div className="flex space-x-2">
            {[0, 1, 2, 3].map((step) => (
              <div
                key={step}
                className={`flex-1 h-2 rounded ${
                  step <= currentStep ? 'bg-primary-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {/* Step 0: Basic Information */}
            {currentStep === 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                
                {/* Vendor Selection - Admin Only */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vendor *</label>
                  <select
                    name="vendorId"
                    value={formData.vendorId}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select Vendor</option>
                    {vendors.map((vendor) => (
                      <option key={vendor._id || vendor.id} value={vendor._id || vendor.id}>
                        {vendor.name || vendor.email} {vendor.email ? `(${vendor.email})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Venue Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                
                {/* Location Fields */}
                <div className="mt-4">
                  <h4 className="text-md font-semibold mb-4">Location *</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Street address, building name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
                      <select
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="">Select State</option>
                        {states.map((state) => (
                          <option key={state} value={state}>
                            {state}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                      <select
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        disabled={!formData.state || loadingCities}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="">
                          {!formData.state 
                            ? 'Select State First' 
                            : loadingCities 
                            ? 'Loading Cities...' 
                            : 'Select City'}
                        </option>
                        {cities.map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Price (₹) *</label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Capacity *</label>
                    <input
                      type="number"
                      name="capacity"
                      value={formData.capacity}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {/* Step 1: Images */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4">Images</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gallery Images</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleGallerySelect}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  {galleryImages.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-2">Selected Images:</p>
                      <div className="grid grid-cols-4 gap-2">
                        {galleryImages.map((img, idx) => (
                          <div key={idx} className="relative">
                            <img
                              src={URL.createObjectURL(img)}
                              alt={`Gallery ${idx + 1}`}
                              className="w-full h-24 object-cover rounded-lg border border-gray-300"
                            />
                            <button
                              type="button"
                              onClick={() => setGalleryImages(galleryImages.filter((_, i) => i !== idx))}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Videos</label>
                  <p className="text-xs text-gray-500 mb-2">Upload video files or add video URLs (max 5 videos, 100MB per file)</p>
                  
                  <div className="mb-3">
                    <label className="block text-xs text-gray-600 mb-1">Upload Video Files:</label>
                    <input
                      type="file"
                      accept="video/*"
                      multiple
                      onChange={handleVideoFileSelect}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    {videoFiles.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-2">Selected Video Files:</p>
                        <div className="space-y-1">
                          {videoFiles.map((file, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                              <span className="text-sm text-gray-700 truncate flex-1">{file.name}</span>
                              <button
                                type="button"
                                onClick={() => removeVideoFile(idx)}
                                className="ml-2 text-red-500 hover:text-red-700"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Or Add Video URL:</label>
                    <div className="flex space-x-2">
                      <input
                        id="videoUrlInput"
                        type="url"
                        placeholder="https://example.com/video.mp4"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleVideoUrlAdd();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleVideoUrlAdd}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm"
                      >
                        Add
                      </button>
                    </div>
                    {videoUrls.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-2">Video URLs:</p>
                        <div className="space-y-1">
                          {videoUrls.map((url, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                              <span className="text-sm text-gray-700 truncate flex-1">{url}</span>
                              <button
                                type="button"
                                onClick={() => removeVideoUrl(idx)}
                                className="ml-2 text-red-500 hover:text-red-700"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Category & Amenities */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4">Category & Amenities</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">No Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id || cat._id} value={cat.id || cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Menu</label>
                  <select
                    name="menuId"
                    value={String(formData.menuId || '')}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">No Menu</option>
                    {menus.map((menu) => {
                      const menuId = String(menu._id || menu.id || '');
                      return (
                        <option key={menuId} value={menuId}>
                          {menu.name}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Submenu</label>
                  <select
                    name="subMenuId"
                    value={String(formData.subMenuId || '')}
                    onChange={handleInputChange}
                    disabled={!formData.menuId}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {!formData.menuId 
                        ? 'Select Menu First' 
                        : submenus.length === 0
                        ? 'No Submenus Available'
                        : 'Select Submenu'}
                    </option>
                    {submenus.map((submenu) => {
                      const submenuId = String(submenu._id || submenu.id || '');
                      return (
                        <option key={submenuId} value={submenuId}>
                          {submenu.name}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
                  <div className="flex flex-wrap gap-2">
                    {availableAmenities.map((amenity) => (
                      <button
                        key={amenity}
                        type="button"
                        onClick={() => handleAmenityToggle(amenity)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                          formData.amenities.includes(amenity)
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {amenity}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Highlights</label>
                  <div className="space-y-2">
                    {(formData.highlights || []).map((highlight, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={highlight}
                          onChange={(e) => {
                            const currentHighlights = formData.highlights || [];
                            const newHighlights = [...currentHighlights];
                            newHighlights[index] = e.target.value;
                            setFormData({ ...formData, highlights: newHighlights });
                          }}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="Enter highlight"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const currentHighlights = formData.highlights || [];
                            const newHighlights = currentHighlights.filter((_, i) => i !== index);
                            setFormData({ ...formData, highlights: newHighlights });
                          }}
                          className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, highlights: [...(formData.highlights || []), ''] })}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                      + Add Highlight
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Number of Rooms</label>
                  <input
                    type="number"
                    name="rooms"
                    value={formData.rooms}
                    onChange={handleInputChange}
                    min="0"
                    placeholder="Enter number of rooms"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                
                {/* Availability Section */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-md font-semibold mb-4">Availability & Timing</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Opening Time</label>
                      <input
                        type="time"
                        name="openTime"
                        value={formData.openTime}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Closing Time</label>
                      <input
                        type="time"
                        name="closeTime"
                        value={formData.closeTime}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Open Days</label>
                    <div className="flex flex-wrap gap-2">
                      {weekDays.map((day) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => handleDayToggle(day)}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                            formData.openDays.includes(day)
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Review & Submit */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4">Review & Submit</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vendor:</span>
                    <span className="font-medium">
                      {vendors.find(v => (v._id || v.id) === formData.vendorId)?.name || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Venue Name:</span>
                    <span className="font-medium">{formData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium">
                      {`${formData.address || ''}${formData.address && formData.city ? ', ' : ''}${formData.city || ''}${(formData.address || formData.city) && formData.state ? ', ' : ''}${formData.state || ''}`.trim() || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price:</span>
                    <span className="font-medium">₹{formData.price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Capacity:</span>
                    <span className="font-medium">{formData.capacity} guests</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium">
                      {formData.categoryId 
                        ? categories.find(c => (c.id || c._id) === formData.categoryId)?.name || 'N/A'
                        : 'No Category'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amenities:</span>
                    <span className="font-medium">{formData.amenities.length} selected</span>
                  </div>
                  {(formData.openTime || formData.closeTime) && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Timing:</span>
                      <span className="font-medium">
                        {formData.openTime || 'N/A'} - {formData.closeTime || 'N/A'}
                      </span>
                    </div>
                  )}
                  {formData.openDays.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Open Days:</span>
                      <span className="font-medium">{formData.openDays.join(', ')}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Status:</span>
                    <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      <Check className="w-3 h-3" />
                      <span>Approved (Admin Created)</span>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  if (currentStep > 0) setCurrentStep(currentStep - 1);
                  else {
                    setShowAddModal(false);
                    resetForm();
                  }
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                disabled={submitting}
              >
                {currentStep === 0 ? 'Cancel' : 'Previous'}
              </button>
              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              )}
            </div>
          </form>
        </div>
      </Modal>

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

      {/* View Venue Details Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedVenue(null);
        }}
        title="Venue Details"
        size="lg"
      >
        {selectedVenue && (
          <div className="space-y-4 max-h-[80vh] overflow-y-auto">
            {/* Venue Image */}
            {selectedVenue.images?.[0] && (
              <div className="mb-4">
                <img 
                  src={getImageUrl(selectedVenue.images[0])} 
                  alt={selectedVenue.name}
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
            )}
            
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Venue Name</label>
                <p className="text-gray-900 dark:text-gray-100 font-medium">{selectedVenue.name || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <Badge variant={selectedVenue.status === 'approved' ? 'success' : selectedVenue.status === 'pending' ? 'warning' : 'danger'}>
                  {selectedVenue.status || 'N/A'}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Vendor</label>
                <p className="text-gray-900 dark:text-gray-100">
                  {selectedVenue.vendorId?.name || selectedVenue.vendor?.name || selectedVenue.vendorId?.email || 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Price</label>
                <p className="text-gray-900 dark:text-gray-100">
                  ₹{selectedVenue.price?.toLocaleString() || selectedVenue.pricingInfo?.rentalPrice?.toLocaleString() || '0'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Capacity</label>
                <p className="text-gray-900 dark:text-gray-100">{formatCapacity(selectedVenue.capacity)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Category</label>
                <p className="text-gray-900 dark:text-gray-100">
                  {selectedVenue.categoryId?.name || selectedVenue.category?.name || 'N/A'}
                </p>
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="text-sm font-medium text-gray-500">Location</label>
              <p className="text-gray-900 dark:text-gray-100">{formatLocation(selectedVenue.location)}</p>
            </div>

            {/* Description */}
            {selectedVenue.description && (
              <div>
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p className="text-gray-900 dark:text-gray-100">{selectedVenue.description}</p>
              </div>
            )}

            {/* Amenities */}
            {selectedVenue.amenities && Array.isArray(selectedVenue.amenities) && selectedVenue.amenities.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-500">Amenities</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedVenue.amenities.map((amenity, idx) => (
                    <Badge key={idx} variant="default">{amenity}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Highlights */}
            {selectedVenue.highlights && Array.isArray(selectedVenue.highlights) && selectedVenue.highlights.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-500">Highlights</label>
                <ul className="list-disc list-inside mt-1 text-gray-900 dark:text-gray-100">
                  {selectedVenue.highlights.map((highlight, idx) => (
                    <li key={idx}>{highlight}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Availability */}
            {selectedVenue.availability && (
              <div>
                <label className="text-sm font-medium text-gray-500">Availability</label>
                <div className="mt-1 space-y-1 text-gray-900 dark:text-gray-100">
                  {selectedVenue.availability.openTime && (
                    <p>Opening Time: {selectedVenue.availability.openTime}</p>
                  )}
                  {selectedVenue.availability.closeTime && (
                    <p>Closing Time: {selectedVenue.availability.closeTime}</p>
                  )}
                  {selectedVenue.availability.openDays && Array.isArray(selectedVenue.availability.openDays) && selectedVenue.availability.openDays.length > 0 && (
                    <p>Open Days: {selectedVenue.availability.openDays.join(', ')}</p>
                  )}
                </div>
              </div>
            )}

            {/* Gallery */}
            {selectedVenue.gallery && Array.isArray(selectedVenue.gallery) && selectedVenue.gallery.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-500">Gallery Images</label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {selectedVenue.gallery.slice(0, 8).map((img, idx) => (
                    <img 
                      key={idx}
                      src={getImageUrl(img)} 
                      alt={`Gallery ${idx + 1}`}
                      className="w-full h-20 object-cover rounded"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Videos */}
            {selectedVenue.videos && Array.isArray(selectedVenue.videos) && selectedVenue.videos.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-500">Videos</label>
                <div className="space-y-2 mt-2">
                  {selectedVenue.videos.map((video, idx) => (
                    <div key={idx} className="text-sm text-blue-600 dark:text-blue-400">
                      <a href={video} target="_blank" rel="noopener noreferrer">{video}</a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SEO Fields */}
            {(selectedVenue.metaTitle || selectedVenue.metaDescription) && (
              <div>
                <label className="text-sm font-medium text-gray-500">SEO Information</label>
                <div className="mt-1 space-y-1">
                  {selectedVenue.metaTitle && (
                    <div>
                      <span className="text-xs text-gray-500">Meta Title:</span>
                      <p className="text-gray-900 dark:text-gray-100">{selectedVenue.metaTitle}</p>
                    </div>
                  )}
                  {selectedVenue.metaDescription && (
                    <div>
                      <span className="text-xs text-gray-500">Meta Description:</span>
                      <p className="text-gray-900 dark:text-gray-100">{selectedVenue.metaDescription}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* All Data (JSON view for debugging) */}
            <details className="mt-4">
              <summary className="text-sm font-medium text-gray-500 cursor-pointer">View Raw Data (JSON)</summary>
              <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto max-h-60">
                {JSON.stringify(selectedVenue, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </Modal>

      {/* Edit Venue Modal - Reuse Add Venue form structure */}
      {showEditModal && editingVenue && (
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            if (!submitting) {
              setShowEditModal(false);
              setEditingVenue(null);
              resetForm();
            }
          }}
          title="Edit Venue"
          size="lg"
        >
          <form onSubmit={handleUpdateVenue} className="space-y-4 max-h-[80vh] overflow-y-auto">
            {/* Vendor Category Selection for FormConfig */}
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Venue Category (for Form Configuration)
              </label>
              <select
                value={selectedVendorCategoryId}
                onChange={(e) => {
                  setSelectedVendorCategoryId(e.target.value);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Select Vendor Category (Optional)</option>
                {vendorCategories.map((category) => (
                  <option key={category._id || category.id} value={category._id || category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {selectedVendorCategoryId && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  Form fields are now configured based on: <strong>{vendorCategories.find(c => (c._id || c.id) === selectedVendorCategoryId)?.name}</strong>
                </p>
              )}
            </div>

            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
              
              {/* Vendor Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vendor *</label>
                <select
                  name="vendorId"
                  value={formData.vendorId}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select Vendor</option>
                  {vendors.map((vendor) => (
                    <option key={vendor._id || vendor.id} value={vendor._id || vendor.id}>
                      {vendor.name || vendor.email} {vendor.email ? `(${vendor.email})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Venue Name - Always visible */}
              {(formConfig === null || formConfig.name !== false) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Venue Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              )}
              
              {/* Location Fields - Show if enabled in formConfig */}
              {(formConfig === null || formConfig.location?.enabled !== false) && (
                <div className="mt-4">
                  <h4 className="text-md font-semibold mb-4">Location *</h4>
                  {(formConfig === null || formConfig.location?.address !== false) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Street address, building name"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    {(formConfig === null || formConfig.location?.state !== false) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
                        <select
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          required={isFieldEnabled('location.state')}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Select State</option>
                          {states.map((state) => (
                            <option key={state} value={state}>
                              {state}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    {(formConfig === null || formConfig.location?.city !== false) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                        <select
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          disabled={!formData.state || loadingCities}
                          required={isFieldEnabled('location.city')}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                          <option value="">
                            {!formData.state 
                              ? 'Select State First' 
                              : loadingCities 
                              ? 'Loading Cities...' 
                              : 'Select City'}
                          </option>
                          {cities.map((city) => (
                            <option key={city} value={city}>
                              {city}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                {(formConfig === null || formConfig.price !== false) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Price (₹)</label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                )}
                {(formConfig === null || formConfig.numberOfGuests !== false) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Capacity</label>
                    <input
                      type="number"
                      name="capacity"
                      value={formData.capacity}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>
              
              {(formConfig === null || formConfig.description !== false) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>

            {/* Category & Menu */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold mb-4">Category & Menu</h3>
              {(formConfig === null || formConfig.category !== false) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">No Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id || cat._id} value={cat.id || cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Menu</label>
                <select
                  name="menuId"
                  value={String(formData.menuId || '')}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">No Menu</option>
                  {menus.map((menu) => {
                    const menuId = String(menu._id || menu.id || '');
                    return (
                      <option key={menuId} value={menuId}>
                        {menu.name}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Submenu</label>
                <select
                  name="subMenuId"
                  value={String(formData.subMenuId || '')}
                  onChange={handleInputChange}
                  disabled={!formData.menuId}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {!formData.menuId 
                      ? 'Select Menu First' 
                      : submenus.length === 0
                      ? 'No Submenus Available'
                      : 'Select Submenu'}
                  </option>
                  {submenus.map((submenu) => {
                    const submenuId = String(submenu._id || submenu.id || '');
                    return (
                      <option key={submenuId} value={submenuId}>
                        {submenu.name}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Amenities - Show if enabled in formConfig */}
            {(formConfig === null || formConfig.amenities !== false) && (
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-semibold mb-4">Amenities</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Amenities</label>
                  <div className="flex flex-wrap gap-2">
                    {availableAmenities.map((amenity) => (
                      <button
                        key={amenity}
                        type="button"
                        onClick={() => handleAmenityToggle(amenity)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                          formData.amenities.includes(amenity)
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {amenity}
                      </button>
                    ))}
                  </div>
                </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Highlights</label>
                <div className="space-y-2">
                  {(formData.highlights || []).map((highlight, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={highlight}
                        onChange={(e) => {
                          const currentHighlights = formData.highlights || [];
                          const newHighlights = [...currentHighlights];
                          newHighlights[index] = e.target.value;
                          setFormData({ ...formData, highlights: newHighlights });
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Enter highlight"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const currentHighlights = formData.highlights || [];
                          const newHighlights = currentHighlights.filter((_, i) => i !== index);
                          setFormData({ ...formData, highlights: newHighlights });
                        }}
                        className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, highlights: [...(formData.highlights || []), ''] })}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Add Highlight
                  </button>
                </div>
              </div>
            </div>
            )}

            {/* Availability - Show if enabled in formConfig */}
            {((formConfig === null || formConfig.timing?.enabled !== false) || 
              (formConfig === null || formConfig.openDays?.enabled !== false)) && (
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-semibold mb-4">Availability & Timing</h3>
                {(formConfig === null || formConfig.timing?.enabled !== false) && (
                  <div className="grid grid-cols-2 gap-4">
                    {(formConfig === null || formConfig.timing?.openTime !== false) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Opening Time</label>
                        <input
                          type="time"
                          name="openTime"
                          value={formData.openTime}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                    )}
                    {(formConfig === null || formConfig.timing?.closeTime !== false) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Closing Time</label>
                        <input
                          type="time"
                          name="closeTime"
                          value={formData.closeTime}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                    )}
                  </div>
                )}
                
                {(formConfig === null || formConfig.openDays?.enabled !== false) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Open Days</label>
                    <div className="flex flex-wrap gap-2">
                      {weekDays.map((day) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => handleDayToggle(day)}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                            formData.openDays.includes(day)
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Media - Show if enabled in formConfig */}
            {(formConfig === null || formConfig.galleryImages !== false) && (
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-semibold mb-4">Media</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gallery Images</label>
                  
                  {/* Existing Gallery Images */}
                  {editingVenue && existingGalleryUrls.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-2">Current Gallery Images (click X to remove):</p>
                      <div className="grid grid-cols-4 gap-2">
                        {existingGalleryUrls.map((img, idx) => (
                          <div key={idx} className="relative group">
                            <img
                              src={getImageUrl(img)}
                              alt={`Gallery ${idx + 1}`}
                              className="w-full h-24 object-cover rounded-lg border border-gray-300"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => setExistingGalleryUrls(existingGalleryUrls.filter((_, i) => i !== idx))}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Remove image"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Upload new images to add to gallery</p>
                    </div>
                  )}
                  
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleGallerySelect}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  
                  {/* New Gallery Images */}
                  {galleryImages.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-2">New Images:</p>
                      <div className="grid grid-cols-4 gap-2">
                        {galleryImages.map((img, idx) => (
                          <div key={idx} className="relative">
                            <img
                              src={URL.createObjectURL(img)}
                              alt={`Gallery ${idx + 1}`}
                              className="w-full h-24 object-cover rounded-lg border border-gray-300"
                            />
                            <button
                              type="button"
                              onClick={() => setGalleryImages(galleryImages.filter((_, i) => i !== idx))}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              
                {(formConfig === null || formConfig.videos !== false) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Videos</label>
                    
                    {/* Existing Videos Display */}
                    {editingVenue && videoUrls.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-2">Current Videos (click play to watch, X to remove):</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {videoUrls.map((video, idx) => {
                            const videoUrl = getImageUrl(video);
                            
                            return (
                              <div key={idx} className="relative group bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                                {/* Video Preview */}
                                <div className="relative aspect-video bg-gray-900">
                                  {/* Video Thumbnail/Preview */}
                                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                                    <Video className="w-16 h-16 text-gray-400" />
                                  </div>
                                  {/* Play Button Overlay */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      console.log('Opening video modal:', videoUrl);
                                      setPlayingVideo({ url: videoUrl, index: idx, title: `Video ${idx + 1}` });
                                      setVideoModalOpen(true);
                                    }}
                                    className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 hover:bg-opacity-50 transition-opacity group cursor-pointer"
                                    title="Play video"
                                  >
                                    <div className="bg-white bg-opacity-90 rounded-full p-4 group-hover:bg-opacity-100 transition transform group-hover:scale-110">
                                      <Play className="w-8 h-8 text-primary-600 fill-primary-600" />
                                    </div>
                                  </button>
                                  {/* Video URL Display */}
                                  <div className="absolute bottom-2 left-2 right-2">
                                    <p className="text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded truncate">
                                      {video}
                                    </p>
                                  </div>
                                </div>
                                
                                {/* Remove Button */}
                                <button
                                  type="button"
                                  onClick={() => setVideoUrls(videoUrls.filter((_, i) => i !== idx))}
                                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Remove video"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Upload new videos or add video URLs to add to gallery</p>
                      </div>
                    )}
                    
                    <div className="mb-3">
                      <input
                        type="file"
                        accept="video/*"
                        multiple
                        onChange={handleVideoFileSelect}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      {videoFiles.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {videoFiles.map((file, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                              <span className="text-sm text-gray-700 truncate flex-1">{file.name}</span>
                              <button
                                type="button"
                                onClick={() => removeVideoFile(idx)}
                                className="ml-2 text-red-500 hover:text-red-700"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <div className="flex space-x-2">
                        <input
                          id="videoUrlInputEdit"
                          type="url"
                          placeholder="https://example.com/video.mp4"
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleVideoUrlAdd();
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleVideoUrlAdd}
                          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm"
                        >
                          Add
                        </button>
                      </div>
                      {videoUrls.length > 0 && !editingVenue && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500 mb-2">Video URLs (click play to preview):</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {videoUrls.map((url, idx) => {
                              const videoUrl = getImageUrl(url);
                              
                              return (
                                <div key={idx} className="relative group bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                                  <div className="relative aspect-video bg-gray-900">
                                    {/* Video Thumbnail/Preview */}
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                                      <Video className="w-16 h-16 text-gray-400" />
                                    </div>
                                    {/* Play Button Overlay */}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        console.log('Opening video modal:', videoUrl);
                                        setPlayingVideo({ url: videoUrl, index: idx, title: `Video ${idx + 1}` });
                                        setVideoModalOpen(true);
                                      }}
                                      className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 hover:bg-opacity-50 transition-opacity group cursor-pointer"
                                      title="Play video"
                                    >
                                      <div className="bg-white bg-opacity-90 rounded-full p-4 group-hover:bg-opacity-100 transition transform group-hover:scale-110">
                                        <Play className="w-8 h-8 text-primary-600 fill-primary-600" />
                                      </div>
                                    </button>
                                    {/* Video URL Display */}
                                    <div className="absolute bottom-2 left-2 right-2">
                                      <p className="text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded truncate">
                                        {url}
                                      </p>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeVideoUrl(idx)}
                                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Remove video"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingVenue(null);
                  resetForm();
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Updating...' : 'Update Venue'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Video Player Modal */}
      {videoModalOpen && playingVideo && playingVideo.url && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] p-4"
          onClick={() => {
            setVideoModalOpen(false);
            setPlayingVideo(null);
          }}
        >
          <div 
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {playingVideo.title || 'Video Preview'}
              </h3>
              <button
                onClick={() => {
                  setVideoModalOpen(false);
                  setPlayingVideo(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition"
                title="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="relative bg-black">
              <video
                key={playingVideo.url}
                className="w-full h-auto max-h-[70vh]"
                controls
                autoPlay
                playsInline
                onError={(e) => {
                  console.error('Video playback error:', e, playingVideo.url);
                  alert(`Video could not be loaded.\n\nURL: ${playingVideo.url}\n\nPossible reasons:\n1. Video file does not exist on server (404)\n2. Video format not supported\n3. CORS issue\n4. Network error\n\nPlease verify the video file exists and is accessible.`);
                }}
                onLoadedData={() => {
                  console.log('Video loaded successfully:', playingVideo.url);
                }}
                preload="auto"
              >
                <source src={playingVideo.url} type="video/mp4" />
                <source src={playingVideo.url} type="video/webm" />
                <source src={playingVideo.url} type="video/ogg" />
                Your browser does not support the video tag.
              </video>
            </div>
            <div className="p-4 bg-gray-50">
              <p className="text-xs text-gray-600 break-all">
                <strong>Video URL:</strong> {playingVideo.url}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
