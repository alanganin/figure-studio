# Figure Studio v0.1 — 3D artist poser

A desktop-first, browser-based 3D artist scene editor with multiple independently poseable **stylized prototype mannequins**, props, simple attached outfits, scene save/load, and PNG export.

## Run locally (no Node/npm required)

The easiest route is to upload this folder to GitHub Pages (below). Alternatively serve this folder with Python:

```bash
cd figure-studio
python -m http.server 8000
```

Open `http://localhost:8000` in your browser. (If you have the Python launcher on Windows, use `py -m http.server 8000`.) Opening `index.html` directly as a file may be blocked by module/CORS rules.

**Internet required:** Three.js is loaded from a pinned public jsDelivr CDN. Without an internet connection the 3D app will not initialize. No npm installation is needed.

## GitHub Pages

1. Create a new public repository on GitHub.
2. Upload `index.html`, `styles.css`, and `app.js` to the repository root, then commit.
3. Go to repository **Settings → Pages → Build and deployment**, select **Deploy from a branch**, choose `main`, `/ (root)`, then Save.
4. Open the published URL listed in Pages settings. If you change files later, commit and allow the site to redeploy.

## How to use

- Use **+ Figure** to add unlimited figures, subject to your hardware. The scene file is currently capped at 100 objects to protect accidental oversized imports.
- Click a figure in Scene Explorer, or click a blue joint handle in the viewport to rotate a joint with the rotation rings or inspector sliders.
- Click an object in Scene Explorer to move it with the arrows or edit its position in the inspector.
- Presets operate on the selected figure, and each figure gets its own clothing choices.
- Save Scene downloads JSON; Open Scene restores saved figures, props, camera, and light values.
- Export PNG creates a viewport screenshot without the rotation gizmo and joint markers.

## Known limitations (important)

- This is **an interactive technical prototype**, not yet an anatomy-accurate human model. The mannequins are made from primitives, and joint constraints are editable slider ranges rather than a validated biomechanical solver.
- No inverse kinematics, muscle deformation, collision/contact system, or actual cloth simulation yet. T-shirts and pants are approximated fitted meshes following rigid body segments, and may overlap skin or other clothes.
- Clothing is only an early preview; layering, fit sliders and realistic folds are future work.
- The joint rotation gizmo itself permits rotations outside the slider limits. Natural joint constraints need to be implemented in the next milestone.
- The 3D CDN requires connectivity. Mouse/desktop interaction is recommended for v0.1.
- No cloud service, account, or database; the scene exists in your browser until exported as JSON.

## Next milestones

1. Replace procedural model with properly licensed, rigged GLB/glTF human assets.
2. Implement constrained inverse kinematics and anatomically coordinated shoulder, pelvis and spinal movement.
3. Add per-figure cloth fit, proper mesh skinning and corrective shapes.
4. Contact points, multiple figures interacting with props, collision tests.
5. Mobile/tablet UX and optional offline assets.

## Credits

Built with [Three.js](https://threejs.org/) 0.160.1. Your original project code is separate from Three.js, which is MIT licensed. Keep third-party model assets appropriately licensed when added later.
