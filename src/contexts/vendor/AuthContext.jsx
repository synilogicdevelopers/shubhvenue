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
            const userData = response.data.user || response.data
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
      const { token, user } = response.data
      
      // Use vendor-specific localStorage keys
      localStorage.setItem('vendor_token', token)
      localStorage.setItem('vendor_user', JSON.stringify(user))
      setUser(user)
      
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
      
      // Use vendor-specific localStorage keys
      localStorage.setItem('vendor_token', token)
      localStorage.setItem('vendor_user', JSON.stringify(user))
      setUser(user)
      
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




