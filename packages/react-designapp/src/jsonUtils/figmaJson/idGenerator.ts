// Generates Figma-style node ids: `${pageNumber}:${counter}`, with the
// counter starting at 2 (matching real Figma files, where `0:0` is the
// document and `0:1` the first page, so the first node of page 1 is `1:2`).
//
// NOTE: the Figma plugin API does not let a plugin assign custom ids when
// creating new nodes (`figma.createFrame()` etc. always mint their own
// ids) -- these generated ids are purely part of this JSON document's own
// addressing scheme. They're still useful: a consuming plugin can map them
// to the real Figma node ids it creates, and keep that mapping around to
// support incremental/diff-based updates against an existing Figma
// file/page/frame. Live updates use explicit renderId provenance instead
// of these traversal-dependent serialization IDs.
export class FigmaIdGenerator {
  private counter = 2;

  constructor(private readonly pageNumber: number) {}

  next(): string {
    const id = `${this.pageNumber}:${this.counter}`;
    this.counter += 1;
    return id;
  }
}
