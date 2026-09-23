import { useState } from 'react'
import { apiFetch } from '../api'

export default function ChangePasswordModal({ isOpen, onClose, showToast }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPlain, setShowPlain] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  if (!isOpen) return null

  const handleClose = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setErrorMsg('')
    onClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMsg('Semua kolom kata sandi wajib diisi.')
      return
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Konfirmasi kata sandi baru tidak cocok.')
      return
    }

    if (newPassword.length < 6) {
      setErrorMsg('Kata sandi baru minimal harus 6 karakter.')
      return
    }

    if (newPassword === currentPassword) {
      setErrorMsg('Kata sandi baru tidak boleh sama dengan kata sandi saat ini.')
      return
    }

    setLoading(true)
    try {
      await apiFetch('/auth/password', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword
        })
      })

      if (showToast) {
        showToast('Kata sandi berhasil diperbarui!', 'success')
      }
      handleClose()
    } catch (err) {
      setErrorMsg(err.message || 'Gagal mengubah kata sandi.')
      if (showToast) {
        showToast(err.message || 'Gagal mengubah kata sandi', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-md bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-neo-xl overflow-hidden rounded-2xl transform transition-all animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-neoYellow text-black border-b-4 border-black flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔑</span>
            <h3 className="font-black text-sm uppercase tracking-wider">
              GANTI KATA SANDI
            </h3>
          </div>
          <button
            type="button"
            className="w-8 h-8 flex items-center justify-center font-black text-base bg-white border-2 border-black rounded-lg shadow-neo-sm hover:bg-rose-100 hover:text-rose-600 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
            onClick={handleClose}
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border-2 border-rose-500 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-2">
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-black text-black dark:text-white uppercase tracking-wider mb-1.5">
              KATA SANDI SAAT INI
            </label>
            <input
              type={showPlain ? 'text' : 'password'}
              className="w-full bg-zinc-50 dark:bg-zinc-800 border-3 border-black dark:border-white px-3.5 py-2.5 text-xs font-bold text-black dark:text-white rounded-xl shadow-neo-sm outline-none focus:bg-white dark:focus:bg-zinc-700"
              placeholder="Masukkan kata sandi lama..."
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-black dark:text-white uppercase tracking-wider mb-1.5">
              KATA SANDI BARU
            </label>
            <input
              type={showPlain ? 'text' : 'password'}
              className="w-full bg-zinc-50 dark:bg-zinc-800 border-3 border-black dark:border-white px-3.5 py-2.5 text-xs font-bold text-black dark:text-white rounded-xl shadow-neo-sm outline-none focus:bg-white dark:focus:bg-zinc-700"
              placeholder="Minimal 6 karakter..."
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-black dark:text-white uppercase tracking-wider mb-1.5">
              KONFIRMASI KATA SANDI BARU
            </label>
            <input
              type={showPlain ? 'text' : 'password'}
              className="w-full bg-zinc-50 dark:bg-zinc-800 border-3 border-black dark:border-white px-3.5 py-2.5 text-xs font-bold text-black dark:text-white rounded-xl shadow-neo-sm outline-none focus:bg-white dark:focus:bg-zinc-700"
              placeholder="Ulangi kata sandi baru..."
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="inline-flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-zinc-600 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={showPlain}
                onChange={e => setShowPlain(e.target.checked)}
                className="w-4 h-4 border-2 border-black rounded accent-black"
              />
              <span>Perlihatkan kata sandi</span>
            </label>
          </div>

          <div className="pt-3 flex gap-3">
            <button
              type="button"
              className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-black dark:text-white border-3 border-black dark:border-white rounded-xl font-black text-xs uppercase tracking-wider shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
              onClick={handleClose}
              disabled={loading}
            >
              BATAL
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-neoGreen hover:bg-emerald-400 text-black border-3 border-black rounded-xl font-black text-xs uppercase tracking-wider shadow-neo active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="animate-spin text-sm">⏳</span>
                  <span>MEMPROSES...</span>
                </>
              ) : (
                <>
                  <span>💾</span>
                  <span>SIMPAN PASSWORD</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
