import React from 'react'

export default function CustomizerPanel({ product, selection, setSelection }){
  const opts = product.options || {}

  const pick = (group, option) => {
    setSelection(prev => ({ ...prev, [group]: option }))
  }

  return (
    <div className="p-4 bg-surface rounded">
      <h3 className="font-semibold">Personalizar</h3>

      {opts.topes && (
        <div className="mt-3">
          <div className="text-sm text-gray-300">Topes</div>
          <div className="flex gap-2 mt-2">
            {opts.topes.map(t => (
              <button key={t.id} onClick={() => pick('topes', t)} className={`px-3 py-1 rounded ${selection.topes?.id===t.id? 'ring-2 ring-accent':''}`}>{t.name}</button>
            ))}
          </div>
        </div>
      )}

      {opts.marcado && (
        <div className="mt-3">
          <div className="text-sm text-gray-300">Marcado</div>
          <div className="flex gap-2 mt-2">
            {opts.marcado.map(m => (
              <button key={m.id} onClick={() => pick('marcado', m)} className={`px-3 py-1 rounded ${selection.marcado?.id===m.id? 'ring-2 ring-accent':''}`}>{m.name}</button>
            ))}
          </div>
        </div>
      )}

      {opts.colores && (
        <div className="mt-3">
          <div className="text-sm text-gray-300">Colores</div>
          <div className="flex gap-2 mt-2 items-center">
            {opts.colores.map(c => (
              <button key={c.id} onClick={() => pick('color', c)} aria-label={c.name} className={`w-8 h-8 rounded-full ring-2 ${selection.color?.id===c.id? 'ring-accent':''}`} style={{ background: c.hex }} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
