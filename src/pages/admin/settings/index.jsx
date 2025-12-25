import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/admin/ui/Card';
import { Button } from '../../../components/admin/ui/Button';
import { Modal } from '../../../components/admin/ui/Modal';
import { Input } from '../../../components/admin/ui/Input';
import { authAPI, paymentConfigAPI, emailConfigAPI, googleMapsConfigAPI, legalPagesAPI } from '../../../services/admin/api';
import { setTheme, getTheme } from '../../../utils/theme';
import toast from 'react-hot-toast';
import { User, Lock, Moon, Sun, LogOut, Trash2, CreditCard, Eye, EyeOff, MapPin, FileText, ChevronDown, Mail } from 'lucide-react';

export const Settings = () => {
  const [profile, setProfile] = useState({ name: '', email: '' });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [theme, setThemeState] = useState(getTheme());
  const [loading, setLoading] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState({
    razorpayKeyId: '',
    razorpayKeySecret: '',
  });
  const [showSecret, setShowSecret] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [googleMapsConfig, setGoogleMapsConfig] = useState({
    googleMapsApiKey: '',
  });
  const [showMapsKey, setShowMapsKey] = useState(false);
  const [mapsLoading, setMapsLoading] = useState(false);
  const [emailConfig, setEmailConfig] = useState({
    smtpUsername: '',
    smtpPassword: '',
    smtpHost: '',
    mailDriver: '',
    smtpPort: '',
    smtpSecurity: '',
    smtpAuthDomain: '',
    smtpAddress: '',
    emailFromAddress: '',
    emailFromName: '',
    replyEmailAddress: '',
    replyEmailName: '',
    adminNotificationEmail: '',
  });
  const [showEmailPassword, setShowEmailPassword] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [selectedLegalPage, setSelectedLegalPage] = useState('privacy-policy');
  const [legalPageData, setLegalPageData] = useState({
    title: '',
    content: '',
    isActive: true,
  });
  const [legalPageLoading, setLegalPageLoading] = useState(false);
  const [legalPageSaving, setLegalPageSaving] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchPaymentConfig();
    fetchEmailConfig();
    fetchGoogleMapsConfig();
    fetchLegalPage();
  }, [selectedLegalPage]);

  const fetchProfile = async () => {
    try {
      const response = await authAPI.getProfile();
      setProfile(response.data || {});
    } catch (error) {
      toast.error('Failed to load profile');
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.updateProfile(profile);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await authAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success('Password changed successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    setThemeState(newTheme);
    toast.success(`Theme changed to ${newTheme}`);
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      localStorage.removeItem('admin_token');
      toast.success('Logged out successfully');
      window.location.href = '/login';
    } catch (error) {
      localStorage.removeItem('admin_token');
      window.location.href = '/login';
    }
  };

  const handleDeleteAccount = () => {
    setConfirmAction({ type: 'delete-account' });
  };

const handleConfirmAction = async () => {
  if (confirmAction?.type === 'delete-account') {
    setActionLoading(true);
    toast.error('Account deletion not implemented');
    setActionLoading(false);
    setConfirmAction(null);
  }
};

  const fetchPaymentConfig = async () => {
    try {
      const response = await paymentConfigAPI.get();
      if (response.data?.config) {
        setPaymentConfig({
          razorpayKeyId: response.data.config.razorpayKeyId || '',
          razorpayKeySecret: '', // Don't load masked secret, user needs to enter full key to update
        });
      }
    } catch (error) {
      console.error('Failed to load payment config:', error);
    }
  };

  const handlePaymentConfigUpdate = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!paymentConfig.razorpayKeyId || !paymentConfig.razorpayKeySecret) {
    toast.error('Project Code and Secret are required');
      return;
    }
    
    setPaymentLoading(true);
    try {
      const response = await paymentConfigAPI.update(paymentConfig);
      
      if (response.data?.success) {
        toast.success('Payment configuration updated successfully');
        // Clear secret field after successful update (for security)
        setPaymentConfig({
          ...paymentConfig,
          razorpayKeySecret: '', // Clear secret field
        });
        setShowSecret(false);
        // Reload config to get updated Key ID
        fetchPaymentConfig();
      } else {
        toast.error(response.data?.message || 'Failed to update payment configuration');
      }
    } catch (error) {
      console.error('Payment config update error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update payment configuration';
      toast.error(errorMessage);
    } finally {
      setPaymentLoading(false);
    }
  };

  const fetchEmailConfig = async () => {
    try {
      const response = await emailConfigAPI.get();
      console.log('Email config response:', response.data);
      if (response.data?.success && response.data?.config) {
        const config = response.data.config;
        const emailConfigData = {
          smtpUsername: config.smtpUsername || '',
          smtpPassword: '', // Don't load masked password
          smtpHost: config.smtpHost || '',
          mailDriver: config.mailDriver || '',
          smtpPort: config.smtpPort?.toString() || '',
          smtpSecurity: config.smtpSecurity || '',
          smtpAuthDomain: config.smtpAuthDomain || '',
          smtpAddress: config.smtpAddress || '',
          emailFromAddress: config.emailFromAddress || '',
          emailFromName: config.emailFromName || '',
          replyEmailAddress: config.replyEmailAddress || '',
          replyEmailName: config.replyEmailName || '',
          adminNotificationEmail: config.adminNotificationEmail || '',
        };
        console.log('Setting email config:', emailConfigData);
        setEmailConfig(emailConfigData);
      } else {
        console.warn('Email config response format unexpected:', response.data);
      }
    } catch (error) {
      console.error('Failed to load email config:', error);
      console.error('Error details:', error.response?.data || error.message);
    }
  };

  const handleEmailConfigUpdate = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!emailConfig.smtpUsername || !emailConfig.smtpHost || !emailConfig.mailDriver || 
        !emailConfig.smtpPort || !emailConfig.smtpSecurity || !emailConfig.emailFromAddress || 
        !emailConfig.emailFromName) {
      toast.error('Please fill all required fields');
      return;
    }
    
    // Warning if admin notification email is not set
    if (!emailConfig.adminNotificationEmail) {
      const confirm = window.confirm('Admin Notification Email is not set. Vendor registration emails will be sent to all admin users. Continue anyway?');
      if (!confirm) {
        return;
      }
    }
    
    setEmailLoading(true);
    try {
      const response = await emailConfigAPI.update(emailConfig);
      
      if (response.data?.success) {
        toast.success('Email configuration updated successfully');
        // Clear password field after successful update (for security)
        setEmailConfig({
          ...emailConfig,
          smtpPassword: '',
        });
        setShowEmailPassword(false);
        // Reload config
        fetchEmailConfig();
      } else {
        toast.error(response.data?.message || 'Failed to update email configuration');
      }
    } catch (error) {
      console.error('Email config update error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update email configuration';
      toast.error(errorMessage);
    } finally {
      setEmailLoading(false);
    }
  };

  const fetchGoogleMapsConfig = async () => {
    try {
      const response = await googleMapsConfigAPI.get();
      if (response.data?.config) {
        setGoogleMapsConfig({
          googleMapsApiKey: '', // Don't load masked key, user needs to enter full key to update
        });
      }
    } catch (error) {
      console.error('Failed to load Google Maps config:', error);
    }
  };

  const fetchLegalPage = async () => {
    try {
      setLegalPageLoading(true);
      const response = await legalPagesAPI.getByType(selectedLegalPage);
      if (response.data?.success && response.data?.legalPage) {
        setLegalPageData({
          title: response.data.legalPage.title || '',
          content: response.data.legalPage.content || '',
          isActive: response.data.legalPage.isActive !== undefined ? response.data.legalPage.isActive : true,
        });
      }
    } catch (error) {
      console.error('Failed to load legal page:', error);
      // Set defaults if page doesn't exist
      const defaultTitles = {
        'privacy-policy': 'Privacy Policy',
        'terms-of-service': 'Terms of Service',
        'cookie-policy': 'Cookie Policy',
        'about-us': 'About VenueBook',
      };
      setLegalPageData({
        title: defaultTitles[selectedLegalPage] || '',
        content: '',
        isActive: true,
      });
    } finally {
      setLegalPageLoading(false);
    }
  };

  const handleLegalPageUpdate = async (e) => {
    e.preventDefault();
    
    if (!legalPageData.title || !legalPageData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    
    if (!legalPageData.content || !legalPageData.content.trim()) {
      toast.error('Content is required');
      return;
    }
    
    setLegalPageSaving(true);
    try {
      const response = await legalPagesAPI.update(selectedLegalPage, {
        title: legalPageData.title.trim(),
        content: legalPageData.content.trim(),
        isActive: legalPageData.isActive,
      });
      
      if (response.data?.success) {
        toast.success('Legal page updated successfully');
        fetchLegalPage();
      } else {
        toast.error(response.data?.message || 'Failed to update legal page');
      }
    } catch (error) {
      console.error('Legal page update error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update legal page';
      toast.error(errorMessage);
    } finally {
      setLegalPageSaving(false);
    }
  };

  const handleGoogleMapsConfigUpdate = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!googleMapsConfig.googleMapsApiKey || !googleMapsConfig.googleMapsApiKey.trim()) {
      toast.error('Google Maps API Key is required');
      return;
    }
    
    // Validate Key format
    const trimmedKey = googleMapsConfig.googleMapsApiKey.trim();
    if (!trimmedKey.startsWith('AIza')) {
      toast.error('Invalid Google Maps API Key format. Key should start with "AIza"');
      return;
    }
    
    // Validate Key length
    if (trimmedKey.length < 30) {
      toast.error('Invalid Google Maps API Key. Key seems too short.');
      return;
    }
    
    setMapsLoading(true);
    try {
      const response = await googleMapsConfigAPI.update({
        googleMapsApiKey: trimmedKey,
      });
      
      if (response.data?.success) {
        toast.success('Google Maps API key updated successfully');
        // Clear key field after successful update (for security)
        setGoogleMapsConfig({
          googleMapsApiKey: '',
        });
        setShowMapsKey(false);
        // Reload config
        fetchGoogleMapsConfig();
      } else {
        toast.error(response.data?.message || 'Failed to update Google Maps API key');
      }
    } catch (error) {
      console.error('Google Maps config update error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update Google Maps API key';
      toast.error(errorMessage);
    } finally {
      setMapsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your account settings</p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <Input
              label="Name"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            />
            <Button type="submit" loading={loading}>
              Update Profile
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
            />
            <Input
              label="New Password"
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
            />
            <Input
              label="Confirm New Password"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
            />
            <Button type="submit" loading={loading}>
              Change Password
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Payment Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Configuration (Razorpay)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePaymentConfigUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Razorpay Key ID</label>
              <Input
                type="text"
                value={paymentConfig.razorpayKeyId}
                onChange={(e) => setPaymentConfig({ ...paymentConfig, razorpayKeyId: e.target.value })}
                placeholder="rzp_test_xxxxxxxxxxxxx"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Razorpay Key Secret</label>
              <div className="relative">
                <Input
                  type={showSecret ? 'text' : 'password'}
                  value={paymentConfig.razorpayKeySecret}
                  onChange={(e) => setPaymentConfig({ ...paymentConfig, razorpayKeySecret: e.target.value })}
                  placeholder="Enter full Razorpay Key Secret to update"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {showSecret ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Enter the full secret key to update. For security, the saved key is not displayed.
                {paymentConfig.razorpayKeySecret && (
                  <span className="block mt-1 text-green-600 dark:text-green-400">
                    ✓ Secret key entered ({paymentConfig.razorpayKeySecret.length} characters)
                  </span>
                )}
              </p>
            </div>
            <Button type="submit" loading={paymentLoading}>
              Update Payment Configuration
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Email Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Configuration (SMTP)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailConfigUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">SMTP Username</label>
                <Input
                  type="text"
                  value={emailConfig.smtpUsername}
                  onChange={(e) => setEmailConfig({ ...emailConfig, smtpUsername: e.target.value })}
                  placeholder="emailapikey"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">SMTP Password</label>
                <div className="relative">
                  <Input
                    type={showEmailPassword ? 'text' : 'password'}
                    value={emailConfig.smtpPassword}
                    onChange={(e) => setEmailConfig({ ...emailConfig, smtpPassword: e.target.value })}
                    placeholder="Enter full SMTP Password to update"
                    required={!emailConfig.smtpPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowEmailPassword(!showEmailPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {showEmailPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Enter the full password to update. For security, the saved password is not displayed.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">SMTP Host</label>
                <Input
                  type="text"
                  value={emailConfig.smtpHost}
                  onChange={(e) => setEmailConfig({ ...emailConfig, smtpHost: e.target.value })}
                  placeholder="smtp.zeptomail.in"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Mail Driver</label>
                <Input
                  type="text"
                  value={emailConfig.mailDriver}
                  onChange={(e) => setEmailConfig({ ...emailConfig, mailDriver: e.target.value })}
                  placeholder="smtp"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">SMTP Port</label>
                <Input
                  type="number"
                  value={emailConfig.smtpPort}
                  onChange={(e) => setEmailConfig({ ...emailConfig, smtpPort: e.target.value })}
                  placeholder="465"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">SMTP Security</label>
                <Input
                  type="text"
                  value={emailConfig.smtpSecurity}
                  onChange={(e) => setEmailConfig({ ...emailConfig, smtpSecurity: e.target.value })}
                  placeholder="ssl"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">SMTP Authentication Domain</label>
                <Input
                  type="text"
                  value={emailConfig.smtpAuthDomain}
                  onChange={(e) => setEmailConfig({ ...emailConfig, smtpAuthDomain: e.target.value })}
                  placeholder="true"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">SMTP Address</label>
                <Input
                  type="email"
                  value={emailConfig.smtpAddress}
                  onChange={(e) => setEmailConfig({ ...emailConfig, smtpAddress: e.target.value })}
                  placeholder="noreply@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email From Address *</label>
                <Input
                  type="email"
                  value={emailConfig.emailFromAddress}
                  onChange={(e) => setEmailConfig({ ...emailConfig, emailFromAddress: e.target.value })}
                  placeholder="noreply@shubhvenue.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email From Name *</label>
                <Input
                  type="text"
                  value={emailConfig.emailFromName}
                  onChange={(e) => setEmailConfig({ ...emailConfig, emailFromName: e.target.value })}
                  placeholder="ShubhVenue"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Reply Email Address</label>
                <Input
                  type="email"
                  value={emailConfig.replyEmailAddress}
                  onChange={(e) => setEmailConfig({ ...emailConfig, replyEmailAddress: e.target.value })}
                  placeholder="support@shubhvenue.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Reply Email Name</label>
                <Input
                  type="text"
                  value={emailConfig.replyEmailName}
                  onChange={(e) => setEmailConfig({ ...emailConfig, replyEmailName: e.target.value })}
                  placeholder="ShubhVenue Support"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Admin Notification Email <span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  value={emailConfig.adminNotificationEmail}
                  onChange={(e) => setEmailConfig({ ...emailConfig, adminNotificationEmail: e.target.value })}
                  placeholder="admin@example.com"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  This email will receive notifications when vendors register. If not set, all admin users will receive emails.
                </p>
              </div>
            </div>
            <Button type="submit" loading={emailLoading}>
              Update Email Configuration
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Google Maps Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Google Maps Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGoogleMapsConfigUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Google Maps API Key</label>
              <div className="relative">
                <Input
                  type={showMapsKey ? 'text' : 'password'}
                  value={googleMapsConfig.googleMapsApiKey}
                  onChange={(e) => setGoogleMapsConfig({ ...googleMapsConfig, googleMapsApiKey: e.target.value })}
                  placeholder="AIzaSyCUEfJCSWFJNz7tUZMR7G77avJoSnq-dRA"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowMapsKey(!showMapsKey)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {showMapsKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Enter the full API key to update. For security, the saved key is not displayed.
                {googleMapsConfig.googleMapsApiKey && (
                  <span className="block mt-1 text-green-600 dark:text-green-400">
                    ✓ API key entered ({googleMapsConfig.googleMapsApiKey.length} characters)
                  </span>
                )}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                💡 Get your API key from{' '}
                <a 
                  href="https://console.cloud.google.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline hover:text-blue-800 dark:hover:text-blue-300"
                >
                  Google Cloud Console
                </a>
                . Enable Places API and Maps JavaScript API.
              </p>
            </div>
            <Button type="submit" loading={mapsLoading}>
              Update Google Maps API Key
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Legal Pages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Legal Pages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLegalPageUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Page</label>
              <div className="relative">
                <select
                  value={selectedLegalPage}
                  onChange={(e) => setSelectedLegalPage(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
                  disabled={legalPageLoading}
                >
                  <option value="privacy-policy">Privacy Policy</option>
                  <option value="terms-of-service">Terms of Service</option>
                  <option value="cookie-policy">Cookie Policy</option>
                  <option value="about-us">About Us</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
              </div>
            </div>
            
            {legalPageLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading...</p>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <Input
                    type="text"
                    value={legalPageData.title}
                    onChange={(e) => setLegalPageData({ ...legalPageData, title: e.target.value })}
                    placeholder="Enter page title"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Content</label>
                  <textarea
                    value={legalPageData.content}
                    onChange={(e) => setLegalPageData({ ...legalPageData, content: e.target.value })}
                    placeholder="Enter page content (supports line breaks)"
                    required
                    rows={15}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-y"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Use line breaks to separate paragraphs. HTML formatting is supported.
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="legalPageActive"
                    checked={legalPageData.isActive}
                    onChange={(e) => setLegalPageData({ ...legalPageData, isActive: e.target.checked })}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="legalPageActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Active (visible to users)
                  </label>
                </div>
                
                <Button type="submit" loading={legalPageSaving}>
                  Update Legal Page
                </Button>
              </>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {theme === 'light' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Theme</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Switch between light and dark mode
              </p>
            </div>
            <Button onClick={toggleTheme} variant="secondary">
              {theme === 'light' ? 'Switch to Dark' : 'Switch to Light'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card>
        <CardHeader>
          <CardTitle className="text-red-500">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-800 rounded-lg">
            <div>
              <p className="font-medium text-red-600 dark:text-red-400">Logout</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Sign out from your account
              </p>
            </div>
            <Button variant="danger" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-800 rounded-lg">
            <div>
              <p className="font-medium text-red-600 dark:text-red-400">Delete Account</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Permanently delete your account and all data
              </p>
            </div>
            <Button variant="danger" onClick={handleDeleteAccount}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      <Modal
        isOpen={!!confirmAction}
        onClose={() => {
          if (!actionLoading) setConfirmAction(null);
        }}
        title="Delete Account"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-200">
            Are you sure you want to delete your account? This action cannot be undone.
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
              onClick={handleConfirmAction}
              disabled={actionLoading}
            >
              {actionLoading ? 'Please wait...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};


