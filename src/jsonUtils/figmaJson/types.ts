export type FigmaColor = { r: number; g: number; b: number; a: number };

export type FigmaRect = { x: number; y: number; width: number; height: number };

export type FigmaVector = { x: number; y: number };

export type FigmaPaint = {
  blendMode: 'NORMAL';
  type: 'SOLID' | 'IMAGE';
  color?: FigmaColor;
  scaleMode?: 'FILL' | 'FIT' | 'CROP' | 'TILE';
  imageRef?: string;
};

export type FigmaGeometry = { path: string; windingRule: 'NONZERO' | 'EVENODD' };

export type FigmaEffect = {
  type: 'DROP_SHADOW' | 'INNER_SHADOW';
  visible: boolean;
  blendMode: 'NORMAL';
  color: FigmaColor;
  offset: FigmaVector;
  radius: number;
  spread: number;
};

export type FigmaTextStyle = {
  fontFamily: string;
  fontPostScriptName: string;
  italic: boolean;
  fontWeight: number;
  fontSize: number;
  textAlignHorizontal: 'LEFT' | 'RIGHT' | 'CENTER' | 'JUSTIFIED';
  textAlignVertical: 'TOP' | 'CENTER' | 'BOTTOM';
  letterSpacing: number;
  lineHeightPx: number;
  lineHeightPercent: number;
  lineHeightUnit: 'INTRINSIC_%' | 'FONT_SIZE_%' | 'PIXELS';
  textAutoResize?: 'NONE' | 'WIDTH_AND_HEIGHT' | 'HEIGHT' | 'TRUNCATE';
  paragraphIndent?: number;
};

export type FigmaNodeCommon = {
  id: string;
  name: string;
  scrollBehavior: 'SCROLLS';
  blendMode: 'PASS_THROUGH';
  absoluteBoundingBox: FigmaRect;
  absoluteRenderBounds: FigmaRect;
  constraints: { vertical: 'TOP'; horizontal: 'LEFT' };
  relativeTransform: [[number, number, number], [number, number, number]];
  size: FigmaVector;
  fills: FigmaPaint[];
  fillGeometry: FigmaGeometry[];
  strokes: FigmaPaint[];
  strokeWeight: number;
  strokeAlign: 'INSIDE' | 'OUTSIDE' | 'CENTER';
  strokeGeometry: FigmaGeometry[];
  exportSettings: unknown[];
  effects: FigmaEffect[];
};

export type FigmaFrameNode = FigmaNodeCommon & {
  type: 'FRAME';
  layoutMode: 'NONE' | 'HORIZONTAL' | 'VERTICAL';
  paddingLeft: number;
  paddingRight: number;
  paddingTop: number;
  paddingBottom: number;
  itemSpacing: number;
  primaryAxisAlignItems: 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN';
  counterAxisAlignItems: 'MIN' | 'CENTER' | 'MAX';
  layoutSizingHorizontal: 'FIXED' | 'HUG';
  layoutSizingVertical: 'FIXED' | 'HUG';
  cornerRadius: number;
  clipsContent: boolean;
  backgrounds: FigmaPaint[];
  children: FigmaNode[];
};

export type FigmaRectangleNode = FigmaNodeCommon & {
  type: 'RECTANGLE';
  cornerRadius: number;
};

export type FigmaTextNode = FigmaNodeCommon & {
  type: 'TEXT';
  characters: string;
  style: FigmaTextStyle;
  characterStyleOverrides: number[];
  styleOverrideTable: { [key: number]: Partial<FigmaTextStyle> & { fills?: FigmaPaint[] } };
  lineTypes: string[];
  lineIndentations: number[];
};

// `VECTOR` is a real Figma REST node type, but the REST format represents
// its geometry via `fillGeometry`/`strokeGeometry` path data, not raw SVG
// markup. Since there's no official way to hand Figma a flat SVG string
// through the file-format JSON, `svg` here is a **custom extension**
// consumed by the companion Figma plugin (not part of Figma's own schema):
// the plugin can create the real vector via `figma.createNodeFromSvg(svg)`
// and reposition/rename it using this node's other (standard) fields.
export type FigmaVectorNode = FigmaNodeCommon & {
  type: 'VECTOR';
  svg: string;
};

export type FigmaNode = FigmaFrameNode | FigmaRectangleNode | FigmaTextNode | FigmaVectorNode;

export type FigmaPage = {
  id: string;
  name: string;
  type: 'CANVAS';
  scrollBehavior: 'SCROLLS';
  children: FigmaNode[];
  backgroundColor: FigmaColor;
  prototypeStartNodeID: null;
  flowStartingPoints: unknown[];
  prototypeDevice: { type: 'NONE'; rotation: 'NONE' };
  exportSettings: unknown[];
};

export type FigmaDocument = {
  id: '0:0';
  name: 'Document';
  type: 'DOCUMENT';
  scrollBehavior: 'SCROLLS';
  children: FigmaPage[];
};

export type FigmaFile = {
  document: FigmaDocument;
  components: {};
  componentSets: {};
  schemaVersion: 0;
  styles: {};
  name: string;
  lastModified: string;
  version: string;
  role: 'owner';
  editorType: 'figma';
  linkAccess: 'inherit';
};
