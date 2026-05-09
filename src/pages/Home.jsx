import React from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import MotoSelector from '../components/MotoSelector'
import ProductCard from '../components/ProductCard'
import { useStore } from '../context/StoreContext'

export default function Home(){
  const { products, categories } = useStore()
  const activeCategories = categories.filter(c => c.active)
  const featuredProducts = products.filter(p => p.active).slice(0, 3)

  return (
    <div>
      <section className="hero-bg py-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y:0, opacity:1 }} transition={{ duration: .6 }} className="text-6xl font-display text-[var(--primary)]">RMP MOTOS</motion.h1>
          <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:.3 }} className="mt-4 text-xl">Defensas Stung — Protege tu moto con estilo</motion.p>
          <div className="flex items-center justify-center gap-3 mt-6">
            <a href="#selector" className="inline-block bg-primary text-white px-6 py-3 rounded" aria-label="Buscar moto">Busca tu moto</a>
            <Link to="/catalog" className="inline-block bg-surface2 text-white px-6 py-3 rounded" aria-label="Ir a catálogo">Ver catálogo</Link>
          </div>
        </div>
      </section>

      <section className="py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-display text-primary">Categorías</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {activeCategories.map(category => (
              <div key={category.id} className="bg-surface border border-[#333] rounded p-4">
                <p className="font-semibold">{category.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="selector" className="py-12">
        <div className="max-w-6xl mx-auto px-4">
          <MotoSelector />
        </div>
      </section>

      <section className="py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-3xl font-display text-primary">Destacados</h2>
            <Link to="/catalog" className="text-accent" aria-label="Ir a catálogo completo">Catálogo completo</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featuredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
