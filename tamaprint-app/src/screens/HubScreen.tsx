import { motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { getPrinterForLevel, ADD_ONS } from '../data/printers'
import { PRINTER_SPRITES, ADDON_SPRITES } from '../data/sprites'
import PixelSprite from '../components/PixelSprite'
import ProgressBar from '../components/ProgressBar'

export default function HubScreen() {
  const { level, xp, dailyPrintsLeft, unlockedAddOns, totalPrints, startNewPrint, resetDaily } = useGameStore()

  resetDaily()

  const printer = getPrinterForLevel(level)
  const spriteConfig = PRINTER_SPRITES[printer.id]
  const xpForNext = 100 + level * 50
  const xpProgress = (xp % xpForNext) / xpForNext * 100
  const isMaxLevel = level >= 100

  const title = isMaxLevel ? 'SENSEI PRINTER' : `NIV. ${String(level).padStart(2, '0')}`

  return (
    <div className="flex flex-col h-dvh max-w-sm mx-auto px-5 safe-top safe-bottom">

      {/* Header */}
      <div className="flex justify-between items-start py-4">
        <div>
          <div className="font-mono text-[10px] text-white/25 tracking-[0.2em] uppercase">Tamaprint</div>
          <div className="font-mono text-lg font-bold tracking-wider mt-0.5" style={{ color: printer.accentColor }}>
            {title}{isMaxLevel && ' 🥋'}
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[10px] text-white/25 tracking-widest uppercase">Prints</div>
          <div className="font-mono text-3xl font-black text-white leading-none">
            {dailyPrintsLeft}<span className="text-white/20 text-sm font-normal">/5</span>
          </div>
        </div>
      </div>

      {/* Printer pixel art — centered, takes remaining space */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 min-h-0">

        {/* Printer frame */}
        <motion.div
          className="relative flex flex-col items-center"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Glow halo behind sprite */}
          <div
            className="absolute inset-0 rounded-full blur-2xl opacity-30 scale-150"
            style={{ background: printer.accentColor }}
          />

          <PixelSprite
            sprite={spriteConfig.sprite}
            palette={spriteConfig.palette}
            pixelSize={spriteConfig.pixelSize + 1} // +1 for hub display
            animate
            animateColor={printer.accentColor}
          />

          {/* Layer thickness badge */}
          <div
            className="absolute -top-1 -right-2 font-mono text-[9px] px-1.5 py-0.5 rounded-full leading-none"
            style={{
              background: printer.accentColor + '25',
              color: printer.accentColor,
              border: `1px solid ${printer.accentColor}50`,
            }}
          >
            {printer.layerThickness}µm
          </div>
        </motion.div>

        {/* Printer name */}
        <div className="text-center">
          <div className="font-mono text-[10px] text-white/25 tracking-[0.15em] uppercase">{printer.brand}</div>
          <div className="font-mono text-sm font-bold text-white">{printer.name}</div>
        </div>

        {/* Add-ons row */}
        <div className="flex gap-3 mt-1">
          {ADD_ONS.map((addon) => {
            const unlocked = unlockedAddOns.includes(addon.id)
            const addonSprite = ADDON_SPRITES[addon.id]

            return (
              <div
                key={addon.id}
                className="flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl border transition-all"
                style={{
                  background: unlocked ? '#0d0d20' : '#090910',
                  borderColor: unlocked ? printer.accentColor + '30' : '#ffffff08',
                  opacity: unlocked ? 1 : 0.4,
                }}
              >
                <PixelSprite
                  sprite={addonSprite.sprite}
                  palette={addonSprite.palette}
                  pixelSize={unlocked ? addonSprite.pixelSize : addonSprite.pixelSize - 1}
                />
                <span className="font-mono text-[9px] tracking-wider" style={{ color: unlocked ? '#fff' : '#ffffff40' }}>
                  {addon.name}
                </span>
                {!unlocked && (
                  <span className="font-mono text-[8px] text-white/20">niv. {addon.unlockLevel}</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Bottom section */}
      <div className="pb-2 space-y-3">
        {/* XP bar */}
        <div>
          <ProgressBar
            value={xpProgress}
            color={printer.accentColor}
            label={isMaxLevel ? 'MAÎTRISE' : `XP — NIV. ${level}`}
          />
          <div className="font-mono text-[10px] text-white/20 mt-1 text-right">
            {totalPrints} impression{totalPrints !== 1 ? 's' : ''} totales
          </div>
        </div>

        {/* CTA */}
        <motion.button
          className="w-full rounded-2xl font-mono text-sm font-bold tracking-[0.12em] uppercase disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            padding: '1rem',
            background: dailyPrintsLeft > 0
              ? `linear-gradient(135deg, ${printer.accentColor}bb, ${printer.accentColor})`
              : '#111120',
            color: dailyPrintsLeft > 0 ? '#fff' : '#ffffff35',
            border: `1px solid ${printer.accentColor}${dailyPrintsLeft > 0 ? '50' : '15'}`,
          }}
          disabled={dailyPrintsLeft <= 0}
          whileHover={dailyPrintsLeft > 0 ? { scale: 1.02 } : {}}
          whileTap={dailyPrintsLeft > 0 ? { scale: 0.97 } : {}}
          onClick={startNewPrint}
        >
          {dailyPrintsLeft > 0
            ? `▶  Lancer une impression (${dailyPrintsLeft})`
            : '✓  Quota journalier atteint'}
        </motion.button>
      </div>
    </div>
  )
}
