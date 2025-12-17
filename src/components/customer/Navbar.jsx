import { useState, useEffect, useRef } from 'react'
import './Navbar.css'
import { NavLink, useNavigate } from 'react-router-dom'
import { auth, googleProvider } from '../../config/firebase'
import { signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider } from 'firebase/auth'
import { authAPI, publicVenuesAPI, publicMenusAPI } from '../../services/customer/api'
import toast from 'react-hot-toast'

function Navbar({ isSidebarOpen, toggleSidebar }) {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [states, setStates] = useState([])
  const [cities, setCities] = useState([])
  const [selectedState, setSelectedState] = useState('')
  const [loadingStates, setLoadingStates] = useState(false)
  const [loadingCities, setLoadingCities] = useState(false)
  const [menus, setMenus] = useState([])
  const [loadingMenus, setLoadingMenus] = useState(false)
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)
  const [activeMenuId, setActiveMenuId] = useState(null)
  const menuHoverTimeout = useRef(null)

  // Cleanup hover timeout on unmount
  useEffect(() => {
    return () => {
      if (menuHoverTimeout.current) {
        clearTimeout(menuHoverTimeout.current)
      }
    }
  }, [])

  useEffect(() => {
    // Function to check and update user from localStorage
    const checkUser = () => {
      const token = localStorage.getItem('token')
      const storedUser = localStorage.getItem('user')
      if (token && storedUser) {
        try {
          setUser(JSON.parse(storedUser))
        } catch (e) {
          console.error('Error parsing user:', e)
        }
      } else {
        setUser(null)
      }
    }
    
    // Check if user is logged in on mount
    checkUser()
    
    // Listen for login events from LoginModal
    const handleUserLogin = (event) => {
      if (event.detail?.user) {
        setUser(event.detail.user)
      } else {
        // If no user in event, check localStorage
        checkUser()
      }
    }
    
    // Listen for logout events
    const handleUserLogout = () => {
      setUser(null)
    }
    
    // Listen for localStorage changes (for cross-tab sync)
    const handleStorageChange = (e) => {
      if (e.key === 'user' || e.key === 'token') {
        checkUser()
      }
    }
    
    window.addEventListener('userLogin', handleUserLogin)
    window.addEventListener('userLogout', handleUserLogout)
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('userLogin', handleUserLogin)
      window.removeEventListener('userLogout', handleUserLogout)
      window.removeEventListener('storage', handleStorageChange)
    }

    // Handle redirect result from Google login
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth)
        if (result) {
          setLoading(true)
          const credential = GoogleAuthProvider.credentialFromResult(result)
          const idToken = credential?.idToken
          
          if (idToken) {
            const response = await authAPI.googleLogin(idToken, 'customer')
            if (response.data?.token && response.data?.user) {
              localStorage.setItem('token', response.data.token)
              localStorage.setItem('user', JSON.stringify(response.data.user))
              setUser(response.data.user)
              
              // Show appropriate message based on whether it's registration or login
              if (response.data?.message?.includes('registered') || response.data?.isNewUser) {
                toast.success('Registration successful! Welcome!')
              } else {
                toast.success('Login successful!')
              }
              
              // Small delay before reload for better UX
              setTimeout(() => {
                window.location.reload()
              }, 500)
            } else {
              toast.error('Login failed. Please try again.')
            }
          }
          setLoading(false)
        }
      } catch (error) {
        console.error('Redirect result error:', error)
        setLoading(false)
      }
    }

    handleRedirectResult()
  }, [])

  const handleGoogleLogin = async () => {
    try {
      setLoading(true)
      
      // Try popup first (better UX)
      try {
        const result = await signInWithPopup(auth, googleProvider)
        const credential = GoogleAuthProvider.credentialFromResult(result)
        const idToken = credential?.idToken
        
        if (idToken) {
          const response = await authAPI.googleLogin(idToken, 'customer')
          if (response.data?.token && response.data?.user) {
            localStorage.setItem('token', response.data.token)
            localStorage.setItem('user', JSON.stringify(response.data.user))
            setUser(response.data.user)
            
            // Show appropriate message based on whether it's registration or login
            if (response.data?.message?.includes('registered') || response.data?.isNewUser) {
              toast.success('Registration successful! Welcome!')
            } else {
              toast.success('Login successful!')
            }
            
            // Small delay before reload for better UX
            setTimeout(() => {
              window.location.reload()
            }, 500)
          } else {
            toast.error('Login failed. Please try again.')
          }
        }
        setLoading(false)
      } catch (popupError) {
        // If popup fails, fallback to redirect
        if (popupError.code === 'auth/popup-closed-by-user') {
          setLoading(false)
          return
        }
        
        // Fallback to redirect
        await signInWithRedirect(auth, googleProvider)
        // Note: setLoading(false) won't run here because page redirects
      }
    } catch (error) {
      console.error('Google login error:', error)
      toast.error(error.message || 'Google login failed')
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setShowDropdown(false)
    
    // Dispatch logout event to notify other components
    window.dispatchEvent(new CustomEvent('userLogout'))
    
    toast.success('Logged out successfully')
    setTimeout(() => {
      window.location.reload()
    }, 500)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.user-info-container')) {
        setShowDropdown(false)
      }
      if (activeMenuId && !event.target.closest('.nav-link-wrapper')) {
        setActiveMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown, activeMenuId])

  // Reset state and city on component mount to ensure clean initial state
  useEffect(() => {
    setSelectedState('')
    setSelectedCity('')
    setCities([])
  }, [])

  // Load states on component mount
  useEffect(() => {
    const loadStates = async () => {
      try {
        setLoadingStates(true)
        const response = await publicVenuesAPI.getStates()
        if (response.data?.success && response.data?.states) {
          setStates(response.data.states)
        }
      } catch (error) {
        console.error('Error loading states:', error)
      } finally {
        setLoadingStates(false)
      }
    }
    loadStates()
  }, [])

  // Load cities when state is selected
  useEffect(() => {
    const loadCities = async () => {
      if (!selectedState || !selectedState.trim()) {
        setCities([])
        setSelectedCity('')
        setLoadingCities(false)
        return
      }
      try {
        setLoadingCities(true)
        const response = await publicVenuesAPI.getCities(selectedState)
        if (response.data?.success && response.data?.cities) {
          setCities(response.data.cities)
          // Always reset city when state changes
          setSelectedCity('')
        } else {
          setCities([])
          setSelectedCity('')
        }
      } catch (error) {
        console.error('Error loading cities:', error)
        setCities([])
        setSelectedCity('')
      } finally {
        setLoadingCities(false)
      }
    }
    loadCities()
  }, [selectedState])

  // Load menus for venue dropdown
  useEffect(() => {
    const withTimeout = (promise, ms = 10000) =>
      Promise.race([
        promise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), ms)
        ),
      ])

    const loadMenus = async () => {
      try {
        setLoadingMenus(true)
        const response = await withTimeout(
          publicMenusAPI.getMenus({ active: 'true', parentMenuId: null })
        )
        let menusData = []
        if (response.data) {
          if (response.data.menus && Array.isArray(response.data.menus)) {
            menusData = response.data.menus
          } else if (Array.isArray(response.data)) {
            menusData = response.data
          } else if (response.data.success && response.data.menus) {
            menusData = response.data.menus
          }
        }
        // Load submenus for each menu
        const menusWithSubmenus = await Promise.all(
          menusData.map(async (menu) => {
            try {
              const submenuResponse = await withTimeout(
                publicMenusAPI.getSubmenus(menu._id || menu.id)
              )
              let submenus = []
              if (submenuResponse.data) {
                if (submenuResponse.data.menus && Array.isArray(submenuResponse.data.menus)) {
                  submenus = submenuResponse.data.menus
                } else if (Array.isArray(submenuResponse.data)) {
                  submenus = submenuResponse.data
                } else if (submenuResponse.data.success && submenuResponse.data.menus) {
                  submenus = submenuResponse.data.menus
                }
              }
              return { ...menu, submenus }
            } catch (error) {
              console.error(`Error loading submenus for menu ${menu._id || menu.id}:`, error)
              return { ...menu, submenus: [] }
            }
          })
        )
        setMenus(menusWithSubmenus)
      } catch (error) {
        console.error('Error loading menus:', error)
        toast.error('Could not load categories. Please try again.')
        setMenus([])
      } finally {
        setLoadingMenus(false)
      }
    }
    loadMenus()
  }, [])

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault()
    const params = {}
    if (searchQuery.trim()) {
      params.q = searchQuery.trim()
    }
    if (selectedCity && selectedCity.trim()) {
      params.city = selectedCity.trim()
    }
    if (selectedState && selectedState.trim()) {
      params.state = selectedState.trim()
    }
    
    // Navigate to venues page with search params
    navigate('/venues', { 
      state: { searchParams: params }
    })
  }

  // Handle submenu click - navigate to venues with submenu filter
  const handleSubmenuClick = (e, submenu) => {
    e.preventDefault()
    e.stopPropagation()
    
    console.log('Submenu clicked:', submenu)
    const submenuId = submenu._id || submenu.id
    const submenuName = submenu.name
    console.log('Navigating with submenuId:', submenuId, 'submenuName:', submenuName)
    
    // Navigate immediately
    navigate('/venues', {
      state: {
        submenuId: submenuId,
        submenuName: submenuName
      }
    })
    
    // Close dropdown after navigation
    setActiveMenuId(null)
    
    return false
  }

  // Handle menu click - navigate to venues directly assigned to that menu (not submenus)
  const handleMenuClick = (e, menu) => {
    e.preventDefault()
    e.stopPropagation()
    
    console.log('Menu clicked:', menu)
    const menuId = menu._id || menu.id
    const menuName = menu.name
    
    console.log('Navigating with menuId:', menuId, 'menuName:', menuName)
    
    // Navigate immediately - only pass menuId, backend will filter for venues directly assigned to menu
    navigate('/venues', {
      state: {
        menuId: menuId,
        menuName: menuName
      }
    })
    
    // Close dropdown after navigation
    setActiveMenuId(null)
    
    return false
  }

  return (
    <>
      <nav className="navbar">
        <div className="navbar-top">
          <div className="navbar-left">
            <div className="logo">
              <img 
                src="/image/venuebook.png" 
                alt="ShubhVenue Logo" 
                className="logo-icon"
                loading="eager"
                decoding="async"
                onError={(e) => {
                  e.target.onerror = null
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0idXJsKCNncmFkaWVudCkiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSI+CjxwYXRoIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0wIDNjMS42NiAwIDMgMS4zNCAzIDNzLTEuMzQgMy0zIDMtMy0xLjM0LTMtMyAxLjM0LTMgMy0zem0wIDE0LjJjLTIuNjcgMC04IDEuMzQtOCA0djEuOGgxNnYtMS44YzAtMi42Ni01LjMzLTQtOC00eiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9ImdyYWRpZW50IiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj4KPHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6Izk0NDg3QTtzdG9wLW9wYWNpdHk6MSIgLz4KPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojRUM0ODk5O3N0b3Atb3BhY2l0eToxIiAvPgo8L2xpbmVhckdyYWRpZW50Pgo8L2RlZnM+Cjwvc3ZnPg=='
                }}
              />
              <span className="logo-text">ShubhVenue</span>
            </div>
          </div>

          <div className="navbar-center">
            <form className="global-search" onSubmit={handleSearch}>
              <select 
                className="state-dropdown"
                value={selectedState || ''}
                onChange={(e) => {
                  setSelectedState(e.target.value)
                  setSelectedCity('') // Reset city when state changes
                }}
              >
                <option value="">Select State</option>
                {loadingStates ? (
                  <option>Loading...</option>
                ) : (
                  states.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))
                )}
              </select>
              <select 
                className="city-dropdown"
                value={selectedCity || ''}
                onChange={(e) => setSelectedCity(e.target.value)}
                disabled={!selectedState || !selectedState.trim() || loadingCities}
              >
                <option value="">Select City</option>
                {loadingCities ? (
                  <option>Loading...</option>
                ) : (
                  cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))
                )}
              </select>
              <input 
                type="text" 
                placeholder="Search Venues by Name, Sub Area, City"
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="search-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
              </button>
            </form>
          </div>

          <div className="navbar-right">
            <button
              type="button"
              className={`mobile-search-btn ${isMobileSearchOpen ? 'active' : ''}`}
              onClick={() => setIsMobileSearchOpen(prev => !prev)}
              aria-label="Search venues"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </button>

            {user ? (
              <div className="user-info-container">
                <div className="user-avatar">
                  {user.name ? user.name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="user-name">{user.name || user.email?.split('@')[0]}</span>
                <button 
                  className="btn-dropdown" 
                  onClick={() => setShowDropdown(!showDropdown)}
                  title="Menu"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                {showDropdown && (
                  <div className="user-dropdown">
                    <button className="dropdown-item" onClick={handleLogout}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                      </svg>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button 
                className="btn-login" 
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                {loading ? 'Logging in...' : 'Login with Google'}
              </button>
            )}
          </div>
        </div>

        <div className="navbar-bottom">
          <div className="nav-links">
            <NavLink to="/" className="nav-link">
              Home
              {/* <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg> */}
            </NavLink>
            <NavLink to="/venues" className="nav-link">
              Venues
            </NavLink>
            {loadingMenus ? (
              <span className="nav-link nav-link-muted">Loading categories...</span>
            ) : (
              menus.map((menu, index) => {
                const menuId = menu._id || menu.id || index
                const hasSubmenus = menu.submenus && menu.submenus.length > 0

                return (
                  <div
                    key={menuId}
                    className="nav-link-wrapper"
                    onMouseEnter={() => {
                      if (menuHoverTimeout.current) {
                        clearTimeout(menuHoverTimeout.current)
                      }
                      setActiveMenuId(menuId)
                    }}
                    onMouseLeave={() => {
                      if (menuHoverTimeout.current) {
                        clearTimeout(menuHoverTimeout.current)
                      }
                      menuHoverTimeout.current = setTimeout(() => setActiveMenuId(null), 150)
                    }}
                  >
                    <button
                      type="button"
                      className="nav-link nav-menu-trigger"
                      onClick={(e) => {
                        if (hasSubmenus) {
                          e.preventDefault()
                          setActiveMenuId(menuId)
                        }
                        handleMenuClick(e, menu)
                      }}
                    >
                      {menu.name}
                      {hasSubmenus && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      )}
                    </button>

                    {hasSubmenus && activeMenuId === menuId && (
                      <div className="submenu-dropdown">
                        <ul className="submenu-list">
                          {menu.submenus.map((submenu) => (
                            <li key={submenu._id || submenu.id}>
                              <button
                                className="submenu-item"
                                onClick={(e) => handleSubmenuClick(e, submenu)}
                              >
                                {submenu.name}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )
              })
            )}
            <NavLink to="/booking-history" className="nav-link">
              Bookings
              {/* <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg> */}
            </NavLink>
            {/* <a href="#" className="nav-link">Destination Wedding</a> */}
            <NavLink to="/profile" className="nav-link">
              Profile
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </NavLink>
            {/* <a href="#" className="nav-link">Win Prizes</a>
            <a href="#" className="nav-link">Real Events</a>
            <a href="#" className="nav-link">Q&A</a>
            <a href="#" className="nav-link">Blog</a> */}
          </div>
          {/* <div className="phone-number">
            <a href="tel:8279220676">827-922-0676</a>
          </div> */}
        </div>
      </nav>

      {/* Mobile Search Panel */}
      {isMobileSearchOpen && (
        <div className="mobile-search-panel">
          <form
            className="mobile-search-form"
            onSubmit={(e) => {
              e.preventDefault()
              handleSearch(e)
              setIsMobileSearchOpen(false)
            }}
          >
            <div className="mobile-search-row">
              <select 
                className="state-dropdown"
                value={selectedState || ''}
                onChange={(e) => {
                  setSelectedState(e.target.value)
                  setSelectedCity('') // Reset city when state changes
                }}
              >
                <option value="">Select State</option>
                {loadingStates ? (
                  <option>Loading...</option>
                ) : (
                  states.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))
                )}
              </select>
              <select 
                className="city-dropdown"
                value={selectedCity || ''}
                onChange={(e) => setSelectedCity(e.target.value)}
                disabled={!selectedState || !selectedState.trim() || loadingCities}
              >
                <option value="">Select City</option>
                {loadingCities ? (
                  <option>Loading...</option>
                ) : (
                  cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div className="mobile-search-row">
              <input 
                type="text" 
                placeholder="Search Venues by Name, Sub Area, City"
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="search-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
              </button>
              <button
                type="button"
                className="mobile-search-close"
                onClick={() => setIsMobileSearchOpen(false)}
                aria-label="Close search"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <div className="mobile-bottom-nav">
        <NavLink 
          to="/" 
          className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 11.5L12 4l9 7.5"></path>
            <path d="M5 10.5V20h14v-9.5"></path>
          </svg>
          <span>Home</span>
        </NavLink>
        <NavLink 
          to="/venues" 
          className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 21s-6-5.1-6-10a6 6 0 0 1 12 0c0 4.9-6 10-6 10z"></path>
            <circle cx="12" cy="11" r="2.5"></circle>
          </svg>
          <span>Venues</span>
        </NavLink>
        <NavLink 
          to="/booking-history" 
          className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2"></rect>
            <path d="M16 2v4"></path>
            <path d="M8 2v4"></path>
            <path d="M3 10h18"></path>
          </svg>
          <span>Bookings</span>
        </NavLink>
        <NavLink 
          to="/profile" 
          className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="8" r="4"></circle>
            <path d="M4 20a8 8 0 0 1 16 0"></path>
          </svg>
          <span>Profile</span>
        </NavLink>
      </div>

      {/* Mobile Sidebar */}
      <div className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`} onClick={toggleSidebar}></div>
      <div className={`sidebar ${isSidebarOpen ? 'active' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <img 
              src="/image/venuebook.png" 
              alt="ShubhVenue Logo" 
              className="logo-icon"
              loading="eager"
              decoding="async"
              onError={(e) => {
                e.target.onerror = null
                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0idXJsKCNncmFkaWVudCkiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSI+CjxwYXRoIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0wIDNjMS42NiAwIDMgMS4zNCAzIDNzLTEuMzQgMy0zIDMtMy0xLjM0LTMtMyAxLjM0LTMgMy0zem0wIDE0LjJjLTIuNjcgMC04IDEuMzQtOCA0djEuOGgxNnYtMS44YzAtMi42Ni01LjMzLTQtOC00eiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9ImdyYWRpZW50IiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj4KPHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6Izk0NDg3QTtzdG9wLW9wYWNpdHk6MSIgLz4KPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojRUM0ODk5O3N0b3Atb3BhY2l0eToxIiAvPgo8L2xpbmVhckdyYWRpZW50Pgo8L2RlZnM+Cjwvc3ZnPg=='
              }}
            />
            <span className="logo-text">ShubhVenue</span>
          </div>
          <button className="close-btn" onClick={toggleSidebar}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div className="sidebar-content">
          <div className="sidebar-search">
            <select 
              className="state-dropdown"
              value={selectedState || ''}
              onChange={(e) => {
                setSelectedState(e.target.value)
                setSelectedCity('') // Reset city when state changes
              }}
            >
              <option value="">Select State</option>
              {loadingStates ? (
                <option>Loading...</option>
              ) : (
                states.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))
              )}
            </select>
            <select 
              className="city-dropdown"
              value={selectedCity || ''}
              onChange={(e) => setSelectedCity(e.target.value)}
              disabled={!selectedState || !selectedState.trim() || loadingCities}
            >
              <option value="">Select City</option>
              {loadingCities ? (
                <option>Loading...</option>
              ) : (
                cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))
              )}
            </select>
            <input 
              type="text" 
              placeholder="Search Venues by Name, Sub Area, City"
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button 
              type="button"
              className="search-btn"
              onClick={(e) => {
                e.preventDefault()
                handleSearch(e)
                toggleSidebar()
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </button>
          </div>
          <div className="sidebar-buttons">
            {user ? (
              <div className="sidebar-user-info">
                <div className="user-avatar">
                  {user.name ? user.name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="user-name">{user.name || user.email?.split('@')[0]}</span>
                <button className="btn-logout" onClick={handleLogout} title="Logout">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  Logout
                </button>
              </div>
            ) : (
              <button 
                className="btn-login" 
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                {loading ? 'Logging in...' : 'Login with Google'}
              </button>
            )}
          </div>
          <div className="sidebar-links">
            <NavLink to="/" className="sidebar-link" onClick={toggleSidebar}>
              Home
            </NavLink>
            <NavLink to="/venues" className="sidebar-link" onClick={toggleSidebar}>
              Venues
            </NavLink>
            <NavLink to="/booking-history" className="sidebar-link" onClick={toggleSidebar}>
              Bookings
            </NavLink>
            <NavLink to="/profile" className="sidebar-link" onClick={toggleSidebar}>
              Profile
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </NavLink>
            {/* <a href="#" className="sidebar-link">Win Prizes</a>
            <a href="#" className="sidebar-link">Real Events</a>
            <a href="#" className="sidebar-link">Q&A</a>
            <a href="#" className="sidebar-link">Blog</a> */}
          </div>
          {/* <div className="sidebar-phone">
            <a href="tel:8279220676">827-922-0676</a>
          </div> */}
        </div>
      </div>
    </>
  )
}

export default Navbar

