"use client"

import { useEffect, useState } from "react"
import type { ToastProps } from "./use-toast"

type Toast = ToastProps & { id: string }

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const handleToast = (e: Event) => {
      try {
        const detail = (e as CustomEvent<ToastProps>).detail
        const id = Math.random().toString(36).substring(2, 9)
        const newToast = { id, ...detail }

        setToasts((prev) => [...prev, newToast])

        if (detail.duration !== 0) {
          setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id))
          }, detail.duration || 5000)
        }
      } catch (error) {
        console.error("Error handling toast:", error)
      }
    }

    window.addEventListener("toast-message", handleToast as EventListener)
    return () => window.removeEventListener("toast-message", handleToast as EventListener)
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-0 right-0 z-50 p-4 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-md shadow-lg p-4 max-w-md ${
            toast.variant === "destructive" ? "bg-red-600 text-white" : "bg-white text-gray-900 border border-gray-200"
          }`}
        >
          {toast.title && <h3 className="font-medium mb-1">{toast.title}</h3>}
          {toast.description && <p className="text-sm">{toast.description}</p>}
          <button
            onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
            className="absolute top-2 right-2 text-sm"
            aria-label="Close toast"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
