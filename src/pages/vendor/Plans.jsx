import { useState, useEffect } from 'react';
import { vendorPlansAPI, vendorAPI } from '../../services/vendor/api';
import toast from 'react-hot-toast';
import { CheckCircle2, XCircle, CreditCard, Calendar, MapPin, Star } from 'lucide-react';
import { loadScript } from '../../utils/payment/razorpay';

export default function Plans() {
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedVenues, setSelectedVenues] = useState([]);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [currentSubscriptionId, setCurrentSubscriptionId] = useState(null);
  const [verificationFormData, setVerificationFormData] = useState({
    businessName: '',
    businessAddress: '',
    businessPhone: '',
    businessEmail: '',
    businessRegistrationNumber: '',
    gstNumber: '',
    panNumber: '',
    additionalDetails: ''
  });
  const [selectedDocumentType, setSelectedDocumentType] = useState(''); // 'pan', 'gst', or 'registration'
  const [documentNumber, setDocumentNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [verificationSubmitting, setVerificationSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [plansRes, subscriptionsRes, venuesRes] = await Promise.all([
        vendorPlansAPI.getAll(),
        vendorPlansAPI.getSubscriptions(),
        vendorAPI.getVenues()
      ]);
      setPlans(plansRes.data?.plans || []);
      setSubscriptions(subscriptionsRes.data?.subscriptions || []);
      setVenues(venuesRes.data?.data || venuesRes.data || []);
    } catch (error) {
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = (plan) => {
    if (venues.length === 0) {
      toast.error('Please create at least one venue before purchasing a plan');
      return;
    }
    setSelectedPlan(plan);
    setSelectedVenues([]);
    setShowPurchaseModal(true);
  };

  const handlePurchaseConfirm = async () => {
    if (!selectedPlan) return;
    
    if (selectedVenues.length === 0) {
      toast.error('Please select at least one venue');
      return;
    }

    if (selectedVenues.length > selectedPlan.maxVenues) {
      toast.error(`This plan allows maximum ${selectedPlan.maxVenues} venue(s)`);
      return;
    }

    // Show verification form first, then proceed to payment
    setShowPurchaseModal(false);
    setShowVerificationModal(true);
  };

  const getActiveSubscription = (planId) => {
    const now = new Date();
    return subscriptions.find(sub => 
      sub.planId?._id === planId &&
      sub.status === 'active' &&
      sub.paymentStatus === 'completed' &&
      new Date(sub.endDate) >= now &&
      sub.adminVerified === true
    );
  };

  const getPendingSubscription = (planId) => {
    return subscriptions.find(sub => 
      sub.planId?._id === planId &&
      sub.status === 'pending_verification' &&
      sub.paymentStatus === 'completed' &&
      sub.adminVerified === false
    );
  };

  const handleVerificationSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!verificationFormData.businessName?.trim()) {
      toast.error('Business name is required');
      return;
    }
    if (!verificationFormData.businessAddress?.trim()) {
      toast.error('Business address is required');
      return;
    }
    // Phone number validation
    const phoneStr = verificationFormData.businessPhone?.trim() || '';
    const phoneDigits = phoneStr.replace(/\D/g, '');
    
    if (!phoneStr) {
      toast.error('Business phone is required');
      setPhoneError('Business phone is required');
      return;
    }
    
    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      toast.error('Phone number must be between 10 and 15 digits');
      setPhoneError('Phone number must be between 10 and 15 digits');
      return;
    }
    
    // Validate Indian mobile number if it's 10 digits
    if (phoneDigits.length === 10) {
      const firstDigit = phoneDigits[0];
      if (!['6', '7', '8', '9'].includes(firstDigit)) {
        toast.error('Invalid Indian mobile number. Must start with 6, 7, 8, or 9');
        setPhoneError('Invalid Indian mobile number. Must start with 6, 7, 8, or 9');
        return;
      }
    }
    
    setPhoneError(''); // Clear error if validation passes
    
    // Email validation
    if (!verificationFormData.businessEmail?.trim()) {
      toast.error('Business email is required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(verificationFormData.businessEmail.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Validate document based on selected type
    if (selectedDocumentType) {
      if (!documentNumber.trim()) {
        toast.error(`Please enter ${selectedDocumentType === 'pan' ? 'PAN' : selectedDocumentType === 'gst' ? 'GST' : 'Registration'} Number`);
        return;
      }
      if (selectedDocumentType === 'pan' && documentNumber.length !== 10) {
        toast.error('PAN Number must be exactly 10 characters');
        return;
      }
      if (selectedDocumentType === 'gst' && documentNumber.length !== 15) {
        toast.error('GST Number must be exactly 15 characters');
        return;
      }
    }

    // Store verification details temporarily based on selected document type
    // phoneDigits already calculated above during validation
    const storedVerificationDetails = {
      businessName: verificationFormData.businessName.trim(),
      businessAddress: verificationFormData.businessAddress.trim(),
      businessPhone: phoneDigits, // Store only digits (already calculated above)
      businessEmail: verificationFormData.businessEmail.trim(),
      businessRegistrationNumber: selectedDocumentType === 'registration' ? documentNumber.trim() : '',
      gstNumber: selectedDocumentType === 'gst' ? documentNumber.trim() : '',
      panNumber: selectedDocumentType === 'pan' ? documentNumber.trim() : '',
      additionalDetails: verificationFormData.additionalDetails?.trim() || ''
    };

    setVerificationSubmitting(true);
    try {
      // Create subscription and payment order
      const response = await vendorPlansAPI.purchase({
        planId: selectedPlan._id,
        venueIds: selectedVenues
      });

      const { subscriptionId, paymentOrder, razorpayKeyId } = response.data;

      if (!razorpayKeyId) {
        toast.error('Payment configuration error: Razorpay key is missing');
        setVerificationSubmitting(false);
        return;
      }

      if (!paymentOrder || !paymentOrder.id) {
        toast.error('Payment order creation failed');
        setVerificationSubmitting(false);
        return;
      }

      // Store subscription ID and verification details for after payment
      setCurrentSubscriptionId(subscriptionId);
      window.pendingVerificationDetails = storedVerificationDetails;

      // Load Razorpay script
      await loadScript('https://checkout.razorpay.com/v1/checkout.js');

      // Wait a bit for script to load
      if (!window.Razorpay) {
        await new Promise(resolve => setTimeout(resolve, 500));
        if (!window.Razorpay) {
          toast.error('Razorpay script failed to load. Please refresh and try again.');
          setVerificationSubmitting(false);
          return;
        }
      }
      
      // Close verification modal and open payment gateway
      setShowVerificationModal(false);
      
      const options = {
        key: razorpayKeyId,
        amount: paymentOrder.amount || selectedPlan.price * 100,
        currency: paymentOrder.currency || 'INR',
        name: 'ShubhVenue',
        description: `Purchase ${selectedPlan.name} Plan`,
        order_id: paymentOrder.id,
        handler: async function (response) {
          try {
            // Payment successful - verify payment with verification details
            const verificationDetails = window.pendingVerificationDetails;
            
            await vendorPlansAPI.verifyPayment({
              subscriptionId: subscriptionId,
              paymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              verificationRequestDetails: verificationDetails
            });

            toast.success('Payment successful! Your verification request has been submitted. Admin will review your details within 24-48 hours.');
            
            // Clean up
            setCurrentSubscriptionId(null);
            setVerificationFormData({
              businessName: '',
              businessAddress: '',
              businessPhone: '',
              businessEmail: '',
              businessRegistrationNumber: '',
              gstNumber: '',
              panNumber: '',
              additionalDetails: ''
            });
            setSelectedDocumentType('');
            setDocumentNumber('');
            setPhoneError('');
            delete window.pendingVerificationDetails;
            setSelectedPlan(null);
            setSelectedVenues([]);
            
            fetchData();
          } catch (error) {
            console.error('Payment verification error:', error);
            toast.error(error.response?.data?.error || error.response?.data?.message || 'Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: 'Vendor',
          email: 'vendor@example.com'
        },
        theme: {
          color: '#EC4899'
        },
        modal: {
          ondismiss: function() {
            toast.error('Payment cancelled');
            setVerificationSubmitting(false);
            // Clean up stored verification details if payment is cancelled
            delete window.pendingVerificationDetails;
            setCurrentSubscriptionId(null);
            // Reset form fields so user can try again
            setSelectedDocumentType('');
            setDocumentNumber('');
            setPhoneError('');
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      setVerificationSubmitting(false);
    } catch (error) {
      console.error('Create payment order error:', error);
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to create payment order');
      setVerificationSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Verification Plans</h1>
        <p className="text-gray-600">Purchase a plan to get your listings verified and appear at the top</p>
      </div>

      {/* Pending Verification Requests */}
      {subscriptions.filter(sub => 
        sub.status === 'pending_verification' && sub.paymentStatus === 'completed' && sub.adminVerified === false
      ).length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Pending Verification</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subscriptions
              .filter(sub => 
                sub.status === 'pending_verification' && sub.paymentStatus === 'completed' && sub.adminVerified === false
              )
              .map(sub => (
                <div key={sub._id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-yellow-800">{sub.planId?.name}</h3>
                    <Calendar className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="text-yellow-700 font-medium">⏳ Awaiting Admin Verification</div>
                    <div className="text-xs text-gray-500 mt-2">
                      Your verification request has been submitted. Admin will review within 24-48 hours.
                    </div>
                    <div className="mt-2">Venues: {sub.venueIds?.length || 0}</div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Active Subscriptions */}
      {subscriptions.filter(sub => {
        const now = new Date();
        return sub.status === 'active' && sub.paymentStatus === 'completed' && new Date(sub.endDate) >= now && sub.adminVerified === true;
      }).length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Active Subscriptions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subscriptions
              .filter(sub => {
                const now = new Date();
                return sub.status === 'active' && sub.paymentStatus === 'completed' && new Date(sub.endDate) >= now && sub.adminVerified === true;
              })
              .map(sub => (
                <div key={sub._id} className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-green-800">{sub.planId?.name}</h3>
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Expires: {new Date(sub.endDate).toLocaleDateString('en-IN')}</div>
                    <div>Venues: {sub.venueIds?.length || 0}</div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Available Plans */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const activeSub = getActiveSubscription(plan._id);
            const pendingSub = getPendingSubscription(plan._id);
            const isActive = !!activeSub;
            const isPending = !!pendingSub;

            return (
              <div
                key={plan._id}
                className={`border rounded-lg p-6 ${
                  isActive ? 'border-green-500 bg-green-50' : 
                  isPending ? 'border-yellow-500 bg-yellow-50' : 
                  'border-gray-200'
                }`}
              >
                {isActive && (
                  <div className="mb-4 flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-semibold">Active</span>
                  </div>
                )}
                {isPending && (
                  <div className="mb-4 flex items-center gap-2 text-yellow-600">
                    <Calendar className="w-5 h-5" />
                    <span className="font-semibold">Pending Verification</span>
                  </div>
                )}
                
                <div className="mb-4">
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <div className="text-3xl font-bold text-pink-600 mb-2">
                    ₹{plan.price?.toLocaleString('en-IN')}
                  </div>
                  <div className="text-sm text-gray-600">
                    for {plan.duration} {plan.durationUnit}
                  </div>
                </div>

                {plan.description && (
                  <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
                )}

                <div className="mb-4">
                  <div className="text-sm font-medium mb-2">Features:</div>
                  <ul className="text-sm space-y-1">
                    {plan.features && plan.features.length > 0 ? (
                      plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Star className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-gray-500">No features listed</li>
                    )}
                  </ul>
                </div>

                <div className="mb-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>Max {plan.maxVenues} venue{plan.maxVenues > 1 ? 's' : ''}</span>
                  </div>
                </div>

                <button
                  onClick={() => handlePurchase(plan)}
                  disabled={isActive || isPending || purchaseLoading}
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                    isActive
                      ? 'bg-green-100 text-green-700 cursor-not-allowed'
                      : isPending
                      ? 'bg-yellow-100 text-yellow-700 cursor-not-allowed'
                      : 'bg-pink-600 text-white hover:bg-pink-700'
                  }`}
                >
                  {isActive ? 'Active' : isPending ? 'Verification Pending' : 'Purchase Plan'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Purchase Modal */}
      {showPurchaseModal && selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Purchase {selectedPlan.name}</h2>
            
            <div className="mb-4">
              <div className="text-sm font-medium mb-2">Select Venues:</div>
              <div className="max-h-60 overflow-y-auto border rounded p-2 space-y-2">
                {venues.map((venue) => (
                  <label
                    key={venue._id || venue.id}
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={selectedVenues.includes(venue._id || venue.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          if (selectedVenues.length >= selectedPlan.maxVenues) {
                            toast.error(`Maximum ${selectedPlan.maxVenues} venue(s) allowed`);
                            return;
                          }
                          setSelectedVenues([...selectedVenues, venue._id || venue.id]);
                        } else {
                          setSelectedVenues(selectedVenues.filter(id => id !== (venue._id || venue.id)));
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <span>{venue.name}</span>
                  </label>
                ))}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Selected: {selectedVenues.length} / {selectedPlan.maxVenues}
              </div>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded">
              <div className="flex justify-between mb-2">
                <span>Plan:</span>
                <span className="font-semibold">{selectedPlan.name}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Duration:</span>
                <span>{selectedPlan.duration} {selectedPlan.durationUnit}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>₹{selectedPlan.price?.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowPurchaseModal(false);
                  setSelectedPlan(null);
                  setSelectedVenues([]);
                }}
                className="flex-1 py-2 px-4 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePurchaseConfirm}
                disabled={purchaseLoading || selectedVenues.length === 0}
                className="flex-1 py-2 px-4 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50"
              >
                {purchaseLoading ? 'Processing...' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verification Form Modal */}
      {showVerificationModal && selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Verification Details Required</h2>
            <p className="text-sm text-gray-600 mb-4">
              Please provide your business details for verification. After payment, admin will review your request within 24-48 hours.
            </p>
            
            <form onSubmit={handleVerificationSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={verificationFormData.businessName}
                    onChange={(e) => setVerificationFormData({...verificationFormData, businessName: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Enter business name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={verificationFormData.businessPhone}
                    onChange={(e) => {
                      let value = e.target.value;
                      // Only allow digits
                      const digitsOnly = value.replace(/\D/g, '');
                      // Limit to 15 digits (max for international numbers)
                      const limitedDigits = digitsOnly.slice(0, 15);
                      
                      setVerificationFormData({...verificationFormData, businessPhone: limitedDigits});
                      
                      // Real-time validation
                      if (limitedDigits.length > 0) {
                        if (limitedDigits.length < 10) {
                          setPhoneError('Phone number must be at least 10 digits');
                        } else {
                          // Validate Indian phone number format if it's exactly 10 digits (starts with 6-9)
                          if (limitedDigits.length === 10) {
                            const firstDigit = limitedDigits[0];
                            if (!['6', '7', '8', '9'].includes(firstDigit)) {
                              setPhoneError('Invalid Indian mobile number. Must start with 6, 7, 8, or 9');
                            } else {
                              setPhoneError(''); // Valid Indian mobile number
                            }
                          } else if (limitedDigits.length > 10 && limitedDigits.length <= 15) {
                            // International number (11-15 digits) - no specific validation
                            setPhoneError('');
                          } else {
                            setPhoneError('');
                          }
                        }
                      } else {
                        setPhoneError('');
                      }
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
                      phoneError ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter 10-digit mobile number (e.g., 9876543210)"
                    maxLength={15}
                    pattern="[0-9]{10,15}"
                  />
                  {phoneError && (
                    <p className="text-xs text-red-500 mt-1">{phoneError}</p>
                  )}
                  {!phoneError && verificationFormData.businessPhone.length === 10 && (
                    <p className="text-xs text-green-600 mt-1">✓ Valid phone number</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={verificationFormData.businessAddress}
                  onChange={(e) => setVerificationFormData({...verificationFormData, businessAddress: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Enter complete business address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={verificationFormData.businessEmail}
                  onChange={(e) => setVerificationFormData({...verificationFormData, businessEmail: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Enter business email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Document <span className="text-gray-500 text-xs">(Select one)</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <select
                      value={selectedDocumentType}
                      onChange={(e) => {
                        setSelectedDocumentType(e.target.value);
                        setDocumentNumber(''); // Clear number when type changes
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    >
                      <option value="">Select Document Type</option>
                      <option value="pan">PAN Number</option>
                      <option value="gst">GST Number</option>
                      <option value="registration">Registration Number</option>
                    </select>
                  </div>
                  <div>
                    <input
                      type="text"
                      value={documentNumber}
                      onChange={(e) => {
                        let value = e.target.value;
                        // Auto-uppercase for PAN and GST
                        if (selectedDocumentType === 'pan' || selectedDocumentType === 'gst') {
                          value = value.toUpperCase();
                        }
                        // PAN: 10 characters, alphanumeric
                        if (selectedDocumentType === 'pan') {
                          value = value.replace(/[^A-Z0-9]/g, '').slice(0, 10);
                        }
                        // GST: 15 characters, alphanumeric
                        if (selectedDocumentType === 'gst') {
                          value = value.replace(/[^A-Z0-9]/g, '').slice(0, 15);
                        }
                        setDocumentNumber(value);
                      }}
                      disabled={!selectedDocumentType}
                      placeholder={
                        selectedDocumentType === 'pan' 
                          ? 'Enter 10-character PAN (e.g., ABCDE1234F)'
                          : selectedDocumentType === 'gst'
                          ? 'Enter 15-digit GSTIN (e.g., 27ABCDE1234F1Z5)'
                          : selectedDocumentType === 'registration'
                          ? 'Enter Registration Number'
                          : 'Select document type first'
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                    {selectedDocumentType === 'pan' && documentNumber.length > 0 && documentNumber.length !== 10 && (
                      <p className="text-xs text-red-500 mt-1">PAN must be exactly 10 characters</p>
                    )}
                    {selectedDocumentType === 'gst' && documentNumber.length > 0 && documentNumber.length !== 15 && (
                      <p className="text-xs text-red-500 mt-1">GSTIN must be exactly 15 characters</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Details
                </label>
                <textarea
                  rows={4}
                  value={verificationFormData.additionalDetails}
                  onChange={(e) => setVerificationFormData({...verificationFormData, additionalDetails: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Any additional information you want to provide (optional)"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowVerificationModal(false);
                    setShowPurchaseModal(true); // Go back to purchase modal
                    setVerificationFormData({
                      businessName: '',
                      businessAddress: '',
                      businessPhone: '',
                      businessEmail: '',
                      businessRegistrationNumber: '',
                      gstNumber: '',
                      panNumber: '',
                      additionalDetails: ''
                    });
                    setSelectedDocumentType('');
                    setDocumentNumber('');
                    setPhoneError('');
                    delete window.pendingVerificationDetails;
                  }}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={verificationSubmitting}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={verificationSubmitting}
                  className="flex-1 py-2 px-4 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {verificationSubmitting ? 'Processing...' : 'Proceed to Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

