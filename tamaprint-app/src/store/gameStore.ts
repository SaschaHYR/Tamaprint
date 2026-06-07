import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ResinId, ResinShade } from '../data/resins'
import { RESINS } from '../data/resins'
import type { AddOnType } from '../data/printers'

export type PrintStep =
  | 'idle'
  | 'select_resin'
  | 'calibration'
  | 'mixing'
  | 'temperature'
  | 'resin_level'
  | 'printing'
  | 'first_layer'
  | 'washing'
  | 'curing'
  | 'result'

export type PrintGrade = 'F' | 'D' | 'C' | 'B' | 'A' | 'S' | 'S+'

export interface StepScore {
  step: PrintStep
  score: number
}

export interface PrintSession {
  resinId: ResinId
  shade: ResinShade
  miniGame: PrintStep       // the single selected mini-game
  stepScores: StepScore[]
  finalGrade: PrintGrade | null
  xpEarned: number
}

export interface GameState {
  level: number
  xp: number
  totalPrints: number
  dailyPrintsLeft: number
  lastResetDate: string
  unlockedAddOns: AddOnType[]
  currentStep: PrintStep
  currentSession: Partial<PrintSession> | null

  startNewPrint: () => void
  selectResin: (resinId: ResinId, shade: ResinShade) => void
  completeStep: (step: PrintStep, score: number) => void
  abandonPrint: () => void
  resetDaily: () => void
  _advance: (step: PrintStep, score: number) => void
}

// ─── Mini-game pool per context ───────────────────────────────────────────────

function getMiniGamePool(level: number, addOns: AddOnType[]): PrintStep[] {
  const pool: PrintStep[] = ['resin_level', 'first_layer']

  if (level >= 11 && level <= 20) {
    pool.push('calibration', 'mixing', 'temperature')
  }
  if (!addOns.includes('prowash_s')) {
    pool.push('washing')
  }
  if (!addOns.includes('nanocure')) {
    pool.push('curing')
  }

  return pool
}

function pickMiniGame(level: number, addOns: AddOnType[]): PrintStep {
  const pool = getMiniGamePool(level, addOns)
  return pool[Math.floor(Math.random() * pool.length)]
}

// ─── Flow: select_resin → miniGame → printing → result ───────────────────────

function getNextStep(current: PrintStep, miniGame: PrintStep): PrintStep | null {
  const flow: PrintStep[] = ['select_resin', miniGame, 'printing', 'result']
  const idx = flow.indexOf(current)
  return idx >= 0 && idx < flow.length - 1 ? flow[idx + 1] : null
}

// ─── Grade ────────────────────────────────────────────────────────────────────

function computeGrade(scores: StepScore[]): PrintGrade {
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

const XP_MULTIPLIER: Record<string, number> = {
  'S+': 2, S: 1.5, A: 1.2, B: 1, C: 0.7, D: 0.4, F: 0.1,
}

const todayISO = () => new Date().toISOString().slice(0, 10)

function computeLevel(current: number, xp: number): number {
  let level = current
  while (xp >= (100 + level * 50) && level < 100) level++
  return level
}

function computeUnlocks(level: number): AddOnType[] {
  const u: AddOnType[] = []
  if (level >= 41) u.push('prowash_s')
  if (level >= 51) u.push('nanocure')
  return u
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      level: 11,
      xp: 0,
      totalPrints: 0,
      dailyPrintsLeft: 5,
      lastResetDate: todayISO(),
      unlockedAddOns: [],
      currentStep: 'idle',
      currentSession: null,

      resetDaily() {
        const today = todayISO()
        if (get().lastResetDate !== today) {
          set({ dailyPrintsLeft: 5, lastResetDate: today })
        }
      },

      startNewPrint() {
        get().resetDaily()
        const { level, unlockedAddOns, dailyPrintsLeft } = get()
        if (dailyPrintsLeft <= 0) return
        const miniGame = pickMiniGame(level, unlockedAddOns)
        set({
          currentStep: 'select_resin',
          currentSession: { miniGame, stepScores: [] },
        })
      },

      selectResin(resinId, shade) {
        const { currentSession } = get()
        const miniGame = currentSession?.miniGame ?? 'resin_level'
        set({
          currentSession: { ...currentSession, resinId, shade },
          currentStep: miniGame,
        })
      },

      completeStep(step, score) {
        get()._advance(step, score)
      },

      abandonPrint() {
        set({ currentStep: 'idle', currentSession: null })
      },

      _advance(step, score) {
        const { currentSession, level, xp, totalPrints, dailyPrintsLeft } = get()
        const miniGame = currentSession?.miniGame ?? 'resin_level'
        const prev = currentSession?.stepScores ?? []
        const stepScores = [...prev, { step, score }]
        const next = getNextStep(step, miniGame)

        if (!next || next === 'result') {
          const grade = computeGrade(stepScores)
          const resin = currentSession?.resinId ? RESINS[currentSession.resinId] : null
          const xpEarned = Math.round(((resin?.xpBonus ?? 20) + 10) * (XP_MULTIPLIER[grade] ?? 1))
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
