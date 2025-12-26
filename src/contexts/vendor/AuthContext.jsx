import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../../services/vendor/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('vendor_token')
    const savedUser = localStorage.getItem('vendor_user')
    
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser))
        // Verify token is still valid
        authAPI.getProfile()
          .then((response) => {
            // Handle both user and staff responses
            let userData = response.data.user || response.data.staff || response.data
            
            // If staff response, extract permissions from role
            if (response.data.staff) {
              // Handle both old format (role object) and new format (permissions at top level)
              const staffData = response.data.staff;
              const permissions = staffData.permissions || 
                                 (staffData.role && staffData.role.permissions) || 
                                 (staffData.roleDetails && staffData.roleDetails.permissions) || 
                                 [];
              
              userData = {
                ...staffData,
                permissions: Array.isArray(permissions) ? permissions : [],
                role: 'vendor_staff'
              }
              
              console.log('Vendor Staff Profile Loaded:', {
                email: userData.email,
                role: userData.role,
                permissionsCount: userData.permissions.length,
                permissions: userData.permissions
              });
            }
            
            // Ensure permissions array exists for vendor owners
            if (userData.role === 'vendor' && !userData.permissions) {
              // Vendor owners have all permissions - will be handled by permissions utility
              userData.permissions = []
            }
            
            // Ensure permissions array exists
            if (!userData.permissions) {
              userData.permissions = [];
            }
            
            setUser(userData)
            localStorage.setItem('vendor_user', JSON.stringify(userData))
          })
          .catch(() => {
            localStorage.removeItem('vendor_token')
            localStorage.removeItem('vendor_user')
            setUser(null)
          })
          .finally(() => setLoading(false))
      } catch (error) {
        localStorage.removeItem('vendor_token')
        localStorage.removeItem('vendor_user')
        setLoading(false)
      }
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password)
      const { token, user, staff } = response.data
      
      // Handle both vendor owner and vendor staff login
      let userData = user || staff
      
      // Ensure permissions are included in userData
      if (userData) {
        // For vendor_staff, extract permissions from response
        if (staff) {
          const permissions = staff.permissions || 
                             (staff.role && staff.role.permissions) || 
                             (staff.roleDetails && staff.roleDetails.permissions) || 
                             [];
          userData.permissions = Array.isArray(permissions) ? permissions : [];
          userData.role = 'vendor_staff';
          
          console.log('Vendor Staff Login:', {
            email: userData.email,
            role: userData.role,
            permissionsCount: userData.permissions.length,
            permissions: userData.permissions
          });
        } else if (userData.role === 'vendor') {
          // Vendor owners have all permissions - empty array means all permissions
          userData.permissions = userData.permissions || [];
        }
        
        // Ensure permissions array always exists
        if (!userData.permissions) {
          userData.permissions = [];
        }
      }
      
      // Use vendor-specific localStorage keys
      localStorage.setItem('vendor_token', token)
      localStorage.setItem('vendor_user', JSON.stringify(userData))
      setUser(userData)
      
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Login failed',
      }
    }
  }

  const register = async (data) => {
    try {
      const response = await authAPI.register(data)
      const { token, user } = response.data
      
      // Vendors can now login immediately after registration
      // Approval is only required for adding venues, not for login
      // Store token and user data to allow immediate login
      localStorage.setItem('vendor_token', token)
      localStorage.setItem('vendor_user', JSON.stringify(user))
      setUser(user)
      
      // Vendor can always login, approval only needed for venues
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Registration failed',
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('vendor_token')
    localStorage.removeItem('vendor_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}




