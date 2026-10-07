import { build } from 'esbuild';
import { mdx } from '@react-platform/mdx/esbuild';
import { createRequire, builtinModules } from 'node:module';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const builtins = new Set(builtinModules.flatMap(name => [name, 'node:' + name]));

/** Compile one MDX document against the existing Figma host, with one React 19 graph. */
export async function generateDocument(input = join(here, 'document.mdx'), output = join(here, 'document.figma.json')) {
  input = resolve(input);
  output = resolve(output);
  const host = {
    name: 'figma-host',
    /** @param {import('esbuild').PluginBuild} api */
    setup(api) {
      api.onResolve({ filter: /^[^./]|^@/ }, args => {
        const id = args.path;
        if (builtins.has(id)) return { path: id, external: true };
        if (id === 'react-strict-dom') return { path: require.resolve('react-strict-dom-figma') };
        if (id === 'react-figmaapp' || id === 'react-designapp/figma') return { path: require.resolve(id) };
        // Keep all authored components, the host and TestRenderer on the same React instance.
        if (/^react(?:\/|$)/.test(id) || id === 'react-test-renderer') return { path: require.resolve(id), external: true };
        return { path: require.resolve(id, { paths: [args.resolveDir || here] }), external: true };
      });
    },
  };
  const temp = await mkdtemp(join(here, '.mdx-build-'));
  try {
    const bundle = join(temp, 'document.cjs');
    const result = await build({
      stdin: { resolveDir: here, loader: 'js', contents: `
        import React from 'react';
        import { Artboard, Page, renderToJSON } from 'react-designapp/figma';
        import Content, { frontmatter } from ${JSON.stringify(input)};
        import { DocumentLayout, components } from './theme.js';
        module.exports = () => renderToJSON(
          React.createElement(Page, {name: 'MDX document'},
            React.createElement(Artboard, {name: (typeof frontmatter.title === 'string' ? frontmatter.title : 'MDX document'), style: {width: 960}},
              React.createElement(DocumentLayout, null, React.createElement(Content, {components})))),
          {name: (typeof frontmatter.title === 'string' ? frontmatter.title : 'MDX document')});
      ` },
      bundle: true, platform: 'node', format: 'cjs', target: 'node22', write: false, logLevel: 'silent',
      plugins: [mdx(), host],
    });
    await writeFile(bundle, result.outputFiles[0].contents);
    const render = require(bundle);
    const hadActFlag = Reflect.has(globalThis, 'IS_REACT_ACT_ENVIRONMENT');
    const previousActFlag = Reflect.get(globalThis, 'IS_REACT_ACT_ENVIRONMENT');
    Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true);
    let file;
    try { file = render(); }
    finally {
      if (hadActFlag) Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', previousActFlag);
      else Reflect.deleteProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT');
    }
    await mkdir(dirname(output), { recursive: true });
    await writeFile(output, JSON.stringify(file, null, 2) + '\n');
    delete require.cache[bundle];
    return file;
  } finally { await rm(temp, { recursive: true, force: true }); }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const input = process.argv[2] ? resolve(process.argv[2]) : undefined;
  const output = process.argv[3] ? resolve(process.argv[3]) : join(here, 'document.figma.json');
  await generateDocument(input, output);
  console.log(`Wrote ${output}`);
}
