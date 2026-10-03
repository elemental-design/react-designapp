// Converts a border radius value (number, "12px", "50%") to a number of points.
// Percentages resolve against the smaller side of the box, so `50%` is a circle.
export const resolveRadius = (value: unknown, width: number, height: number): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (!Number.isFinite(parsed)) return 0;
    return value.trim().endsWith('%') ? (parsed / 100) * Math.min(width, height) : parsed;
  }
  return 0;
};

export const resolveRadii = (
  style: {
    borderTopLeftRadius?: unknown;
    borderTopRightRadius?: unknown;
    borderBottomRightRadius?: unknown;
    borderBottomLeftRadius?: unknown;
  },
  width: number,
  height: number,
): [number, number, number, number] => [
  resolveRadius(style.borderTopLeftRadius, width, height),
  resolveRadius(style.borderTopRightRadius, width, height),
  resolveRadius(style.borderBottomRightRadius, width, height),
  resolveRadius(style.borderBottomLeftRadius, width, height),
];
