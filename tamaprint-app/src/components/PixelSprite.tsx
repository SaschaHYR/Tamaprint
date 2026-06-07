import { motion } from 'framer-motion'
import type { Sprite, Palette } from '../data/sprites'

interface Props {
  sprite: Sprite
  palette: Palette
  pixelSize?: number
  className?: string
  animate?: boolean
  animateColor?: string
}

export default function PixelSprite({
  sprite,
  palette,
  pixelSize = 3,
  className,
  animate = false,
  animateColor,
}: Props) {
  const cols = sprite[0]?.length ?? 0
  const rows = sprite.length
  const w = cols * pixelSize
  const h = rows * pixelSize

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${cols} ${rows}`}
      className={`pixel-art shrink-0 ${className ?? ''}`}
      style={{ imageRendering: 'pixelated' }}
    >
      {sprite.flatMap((row, y) =>
        row.map((colorIdx, x) => {
          if (colorIdx === 0) return null
          const fill = palette[colorIdx] ?? '#ff00ff'
          return (
            <rect
              key={`${x}-${y}`}
              x={x}
              y={y}
              width={1}
              height={1}
              fill={fill}
            />
          )
        })
      )}
      {/* UV glow overlay animated for printers when animate=true */}
      {animate && animateColor && (
        <motion.rect
          x={0} y={0} width={cols} height={rows}
          fill={animateColor}
          opacity={0}
          animate={{ opacity: [0, 0.08, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
    </svg>
  )
}
