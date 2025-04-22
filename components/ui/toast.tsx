"use client"

export interface ToastProps {
  id: string
  title?: string
  description?: string
  variant?: "default" | "destructive"
  onClose?: () => void
}

export function Toast({ id, title, description, variant = "default", onClose }: ToastProps) {
  return (
    <div
      className={`fixed bottom-4 right-4 z-50 rounded-md shadow-lg p-4 max-w-md ${
        variant === "destructive" ? "bg-red-600 text-white" : "bg-white text-gray-900 border border-gray-200"
      }`}
    >
      {title && <h3 className="font-medium mb-1">{title}</h3>}
      {description && <p className="text-sm">{description}</p>}
      <button onClick={onClose} className="absolute top-2 right-2 text-sm" aria-label="Close toast">
        ×
      </button>
    </div>
  )
}

export function ToastContainer({ toasts, dismiss }: { toasts: ToastProps[]; dismiss: (id: string) => void }) {
  return (
    <div className="fixed bottom-0 right-0 z-50 p-4 flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={() => dismiss(toast.id)} />
      ))}
    </div>
  )
}
