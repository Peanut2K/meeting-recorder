'use client'
import { useState, useCallback } from 'react'

type ToastType = 'success' | 'error'
interface ToastItem { id: number; msg: string; type: ToastType }

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const toast = useCallback((msg: string, type: ToastType = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, msg, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  function ToastContainer() {
    return (
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-lg pointer-events-auto animate-in fade-in slide-in-from-top-2 duration-200
            ${t.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            <span>{t.type === 'success' ? '✓' : '✕'}</span>
            {t.msg}
          </div>
        ))}
      </div>
    )
  }

  return { toast, ToastContainer }
}
