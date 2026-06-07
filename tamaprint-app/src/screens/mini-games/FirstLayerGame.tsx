import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { RESINS } from '../../data/resins'

const LAYERS = 5
const ALERT_CHANCE = 0.35 // 35% chance of delamination per layer
const ALERT_WINDOW = 2200  // ms to react

interface LayerState {
  index: number
  hasAlert: boolean
  caught: boolean | null // null = pending, true = caught, false = missed
  done: boolean
}

export default function FirstLayerGame() {
  const { currentSession, completeStep, abandonPrint } = useGameStore()
  const resin = currentSession?.resinId ? RESINS[currentSession.resinId] : null
  const color = resin?.color ?? '#a78bfa'

  const [layers, setLayers] = useState<LayerState[]>(
    Array.from({ length: LAYERS }, (_, i) => ({
      index: i,
      hasAlert: i > 0 && Math.random() < ALERT_CHANCE,
      caught: null,
      done: false,
    }))
  )
  const [currentLayer, setCurrentLayer] = useState(0)
  const [alertActive, setAlertActive] = useState(false)
  const [alertTimer, setAlertTimer] = useState(0)
  const [finished, setFinished] = useState(false)

  // Advance layers
  useEffect(() => {
    if (finished) return
    const layer = layers[currentLayer]
    if (!layer) return

    const delay = layer.hasAlert ? 900 + Math.random() * 600 : 1200

    const t = setTimeout(() => {
      if (layer.hasAlert) {
        setAlertActive(true)
        setAlertTimer(ALERT_WINDOW)
      } else {
        // Auto-complete this layer
        setLayers((ls) =>
          ls.map((l) => (l.index === currentLayer ? { ...l, done: true, caught: true } : l))
        )
        if (currentLayer + 1 >= LAYERS) setFinished(true)
        else setCurrentLayer((c) => c + 1)
      }
    }, delay)
    return () => clearTimeout(t)
  }, [currentLayer, finished])

  // Alert countdown
  useEffect(() => {
    if (!alertActive) return
    const interval = setInterval(() => {
      setAlertTimer((t) => {
        if (t <= 0) {
          // Missed
          setAlertActive(false)
          setLayers((ls) =>
            ls.map((l) =>
              l.index === currentLayer ? { ...l, done: true, caught: false } : l
            )
          )
          if (currentLayer + 1 >= LAYERS) setFinished(true)
          else setCurrentLayer((c) => c + 1)
          return 0
        }
        return t - 50
      })
    }, 50)
    return () => clearInterval(interval)
  }, [alertActive, currentLayer])

  useEffect(() => {
    if (finished) {
      const caught = layers.filter((l) => l.caught === true).length
      const total = layers.filter((l) => l.hasAlert).length
      const base = total === 0 ? 100 : Math.round((caught / total) * 100)
      // Penalize missed: non-alerted layers always pass
      const missed = layers.filter((l) => l.hasAlert && l.caught === false).length
      const score = Math.max(0, base - missed * 15)
      setTimeout(() => completeStep('first_layer', score), 900)
    }
  }, [finished, layers, completeStep])

  const handleFix = useCallback(() => {
    if (!alertActive) return
    setAlertActive(false)
    setLayers((ls) =>
      ls.map((l) =>
        l.index === currentLayer ? { ...l, done: true, caught: true } : l
      )
    )
    if (currentLayer + 1 >= LAYERS) setFinished(true)
    else setCurrentLayer((c) => c + 1)
  }, [alertActive, currentLayer])

  const alertPct = (alertTimer / ALERT_WINDOW) * 100

  return (
    <div className="flex flex-col items-center h-full min-h-screen p-6 max-w-sm mx-auto">
      <div className="w-full flex items-center justify-between mb-4">
        <button onClick={abandonPrint} className="font-mono text-xs text-white/30 hover:text-white/60">✕</button>
        <span className="font-mono text-xs tracking-widest uppercase text-white/50">Adhérence couche 1</span>
        <span className="font-mono text-xs" style={{ color }}>{resin?.name}</span>
      </div>

      <div className="font-mono text-xs text-white/40 text-center mb-6">
        Surveiller les premières couches.<br />
        <span className="text-amber-400">Réagir si décollement détecté !</span>
      </div>

      {/* Layer visualization */}
      <div className="flex-1 flex flex-col items-center justify-center w-full gap-6">
        {/* Vat cross-section */}
        <div
          className="relative w-48 h-36 rounded-xl border overflow-hidden"
          style={{ background: '#08080e', borderColor: '#ffffff10' }}
        >
          {/* Build plate */}
          <div className="absolute top-4 left-4 right-4 h-2 rounded-sm bg-white/20" />

          {/* Layers building up */}
          <div className="absolute left-4 right-4" style={{ top: 24 }}>
            {layers.slice(0, currentLayer + 1).map((layer) => (
              <motion.div
                key={layer.index}
                className="w-full rounded-sm"
                style={{
                  height: 8,
                  marginTop: 2,
                  background:
                    layer.caught === false
                      ? '#ef444460' // missed = red
                      : `linear-gradient(90deg, ${color}cc, ${color}99)`,
                  boxShadow: layer.index === currentLayer && !layer.done
                    ? `0 0 8px ${color}60`
                    : 'none',
                }}
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            ))}
          </div>

          {/* Layer counter */}
          <div className="absolute bottom-2 right-3 font-mono text-xs text-white/30">
            {Math.min(currentLayer + 1, LAYERS)} / {LAYERS}
          </div>
        </div>

        {/* Layer indicators */}
        <div className="flex gap-2">
          {layers.map((layer) => (
            <div
              key={layer.index}
              className="w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs border"
              style={{
                background:
                  layer.done
                    ? layer.caught === false
                      ? '#ef444420'
                      : '#34d39920'
                    : layer.index === currentLayer
                    ? color + '20'
                    : '#0d0d16',
                borderColor:
                  layer.done
                    ? layer.caught === false
                      ? '#ef444460'
                      : '#34d39940'
                    : layer.index === currentLayer
                    ? color + '40'
                    : '#ffffff08',
                color:
                  layer.done
                    ? layer.caught === false
                      ? '#ef4444'
                      : '#34d399'
                    : layer.index === currentLayer
                    ? color
                    : '#ffffff20',
              }}
            >
              {layer.done
                ? layer.caught === false ? '✗' : '✓'
                : layer.index === currentLayer ? '•' : layer.index + 1}
            </div>
          ))}
        </div>

        {/* Alert zone */}
        <div className="w-full h-24 flex items-center justify-center">
          <AnimatePresence>
            {alertActive && (
              <motion.div
                className="w-full"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                {/* Alert bar */}
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mb-4">
                  <motion.div
                    className="h-full rounded-full bg-amber-400"
                    animate={{ width: `${alertPct}%` }}
                    transition={{ duration: 0.05 }}
                  />
                </div>

                <motion.button
                  className="w-full py-5 rounded-2xl font-mono text-base font-black tracking-widest uppercase"
                  style={{
                    background: 'linear-gradient(135deg, #ef444420, #f59e0b20)',
                    border: '2px solid #f59e0b80',
                    color: '#fbbf24',
                    boxShadow: '0 0 24px #f59e0b20',
                  }}
                  onClick={handleFix}
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 0.3, repeat: Infinity }}
                >
                  ⚠ DÉCOLLEMENT — CORRIGER !
                </motion.button>
              </motion.div>
            )}
            {!alertActive && !finished && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-mono text-xs text-white/20 text-center"
              >
                Couche {currentLayer + 1} en cours de polymérisation...
              </motion.div>
            )}
            {finished && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <div
                  className="font-mono text-sm"
                  style={{
                    color: layers.some((l) => l.caught === false) ? '#f59e0b' : '#34d399',
                  }}
                >
                  {layers.some((l) => l.caught === false)
                    ? `⚠ ${layers.filter((l) => l.caught === false).length} décollement(s) non rattrapé(s)`
                    : '✓ Toutes les couches ont adhéré parfaitement'}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
