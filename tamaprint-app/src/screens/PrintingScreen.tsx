import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { RESINS } from '../data/resins'
import { getPrinterForLevel } from '../data/printers'

const TOTAL_LAYERS = 40

export default function PrintingScreen() {
  const { level, currentSession, completeStep, abandonPrint } = useGameStore()
  const resin = currentSession?.resinId ? RESINS[currentSession.resinId] : null
  const printer = getPrinterForLevel(level)

  const [layer, setLayer] = useState(0)
  const [phase, setPhase] = useState<'printing' | 'done'>('printing')

  useEffect(() => {
    if (layer >= TOTAL_LAYERS) {
      setPhase('done')
      return
    }
    const t = setTimeout(() => setLayer((l) => l + 1), 180)
    return () => clearTimeout(t)
  }, [layer])

  useEffect(() => {
    if (phase === 'done') {
      setTimeout(() => completeStep('printing', 100), 800)
    }
  }, [phase, completeStep])

  const progress = (layer / TOTAL_LAYERS) * 100
  const color = resin?.color ?? printer.accentColor

  return (
    <div className="flex flex-col items-center h-dvh max-w-sm mx-auto px-5 safe-top safe-bottom">
      <div className="w-full flex items-center justify-between mb-8">
        <button onClick={abandonPrint} className="font-mono text-xs text-white/20 hover:text-white/50">
          ✕ Abandonner
        </button>
        <span className="font-mono text-xs tracking-widest uppercase text-white/40">Impression</span>
        <span className="font-mono text-xs" style={{ color }}>{resin?.name}</span>
      </div>

      {/* Main animation */}
      <div className="flex-1 flex items-center justify-center">
        <div className="relative w-48 h-64 flex flex-col items-center">
          {/* UV light bar at top */}
          <motion.div
            className="w-full h-3 rounded-t-lg"
            style={{ background: `linear-gradient(90deg, transparent, ${color}cc, transparent)` }}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 0.36, repeat: Infinity }}
          />

          {/* Vat */}
          <div
            className="flex-1 w-full border-b-2 border-x-2 rounded-b-xl overflow-hidden relative"
            style={{ borderColor: '#ffffff10', background: '#0a0a12' }}
          >
            {/* Resin pool */}
            <div
              className="absolute bottom-0 left-0 right-0"
              style={{
                height: '30%',
                background: `linear-gradient(to top, ${color}30, ${color}10)`,
              }}
            />

            {/* Build plate descending */}
            <motion.div
              className="absolute left-2 right-2 rounded-sm"
              style={{
                height: 4,
                background: '#e0e0ee',
                top: `${10 + (layer / TOTAL_LAYERS) * 45}%`,
              }}
            />

            {/* Printed layers building up below plate */}
            <motion.div
              className="absolute left-2 right-2 rounded-sm"
              style={{
                background: `linear-gradient(to top, ${color}dd, ${color}99)`,
                bottom: '30%',
                height: `${(layer / TOTAL_LAYERS) * 28}%`,
              }}
            />

            {/* Current layer flash */}
            {layer < TOTAL_LAYERS && (
              <motion.div
                key={layer}
                className="absolute left-2 right-2 h-px"
                style={{
                  bottom: `calc(30% + ${(layer / TOTAL_LAYERS) * 28}%)`,
                  background: color,
                  boxShadow: `0 0 6px ${color}`,
                }}
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              />
            )}
          </div>

          {/* Done state overlay */}
          {phase === 'done' && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center rounded-xl"
              style={{ background: '#08080ecc' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="text-center">
                <div className="text-3xl mb-2">✓</div>
                <div className="font-mono text-xs text-white/60">Terminé</div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="w-full mt-6 space-y-3">
        <div className="flex justify-between font-mono text-xs">
          <span className="text-white/40">Couche</span>
          <span style={{ color }}>{layer} / {TOTAL_LAYERS}</span>
        </div>

        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: color }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.15 }}
          />
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: 'Épaisseur', value: `${getPrinterForLevel(level).layerThickness}µm` },
            { label: 'Exposition', value: `${resin?.exposureTime ?? 0}s` },
            { label: 'Résine', value: resin?.shades[0] ?? '—' },
          ].map((stat) => (
            <div key={stat.label} className="p-2 rounded-lg" style={{ background: '#0d0d16' }}>
              <div className="font-mono text-xs text-white/30">{stat.label}</div>
              <div className="font-mono text-sm font-bold text-white">{stat.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
