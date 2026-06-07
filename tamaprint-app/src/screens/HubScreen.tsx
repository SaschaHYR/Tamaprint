import { motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { getPrinterForLevel, ADD_ONS } from '../data/printers'
import ProgressBar from '../components/ProgressBar'

export default function HubScreen() {
  const { level, xp, dailyPrintsLeft, unlockedAddOns, totalPrints, startNewPrint, resetDaily } = useGameStore()

  resetDaily()

  const printer = getPrinterForLevel(level)
  const xpForNext = 100 + level * 50
  const xpProgress = (xp % xpForNext) / xpForNext * 100

  const isMaxLevel = level >= 100
  const title = level >= 100 ? 'SENSEI PRINTER 🥋' : `NIV. ${level}`

  return (
    <div className="flex flex-col items-center justify-between h-full min-h-screen p-6 max-w-sm mx-auto">

      {/* Header */}
      <div className="w-full flex justify-between items-start pt-2">
        <div>
          <div className="font-mono text-xs text-white/30 tracking-widest uppercase">Tamaprint</div>
          <div className="font-mono text-lg font-bold tracking-wide" style={{ color: printer.accentColor }}>
            {title}
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-xs text-white/30">prints today</div>
          <div className="font-mono text-2xl font-bold text-white">{dailyPrintsLeft}<span className="text-white/30 text-sm">/5</span></div>
        </div>
      </div>

      {/* Printer visual */}
      <div className="flex-1 flex items-center justify-center w-full py-8">
        <motion.div
          className="relative flex flex-col items-center"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Printer body */}
          <div
            className="relative w-48 h-56 rounded-2xl flex flex-col items-center justify-center gap-3 border"
            style={{
              background: 'linear-gradient(160deg, #14141e 0%, #1a1a2e 100%)',
              borderColor: printer.accentColor + '30',
              boxShadow: `0 0 40px ${printer.accentColor}20, inset 0 1px 0 ${printer.accentColor}15`,
            }}
          >
            {/* Screen */}
            <div
              className="w-32 h-20 rounded-lg flex items-center justify-center overflow-hidden"
              style={{ background: '#0a0a14', border: `1px solid ${printer.accentColor}20` }}
            >
              <PrinterScreenAnim accentColor={printer.accentColor} />
            </div>

            {/* Brand */}
            <div className="text-center">
              <div className="font-mono text-xs text-white/30 tracking-widest">{printer.brand}</div>
              <div className="font-mono text-sm font-bold text-white">{printer.name}</div>
            </div>

            {/* Layer thickness badge */}
            <div
              className="absolute -top-2 -right-2 font-mono text-xs px-2 py-0.5 rounded-full"
              style={{ background: printer.accentColor + '20', color: printer.accentColor, border: `1px solid ${printer.accentColor}40` }}
            >
              {printer.layerThickness}µm
            </div>
          </div>

          {/* Build plate shadow */}
          <motion.div
            className="w-32 h-2 rounded-full mt-2"
            style={{ background: printer.accentColor + '15' }}
            animate={{ scaleX: [1, 1.05, 1], opacity: [0.4, 0.6, 0.4] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      </div>

      {/* Add-ons */}
      <div className="w-full flex gap-2 mb-4">
        {ADD_ONS.map((addon) => {
          const unlocked = unlockedAddOns.includes(addon.id)
          return (
            <div
              key={addon.id}
              className="flex-1 flex flex-col items-center gap-1 p-2 rounded-xl border"
              style={{
                background: unlocked ? '#1a1a2e' : '#0d0d16',
                borderColor: unlocked ? '#7B2FBE40' : '#ffffff08',
              }}
            >
              <span className="text-xl">{addon.emoji}</span>
              <span className="font-mono text-xs text-white/50">{addon.name}</span>
              {!unlocked && (
                <span className="font-mono text-[9px] text-white/20">niv. {addon.unlockLevel}</span>
              )}
            </div>
          )
        })}
      </div>

      {/* XP bar */}
      <div className="w-full mb-4">
        <ProgressBar value={xpProgress} color={printer.accentColor} label={isMaxLevel ? 'MAÎTRISE' : 'XP'} />
        <div className="font-mono text-xs text-white/20 mt-1 text-right">
          {totalPrints} impression{totalPrints !== 1 ? 's' : ''} réalisée{totalPrints !== 1 ? 's' : ''}
        </div>
      </div>

      {/* CTA */}
      <motion.button
        className="w-full py-4 rounded-2xl font-mono text-sm font-bold tracking-widest uppercase disabled:opacity-30 disabled:cursor-not-allowed"
        style={{
          background: dailyPrintsLeft > 0
            ? `linear-gradient(135deg, ${printer.accentColor}cc, ${printer.accentColor})`
            : '#1a1a2e',
          color: dailyPrintsLeft > 0 ? '#fff' : '#ffffff40',
          border: `1px solid ${printer.accentColor}${dailyPrintsLeft > 0 ? '60' : '20'}`,
        }}
        disabled={dailyPrintsLeft <= 0}
        whileHover={dailyPrintsLeft > 0 ? { scale: 1.02 } : {}}
        whileTap={dailyPrintsLeft > 0 ? { scale: 0.98 } : {}}
        onClick={startNewPrint}
      >
        {dailyPrintsLeft > 0 ? '▶  Nouvelle impression' : '✓  Quota journalier atteint'}
      </motion.button>
    </div>
  )
}

function PrinterScreenAnim({ accentColor }: { accentColor: string }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-2">
      <motion.div
        className="w-full h-1 rounded-full"
        style={{ background: accentColor + '60' }}
        animate={{ scaleX: [0.3, 1, 0.3], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="w-full h-px"
          style={{ background: accentColor + '30' }}
          animate={{ opacity: [0.1, 0.5, 0.1] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
        />
      ))}
      <motion.div
        className="font-mono text-[8px] tracking-widest"
        style={{ color: accentColor }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.8, repeat: Infinity }}
      >
        READY
      </motion.div>
    </div>
  )
}
