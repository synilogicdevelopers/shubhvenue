import { useState, useMemo, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Store,
  MapPin,
  Calendar,
  DollarSign,
  BarChart3,
  Settings,
  Menu,
  X,
  UserPlus,
  Tag,
  Menu as MenuIcon,
  Video as VideoIcon,
  MessageSquare,
  HelpCircle,
  Building2,
  Mail,
  ChevronDown,
  ChevronRight,
  UserCog,
  Shield,
  Star,
} from 'lucide-react';
import { cn } from '../../../utils/admin/cn';
import { getUserPermissions, isAdmin, hasPermission as checkPermission } from '../../../utils/admin/permissions';

// Menu items with required permissions
const allMenuItems = [
  { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard', permission: 'view_dashboard' },
  { path: '/admin/users', icon: Users, label: 'Users', permission: 'view_users' },
  { path: '/admin/vendors', icon: Store, label: 'Vendors', permission: 'view_vendors' },
  { path: '/admin/vendor-categories', icon: Tag, label: 'Vendor Categories', permission: 'view_vendors' },
  { path: '/admin/venues', icon: MapPin, label: 'Venues', permission: 'view_venues' },
  { path: '/admin/categories', icon: Tag, label: 'Categories', permission: 'view_categories' },
  { path: '/admin/menus', icon: MenuIcon, label: 'Menus', permission: 'view_menus' },
  { path: '/admin/videos', icon: VideoIcon, label: 'Videos', permission: 'view_videos' },
  { path: '/admin/leads', icon: UserPlus, label: 'Leads', permission: 'view_leads' },
  { path: '/admin/bookings', icon: Calendar, label: 'Bookings', permission: 'view_bookings' },
  { path: '/admin/payouts', icon: DollarSign, label: 'Payouts', permission: 'view_payouts' },
  { path: '/admin/reviews', icon: Star, label: 'Reviews', permission: 'view_reviews' },
  {
    label: 'Staff',
    icon: UserCog,
    permission: 'view_staff',
    children: [
      { path: '/admin/roles', label: 'Roles', icon: Shield, permission: 'view_roles' },
      { path: '/admin/staff', label: 'Staff', permission: 'view_staff' },
    ],
  },
  { path: '/admin/analytics', icon: BarChart3, label: 'Analytics', permission: 'view_analytics' },
  {
    label: 'Settings',
    icon: Settings,
    permission: 'view_settings',
    children: [
      { path: '/admin/testimonials', label: 'Testimonials', icon: MessageSquare, permission: 'view_testimonials' },
      { path: '/admin/faqs', label: 'FAQs', icon: HelpCircle, permission: 'view_faqs' },
      { path: '/admin/company', label: 'Company', icon: Building2, permission: 'view_company' },
      { path: '/admin/contacts', label: 'Contact Us', icon: Mail, permission: 'view_contacts' },
      { path: '/admin/settings', label: 'General Settings', icon: Settings, permission: 'view_settings' },
    ],
  },
];

// Helper function to check if user has permission
const hasPermission = (permission, userPermissions) => {
  // Dashboard is allowed for all authenticated users
  if (permission === 'view_dashboard') return true;
  // Admin has all permissions
  if (isAdmin()) return true;
  if (!userPermissions || userPermissions.length === 0) return false;
  // Check specific permission
  return userPermissions.includes(permission);
};

export const Sidebar = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState({ Staff: true, Settings: true });
  const location = useLocation();
  const navRef = useRef(null);
  const savedScrollPosition = useRef(0);
  const isRestoringScroll = useRef(false);

  // Get user permissions from localStorage
  const userPermissions = useMemo(() => getUserPermissions(), []);
  const isUserAdmin = useMemo(() => isAdmin(), []);

  // Filter menu items based on permissions
  const menuItems = useMemo(() => {
    return allMenuItems
      .map((item) => {
        // If no permission required, show it (shouldn't happen, but safety check)
        if (!item.permission) return item;
        
        // Check if user has permission for this item
        if (!hasPermission(item.permission, userPermissions)) return null;
        
        // For items with children, filter children based on permissions
        if (item.children) {
          const accessibleChildren = item.children.filter((child) => {
            if (!child.permission) return true;
            return hasPermission(child.permission, userPermissions);
          });
          
          // Only show parent if at least one child is accessible
          if (accessibleChildren.length === 0) return null;
          
          // Return item with filtered children
          return {
            ...item,
            children: accessibleChildren,
          };
        }
        
        return item;
      })
      .filter((item) => item !== null);
  }, [userPermissions]);

  const SidebarContent = ({ onClose }) => (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-3 mb-2">
          <img 
            src="/image/venuebook.png" 
            alt="ShubhVenue Logo" 
            className="w-10 h-10 object-contain"
            onError={(e) => {
              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0idXJsKCNncmFkaWVudCkiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSI+CjxwYXRoIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0wIDNjMS42NiAwIDMgMS4zNCAzIDNzLTEuMzQgMy0zIDMtMy0xLjM0LTMtMyAxLjM0LTMgMy0zem0wIDE0LjJjLTIuNjcgMC04IDEuMzQtOCA0djEuOGgxNnYtMS44YzAtMi42Ni01LjMzLTQtOC00eiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9ImdyYWRpZW50IiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj4KPHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6Izk0NDg3QTtzdG9wLW9wYWNpdHk6MSIgLz4KPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojRUM0ODk5O3N0b3Atb3BhY2l0eToxIiAvPgo8L2xpbmVhckdyYWRpZW50Pgo8L2RlZnM+Cjwvc3ZnPg=='
            }}
          />
          <h1 className="text-2xl font-bold gradient-text">
            ShubhVenue
          </h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">Admin Panel</p>
      </div>

      {/* Menu Items */}
      <nav 
        ref={navRef} 
        className="flex-1 p-4 space-y-2 overflow-y-auto"
        onScroll={(e) => {
          // If we're restoring scroll, prevent any changes
          if (isRestoringScroll.current) {
            e.target.scrollTop = savedScrollPosition.current;
            return;
          }
          // Save current scroll position
          savedScrollPosition.current = e.target.scrollTop;
        }}
      >
        {menuItems.map((item) => {
          const Icon = item.icon;

          if (item.children) {
            const isAnyChildActive = item.children.some((child) =>
              location.pathname.startsWith(child.path)
            );
            const isOpen = openSubmenus[item.label] ?? isAnyChildActive;

            return (
              <div key={item.label} className="space-y-1">
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Save current scroll position before state change
                    const scrollPosition = navRef.current?.scrollTop || 0;
                    savedScrollPosition.current = scrollPosition;
                    isRestoringScroll.current = true;
                    
                    setOpenSubmenus((prev) => ({
                      ...prev,
                      [item.label]: !isOpen,
                    }));
                    
                    // Restore scroll position multiple times
                    const restoreScroll = () => {
                      if (navRef.current && isRestoringScroll.current) {
                        navRef.current.scrollTop = scrollPosition;
                        savedScrollPosition.current = scrollPosition;
                      }
                    };
                    
                    // Immediate
                    restoreScroll();
                    
                    // After frame
                    requestAnimationFrame(() => {
                      restoreScroll();
                      requestAnimationFrame(() => {
                        restoreScroll();
                      });
                    });
                    
                    // Multiple timeouts to catch any delayed scrolls
                    setTimeout(restoreScroll, 0);
                    setTimeout(restoreScroll, 10);
                    setTimeout(restoreScroll, 50);
                    setTimeout(() => {
                      restoreScroll();
                      isRestoringScroll.current = false;
                    }, 150);
                  }}
                  onMouseDown={(e) => {
                    // Prevent default to avoid focus and scroll
                    e.preventDefault();
                    // Save scroll position
                    if (navRef.current) {
                      savedScrollPosition.current = navRef.current.scrollTop;
                      isRestoringScroll.current = true;
                    }
                    // Trigger click manually
                    const button = e.currentTarget;
                    setTimeout(() => {
                      button.click();
                    }, 0);
                  }}
                  onFocus={(e) => {
                    // Immediately blur to prevent scroll
                    e.target.blur();
                  }}
                  style={{ outline: 'none', cursor: 'pointer' }}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 font-medium',
                    isAnyChildActive
                      ? 'gradient-primary text-white shadow-md'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                >
                  <span className="flex items-center gap-3">
                    <Icon className={cn('w-5 h-5', isAnyChildActive && 'text-white')} />
                    {item.label}
                  </span>
                  {isOpen ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
                {isOpen && (
                  <div className="pl-10 space-y-1">
                    {item.children.map((child) => {
                      const ChildIcon = child.icon;
                      const isActiveChild =
                        location.pathname === child.path ||
                        location.pathname.startsWith(child.path);
                      return (
                        <Link
                          key={child.path}
                          to={child.path}
                          onClick={onClose}
                          className={cn(
                            'flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium',
                            isActiveChild
                              ? 'gradient-primary text-white shadow-md'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                          )}
                        >
                          {ChildIcon ? (
                            <ChildIcon className={cn('w-4 h-4', isActiveChild && 'text-white')} />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600" />
                          )}
                          <span>{child.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const isActive =
            location.pathname === item.path ||
            (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path));

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium',
                isActive
                  ? 'gradient-primary text-white shadow-md'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              )}
            >
              <Icon className={cn('w-5 h-5', isActive && 'text-white')} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-20">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {isMobileOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-50 lg:hidden"
          >
            <div className="p-4 flex justify-end">
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <SidebarContent onClose={() => setIsMobileOpen(false)} />
          </motion.aside>
        </>
      )}
    </>
  );
};

