import React from 'react'
import ReactDOM from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.jsx'
import './index.css'

// Suppress COOP warnings globally - they're harmless but annoying
// This must be set up BEFORE Firebase is imported
import { setupCOOPWarningSuppression } from './utils/suppressCOOPWarnings'
setupCOOPWarningSuppression()

// Initialize Firebase AFTER console suppression is set up
import './config/firebase.js'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>,
)

