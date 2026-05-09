import React from 'react'
import { useStore } from '../context/StoreContext'
import ProductCard from '../components/ProductCard'

export default function Catalog(){
  const { products, categories } = useStore()
  const activeCategoryIds = categories.filter(c => c.active).map(c => c.id)
  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl mb-4">Catálogo</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {products.filter(p => p.active && activeCategoryIds.includes(p.category)).map(p => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  )
}
