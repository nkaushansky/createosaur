/** Small pure color helpers. Hex in, hex out — no color libraries. */

export function hex2rgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

export function rgb2hex(rgb: readonly [number, number, number]): string {
  return (
    '#' +
    rgb
      .map((v) => Math.min(255, Math.max(0, Math.round(v))).toString(16).padStart(2, '0'))
      .join('')
  );
}

/**
 * amt in [-1, 1]: negative shades toward a warm near-black, positive tints
 * toward warm white — the field-guide look never uses pure black/white.
 */
export function shade(hex: string, amt: number): string {
  const c = hex2rgb(hex);
  const target: [number, number, number] = amt < 0 ? [16, 18, 12] : [252, 250, 240];
  const t = Math.abs(amt);
  return rgb2hex([
    c[0] + (target[0] - c[0]) * t,
    c[1] + (target[1] - c[1]) * t,
    c[2] + (target[2] - c[2]) * t,
  ]);
}
