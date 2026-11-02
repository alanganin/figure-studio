# Figure Studio v0.3.0 validation

November 2, 2026. Node.js 24.22.1 and bundled Three.js 0.170.0.

## 19 passing integration checks

The checks in tests/integration.cjs execute the application against the actual bundled MakeHuman-derived GLB and real Three.js geometry, bones, inverse bind matrices and skinning math. DOM, WebGLRenderer, browser storage and interactive controls are test doubles.

1. Actual bundled OrbitControls and TransformControls modules import and export constructors.
2. Application import paths exist locally; startup has an error handler.
3. Startup creates the real skinned human with 163 bones and a main surface over 60,000 vertices.
4. Presets change only the intended figure.
5. Elbow hyperextension/non-hinge rotations clamp.
6. Nearby wrist IK reduces endpoint error below 8 cm.
7. An unreachable ankle target remains finite and knee-constrained.
8. Clothing layers and fit remain independent between figures.
9. Scene roundtrip preserves transforms, pose, wardrobe, props, camera and settings.
10. Malformed scene input is rejected before clearing the current scene.
11. Version 1 scene migration supplies defaults.
12. Undo/redo restores scene states.
13. Orthographic switching preserves camera position.
14. PNG handler restores scene visibility after capture.
15. Moving the elbow deforms actual weighted forearm vertices.
16. Actual wrist bone and its control remain aligned within 1 mm after compound chest/shoulder/elbow rotations.
17. Separate figures own separate skeletons and bones.
18. Generated garments are skinned to the figure's human skeleton.
19. Grounding evaluates the posed surface and places its lowest point at ground height.

At the initial pose, sampled skin positions agree with the supplied bind geometry within 0.002 mm. The verified rig map is root→pelvis, spine04→spine, spine02→chest, neck01→neck, head→head, upperarm01→shoulder, lowerarm01→elbow, wrist→wrist, upperleg01→hip, lowerleg01→knee and foot→ankle for each side. MakeHuman's spine numbering is reversed relative to many generic skeletons, so this is an asset-specific verified mapping.

## Visual inspection

The actual model was rendered with an independent software rasterizer using the same parsing, rigging and Three.js skinning modules. A-pose, bent-arm pose and clothed bent-arm pose renders were inspected. They show a continuous human with face, hands, fingers, feet and toes. Garment layers follow the deformed body. Clothing boundaries are triangulated/tight shells and may show seams or clipping; no loose-cloth or corrective-deformation claim is made.

These renders verify asset appearance and deformation outside a browser. They are not browser screenshots and do not validate WebGL behavior.

## Remaining browser acceptance checks

Browser/GPU rendering, interactive rotation-ring drags, file dialogs, saved browser downloads and transparent PNG pixels remain unverified. The prior embedded preview connection timed out; desktop browser automation was stopped by URL verification. This release does not claim those checks passed.

Follow DEPLOYMENT.md after replacing all project files, including the new assets folder and human modules. Verify the header says v0.3.0 and the human appears on first load. Check the browser Network panel for a successful human-male.glb response if loading fails.

The supplied local server was syntax-checked after adding the GLB MIME type. The previous static server page/module response check passed in v0.2; no new live HTTP/browser check is claimed for v0.3.0.
