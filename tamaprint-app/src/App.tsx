import { AnimatePresence, motion } from 'framer-motion'
import { useGameStore } from './store/gameStore'
import HubScreen from './screens/HubScreen'
import ResinSelectScreen from './screens/ResinSelectScreen'
import ResinLevelGame from './screens/mini-games/ResinLevelGame'
import CalibrationGame from './screens/mini-games/CalibrationGame'
import MixingGame from './screens/mini-games/MixingGame'
import TemperatureGame from './screens/mini-games/TemperatureGame'
import FirstLayerGame from './screens/mini-games/FirstLayerGame'
import WashingGame from './screens/mini-games/WashingGame'
import CuringGame from './screens/mini-games/CuringGame'
import PrintingScreen from './screens/PrintingScreen'
import ResultScreen from './screens/ResultScreen'
import type { PrintStep } from './store/gameStore'

const slide = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
}

function Screen({ step }: { step: PrintStep }) {
  switch (step) {
    case 'idle':         return <HubScreen />
    case 'select_resin': return <ResinSelectScreen />
    case 'calibration':  return <CalibrationGame />
    case 'mixing':       return <MixingGame />
    case 'temperature':  return <TemperatureGame />
    case 'resin_level':  return <ResinLevelGame />
    case 'printing':     return <PrintingScreen />
    case 'first_layer':  return <FirstLayerGame />
    case 'washing':      return <WashingGame />
    case 'curing':       return <CuringGame />
    case 'result':       return <ResultScreen />
    default:             return null
  }
}

export default function App() {
  const currentStep = useGameStore((s) => s.currentStep)

  return (
    <div className="h-dvh bg-[#08080e] text-white overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div key={currentStep} {...slide} className="h-full">
          <Screen step={currentStep} />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
