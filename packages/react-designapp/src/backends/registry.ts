import { RenderBackend } from './types';

const backends = new Map<string, RenderBackend<any, any>>();

// Registers a backend under a name (e.g. `'sketch'`, `'figma'`, and later a
// `'penpot'` backend) so it can be selected by name via `renderToDesignJSON`.
export function registerBackend(backend: RenderBackend<any, any>): void {
  backends.set(backend.name, backend);
}

export function getBackend(name: string): RenderBackend<any, any> {
  const backend = backends.get(name);
  if (!backend) {
    throw new Error(
      `Unknown react-sketchapp backend "${name}". Available backends: ${Array.from(
        backends.keys(),
      ).join(', ')}`,
    );
  }
  return backend;
}

export function listBackends(): string[] {
  return Array.from(backends.keys());
}
