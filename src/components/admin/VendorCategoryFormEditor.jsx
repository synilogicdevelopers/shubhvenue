import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '../admin/ui/Button';
import { Input } from '../admin/ui/Input';
import { X, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

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

  return (
    <div className="space-y-4 max-h-[80vh] overflow-y-auto">
      {/* Venue Form Configuration */}
      <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => toggleSection('venue')}
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Venue Form Configuration
          </h3>
          {expandedSections.venue ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </div>

        {expandedSections.venue && (
          <div className="mt-4 space-y-4">
            {/* Basic Fields */}
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formConfig.venue.name}
                  onChange={(e) => updateConfig('venue.name', e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Name</span>
              </label>

              {/* Location */}
              <div className="ml-6 space-y-2 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formConfig.venue.location?.enabled}
                    onChange={(e) => updateConfig('venue.location.enabled', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">Location</span>
                </label>
                {formConfig.venue.location?.enabled && (
                  <div className="ml-6 space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formConfig.venue.location?.city}
                        onChange={(e) => updateConfig('venue.location.city', e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">City</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formConfig.venue.location?.state}
                        onChange={(e) => updateConfig('venue.location.state', e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">State</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formConfig.venue.location?.address}
                        onChange={(e) => updateConfig('venue.location.address', e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Address</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Price Type */}
              <div className="ml-6 space-y-2 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formConfig.venue.priceType?.enabled}
                    onChange={(e) => updateConfig('venue.priceType.enabled', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">Price Type</span>
                </label>
                {formConfig.venue.priceType?.enabled && (
                  <div className="ml-6 space-y-2">
                    {priceTypeOptions.map(option => (
                      <label key={option.value} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formConfig.venue.priceType?.types?.includes(option.value)}
                          onChange={() => toggleArrayItem('venue.priceType.types', option.value)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">{option.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Type */}
              <div className="ml-6 space-y-2 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formConfig.venue.type?.enabled}
                    onChange={(e) => updateConfig('venue.type.enabled', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">Type</span>
                </label>
                {formConfig.venue.type?.enabled && (
                  <div className="ml-6 space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formConfig.venue.type?.allowCustom}
                        onChange={(e) => updateConfig('venue.type.allowCustom', e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Allow Custom Types</span>
                    </label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Type Options:</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={addTypeOption}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add
                        </Button>
                      </div>
                      {formConfig.venue.type?.options?.map((option, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-2 rounded">
                          <span className="text-sm flex-1">{option}</span>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => removeTypeOption(idx)}
                          >
                            <Trash2 className="w-3 h-3 text-red-600" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formConfig.venue.numberOfGuests}
                  onChange={(e) => updateConfig('venue.numberOfGuests', e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Number of Guests</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formConfig.venue.numberOfRooms}
                  onChange={(e) => updateConfig('venue.numberOfRooms', e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Number of Rooms</span>
              </label>

              {/* Food */}
              <div className="ml-6 space-y-2 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formConfig.venue.food?.enabled}
                    onChange={(e) => updateConfig('venue.food.enabled', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">Food</span>
                </label>
                {formConfig.venue.food?.enabled && (
                  <div className="ml-6 space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formConfig.venue.food?.options?.includes('veg')}
                        onChange={() => toggleArrayItem('venue.food.options', 'veg')}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Veg</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formConfig.venue.food?.options?.includes('non_veg')}
                        onChange={() => toggleArrayItem('venue.food.options', 'non_veg')}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Non-Veg</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formConfig.venue.food?.options?.includes('both')}
                        onChange={() => toggleArrayItem('venue.food.options', 'both')}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Both</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formConfig.venue.food?.allowIndividualItems}
                        onChange={(e) => updateConfig('venue.food.allowIndividualItems', e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Allow Individual Food Items</span>
                    </label>
                  </div>
                )}
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formConfig.venue.amenities}
                  onChange={(e) => updateConfig('venue.amenities', e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Amenities</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formConfig.venue.highlights}
                  onChange={(e) => updateConfig('venue.highlights', e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Highlights</span>
              </label>

              {/* Timing */}
              <div className="ml-6 space-y-2 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formConfig.venue.timing?.enabled}
                    onChange={(e) => updateConfig('venue.timing.enabled', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">Timing</span>
                </label>
                {formConfig.venue.timing?.enabled && (
                  <div className="ml-6 space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formConfig.venue.timing?.openTime}
                        onChange={(e) => updateConfig('venue.timing.openTime', e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Open Time</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formConfig.venue.timing?.closeTime}
                        onChange={(e) => updateConfig('venue.timing.closeTime', e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Close Time</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Open Days */}
              <div className="ml-6 space-y-2 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formConfig.venue.openDays?.enabled}
                    onChange={(e) => updateConfig('venue.openDays.enabled', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">Open Days</span>
                </label>
                {formConfig.venue.openDays?.enabled && (
                  <div className="ml-6 space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formConfig.venue.openDays?.allowAllDays}
                        onChange={(e) => updateConfig('venue.openDays.allowAllDays', e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Allow All Days</span>
                    </label>
                    {!formConfig.venue.openDays?.allowAllDays && (
                      <div className="space-y-1">
                        {daysOfWeek.map(day => (
                          <label key={day.value} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={formConfig.venue.openDays?.days?.includes(day.value)}
                              onChange={() => toggleArrayItem('venue.openDays.days', day.value)}
                              className="w-4 h-4"
                            />
                            <span className="text-sm">{day.label}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formConfig.venue.gender}
                  onChange={(e) => updateConfig('venue.gender', e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Gender</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formConfig.venue.category}
                  onChange={(e) => updateConfig('venue.category', e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Category</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formConfig.venue.menu}
                  onChange={(e) => updateConfig('venue.menu', e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Menu</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formConfig.venue.submenu}
                  onChange={(e) => updateConfig('venue.submenu', e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Submenu</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formConfig.venue.videos}
                  onChange={(e) => updateConfig('venue.videos', e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Videos</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formConfig.venue.galleryImages}
                  onChange={(e) => updateConfig('venue.galleryImages', e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Gallery Images</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Booking Form Configuration */}
      <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => toggleSection('booking')}
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Booking Form Configuration
          </h3>
          {expandedSections.booking ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </div>

        {expandedSections.booking && (
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formConfig.booking.date}
                  onChange={(e) => updateConfig('booking.date', e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Date</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formConfig.booking.numberOfGuests}
                  onChange={(e) => updateConfig('booking.numberOfGuests', e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Number of Guests</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formConfig.booking.numberOfRooms}
                  onChange={(e) => updateConfig('booking.numberOfRooms', e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Number of Rooms</span>
              </label>

              {/* Type */}
              <div className="ml-6 space-y-2 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formConfig.booking.type?.enabled}
                    onChange={(e) => updateConfig('booking.type.enabled', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">Type</span>
                </label>
                {formConfig.booking.type?.enabled && (
                  <div className="ml-6 space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="typeSource"
                        checked={formConfig.booking.type?.source === 'venue'}
                        onChange={() => updateConfig('booking.type.source', 'venue')}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">From Venue</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="typeSource"
                        checked={formConfig.booking.type?.source === 'custom'}
                        onChange={() => updateConfig('booking.type.source', 'custom')}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Custom</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Food Price */}
              <div className="ml-6 space-y-2 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formConfig.booking.foodPrice?.enabled}
                    onChange={(e) => updateConfig('booking.foodPrice.enabled', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">Food Price</span>
                </label>
                {formConfig.booking.foodPrice?.enabled && (
                  <label className="ml-6 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formConfig.booking.foodPrice?.autoCalculate}
                      onChange={(e) => updateConfig('booking.foodPrice.autoCalculate', e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Auto Calculate from Venue</span>
                  </label>
                )}
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formConfig.booking.gender}
                  onChange={(e) => updateConfig('booking.gender', e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Gender</span>
              </label>

              {/* Pickup/Drop */}
              <div className="ml-6 space-y-2 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formConfig.booking.pickupDrop?.enabled}
                    onChange={(e) => updateConfig('booking.pickupDrop.enabled', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">Pickup/Drop</span>
                </label>
                {formConfig.booking.pickupDrop?.enabled && (
                  <div className="ml-6 space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formConfig.booking.pickupDrop?.pickup}
                        onChange={(e) => updateConfig('booking.pickupDrop.pickup', e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Pickup</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formConfig.booking.pickupDrop?.drop}
                        onChange={(e) => updateConfig('booking.pickupDrop.drop', e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Drop</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Date Selection */}
              <div className="ml-6 space-y-2 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formConfig.booking.dateSelection?.enabled}
                    onChange={(e) => updateConfig('booking.dateSelection.enabled', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">Date Selection</span>
                </label>
                {formConfig.booking.dateSelection?.enabled && (
                  <label className="ml-6 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formConfig.booking.dateSelection?.allowMultipleDates}
                      onChange={(e) => updateConfig('booking.dateSelection.allowMultipleDates', e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Allow Multiple Dates</span>
                  </label>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button type="button" variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
};

