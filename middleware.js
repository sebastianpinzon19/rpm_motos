/**
 * En Vercel: reenvía /api/* al servidor Express real (Railway, Render, etc.).
 * Define en Vercel → Settings → Environment Variables:
 *   API_PROXY_TARGET = https://tu-backend.railway.app   (sin barra final)
 * El front puede seguir usando fetch('/api/...') sin VITE_API_BASE.
 */
const skipRequestHeaders = new Set([
  'host',
  'connection',
  'content-length',
  'transfer-encoding',
  'keep-alive',
  'upgrade'
])

export const config = {
  runtime: 'nodejs',
  matcher: ['/api', '/api/:path*', '/products', '/products/:path*']
}

export default async function middleware (request) {
  const url = new URL(request.url)
  const base = process.env.API_PROXY_TARGET?.trim()?.replace(/\/$/, '')
  if (!base) {
    return new Response(
      JSON.stringify({
        error: 'API no configurada en Vercel',
        hint: 'Añade API_PROXY_TARGET (URL raíz del servidor Node, p. ej. https://xxx.railway.app). En el backend, incluye la URL de tu sitio en Vercel dentro de ALLOWED_ORIGINS.'
      }),
      { status: 503, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
    )
  }

  const targetUrl = `${base}${url.pathname}${url.search}`

  const headers = new Headers()
  request.headers.forEach((value, key) => {
    if (skipRequestHeaders.has(key.toLowerCase())) return
    headers.set(key, value)
  })

  const init = {
    method: request.method,
    headers,
    redirect: 'manual'
  }

  if (request.method !== 'GET' && request.method !== 'HEAD' && request.body) {
    init.body = request.body
    init.duplex = 'half'
  }

  let backend
  try {
    backend = await fetch(targetUrl, init)
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: 'No se pudo contactar el API',
        detail: String(err?.message || err)
      }),
      { status: 502, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
    )
  }

  const out = new Headers()
  backend.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'transfer-encoding') return
    out.set(key, value)
  })

  return new Response(backend.body, {
    status: backend.status,
    statusText: backend.statusText,
    headers: out
  })
}
