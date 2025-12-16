import { useEffect, useState } from 'react'
import { requestNotificationPermission, onMessageListener } from '../../config/firebase'

export const useFirebaseNotifications = () => {
  const [fcmToken, setFcmToken] = useState(null)
  const [notification, setNotification] = useState(null)
  const [permission, setPermission] = useState(Notification.permission)

  useEffect(() => {
    // Request notification permission and get token
    const getToken = async () => {
      try {
        const token = await requestNotificationPermission()
        if (token) {
          setFcmToken(token)
          setPermission(Notification.permission)
          console.log('FCM Token:', token)
          // You can send this token to your backend to store it
        }
      } catch (error) {
        // Silently fail - don't break the app if notifications aren't available
        console.warn('FCM token not available:', error.message)
      }
    }

    if ('Notification' in window && 'serviceWorker' in navigator) {
      // Delay slightly to ensure service worker is ready
      setTimeout(() => {
        getToken()
      }, 1000)
    }

    // Listen for foreground messages
    if (permission === 'granted') {
      onMessageListener()
        .then((payload) => {
          console.log('Message received:', payload)
          setNotification(payload)
          
          // Show browser notification
          if (payload.notification) {
            new Notification(payload.notification.title, {
              body: payload.notification.body,
              icon: payload.notification.icon || '/icon-192x192.png',
              badge: '/icon-192x192.png',
            })
          }
        })
        .catch((error) => {
          console.error('Error listening for messages:', error)
        })
    }
  }, [permission])

  return {
    fcmToken,
    notification,
    permission,
  }
}

