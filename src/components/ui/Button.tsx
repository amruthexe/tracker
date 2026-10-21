'use client'

import { ButtonHTMLAttributes, forwardRef } from 'react'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  leftIcon?: React.ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, leftIcon, children, disabled, className = '', ...props }, ref) => {
    const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EB4917] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

    const variants = {
      primary: 'bg-[#EB4917] text-white hover:bg-[#c73c12] active:scale-95 shadow-sm',
      secondary: 'bg-white text-[#171717] border border-[#E8E8E8] hover:bg-[#F7F7F7] active:scale-95',
      ghost: 'text-[#6B7280] hover:bg-[#F7F7F7] hover:text-[#171717]',
      danger: 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 active:scale-95',
    }

    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-5 py-3 text-base',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : leftIcon}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

export default Button
