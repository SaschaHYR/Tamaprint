export type ResinId =
  | 'pro_crown'
  | 'pro_denture_teeth'
  | 'pro_denture_base'
  | 'pro_model'
  | 'pro_tray'
  | 'pro_night_guard'
  | 'pro_surgical'

export type ResinShade = string

export interface Resin {
  id: ResinId
  name: string
  brand: string
  color: string        // CSS hex
  shades: ResinShade[]
  difficulty: 1 | 2 | 3 | 4
  xpBonus: number
  minLevel: number
  printTimeMin: number // seconds (simulated)
  description: string
  usage: string
  exposureTime: number  // seconds per layer (for calibration mini-game)
  optimalTemp: [number, number] // °C range
}

export const RESINS: Record<ResinId, Resin> = {
  pro_model: {
    id: 'pro_model',
    name: 'Pro Model',
    brand: 'SprintRay',
    color: '#9ca3af',
    shades: ['Grey', 'Beige'],
    difficulty: 1,
    xpBonus: 15,
    minLevel: 11,
    printTimeMin: 8,
    description: 'Résine modèle haute précision pour modèles d\'étude.',
    usage: 'Modèles d\'étude',
    exposureTime: 6,
    optimalTemp: [23, 27],
  },
  pro_denture_base: {
    id: 'pro_denture_base',
    name: 'Pro Denture Base',
    brand: 'SprintRay',
    color: '#f9a8d4',
    shades: ['Pink A', 'Pink B', 'Pink Veined'],
    difficulty: 1,
    xpBonus: 20,
    minLevel: 11,
    printTimeMin: 10,
    description: 'Base de prothèse flexible et biocompatible.',
    usage: 'Bases de prothèses',
    exposureTime: 7,
    optimalTemp: [24, 28],
  },
  pro_denture_teeth: {
    id: 'pro_denture_teeth',
    name: 'Pro Denture Teeth',
    brand: 'SprintRay',
    color: '#fef9c3',
    shades: ['A1', 'A2', 'A3', 'B1', 'BL'],
    difficulty: 2,
    xpBonus: 30,
    minLevel: 21,
    printTimeMin: 12,
    description: 'Dents de prothèse avec teintes vita précises.',
    usage: 'Dents de prothèses amovibles',
    exposureTime: 8,
    optimalTemp: [24, 28],
  },
  pro_tray: {
    id: 'pro_tray',
    name: 'Pro Tray',
    brand: 'SprintRay',
    color: '#93c5fd',
    shades: ['Blue'],
    difficulty: 2,
    xpBonus: 25,
    minLevel: 21,
    printTimeMin: 9,
    description: 'Porte-empreinte individuel rigide.',
    usage: 'Porte-empreintes',
    exposureTime: 7,
    optimalTemp: [23, 27],
  },
  pro_crown: {
    id: 'pro_crown',
    name: 'Pro Crown',
    brand: 'SprintRay',
    color: '#fde68a',
    shades: ['A1', 'A2', 'A3', 'A3.5', 'B1', 'B2', 'C2', 'BL'],
    difficulty: 3,
    xpBonus: 50,
    minLevel: 21,
    printTimeMin: 15,
    description: 'Couronne temporaire ou permanente ultra-résistante.',
    usage: 'Couronnes & bridges',
    exposureTime: 10,
    optimalTemp: [25, 29],
  },
  pro_night_guard: {
    id: 'pro_night_guard',
    name: 'Pro Night Guard',
    brand: 'SprintRay',
    color: '#a5f3fc',
    shades: ['Clear', 'Tinted'],
    difficulty: 3,
    xpBonus: 45,
    minLevel: 31,
    printTimeMin: 18,
    description: 'Gouttière occlusale transparente et flexible.',
    usage: 'Gouttières de bruxisme',
    exposureTime: 11,
    optimalTemp: [25, 29],
  },
  pro_surgical: {
    id: 'pro_surgical',
    name: 'Pro Surgical',
    brand: 'SprintRay',
    color: '#fef08a',
    shades: ['Yellow'],
    difficulty: 4,
    xpBonus: 80,
    minLevel: 41,
    printTimeMin: 22,
    description: 'Guide chirurgical stérilisable avec précision micronique.',
    usage: 'Guides chirurgicaux implantaires',
    exposureTime: 14,
    optimalTemp: [26, 30],
  },
}

export const getAvailableResins = (level: number): Resin[] =>
  Object.values(RESINS).filter((r) => r.minLevel <= level)
