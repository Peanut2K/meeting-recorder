import { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
  loading?: boolean
}

export function Button({ variant = 'primary', loading, children, className, disabled, ...props }: ButtonProps) {
  const base = 'px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
  const variants = {
    primary: 'bg-black text-white hover:bg-gray-800',
    secondary: 'bg-gray-100 text-black hover:bg-gray-200',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  }
  return (
    <button
      className={cn(base, variants[variant], className)}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading ? 'Loading...' : children}
    </button>
  )
}
