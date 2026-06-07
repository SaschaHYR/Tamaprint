export type PrinterType = 'filament' | 'elegoo' | 'sprintray_pro2' | 'sprintray_midas'
export type AddOnType = 'prowash_s' | 'nanocure'

export interface Printer {
  id: PrinterType
  name: string
  brand: string
  minLevel: number
  maxLevel: number
  layerThickness: number // µm
  buildVolume: string
  emoji: string
  accentColor: string
  needsCalibration: boolean // niv 1-20 only
}

export interface AddOn {
  id: AddOnType
  name: string
  unlockLevel: number
  description: string
  emoji: string
}

export const PRINTERS: Printer[] = [
  {
    id: 'filament',
    name: 'FDM Filament',
    brand: 'Generic',
    minLevel: 1,
    maxLevel: 10,
    layerThickness: 200,
    buildVolume: '220×220×250mm',
    emoji: '🖨️',
    accentColor: '#6ee7b7',
    needsCalibration: true,
  },
  {
    id: 'elegoo',
    name: 'Elegoo Mars Pro',
    brand: 'Elegoo',
    minLevel: 11,
    maxLevel: 20,
    layerThickness: 50,
    buildVolume: '129×80×160mm',
    emoji: '🟣',
    accentColor: '#a78bfa',
    needsCalibration: true,
  },
  {
    id: 'sprintray_pro2',
    name: 'Pro 2',
    brand: 'SprintRay',
    minLevel: 21,
    maxLevel: 60,
    layerThickness: 50,
    buildVolume: '192×108×185mm',
    emoji: '⚡',
    accentColor: '#60a5fa',
    needsCalibration: false,
  },
  {
    id: 'sprintray_midas',
    name: 'Midas',
    brand: 'SprintRay',
    minLevel: 61,
    maxLevel: 100,
    layerThickness: 25,
    buildVolume: '290×163×380mm',
    emoji: '🦷',
    accentColor: '#fbbf24',
    needsCalibration: false,
  },
]

export const ADD_ONS: AddOn[] = [
  {
    id: 'prowash_s',
    name: 'ProWash S',
    unlockLevel: 41,
    description: 'Lavage automatisé en 10 min',
    emoji: '🧼',
  },
  {
    id: 'nanocure',
    name: 'NanoCure',
    unlockLevel: 51,
    description: 'Photopolymérisation automatique',
    emoji: '💜',
  },
]

export const getPrinterForLevel = (level: number): Printer =>
  PRINTERS.slice()
    .reverse()
    .find((p) => p.minLevel <= level) ?? PRINTERS[0]
