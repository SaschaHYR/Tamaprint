import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { RESINS } from '../../data/resins'

const TARGET_SWIPES = 18
const DECAY_RATE = 0.008 // progress decays over time to simulate settling

export default function MixingGame() {
  const { currentSession, completeStep, abandonPrint } = useGameStore()
  const resin = currentSession?.resinId ? RESINS[currentSession.resinId] : null
  const color = resin?.color ?? '#a78bfa'

  const [swipes, setSwipes] = useState(0)
  const [progress, setProgress] = useState(0)
  const [particles, setParticles] = useState<{ id: number; x: number; y: number }[]>([])
  const [done, setDone] = useState(false)
  const lastY = useRef<number | null>(null)
  const frameRef = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Decay loop
  useEffect(() => {
    if (done) return
    const decay = setInterval(() => {
      setProgress((p) => Math.max(0, p - DECAY_RATE))
    }, 100)
    return () => clearInterval(decay)
  }, [done])

  // Complete when enough swipes
  useEffect(() => {
    if (swipes >= TARGET_SWIPES && !done) {
      setDone(true)
      const score = Math.min(100, Math.round((progress / 1) * 100))
      setTimeout(() => completeStep('mixing', Math.max(score, 72)), 900)
    }
  }, [swipes, done, progress, completeStep])

  const addParticle = useCallback((x: number, y: number) => {
    const id = Date.now() + Math.random()
    setParticles((p) => [...p.slice(-8), { id, x, y }])
    setTimeout(() => setParticles((p) => p.filter((pt) => pt.id !== id)), 600)
  }, [])

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (done || !(e.buttons & 1) || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const relY = e.clientY - rect.top

      if (lastY.current !== null) {
        const dy = Math.abs(relY - lastY.current)
        if (dy > 8) {
          setSwipes((s) => s + 1)
          setProgress((p) => Math.min(1, p + 1 / TARGET_SWIPES))
          addParticle(e.clientX - rect.left, relY)
          cancelAnimationFrame(frameRef.current!)
        }
      }
      lastY.current = relY
    },
    [done, addParticle]
  )

  const pct = Math.round(progress * 100)

  return (
    <div className="flex flex-col items-center h-dvh max-w-sm mx-auto px-5 safe-top safe-bottom">
      <div className="w-full flex items-center justify-between mb-4">
        <button onClick={abandonPrint} className="font-mono text-xs text-white/30 hover:text-white/60">✕</button>
        <span className="font-mono text-xs tracking-widest uppercase text-white/50">Mélange résine</span>
        <span className="font-mono text-xs" style={{ color }}>{resin?.name}</span>
      </div>

      <div className="font-mono text-xs text-white/40 text-center mb-6">
        Agiter le flacon de haut en bas.<br />
        <span style={{ color }}>Homogénéiser avant polymérisation.</span>
      </div>

      {/* Bottle */}
      <div className="flex-1 flex items-center justify-center">
        <div
          ref={containerRef}
          className="relative w-32 h-64 cursor-grab active:cursor-grabbing select-none touch-none"
          onPointerDown={handlePointerMove}
          onPointerMove={handlePointerMove}
          onPointerUp={() => { lastY.current = null }}
        >
          {/* Bottle body */}
          <motion.div
            className="absolute inset-0 rounded-2xl rounded-t-lg border overflow-hidden"
            style={{ borderColor: color + '30', background: '#0d0d16' }}
            animate={!done ? { y: [0, -6, 0] } : {}}
            transition={{ duration: 0.15, repeat: done ? 0 : Infinity, repeatDelay: 0 }}
          >
            {/* Resin fill */}
            <div
              className="absolute bottom-0 left-0 right-0 transition-all duration-300"
              style={{
                height: '70%',
                background: `linear-gradient(to top, ${color}cc, ${color}55)`,
              }}
            />

            {/* Mixing particles */}
            {particles.map((pt) => (
              <motion.div
                key={pt.id}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  left: pt.x - 4,
                  top: pt.y - 4,
                  background: color,
                  filter: 'blur(2px)',
                }}
                initial={{ opacity: 1, scale: 1 }}
                animate={{ opacity: 0, scale: 0, y: -20 }}
                transition={{ duration: 0.6 }}
              />
            ))}

            {/* Bubbles when mixing */}
            {[...Array(Math.min(swipes, 6))].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full border"
                style={{
                  left: `${20 + i * 12}%`,
                  bottom: `${20 + (i % 3) * 15}%`,
                  borderColor: color + '60',
                }}
                animate={{ y: [0, -40, -80], opacity: [0.6, 0.3, 0] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </motion.div>

          {/* Cap */}
          <div
            className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-6 rounded-t-lg"
            style={{ background: color + '40', border: `1px solid ${color}30` }}
          />

          {/* Label */}
          <div
            className="absolute top-1/3 left-2 right-2 rounded-md p-2 text-center"
            style={{ background: '#ffffff08', border: `1px solid ${color}20` }}
          >
            <div className="font-mono text-[8px] text-white/30 tracking-widest">SPRINTRAY</div>
            <div className="font-mono text-xs font-bold" style={{ color }}>{resin?.name}</div>
            <div className="font-mono text-[8px] text-white/20">{currentSession?.shade}</div>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="w-full mt-8 space-y-4">
        <div className="space-y-1">
          <div className="flex justify-between font-mono text-xs">
            <span className="text-white/30">Homogénéité</span>
            <span style={{ color: pct >= 80 ? '#34d399' : color }}>{pct}%</span>
          </div>
          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${color}80, ${color})` }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
          <div className="font-mono text-[10px] text-white/20">
            {swipes} / {TARGET_SWIPES} agitations · cible {resin?.optimalTemp[0]}–{resin?.optimalTemp[1]}°C
          </div>
        </div>

        <AnimatePresence>
          {done && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center font-mono text-sm text-green-400"
            >
              ✓ Résine homogène — prête pour l'impression
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
