import * as fs from 'fs';
import * as path from 'path';
import * as React from 'react';
import * as PropTypes from 'prop-types';
// The Figma backend renders headlessly to Figma file-format JSON (no Figma
// API usage); the Sketch backend (`backend: 'sketch'`) would emit Sketch
// format instead, using the native macOS bridge for text measurement.
import { renderToDesignJSON, Artboard, Text, View } from '../../../packages/react-designapp/';
import chroma from 'chroma-js';

// take a hex and give us a nice text color to put over it
const textColor = (hex) => {
  const vsWhite = chroma.contrast(hex, 'white');
  if (vsWhite > 4) {
    return '#FFF';
  }
  return chroma(hex).darken(3).hex();
};

const Swatch = ({ name, hex }) => (
  <View
    name={`Swatch ${name}`}
    style={{
      height: 96,
      width: 96,
      margin: 4,
      backgroundColor: hex,
      padding: 8,
    }}
  >
    <Text
      name="Swatch Name"
      style={{ color: textColor(hex), fontWeight: 'bold', fontFamily: 'Helvetica' }}
    >
      {name}
    </Text>
    <Text name="Swatch Hex" style={{ color: textColor(hex) }}>
      {hex}
    </Text>
  </View>
);

const Color = {
  hex: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
};

Swatch.propTypes = Color;

const Document = ({ colors }) => (
  <Artboard
    name="Swatches"
    style={{
      flexDirection: 'row',
      flexWrap: 'wrap',
      width: (96 + 8) * 4,
    }}
  >
    {Object.keys(colors).map((color) => (
      <Swatch name={color} hex={colors[color]} key={color} />
    ))}
  </Artboard>
);

Document.propTypes = {
  colors: PropTypes.objectOf(PropTypes.string).isRequired,
};

const colorList = {
  Haus: '#F3F4F4',
  Night: '#333',
  Sur: '#96DBE4',
  'Sur Dark': '#24828F',
  Peach: '#EFADA0',
  'Peach Dark': '#E37059',
  Pear: '#93DAAB',
  'Pear Dark': '#2E854B',
};

const figmaFile = renderToDesignJSON(<Document colors={colorList} />, {
  backend: 'figma',
  name: 'Multi Platform',
});

const outputPath = path.join(__dirname, '..', 'multi-platform-figma.json');
fs.writeFileSync(outputPath, JSON.stringify(figmaFile, null, 2));

// eslint-disable-next-line no-console
console.log(`Wrote Figma file JSON to ${outputPath}`);
