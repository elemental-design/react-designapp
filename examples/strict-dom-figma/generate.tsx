import * as fs from 'fs';
import * as path from 'path';
import * as React from 'react';
import { renderToJSON } from 'react-figmaapp';
import { ComponentGallery } from './showcase';

const output = path.resolve(process.argv[2] || path.join(__dirname, '..', 'strict-dom-figma.json'));
fs.writeFileSync(
  output,
  JSON.stringify(
    renderToJSON(<ComponentGallery />, { name: 'Strict DOM component gallery' }),
    null,
    2,
  ) + '\n',
);
console.log(`Wrote ${output}`);
