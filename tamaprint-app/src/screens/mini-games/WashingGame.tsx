import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { RESINS } from '../../data/resins'

const WASH_DURATION = 20000  // 20s total
const TARGET_AGITATIONS = 24 // minimum swipes for max score
const DECAY = 0.006

export default function WashingGame() {
  const { currentSession, completeStep, abandonPrint } = useGameStore()
  const resin = currentSession?.resinId ? RESINS[currentSession.resinId] : null
  const color = resin?.color ?? '#a78bfa'

  const [timeLeft, setTimeLeft] = useState(WASH_DURATION)
  const [agitations, setAgitations] = useState(0)
  const [cleanliness, setCleanliness] = useState(0)
  const [done, setDone] = useState(false)
  const [ripples, setRipples] = useState<number[]>([])
  const lastX = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Timer
  useEffect(() => {
    if (done) return
    const t = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) return 0
        return prev - 100
      })
      setCleanliness((c) => Math.max(0, c - DECAY))
    }, 100)
    return () => clearInterval(t)
  }, [done])

  // Finish
  useEffect(() => {
    if (timeLeft <= 0 && !done) {
      setDone(true)
      const score = Math.min(100, Math.round((cleanliness * 0.6 + Math.min(agitations / TARGET_AGITATIONS, 1) * 40) * 100))
      setTimeout(() => completeStep('washing', score), 800)
    }
  }, [timeLeft, done, cleanliness, agitations, completeStep])

  const handleMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (done || !(e.buttons & 1) || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const relX = e.clientX - rect.left
      if (lastX.current !== null) {
        const dx = Math.abs(relX - lastX.current)
        if (dx > 12) {
          setAgitations((a) => a + 1)
          setCleanliness((c) => Math.min(1, c + 0.065))
          const id = Date.now()
          setRipples((r) => [...r.slice(-4), id])
          setTimeout(() => setRipples((r) => r.filter((x) => x !== id)), 700)
        }
      }
      lastX.current = relX
    },
    [done]
  )

  const timerPct = (timeLeft / WASH_DURATION) * 100
  const cleanPct = Math.round(cleanliness * 100)

  // IPA color: starts amber (resin contamination), goes clear
  const ipaAlpha = Math.max(0.05, 0.4 - cleanliness * 0.35)
  const ipaColor = `rgba(180, 140, 60, ${ipaAlpha})`

  return (
    <div className="flex flex-col items-center h-full min-h-screen p-6 max-w-sm mx-auto">
      <div className="w-full flex items-center justify-between mb-4">
        <button onClick={abandonPrint} className="font-mono text-xs text-white/30 hover:text-white/60">✕</button>
        <span className="font-mono text-xs tracking-widest uppercase text-white/50">Lavage IPA</span>
        <span className="font-mono text-xs text-white/20">90% isopropanol</span>
      </div>

      <div className="font-mono text-xs text-white/40 text-center mb-6">
        Agiter latéralement pour éliminer la résine résiduelle.<br />
        <span className="text-cyan-400">L'IPA élimine les couches non polymérisées.</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center w-full gap-6">
        {/* Wash container */}
        <div
          ref={containerRef}
          className="relative w-56 h-44 rounded-2xl border overflow-hidden cursor-ew-resize select-none touch-none"
          style={{
            background: '#0a0a12',
            borderColor: '#ffffff10',
          }}
          onPointerDown={handleMove}
          onPointerMove={handleMove}
          onPointerUp={() => { lastX.current = null }}
        >
          {/* IPA fluid */}
          <div
            className="absolute inset-0 transition-all duration-500"
            style={{ background: ipaColor }}
          />

          {/* Piece silhouette */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-12 rounded-xl transition-all duration-300"
            style={{
              background: `linear-gradient(135deg, ${color}${Math.round(cleanliness * 200 + 55).toString(16)}, ${color}60)`,
              boxShadow: cleanliness > 0.7 ? `0 0 16px ${color}40` : 'none',
            }}
          />

          {/* Agitation ripples */}
          {ripples.map((id) => (
            <motion.div
              key={id}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border"
              style={{ borderColor: '#60a5fa40' }}
              initial={{ width: 20, height: 20, opacity: 0.8 }}
              animate={{ width: 160, height: 100, opacity: 0 }}
              transition={{ duration: 0.7 }}
            />
          ))}

          {/* Floating resin particles (diminish as clean) */}
          {!done && [...Array(Math.max(0, Math.round((1 - cleanliness) * 6)))].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full"
              style={{
                background: color + '60',
                left: `${15 + i * 12}%`,
                top: `${20 + (i % 3) * 20}%`,
              }}
              animate={{
                x: [0, (i % 2 ? 8 : -8), 0],
                y: [0, 4, -4, 0],
              }}
              transition={{ duration: 1.2 + i * 0.2, repeat: Infinity }}
            />
          ))}

          {/* Done glow */}
          {done && (
            <motion.div
              className="absolute inset-0 rounded-2xl"
              style={{ background: '#34d39910' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            />
          )}
        </div>

        {/* Stats */}
        <div className="w-full space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between font-mono text-xs">
              <span className="text-white/30">Propreté</span>
              <span style={{ color: cleanPct >= 70 ? '#34d399' : '#f59e0b' }}>{cleanPct}%</span>
            </div>
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #60a5fa, #34d399)' }}
                animate={{ width: `${cleanPct}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between font-mono text-xs">
              <span className="text-white/30">Temps restant</span>
              <span className="text-white/60">{(timeLeft / 1000).toFixed(0)}s</span>
            </div>
            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: timerPct > 30 ? '#ffffff20' : '#ef444460' }}
                animate={{ width: `${timerPct}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
          </div>

          <div className="font-mono text-[10px] text-white/20 text-center">
            {agitations} agitations · cible {TARGET_AGITATIONS}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full mt-4 text-center font-mono text-sm"
            style={{ color: cleanPct >= 70 ? '#34d399' : '#f59e0b' }}
          >
            {cleanPct >= 70 ? '✓ Résine résiduelle éliminée' : '⚠ Nettoyage partiel — traces possibles'}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
