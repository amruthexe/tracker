interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg' | 'none'
}

export default function Card({ children, className = '', padding = 'md' }: CardProps) {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6',
  }
  return (
    <div className={`bg-white rounded-2xl border border-[#E8E8E8] ${paddings[padding]} ${className}`}>
      {children}
    </div>
  )
}
