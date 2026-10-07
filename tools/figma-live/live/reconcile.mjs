export const META = 'react-designapp:live';
export const ROOT = 'react-designapp:root';
const SVG_CHILD = 'react-designapp:svg-child';
const identity = (node) => {
  const value = node.getPluginData(META);
  return value ? JSON.parse(value) : null;
};
const hash = (value) => {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) h = Math.imul(h ^ value.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16);
};

export async function reconcile(figma, snapshot) {
  const { projectId, rootId, file } = snapshot;
  if (
    snapshot.schemaVersion !== 1 ||
    !projectId ||
    !rootId ||
    file?.document?.children?.length !== 1
  )
    throw Error('Invalid live snapshot');
  const scope = JSON.stringify([projectId, rootId]);
  const desired = new Map();
  function validate(d) {
    if (!d.renderId || desired.has(d.renderId))
      throw Error(`Missing/duplicate renderId: ${d.renderId || d.name}`);
    if (!['FRAME', 'RECTANGLE', 'TEXT', 'VECTOR'].includes(d.type))
      throw Error(`Unsupported node type ${d.type}`);
    if (d.type === 'FRAME' && d.layoutMode !== 'NONE')
      throw Error('Native auto layout is not supported yet');
    if (!Number.isFinite(d.width) || !Number.isFinite(d.height) || d.width < 0 || d.height < 0)
      throw Error(`Invalid size: ${d.renderId}`);
    if (d.type === 'VECTOR' && !d.svg) throw Error(`Missing SVG: ${d.renderId}`);
    desired.set(d.renderId, d);
    (d.children || []).forEach(validate);
  }
  file.document.children[0].children.forEach(validate);
  await figma.loadAllPagesAsync();
  const roots = figma.root.findAll((n) => n.getPluginData(ROOT) === scope);
  if (roots.length > 1) throw Error('Duplicate live roots');
  let root = roots[0];
  if (root && root.type !== 'FRAME') throw Error('Incompatible live root');
  const existing = new Map();
  if (root)
    for (const n of root.findAll((n) => !!n.getPluginData(META))) {
      const meta = identity(n);
      if (meta.scope !== scope) continue;
      if (existing.has(meta.renderId)) throw Error(`Duplicate native identity: ${meta.renderId}`);
      existing.set(meta.renderId, n);
    }
  const diagnostics = [];
  const fonts = await figma.listAvailableFontsAsync();
  const resolved = new Map();
  async function font(style) {
    const key = JSON.stringify([style.fontFamily, style.fontWeight, style.italic]);
    if (resolved.has(key)) return resolved.get(key);
    const weight = style.fontWeight || 400;
    const names =
      weight >= 700
        ? ['Bold']
        : weight >= 600
        ? ['Semi Bold', 'SemiBold']
        : weight >= 500
        ? ['Medium']
        : weight <= 300
        ? ['Light']
        : ['Regular', 'Normal', 'Book'];
    const preferred = style.italic
      ? names.map((n) => (n === 'Regular' ? 'Italic' : n + ' Italic'))
      : names;
    let found = fonts.find(
      (f) => f.fontName.family === style.fontFamily && preferred.includes(f.fontName.style),
    );
    if (!found) {
      found = fonts.find((f) => f.fontName.family === 'Inter' && f.fontName.style === 'Regular');
      diagnostics.push(`Font fallback: ${style.fontFamily} ${weight} → Inter Regular`);
    }
    if (!found) throw Error('Requested font unavailable and Inter Regular fallback missing');
    await figma.loadFontAsync(found.fontName);
    resolved.set(key, found.fontName);
    return found.fontName;
  }
  // Load all desired fonts before changing the canvas.
  for (const d of desired.values())
    if (d.type === 'TEXT') {
      await font(d.style);
      for (const override of Object.values(d.styleOverrideTable || {}))
        await font({ ...d.style, ...override });
    }
  if (!root) {
    root = figma.createFrame();
    root.name = `Live: ${rootId}`;
    root.fills = [];
    root.clipsContent = false;
    root.resize(1, 1);
    root.setPluginData(ROOT, scope);
  }
  const mappings = {},
    created = [],
    replaced = [],
    deleted = [];
  const paint = (paints) =>
    (paints || []).map((p) => {
      if (p.type === 'SOLID')
        return {
          type: 'SOLID',
          color: { r: p.color.r, g: p.color.g, b: p.color.b },
          opacity: p.color.a ?? 1,
          blendMode: p.blendMode || 'NORMAL',
        };
      if (p.type === 'IMAGE' && p.imageData) {
        const bytes = figma.base64Decode(p.imageData.replace(/^data:[^;]+;base64,/, ''));
        return {
          type: 'IMAGE',
          imageHash: figma.createImage(bytes).hash,
          scaleMode: p.scaleMode || 'FILL',
        };
      }
      throw Error(`Unsupported paint: ${p.type}`);
    });
  function moveForeign(child) {
    const absolute = child.absoluteTransform;
    root.appendChild(child);
    if (absolute) {
      const t = root.absoluteTransform,
        det = t[0][0] * t[1][1] - t[0][1] * t[1][0];
      if (det) {
        const inv = [
          [t[1][1] / det, -t[0][1] / det, 0],
          [-t[1][0] / det, t[0][0] / det, 0],
        ];
        inv[0][2] = -(inv[0][0] * t[0][2] + inv[0][1] * t[1][2]);
        inv[1][2] = -(inv[1][0] * t[0][2] + inv[1][1] * t[1][2]);
        child.relativeTransform = inv.map((row) => [
          row[0] * absolute[0][0] + row[1] * absolute[1][0],
          row[0] * absolute[0][1] + row[1] * absolute[1][1],
          row[0] * absolute[0][2] + row[1] * absolute[1][2] + row[2],
        ]);
      }
    }
  }
  function preserveForeign(node) {
    if (!node.children) return;
    for (const child of [...node.children]) {
      const meta = identity(child);
      if ((!meta || meta.scope !== scope) && child.getPluginData(SVG_CHILD) !== scope)
        moveForeign(child);
      else preserveForeign(child);
    }
  }

  async function apply(d, parent, index) {
    let node = existing.get(d.renderId);
    if (node?.removed) node = null;
    const svgHash = d.type === 'VECTOR' ? hash(d.svg) : null;
    const expected = d.type === 'VECTOR' ? 'FRAME' : d.type;
    if (
      node &&
      (node.type !== expected ||
        identity(node).type !== d.type ||
        (svgHash && identity(node).svgHash !== svgHash))
    ) {
      preserveForeign(node);
      node.remove();
      replaced.push(d.renderId);
      node = null;
    }
    if (!node) {
      node =
        d.type === 'VECTOR'
          ? figma.createNodeFromSvg(d.svg)
          : d.type === 'TEXT'
          ? figma.createText()
          : d.type === 'RECTANGLE'
          ? figma.createRectangle()
          : figma.createFrame();
      created.push(d.renderId);
      if (d.type === 'VECTOR')
        for (const child of node.findAll(() => true)) child.setPluginData(SVG_CHILD, scope);
    }
    // Tag immediately so partial failures can be recovered on reconnect.
    node.setPluginData(
      META,
      JSON.stringify({
        scope,
        renderId: d.renderId,
        sourceId: d.sourceId || null,
        type: d.type,
        svgHash,
      }),
    );
    parent.insertChild(index, node);
    node.name = d.name;
    if (d.type === 'TEXT') {
      if (node.characters.length)
        for (const f of node.getRangeAllFontNames(0, node.characters.length))
          await figma.loadFontAsync(f);
      node.fontName = await font(d.style);
      node.characters = d.characters;
      node.fontSize = d.style.fontSize;
      node.textAlignHorizontal = d.style.textAlignHorizontal;
      node.textAlignVertical = d.style.textAlignVertical;
      node.letterSpacing = { unit: 'PIXELS', value: d.style.letterSpacing || 0 };
      node.lineHeight = { unit: 'PIXELS', value: d.style.lineHeightPx };
      node.textAutoResize = 'NONE';
      const keys = d.characterStyleOverrides || [];
      for (let start = 0; start < keys.length; ) {
        let end = start + 1;
        while (end < keys.length && keys[end] === keys[start]) end++;
        const o = d.styleOverrideTable[keys[start]];
        if (o) {
          const style = { ...d.style, ...o };
          node.setRangeFontName(start, end, await font(style));
          node.setRangeFontSize(start, end, style.fontSize);
          node.setRangeLetterSpacing(start, end, {
            unit: 'PIXELS',
            value: style.letterSpacing || 0,
          });
          node.setRangeLineHeight(start, end, { unit: 'PIXELS', value: style.lineHeightPx });
        }
        start = end;
      }
    }
    if (d.type !== 'VECTOR') {
      node.fills = paint(d.fills);
      node.strokes = paint(d.strokes);
      node.strokeWeight = d.strokeWeight || 0;
      node.strokeAlign = d.strokeAlign || 'INSIDE';
      node.effects = d.effects || [];
      if (d.type === 'TEXT') {
        const keys = d.characterStyleOverrides || [];
        for (let start = 0; start < keys.length; ) {
          let end = start + 1;
          while (end < keys.length && keys[end] === keys[start]) end++;
          const o = d.styleOverrideTable[keys[start]];
          if (o?.fills) node.setRangeFills(start, end, paint(o.fills));
          start = end;
        }
      }
      if (d.type !== 'TEXT') node.cornerRadius = d.cornerRadius || 0;
    }
    node.resize(Math.max(d.width, 0.01), Math.max(d.height, 0.01));
    node.x = d.x;
    node.y = d.y;
    if (d.type === 'FRAME') {
      node.layoutMode = 'NONE';
      node.clipsContent = !!d.clipsContent;
      for (let i = 0; i < d.children.length; i++) await apply(d.children[i], node, i);
    }
    mappings[d.renderId] = node.id;
  }
  for (let i = 0; i < file.document.children[0].children.length; i++)
    await apply(file.document.children[0].children[i], root, i);
  for (const [id, node] of existing)
    if (!desired.has(id) && !node.removed) {
      preserveForeign(node);
      node.remove();
      deleted.push(id);
    }
  figma.commitUndo();
  return {
    type: 'applied',
    revision: snapshot.revision,
    sessionId: snapshot.sessionId,
    rootNodeId: root.id,
    mappings,
    created,
    replaced,
    deleted,
    diagnostics,
    readback: root
      .findAll((n) => !!n.getPluginData(META))
      .map((n) => ({
        renderId: identity(n).renderId,
        id: n.id,
        type: n.type,
        name: n.name,
        width: n.width,
        height: n.height,
        x: n.x,
        y: n.y,
        characters: n.type === 'TEXT' ? n.characters : undefined,
        textRuns:
          n.type === 'TEXT'
            ? n.getStyledTextSegments(['fontName', 'fontSize', 'fills'])
            : undefined,
        imageHash:
          n.type !== 'TEXT' && Array.isArray(n.fills)
            ? n.fills.find((p) => p.type === 'IMAGE')?.imageHash
            : undefined,
        parentId: n.parent.id,
      })),
  };
}
