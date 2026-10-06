import * as React from 'react';
import { View, Text, Image } from 'react-figmaapp';
import { normalize } from './normalize';
import { TEXT_TAGS, VIEW_TAGS } from './default';

type Style = Record<string, any>;
const TextCtx = React.createContext<Style>({});
const TEXT_KEYS = [
  'color',
  'fontFamily',
  'fontSize',
  'fontWeight',
  'fontStyle',
  'letterSpacing',
  'lineHeight',
  'textAlign',
  'textDecoration',
  'textTransform',
];
const pick = (s: Style): Style =>
  Object.fromEntries(TEXT_KEYS.filter((k) => s[k] != null).map((k) => [k, s[k]]));
const name = (tag: string, props: any) => props['aria-label'] || props.id || tag;

function createView(tag: string, defaults: Style) {
  const C = (props: any) => {
    const inherited = React.useContext(TextCtx);
    const style = normalize([defaults, props.style]);
    if (style.display === 'none' || props.hidden) return null;
    style.flexDirection = style.flexDirection || (style.display === 'flex' ? 'row' : 'column');
    delete style.display;
    const { gap, rowGap, columnGap, ...rest } = style;
    const textStyle = { ...inherited, ...pick(rest) };
    // Yoga 1 has no gap. Apply spacing to the existing children so flex,
    // alignSelf and sizing continue to belong to the actual child nodes.
    const row = rest.flexDirection.startsWith('row');
    const spacing = (row ? columnGap : rowGap) ?? gap;
    const edge = row
      ? rest.flexDirection === 'row-reverse'
        ? 'marginRight'
        : 'marginLeft'
      : rest.flexDirection === 'column-reverse'
      ? 'marginBottom'
      : 'marginTop';
    const kids: any = React.Children.toArray(props.children).map((child, i) => {
      const element =
        typeof child === 'string' || typeof child === 'number' ? (
          <Text key={`text-${i}`} style={textStyle}>
            {child}
          </Text>
        ) : (
          child
        );
      if (!i || !spacing || !React.isValidElement<any>(element)) return element;
      const childStyle = normalize(element.props.style);
      return React.cloneElement(element, {
        style: [element.props.style, { [edge]: (childStyle[edge] || 0) + spacing }],
      });
    });
    // Typography belongs to Text nodes, not View nodes.
    const viewStyle = { ...rest };
    TEXT_KEYS.forEach((key) => delete viewStyle[key]);
    return (
      <TextCtx.Provider value={textStyle}>
        <View name={name(tag, props)} style={viewStyle}>
          {kids}
        </View>
      </TextCtx.Provider>
    );
  };
  C.displayName = `html.${tag}`;
  return C;
}

function createText(tag: string, defaults: Style) {
  const C = (props: any) => {
    const inherited = React.useContext(TextCtx);
    const style = normalize([defaults, props.style]);
    if (style.display === 'none' || props.hidden) return null;
    delete style.display;
    const merged = { ...inherited, ...style };
    return (
      <TextCtx.Provider value={pick(merged)}>
        <Text name={name(tag, props)} style={merged}>
          {tag === 'br' ? '\n' : props.children}
        </Text>
      </TextCtx.Provider>
    );
  };
  C.displayName = `html.${tag}`;
  return C;
}

const Img = (props: any) => {
  const style = normalize([
    { objectFit: 'fill', width: props.width, height: props.height },
    props.style,
  ]);
  if (style.display === 'none' || props.hidden) return null;
  const { objectFit, display, ...rest } = style;
  const resizeMode =
    ({ fill: 'stretch', cover: 'cover', contain: 'contain' } as Style)[objectFit] || 'stretch';
  return (
    <Image
      name={props.alt || name('img', props)}
      source={{ uri: props.src }}
      resizeMode={resizeMode}
      style={rest}
    />
  );
};

// A Text node's fill is its glyph color. Keep box fills, borders and padding
// on a separate View so they survive Figma serialization.
function createInput(tag: string) {
  const C = (props: any) => {
    const inherited = React.useContext(TextCtx);
    const style = normalize(props.style);
    if (props.type === 'hidden' || style.display === 'none' || props.hidden) return null;
    delete style.display;
    let value = props.value ?? props.defaultValue ?? props.placeholder ?? '';
    if (props.type === 'password') value = '•'.repeat(String(value).length);
    const textStyle = { ...inherited, ...pick(style) };
    TEXT_KEYS.forEach((key) => delete style[key]);
    return (
      <View name={name(tag, props)} style={{ flexDirection: 'column', ...style }}>
        <Text name={`${tag} value`} style={textStyle}>
          {String(value)}
        </Text>
      </View>
    );
  };
  C.displayName = `html.${tag}`;
  return C;
}

export const html: Record<string, React.ComponentType<any>> = {
  ...Object.fromEntries(Object.entries(VIEW_TAGS).map(([t, d]) => [t, createView(t, d)])),
  ...Object.fromEntries(Object.entries(TEXT_TAGS).map(([t, d]) => [t, createText(t, d)])),
  img: Img,
  input: createInput('input'),
  textarea: createInput('textarea'),
};
