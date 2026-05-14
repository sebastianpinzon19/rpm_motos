import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { Toaster } from 'sileo'
import 'sileo/styles.css'
import App from './App'
import { StoreProvider } from './context/StoreContext'
import './index.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <StoreProvider>
      <BrowserRouter>
        <App />
        <Analytics />
      </BrowserRouter>
      <Toaster position="top-right" theme="system" />
    </StoreProvider>
  </React.StrictMode>
)
