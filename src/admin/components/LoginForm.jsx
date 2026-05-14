import React, { useState } from 'react'
import { sileo } from 'sileo'
import { apiUrl } from '../../utils/apiUrl'

export default function LoginForm({ onAuthenticated }){
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      const res = await fetch(apiUrl('/api/auth/login'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Login failed')
      localStorage.setItem('rmp_admin_token', data.accessToken)
      localStorage.setItem('rmp_admin_refresh', data.refreshToken)
      sileo.success({ title: 'Sesión iniciada', description: 'Panel de administración listo.' })
      onAuthenticated && onAuthenticated()
    } catch (err) {
      localStorage.removeItem('rmp_admin_token')
      localStorage.removeItem('rmp_admin_refresh')
      const msg = err.message || 'Usuario o contraseña inválidos. Si cambiaste la clave, usa la última guardada en Configuración.'
      setError(msg)
      sileo.error({ title: 'No se pudo iniciar sesión', description: msg })
    }
  }

  return (
    <div className="max-w-md mx-auto p-4 bg-surface border border-[#333] rounded">
      <h2 className="text-xl mb-3">Admin Login</h2>
      <p className="text-sm text-gray-300 mb-3">Acceso protegido para administración.</p>
      <form onSubmit={submit} className="space-y-3">
        <input aria-label="Usuario" value={username} onChange={e=>setUsername(e.target.value)} className="w-full p-2 bg-[#111] border border-[#333] rounded" />
        <input aria-label="Contraseña" type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full p-2 bg-[#111] border border-[#333] rounded" />
        <div className="flex gap-2">
          <button className="bg-primary text-white px-3 py-2 rounded">Entrar</button>
        </div>
        {error && <div className="text-red-400">{error}</div>}
      </form>
    </div>
  )
}
