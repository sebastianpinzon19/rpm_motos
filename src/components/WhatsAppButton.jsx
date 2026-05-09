import React from 'react'
import { initialData } from '../data/initialData'

function fmt(n){
  return '$' + n.toLocaleString('es-CO')
}

export default function WhatsAppButton({ product, selection, phone }){
  const total = (()=>{
    let t = product.basePrice
    if (selection.topes) t += selection.topes.priceModifier || 0
    if (selection.marcado) t += selection.marcado.priceModifier || 0
    if (selection.color) t += selection.color.priceModifier || 0
    return t
  })()

  const cleanPhone = String(phone || '').replace(/\D/g, '')
  const targetPhone = cleanPhone.length >= 10 ? cleanPhone : String(initialData.settings.whatsappNumber).replace(/\D/g, '')

  const handleClick = () => {
    const moto = selection.motoModel ? `${selection.motoModel}` : 'Por confirmar'
    const text = [
      'Hola RMP Motos 👋',
      '',
      'Quiero consultar este pedido:',
      `• Moto: ${moto}`,
      `• Producto: ${product.name}`,
      `• Topes: ${selection.topes?.name || 'No seleccionados'}`,
      `• Marcado: ${selection.marcado?.name || 'No seleccionado'}`,
      `• Color: ${selection.color?.name || 'No seleccionado'}`,
      `• Total estimado: ${fmt(total)}`,
      '',
      '¿Está disponible? ¿Cómo hago el pedido?'
    ].join('\n')
    const wa = `https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`
    window.open(wa, '_blank')
  }

  return (
    <button onClick={handleClick} className="bg-green-600 px-4 py-2 rounded text-white" aria-label="Pedir por WhatsApp">Pedir por WhatsApp</button>
  )
}
