import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { initTheme } from './utils/theme'

// Customer/Venue Book Routes
import Navbar from './components/customer/Navbar'
import ScrollToTop from './components/customer/ScrollToTop'
import Home from './components/customer/Home'
import VenueDetail from './components/customer/VenueDetail'
import Venue from './pages/customer/Venue'
import Profile from './pages/customer/Profile'
import Booking from './pages/customer/Booking'
import BookingHistory from './pages/customer/BookingHistory'
import ContactVenue from './pages/customer/ContactVenue'
import AboutUs from './pages/customer/AboutUs'
import HowItWorks from './pages/customer/HowItWorks'
import Blog from './pages/customer/Blog'
import PrivacyPolicy from './pages/customer/PrivacyPolicy'
import TermsOfService from './pages/customer/TermsOfService'
import CookiePolicy from './pages/customer/CookiePolicy'
import ContactUs from './pages/customer/ContactUs'
import './App.css'

// Admin Routes
import { PrivateRoute as AdminPrivateRoute } from './components/admin/PrivateRoute'
import { DashboardLayout } from './layouts/admin/DashboardLayout'
import { Login as AdminLogin } from './pages/admin/auth/Login'
import { Dashboard as AdminDashboard } from './pages/admin/dashboard'
import { Users } from './pages/admin/users'
import { Vendors } from './pages/admin/vendors'
import { Venues as AdminVenues } from './pages/admin/venues'
import { Bookings as AdminBookings } from './pages/admin/bookings'
import { Leads } from './pages/admin/leads'
import { Payouts as AdminPayouts } from './pages/admin/payouts'
import { Analytics } from './pages/admin/analytics'
import { Settings as AdminSettings } from './pages/admin/settings'
import { Categories } from './pages/admin/categories'
import { Menus } from './pages/admin/menus'
import { Videos as AdminVideos } from './pages/admin/videos'
import { Testimonials } from './pages/admin/testimonials'
import { FAQs } from './pages/admin/faqs'
import { Company } from './pages/admin/company'
import { Contacts } from './pages/admin/contacts'
import { Banners } from './pages/admin/banners'
import { Staff } from './pages/admin/staff'
import { Roles } from './pages/admin/roles'
import { Reviews as AdminReviews } from './pages/admin/reviews'

// Vendor Routes
import { AuthProvider, useAuth } from './contexts/vendor/AuthContext'
import { useFirebaseNotifications } from './hooks/vendor/useFirebaseNotifications'
import VendorLogin from './pages/vendor/auth/Login'
import Register from './pages/vendor/auth/Register'
import VendorDashboard from './pages/vendor/Dashboard'
import VendorVenues from './pages/vendor/Venues'
import VendorBookings from './pages/vendor/Bookings'
import VendorPayouts from './pages/vendor/Payouts'
import Calendar from './pages/vendor/Calendar'
import Ledger from './pages/vendor/Ledger'
import Reviews from './pages/vendor/Reviews'
import VendorSettings from './pages/vendor/Settings'
import VendorStaff from './pages/vendor/Staff'
import VendorRoles from './pages/vendor/Roles'
import Layout from './components/vendor/Layout'

// Vendor Private Route Component
function VendorPrivateRoute({ children }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }
  
  return user ? children : <Navigate to="/vendor/login" replace />
}

// Vendor Routes Component
function VendorRoutes() {
  useFirebaseNotifications()
  
  return (
    <Routes>
      <Route path="login" element={<VendorLogin />} />
      <Route path="register" element={<Register />} />
      <Route
        path=""
        element={
          <VendorPrivateRoute>
            <Layout />
          </VendorPrivateRoute>
        }
      >
        <Route index element={<VendorDashboard />} />
        <Route path="venues/add" element={<VendorVenues />} />
        <Route path="venues" element={<VendorVenues />} />
        <Route path="bookings" element={<VendorBookings />} />
        <Route path="payouts" element={<VendorPayouts />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="ledger" element={<Ledger />} />
        <Route path="reviews" element={<Reviews />} />
        <Route path="staff" element={<VendorStaff />} />
        <Route path="roles" element={<VendorRoles />} />
        <Route path="settings" element={<VendorSettings />} />
      </Route>
      <Route path="*" element={<Navigate to="/vendor/login" replace />} />
    </Routes>
  )
}

// Customer Routes Component
function CustomerRoutes() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  return (
    <div className="app-wrapper">
      <ScrollToTop />
      <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/venue/:slug" element={<VenueDetail />} />
          <Route path="/venues" element={<Venue />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/contact-venue" element={<ContactVenue />} />
          <Route path="/booking-history" element={<BookingHistory />} />
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />
          <Route path="/contact-us" element={<ContactUs />} />
        </Routes>
      </main>
    </div>
  )
}

// Admin Routes Component
function AdminRoutes() {
  return (
    <Routes>
      <Route path="login" element={<AdminLogin />} />
      <Route
        path=""
        element={
          <AdminPrivateRoute>
            <DashboardLayout>
              <Navigate to="/admin/dashboard" replace />
            </DashboardLayout>
          </AdminPrivateRoute>
        }
      />
      <Route
        path="dashboard"
        element={
          <AdminPrivateRoute>
            <DashboardLayout>
              <AdminDashboard />
            </DashboardLayout>
          </AdminPrivateRoute>
        }
      />
      <Route
        path="users"
        element={
          <AdminPrivateRoute>
            <DashboardLayout>
              <Users />
            </DashboardLayout>
          </AdminPrivateRoute>
        }
      />
      <Route
        path="vendors"
        element={
          <AdminPrivateRoute>
            <DashboardLayout>
              <Vendors />
            </DashboardLayout>
          </AdminPrivateRoute>
        }
      />
      <Route
        path="venues"
        element={
          <AdminPrivateRoute>
            <DashboardLayout>
              <AdminVenues />
            </DashboardLayout>
          </AdminPrivateRoute>
        }
      />
      <Route
        path="bookings"
        element={
          <AdminPrivateRoute>
            <DashboardLayout>
              <AdminBookings />
            </DashboardLayout>
          </AdminPrivateRoute>
        }
      />
      <Route
        path="leads"
        element={
          <AdminPrivateRoute>
            <DashboardLayout>
              <Leads />
            </DashboardLayout>
          </AdminPrivateRoute>
        }
      />
      <Route
        path="payouts"
        element={
          <AdminPrivateRoute>
            <DashboardLayout>
              <AdminPayouts />
            </DashboardLayout>
          </AdminPrivateRoute>
        }
      />
      <Route
        path="analytics"
        element={
          <AdminPrivateRoute>
            <DashboardLayout>
              <Analytics />
            </DashboardLayout>
          </AdminPrivateRoute>
        }
      />
      <Route
        path="settings"
        element={
          <AdminPrivateRoute>
            <DashboardLayout>
              <AdminSettings />
            </DashboardLayout>
          </AdminPrivateRoute>
        }
      />
      <Route
        path="categories"
        element={
          <AdminPrivateRoute>
            <DashboardLayout>
              <Categories />
            </DashboardLayout>
          </AdminPrivateRoute>
        }
      />
      <Route
        path="menus"
        element={
          <AdminPrivateRoute>
            <DashboardLayout>
              <Menus />
            </DashboardLayout>
          </AdminPrivateRoute>
        }
      />
      <Route
        path="videos"
        element={
          <AdminPrivateRoute>
            <DashboardLayout>
              <AdminVideos />
            </DashboardLayout>
          </AdminPrivateRoute>
        }
      />
      <Route
        path="testimonials"
        element={
          <AdminPrivateRoute>
            <DashboardLayout>
              <Testimonials />
            </DashboardLayout>
          </AdminPrivateRoute>
        }
      />
      <Route
        path="faqs"
        element={
          <AdminPrivateRoute>
            <DashboardLayout>
              <FAQs />
            </DashboardLayout>
          </AdminPrivateRoute>
        }
      />
      <Route
        path="company"
        element={
          <AdminPrivateRoute>
            <DashboardLayout>
              <Company />
            </DashboardLayout>
          </AdminPrivateRoute>
        }
      />
      <Route
        path="contacts"
        element={
          <AdminPrivateRoute>
            <DashboardLayout>
              <Contacts />
            </DashboardLayout>
          </AdminPrivateRoute>
        }
      />
      <Route
        path="banners"
        element={
          <AdminPrivateRoute>
            <DashboardLayout>
              <Banners />
            </DashboardLayout>
          </AdminPrivateRoute>
        }
      />
      <Route
        path="staff"
        element={
          <AdminPrivateRoute>
            <DashboardLayout>
              <Staff />
            </DashboardLayout>
          </AdminPrivateRoute>
        }
      />
      <Route
        path="roles"
        element={
          <AdminPrivateRoute>
            <DashboardLayout>
              <Roles />
            </DashboardLayout>
          </AdminPrivateRoute>
        }
      />
      <Route
        path="reviews"
        element={
          <AdminPrivateRoute>
            <DashboardLayout>
              <AdminReviews />
            </DashboardLayout>
          </AdminPrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  )
}

function App() {
  useEffect(() => {
    initTheme()
    
    // Suppress service worker registration messages in development
    if (import.meta.env.DEV) {
      const originalLog = console.log
      console.log = (...args) => {
        if (!args[0]?.includes?.('SW registered') && !args[0]?.includes?.('ServiceWorker')) {
          originalLog(...args)
        }
      }
    }
  }, [])

  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AuthProvider>
        <Routes>
          {/* Admin Routes - /admin/* - Must come before catch-all */}
          <Route path="/admin/*" element={<AdminRoutes />} />
          
          {/* Vendor Routes - /vendor/* - Must come before catch-all */}
          <Route path="/vendor/*" element={<VendorRoutes />} />
          
          {/* Customer/Venue Book Routes - Root level - Catch-all at the end */}
          <Route path="/*" element={<CustomerRoutes />} />
        </Routes>
      </AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'var(--toast-bg, #363636)',
            color: 'var(--toast-color, #fff)',
            borderRadius: '8px',
            padding: '12px 16px',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </Router>
  )
}

export default App

