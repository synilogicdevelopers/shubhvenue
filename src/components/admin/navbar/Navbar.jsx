import { useState, useMemo } from 'react';
import { Bell, Moon, Sun, LogOut, User, Shield, UserCog } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { setTheme, getTheme } from '../../../utils/theme';
import { authAPI } from '../../../services/admin/api';
import { getUserRole, isAdmin } from '../../../utils/admin/permissions';
import toast from 'react-hot-toast';

export const Navbar = () => {
  const [theme, setThemeState] = useState(getTheme());
  const navigate = useNavigate();
  
  const userRole = useMemo(() => getUserRole(), []);
  const isUserAdmin = useMemo(() => isAdmin(), []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    setThemeState(newTheme);
  };

  const handleLogout = async () => {
    try {
      // Try to logout on server, but don't wait for it
      authAPI.logout().catch(() => {
        // Silently fail - we'll logout locally anyway
      });
    } catch (error) {
      // Ignore errors
    } finally {
      // Always clear local storage and redirect
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_role');
      localStorage.removeItem('admin_permissions');
      navigate('/admin/login');
    }
  };

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 sticky top-0 z-30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {isUserAdmin ? 'Admin' : 'Staff'} Dashboard
          </h2>
          {/* Role Badge */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
            isUserAdmin 
              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' 
              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
          }`}>
            {isUserAdmin ? (
              <>
                <Shield className="w-3.5 h-3.5" />
                <span>Admin</span>
              </>
            ) : (
              <>
                <UserCog className="w-3.5 h-3.5" />
                <span>Staff</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Notifications */}
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors relative">
            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            )}
          </button>

          {/* User Menu */}
          <div className="flex items-center gap-2 pl-3 border-l border-gray-200 dark:border-gray-700">
            <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

