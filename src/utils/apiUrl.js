/**
 * Prefijo base del API en producción (Vercel, etc.).
 * En local, dejar vacío: Vite hace proxy de /api al servidor en 8787.
 * En el host del front (Vercel): VITE_API_BASE=https://tu-api.railway.app
 */
export function apiUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`
  if (p.startsWith('http://') || p.startsWith('https://')) return p
  const raw = import.meta.env.VITE_API_BASE
  const base = raw == null ? '' : String(raw).trim().replace(/\/$/, '')
  if (!base) return p
  return `${base}${p}`
}
