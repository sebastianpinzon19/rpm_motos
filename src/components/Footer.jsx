import React from 'react'
import { useStore } from '../context/StoreContext'

export default function Footer(){
  const { settings } = useStore()
  return (
    <footer className="bg-surface px-4 py-8 mt-8">
      <div className="max-w-6xl mx-auto text-center text-gray-300">
        <div className="mb-2">{settings.tagline}</div>
        <a className="inline-block bg-green-600 px-4 py-2 rounded text-white" href={`https://wa.me/${settings.whatsappNumber}`} target="_blank" rel="noreferrer">Chatear por WhatsApp</a>
        <div className="mt-4 text-sm">&copy; {new Date().getFullYear()} {settings.storeName}</div>
      </div>
    </footer>
  )
}
