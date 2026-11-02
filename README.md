# Figure Studio v0.3.0 — Rigged human edition

This release replaces the procedural mannequin with the MakeHuman-derived human GLB supplied for this project. The default figure is now a continuous skinned human with modeled facial features, hands, fingers, feet and toes. Each figure has its own 163-bone skeleton and skin weights.

The included model is 4,498,248 bytes and contains 109,064 triangles across seven skinned surfaces. It is displayed as a neutral clay sculpture. It is a human base mesh, not an exposed-muscle atlas or a photorealistic scanned person.

## Run locally — no Node, npm or Python required

Open PowerShell in the extracted figure-studio folder:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\Start-Local.ps1
```

Open http://127.0.0.1:8080 in Chrome or Edge. Keep PowerShell open. Press Ctrl+C to stop the server. The execution-policy flag applies to that process only.

The whole folder must be served over HTTP/HTTPS. Double-clicking index.html with a file:// address is unsupported. All dependencies and the human model are bundled locally; there are no runtime CDN requests.

See DEPLOYMENT.md for updating https://alanganin.github.io/figure-studio/.

## What changed

- The original GLB geometry and skin weights replace the spheres, cylinders and boxes used for the mannequin. There is no mannequin fallback.
- Seventeen main pose controls drive the actual body skeleton. The model's remaining bones, including fingers, toes and facial bones, retain their authored pose and follow their parents; this release does not expose individual finger or face controls.
- Joint controls store rotation deltas separately from the model's bind rotations. Resetting a control preserves the human's original bone alignment.
- A-pose resets to the supplied asset's pose, with arms angled out from the body. Other presets, rotation rings, constrained wrist/ankle IK, and Mirror work on each figure independently.
- Tops, pants, shorts and jackets are generated as fitted skinned surface layers using this human's geometry and weights. They share its skeleton and bend with the body. They are tight surface shells, not loose tailored garments or cloth simulation.
- Clicking the skin selects a nearby pose control. Enable Joint handles or use Select joint for precise selection.
- Place feet on ground evaluates the deformed human surface rather than its rest-pose box.
- Save/load, duplication, character and pose files, undo/redo, lighting, cameras, PNG export and props remain available.

## How to use

1. The initial human loads automatically. Use + Figure for another independently posed body; select object rows to move whole figures.
2. Select a joint from the inspector, a visible handle, or the skin. Use the rotation rings or sliders. Joint limits apply to both.
3. Use Reach target with world coordinates in approximate meters. An unreachable target reports remaining distance. Targets are one-shot solves, not pins attached to props.
4. Add garments and adjust colors, ease, sleeve length and approximate body width. Cloth edges follow mesh topology and can look jagged; extreme poses and large ease values can clip or show gaps.
5. Left-drag to orbit, right-drag to pan, wheel to zoom. Switch perspective/orthographic, views, lighting and study surfaces as needed.
6. Save Scene for a portable JSON backup. Character files hold one posed figure and outfit; pose files hold joint deltas. Browser recovery is local to this site address and browser.
7. Export PNG captures the viewport without selection helpers. Transparent export hides the floor and grid. Check the downloaded image in your browser; actual browser PNG downloads were not verified here.

## Compatibility

New scenes use format version 3 and model identifier makehuman-male-v1. The human mesh is bundled once in assets/human-male.glb; scene JSON references that model and does not duplicate its binary data.

Version 1 and 2 scene files still open. Their mannequin rotations are applied to the new human control rig, so proportions and limb placement will differ. Review imported poses, clothing and contact with props. Old pose files likewise need review. Keep original JSON backups.

The human edition uses a new browser recovery key (figure-studio-v3), avoiding silent replacement of your old recovered mannequin session. Open an older saved JSON explicitly to migrate it.

## Limits

This is actual weighted skeletal deformation, not scientific muscle simulation. There are no authored shoulder/elbow corrective shapes, soft-tissue dynamics, automatic balance, collisions, contact locks or physical cloth. Extreme poses can pinch or self-intersect. Joint ranges are artistic approximations rather than biomechanical measurements. Width scales the body and clothing; it is not a MakeHuman morph generator.

The study loader supports this bundled, uncompressed GLB's geometry and skeleton. It intentionally does not implement arbitrary model import, embedded texture rendering, morph targets or animation playback. The muscle study surface is an illustrative tint, not a medical diagram.

The scene file limit remains 100 objects; detailed humans and their garments will reach practical GPU limits much sooner. Desktop Chrome/Edge with WebGL2 is the target. Touch/tablet interaction is not validated.

## Validation

Nineteen integration checks pass using the actual bundled human asset and Three.js geometry/skeleton math. Two independent skeletons, skin deformation, compound control alignment, fitted garment weights, legacy scene loading and scene roundtrip are covered. Software renders of the actual model were inspected in A-pose, bent-arm pose and clothed pose.

Full browser rendering, dialogs and downloaded PNG pixels remain unverified in this environment. See VALIDATION.md and the deployment acceptance checklist.

Optional tests, if Node.js is installed:

```powershell
node .\tests\integration.cjs
```

Node is not needed to run or deploy the app.

## Credits and files

- assets/human-male.glb: MakeHuman-derived body, published by Innerscene under CC0. See assets/README.md for the source and checksum.
- vendor/: Three.js 0.170.0 and controls, MIT. Keep vendor/THREE-LICENSE.txt. Controls have local import paths patched.
- human-glb.js: focused uncompressed GLB study loader.
- human-rig.js: verified mapping and bind-pose-preserving control adapter.
- human-figure.js: independent human instances, skinned fitted clothing and grounding.
- app.js, index.html, styles.css: artist workspace, extended from your recovered v0.1.

Your original local repository has not been changed or pushed. Your application-code licensing remains yours to decide; third-party asset and library terms are recorded with the package.
