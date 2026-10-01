import * as fs from 'fs';
import * as path from 'path';
import * as React from 'react';
// This example consumes the built package directly (after `npm run build`
// at the repository root) rather than an installed `react-sketchapp`
// dependency, since it lives inside this monorepo. Published users would
// instead write `import { renderToJSON, Document, Page, Text } from
// 'react-sketchapp/figma';`.
import { renderToJSON, Document, Page, Text, View } from '../../../lib/figma';
import { fonts, spacing } from './designSystem';
import Profile from './components/Profile';
import Space from './components/Space';

const DATA = [
  {
    screen_name: 'mxstbr',
    name: 'Max Stoiber',
    description:
      '⚛️ Makes styled-components, react-boilerplate, @KeystoneJS and CarteBlanche. ✌ Open source developer @thethinkmill. ☕ Speciality coffee geek, skier, traveller.',
    location: 'Vienna, Austria',
    url: 'mxstbr.com',
    profile_image_url:
      'https://pbs.twimg.com/profile_images/763033229993574400/6frGyDyA_400x400.jpg',
  },
  {
    name: '- ̗̀Jackie ̖́-',
    screen_name: 'jackiesaik',
    description:
      'Graphic designer, never won a spelling be. Toronto on weekdays. Go Home Lake on weekends. ╮ (. ● ᴗ ●.) ╭',
    location: 'Toronto, ON',
    url: 'cargocollective.com/jackiesaik',
    profile_image_url:
      'https://pbs.twimg.com/profile_images/895665264464764930/7Mb3QtEB_400x400.jpg',
  },
  {
    screen_name: 'jongold',
    name: 'kerning man',
    description:
      'an equal command of technology and form • functional programming (oc)cultist • design tools @airbnbdesign',
    location: 'California',
    url: 'weirdwideweb.jon.gold',
    profile_image_url: 'https://pbs.twimg.com/profile_images/833785170285178881/loBb32g3.jpg',
  },
];

const ProfileCardsPage = ({ users }) => (
  <Page name="Page 1">
    <Text style={fonts['Title 1']}>Profile Cards</Text>
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        width: users.length * 300,
      }}
    >
      {users.map((user) => (
        <Space key={user.screen_name} h={spacing} v={spacing}>
          <Profile user={user} />
        </Space>
      ))}
    </View>
  </Page>
);

const figmaFile = renderToJSON(
  <Document>
    <ProfileCardsPage users={DATA} />
  </Document>,
  { name: 'Profile Cards' },
);

const outputPath = path.join(__dirname, '..', 'profile-cards-figma.json');
fs.writeFileSync(outputPath, JSON.stringify(figmaFile, null, 2));

// eslint-disable-next-line no-console
console.log(`Wrote Figma file JSON to ${outputPath}`);
