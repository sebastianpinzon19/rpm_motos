import React from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sileo'
import 'sileo/styles.css'
import { StoreProvider } from './context/StoreContext'
import AdminApp from './admin/AdminApp'
import './index.css'

createRoot(document.getElementById('admin-root')).render(
  <React.StrictMode>
    <StoreProvider>
      <AdminApp />
      <Toaster position="top-right" theme="dark" />
    </StoreProvider>
  </React.StrictMode>
)
