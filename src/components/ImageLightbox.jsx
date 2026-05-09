import React from 'react'

export default function ImageLightbox({ src, alt, onClose }){
  if (!src) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div className="max-w-[90%] max-h-[90%]">
        <img src={src} alt={alt} className="w-full h-auto max-h-[90vh] rounded shadow-lg" />
      </div>
    </div>
  )
}
