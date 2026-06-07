import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { getAvailableResins, type Resin } from '../data/resins'

const DIFFICULTY_LABELS = ['', '●', '●●', '●●●', '●●●●']
const DIFFICULTY_COLORS = ['', '#34d399', '#60a5fa', '#f59e0b', '#ef4444']

export default function ResinSelectScreen() {
  const { level, selectResin, abandonPrint } = useGameStore()
  const resins = getAvailableResins(level)
  const [selected, setSelected] = useState<Resin | null>(null)
  const [shade, setShade] = useState<string>('')

  const handleConfirm = () => {
    if (!selected || !shade) return
    selectResin(selected.id, shade)
  }

  return (
    <div className="flex flex-col h-full min-h-screen p-6 max-w-sm mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={abandonPrint} className="font-mono text-xs text-white/30 hover:text-white/60 transition-colors">
          ← Annuler
        </button>
        <span className="font-mono text-xs text-white/30 tracking-widest uppercase">Choisir résine</span>
        <span className="font-mono text-xs text-purple-400">{resins.length} disponibles</span>
      </div>

      {/* Resin grid */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {resins.map((resin) => (
          <motion.button
            key={resin.id}
            className="w-full text-left p-3 rounded-xl border transition-all"
            style={{
              background: selected?.id === resin.id ? resin.color + '15' : '#0d0d16',
              borderColor: selected?.id === resin.id ? resin.color + '60' : '#ffffff0a',
            }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => {
              setSelected(resin)
              setShade(resin.shades[0])
            }}
          >
            <div className="flex items-center gap-3">
              {/* Color swatch */}
              <div
                className="w-8 h-8 rounded-lg shrink-0 border border-white/10"
                style={{ background: resin.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-white">{resin.name}</span>
                  <span className="font-mono text-xs ml-2" style={{ color: DIFFICULTY_COLORS[resin.difficulty] }}>
                    {DIFFICULTY_LABELS[resin.difficulty]}
                  </span>
                </div>
                <div className="font-mono text-xs text-white/40">{resin.usage}</div>
              </div>
              <div
                className="font-mono text-xs px-2 py-0.5 rounded-full shrink-0"
                style={{ background: '#7B2FBE20', color: '#a78bfa' }}
              >
                +{resin.xpBonus} XP
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Shade selector */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-4 p-4 rounded-2xl border"
            style={{ background: '#0d0d16', borderColor: selected.color + '30' }}
          >
            <div className="font-mono text-xs text-white/40 tracking-widest uppercase mb-3">
              Teinte — {selected.name}
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {selected.shades.map((s) => (
                <button
                  key={s}
                  onClick={() => setShade(s)}
                  className="px-3 py-1.5 rounded-lg font-mono text-xs border transition-all"
                  style={{
                    background: shade === s ? selected.color + '25' : 'transparent',
                    borderColor: shade === s ? selected.color + '80' : '#ffffff15',
                    color: shade === s ? '#fff' : '#ffffff60',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Resin details */}
            <div className="grid grid-cols-2 gap-2 mb-4 font-mono text-xs">
              <div className="text-white/30">Exposition</div>
              <div className="text-white">{selected.exposureTime}s / couche</div>
              <div className="text-white/30">Température</div>
              <div className="text-white">{selected.optimalTemp[0]}–{selected.optimalTemp[1]} °C</div>
              <div className="text-white/30">Durée estimée</div>
              <div className="text-white">{selected.printTimeMin} min</div>
            </div>

            <motion.button
              className="w-full py-3 rounded-xl font-mono text-sm font-bold tracking-widest uppercase"
              style={{
                background: `linear-gradient(135deg, ${selected.color}cc, ${selected.color})`,
                color: '#fff',
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleConfirm}
            >
              Charger la résine →
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
