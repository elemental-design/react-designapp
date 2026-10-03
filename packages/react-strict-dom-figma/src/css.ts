// css.ts
import { flatten } from './normalize';

export const css = {
  create: <T extends Record<string, any>>(styles: T): T =>
    Object.fromEntries(
      Object.entries(styles).map(([k, v]) => [k, flatten(v)])
    ) as T,
  // Static values only; no runtime theming in a design tool
  defineVars: <T extends Record<string, any>>(vars: T): T => vars,
  createTheme: (_vars: any, overrides: any) => overrides,
  keyframes: () => {
    throw new Error('css.keyframes() is not supported');
  },
};
