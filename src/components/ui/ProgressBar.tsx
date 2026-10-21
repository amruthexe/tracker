interface ProgressBarProps {
  value: number // 0–100
  label?: string
  color?: string
  size?: 'sm' | 'md'
  showPercent?: boolean
}

export default function ProgressBar({
  value,
  label,
  color = '#EB4917',
  size = 'md',
  showPercent = false,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value))
  const heights = { sm: 'h-1.5', md: 'h-2.5' }

  return (
    <div className="w-full">
      {(label || showPercent) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-xs text-[#6B7280] font-medium">{label}</span>}
          {showPercent && <span className="text-xs font-semibold" style={{ color }}>{pct}%</span>}
        </div>
      )}
      <div className={`w-full bg-[#F7F7F7] rounded-full ${heights[size]} overflow-hidden`}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}
