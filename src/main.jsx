import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
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
    </StoreProvider>
  </React.StrictMode>
)
