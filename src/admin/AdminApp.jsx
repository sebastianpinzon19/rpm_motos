import React, { useEffect, useMemo, useState } from 'react'
import { Menu } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import ProductManager from './components/ProductManager'
import StockManager from './components/StockManager'
import CategoryManager from './components/CategoryManager'
import SettingsManager from './components/SettingsManager'
import LoginForm from './components/LoginForm'

function Dashboard() {
  const { products, categories } = useStore()

  const data = useMemo(() => {
    const activeProducts = products.filter(p => p.active).length
    const outOfStock = products.filter(p => p.stock === 0).length
    const activeCategories = categories.filter(c => c.active).length
    const lowStock = products.filter(p => p.stock > 0 && p.stock < 5)
    return { activeProducts, outOfStock, activeCategories, lowStock }
  }, [products, categories])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-surface p-4 rounded border border-[#333]">Productos activos: <strong>{data.activeProducts}</strong></div>
        <div className="bg-surface p-4 rounded border border-[#333]">Agotados: <strong>{data.outOfStock}</strong></div>
        <div className="bg-surface p-4 rounded border border-[#333]">Categorías activas: <strong>{data.activeCategories}</strong></div>
      </div>
      <div className="bg-surface p-4 rounded border border-[#333]">
        <h3 className="text-lg font-semibold text-accent">Stock bajo (&lt; 5)</h3>
        {data.lowStock.length === 0 ? <p className="text-gray-300 mt-2">Sin alertas por ahora.</p> : (
          <ul className="mt-2 space-y-1">
            {data.lowStock.map(item => (
              <li key={item.id} className="text-orange-300">{item.name} — {item.stock} unidad(es)</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default function AdminApp() {
  const [section, setSection] = useState('dashboard')
  const [open, setOpen] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const { logoutAdmin } = useStore()

  useEffect(()=>{
    const token = localStorage.getItem('rmp_admin_token')
    setAuthenticated(Boolean(token))
  }, [])

  return (
    <div className="min-h-screen bg-bg text-[#f0f0f0]">
      <header className="bg-surface2 border-b border-[#333] px-4 py-3 flex items-center justify-between">
        <h1 className="font-display text-3xl text-primary">RMP Motos Admin</h1>
        <div className="flex items-center gap-3">
          {authenticated && (
            <button
              aria-label="Cerrar sesión admin"
              onClick={async () => {
                await logoutAdmin()
                setAuthenticated(false)
              }}
              className="bg-surface px-3 py-2 rounded border border-[#333] text-sm"
            >
              Cerrar sesión
            </button>
          )}
          <button aria-label="Abrir menú admin" className="md:hidden" onClick={() => setOpen(!open)}><Menu /></button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 md:p-6 flex gap-4">
        <aside className={`${open ? 'block' : 'hidden'} md:block w-full md:w-64 bg-surface border border-[#333] rounded p-3 h-fit`}>
          <div className="space-y-2">
            <button aria-label="Ir a Dashboard" onClick={() => setSection('dashboard')} className="w-full text-left px-3 py-2 rounded bg-surface2">Dashboard</button>
            <button aria-label="Ir a Gestión de productos" onClick={() => setSection('products')} className="w-full text-left px-3 py-2 rounded bg-surface2">Gestión de productos</button>
            <button aria-label="Ir a Gestión de stock" onClick={() => setSection('stock')} className="w-full text-left px-3 py-2 rounded bg-surface2">Gestión de stock</button>
            <button aria-label="Ir a Gestión de categorías" onClick={() => setSection('categories')} className="w-full text-left px-3 py-2 rounded bg-surface2">Gestión de categorías</button>
            <button aria-label="Ir a Configuración" onClick={() => setSection('settings')} className="w-full text-left px-3 py-2 rounded bg-surface2">Configuración</button>
            <a aria-label="Ir a tienda pública" href="/" className="block w-full text-left px-3 py-2 rounded bg-primary text-white">Ver tienda pública</a>
          </div>
        </aside>

        <section className="flex-1 space-y-4">
          {!authenticated ? (
            <LoginForm onAuthenticated={() => setAuthenticated(true)} />
          ) : (
            <>
              {section === 'dashboard' && <Dashboard />}
              {section === 'products' && <ProductManager />}
              {section === 'stock' && <StockManager />}
              {section === 'categories' && <CategoryManager />}
              {section === 'settings' && <SettingsManager />}
            </>
          )}
        </section>
      </div>
    </div>
  )
}
