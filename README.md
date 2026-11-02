# Figure Studio v0.2.1 — Reference edition

An expanded version of your recovered v0.1 artist workspace. The static app uses bundled Three.js 0.170.0 and requires no build, npm, account, backend, or CDN. Your original local repository has not been changed.

## Start

Open PowerShell in this folder and run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\Start-Local.ps1
```

Open http://127.0.0.1:8080 in Chrome or Edge. Keep PowerShell open; press Ctrl+C to stop the server. The execution-policy flag applies only to this one process. Alternatively use any static HTTP server. Opening index.html by double-click is unsupported because browser modules require HTTP. No Node.js or Python is needed for the supplied server.

See [DEPLOYMENT.md](DEPLOYMENT.md) for your existing GitHub Pages repository and update commands.

## Workflow

1. Add figures and props with Scene controls. Select an object row to move its root with arrows or position fields. Duplicate preserves its pose and wardrobe.
2. Select a joint from the inspector menu, or enable Joint handles and click one. Drag rotation rings or use the three sliders. Limits apply to both methods. Elbows and knees are hinges.
3. Presets apply to the selected figure only. Use Mirror for bilateral poses. Use Place feet on ground after crouching or changing scale; for sitting, position the root at the stool height instead. There is no automatic seat/contact solver.
4. Reach target solves a hand or ankle toward the entered **world coordinates**, in approximate meters. An unreachable target reports residual distance. You can reach toward a prop or a second figure by entering a point near it; the target is not pinned when the prop moves.
5. Choose top, bottom, jacket, colors, ease, sleeve length, and body build independently per figure. Select Whole figure to move it instead of a joint.
6. Orbit with left drag, pan with right drag, zoom with the wheel. Choose front/side/top or orthographic and adjust the lens. The orthographic view has no perspective convergence.
7. Use clay, muscle study tint, wireframe or silhouette for reference. The 60-second timer supports gesture studies; it does not draw or record strokes.
8. Save Scene downloads portable JSON. Open Scene accepts v0.1 and v0.2 files. Character files store one posed and clothed figure; pose files store joint rotations only.
9. Undo/Redo retains up to 60 completed snapshots, including camera and lighting. Ctrl+Z / Ctrl+Shift+Z work outside text fields. Latest scene recovery uses this browser's local storage. It is not a substitute for JSON backups, and storage differs between localhost and your Pages site.
10. Export PNG produces the viewport at 1× or 2× size, with selection helpers hidden. Transparent export also hides the floor and grid. PNG export is a still image, not a 3D model export.

## Honest capability boundaries

This is a functional reference-workspace release, **not completion of the high-fidelity anatomy and physical simulation milestones**.

| Planned area | Implemented here | Remaining specialist work |
|---|---|---|
| Anatomy | Rounded procedural body volumes, broad proportions, articulated spine/pelvis, joint limits | Realistic continuous human mesh, authored skin weights, shoulder/scapula coordination, hands/fingers and anatomical validation |
| IK | Constrained iterative wrist/ankle reach on each independent rig | Whole-body balance, collision, contact locks, pole-vector controls and retargeting |
| Muscle | Illustrative surface tint and small biceps volume change with elbow flexion | Anatomical muscle simulation, tendons, fat, corrective deformation and scientific accuracy |
| Wardrobe | Tops, shorts/pants, jacket, per-figure colors, ease, sleeve length, layering | Continuous skinned cloth, collision, sewing patterns, fabric dynamics and convincing wrinkles |
| Scene | Multiple figures, independent pose/wardrobe, props, stool, root transforms, duplication | Automatic interaction/contact and collision prevention |
| Artist tools | Camera views, orthographic/perspective, key/ambient lighting, grid, study timer, PNG | Drawing canvas, animation timeline and arbitrary model import |
| Projects | JSON scenes, legacy load, character/pose files, 60-step history, local recovery | Cloud sync, collaboration and full file-version migration tooling |

The body is built from overlapping articulated volumes, not a continuous skinned human. It may show seams and intersections in extreme poses. Joint limits are conservative artistic approximations, not clinical measurements. Clothing shells follow rigid body segments and can clip or separate at joints. Build adjusts width/depth; it does not regenerate anatomy. The muscle tint is not an anatomical atlas.

No third-party human model was bundled: a redistributable, correctly rigged and tested anatomical model was not available in the recovered project. The app does not pretend arbitrary GLBs can be posed with this rig. MakeHuman/MPFB core assets are a possible CC0 production source, but each eventual asset must be checked and rigged for this app before inclusion. See [MakeHuman licensing](https://www.makehumancommunity.org/about/license.html).

## Validation and limits

See [VALIDATION.md](VALIDATION.md). Fourteen integration checks pass using real Three.js geometry, transforms and quaternions with a mocked browser surface. Actual WebGL rendering, visual appearance, browser file dialogs and downloaded PNG transparency were not verified in this environment. The preview connection timed out and desktop browser automation was blocked by URL verification.

Desktop Chrome/Edge with WebGL2 is the intended target. The UI stacks below 730px, but touch/tablet behavior has not been tested. Scene files are capped at 100 objects and 2 MB; practical performance will be lower on small GPUs. No cloud requests or telemetry are made by the app. All runtime dependencies are in vendor/.

## Files and credits

- index.html, styles.css, app.js: application, extended from your recovered local v0.1.
- vendor/: Three.js core and controls, MIT license in vendor/THREE-LICENSE.txt.
- Start-Local.ps1: optional PowerShell-only loopback HTTP server.
- tests/integration.cjs: optional Node.js integration tests; Node is not needed to run or deploy the app.
- .nojekyll: static Pages deployment marker.

No third-party character, clothing, texture or image assets are included. Your project's application licensing remains yours to decide; the bundled Three.js license must be retained.

## v0.2.1 startup fix

Corrected the control-module paths that prevented v0.2 from starting. Control imports now use explicit local file paths instead of an import map. Module-load failures display an error in the workspace. Regression checks now import the actual bundled control modules and check every app import path. The two vendor controls have their import specifier changed to the adjacent Three.js module; their license is unchanged.

