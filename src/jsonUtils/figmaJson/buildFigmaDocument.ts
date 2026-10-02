import { PlatformBridge, TreeNode, TextNode as FlexTextNode } from '../../types';
import { FigmaIdGenerator } from './idGenerator';
import { buildShapeNode } from './shapeNode';
import { buildTextNode } from './textNode';
import { buildSvgNode } from './svgNode';
import { toFigmaColor } from './colors';
import { FigmaFile, FigmaNode, FigmaPage, FigmaRect } from './types';
import NodeBridge from '../../platformBridges/node';

type WalkContext = {
  idGen: FigmaIdGenerator;
  absX: number;
  absY: number;
  platformBridge: PlatformBridge;
  autoLayout: boolean;
};

function defaultNameForType(type: string): string {
  switch (type) {
    case 'sketch_artboard':
      return 'Frame';
    case 'sketch_image':
      return 'Image';
    case 'sketch_text':
      return 'Text';
    case 'sketch_svg':
      return 'Svg';
    default:
      return 'Group';
  }
}

function resolveName(node: TreeNode): string {
  if (node.props && node.props.name) {
    return node.props.name;
  }
  if (node.type === 'sketch_text') {
    return node.props.textNodes.map((t: FlexTextNode) => t.content).join('') || 'Text';
  }
  return defaultNameForType(node.type);
}

// Recursively converts a design-app-neutral `TreeNode` (produced by
// `buildTree`, shared with the Sketch backend) into a Figma REST-JSON-like
// node. Absolute positions are accumulated while walking down the tree,
// since `layout.left`/`layout.top` on each TreeNode are relative to its
// parent (as returned by Yoga).
export function buildFigmaNode(node: TreeNode | string, ctx: WalkContext): FigmaNode | null {
  if (typeof node === 'string') {
    return null;
  }

  const absX = ctx.absX + node.layout.left;
  const absY = ctx.absY + node.layout.top;
  const box: FigmaRect = {
    x: absX,
    y: absY,
    width: node.layout.width,
    height: node.layout.height,
  };
  const name = resolveName(node);
  const id = ctx.idGen.next();

  if (node.type === 'sketch_text') {
    return buildTextNode(node, id, name, box);
  }

  if (node.type === 'sketch_svg') {
    // Serialize the SVG sub-tree back into a flat SVG string -- the same
    // one the Sketch backend feeds to its native SVG importer -- and embed
    // it on a VECTOR node for the companion Figma plugin to turn into real
    // vector geometry (see `buildSvgNode`).
    return buildSvgNode(node, id, name, box);
  }

  const childCtx: WalkContext = {
    idGen: ctx.idGen,
    absX,
    absY,
    platformBridge: ctx.platformBridge,
    autoLayout: ctx.autoLayout,
  };
  const children = (node.children || [])
    .map((child) => buildFigmaNode(child, childCtx))
    .filter((child): child is FigmaNode => child !== null);

  const forceFrame = node.type === 'sketch_artboard';

  return buildShapeNode(
    node,
    id,
    name,
    box,
    children,
    forceFrame,
    ctx.platformBridge,
    ctx.autoLayout,
  );
}

function buildFigmaPage(
  pageTree: TreeNode,
  pageNumber: number,
  platformBridge: PlatformBridge,
  autoLayout: boolean,
): FigmaPage {
  const idGen = new FigmaIdGenerator(pageNumber);
  const backgroundColor =
    pageTree.style && pageTree.style.backgroundColor
      ? toFigmaColor(pageTree.style.backgroundColor)
      : { r: 1, g: 1, b: 1, a: 1 };

  const children = (pageTree.children || [])
    .map((child) => buildFigmaNode(child, { idGen, absX: 0, absY: 0, platformBridge, autoLayout }))
    .filter((child): child is FigmaNode => child !== null);

  return {
    id: `0:${pageNumber}`,
    name: (pageTree.props && pageTree.props.name) || `Page ${pageNumber}`,
    type: 'PAGE',
    scrollBehavior: 'SCROLLS',
    children,
    backgroundColor,
    prototypeStartNodeID: null,
    flowStartingPoints: [],
    prototypeDevice: { type: 'NONE', rotation: 'NONE' },
    exportSettings: [],
  };
}

export type RenderToFigmaJSONOptions = {
  name?: string;
  lastModified?: string;
  version?: string;
  // Emit Figma auto layout on frames. Off by default: Figma auto layout has no
  // per-child margins, so the Yoga-computed absolute positions are used instead.
  autoLayout?: boolean;
};

// Builds the full Figma file-format JSON document (`{ document, components,
// componentSets, schemaVersion, styles, name, lastModified, version, role,
// editorType, linkAccess }`) from a design-app-neutral TreeNode.
//
// Accepts a `<Document>` tree (one page per `<Page>` child), a single
// `<Page>` tree, or a bare `<Artboard>`/`<View>` tree (which gets wrapped in
// an implicit single page), mirroring how `renderToJSON` accepts the same
// shapes for the Sketch backend.
export function buildFigmaDocument(
  tree: TreeNode,
  options: RenderToFigmaJSONOptions = {},
  platformBridge: PlatformBridge = NodeBridge,
): FigmaFile {
  let pageTrees: TreeNode[];

  if (tree.type === 'sketch_document') {
    pageTrees = (tree.children || []).filter((c): c is TreeNode => typeof c !== 'string');
  } else if (tree.type === 'sketch_page') {
    pageTrees = [tree];
  } else {
    pageTrees = [
      {
        type: 'sketch_page',
        style: {},
        layout: {
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          width: tree.layout.width,
          height: tree.layout.height,
        },
        props: { name: 'Page 1', textNodes: [] },
        children: [tree],
      },
    ];
  }

  const pages = pageTrees.map((pageTree, index) =>
    buildFigmaPage(pageTree, index + 1, platformBridge, options.autoLayout === true),
  );

  return {
    document: {
      id: '0:0',
      name: 'Document',
      type: 'DOCUMENT',
      scrollBehavior: 'SCROLLS',
      children: pages,
    },
    components: {},
    componentSets: {},
    schemaVersion: 0,
    styles: {},
    name: options.name || 'Untitled',
    lastModified: options.lastModified || new Date().toISOString(),
    version: options.version || '0',
    role: 'owner',
    editorType: 'figma',
    linkAccess: 'inherit',
  };
}
