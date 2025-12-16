// Utility to suppress COOP (Cross-Origin-Opener-Policy) warnings
// These warnings are harmless but annoying during Firebase Auth popup operations

const suppressedMessages = [
  'cross-origin-opener-policy',
  'coop',
  'window.closed',
  'window.close',
  'policy would block',
  'would block the window',
  'opener-policy',
  'cross-origin',
  'policy would block the window',
  'would block the window.closed',
  'policy would block the window.closed call',
  'policy would block the window.close call',
  'would block the window.closed call',
  'would block the window.close call',
  'cross-origin-opener-policy policy would block',
  'policy would block the window.closed',
  'policy would block the window.close'
]

export const setupCOOPWarningSuppression = () => {
  if (typeof window === 'undefined') return

  const originalWarn = console.warn
  const originalError = console.error
  const originalLog = console.log

  const shouldSuppress = (message) => {
    if (!message) return false
    const lowerMessage = String(message).toLowerCase()
    // Check for any suppressed pattern
    return suppressedMessages.some(msg => lowerMessage.includes(msg.toLowerCase())) ||
           // Also check for exact patterns from error messages
           lowerMessage.includes('cross-origin-opener-policy policy would block') ||
           lowerMessage.includes('policy would block the window.closed') ||
           lowerMessage.includes('policy would block the window.close')
  }

  const filterMessage = (args) => {
    try {
      // Check all arguments, including stack traces
      const messages = args.map(arg => {
        if (typeof arg === 'string') return arg
        if (arg instanceof Error) {
          // Include error message and stack trace
          return (arg.message || '') + ' ' + (arg.stack || '')
        }
        if (arg && typeof arg === 'object') {
          try {
            // Stringify the whole object, including nested properties
            const str = JSON.stringify(arg)
            // Also check if it has a message or stack property
            if (arg.message) return str + ' ' + arg.message
            if (arg.stack) return str + ' ' + arg.stack
            return str
          } catch {
            return String(arg)
          }
        }
        return String(arg)
      })
      
      // Check the combined message
      const combinedMessage = messages.join(' ')
      if (shouldSuppress(combinedMessage)) return true
      
      // Also check each individual message
      return messages.some(msg => shouldSuppress(msg))
    } catch {
      return false
    }
  }

  // Override console methods
  console.warn = function(...args) {
    if (!filterMessage(args)) {
      originalWarn.apply(console, args)
    }
  }

  console.error = function(...args) {
    if (!filterMessage(args)) {
      originalError.apply(console, args)
    }
  }

  console.log = function(...args) {
    if (!filterMessage(args)) {
      originalLog.apply(console, args)
    }
  }

  // Also suppress errors from window.onerror
  const originalOnError = window.onerror
  window.onerror = function(message, source, lineno, colno, error) {
    const errorMessage = error?.message || String(message || '')
    if (shouldSuppress(errorMessage)) {
      return true // Suppress the error
    }
    if (originalOnError) {
      return originalOnError.call(this, message, source, lineno, colno, error)
    }
    return false
  }

  // Suppress unhandled promise rejections related to COOP
  window.addEventListener('unhandledrejection', (event) => {
    const message = event.reason?.message || String(event.reason || '')
    if (shouldSuppress(message)) {
      event.preventDefault()
      event.stopPropagation()
    }
  }, true) // Use capture phase to catch early

  // Also hook into console at a lower level if possible
  if (window.console && window.console.warn) {
    // Keep reference for debugging if needed
    window.__originalConsoleWarn = originalWarn
    window.__originalConsoleError = originalError
  }
}

