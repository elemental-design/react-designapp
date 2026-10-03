import * as React from 'react';
import { View, Text, Image } from 'react-figmaapp';

import { normalize } from './normalize';
import { TEXT_TAGS, VIEW_TAGS } from './defaults';
import { warn } from './warn';

const TextCtx = React.createContext<Record<string, any>>({});

const TEXT_KEYS = [
  'color', 'fontFamily', 'fontSize', 'fontWeight', 'fontStyle',
  'letterSpacing', 'lineHeight', 'textAlign', 'textDecorationLine',
  'textTransform',
];
const pick = (s: Record<string, any>) =>
  Object.fromEntries(TEXT_KEYS.filter((k) => s[k] != null).map((k) => [k, s[k]]));

function check(tag: string, props: any) {
  if (props.ref) warn(`ref is not supported on html.${tag}`);
}

function createView(tag: string, defaults: Record<string, any>) {
  const C = (props: any) => {
    check(tag, props);
    const inherited = React.useContext(TextCtx);
    const style = normalize([defaults, props.style]);
    if (style.display === 'none') return null;

    // RSD: display:flex => row; block emulation => column
    const isFlex = style.display === 'flex';
    style.flexDirection ??= isFlex ? 'row' : 'column';
    delete style.display;

    const { gap, rowGap, columnGap, ...rest } = style;
    const row = rest.flexDirection.startsWith('row');
    const g = gap ?? (row ? columnGap : rowGap);

    let kids: any = props.children;
    if (typeof kids === 'string') {
      kids = <Text style={inherited}>{kids}</Text>;
    }
    if (g && Array.isArray(React.Children.toArray(kids))) {
      kids = React.Children.toArray(kids).map((c, i) => (
        <View key={i} style={row ? { marginLeft: i ? g : 0 } : { marginTop: i ? g : 0 }}>
          {c}
        </View>
      ));
    }

    return (
      <TextCtx.Provider value={{ ...inherited, ...pick(rest) }}>
        <View name={props['aria-label'] ?? tag} style={rest}>
          {kids}
        </View>
      </TextCtx.Provider>
    );
  };
  C.displayName = `html.${tag}`;
  return C;
}

function createText(tag: string, defaults: Record<string, any>) {
  const C = (props: any) => {
    check(tag, props);
    const inherited = React.useContext(TextCtx);
    const style = normalize([defaults, props.style]);
    if (style.display === 'none') return null;
    delete style.display;
    const children = tag === 'br' ? '\n' : props.children;
    return <Text style={{ ...inherited, ...style }}>{children}</Text>;
  };
  C.displayName = `html.${tag}`;
  return C;
}

const Img = (props: any) => {
  const style = normalize({ objectFit: 'fill', ...props.style });
  const { objectFit, ...rest } = style;
  if (props.width != null) rest.width ??= props.width;
  if (props.height != null) rest.height ??= props.height;
  const resizeMode =
    ({ fill: 'stretch', cover: 'cover', contain: 'contain' } as any)[objectFit];
  return <Image source={{ uri: props.src }} resizeMode={resizeMode} style={rest} />;
};

export const html: Record<string, React.ComponentType<any>> = {
  ...Object.fromEntries(
    Object.entries(VIEW_TAGS).map(([t, d]) => [t, createView(t, d)])
  ),
  ...Object.fromEntries(
    Object.entries(TEXT_TAGS).map(([t, d]) => [t, createText(t, d)])
  ),
  img: Img,
};
