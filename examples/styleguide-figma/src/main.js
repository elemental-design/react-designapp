import * as React from 'react';
import * as fs from 'fs';
import * as path from 'path';
import { renderToJSON, View, Svg } from '../../../lib/figma';
import { TextStyles } from '../../../lib';
import designSystem from './designSystem';

import Label from './components/Label';
import Palette from './components/Palette';
import Section from './components/Section';
import TypeSpecimen from './components/TypeSpecimen';

const SampleSvg = () => (
  <Svg xmlns="http://www.w3.org/2000/svg" width="494" height="447" viewBox="0 0 494 447">
    <Svg.G fill="none" fillRule="evenodd">
      <Svg.Path fill="#FFAE00" d="M247 447L0 160 107 15 247 0l140 15 107 145" />
      <Svg.Path fill="#EC6C00" d="M247 447L0 160h494" />
      <Svg.Path fill="#FFAE00" d="M247 447L100 160h294" />
      <Svg.Path fill="#FFEFB4" d="M247 0L100 160h294" />
      <Svg.Path fill="#FFAE00" d="M107 15L52 88 0 160h101M387 15l55 73 52 72H393" />
      <Svg.Path fill="#FED305" d="M107 15l-7 145L247 0m140 15l7 145L247 0" />
    </Svg.G>
  </Svg>
);

const Document = ({ system }) => (
  <View>
    <View name="Intro" style={{ width: 420, marginBottom: system.spacing * 4 }}>
      <Label>
        This is an example react-sketchapp document, showing how to render a styleguide from a data
        representation of your design system.
      </Label>
    </View>

    <Section title="Sample Svg">
      <Svg xmlns="http://www.w3.org/2000/svg" width="494" height="447" viewBox="0 0 494 447">
        <Svg.G fill="none" fillRule="evenodd">
          <Svg.Path fill="#FFAE00" d="M247 447L0 160 107 15 247 0l140 15 107 145" />
          <Svg.Path fill="#EC6C00" d="M247 447L0 160h494" />
          <Svg.Path fill="#FFAE00" d="M247 447L100 160h294" />
          <Svg.Path fill="#FFEFB4" d="M247 0L100 160h294" />
          <Svg.Path fill="#FFAE00" d="M107 15L52 88 0 160h101M387 15l55 73 52 72H393" />
          <Svg.Path fill="#FED305" d="M107 15l-7 145L247 0m140 15l7 145L247 0" />
        </Svg.G>
      </Svg>
    </Section>

    <Section title="Color Palette">
      <Palette colors={system.colors} />
    </Section>
  </View>
);

// export default () => {
//   TextStyles.create(designSystem.fonts, {
//     clearExistingStyles: true,
//   });

//   render(<Document system={designSystem} />, context.document.currentPage());
// };

const figmaFile = renderToJSON(<Document system={designSystem} />, { name: 'Profile Cards' });

const outputPath = path.join(__dirname, '..', 'profile-cards-figma.json');
fs.writeFileSync(outputPath, JSON.stringify(figmaFile, null, 2));

// eslint-disable-next-line no-console
console.log(`Wrote Figma file JSON to ${outputPath}`);
