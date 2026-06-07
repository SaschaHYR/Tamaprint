import type { PrintStep } from '../store/gameStore'

const STEP_LABELS: Partial<Record<PrintStep, string>> = {
  select_resin: 'Sélection résine',
  calibration: 'Calibration plateau',
  mixing: 'Mélange résine',
  temperature: 'Contrôle température',
  resin_settings: 'Paramètres exposition',
  resin_level: 'Niveau vat',
  printing: 'Impression',
  first_layer: 'Adhérence couche 1',
  washing: 'Lavage IPA',
  curing: 'Curation UV',
  result: 'Résultat',
}

const FLOW_STEPS: PrintStep[] = [
  'select_resin', 'calibration', 'mixing', 'temperature', 'resin_settings',
  'resin_level', 'printing', 'first_layer', 'washing', 'curing', 'result',
]

interface Props {
  currentStep: PrintStep
  activeSteps: PrintStep[]
}

export default function StepHeader({ currentStep, activeSteps }: Props) {
  const visible = FLOW_STEPS.filter((s) => activeSteps.includes(s))

  return (
    <div className="w-full">
      <div className="flex items-center gap-0 overflow-x-auto pb-1">
        {visible.map((step, i) => {
          const idx = visible.indexOf(currentStep)
          const isActive = step === currentStep
          const isDone = i < idx

          return (
            <div key={step} className="flex items-center shrink-0">
              <div className="flex flex-col items-center gap-1">
                <div
                  className="w-2 h-2 rounded-full transition-all duration-300"
                  style={{
                    background: isDone ? '#7B2FBE' : isActive ? '#a855f7' : '#ffffff15',
                    boxShadow: isActive ? '0 0 8px #a855f780' : 'none',
                  }}
                />
                {isActive && (
                  <span className="font-mono text-[9px] text-purple-400 tracking-wider whitespace-nowrap uppercase">
                    {STEP_LABELS[step]}
                  </span>
                )}
              </div>
              {i < visible.length - 1 && (
                <div
                  className="h-px w-6 mx-1 transition-all duration-300"
                  style={{ background: isDone ? '#7B2FBE' : '#ffffff10' }}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
