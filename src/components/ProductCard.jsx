import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import ImageLightbox from './ImageLightbox'

function formatCOP(n){
  return '$' + n.toLocaleString('es-CO')
}

export default function ProductCard({ product, motoModel }){
  const localFallbackByProduct = {
    'def-001': '/products/defensa1_main.svg',
    'def-002': '/products/defensa2_main.svg',
    'acc-001': '/products/portaplaca.svg',
    'acc-002': '/products/parrilla.svg'
  }

  const localFallbackByModel = {
    'CB125F': '/products/defensa1_cb125f.svg',
    'FZ 150': '/products/defensa1_fz150.svg',
    'Pulsar NS200': '/products/defensa2_ns200.svg'
  }

  const badge = product.stock===0? 'Agotado' : product.stock<5? 'Últimas unidades' : 'Disponible'
  const compatibleText = product.compatibleModels?.length
    ? `Compatible con ${product.compatibleModels.slice(0, 2).join(', ')}${product.compatibleModels.length > 2 ? '…' : ''}`
    : product.compatibleBrands?.length
      ? `Compatible con ${product.compatibleBrands.length} marca(s)`
      : 'Compatibilidad universal'
  const mainImage = (product.images && product.images[0]) || localFallbackByProduct[product.id] || 'https://placehold.co/400x300/1a1a1a/e63312?text=RMP+Motos'
  const modelImage = motoModel && product.imagesByModel?.[motoModel]
  const fallbackImage = (motoModel && localFallbackByModel[motoModel]) || localFallbackByProduct[product.id] || 'https://placehold.co/400x300/1a1a1a/e63312?text=RMP+Motos'

  const [lightbox, setLightbox] = useState(null)
  const [displayImage, setDisplayImage] = useState(modelImage || mainImage)

  useEffect(() => {
    setDisplayImage(modelImage || mainImage)
  }, [modelImage, mainImage])

  return (
    <motion.div whileHover={{ y:-6 }} className="p-4 bg-surface rounded shadow-md">
      <div className="relative cursor-pointer" onClick={() => setLightbox(displayImage || fallbackImage)}>
        <img
          src={displayImage || fallbackImage}
          onError={() => setDisplayImage(fallbackImage)}
          alt={product.name}
          className="h-40 w-full object-cover rounded"
        />
        {modelImage && (
          <div className="absolute top-2 right-2 bg-black/60 text-xs text-white px-2 py-1 rounded">Vista por moto</div>
        )}
      </div>
      <div className="mt-3">
        <div className="flex justify-between items-center">
          <h4 className="font-semibold">{product.name}</h4>
          <span className="text-sm text-gray-300">{badge}</span>
        </div>
        <p className="mt-1 text-xs text-accent">{compatibleText}</p>
        <p className="mt-2 text-sm text-gray-300">{product.description}</p>
        <div className="mt-3 flex items-center justify-between">
          <div className="font-bold">{formatCOP(product.basePrice)}</div>
          <div>
            {product.customizable ? (
              <Link to={`/product/${product.id}`} state={motoModel ? { motoModel } : undefined} className="bg-primary px-3 py-1 rounded text-white">Personalizar</Link>
            ) : (
              <Link to={`/product/${product.id}`} state={motoModel ? { motoModel } : undefined} className="bg-surface2 px-3 py-1 rounded">Ver detalles</Link>
            )}
          </div>
        </div>
      </div>
      {lightbox && (
        <ImageLightbox src={lightbox} alt={product.name} onClose={() => setLightbox(null)} />
      )}
    </motion.div>
  )
}
