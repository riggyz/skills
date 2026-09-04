---
name: excalidraw
description: Create, edit, and visually refine Excalidraw architecture diagrams, data flows, state machines, deployment maps, and system sketches. Use whenever the user asks to draw a technical diagram, produce or modify an Excalidraw file, turn architecture into a visual, or improve an existing canvas. Requires a render-and-inspect loop; never deliver diagram JSON without viewing the rendered result.
compatibility: Uses configured Excalidraw MCP tools when available; otherwise requires Node.js and a browser-capable renderer or an Obsidian vault with the Excalidraw plugin.
---

# Excalidraw

Create editable diagrams that communicate clearly. The decisive quality rule is simple: render the diagram, inspect the image, fix what is visibly wrong, and repeat before delivery.

## Choose The Path

1. Prefer configured Excalidraw MCP tools for live-canvas creation, element queries, screenshots, and exports.
2. For an existing `.excalidraw` or `.excalidraw.md` file, import it before editing and preserve stable element IDs where possible.
3. If MCP tools are unavailable, use the local Obsidian Excalidraw plugin for vault diagrams or build a temporary renderer with `@excalidraw/excalidraw`, React, esbuild, and Puppeteer. Do not add renderer dependencies to the user's project unless asked.
4. If no rendering path is available, create the editable artifact but state plainly that visual verification was not possible. Never imply that unrendered JSON was inspected.

The configured MCP is an external runtime dependency, not vendored skill code. Do not copy its package or server implementation into a project.

## Plan Before Drawing

- Name the diagram's single purpose and intended reader.
- Choose the smallest useful view: architecture overview, resource map, data flow, pipeline, state machine, or system boundary.
- Lay out major tiers and zones before creating elements.
- Keep related nodes aligned and reserve clear corridors for arrows.
- Split overloaded diagrams instead of shrinking everything onto one canvas.

Use direct creation when exact placement matters. Use Mermaid conversion only when the source already maps cleanly to a standard flowchart, sequence diagram, or ER diagram; still inspect and refine the converted result.

## Build In Batches

1. Create zones and major nodes first.
2. Render and inspect before adding detailed connections.
3. Add arrows and essential labels in a second batch.
4. Render again and fix routing, spacing, and truncation.
5. Add annotations only when they clarify the visual argument.

Use stable semantic IDs such as `api`, `worker`, and `artifact-store` so later edits do not depend on coordinates.

## Visual Quality Loop

After every meaningful batch:

1. Capture a PNG or SVG screenshot of the actual canvas.
2. Read the rendered image with an image-capable tool.
3. Check text truncation, overlaps, containment, alignment, whitespace, arrow crossings, label collisions, and visual hierarchy.
4. Correct every visible defect.
5. Re-render and inspect the correction.

Do not stop after structural inspection or valid JSON. A syntactically correct scene can still be an unusable diagram.

## Layout Rules

- Start with shapes at least 160 px wide and 60 px tall; expand for long labels.
- Leave at least 40 px between peers and 80-120 px between tiers.
- Use free-standing text near the top edge of large zone rectangles. Bound labels center inside zones and collide with their contents.
- Keep arrow labels short and use them only when the relationship is not already obvious.
- Route long or cross-zone arrows around unrelated nodes with explicit waypoints.
- Use consistent fills and darker matching strokes. Reserve color differences for meaningful categories.
- Keep body text at least 16 px and titles at least 20 px.

## Existing Diagrams

1. Save a snapshot or copy before broad changes.
2. Inspect the scene description and screenshot before editing.
3. Identify elements by stable ID or label, not position.
4. Make the smallest coherent update.
5. Re-render the whole canvas, not only the changed element, because routing and balance can regress elsewhere.

## Artifact Placement

- In a repository, prefer an editable `.excalidraw` file plus an adjacent `.png` preview when both are useful to reviewers.
- In an Obsidian vault, use `.excalidraw.md` so the plugin, backlinks, block references, search, and sync work natively.
- Add a normal Markdown `## Links` section near the top of vault diagrams, outside `# Excalidraw Data`, with path-qualified links to current source notes.
- Link durable vault diagrams from a current owner entry point. An unlinked compressed drawing is search ballast, not useful memory.
- Do not upload or create a share URL unless the user explicitly asks.

## Fallback Render Loop

When no live MCP canvas is available, build the renderer in a temporary directory:

```sh
npm install @excalidraw/excalidraw react react-dom puppeteer esbuild
```

Bundle a small browser entry that exports `exportToSvg` from `@excalidraw/excalidraw`; its ESM distribution has bare React imports and should not be loaded directly in a browser. Serve the bundle over HTTP, append the exported SVG to a page, await `document.fonts.ready`, screenshot the SVG with Puppeteer, and read the PNG. Use small scene helpers for rectangles, text, arrows, nodes, and containers rather than repeatedly hand-writing all Excalidraw element metadata.

## Delivery

Report:

- editable artifact path
- preview path, when produced
- what the diagram communicates
- whether visual inspection passed and how many correction passes were needed
- any remaining limitation that could not be visually verified
