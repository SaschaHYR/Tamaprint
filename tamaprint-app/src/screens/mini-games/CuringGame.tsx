import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { RESINS } from '../../data/resins'

const FACES = ['Front', 'Left', 'Back', 'Right'] as const
const CURE_TIME = 4000 // ms per face

export default function CuringGame() {
  const { currentSession, completeStep, abandonPrint } = useGameStore()
  const resin = currentSession?.resinId ? RESINS[currentSession.resinId] : null
  const color = resin?.color ?? '#a78bfa'

  const [faceIdx, setFaceIdx] = useState(0)
  const [faceProgress, setFaceProgress] = useState(0)
  const [faceDone, setFaceDone] = useState<boolean[]>([false, false, false, false])
  const [rotating, setRotating] = useState(false)
  const [done, setDone] = useState(false)

  // Cure current face
  useEffect(() => {
    if (done || rotating || faceDone[faceIdx]) return
    const interval = setInterval(() => {
      setFaceProgress((p) => {
        if (p >= 100) return 100
        return p + 100 / (CURE_TIME / 100)
      })
    }, 100)
    return () => clearInterval(interval)
  }, [faceIdx, done, rotating, faceDone])

  // Auto-advance when face done
  useEffect(() => {
    if (faceProgress >= 100 && !faceDone[faceIdx] && !rotating) {
      const updated = faceDone.map((d, i) => (i === faceIdx ? true : d))
      setFaceDone(updated)

      if (updated.every(Boolean)) {
        setDone(true)
        setTimeout(() => completeStep('curing', 100), 900)
      } else {
        setRotating(true)
        setTimeout(() => {
          setFaceIdx((i) => (i + 1) % 4)
          setFaceProgress(0)
          setRotating(false)
        }, 600)
      }
    }
  }, [faceProgress, faceIdx, faceDone, rotating, completeStep])

  const doneFaces = faceDone.filter(Boolean).length

  return (
    <div className="flex flex-col items-center h-dvh max-w-sm mx-auto px-5 safe-top safe-bottom">
      <div className="w-full flex items-center justify-between mb-4">
        <button onClick={abandonPrint} className="font-mono text-xs text-white/30 hover:text-white/60">✕</button>
        <span className="font-mono text-xs tracking-widest uppercase text-white/50">Curation UV</span>
        <span className="font-mono text-xs text-purple-400">{resin?.name}</span>
      </div>

      <div className="font-mono text-xs text-white/40 text-center mb-6">
        Photopolymérisation sur 4 faces.<br />
        <span className="text-purple-400">385nm – 405nm · 4× {CURE_TIME / 1000}s</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center w-full gap-8">
        {/* UV chamber visualization */}
        <div className="relative w-48 h-48">
          {/* UV light halo */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(circle, #7B2FBE15 0%, transparent 70%)',
            }}
            animate={{ scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />

          {/* Piece */}
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-xl"
            style={{
              background: `linear-gradient(135deg, ${color}dd, ${color}66)`,
              boxShadow: `0 0 ${20 + doneFaces * 8}px ${color}40`,
            }}
            animate={{
              rotateY: rotating ? 90 : 0,
              scale: rotating ? 0.85 : 1,
            }}
            transition={{ duration: 0.5 }}
          >
            {/* Face label */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-mono text-xs font-bold text-white/60">{FACES[faceIdx]}</span>
            </div>

            {/* Cure glow overlay */}
            <motion.div
              className="absolute inset-0 rounded-xl"
              style={{ background: '#7B2FBEcc', mixBlendMode: 'screen' }}
              animate={{ opacity: [0, 0.6, 0] }}
              transition={{ duration: 0.4, repeat: Infinity }}
            />
          </motion.div>

          {/* UV rays */}
          {[0, 90, 180, 270].map((angle) => (
            <motion.div
              key={angle}
              className="absolute left-1/2 top-1/2 w-16 h-0.5 origin-left"
              style={{
                background: 'linear-gradient(90deg, #7B2FBE60, transparent)',
                transform: `rotate(${angle}deg)`,
                marginLeft: 0,
                marginTop: -1,
              }}
              animate={{ opacity: [0.2, 0.8, 0.2], scaleX: [0.8, 1.1, 0.8] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: angle / 720 }}
            />
          ))}
        </div>

        {/* Face indicators */}
        <div className="flex gap-3">
          {FACES.map((face, i) => (
            <div
              key={face}
              className="flex flex-col items-center gap-1"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-mono border transition-all duration-300"
                style={{
                  background: faceDone[i] ? '#7B2FBE20' : i === faceIdx ? '#7B2FBE15' : '#0d0d16',
                  borderColor: faceDone[i] ? '#7B2FBE60' : i === faceIdx ? '#7B2FBE40' : '#ffffff08',
                  color: faceDone[i] ? '#a78bfa' : i === faceIdx ? '#7B2FBE' : '#ffffff20',
                }}
              >
                {faceDone[i] ? '✓' : i === faceIdx ? '●' : i + 1}
              </div>
              <span className="font-mono text-[8px] text-white/20">{face}</span>
            </div>
          ))}
        </div>

        {/* Current face progress */}
        <div className="w-full space-y-2">
          <div className="flex justify-between font-mono text-xs">
            <span className="text-white/30">Face {faceIdx + 1} — {FACES[faceIdx]}</span>
            <span className="text-purple-400">{faceProgress.toFixed(0)}%</span>
          </div>
          <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: '#0d0d16', border: '1px solid #7B2FBE20' }}>
            <motion.div
              className="h-full rounded-full"
              style={{
                background: 'linear-gradient(90deg, #7B2FBE, #a855f7)',
                boxShadow: '0 0 8px #7B2FBE80',
              }}
              animate={{ width: `${faceProgress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
          <div className="font-mono text-[10px] text-white/20 text-center">
            {doneFaces} / 4 faces terminées
          </div>
        </div>
      </div>

      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full mt-4 text-center"
          >
            <div className="font-mono text-sm text-purple-400">
              ✓ Polymérisation complète — pièce rigide
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
