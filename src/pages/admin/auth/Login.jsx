import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { authAPI } from '../../../services/admin/api';
import { Button } from '../../../components/admin/ui/Button';
import toast from 'react-hot-toast';

export const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      let response;
      let loginType = null;
      
      // Try admin login first
      try {
        response = await authAPI.login(formData);
        // Check if response has token
        if (response?.data?.token) {
          loginType = 'admin';
        } else {
          throw new Error('Invalid admin response');
        }
      } catch (adminError) {
        // Only try staff login if admin login failed with 401 (invalid credentials) or 404
        // Don't try staff login for other errors like 403, 503, etc.
        if (adminError.response?.status === 401 || adminError.response?.status === 404) {
          try {
            response = await authAPI.loginStaff(formData);
            // Check if response has token
            if (response?.data?.token) {
              loginType = 'staff';
            } else {
              throw new Error('Invalid staff response');
            }
          } catch (staffError) {
            // Both failed, throw staff error
            throw staffError;
          }
        } else {
          // Admin login failed with non-401/404 error, don't try staff
          throw adminError;
        }
      }

      // If we have a successful login
      if (loginType && response?.data?.token) {
        localStorage.setItem('admin_token', response.data.token);
        localStorage.setItem('admin_role', loginType);
        
        // Store permissions if available (for staff)
        if (loginType === 'staff') {
          // Staff login response structure
          if (response.data.staff?.role?.permissions) {
            localStorage.setItem('admin_permissions', JSON.stringify(response.data.staff.role.permissions));
          } else {
            // If no permissions in response, set empty array
            localStorage.setItem('admin_permissions', JSON.stringify([]));
          }
        } else {
          // Admin has all permissions
          localStorage.setItem('admin_permissions', JSON.stringify(['*']));
        }
        
        const roleLabel = loginType === 'admin' ? 'Admin' : 'Staff';
        toast.success(`Login successful! Welcome, ${roleLabel}!`);
        navigate('/admin/dashboard');
      } else {
        throw new Error('Login failed: Invalid response');
      }
    } catch (error) {
      // Get error message from response
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Login failed. Please check your credentials.';
      toast.error(errorMessage);
      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white dark:bg-gray-900">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-8 md:p-10">
          {/* Logo/Header Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center justify-center mb-4">
              <img 
                src="/image/venuebook.png" 
                alt="ShubhVenue Logo" 
                className="w-16 h-16 object-contain"
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0idXJsKCNncmFkaWVudCkiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSI+CjxwYXRoIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0wIDNjMS42NiAwIDMgMS4zNCAzIDNzLTEuMzQgMy0zIDMtMy0xLjM0LTMtMyAxLjM0LTMgMy0zem0wIDE0LjJjLTIuNjcgMC04IDEuMzQtOCA0djEuOGgxNnYtMS44YzAtMi42Ni01LjMzLTQtOC00eiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9ImdyYWRpZW50IiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj4KPHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6Izk0NDg3QTtzdG9wLW9wYWNpdHk6MSIgLz4KPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojRUM0ODk5O3N0b3Atb3BhY2l0eToxIiAvPgo8L2xpbmVhckdyYWRpZW50Pgo8L2RlZnM+Cjwvc3ZnPg=='
                }}
              />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              ShubhVenue
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Admin / Staff Portal Login
            </p>
          </motion.div>

          {/* Form Section */}
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (errors.email) setErrors({ ...errors, email: '' });
                  }}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${
                    errors.email
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 dark:border-gray-600 focus:ring-primary focus:border-primary'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 transition-all`}
                  required
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    if (errors.password) setErrors({ ...errors, password: '' });
                  }}
                  className={`w-full pl-10 pr-12 py-2.5 rounded-lg border ${
                    errors.password
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 dark:border-gray-600 focus:ring-primary focus:border-primary'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 transition-all`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password}</p>
              )}
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{errors.submit}</p>
              </div>
            )}

            {/* Login Button */}
            <Button
              type="submit"
              className="w-full mt-6 py-3 text-base font-medium"
              loading={loading}
              disabled={loading}
            >
              {loading ? (
                'Logging in...'
              ) : (
                'Login to Dashboard'
              )}
            </Button>
          </motion.form>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 text-center"
          >
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Secure admin and staff access
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};







