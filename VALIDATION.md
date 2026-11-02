# Validation report

Tested on November 2, 2026. Node.js 24.22.1; bundled Three.js 0.170.0.

## Automated integration checks: 12 passed

1. Application startup creates a figure.
2. Posing a second figure leaves the first pose unchanged.
3. Elbow hyperextension and non-hinge axes clamp.
4. Wrist IK reduces error and reaches a nearby target within 8 cm.
5. Unreachable ankle target remains finite with constrained knee bend.
6. Clothing layers and fit remain independent per figure.
7. Scene roundtrip preserves pose, wardrobe, props, lighting and camera state.
8. Malformed scene input is rejected before clearing the current scene.
9. v0.1 scenes migrate with default values for added fields.
10. Undo and redo restore object counts and scene state.
11. Orthographic camera switching preserves camera position.
12. PNG handler restores scene visibility after export.

The harness runs the actual application against real Three.js scene objects and math. It replaces the DOM, renderer, browser storage, and controls with test doubles. It does **not** verify rotation-ring interaction, GPU rendering, pixel appearance, browser downloads, dialogs, file selection, or PNG alpha pixels.

To rerun with optional Node.js installed, from this folder:

```powershell
node .\tests\integration.cjs
```

Syntax checking also passed for app.js. All runtime JavaScript imports resolve to local vendor files.

## Browser verification still required

The embedded browser could not reach the local preview server. Native browser automation stopped because it could not establish the browser URL for policy enforcement. No visual QA or successful live browser load is claimed. Follow the deployment acceptance checklist in DEPLOYMENT.md before relying on the app.

The localhost HTTP server itself and its JavaScript MIME response were checked independently of the browser. This verifies file serving, not rendering.
