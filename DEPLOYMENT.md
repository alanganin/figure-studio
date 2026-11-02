# Update your GitHub Pages site from PowerShell

Your repository is https://github.com/alanganin/figure-studio and its default branch is main. The public repository API reports Pages enabled. Your current local repository's origin matches this URL.

Expected site after deployment: https://alanganin.github.io/figure-studio/

This package has **not been pushed** to GitHub. The following steps publish it when you run them. No npm, Node.js or Python is required.

## Recommended: publish from a fresh checkout

Extract figure-studio-v0.2.zip first. Keep the whole extracted figure-studio folder, including vendor and .nojekyll. In PowerShell, set the package path to the extracted folder that contains index.html:

```powershell
$packagePath = 'C:\PATH\TO\EXTRACTED\figure-studio'
Test-Path (Join-Path $packagePath 'index.html')
```

The result must be True. Then clone into a new, unused folder so your existing v0.1 working directory stays available:

```powershell
$checkoutPath = Join-Path $env:USERPROFILE 'Documents\figure-studio-v02-publish'
git clone https://github.com/alanganin/figure-studio.git $checkoutPath
if ($LASTEXITCODE -ne 0) { throw 'Clone failed; stop here.' }
Get-ChildItem -LiteralPath $packagePath -Force | Copy-Item -Destination $checkoutPath -Recurse -Force
Set-Location -LiteralPath $checkoutPath
git status --short
git diff --stat
```

Review the changed files. The folder contains no Git metadata and copying it retains the checkout's .git connection. Then commit and publish:

```powershell
git add --all
git commit -m "Expand Figure Studio with constrained IK and reference tools"
if ($LASTEXITCODE -ne 0) { throw 'Commit failed or nothing changed; inspect the output.' }
git push origin main
```

Complete GitHub sign-in yourself if prompted. Never paste a password or token into chat. If the remote rejects the push because it has newer commits, stop and inspect the difference; do not force-push.

## Pages configuration

In repository Settings → Pages, choose **Deploy from a branch**, **main**, and **/ (root)**. Preserve this setup if it is already selected. GitHub supports deploying from a branch root; see [official Pages instructions](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

Check the repository Actions tab and Pages deployment status, then open https://alanganin.github.io/figure-studio/ and hard refresh with Ctrl+Shift+R. All imports are relative, so the /figure-studio/ subdirectory is supported. There is no build step and no CDN requirement.

## Deployment acceptance checks

- The header reads v0.2 · Reference edition and the 3D view shows a figure.
- Add a second figure; pose it and verify the first stays unchanged.
- Select an elbow; positive bend/hyperextension should be clamped. Try both sliders and rotation rings.
- Solve a wrist target near the body. An unreachable target should report a remaining distance instead of breaking the rig.
- Add top, pants and jacket; change fit and color on one figure only.
- Add a stool, move/scale it, switch camera views and lighting.
- Save JSON, refresh, open the saved JSON and compare poses/wardrobe/scene settings.
- Try Undo/Redo and a v0.1 saved scene. Keep a separate original file when migrating.
- Export an ordinary PNG and transparent 2× PNG. Open both files and inspect transparency and dimensions.
- Resize the window and check the orthographic view still has correct proportions.

If the view is blank, check the browser console and Network panel: vendor/three.module.js and both control modules must return 200, not HTML or a 404. Confirm vendor was committed. A file:// address will not work. A browser without WebGL2 will not run the renderer. Advanced anatomy and cloth limitations are documented in README.md.

## Roll back

From the publish checkout, locate the update commit using git log --oneline. To reverse only that commit through normal history, use git revert followed by git push:

```powershell
git log --oneline -5
# Replace UPDATE_COMMIT_SHA with the update's actual commit ID.
git revert UPDATE_COMMIT_SHA
git push origin main
```

Keep your downloaded JSON scene backups. Browser storage is local to the browser and website address.
