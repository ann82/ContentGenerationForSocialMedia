"use client"

// Simple toast implementation
export type ToastProps = {
  title?: string
  description?: string
  variant?: "default" | "destructive"
  duration?: number
}

// Simple toast function that uses browser alerts as a fallback
// This ensures we always have some feedback even if the toast component fails
export const toast = (props: ToastProps) => {
  if (typeof window !== "undefined") {
    try {
      // Try to dispatch a custom event for the toast
      const event = new CustomEvent("toast-message", { detail: props })
      window.dispatchEvent(event)
    } catch (error) {
      // Fallback to alert if the event dispatch fails
      console.error("Toast error:", error)
      alert(`${props.title || ""} ${props.description || ""}`)
    }
  }
  return ""
}

// Simple hook for components that need to create toasts
export function useToast() {
  return { toast }
}
