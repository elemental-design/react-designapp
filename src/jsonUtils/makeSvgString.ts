import { TreeNode } from '../types';
import { Props } from '../components/Svg/Svg';

const snakeExceptions = [
  'gradientUnits',
  'gradientTransform',
  'patternUnits',
  'patternTransform',
  'stdDeviation',
  'numOctaves',
  'specularExponent',
  'specularConstant',
  'surfaceScale',
  'viewBox',
];

function toSnakeCase(string: string) {
  if (string === 'href') {
    return 'xlink:href';
  }
  if (snakeExceptions.indexOf(string) !== -1) {
    return string;
  }
  return string.replace(/([A-Z])/g, ($1) => `-${$1.toLowerCase()}`);
}

// Serializes the raw `<Svg.*>` sub-tree (kept as-is -- not converted to a
// Yoga-laid-out `TreeNode` -- by `buildTree`, see the `sketch_svg` special
// case there) back into a flat SVG markup string. Shared by both the Sketch
// backend (which feeds this string to Sketch's native SVG importer) and the
// Figma backend (which embeds it directly, since Figma's plugin API can
// create a vector node from an SVG string).
export function makeSvgString(el: string | TreeNode<Props>): string {
  if (typeof el === 'string') {
    return el;
  }
  const { type, props, children } = el;

  if (props && props.textNodes && props.textNodes.length) {
    return props.textNodes.reduce((prev, textNode) => prev + textNode.content, '');
  }

  if (!type || type.indexOf('svg_') !== 0) {
    throw new Error(
      `Could not render type '${type}'. Make sure to only have <Svg.*> components inside <Svg>.`,
    );
  }

  const cleanedType = type.slice(4);
  const attributes = Object.keys(props || {}).reduce(
    // @ts-ignore
    (prev, k) => (props[k] ? `${prev} ${toSnakeCase(k)}="${props[k]}"` : prev),
    '',
  );

  let string = `<${cleanedType}${attributes}`;

  if (!children || !children.length) {
    string += '/>\n';
  } else {
    string += '>\n';
    string += (children || []).reduce((prev, c) => `${prev}  ${makeSvgString(c)}`, '');
    string += `</${cleanedType}>\n`;
  }

  return string;
}
