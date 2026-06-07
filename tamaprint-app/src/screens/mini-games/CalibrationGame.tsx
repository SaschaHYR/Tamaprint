import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'

// Bubble level: user drags the bubble to the center crosshair
const TOLERANCE = 12 // px radius for "perfect"

export default function CalibrationGame() {
  const { completeStep, abandonPrint } = useGameStore()

  const [bubble, setBubble] = useState({ x: (Math.random() - 0.5) * 80, y: (Math.random() - 0.5) * 80 })
  const [confirmed, setConfirmed] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const driftRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Bubble drifts slowly toward a random direction
  useEffect(() => {
    if (confirmed) return
    const drift = { dx: (Math.random() - 0.5) * 0.4, dy: (Math.random() - 0.5) * 0.4 }
    driftRef.current = setInterval(() => {
      setBubble((b) => ({
        x: Math.max(-90, Math.min(90, b.x + drift.dx)),
        y: Math.max(-90, Math.min(90, b.y + drift.dy)),
      }))
    }, 50)
    return () => clearInterval(driftRef.current!)
  }, [confirmed, attempts])

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (confirmed || !containerRef.current) return
      if (!(e.buttons & 1)) return
      const rect = containerRef.current.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const x = Math.max(-90, Math.min(90, e.clientX - cx))
      const y = Math.max(-90, Math.min(90, e.clientY - cy))
      setBubble({ x, y })
    },
    [confirmed]
  )

  const dist = Math.sqrt(bubble.x ** 2 + bubble.y ** 2)
  const inZone = dist <= TOLERANCE
  const score = Math.max(0, Math.round(100 - (dist / 90) * 100))

  const handleConfirm = () => {
    if (confirmed) return
    setConfirmed(true)
    clearInterval(driftRef.current!)
    setTimeout(() => completeStep('calibration', score), 1000)
  }

  const handleReset = () => {
    setBubble({ x: (Math.random() - 0.5) * 80, y: (Math.random() - 0.5) * 80 })
    setAttempts((a) => a + 1)
  }

  return (
    <div className="flex flex-col items-center h-full min-h-screen p-6 max-w-sm mx-auto">
      <div className="w-full flex items-center justify-between mb-4">
        <button onClick={abandonPrint} className="font-mono text-xs text-white/30 hover:text-white/60">✕</button>
        <span className="font-mono text-xs tracking-widest uppercase text-white/50">Calibration plateau</span>
        <span className="font-mono text-xs text-white/20">Niv. 1–20</span>
      </div>

      <div className="font-mono text-xs text-white/40 text-center mb-8">
        Glisser la bulle au centre de la cible.<br />
        <span className="text-purple-400">Précision requise pour l'adhérence couche 1.</span>
      </div>

      {/* Level instrument */}
      <div className="flex-1 flex items-center justify-center">
        <div
          ref={containerRef}
          className="relative w-64 h-64 rounded-full border-2 cursor-crosshair select-none touch-none"
          style={{
            background: 'radial-gradient(circle, #0f1020, #08080e)',
            borderColor: confirmed
              ? inZone ? '#34d39940' : '#ef444440'
              : '#ffffff15',
            boxShadow: confirmed && inZone ? '0 0 24px #34d39920' : 'none',
          }}
          onPointerDown={handlePointerMove}
          onPointerMove={handlePointerMove}
        >
          {/* Grid lines */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="absolute w-full h-px bg-white/5" />
            <div className="absolute w-px h-full bg-white/5" />
          </div>

          {/* Concentric rings */}
          {[0.8, 0.55, 0.3].map((r, i) => (
            <div
              key={i}
              className="absolute rounded-full border border-white/5"
              style={{
                width: `${r * 100}%`,
                height: `${r * 100}%`,
                top: `${(1 - r) * 50}%`,
                left: `${(1 - r) * 50}%`,
              }}
            />
          ))}

          {/* Center target */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div
              className="w-6 h-6 rounded-full border-2 transition-colors duration-300"
              style={{ borderColor: inZone ? '#34d399' : '#7B2FBE60' }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-1 h-1 rounded-full transition-colors duration-300"
                style={{ background: inZone ? '#34d399' : '#7B2FBE80' }}
              />
            </div>
          </div>

          {/* Bubble */}
          <motion.div
            className="absolute w-10 h-10 rounded-full"
            style={{
              left: `calc(50% + ${bubble.x}px - 20px)`,
              top: `calc(50% + ${bubble.y}px - 20px)`,
              background: inZone
                ? 'radial-gradient(circle, #34d39980, #34d39930)'
                : 'radial-gradient(circle, #a78bfa80, #7B2FBE30)',
              border: `2px solid ${inZone ? '#34d39960' : '#a78bfa60'}`,
              boxShadow: inZone ? '0 0 12px #34d39940' : '0 0 12px #7B2FBE30',
            }}
            animate={{ left: `calc(50% + ${bubble.x}px - 20px)`, top: `calc(50% + ${bubble.y}px - 20px)` }}
            transition={{ duration: 0.05 }}
          />

          {/* Score badge */}
          <div className="absolute bottom-4 right-4 font-mono text-xs" style={{ color: inZone ? '#34d399' : '#ffffff30' }}>
            {score}%
          </div>
        </div>
      </div>

      <div className="w-full mt-8 space-y-3">
        <AnimatePresence>
          {!confirmed && (
            <motion.button
              className="w-full py-4 rounded-2xl font-mono text-sm font-bold tracking-widest uppercase border"
              style={{
                background: inZone ? '#34d39920' : 'transparent',
                borderColor: inZone ? '#34d39960' : '#ffffff10',
                color: inZone ? '#34d399' : '#ffffff40',
              }}
              onClick={handleConfirm}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {inZone ? '✓  Plateau nivelé — Valider' : '⚡  Valider quand même'}
            </motion.button>
          )}
        </AnimatePresence>

        {!confirmed && (
          <button
            className="w-full py-2 font-mono text-xs text-white/20 hover:text-white/40 transition-colors"
            onClick={handleReset}
          >
            Recalibrer
          </button>
        )}

        {confirmed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center font-mono text-sm"
            style={{ color: inZone ? '#34d399' : '#f59e0b' }}
          >
            {inZone ? '✓ Calibration parfaite' : `⚠ Offset ${dist.toFixed(0)}µm — acceptable`}
          </motion.div>
        )}
      </div>
    </div>
  )
}
