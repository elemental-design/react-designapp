export const warn = (msg: string) =>
  // Same format as RSD, so LogBox-style filters carry over
  console.warn(`[warn] React Strict DOM: ${msg}`);
