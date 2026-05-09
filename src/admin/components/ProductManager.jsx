import React, { useMemo, useState } from 'react'
import { useStore } from '../../context/StoreContext'

const emptyForm = {
  id: '',
  name: '',
  category: 'defensas',
  basePrice: 0,
  stock: 0,
  active: true,
  description: '',
  customizable: false,
  compatibleBrands: [],
  compatibleModels: [],
  images: ['https://placehold.co/400x300/1a1a1a/e63312?text=RMP+Motos'],
  imagesByModel: {}
}

export default function ProductManager() {
  const { products, categories, updateProduct, toggleProductActive, addProduct } = useStore()
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(emptyForm)
  const [showAdd, setShowAdd] = useState(false)
  const [newForm, setNewForm] = useState(emptyForm)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '')

  const byId = useMemo(() => Object.fromEntries(products.map(p => [p.id, p])), [products])

  const startEdit = (id) => {
    setEditingId(id)
    const p = byId[id]
    setEditForm({ ...emptyForm, ...p })
  }

  const autofillFromWeb = (formSetter, product) => {
    // create imagesByModel using Unsplash Source for each compatible model
    const map = {}
    const models = product?.compatibleModels || (Array.isArray(editForm.compatibleModels) ? editForm.compatibleModels : [])
    for (const m of models) {
      const q = encodeURIComponent(String(m))
      map[m] = `https://source.unsplash.com/1200x800/?motorcycle,${q}`
    }
    const main = `https://source.unsplash.com/1200x800/?motorcycle,${encodeURIComponent(product?.name || 'defensa')}`
    formSetter(v => ({ ...v, images: [main], imagesByModel: map }))
  }

  const handleImageUpload = async (file, formSetter, field = 'images') => {
    if (!file) return
    
    setUploading(true)
    setUploadError('')
    
    try {
      const formData = new FormData()
      formData.append('image', file)
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al subir imagen')
      }
      
      const data = await response.json()
      
      if (field === 'images') {
        formSetter(prev => ({
          ...prev,
          images: Array.isArray(prev.images) ? [...prev.images, data.url] : [data.url]
        }))
      } else if (field.startsWith('imagesByModel.')) {
        const model = field.replace('imagesByModel.', '')
        formSetter(prev => ({
          ...prev,
          imagesByModel: {
            ...prev.imagesByModel,
            [model]: data.url
          }
        }))
      }
    } catch (err) {
      setUploadError(err.message)
      console.error('Upload error:', err)
    } finally {
      setUploading(false)
    }
  }

  const saveEdit = () => {
    if (!editForm.name.trim()) return
    updateProduct(editingId, {
      name: editForm.name.trim(),
      category: editForm.category,
      basePrice: Number(editForm.basePrice) || 0,
      stock: Number(editForm.stock) || 0,
      description: editForm.description.trim(),
      images: Array.isArray(editForm.images) ? editForm.images : String(editForm.images || '').split(',').map(s => s.trim()).filter(Boolean),
      imagesByModel: typeof editForm.imagesByModel === 'object' ? editForm.imagesByModel : (() => { try { return JSON.parse(editForm.imagesByModel || '{}') } catch(e){ return {} } })()
    })
    setEditingId(null)
  }

  const saveNew = () => {
    if (!newForm.id.trim() || !newForm.name.trim()) return
    addProduct({
      ...newForm,
      id: newForm.id.trim(),
      name: newForm.name.trim(),
      basePrice: Number(newForm.basePrice) || 0,
      stock: Number(newForm.stock) || 0,
      description: newForm.description.trim(),
      images: Array.isArray(newForm.images) ? newForm.images : String(newForm.images || '').split(',').map(s => s.trim()).filter(Boolean),
      imagesByModel: typeof newForm.imagesByModel === 'object' ? newForm.imagesByModel : (() => { try { return JSON.parse(newForm.imagesByModel || '{}') } catch(e){ return {} } })()
    })
    setNewForm(emptyForm)
    setShowAdd(false)
  }

  return (
    <div className="bg-surface border border-[#333] rounded p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Gestión de Productos</h2>
        <button aria-label="Agregar producto" onClick={() => setShowAdd(!showAdd)} className="bg-primary text-white px-3 py-2 rounded">Agregar producto</button>
      </div>

      {uploadError && (
        <div className="bg-red-900/50 border border-red-700 rounded p-3 text-red-100">
          {uploadError}
        </div>
      )}

      {showAdd && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-surface2 p-3 rounded">
          <input aria-label="ID" placeholder="ID (ej: def-003)" className="bg-[#111] p-2 rounded border border-[#333]" value={newForm.id} onChange={(e) => setNewForm(v => ({ ...v, id: e.target.value }))} />
          <input aria-label="Nombre" placeholder="Nombre" className="bg-[#111] p-2 rounded border border-[#333]" value={newForm.name} onChange={(e) => setNewForm(v => ({ ...v, name: e.target.value }))} />
          <select aria-label="Categoría" className="bg-[#111] p-2 rounded border border-[#333]" value={newForm.category} onChange={(e) => setNewForm(v => ({ ...v, category: e.target.value }))}>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input aria-label="Precio base" type="number" min="0" className="bg-[#111] p-2 rounded border border-[#333]" value={newForm.basePrice} onChange={(e) => setNewForm(v => ({ ...v, basePrice: e.target.value }))} />
          <input aria-label="Stock" type="number" min="0" className="bg-[#111] p-2 rounded border border-[#333]" value={newForm.stock} onChange={(e) => setNewForm(v => ({ ...v, stock: e.target.value }))} />
          <input aria-label="Descripción" placeholder="Descripción" className="bg-[#111] p-2 rounded border border-[#333]" value={newForm.description} onChange={(e) => setNewForm(v => ({ ...v, description: e.target.value }))} />
          
          <div className="md:col-span-2">
            <label className="text-sm text-gray-300 mb-1 block">Imágenes principales</label>
            <input aria-label="Imágenes (URLs, separadas por coma)" placeholder="https://... , https://..." className="bg-[#111] p-2 rounded border border-[#333] w-full" value={Array.isArray(newForm.images) ? newForm.images.join(', ') : (newForm.images || '')} onChange={(e) => setNewForm(v => ({ ...v, images: e.target.value }))} />
            <div className="mt-2 flex gap-2 items-center">
              <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e.target.files?.[0], setNewForm, 'images')} className="text-sm" disabled={uploading} />
              {uploading && <span className="text-sm text-blue-400">Subiendo...</span>}
            </div>
            {Array.isArray(newForm.images) && newForm.images.length > 0 && (
              <div className="mt-2 flex gap-2 flex-wrap">
                {newForm.images.map((img, idx) => (
                  <div key={idx} className="relative">
                    <img src={img} alt="preview" className="h-16 w-16 object-cover rounded" />
                    <button onClick={() => setNewForm(v => ({ ...v, images: v.images.filter((_, i) => i !== idx) }))} className="absolute -top-2 -right-2 bg-red-600 rounded-full w-5 h-5 text-xs">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <textarea aria-label="ImagesByModel (JSON)" placeholder='{"Yamaha YZF-R3":"https://..."}' className="bg-[#111] p-2 rounded border border-[#333] md:col-span-2" value={typeof newForm.imagesByModel === 'object' ? JSON.stringify(newForm.imagesByModel) : (newForm.imagesByModel || '')} onChange={(e) => setNewForm(v => ({ ...v, imagesByModel: e.target.value }))} />
          <div className="md:col-span-2 flex gap-2">
            <button aria-label="Autocompletar imágenes web" onClick={() => autofillFromWeb(setNewForm, newForm)} className="bg-[#2563eb] text-white px-3 py-2 rounded">Autocompletar imágenes</button>
            <button aria-label="Guardar producto" onClick={saveNew} className="bg-accent text-black px-3 py-2 rounded">Guardar</button>
            <button aria-label="Cancelar" onClick={() => setShowAdd(false)} className="bg-[#333] px-3 py-2 rounded">Cancelar</button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-[#333]">
              <th className="py-2">Nombre</th>
              <th>Categoría</th>
              <th>Stock</th>
              <th>Precio</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id} className="border-b border-[#252525]">
                <td className="py-2">{p.name}</td>
                <td>{p.category}</td>
                <td>{p.stock}</td>
                <td>${(p.basePrice || 0).toLocaleString('es-CO')}</td>
                <td>{p.active ? 'Activo' : 'Inactivo'}</td>
                <td className="flex gap-2 py-1">
                  <button aria-label={`Activar o desactivar ${p.name}`} onClick={() => toggleProductActive(p.id)} className="bg-[#333] px-2 py-1 rounded">Toggle</button>
                  <button aria-label={`Editar ${p.name}`} onClick={() => startEdit(p.id)} className="bg-[#333] px-2 py-1 rounded">Editar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingId && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-surface2 p-3 rounded">
          <input aria-label="Nombre de producto" className="bg-[#111] p-2 rounded border border-[#333]" value={editForm.name} onChange={(e) => setEditForm(v => ({ ...v, name: e.target.value }))} />
          <select aria-label="Categoría de producto" className="bg-[#111] p-2 rounded border border-[#333]" value={editForm.category} onChange={(e) => setEditForm(v => ({ ...v, category: e.target.value }))}>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input aria-label="Precio de producto" type="number" min="0" className="bg-[#111] p-2 rounded border border-[#333]" value={editForm.basePrice} onChange={(e) => setEditForm(v => ({ ...v, basePrice: e.target.value }))} />
          <input aria-label="Stock de producto" type="number" min="0" className="bg-[#111] p-2 rounded border border-[#333]" value={editForm.stock} onChange={(e) => setEditForm(v => ({ ...v, stock: e.target.value }))} />
          <input aria-label="Descripción de producto" className="md:col-span-2 bg-[#111] p-2 rounded border border-[#333]" value={editForm.description} onChange={(e) => setEditForm(v => ({ ...v, description: e.target.value }))} />
          
          <div className="md:col-span-2">
            <label className="text-sm text-gray-300 mb-1 block">Imágenes principales</label>
            <input aria-label="Imágenes (URLs, separadas por coma)" className="bg-[#111] p-2 rounded border border-[#333] w-full" value={Array.isArray(editForm.images) ? editForm.images.join(', ') : (editForm.images || '')} onChange={(e) => setEditForm(v => ({ ...v, images: e.target.value }))} />
            <div className="mt-2 flex gap-2 items-center">
              <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e.target.files?.[0], setEditForm, 'images')} className="text-sm" disabled={uploading} />
              {uploading && <span className="text-sm text-blue-400">Subiendo...</span>}
            </div>
            {Array.isArray(editForm.images) && editForm.images.length > 0 && (
              <div className="mt-2 flex gap-2 flex-wrap">
                {editForm.images.map((img, idx) => (
                  <div key={idx} className="relative">
                    <img src={img} alt="preview" className="h-16 w-16 object-cover rounded" />
                    <button onClick={() => setEditForm(v => ({ ...v, images: v.images.filter((_, i) => i !== idx) }))} className="absolute -top-2 -right-2 bg-red-600 rounded-full w-5 h-5 text-xs">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <textarea aria-label="ImagesByModel (JSON)" placeholder='{"Yamaha YZF-R3":"https://..."}' className="bg-[#111] p-2 rounded border border-[#333] md:col-span-2" value={typeof editForm.imagesByModel === 'object' ? JSON.stringify(editForm.imagesByModel) : (editForm.imagesByModel || '')} onChange={(e) => setEditForm(v => ({ ...v, imagesByModel: e.target.value }))} />
          <div className="md:col-span-2 flex gap-2">
            <button aria-label="Autocompletar imágenes web" onClick={() => autofillFromWeb(setEditForm, editForm)} className="bg-[#2563eb] text-white px-3 py-2 rounded">Autocompletar imágenes</button>
            <button aria-label="Guardar cambios" onClick={saveEdit} className="bg-accent text-black px-3 py-2 rounded">Guardar cambios</button>
            <button aria-label="Cerrar edición" onClick={() => setEditingId(null)} className="bg-[#333] px-3 py-2 rounded">Cancelar</button>
          </div>
        </div>
      )}
    </div>  )
}