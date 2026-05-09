import React from 'react'
import { useStore } from '../../context/StoreContext'

export default function CategoryManager() {
  const { categories, toggleCategoryActive } = useStore()

  return (
    <div className="bg-surface border border-[#333] rounded p-4 space-y-3">
      <h2 className="text-xl font-semibold">Gestión de Categorías</h2>
      {categories.map(category => (
        <div key={category.id} className="flex items-center justify-between bg-surface2 p-3 rounded">
          <div>
            <p className="font-medium">{category.name}</p>
            <p className="text-sm text-gray-300">Estado: {category.active ? 'Activa' : 'Inactiva'}</p>
          </div>
          <button aria-label={`Alternar categoría ${category.name}`} onClick={() => toggleCategoryActive(category.id)} className="bg-[#333] px-3 py-2 rounded">
            {category.active ? 'Desactivar' : 'Activar'}
          </button>
        </div>
      ))}
    </div>
  )
}
