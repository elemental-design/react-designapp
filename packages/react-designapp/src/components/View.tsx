import * as React from 'react';
import * as PropTypes from 'prop-types';
import { or } from 'airbnb-prop-types';
import { StyleSheet } from '../stylesheet';
import { ViewStylePropTypes } from './ViewStylePropTypes';
import { ResizingConstraintPropTypes } from './ResizingConstraintPropTypes';
import { ShadowsPropTypes } from './ShadowsPropTypes';

export const ViewPropTypes = {
  id: PropTypes.string,
  nativeID: PropTypes.string,
  renderId: PropTypes.string,
  sourceId: PropTypes.string,
  // TODO(lmr): do some nice warning stuff like RN does
  style: or([PropTypes.shape(ViewStylePropTypes), PropTypes.number]),
  name: PropTypes.string,
  resizingConstraint: PropTypes.shape({
    ...ResizingConstraintPropTypes,
  }),
  shadows: PropTypes.arrayOf(
    PropTypes.shape({
      ...ShadowsPropTypes,
    }),
  ),
  flow: PropTypes.shape({
    targetId: PropTypes.string,
    target: PropTypes.string,
    animationType: PropTypes.string,
  }),
  children: PropTypes.node,
};

export type Props = PropTypes.InferProps<typeof ViewPropTypes>;

export class View extends React.Component<Props> {
  static propTypes = ViewPropTypes;

  static defaultProps = {
    name: 'View',
  };

  render() {
    return (
      <sketch_view
        name={this.props.name}
        id={this.props.id}
        nativeID={this.props.nativeID}
        renderId={this.props.renderId}
        sourceId={this.props.sourceId}
        style={StyleSheet.flatten(this.props.style)}
        resizingConstraint={this.props.resizingConstraint}
        shadows={this.props.shadows}
        flow={this.props.flow}
      >
        {this.props.children}
      </sketch_view>
    );
  }
}
