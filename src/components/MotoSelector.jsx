import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../context/StoreContext'
import ProductCard from './ProductCard'

export default function MotoSelector(){
  const { brands, getProductsByMotoModel, settings } = useStore()
  const [selectedBrand, setSelectedBrand] = useState(null)
  const [selectedModel, setSelectedModel] = useState(null)
  const [results, setResults] = useState([])

  const handleBrand = (b) => {
    setSelectedBrand(b)
    setSelectedModel(null)
    setResults([])
  }

  const handleModel = (m) => {
    setSelectedModel(m)
    const res = getProductsByMotoModel(selectedBrand.id, m)
    setResults(res)
  }

  return (
    <div>
      <div className="overflow-x-auto flex gap-4 py-4">
        {brands.map(b => (
          <motion.button key={b.id} whileHover={{ scale:1.03 }} onClick={() => handleBrand(b)} className={`min-w-[120px] bg-surface p-4 rounded ${selectedBrand?.id===b.id? 'ring-2 ring-primary':''}`}>
            <div className="font-semibold">{b.name}</div>
          </motion.button>
        ))}
      </div>

      {selectedBrand && (
        <motion.div initial={{ x:50, opacity:0 }} animate={{ x:0, opacity:1 }} className="mt-6">
          <h3 className="text-xl">Modelos de {selectedBrand.name}</h3>
          <div className="flex gap-3 mt-3 flex-wrap">
            {selectedBrand.models.map(m => (
              <button key={m} onClick={() => handleModel(m)} className={`px-4 py-2 bg-surface2 rounded ${selectedModel===m? 'ring-2 ring-accent':''}`}>{m}</button>
            ))}
          </div>
        </motion.div>
      )}

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        {results.length>0 ? results.map(p => (
          <ProductCard key={p.id} product={p} motoModel={selectedModel} />
        )) : selectedModel ? (
          <div className="p-6 bg-surface rounded">
            Próximamente para {selectedModel}.{' '}
            <a
              className="text-accent"
              target="_blank"
              rel="noreferrer"
              href={`https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(`Hola RMP Motos! Estoy buscando productos para ${selectedModel}`)}`}
            >
              Consultar por WhatsApp
            </a>
          </div>
        ) : null}
      </div>
    </div>
  )
}
