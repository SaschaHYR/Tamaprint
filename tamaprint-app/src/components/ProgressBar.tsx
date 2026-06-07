import { motion } from 'framer-motion'

interface Props {
  value: number // 0-100
  color?: string
  label?: string
  thin?: boolean
}

export default function ProgressBar({ value, color = '#7B2FBE', label, thin }: Props) {
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-1">
          <span className="font-mono text-xs text-white/40 tracking-widest uppercase">{label}</span>
          <span className="font-mono text-xs" style={{ color }}>{value.toFixed(0)}%</span>
        </div>
      )}
      <div
        className="w-full bg-white/5 rounded-full overflow-hidden"
        style={{ height: thin ? 2 : 4 }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}
