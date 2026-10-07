import * as React from 'react';
import { Artboard, Text, View, Svg, Image, renderToLiveJSON } from 'react-figmaapp';
import { ComponentGallery } from './showcase';

const version = 1;
export default () =>
  renderToLiveJSON(
    <>
      <Artboard
        id="card"
        sourceId="live-card"
        name="Live card"
        style={{
          width: version === 1 ? 360 : 420,
          height: 280,
          padding: 24,
          backgroundColor: '#f4f5f7',
          marginBottom: 80,
        }}
      >
        {version === 1 && (
          <View id="obsolete" style={{ width: 10, height: 10, backgroundColor: 'red' }} />
        )}
        {version !== 1 && (
          <View id="inserted" style={{ width: 10, height: 10, backgroundColor: 'blue' }} />
        )}
        <Text
          id="title"
          sourceId="live-title"
          name="Title"
          style={{ fontFamily: 'Inter', fontSize: 24, color: '#222222' }}
        >
          {version === 1 ? 'Live Figma renderer' : 'Hot update applied'}
        </Text>
        <View
          id="panel"
          style={{ height: 80, backgroundColor: '#ffffff', borderRadius: 8, padding: 12 }}
        >
          <Text id="body" style={{ fontFamily: 'Inter', fontSize: 14 }}>
            Shared <Text style={{ fontWeight: 700, color: '#3366ff' }}>React</Text> and Yoga
            pipeline 123232323
          </Text>
        </View>
        <Svg id="icon" name="Icon" width={24} height={24} viewBox="0 0 24 24">
          <Svg.Circle cx={12} cy={12} r={10} fill="#3366ff" />
        </Svg>
        <Image
          id="image"
          style={{ width: 8, height: 8 }}
          source="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a42sAAAAASUVORK5CYII="
        />
      </Artboard>
      <ComponentGallery />
    </>,
    { projectId: 'react-designapp-example', rootId: 'live-card' },
  );
