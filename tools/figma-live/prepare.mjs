import { readFile, writeFile } from 'node:fs/promises';
let id = process.env.FIGMA_PLUGIN_ID;
if (!id && process.env.FIGMA_GENERATED_MANIFEST) {
 const generated = JSON.parse(await readFile(process.env.FIGMA_GENERATED_MANIFEST, 'utf8'));
 id = generated.id;
}

if (!id || !/^\d+$/.test(id)) throw new Error('Set FIGMA_PLUGIN_ID to the stable ID from Figma Create new plugin.');
await writeFile(new URL('./plugin/manifest.json', import.meta.url), JSON.stringify({name:'react-designapp live probe',id,api:'1.0.0',main:'code.js',ui:'ui.html',editorType:['figma'],documentAccess:'dynamic-page',networkAccess:{allowedDomains:['none'],devAllowedDomains:['http://localhost:3847']}},null,2)+'\n');
