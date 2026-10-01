import { ViewRenderer } from './ViewRenderer';
import { TreeNode } from '../types';
import { makeSvgLayer } from '../jsonUtils/makeSvgLayer';
import { makeSvgString } from '../jsonUtils/makeSvgString';
import { Props } from '../components/Svg/Svg';

export class SvgRenderer extends ViewRenderer {
  getDefaultGroupName(props: Props) {
    return props.name || 'Svg';
  }

  renderBackingLayers(node: TreeNode<Props>) {
    const layers = super.renderBackingLayers(node);

    const { layout, props, children, style } = node;

    // add the "xmlns:xlink" namespace so we can use `href`
    props['xmlns:xlink'] = 'http://www.w3.org/1999/xlink';

    const svgString = makeSvgString({
      type: 'svg_svg',
      props,
      children,
      style,
      layout,
    });

    const svgLayer = makeSvgLayer(layout, 'Shape', svgString);

    layers.push(svgLayer);

    return layers;
  }
}
