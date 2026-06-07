import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ResinId, ResinShade } from '../data/resins'
import type { AddOnType } from '../data/printers'

export type PrintStep =
  | 'idle'
  | 'select_resin'
  | 'calibration'
  | 'mixing'
  | 'temperature'
  | 'resin_settings'
  | 'resin_level'
  | 'printing'
  | 'first_layer'
  | 'washing'
  | 'curing'
  | 'result'

export type PrintGrade = 'F' | 'D' | 'C' | 'B' | 'A' | 'S' | 'S+'

export interface StepScore {
  step: PrintStep
  score: number // 0-100
}

export interface PrintSession {
  resinId: ResinId
  shade: ResinShade
  stepScores: StepScore[]
  finalGrade: PrintGrade | null
  xpEarned: number
}

export interface GameState {
  // Player
  level: number
  xp: number
  totalPrints: number

  // Daily session
  dailyPrintsLeft: number
  lastResetDate: string // ISO date string

  // Unlocked add-ons
  unlockedAddOns: AddOnType[]

  // Current print flow
  currentStep: PrintStep
  currentSession: Partial<PrintSession> | null

  // Actions
  startNewPrint: () => void
  selectResin: (resinId: ResinId, shade: ResinShade) => void
  completeStep: (step: PrintStep, score: number) => void
  skipToNextStep: () => void
  abandonPrint: () => void
  resetDaily: () => void

  // Internal
  _advanceToNextStep: (currentStep: PrintStep, score: number) => void
}

const XP_PER_LEVEL = (level: number) => 100 + level * 50

const getNextStep = (
  current: PrintStep,
  level: number,
  unlockedAddOns: AddOnType[]
): PrintStep | null => {
  const needsCalibration = level <= 20
  const hasProwash = unlockedAddOns.includes('prowash_s')
  const hasNanocure = unlockedAddOns.includes('nanocure')

  const flow: PrintStep[] = [
    'select_resin',
    ...(needsCalibration ? ['calibration', 'mixing', 'temperature', 'resin_settings'] as PrintStep[] : []),
    'resin_level',
    'printing',
    'first_layer',
    ...(hasProwash ? [] : ['washing'] as PrintStep[]),
    ...(hasNanocure ? [] : ['curing'] as PrintStep[]),
    'result',
  ]

  const idx = flow.indexOf(current)
  return idx >= 0 && idx < flow.length - 1 ? flow[idx + 1] : null
}

const computeGrade = (scores: StepScore[]): PrintGrade => {
  if (scores.length === 0) return 'F'
  const avg = scores.reduce((s, x) => s + x.score, 0) / scores.length
  if (avg >= 98) return 'S+'
  if (avg >= 90) return 'S'
  if (avg >= 80) return 'A'
  if (avg >= 70) return 'B'
  if (avg >= 55) return 'C'
  if (avg >= 40) return 'D'
  return 'F'
}

const todayISO = () => new Date().toISOString().slice(0, 10)

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      level: 11, // start at elegoo for dev
      xp: 0,
      totalPrints: 0,
      dailyPrintsLeft: 5,
      lastResetDate: todayISO(),
      unlockedAddOns: [],
      currentStep: 'idle',
      currentSession: null,

      resetDaily: () => {
        const today = todayISO()
        if (get().lastResetDate !== today) {
          set({ dailyPrintsLeft: 5, lastResetDate: today })
        }
      },

      startNewPrint: () => {
        const { resetDaily } = get()
        resetDaily()
        if (get().dailyPrintsLeft <= 0) return
        set({ currentStep: 'select_resin', currentSession: {} })
      },

      selectResin: (resinId, shade) => {
        const { level, unlockedAddOns } = get()
        const next = getNextStep('select_resin', level, unlockedAddOns) ?? 'result'
        set({
          currentSession: { resinId, shade, stepScores: [] },
          currentStep: next,
        })
      },

      completeStep: (step, score) => {
        get()._advanceToNextStep(step, score)
      },

      skipToNextStep: () => {
        const { currentStep, level, unlockedAddOns } = get()
        const next = getNextStep(currentStep, level, unlockedAddOns)
        if (next) set({ currentStep: next })
      },

      abandonPrint: () => {
        set({ currentStep: 'idle', currentSession: null })
      },

      _advanceToNextStep: (step, score) => {
        const { currentSession, level, unlockedAddOns } = get()
        const prev = currentSession?.stepScores ?? []
        const stepScores = [...prev, { step, score }]
        const next = getNextStep(step, level, unlockedAddOns)

        if (!next || next === 'result') {
          // Finalize
          const grade = computeGrade(stepScores)
          const { xp, totalPrints, dailyPrintsLeft } = get()
          const resin = currentSession?.resinId
          const xpEarned = 20 + (resin ? 0 : 0) // base; bonus added in result screen
          const newXp = xp + xpEarned
          const newLevel = computeLevel(level, newXp)

          set({
            currentStep: 'result',
            currentSession: { ...currentSession, stepScores, finalGrade: grade, xpEarned },
            totalPrints: totalPrints + 1,
            dailyPrintsLeft: dailyPrintsLeft - 1,
            xp: newXp,
            level: newLevel,
            unlockedAddOns: computeUnlocks(newLevel),
          })
        } else {
          set({
            currentStep: next,
            currentSession: { ...currentSession, stepScores },
          })
        }
      },
    }),
    { name: 'tamaprint-save' }
  )
)

function computeLevel(current: number, xp: number): number {
  let level = current
  let threshold = XP_PER_LEVEL(level)
  while (xp >= threshold && level < 100) {
    level++
    threshold += XP_PER_LEVEL(level)
  }
  return level
}

function computeUnlocks(level: number): AddOnType[] {
  const unlocks: AddOnType[] = []
  if (level >= 41) unlocks.push('prowash_s')
  if (level >= 51) unlocks.push('nanocure')
  return unlocks
}
