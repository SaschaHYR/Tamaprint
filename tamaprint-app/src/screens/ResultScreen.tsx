import { motion } from 'framer-motion'
import { useGameStore, type PrintGrade } from '../store/gameStore'
import { RESINS } from '../data/resins'
import { getPrinterForLevel } from '../data/printers'

const GRADE_CONFIG: Record<PrintGrade, { color: string; label: string; message: string }> = {
  'S+': { color: '#fbbf24', label: 'S+', message: 'Pièce parfaite — qualité laboratoire' },
  'S':  { color: '#a78bfa', label: 'S',  message: 'Excellent — précision clinique' },
  'A':  { color: '#34d399', label: 'A',  message: 'Très bien — prothèse fonctionnelle' },
  'B':  { color: '#60a5fa', label: 'B',  message: 'Bien — quelques imperfections mineures' },
  'C':  { color: '#94a3b8', label: 'C',  message: 'Passable — retouches nécessaires' },
  'D':  { color: '#f87171', label: 'D',  message: 'Insuffisant — reprint recommandé' },
  'F':  { color: '#ef4444', label: 'F',  message: 'Échec — la pièce est inutilisable' },
}

export default function ResultScreen() {
  const { level, currentSession, currentStep, startNewPrint, dailyPrintsLeft } = useGameStore()
  const store = useGameStore()

  if (currentStep !== 'result' || !currentSession?.finalGrade) return null

  const grade = currentSession.finalGrade
  const cfg = GRADE_CONFIG[grade]
  const resin = currentSession.resinId ? RESINS[currentSession.resinId] : null
  const printer = getPrinterForLevel(level)
  const xpEarned = currentSession.xpEarned ?? 0

  const stepScores = currentSession.stepScores ?? []

  const handleClose = () => store.abandonPrint()

  return (
    <div className="flex flex-col items-center h-full min-h-screen p-6 max-w-sm mx-auto">
      {/* Grade reveal */}
      <div className="flex-1 flex flex-col items-center justify-center w-full">
        {/* Particle burst for S/S+ */}
        {(grade === 'S' || grade === 'S+') && <ConfettiBurst color={cfg.color} />}

        {/* Piece visual */}
        <motion.div
          className="w-40 h-40 rounded-full flex items-center justify-center mb-6"
          style={{
            background: `radial-gradient(circle, ${cfg.color}15, transparent)`,
            border: `1px solid ${cfg.color}30`,
          }}
          initial={{ scale: 0, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
        >
          <div className="text-center">
            <motion.div
              className="font-mono font-black leading-none"
              style={{ color: cfg.color, fontSize: '5rem' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {cfg.label}
            </motion.div>
          </div>
        </motion.div>

        {/* Message */}
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="font-mono text-sm text-white/80 mb-1">{cfg.message}</div>
          <div className="font-mono text-xs text-white/40">
            {resin?.name} · {currentSession.shade} · {printer.name}
          </div>
        </motion.div>

        {/* XP earned */}
        <motion.div
          className="px-4 py-2 rounded-full font-mono text-sm font-bold mb-6"
          style={{ background: '#7B2FBE20', color: '#a78bfa', border: '1px solid #7B2FBE40' }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
        >
          +{xpEarned} XP
        </motion.div>

        {/* Step breakdown */}
        {stepScores.length > 0 && (
          <motion.div
            className="w-full space-y-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            {stepScores.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="font-mono text-xs text-white/30 w-28 capitalize">
                  {s.step.replace(/_/g, ' ')}
                </span>
                <div className="flex-1 h-0.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: scoreColor(s.score) }}
                    initial={{ width: 0 }}
                    animate={{ width: `${s.score}%` }}
                    transition={{ delay: 0.7 + i * 0.1, duration: 0.4 }}
                  />
                </div>
                <span className="font-mono text-xs w-8 text-right" style={{ color: scoreColor(s.score) }}>
                  {s.score}
                </span>
              </div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Actions */}
      <div className="w-full space-y-3 mt-6">
        {dailyPrintsLeft > 0 && (
          <motion.button
            className="w-full py-4 rounded-2xl font-mono text-sm font-bold tracking-widest uppercase"
            style={{
              background: `linear-gradient(135deg, ${printer.accentColor}cc, ${printer.accentColor})`,
              color: '#fff',
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={startNewPrint}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            ▶  Encore ({dailyPrintsLeft} restante{dailyPrintsLeft !== 1 ? 's' : ''})
          </motion.button>
        )}
        <motion.button
          className="w-full py-3 rounded-2xl font-mono text-sm border border-white/10 text-white/40 hover:text-white/60 transition-colors"
          onClick={handleClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          ← Retour au hub
        </motion.button>
      </div>
    </div>
  )
}

function scoreColor(score: number): string {
  if (score >= 90) return '#34d399'
  if (score >= 70) return '#60a5fa'
  if (score >= 50) return '#f59e0b'
  return '#ef4444'
}

function ConfettiBurst({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full"
          style={{
            background: color,
            left: '50%',
            top: '40%',
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: Math.cos((i / 12) * Math.PI * 2) * (80 + Math.random() * 60),
            y: Math.sin((i / 12) * Math.PI * 2) * (80 + Math.random() * 60),
            opacity: 0,
            scale: 0,
          }}
          transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
        />
      ))}
    </div>
  )
}
