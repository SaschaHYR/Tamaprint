import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { RESINS } from '../../data/resins'

// Target fill zone: 60-80% of vat height
const TARGET_MIN = 60
const TARGET_MAX = 80

export default function ResinLevelGame() {
  const { currentSession, completeStep, abandonPrint } = useGameStore()
  const resin = currentSession?.resinId ? RESINS[currentSession.resinId] : null

  const [fillPercent, setFillPercent] = useState(0)
  const [pouring, setPouring] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const pourInterval = useRef<ReturnType<typeof setInterval> | null>(null)

  const inZone = fillPercent >= TARGET_MIN && fillPercent <= TARGET_MAX

  const startPour = useCallback(() => {
    if (confirmed || fillPercent >= 100) return
    setPouring(true)
    pourInterval.current = setInterval(() => {
      setFillPercent((prev) => {
        if (prev >= 100) {
          clearInterval(pourInterval.current!)
          setPouring(false)
          return 100
        }
        return prev + 0.8
      })
    }, 30)
  }, [confirmed, fillPercent])

  const stopPour = useCallback(() => {
    setPouring(false)
    if (pourInterval.current) clearInterval(pourInterval.current)
  }, [])

  const handleConfirm = () => {
    if (confirmed) return
    setConfirmed(true)

    // Score: perfect in zone = 100, partial = proportional, out = penalty
    let score: number
    if (fillPercent >= TARGET_MIN && fillPercent <= TARGET_MAX) {
      // How centered in the zone?
      const center = (TARGET_MIN + TARGET_MAX) / 2
      const dist = Math.abs(fillPercent - center)
      const maxDist = (TARGET_MAX - TARGET_MIN) / 2
      score = 100 - (dist / maxDist) * 20
    } else if (fillPercent < TARGET_MIN) {
      score = (fillPercent / TARGET_MIN) * 55
    } else {
      // overfilled
      score = Math.max(0, 55 - (fillPercent - TARGET_MAX) * 3)
    }

    setTimeout(() => completeStep('resin_level', Math.round(score)), 1200)
  }

  const color = resin?.color ?? '#a78bfa'

  return (
    <div className="flex flex-col items-center h-dvh max-w-sm mx-auto px-5 safe-top safe-bottom">
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-4">
        <button onClick={abandonPrint} className="font-mono text-xs text-white/30 hover:text-white/60">
          ✕
        </button>
        <span className="font-mono text-xs tracking-widest uppercase text-white/50">Niveau vat</span>
        <span className="font-mono text-xs text-white/20">{resin?.name}</span>
      </div>

      {/* Instructions */}
      <div className="font-mono text-xs text-white/40 text-center mb-6">
        Maintenir le bouton pour verser.<br />
        <span style={{ color }}>Zone cible : {TARGET_MIN}–{TARGET_MAX}%</span>
      </div>

      {/* Vat visualization */}
      <div className="flex-1 flex items-center justify-center gap-8 w-full">
        {/* Pour bottle */}
        <div className="flex flex-col items-center gap-2">
          <motion.div
            className="w-12 h-28 rounded-t-xl rounded-b-lg border relative overflow-hidden"
            style={{ borderColor: color + '40', background: '#0d0d16' }}
            animate={{ rotate: pouring ? -25 : 0 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <motion.div
              className="absolute bottom-0 left-0 right-0 rounded-b-lg"
              style={{ background: color + '60' }}
              animate={{ height: `${Math.max(0, 80 - fillPercent)}%` }}
              transition={{ duration: 0.1 }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-mono text-xs text-white/20 rotate-0">1L</span>
            </div>
          </motion.div>

          {/* Pour stream */}
          <AnimatePresence>
            {pouring && (
              <motion.div
                className="w-1 rounded-full"
                style={{ background: color + 'aa' }}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 32, opacity: [0.4, 1, 0.4] }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Vat */}
        <div className="relative w-32 h-56">
          {/* Vat container */}
          <div
            className="absolute inset-0 rounded-b-2xl rounded-t-lg border-2 overflow-hidden"
            style={{ borderColor: '#ffffff10', background: '#08080e' }}
          >
            {/* Target zone markers */}
            <div
              className="absolute left-0 right-0 border-t border-dashed"
              style={{
                bottom: `${TARGET_MAX}%`,
                borderColor: color + '60',
              }}
            >
              <span className="font-mono text-[8px] absolute right-1 -top-3" style={{ color: color + '80' }}>
                MAX
              </span>
            </div>
            <div
              className="absolute left-0 right-0 border-t border-dashed"
              style={{
                bottom: `${TARGET_MIN}%`,
                borderColor: color + '60',
              }}
            >
              <span className="font-mono text-[8px] absolute right-1 -top-3" style={{ color: color + '80' }}>
                MIN
              </span>
            </div>

            {/* Target zone fill highlight */}
            <div
              className="absolute left-0 right-0"
              style={{
                bottom: `${TARGET_MIN}%`,
                height: `${TARGET_MAX - TARGET_MIN}%`,
                background: color + '08',
              }}
            />

            {/* Resin fill */}
            <motion.div
              className="absolute bottom-0 left-0 right-0"
              style={{ background: `linear-gradient(to top, ${color}cc, ${color}80)` }}
              animate={{ height: `${fillPercent}%` }}
              transition={{ duration: 0.05 }}
            >
              {/* Surface shimmer */}
              <motion.div
                className="absolute top-0 left-0 right-0 h-2"
                style={{ background: `linear-gradient(to bottom, ${color}, transparent)` }}
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </motion.div>
          </div>

          {/* Percentage indicator */}
          <div className="absolute -right-12 bottom-0 top-0 flex items-center">
            <motion.div
              className="font-mono text-xs font-bold"
              style={{
                color: inZone ? color : fillPercent > TARGET_MAX ? '#ef4444' : '#ffffff40',
              }}
              animate={{ bottom: `${fillPercent}%` }}
            >
              {fillPercent.toFixed(0)}%
            </motion.div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="w-full mt-8 space-y-3">
        {/* Pour button */}
        <motion.button
          className="w-full py-4 rounded-2xl font-mono text-sm font-bold tracking-widest uppercase select-none"
          style={{
            background: pouring ? color + 'cc' : color + '20',
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: color + '40',
            color: pouring ? '#fff' : color,
          }}
          onPointerDown={startPour}
          onPointerUp={stopPour}
          onPointerLeave={stopPour}
          whileTap={{ scale: 0.98 }}
          disabled={confirmed || fillPercent >= 100}
        >
          {pouring ? '⬇  Versement en cours...' : '⬇  Maintenir pour verser'}
        </motion.button>

        {/* Confirm */}
        <AnimatePresence>
          {fillPercent > 5 && !confirmed && (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full py-3 rounded-2xl font-mono text-sm tracking-widest uppercase border"
              style={{
                background: inZone ? '#1a1a2e' : 'transparent',
                borderColor: inZone ? '#7B2FBE60' : '#ffffff15',
                color: inZone ? '#a78bfa' : '#ffffff40',
              }}
              onClick={handleConfirm}
            >
              {inZone ? '✓  Niveau correct — Confirmer' : '⚠  Confirmer quand même'}
            </motion.button>
          )}
        </AnimatePresence>

        {confirmed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center font-mono text-sm"
            style={{ color: inZone ? '#34d399' : '#f59e0b' }}
          >
            {inZone ? '✓ Niveau parfait' : fillPercent < TARGET_MIN ? '⚠ Niveau insuffisant' : '⚠ Vat trop plein'}
          </motion.div>
        )}
      </div>
    </div>
  )
}
