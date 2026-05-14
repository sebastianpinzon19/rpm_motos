import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { sileo } from 'sileo'
import { initialData } from '../data/initialData'

const STORAGE_KEY = 'rmp_data_v1'

const StoreContext = createContext(null)

const safeNumber = (value, fallback = 0) => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

const sanitizePhone = (phone, fallback = initialData.settings.whatsappNumber) => {
  const digits = String(phone || '').replace(/\D/g, '').slice(0, 15)
  return digits.length >= 10 ? digits : String(fallback || '').replace(/\D/g, '').slice(0, 15)
}

const REAL_IMAGE_FALLBACK = 'https://loremflickr.com/1200/800/motorcycle?lock=900'

const legacyImageMap = {
  '/products/defensa1_main.svg': 'https://loremflickr.com/1200/800/motorcycle,crashbar?lock=101',
  '/products/defensa1_cb125f.svg': 'https://loremflickr.com/1200/800/honda,motorcycle?lock=102',
  '/products/defensa1_fz150.svg': 'https://loremflickr.com/1200/800/yamaha,motorcycle?lock=103',
  '/products/defensa2_main.svg': 'https://loremflickr.com/1200/800/sport,motorcycle?lock=104',
  '/products/defensa2_ns200.svg': 'https://loremflickr.com/1200/800/bajaj,motorcycle?lock=105',
  '/products/portaplaca.svg': 'https://loremflickr.com/1200/800/motorcycle,rear?lock=106',
  '/products/parrilla.svg': 'https://loremflickr.com/1200/800/motorcycle,luggage?lock=107'
}

const normalizeImageUrl = (url) => {
  const clean = String(url || '').trim()
  if (!clean) return REAL_IMAGE_FALLBACK
  if (legacyImageMap[clean]) return legacyImageMap[clean]
  if (clean.includes('placehold.co')) return REAL_IMAGE_FALLBACK
  return clean
}

const sanitizeProduct = (product) => ({
  ...product,
  id: String(product.id || '').trim(),
  name: String(product.name || '').trim(),
  description: String(product.description || '').trim(),
  category: String(product.category || '').trim(),
  basePrice: Math.max(0, safeNumber(product.basePrice, 0)),
  stock: Math.max(0, Math.floor(safeNumber(product.stock, 0))),
  active: Boolean(product.active),
  compatibleBrands: Array.isArray(product.compatibleBrands) ? product.compatibleBrands : [],
  compatibleModels: Array.isArray(product.compatibleModels) ? product.compatibleModels : [],
  images: Array.isArray(product.images) && product.images.length > 0
    ? product.images.map(normalizeImageUrl)
    : [REAL_IMAGE_FALLBACK],
  imagesByModel: typeof product.imagesByModel === 'object' && product.imagesByModel !== null
    ? Object.fromEntries(Object.entries(product.imagesByModel).map(([model, image]) => [model, normalizeImageUrl(image)]))
    : {},
  customizable: Boolean(product.customizable),
  options: product.options || undefined
})

const pickArray = (candidate, fallback) => {
  if (Array.isArray(candidate) && candidate.length > 0) return candidate
  return fallback
}

const sanitizePayload = (payload) => {
  const brands = pickArray(payload?.brands, initialData.brands)
  const categories = pickArray(payload?.categories, initialData.categories)
  const products = pickArray(payload?.products, initialData.products).map(sanitizeProduct)
  const settings = {
    ...initialData.settings,
    ...(payload?.settings || {}),
    whatsappNumber: sanitizePhone(payload?.settings?.whatsappNumber, initialData.settings.whatsappNumber)
  }
  return { brands, categories, products, settings }
}

const adminTokenStorage = {
  getAccess: () => localStorage.getItem('rmp_admin_token'),
  getRefresh: () => localStorage.getItem('rmp_admin_refresh'),
  setTokens: ({ accessToken, refreshToken }) => {
    if (accessToken) localStorage.setItem('rmp_admin_token', accessToken)
    if (refreshToken) localStorage.setItem('rmp_admin_refresh', refreshToken)
  },
  clear: () => {
    localStorage.removeItem('rmp_admin_token')
    localStorage.removeItem('rmp_admin_refresh')
  }
}

const refreshAccessToken = async () => {
  const refreshToken = adminTokenStorage.getRefresh()
  if (!refreshToken) throw new Error('No refresh token')
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Refresh failed')
  adminTokenStorage.setTokens(data)
  return data.accessToken
}

const apiRequest = async (url, options = {}, requiresAdmin = false, retryOn401 = true) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  }

  if (requiresAdmin) {
    const token = adminTokenStorage.getAccess()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(url, { ...options, headers })

  if (response.status === 401 && requiresAdmin && retryOn401) {
    try {
      const newToken = await refreshAccessToken()
      const retryHeaders = { ...headers, Authorization: `Bearer ${newToken}` }
      const retryResponse = await fetch(url, { ...options, headers: retryHeaders })
      if (!retryResponse.ok) {
        const payload = await retryResponse.json().catch(() => ({}))
        throw new Error(payload.error || `API error ${retryResponse.status}`)
      }
      return retryResponse.json()
    } catch (err) {
      adminTokenStorage.clear()
      throw err
    }
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload.error || `API error ${response.status}`)
  }

  return response.json()
}

export const StoreProvider = ({ children }) => {
  const [brands, setBrands] = useState([])
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [settings, setSettings] = useState(initialData.settings)
  const [isHydrated, setIsHydrated] = useState(false)

  const setFromPayload = (payload) => {
    const clean = sanitizePayload(payload)
    setBrands(clean.brands)
    setCategories(clean.categories)
    setProducts(clean.products)
    setSettings(clean.settings)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clean))
  }

  // load from API with local fallback
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const data = await apiRequest('/api/store')
        setFromPayload(data)
      } catch (apiErr) {
        try {
          const raw = localStorage.getItem(STORAGE_KEY)
          if (raw) {
            const parsed = JSON.parse(raw)
            setFromPayload(parsed)
            sileo.warning({
              title: 'Sin conexión con la API',
              description: 'Mostrando datos guardados en este dispositivo.'
            })
            return
          }
        } catch (storageErr) {
          console.error('Error loading storage fallback', storageErr)
          sileo.error({
            title: 'Datos locales dañados',
            description: storageErr?.message || 'No se pudo leer la copia guardada.'
          })
        }

        setBrands(initialData.brands)
        setCategories(initialData.categories)
        setProducts(initialData.products.map(sanitizeProduct))
        setSettings(initialData.settings)
        sileo.info({
          title: 'Modo demostración',
          description: 'No hay API ni datos guardados; se muestra el catálogo de ejemplo.'
        })
      } finally {
        setIsHydrated(true)
      }
    }
    bootstrap()
  }, [])

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key !== STORAGE_KEY || !event.newValue) return
      try {
        const parsed = JSON.parse(event.newValue)
        const clean = sanitizePayload(parsed)
        setBrands(clean.brands)
        setCategories(clean.categories)
        setProducts(clean.products)
        setSettings(clean.settings)
      } catch (err) {
        console.error('Error syncing storage state', err)
        sileo.warning({
          title: 'Sincronización entre pestañas',
          description: err?.message || 'No se pudo aplicar el cambio desde otra ventana.'
        })
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // persist
  useEffect(() => {
    if (!isHydrated) return
    const payload = { brands, categories, products, settings }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  }, [brands, categories, products, settings, isHydrated])

  // product updates
  const updateProduct = async (id, changes) => {
    const current = products.find(p => p.id === id)
    if (!current) return
    const next = sanitizeProduct({ ...current, ...changes })

    try {
      const data = await apiRequest(`/api/products/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(next)
      }, true)
      setFromPayload(data)
      sileo.success({ title: 'Producto actualizado', description: next.name })
    } catch (err) {
      console.error('Error updating product', err)
      setProducts(prev => prev.map(p => p.id === id ? next : p))
      sileo.error({
        title: 'No se guardó en el servidor',
        description: err?.message || 'Los cambios quedaron solo en este navegador.'
      })
    }
  }

  const toggleProductActive = async (id) => {
    try {
      const data = await apiRequest(`/api/products/${id}/active`, {
        method: 'PATCH'
      }, true)
      setFromPayload(data)
      sileo.success({ title: 'Estado del producto', description: 'Visibilidad actualizada correctamente.' })
    } catch (err) {
      console.error('Error toggling product active state', err)
      setProducts(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p))
      sileo.error({ title: 'No se actualizó en el servidor', description: err?.message || 'Revisa la sesión o la API.' })
    }
  }

  const updateStock = async (id, quantity) => {
    const cleanStock = Math.max(0, Math.floor(safeNumber(quantity, 0)))
    try {
      const data = await apiRequest(`/api/products/${id}/stock`, {
        method: 'PATCH',
        body: JSON.stringify({ stock: cleanStock })
      }, true)
      setFromPayload(data)
      sileo.success({ title: 'Stock actualizado', description: `Nuevo stock: ${cleanStock}` })
    } catch (err) {
      console.error('Error updating stock', err)
      setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: cleanStock } : p))
      sileo.error({ title: 'Stock no guardado en el servidor', description: err?.message || 'Valor aplicado solo en local.' })
    }
  }

  const addProduct = async (product) => {
    const cleanProduct = sanitizeProduct(product)
    if (!cleanProduct.id || !cleanProduct.name) return
    try {
      const data = await apiRequest('/api/products', {
        method: 'POST',
        body: JSON.stringify(cleanProduct)
      }, true)
      setFromPayload(data)
      sileo.success({ title: 'Producto creado', description: cleanProduct.name })
    } catch (err) {
      console.error('Error adding product', err)
      setProducts(prev => [cleanProduct, ...prev])
      sileo.error({ title: 'No se creó en el servidor', description: err?.message || 'El producto quedó solo en este navegador.' })
    }
  }

  const toggleCategoryActive = async (id) => {
    try {
      const data = await apiRequest(`/api/categories/${id}/active`, {
        method: 'PATCH'
      }, true)
      setFromPayload(data)
      sileo.success({ title: 'Categoría', description: 'Estado actualizado correctamente.' })
    } catch (err) {
      console.error('Error toggling category', err)
      setCategories(prev => prev.map(c => c.id === id ? { ...c, active: !c.active } : c))
      sileo.error({ title: 'Categoría no actualizada', description: err?.message || 'Revisa la API o la sesión.' })
    }
  }

  const updateSettings = async (changes) => {
    const next = {
      ...changes,
      whatsappNumber: changes.whatsappNumber ? sanitizePhone(changes.whatsappNumber, settings.whatsappNumber) : settings.whatsappNumber
    }
    try {
      const data = await apiRequest('/api/settings', {
        method: 'PATCH',
        body: JSON.stringify(next)
      }, true)
      setFromPayload(data)
      sileo.success({ title: 'Configuración guardada', description: 'Los cambios ya están en el servidor.' })
    } catch (err) {
      console.error('Error updating settings', err)
      setSettings(prev => ({ ...prev, ...next }))
      sileo.error({
        title: 'No se guardó en el servidor',
        description: err?.message || 'Los valores quedaron solo en este navegador.'
      })
    }
  }

  const changeAdminPassword = async ({ currentPassword, newPassword }) => {
    const data = await apiRequest('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword })
    }, true)
    return data
  }

  const logoutAdmin = async () => {
    try {
      const refreshToken = adminTokenStorage.getRefresh()
      if (refreshToken) {
        await apiRequest('/api/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken })
        }, true)
      }
    } catch (err) {
      console.warn('Logout request failed, clearing local auth anyway', err)
    } finally {
      adminTokenStorage.clear()
    }
  }

  const getProductsByMotoModel = (brandId, model) => {
    return products.filter(p => {
      const catActive = categories.find(c => c.id === p.category)?.active !== false
      if (!catActive) return false
      const brandMatch = p.compatibleBrands?.includes(brandId)
      const modelMatch = p.compatibleModels?.includes(model)
      return (brandMatch || modelMatch) && p.active
    })
  }

  const value = useMemo(() => ({
    brands,
    categories,
    products,
    settings,
    updateProduct,
    toggleProductActive,
    updateStock,
    addProduct,
    toggleCategoryActive,
    updateSettings,
    changeAdminPassword,
    logoutAdmin,
    getProductsByMotoModel
  }), [brands, categories, products, settings])

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  )
}

export const useStore = () => useContext(StoreContext)
