import React, { useState } from 'react'
import { useStore } from '../../context/StoreContext'

export default function SettingsManager() {
  const { settings, updateSettings, changeAdminPassword } = useStore()
  const [whatsappNumber, setWhatsappNumber] = useState(settings.whatsappNumber || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const onSave = async () => {
    setError('')
    setMessage('')
    try {
      await updateSettings({ whatsappNumber })
      if (newPassword || currentPassword) {
        if (newPassword !== confirmPassword) {
          setError('Las contraseñas no coinciden')
          return
        }
        if (newPassword.length < 8) {
          setError('La nueva contraseña debe tener al menos 8 caracteres')
          return
        }
        await changeAdminPassword({ currentPassword, newPassword })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
      setSaved(true)
      setMessage('Configuración guardada.')
      setTimeout(() => setSaved(false), 1200)
    } catch (err) {
      setError(err.message || 'No se pudo guardar')
    }
  }

  return (
    <div className="bg-surface border border-[#333] rounded p-4 space-y-3">
      <h2 className="text-xl font-semibold">Configuración</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm mb-1" htmlFor="wa">Número de WhatsApp</label>
          <input id="wa" aria-label="Número de WhatsApp" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} className="w-full bg-[#111] border border-[#333] rounded p-2" />
        </div>
        <div>
          <p className="block text-sm mb-1">Cambiar contraseña admin</p>
          <input aria-label="Contraseña actual" type="password" placeholder="Contraseña actual" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full bg-[#111] border border-[#333] rounded p-2 mb-2" />
          <input aria-label="Nueva contraseña" type="password" placeholder="Nueva contraseña" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-[#111] border border-[#333] rounded p-2 mb-2" />
          <input aria-label="Confirmar contraseña" type="password" placeholder="Confirmar nueva contraseña" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-[#111] border border-[#333] rounded p-2" />
        </div>
      </div>
      <button aria-label="Guardar configuración" onClick={onSave} className="bg-primary text-white px-4 py-2 rounded">Guardar</button>
      {saved && <p className="text-green-400">{message}</p>}
      {error && <p className="text-red-400">{error}</p>}
    </div>
  )
}
