import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '../admin/ui/Button';
import { Input } from '../admin/ui/Input';
import { 
  X, Plus, Trash2, ChevronDown, ChevronUp, 
  MapPin, DollarSign, Users, Home, Utensils, 
  Star, Clock, Calendar, Tag, Image as ImageIcon, 
  Video, Menu, FileText, Search, Check
} from 'lucide-react';

const defaultFormConfig = {
  venue: {
    name: true,
    location: {
      enabled: true,
      city: true,
      state: true,
      address: true
    },
    priceType: {
      enabled: true,
      types: ['per_day', 'food_price_per_plate']
    },
    type: {
      enabled: true,
      allowCustom: true,
      options: []
    },
    numberOfGuests: true,
    numberOfRooms: true,
    food: {
      enabled: true,
      options: ['veg', 'non_veg', 'both'],
      allowIndividualItems: true
    },
    amenities: true,
    highlights: true,
    timing: {
      enabled: true,
      openTime: true,
      closeTime: true
    },
    openDays: {
      enabled: true,
      allowAllDays: true,
      days: []
    },
    gender: false,
    category: true,
    menu: true,
    submenu: true,
    videos: true,
    galleryImages: true
  },
  booking: {
    date: true,
    numberOfGuests: true,
    numberOfRooms: true,
    type: {
      enabled: true,
      source: 'venue'
    },
    foodPrice: {
      enabled: true,
      autoCalculate: true
    },
    gender: false,
    pickupDrop: {
      enabled: false,
      pickup: false,
      drop: false
    },
    dateSelection: {
      enabled: true,
      allowMultipleDates: false
    }
  }
};

const priceTypeOptions = [
  { value: 'per_day', label: 'Per Day' },
  { value: 'per_km', label: 'Per KM' },
  { value: 'hours_price', label: 'Hours Price' },
  { value: 'server_type_price', label: 'Server Type Price' },
  { value: 'food_price_per_plate', label: 'Food Price Per Plate' }
];

const daysOfWeek = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' }
];

// Deep comparison helper (moved outside component to avoid recreation)
const deepEqual = (obj1, obj2) => {
  if (obj1 === obj2) return true;
  if (!obj1 || !obj2) return false;
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return false;
  try {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  } catch {
    return false;
  }
};

export const VendorCategoryFormEditor = ({ formConfig: initialConfig, onChange, onClose }) => {
  // Helper function to merge config with defaults
  const mergeWithDefaults = (config) => {
    if (!config || typeof config !== 'object') {
      return JSON.parse(JSON.stringify(defaultFormConfig));
    }
    
    const merged = JSON.parse(JSON.stringify(defaultFormConfig));
    
    // Deep merge venue config
    if (config.venue) {
      merged.venue = {
        ...merged.venue,
        ...config.venue,
        location: {
          ...merged.venue.location,
          ...(config.venue.location || {})
        },
        priceType: {
          ...merged.venue.priceType,
          ...(config.venue.priceType || {}),
          types: config.venue.priceType?.types || merged.venue.priceType.types
        },
        type: {
          ...merged.venue.type,
          ...(config.venue.type || {}),
          options: config.venue.type?.options || merged.venue.type.options
        },
        food: {
          ...merged.venue.food,
          ...(config.venue.food || {}),
          options: config.venue.food?.options || merged.venue.food.options
        },
        timing: {
          ...merged.venue.timing,
          ...(config.venue.timing || {})
        },
        openDays: {
          ...merged.venue.openDays,
          ...(config.venue.openDays || {}),
          days: config.venue.openDays?.days || merged.venue.openDays.days
        }
      };
    }
    
    // Deep merge booking config
    if (config.booking) {
      merged.booking = {
        ...merged.booking,
        ...config.booking,
        type: {
          ...merged.booking.type,
          ...(config.booking.type || {})
        },
        foodPrice: {
          ...merged.booking.foodPrice,
          ...(config.booking.foodPrice || {})
        },
        pickupDrop: {
          ...merged.booking.pickupDrop,
          ...(config.booking.pickupDrop || {})
        },
        dateSelection: {
          ...merged.booking.dateSelection,
          ...(config.booking.dateSelection || {})
        }
      };
    }
    
    return merged;
  };

  const [formConfig, setFormConfig] = useState(() => mergeWithDefaults(initialConfig));
  const [expandedSections, setExpandedSections] = useState({
    venue: true,
    booking: true
  });
  
  // Use refs to track previous values and prevent infinite loops
  const initialConfigRef = useRef(initialConfig);
  const isInitialMount = useRef(true);
  const onChangeRef = useRef(onChange);

  // Update onChange ref when it changes
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Update formConfig when initialConfig changes (only if actually different)
  useEffect(() => {
    if (!deepEqual(initialConfig, initialConfigRef.current)) {
      initialConfigRef.current = initialConfig;
      isUpdatingFromParent.current = true;
      setFormConfig(mergeWithDefaults(initialConfig));
      // Reset flag after state update
      setTimeout(() => {
        isUpdatingFromParent.current = false;
      }, 0);
    }
  }, [initialConfig]);

  // Track if we're updating from parent (to avoid infinite loop)
  const isUpdatingFromParent = useRef(false);
  const previousFormConfigRef = useRef(null);

  // Notify parent of changes (but not on initial mount or when updating from parent)
  useEffect(() => {
    if (isInitialMount.current || isUpdatingFromParent.current) {
      previousFormConfigRef.current = formConfig;
      return;
    }
    
    // Only call onChange if formConfig actually changed
    if (onChangeRef.current && formConfig && !deepEqual(formConfig, previousFormConfigRef.current)) {
      previousFormConfigRef.current = formConfig;
      onChangeRef.current(formConfig);
    }
  }, [formConfig]);

  // Mark initial mount as complete after first render
  useEffect(() => {
    const timer = setTimeout(() => {
      isInitialMount.current = false;
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const updateConfig = (path, value) => {
    isUpdatingFromParent.current = false;
    setFormConfig(prev => {
      const newConfig = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let current = newConfig;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newConfig;
    });
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleArrayItem = (path, value) => {
    isUpdatingFromParent.current = false;
    setFormConfig(prev => {
      const newConfig = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let current = newConfig;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      const arrayKey = keys[keys.length - 1];
      if (!current[arrayKey] || !Array.isArray(current[arrayKey])) {
        current[arrayKey] = [];
      }
      const array = current[arrayKey];
      const index = array.indexOf(value);
      if (index > -1) {
        array.splice(index, 1);
      } else {
        array.push(value);
      }
      return newConfig;
    });
  };

  const addTypeOption = () => {
    const input = prompt('Enter type option:');
    if (input && input.trim()) {
      isUpdatingFromParent.current = false;
      setFormConfig(prev => {
        const newConfig = JSON.parse(JSON.stringify(prev));
        if (!newConfig.venue.type.options) {
          newConfig.venue.type.options = [];
        }
        newConfig.venue.type.options.push(input.trim());
        return newConfig;
      });
    }
  };

  const removeTypeOption = (index) => {
    isUpdatingFromParent.current = false;
    setFormConfig(prev => {
      const newConfig = JSON.parse(JSON.stringify(prev));
      newConfig.venue.type.options.splice(index, 1);
      return newConfig;
    });
  };

  // Custom Checkbox Component with better styling
  const CustomCheckbox = ({ checked, onChange, label, icon: Icon, description, className = "" }) => (
    <label className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
      checked 
        ? 'border-primary bg-primary/5 dark:bg-primary/10' 
        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
    } ${className}`}>
      <div className="relative flex-shrink-0 mt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="sr-only"
        />
        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
          checked
            ? 'bg-primary border-primary'
            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
        }`}>
          {checked && <Check className="w-3.5 h-3.5 text-white" />}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {Icon && <Icon className={`w-4 h-4 flex-shrink-0 ${checked ? 'text-primary' : 'text-gray-400'}`} />}
          <span className={`text-sm font-medium ${checked ? 'text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}>
            {label}
          </span>
        </div>
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description}</p>
        )}
      </div>
    </label>
  );

  // Nested Field Group Component
  const NestedFieldGroup = ({ parentChecked, onParentChange, parentLabel, parentIcon: ParentIcon, children, description }) => (
    <div className="space-y-2">
      <CustomCheckbox
        checked={parentChecked}
        onChange={onParentChange}
        label={parentLabel}
        icon={ParentIcon}
        description={description}
      />
      {parentChecked && (
        <div className="ml-8 space-y-2 border-l-2 border-primary/20 dark:border-primary/30 pl-4">
          {children}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-2">
      {/* Venue Form Configuration */}
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
        <div 
          className="flex items-center justify-between cursor-pointer mb-4 pb-3 border-b border-gray-200 dark:border-gray-700"
          onClick={() => toggleSection('venue')}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Home className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Venue Form Configuration
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Configure fields for venue registration form
              </p>
            </div>
          </div>
          {expandedSections.venue ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </div>

        {expandedSections.venue && (
          <div className="mt-4 space-y-3">
            {/* Basic Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Name */}
              <CustomCheckbox
                checked={formConfig.venue.name}
                onChange={(e) => updateConfig('venue.name', e.target.checked)}
                label="Name"
                icon={FileText}
                description="Venue name field"
              />

              {/* Number of Guests */}
              <CustomCheckbox
                checked={formConfig.venue.numberOfGuests}
                onChange={(e) => updateConfig('venue.numberOfGuests', e.target.checked)}
                label="Number of Guests"
                icon={Users}
                description="Maximum guest capacity"
              />

              {/* Number of Rooms */}
              <CustomCheckbox
                checked={formConfig.venue.numberOfRooms}
                onChange={(e) => updateConfig('venue.numberOfRooms', e.target.checked)}
                label="Number of Rooms"
                icon={Home}
                description="Total number of rooms"
              />

              {/* Amenities */}
              <CustomCheckbox
                checked={formConfig.venue.amenities}
                onChange={(e) => updateConfig('venue.amenities', e.target.checked)}
                label="Amenities"
                icon={Star}
                description="List of available amenities"
              />

              {/* Category */}
              <CustomCheckbox
                checked={formConfig.venue.category}
                onChange={(e) => updateConfig('venue.category', e.target.checked)}
                label="Category"
                icon={Tag}
                description="Venue category selection"
              />

              {/* Videos */}
              <CustomCheckbox
                checked={formConfig.venue.videos}
                onChange={(e) => updateConfig('venue.videos', e.target.checked)}
                label="Videos"
                icon={Video}
                description="Video uploads"
              />

              {/* Gallery Images */}
              <CustomCheckbox
                checked={formConfig.venue.galleryImages}
                onChange={(e) => updateConfig('venue.galleryImages', e.target.checked)}
                label="Gallery Images"
                icon={ImageIcon}
                description="Image gallery upload"
              />

              {/* Highlights */}
              <CustomCheckbox
                checked={formConfig.venue.highlights}
                onChange={(e) => updateConfig('venue.highlights', e.target.checked)}
                label="Highlights"
                icon={Star}
                description="Key highlights and features"
              />

              {/* Menu */}
              <CustomCheckbox
                checked={formConfig.venue.menu}
                onChange={(e) => updateConfig('venue.menu', e.target.checked)}
                label="Menu"
                icon={Menu}
                description="Menu items and pricing"
              />

              {/* Submenu */}
              <CustomCheckbox
                checked={formConfig.venue.submenu}
                onChange={(e) => updateConfig('venue.submenu', e.target.checked)}
                label="Submenu"
                icon={Menu}
                description="Submenu categories"
              />

              {/* Gender */}
              <CustomCheckbox
                checked={formConfig.venue.gender}
                onChange={(e) => updateConfig('venue.gender', e.target.checked)}
                label="Gender"
                icon={Users}
                description="Gender-specific options"
              />
            </div>

            {/* Location - Nested Group */}
            <NestedFieldGroup
              parentChecked={formConfig.venue.location?.enabled}
              onParentChange={(e) => updateConfig('venue.location.enabled', e.target.checked)}
              parentLabel="Location"
              parentIcon={MapPin}
              description="Venue location details"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <CustomCheckbox
                  checked={formConfig.venue.location?.city}
                  onChange={(e) => updateConfig('venue.location.city', e.target.checked)}
                  label="City"
                />
                <CustomCheckbox
                  checked={formConfig.venue.location?.state}
                  onChange={(e) => updateConfig('venue.location.state', e.target.checked)}
                  label="State"
                />
                <CustomCheckbox
                  checked={formConfig.venue.location?.address}
                  onChange={(e) => updateConfig('venue.location.address', e.target.checked)}
                  label="Address"
                />
              </div>
            </NestedFieldGroup>

            {/* Price Type - Nested Group */}
            <NestedFieldGroup
              parentChecked={formConfig.venue.priceType?.enabled}
              onParentChange={(e) => updateConfig('venue.priceType.enabled', e.target.checked)}
              parentLabel="Price Type"
              parentIcon={DollarSign}
              description="Select available pricing types"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {priceTypeOptions.map(option => (
                  <CustomCheckbox
                    key={option.value}
                    checked={formConfig.venue.priceType?.types?.includes(option.value)}
                    onChange={() => toggleArrayItem('venue.priceType.types', option.value)}
                    label={option.label}
                  />
                ))}
              </div>
            </NestedFieldGroup>

            {/* Type - Nested Group */}
            <NestedFieldGroup
              parentChecked={formConfig.venue.type?.enabled}
              onParentChange={(e) => updateConfig('venue.type.enabled', e.target.checked)}
              parentLabel="Type"
              parentIcon={Tag}
              description="Venue type options"
            >
              <div className="space-y-3">
                <CustomCheckbox
                  checked={formConfig.venue.type?.allowCustom}
                  onChange={(e) => updateConfig('venue.type.allowCustom', e.target.checked)}
                  label="Allow Custom Types"
                  description="Users can add custom venue types"
                />
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Type Options:</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={addTypeOption}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Option
                    </Button>
                  </div>
                  {formConfig.venue.type?.options?.length > 0 ? (
                    <div className="space-y-2">
                      {formConfig.venue.type.options.map((option, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                          <span className="text-sm flex-1 font-medium text-gray-900 dark:text-gray-100">{option}</span>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => removeTypeOption(idx)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                      No type options added yet. Click "Add Option" to add one.
                    </p>
                  )}
                </div>
              </div>
            </NestedFieldGroup>

            {/* Food - Nested Group */}
            <NestedFieldGroup
              parentChecked={formConfig.venue.food?.enabled}
              onParentChange={(e) => updateConfig('venue.food.enabled', e.target.checked)}
              parentLabel="Food"
              parentIcon={Utensils}
              description="Food options and preferences"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <CustomCheckbox
                  checked={formConfig.venue.food?.options?.includes('veg')}
                  onChange={() => toggleArrayItem('venue.food.options', 'veg')}
                  label="Vegetarian"
                />
                <CustomCheckbox
                  checked={formConfig.venue.food?.options?.includes('non_veg')}
                  onChange={() => toggleArrayItem('venue.food.options', 'non_veg')}
                  label="Non-Vegetarian"
                />
                <CustomCheckbox
                  checked={formConfig.venue.food?.options?.includes('both')}
                  onChange={() => toggleArrayItem('venue.food.options', 'both')}
                  label="Both"
                />
              </div>
              <CustomCheckbox
                checked={formConfig.venue.food?.allowIndividualItems}
                onChange={(e) => updateConfig('venue.food.allowIndividualItems', e.target.checked)}
                label="Allow Individual Food Items"
                description="Enable individual food item selection"
              />
            </NestedFieldGroup>

            {/* Timing - Nested Group */}
            <NestedFieldGroup
              parentChecked={formConfig.venue.timing?.enabled}
              onParentChange={(e) => updateConfig('venue.timing.enabled', e.target.checked)}
              parentLabel="Timing"
              parentIcon={Clock}
              description="Venue operating hours"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <CustomCheckbox
                  checked={formConfig.venue.timing?.openTime}
                  onChange={(e) => updateConfig('venue.timing.openTime', e.target.checked)}
                  label="Open Time"
                />
                <CustomCheckbox
                  checked={formConfig.venue.timing?.closeTime}
                  onChange={(e) => updateConfig('venue.timing.closeTime', e.target.checked)}
                  label="Close Time"
                />
              </div>
            </NestedFieldGroup>

            {/* Open Days - Nested Group */}
            <NestedFieldGroup
              parentChecked={formConfig.venue.openDays?.enabled}
              onParentChange={(e) => updateConfig('venue.openDays.enabled', e.target.checked)}
              parentLabel="Open Days"
              parentIcon={Calendar}
              description="Days when venue is open"
            >
              <CustomCheckbox
                checked={formConfig.venue.openDays?.allowAllDays}
                onChange={(e) => updateConfig('venue.openDays.allowAllDays', e.target.checked)}
                label="Allow All Days"
                description="Venue is open all days of the week"
              />
              {!formConfig.venue.openDays?.allowAllDays && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {daysOfWeek.map(day => (
                    <CustomCheckbox
                      key={day.value}
                      checked={formConfig.venue.openDays?.days?.includes(day.value)}
                      onChange={() => toggleArrayItem('venue.openDays.days', day.value)}
                      label={day.label}
                    />
                  ))}
                </div>
              )}
            </NestedFieldGroup>
          </div>
        )}
      </div>

      {/* Booking Form Configuration */}
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
        <div 
          className="flex items-center justify-between cursor-pointer mb-4 pb-3 border-b border-gray-200 dark:border-gray-700"
          onClick={() => toggleSection('booking')}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Booking Form Configuration
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Configure fields for booking form
              </p>
            </div>
          </div>
          {expandedSections.booking ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </div>

        {expandedSections.booking && (
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Date */}
              <CustomCheckbox
                checked={formConfig.booking.date}
                onChange={(e) => updateConfig('booking.date', e.target.checked)}
                label="Date"
                icon={Calendar}
                description="Booking date selection"
              />

              {/* Number of Guests */}
              <CustomCheckbox
                checked={formConfig.booking.numberOfGuests}
                onChange={(e) => updateConfig('booking.numberOfGuests', e.target.checked)}
                label="Number of Guests"
                icon={Users}
                description="Guest count for booking"
              />

              {/* Number of Rooms */}
              <CustomCheckbox
                checked={formConfig.booking.numberOfRooms}
                onChange={(e) => updateConfig('booking.numberOfRooms', e.target.checked)}
                label="Number of Rooms"
                icon={Home}
                description="Room count for booking"
              />

              {/* Gender */}
              <CustomCheckbox
                checked={formConfig.booking.gender}
                onChange={(e) => updateConfig('booking.gender', e.target.checked)}
                label="Gender"
                icon={Users}
                description="Gender-specific booking options"
              />
            </div>

            {/* Type - Nested Group */}
            <NestedFieldGroup
              parentChecked={formConfig.booking.type?.enabled}
              onParentChange={(e) => updateConfig('booking.type.enabled', e.target.checked)}
              parentLabel="Type"
              parentIcon={Tag}
              description="Booking type source"
            >
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                  <input
                    type="radio"
                    name="typeSource"
                    checked={formConfig.booking.type?.source === 'venue'}
                    onChange={() => updateConfig('booking.type.source', 'venue')}
                    className="w-4 h-4 text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">From Venue</span>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                  <input
                    type="radio"
                    name="typeSource"
                    checked={formConfig.booking.type?.source === 'custom'}
                    onChange={() => updateConfig('booking.type.source', 'custom')}
                    className="w-4 h-4 text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Custom</span>
                </label>
              </div>
            </NestedFieldGroup>

            {/* Food Price - Nested Group */}
            <NestedFieldGroup
              parentChecked={formConfig.booking.foodPrice?.enabled}
              onParentChange={(e) => updateConfig('booking.foodPrice.enabled', e.target.checked)}
              parentLabel="Food Price"
              parentIcon={DollarSign}
              description="Food pricing options"
            >
              <CustomCheckbox
                checked={formConfig.booking.foodPrice?.autoCalculate}
                onChange={(e) => updateConfig('booking.foodPrice.autoCalculate', e.target.checked)}
                label="Auto Calculate from Venue"
                description="Automatically calculate food price from venue settings"
              />
            </NestedFieldGroup>

            {/* Pickup/Drop - Nested Group */}
            <NestedFieldGroup
              parentChecked={formConfig.booking.pickupDrop?.enabled}
              onParentChange={(e) => updateConfig('booking.pickupDrop.enabled', e.target.checked)}
              parentLabel="Pickup/Drop"
              parentIcon={MapPin}
              description="Transportation options"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <CustomCheckbox
                  checked={formConfig.booking.pickupDrop?.pickup}
                  onChange={(e) => updateConfig('booking.pickupDrop.pickup', e.target.checked)}
                  label="Pickup"
                />
                <CustomCheckbox
                  checked={formConfig.booking.pickupDrop?.drop}
                  onChange={(e) => updateConfig('booking.pickupDrop.drop', e.target.checked)}
                  label="Drop"
                />
              </div>
            </NestedFieldGroup>

            {/* Date Selection - Nested Group */}
            <NestedFieldGroup
              parentChecked={formConfig.booking.dateSelection?.enabled}
              onParentChange={(e) => updateConfig('booking.dateSelection.enabled', e.target.checked)}
              parentLabel="Date Selection"
              parentIcon={Calendar}
              description="Date selection options"
            >
              <CustomCheckbox
                checked={formConfig.booking.dateSelection?.allowMultipleDates}
                onChange={(e) => updateConfig('booking.dateSelection.allowMultipleDates', e.target.checked)}
                label="Allow Multiple Dates"
                description="Users can select multiple dates for booking"
              />
            </NestedFieldGroup>
          </div>
        )}
      </div>
    </div>
  );
};

