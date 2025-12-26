import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/vendor/AuthContext'
import { trackPageView } from '../../utils/vendor/analytics'
import { getVendorPermissions, hasVendorPermission, isVendorOwner } from '../../utils/vendor/permissions'
import { 
  LayoutDashboard, 
  MapPin, 
  Calendar, 
  Wallet, 
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  BookOpen,
  MessageSquare,
  Settings,
  UserCog,
  Shield
} from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [dashboardDropdownOpen, setDashboardDropdownOpen] = useState(false)
  const [staffDropdownOpen, setStaffDropdownOpen] = useState(false)

  // All navigation items with permissions
  const allNavigationItems = [
    { 
      name: 'Dashboard', 
      href: '/vendor/', 
      icon: LayoutDashboard,
      permission: 'vendor_view_dashboard',
      hasDropdown: true,
      dropdownItems: [
        { name: 'Overview', href: '/vendor/', icon: LayoutDashboard, permission: 'vendor_view_dashboard' },
        { name: 'Ledger', href: '/vendor/ledger', icon: BookOpen, permission: 'vendor_view_ledger' },
      ]
    },
    { name: 'Venues', href: '/vendor/venues', icon: MapPin, permission: 'vendor_view_venues' },
    { name: 'Bookings', href: '/vendor/bookings', icon: Calendar, permission: 'vendor_view_bookings' },
    { name: 'Reviews', href: '/vendor/reviews', icon: MessageSquare, permission: 'vendor_view_reviews' },
    { name: 'Payouts', href: '/vendor/payouts', icon: Wallet, permission: 'vendor_view_payouts' },
    {
      name: 'Staff',
      href: '/vendor/staff',
      icon: UserCog,
      permission: null, // Only vendor owners can access (no permission check needed)
      ownerOnly: true, // Only show to vendor owners
      hasDropdown: true,
      dropdownItems: [
        { name: 'Roles', href: '/vendor/roles', icon: Shield, permission: null, ownerOnly: true },
        { name: 'Staff', href: '/vendor/staff', icon: UserCog, permission: null, ownerOnly: true },
      ]
    },
    { name: 'Settings', href: '/vendor/settings', icon: Settings, permission: 'vendor_view_profile' },
  ]

  // Get user permissions and filter navigation items
  const userPermissions = useMemo(() => getVendorPermissions(), [])
  const isOwner = useMemo(() => isVendorOwner(), [])
  
  // Filter navigation items based on permissions
  const navigation = useMemo(() => {
    return allNavigationItems
      .map((item) => {
        // If item is owner-only, only show to vendor owners
        if (item.ownerOnly && !isOwner) return null;
        
        // Vendor owners see everything (except items that are explicitly hidden)
        if (isOwner) return item;
        
        // If no permission required, show it
        if (!item.permission) return item;
        
        // Check if user has permission for this item
        if (!hasVendorPermission(item.permission)) return null;
        
        // For items with dropdown, filter children based on permissions
        if (item.hasDropdown && item.dropdownItems) {
          const accessibleChildren = item.dropdownItems.filter((child) => {
            // Owner-only items only for owners
            if (child.ownerOnly && !isOwner) return false;
            if (!child.permission) return true;
            return hasVendorPermission(child.permission);
          });
          
          // Only show parent if at least one child is accessible
          if (accessibleChildren.length === 0) return null;
          
          // Return item with filtered children
          return {
            ...item,
            dropdownItems: accessibleChildren,
          };
        }
        
        return item;
      })
      .filter((item) => item !== null);
  }, [userPermissions, isOwner])

  const handleLogout = () => {
    logout()
    navigate('/vendor/login')
  }

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

  // Auto-open dropdown if on ledger page
  useEffect(() => {
    if (location.pathname === '/vendor/ledger') {
      setDashboardDropdownOpen(true)
    }
    if (location.pathname === '/vendor/staff' || location.pathname === '/vendor/roles') {
      setStaffDropdownOpen(true)
    }
  }, [location.pathname])

  // Track page views with Analytics
  useEffect(() => {
    const pageName = location.pathname === '/vendor/' || location.pathname === '/vendor' ? 'Dashboard' : location.pathname.replace('/vendor/', '')
    trackPageView(pageName)
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <img 
                src="/image/venuebook.png" 
                alt="ShubhVenue Logo" 
                className="w-10 h-10 object-contain"
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0idXJsKCNncmFkaWVudCkiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSI+CjxwYXRoIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0wIDNjMS42NiAwIDMgMS4zNCAzIDNzLTEuMzQgMy0zIDMtMy0xLjM0LTMtMyAxLjM0LTMgMy0zem0wIDE0LjJjLTIuNjcgMC04IDEuMzQtOCA0djEuOGgxNnYtMS44YzAtMi42Ni01LjMzLTQtOC00eiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9ImdyYWRpZW50IiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj4KPHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6Izk0NDg3QTtzdG9wLW9wYWNpdHk6MSIgLz4KPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojRUM0ODk5O3N0b3Atb3BhY2l0eToxIiAvPgo8L2xpbmVhckdyYWRpZW50Pgo8L2RlZnM+Cjwvc3ZnPg=='
                }}
              />
              <span className="text-xl font-bold text-gray-900">ShubhVenue Vendor</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href) || (item.hasDropdown && item.dropdownItems?.some(subItem => isActive(subItem.href)))
              
              if (item.hasDropdown && item.dropdownItems && item.dropdownItems.length > 0) {
                const isDashboardDropdown = item.name === 'Dashboard'
                const isStaffDropdown = item.name === 'Staff'
                const dropdownOpen = isDashboardDropdown ? dashboardDropdownOpen : (isStaffDropdown ? staffDropdownOpen : false)
                const setDropdownOpen = isDashboardDropdown ? setDashboardDropdownOpen : (isStaffDropdown ? setStaffDropdownOpen : () => {})
                
                return (
                  <div key={item.name} className="space-y-1">
                    <button
                      onClick={() => {
                        setDropdownOpen(!dropdownOpen)
                        if (!dropdownOpen) {
                          navigate(item.href)
                        }
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                        active
                          ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-600'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className={`w-5 h-5 ${active ? 'text-primary-600' : ''}`} />
                        <span className="font-medium">{item.name}</span>
                      </div>
                      {dropdownOpen ? (
                        <ChevronDown className={`w-4 h-4 ${active ? 'text-primary-600' : 'text-gray-500'}`} />
                      ) : (
                        <ChevronRight className={`w-4 h-4 ${active ? 'text-primary-600' : 'text-gray-500'}`} />
                      )}
                    </button>
                    
                    {/* Dropdown Items */}
                    {dropdownOpen && (
                      <div className="ml-4 space-y-1">
                        {item.dropdownItems.map((subItem) => {
                          const SubIcon = subItem.icon
                          const subActive = isActive(subItem.href)
                          return (
                            <button
                              key={subItem.name}
                              onClick={() => {
                                navigate(subItem.href)
                                setSidebarOpen(false)
                              }}
                              className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors text-sm ${
                                subActive
                                  ? 'bg-primary-100 text-primary-700 font-medium'
                                  : 'text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              <SubIcon className={`w-4 h-4 ${subActive ? 'text-primary-600' : ''}`} />
                              <span>{subItem.name}</span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              }
              
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    navigate(item.href)
                    setSidebarOpen(false)
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    active
                      ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${active ? 'text-primary-600' : ''}`} />
                  <span className="font-medium">{item.name}</span>
                </button>
              )
            })}
          </nav>

          {/* User info and logout */}
          <div className="p-4 border-t border-gray-200">
            <div className="mb-3 px-4 py-2 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-900">{user?.name || 'Vendor'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-10 bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex-1" />
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name || 'Vendor'}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}


