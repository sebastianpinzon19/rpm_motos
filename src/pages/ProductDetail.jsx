import React, { useMemo, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import CustomizerPanel from '../components/CustomizerPanel'
import PriceSummary from '../components/PriceSummary'
import WhatsAppButton from '../components/WhatsAppButton'
import ImageLightbox from '../components/ImageLightbox'

export default function ProductDetail(){
  const { id } = useParams()
  const location = useLocation()
  const { products, brands, settings } = useStore()
  const product = products.find(p => p.id === id)
  const defaultMotoModel = location.state?.motoModel || product?.compatibleModels?.[0] || ''
  const [selection, setSelection] = useState({ topes: null, marcado: null, color: null, motoBrand: null, motoModel: defaultMotoModel })
  const [lightbox, setLightbox] = useState(null)

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

  if (!product) return <div className="p-6">Producto no encontrado</div>

  const base = product.basePrice
  const colorOpt = product.customizable ? product.options.colores : []
  const mainImage = (product.images && product.images[0]) || localFallbackByProduct[product.id] || ''
  const selectedModelImage = selection.motoModel && product.imagesByModel?.[selection.motoModel]
  const fallbackModelImage = (selection.motoModel && localFallbackByModel[selection.motoModel]) || localFallbackByProduct[product.id] || mainImage

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-semibold">{product.name}</h2>
      <p className="mt-2 text-sm text-accent">
        {product.compatibleModels?.length
          ? `Compatible con: ${product.compatibleModels.join(', ')}`
          : product.compatibleBrands?.length
            ? `Compatible con ${product.compatibleBrands.length} marca(s)`
            : 'Compatibilidad universal'}
      </p>
      {selection.motoModel && (
        <p className="mt-1 text-sm text-gray-300">Moto seleccionada: {selection.motoModel}</p>
      )}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          {selection.motoModel && selectedModelImage ? (
            <div>
              <img
                onClick={() => setLightbox(selectedModelImage)}
                src={selectedModelImage}
                onError={(e) => { e.currentTarget.src = fallbackModelImage }}
                alt={`${product.name} - ${selection.motoModel}`}
                className="w-full h-64 object-cover rounded cursor-pointer"
              />
              <p className="mt-2 text-xs text-accent">Imagen específica para {selection.motoModel}</p>
            </div>
          ) : (
            <div>
              <img
                onClick={() => setLightbox(mainImage || 'https://placehold.co/600x400/1a1a1a/e63312?text=RMP+Motos')}
                src={mainImage || 'https://placehold.co/600x400/1a1a1a/e63312?text=RMP+Motos'}
                onError={(e) => { e.currentTarget.src = localFallbackByProduct[product.id] || 'https://placehold.co/600x400/1a1a1a/e63312?text=RMP+Motos' }}
                alt={product.name}
                className="w-full h-64 object-cover rounded cursor-pointer"
              />
              {product.images && product.images.length > 1 && (
                <div className="mt-2 flex gap-2">
                  {product.images.map((img, idx) => (
                    <img
                      key={idx}
                      onClick={() => setLightbox(img)}
                      src={img}
                      onError={(e) => { e.currentTarget.src = localFallbackByProduct[product.id] || 'https://placehold.co/160x96/1a1a1a/e63312?text=RMP' }}
                      alt={`${product.name} ${idx+1}`}
                      className="w-20 h-12 object-cover rounded border border-[#222] cursor-pointer"
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          <p className="mt-3 text-gray-300">{product.description}</p>
        </div>
        <div>
          {product.customizable ? (
            <CustomizerPanel product={product} selection={selection} setSelection={setSelection} />
          ) : (
            <div className="p-4 bg-surface rounded">Producto no personalizable</div>
          )}

          <div className="mt-4">
            <PriceSummary base={base} product={product} selection={selection} />
          </div>

          <div className="mt-4">
            <WhatsAppButton product={product} selection={selection} phone={settings.whatsappNumber} />
          </div>
        </div>
      </div>
      {lightbox && (
        <ImageLightbox src={lightbox} alt={product.name} onClose={() => setLightbox(null)} />
      )}
    </div>
  )
}
