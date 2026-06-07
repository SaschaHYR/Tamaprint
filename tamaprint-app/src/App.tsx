import { AnimatePresence, motion } from 'framer-motion'
import { useGameStore } from './store/gameStore'
import HubScreen from './screens/HubScreen'
import ResinSelectScreen from './screens/ResinSelectScreen'
import ResinLevelGame from './screens/mini-games/ResinLevelGame'
import PrintingScreen from './screens/PrintingScreen'
import ResultScreen from './screens/ResultScreen'
import type { PrintStep } from './store/gameStore'

const slide = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
  transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
}

function Screen({ step }: { step: PrintStep }) {
  switch (step) {
    case 'idle':         return <HubScreen />
    case 'select_resin': return <ResinSelectScreen />
    case 'resin_level':  return <ResinLevelGame />
    case 'printing':
    case 'first_layer':  return <PrintingScreen />
    case 'result':       return <ResultScreen />
    default:             return <PlaceholderStep step={step} />
  }
}

export default function App() {
  const currentStep = useGameStore((s) => s.currentStep)

  return (
    <div className="min-h-screen bg-[#08080e] text-white overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div key={currentStep} {...slide} className="min-h-screen">
          <Screen step={currentStep} />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function PlaceholderStep({ step }: { step: PrintStep }) {
  const { completeStep, abandonPrint } = useGameStore()

  const LABELS: Partial<Record<PrintStep, string>> = {
    calibration: 'Calibration plateau',
    mixing: 'Mélange résine',
    temperature: 'Contrôle température',
    resin_settings: 'Paramètres exposition',
    washing: 'Lavage IPA',
    curing: 'Curation UV',
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen p-6 gap-6">
      <div className="font-mono text-xs text-white/30 tracking-widest uppercase">{LABELS[step] ?? step}</div>
      <div className="font-mono text-4xl">🚧</div>
      <div className="font-mono text-xs text-white/20">Mini-jeu à venir</div>
      <div className="flex gap-3">
        <button
          className="px-6 py-3 rounded-xl font-mono text-sm border border-purple-500/40 text-purple-400 hover:bg-purple-500/10 transition-colors"
          onClick={() => completeStep(step, 85)}
        >
          Simuler succès (85)
        </button>
        <button
          className="px-4 py-3 rounded-xl font-mono text-sm border border-white/10 text-white/40 hover:text-white/60 transition-colors"
          onClick={abandonPrint}
        >
          Annuler
        </button>
      </div>
    </div>
  )
}
