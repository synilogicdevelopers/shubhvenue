import { initializeApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'

// Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// 
// IMPORTANT: Google OAuth Client ID for Web:
// 283656730657-e6ps2pn25k6mqs4f5aiqsqc9h6dsql5v.apps.googleusercontent.com
// 
// This OAuth client ID must be configured in Firebase Console:
// 1. Go to Firebase Console > Authentication > Sign-in method
// 2. Enable Google sign-in
// 3. Add the Web client ID above in the "Web client ID" field
// 4. Add authorized domains (localhost, your domain)
//
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCUEfJCSWFJNz7tUZMR7G77avJoSnq-dRA",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "syni-wedding.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "syni-wedding",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "syni-wedding.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "283656730657",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:283656730657:web:650a25624659825f18cb60",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-JMPPZS6TS4"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase Analytics (only in browser)
let analytics = null
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app)
  } catch (error) {
    console.warn('Firebase Analytics initialization failed:', error)
  }
}

// Initialize Firebase services
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const googleProvider = new GoogleAuthProvider()
export { analytics }

// Initialize Firebase Cloud Messaging (FCM) - only in browser
let messaging = null
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    messaging = getMessaging(app)
  } catch (error) {
    console.warn('Firebase Messaging initialization failed:', error)
    // Continue without messaging - app will still work
  }
}

// Request notification permission and get FCM token
export const requestNotificationPermission = async () => {
  if (!messaging) {
    console.warn('Firebase Messaging is not available')
    return null
  }

  try {
    // Register service worker first if not already registered
    if ('serviceWorker' in navigator) {
      try {
        // Check if service worker is already registered
        const existingRegistrations = await navigator.serviceWorker.getRegistrations()
        let registration = existingRegistrations.find(reg => 
          reg.active?.scriptURL?.includes('firebase-messaging-sw.js')
        )
        
        if (!registration) {
          registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
            scope: '/firebase-cloud-messaging-push-scope'
          })
          console.log('Service Worker registered:', registration)
        }
      } catch (swError) {
        console.warn('Service Worker registration failed:', swError.message)
        // Continue anyway - Firebase might handle it or notifications might not be critical
        return null
      }
    }

    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      try {
        const registration = await navigator.serviceWorker.ready
        const token = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || '',
          serviceWorkerRegistration: registration
        })
        return token
      } catch (tokenError) {
        console.warn('Failed to get FCM token:', tokenError.message)
        return null
      }
    } else {
      console.warn('Notification permission denied')
      return null
    }
  } catch (error) {
    console.warn('Error getting FCM token:', error.message)
    // Don't throw, just return null to allow app to continue
    return null
  }
}

// Listen for foreground messages
export const onMessageListener = () => {
  if (!messaging) {
    return Promise.reject(new Error('Firebase Messaging is not available'))
  }

  return new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload)
    })
  })
}

export default app
