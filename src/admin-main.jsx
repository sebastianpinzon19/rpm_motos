import React from 'react'
import { createRoot } from 'react-dom/client'
import { StoreProvider } from './context/StoreContext'
import AdminApp from './admin/AdminApp'
import './index.css'

createRoot(document.getElementById('admin-root')).render(
  <React.StrictMode>
    <StoreProvider>
      <AdminApp />
    </StoreProvider>
  </React.StrictMode>
)
