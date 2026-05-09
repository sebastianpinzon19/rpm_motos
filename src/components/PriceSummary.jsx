import React, { useMemo } from 'react'

function formatCOP(n){
  return '$' + n.toLocaleString('es-CO')
}

export default function PriceSummary({ base, product, selection }){
  const total = useMemo(() => {
    let t = base || product.basePrice || 0
    if (selection.topes) t += selection.topes.priceModifier || 0
    if (selection.marcado) t += selection.marcado.priceModifier || 0
    if (selection.color) t += selection.color.priceModifier || 0
    return t
  }, [base, product, selection])

  return (
    <div className="p-4 bg-surface rounded">
      <div className="text-sm text-gray-300">Resumen de precio</div>
      <div className="mt-2">
        <div>{formatCOP(product.basePrice)}{selection.topes? ` + ${formatCOP(selection.topes.priceModifier)} (${selection.topes.name})`: ''}</div>
        <div>{selection.marcado? ` + ${formatCOP(selection.marcado.priceModifier)} (${selection.marcado.name})`: ''}</div>
        <div>{selection.color? ` + ${formatCOP(selection.color.priceModifier)} (${selection.color.name})`: ''}</div>
      </div>
      <div className="mt-3 font-bold">Total: {formatCOP(total)}</div>
    </div>
  )
}
