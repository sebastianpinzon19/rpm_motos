import React from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../context/StoreContext'

export default function Navbar(){
  const { settings } = useStore()
  return (
    <nav className="bg-surface2 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link to="/" className="font-display text-2xl text-primary">{settings.storeName || 'RMP Motos'}</Link>
        <div className="flex gap-4 items-center">
          <Link to="/catalog" className="text-gray-300">Catálogo</Link>
          <a href={`https://wa.me/${settings.whatsappNumber}`} target="_blank" rel="noreferrer" className="bg-green-600 px-3 py-1 rounded text-white">WhatsApp</a>
        </div>
      </div>
    </nav>
  )
}
