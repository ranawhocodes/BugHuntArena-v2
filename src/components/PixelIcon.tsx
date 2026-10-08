import type { ComponentPropsWithoutRef } from 'react';
import { STREAMLINE_PIXEL_PATHS } from './pixelIconPaths';
import type { StreamlinePixelIconName } from './pixelIconPaths';
import './PixelIcon.css';

type Rect = readonly [x: number, y: number, w: number, h: number];

/** Diagonal run of 2×2 blocks, used to build the stepped glyphs below. */
function steps(fromX: number, fromY: number, dx: number, dy: number, count: number): Rect[] {
  return Array.from({ length: count }, (_, i) => [fromX + i * dx, fromY + i * dy, 2, 2] as const);
}

/**
 * Small utility glyphs the Streamline Pixel free set does not include (plain arrow,
 * close, check). Drawn on the same 21-pixel grid so they share its pixel size.
 */
const GLYPHS = {
  'arrow-right': [[3, 9, 12, 2], ...steps(11, 5, 2, 2, 3), ...steps(13, 11, -2, 2, 2)],
  'arrow-left': [[6, 9, 12, 2], ...steps(8, 5, -2, 2, 3), ...steps(6, 11, 2, 2, 2)],
  close: [...steps(5, 5, 2, 2, 6), ...steps(15, 5, -2, 2, 6)],
  check: [...steps(3, 10, 2, 2, 3), ...steps(9, 12, 2, -2, 5)],
  square: [[7, 7, 7, 7]],
} satisfies Record<string, readonly Rect[]>;

type GlyphName = keyof typeof GLYPHS;
export type PixelIconName = StreamlinePixelIconName | GlyphName;

export interface PixelIconProps extends Omit<ComponentPropsWithoutRef<'svg'>, 'name'> {
  name: PixelIconName;
  /** Rendered size in px. Multiples of 21 map one icon pixel to whole screen pixels. */
  size?: number;
  /** Accessible label. Omit for decorative icons (the default). */
  label?: string;
}

function isGlyph(name: PixelIconName): name is GlyphName {
  return name in GLYPHS;
}

export function PixelIcon({ name, size = 21, label, className = '', ...props }: PixelIconProps) {
  const a11y = label
    ? { role: 'img', 'aria-label': label }
    : { 'aria-hidden': true as const, focusable: 'false' as const };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={isGlyph(name) ? '0 0 21 21' : '0 0 32 32'}
      width={size}
      height={size}
      fill="currentColor"
      className={`px-icon ${className}`.trim()}
      {...a11y}
      {...props}
    >
      {isGlyph(name)
        ? GLYPHS[name].map(([x, y, w, h]) => (
            <rect key={`${x}-${y}-${w}-${h}`} x={x} y={y} width={w} height={h} />
          ))
        : STREAMLINE_PIXEL_PATHS[name].map((d) => <path key={d} d={d} />)}
    </svg>
  );
}
