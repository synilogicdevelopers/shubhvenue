import { analytics } from '../../config/firebase'
import { logEvent } from 'firebase/analytics'

// Helper functions for Firebase Analytics events
export const trackEvent = (eventName, eventParams = {}) => {
  if (analytics) {
    try {
      logEvent(analytics, eventName, eventParams)
    } catch (error) {
      console.warn('Analytics event tracking failed:', error)
    }
  }
}

// Common event tracking functions
export const trackPageView = (pageName) => {
  trackEvent('page_view', {
    page_title: pageName,
    page_location: window.location.href,
  })
}

export const trackButtonClick = (buttonName, location) => {
  trackEvent('button_click', {
    button_name: buttonName,
    location: location,
  })
}

export const trackVenueAction = (action, venueId, venueName) => {
  trackEvent('venue_action', {
    action: action, // 'view', 'edit', 'delete', 'create', 'toggle_status'
    venue_id: venueId,
    venue_name: venueName,
  })
}

export const trackBookingAction = (action, bookingId) => {
  trackEvent('booking_action', {
    action: action, // 'view', 'confirm', 'cancel', 'create'
    booking_id: bookingId,
  })
}

export const trackLogin = (method = 'email') => {
  trackEvent('login', {
    method: method,
  })
}

export const trackSignUp = (method = 'email') => {
  trackEvent('sign_up', {
    method: method,
  })
}

export const trackSearch = (searchTerm, resultsCount) => {
  trackEvent('search', {
    search_term: searchTerm,
    results_count: resultsCount,
  })
}

export default {
  trackEvent,
  trackPageView,
  trackButtonClick,
  trackVenueAction,
  trackBookingAction,
  trackLogin,
  trackSignUp,
  trackSearch,
}





