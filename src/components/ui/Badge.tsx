'use client'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'orange' | 'purple' | 'blue' | 'green'
  size?: 'sm' | 'md'
}

const variants = {
  default: 'bg-[#F7F7F7] text-[#6B7280]',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
  orange: 'bg-orange-100 text-orange-700',
  purple: 'bg-purple-100 text-purple-700',
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-green-100 text-green-700',
}

export default function Badge({ children, variant = 'default', size = 'sm' }: BadgeProps) {
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  }
  return (
    <span className={`inline-flex items-center font-medium rounded-lg ${variants[variant]} ${sizes[size]}`}>
      {children}
    </span>
  )
}
