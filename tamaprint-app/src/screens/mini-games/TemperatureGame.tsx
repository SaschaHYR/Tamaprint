import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { RESINS } from '../../data/resins'

const DURATION = 12000 // 12 seconds of monitoring
const TICK = 200       // ms per update

export default function TemperatureGame() {
  const { currentSession, completeStep, abandonPrint } = useGameStore()
  const resin = currentSession?.resinId ? RESINS[currentSession.resinId] : null
  const [optMin, optMax] = resin?.optimalTemp ?? [24, 28]
  const center = (optMin + optMax) / 2

  // Simulate room temperature starting 2-5°C off target
  const startTemp = center + (Math.random() > 0.5 ? 1 : -1) * (2 + Math.random() * 3)
  const [temp, setTemp] = useState(startTemp)
  const [timeLeft, setTimeLeft] = useState(DURATION)
  const [ticksInRange, setTicksInRange] = useState(0)
  const [totalTicks, setTotalTicks] = useState(0)
  const [heating, setHeating] = useState(false)
  const [cooling, setCooling] = useState(false)
  const [done, setDone] = useState(false)
  const driftRef = useRef((Math.random() - 0.5) * 0.03)

  useEffect(() => {
    if (done) return
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 0) return 0
        return t - TICK
      })
      setTemp((t) => {
        // Natural drift
        let next = t + driftRef.current
        // Heating/cooling push
        if (heating) next += 0.15
        if (cooling) next -= 0.15
        // Drift toward ambient (20°C)
        next += (20 - next) * 0.004
        // Occasional drift reversal
        if (Math.random() < 0.03) driftRef.current = (Math.random() - 0.5) * 0.03
        return Math.max(15, Math.min(40, next))
      })
      setTotalTicks((x) => x + 1)
      setTicksInRange((x) => {
        const inRange = temp >= optMin && temp <= optMax
        return inRange ? x + 1 : x
      })
    }, TICK)
    return () => clearInterval(interval)
  }, [done, heating, cooling, temp, optMin, optMax])

  useEffect(() => {
    if (timeLeft <= 0 && !done) {
      setDone(true)
      const score = totalTicks > 0 ? Math.round((ticksInRange / totalTicks) * 100) : 50
      setTimeout(() => completeStep('temperature', score), 800)
    }
  }, [timeLeft, done, ticksInRange, totalTicks, completeStep])

  const inRange = temp >= optMin && temp <= optMax
  const tempScore = totalTicks > 0 ? Math.round((ticksInRange / totalTicks) * 100) : 0

  // Gauge: map 15-40°C to 0-100%
  const gaugePercent = ((temp - 15) / 25) * 100
  const targetMinPct = ((optMin - 15) / 25) * 100
  const targetMaxPct = ((optMax - 15) / 25) * 100

  const progressPct = ((DURATION - timeLeft) / DURATION) * 100

  return (
    <div className="flex flex-col items-center h-full min-h-screen p-6 max-w-sm mx-auto">
      <div className="w-full flex items-center justify-between mb-4">
        <button onClick={abandonPrint} className="font-mono text-xs text-white/30 hover:text-white/60">✕</button>
        <span className="font-mono text-xs tracking-widest uppercase text-white/50">Contrôle température</span>
        <span className="font-mono text-xs text-white/20">{resin?.name}</span>
      </div>

      <div className="font-mono text-xs text-white/40 text-center mb-6">
        Maintenir la résine dans la zone optimale.<br />
        <span className="text-blue-400">{optMin}°C – {optMax}°C requis pour la viscosité cible.</span>
      </div>

      {/* Main temp display */}
      <div className="flex-1 flex flex-col items-center justify-center w-full gap-8">
        {/* Big temp number */}
        <div className="text-center">
          <motion.div
            className="font-mono font-black"
            style={{
              fontSize: '5rem',
              color: inRange ? '#34d399' : temp < optMin ? '#60a5fa' : '#ef4444',
              textShadow: `0 0 30px ${inRange ? '#34d39940' : temp < optMin ? '#60a5fa40' : '#ef444440'}`,
            }}
            animate={{ scale: inRange ? [1, 1.02, 1] : 1 }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            {temp.toFixed(1)}
          </motion.div>
          <div className="font-mono text-xl text-white/30">°C</div>
          <div
            className="font-mono text-xs mt-1 tracking-widest"
            style={{ color: inRange ? '#34d399' : temp < optMin ? '#60a5fa' : '#ef4444' }}
          >
            {inRange ? '✓ DANS LA PLAGE' : temp < optMin ? '↑ TROP FROID' : '↓ TROP CHAUD'}
          </div>
        </div>

        {/* Vertical thermometer gauge */}
        <div className="relative h-48 w-8 flex items-end justify-center">
          <div className="absolute inset-0 rounded-full border border-white/10 overflow-hidden" style={{ background: '#0d0d16' }}>
            {/* Target zone */}
            <div
              className="absolute left-0 right-0"
              style={{
                bottom: `${targetMinPct}%`,
                height: `${targetMaxPct - targetMinPct}%`,
                background: '#34d39915',
                borderTop: '1px solid #34d39940',
                borderBottom: '1px solid #34d39940',
              }}
            />
            {/* Mercury */}
            <motion.div
              className="absolute bottom-0 left-0 right-0 rounded-full"
              style={{
                background: inRange
                  ? 'linear-gradient(to top, #34d399, #34d39980)'
                  : temp < optMin
                  ? 'linear-gradient(to top, #60a5fa, #60a5fa80)'
                  : 'linear-gradient(to top, #ef4444, #ef444480)',
              }}
              animate={{ height: `${gaugePercent}%` }}
              transition={{ duration: 0.2 }}
            />
          </div>
          {/* Labels */}
          <div className="absolute -right-8 font-mono text-[8px] text-white/30" style={{ bottom: `${targetMinPct}%` }}>{optMin}°</div>
          <div className="absolute -right-8 font-mono text-[8px] text-white/30" style={{ bottom: `${targetMaxPct}%` }}>{optMax}°</div>
        </div>

        {/* Score */}
        <div className="font-mono text-xs text-white/30">
          Temps en zone : <span style={{ color: tempScore >= 70 ? '#34d399' : '#f59e0b' }}>{tempScore}%</span>
        </div>
      </div>

      {/* Controls */}
      <div className="w-full mt-4 space-y-3">
        {/* Timer bar */}
        <div className="space-y-1">
          <div className="flex justify-between font-mono text-xs text-white/30">
            <span>Surveillance</span>
            <span>{(timeLeft / 1000).toFixed(0)}s</span>
          </div>
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-white/20"
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.2 }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <motion.button
            className="py-4 rounded-2xl font-mono text-sm border flex items-center justify-center gap-2"
            style={{
              background: heating ? '#ef444420' : 'transparent',
              borderColor: heating ? '#ef444460' : '#ffffff15',
              color: heating ? '#ef4444' : '#ffffff40',
            }}
            onPointerDown={() => setHeating(true)}
            onPointerUp={() => setHeating(false)}
            onPointerLeave={() => setHeating(false)}
            disabled={done}
          >
            🔥 Chauffer
          </motion.button>
          <motion.button
            className="py-4 rounded-2xl font-mono text-sm border flex items-center justify-center gap-2"
            style={{
              background: cooling ? '#60a5fa20' : 'transparent',
              borderColor: cooling ? '#60a5fa60' : '#ffffff15',
              color: cooling ? '#60a5fa' : '#ffffff40',
            }}
            onPointerDown={() => setCooling(true)}
            onPointerUp={() => setCooling(false)}
            onPointerLeave={() => setCooling(false)}
            disabled={done}
          >
            ❄️ Refroidir
          </motion.button>
        </div>

        {done && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center font-mono text-sm"
            style={{ color: tempScore >= 70 ? '#34d399' : '#f59e0b' }}
          >
            {tempScore >= 70 ? '✓ Viscosité optimale atteinte' : `⚠ ${tempScore}% en zone — viscosité sous-optimale`}
          </motion.div>
        )}
      </div>
    </div>
  )
}
