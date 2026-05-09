import React, { useEffect, useMemo, useState } from 'react'
import { useStore } from '../../context/StoreContext'

export default function StockManager() {
  const { products, updateStock } = useStore()
  const [draft, setDraft] = useState({})

  useEffect(() => {
    const handler = setTimeout(() => {
      Object.entries(draft).forEach(([id, value]) => updateStock(id, Number(value) || 0))
    }, 350)
    return () => clearTimeout(handler)
  }, [draft, updateStock])

  const current = useMemo(() => Object.fromEntries(products.map(p => [p.id, p.stock])), [products])

  const getValue = (id) => (draft[id] ?? current[id] ?? 0)

  const setValue = (id, value) => {
    const clean = Math.max(0, Number(value) || 0)
    setDraft(prev => ({ ...prev, [id]: clean }))
  }

  return (
    <div className="bg-surface border border-[#333] rounded p-4 space-y-3">
      <h2 className="text-xl font-semibold">Gestión de Stock</h2>
      <div className="space-y-2">
        {products.map(p => (
          <div key={p.id} className="grid grid-cols-[1fr_auto] md:grid-cols-[1fr_auto_auto_auto] gap-2 items-center bg-surface2 rounded p-2">
            <div>{p.name}</div>
            <button aria-label={`Disminuir stock de ${p.name}`} onClick={() => setValue(p.id, getValue(p.id) - 1)} className="bg-[#333] px-3 py-1 rounded">-1</button>
            <input aria-label={`Stock de ${p.name}`} type="number" min="0" className="w-24 bg-[#111] border border-[#333] rounded p-1" value={getValue(p.id)} onChange={(e) => setValue(p.id, e.target.value)} />
            <button aria-label={`Aumentar stock de ${p.name}`} onClick={() => setValue(p.id, getValue(p.id) + 1)} className="bg-[#333] px-3 py-1 rounded">+1</button>
          </div>
        ))}
      </div>
    </div>
  )
}
