# Renderer and synchronization specification

## Scope

Keep headless JSON export and add a live document projection using the same React components, buildTree, Yoga layout, and Figma serialization. Run compilation/layout locally. A persistent plugin receives normalized snapshots and reconciles native nodes. Source-save reload does not imply preservation of React hook state; Fast Refresh is a later independent capability.

## Identities

`sourceId` identifies a declaration; `renderId` identifies an occurrence; native `node.id` identifies a node in one Figma document. Author an explicit durable identity for declarations requiring reverse edits, or maintain compiler-assigned IDs in a committed identity manifest. Never derive durable IDs solely from positions, indexes, labels or content hashes. Existing Loom extractor IDs are positional and are not durable identities.

A renderId combines project identity, render-root identity, component occurrence identity, sourceId, and stable list keys. Repeated component uses and conditional branches must have distinct identities. Compiler-internal wrapper nodes need stable role suffixes. An SVG can create multiple native children: map its semantic renderId to the imported root and represent implementation children separately when needed.

Store versioned provenance on managed native nodes using setPluginData. Keep the plugin manifest ID stable. Include projectId, renderRootId, sourceId, renderId and last applied revision/hash. Use a per-root registry and return renderId → native nodeId acknowledgements. Mapping scope includes a document session/root identity; never assume native IDs are globally unique. A local ignored cache accelerates reconnect but is not authoritative. Keep native IDs out of portable source.

## Hydration and reconciliation

Load managed pages and scan provenance on reconnect. Validate duplicate identities, missing nodes, incompatible types, root ownership and revision state. Duplicate identities require an explicit resolution; never choose a match arbitrarily. Match existing nodes by renderId; apply property diffs, including resetting removed properties. Preserve native IDs for compatible types. Reparent/reorder in place. Replace incompatible types and acknowledge changed native IDs. Remove only obsolete managed nodes. Foreign content is preserved. Expose detach/adopt policies for manual duplication or new nodes; do not automatically assign a copied declaration to source.

Native groups, instance restrictions, SVG replacement and font availability need explicit handling. Normalize REST-shaped export fields into writable Plugin API fields, including text styles/runs, transforms, image bytes and geometry paths. Use existing computed layout initially; native auto layout must be opt-in and tested against Yoga. Do not silently discard unsupported properties or flatten component instances without reporting it.

## Protocol

Production transport: loopback WebSocket via plugin UI, schemaVersion/projectId/rootId/sessionId handshake and per-session token. Snapshot contains monotonic revision, source hash, desired nodes and property provenance. Acknowledgement contains applied revision, mappings, replacements, deletions and diagnostics. Serialize async application, coalesce queued snapshots to latest, reject stale sessions, and acknowledge only successful commits. Reconnect hydrates first. Report partial failures and recover by comparing actual canvas state; Figma mutations are not an atomic database transaction.

The probe uses HTTP polling to avoid adding a WebSocket dependency before validating app launch. It exercises the transport and ID preservation only, not the production protocol or JSON importer.

## Bidirectional edits

Each editable rendered property needs a source binding: declaration literal, component parameter, data field, token reference, or computed/read-only output. Keep a normalized last-synchronized baseline for editable values. Compare baseline, current source and current Figma. Merge disjoint edits, surface same-property conflicts, and never overwrite unsynchronized canvas edits automatically.

Start with literal text and explicit dimensions. Token changes must preserve token semantics. Computed Yoga geometry cannot uniquely recover layout intent; expose overrides/proposals instead. Repeated occurrences can bind to the same declaration: warn about the scope of a declaration change and permit occurrence-level overrides only if the authoring model supports them. AST edits must use the current compiler source map, validate source revision, preserve formatting and recompile before acknowledgement.

Observe document changes while plugin runs. LOCAL/REMOTE describes users, not renderer ownership. Filter renderer echoes using acknowledged revisions and normalized baselines. Do not rely only on a synchronous applying flag around asynchronous mutations. On restart compare actual properties even if no events were observed while disconnected. No arbitrary code execution is accepted from the bridge.

## Initial implementation status

The production-direction WebSocket transport and optional authored identity contract are now implemented in the repository development tool. The single-frame HTTP probe is retained separately. See usage.md for supported node types, one-page projection behavior, source-authoritative updates and validation results. Bidirectional merge/baselines and compiler-generated durable identities are future work.

## Optional native identifiers

Public component props now follow `id` > `nativeID` > legacy `renderId`. They select the logical occurrence identity persisted in plugin data, while Figma continues to assign native node IDs. Anonymous nodes receive positional internal IDs during live export only; ordinary headless exports retain their previous schema. Explicit parent identities anchor anonymous child IDs when the parent moves. This fallback is suitable for ordinary text/style updates, but does not supply durable identity through arbitrary anonymous sibling insertion/reordering. Future reverse edits still need durable source provenance. React keys are not currently retained by the headless JSON pipeline.
