// Builds dist/: the game page (with every level and its best solution baked in),
// wrapped in a full HTML document with install metadata, plus the web-app files
// (manifest, service worker, icons) so the game installs to a home screen and plays offline.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');
const levels = JSON.parse(fs.readFileSync(path.join(root, 'levels/levels.json'), 'utf8'));
const src = fs.readFileSync(path.join(root, 'src/game.html'), 'utf8');
if (!src.includes('/*LEVELS*/[]')) throw new Error('src/game.html is missing the /*LEVELS*/[] placeholder');

const game = src.replace('/*LEVELS*/[]', JSON.stringify(levels));

// src/game.html is written as an artifact page (no <html>/<head>), so the
// title, font links and style live at its top. Head-only tags go in <head>, the rest in <body>.
const lines = game.split('\n');
const headEnd = lines.findIndex(l => l.startsWith('</style>'));
if (headEnd < 0) throw new Error('could not find the end of the first <style> block');
const head = lines.slice(0, headEnd + 1).filter(l => !l.includes('claude:viewport-fit-sides')).join('\n');
const body = lines.slice(headEnd + 1).join('\n');

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">
<meta name="theme-color" content="#0b2824">
<meta name="description" content="Ringlock: a turn-based marble puzzle. Spin the brass turntable, fill the tubes, beat par.">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Ringlock">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" href="icons/favicon.png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<style>
*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body { margin: 0; padding: env(safe-area-inset-top, 0px) 0 env(safe-area-inset-bottom, 0px); overscroll-behavior: none; -webkit-tap-highlight-color: transparent; }
[hidden] { display: none !important; }
</style>
${head}
</head>
<body>
${body}
</body>
</html>
`;

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(path.join(dist, 'icons'), { recursive: true });
fs.writeFileSync(path.join(dist, 'index.html'), html);
fs.copyFileSync(path.join(root, 'src/manifest.webmanifest'), path.join(dist, 'manifest.webmanifest'));
const icons = fs.readdirSync(path.join(root, 'src/icons')).filter(f => f.endsWith('.png'));
for (const f of icons) fs.copyFileSync(path.join(root, 'src/icons', f), path.join(dist, 'icons', f));

// Version the offline cache by the content of everything it stores.
const hash = crypto.createHash('sha256').update(html).update(fs.readFileSync(path.join(root, 'src/manifest.webmanifest')));
for (const f of icons) hash.update(fs.readFileSync(path.join(root, 'src/icons', f)));
const version = hash.digest('hex').slice(0, 10);
fs.writeFileSync(path.join(dist, 'sw.js'), fs.readFileSync(path.join(root, 'src/sw.js'), 'utf8').replaceAll('__VERSION__', version));

// Artifact copy: the plain page as before, for claude.ai previews.
fs.writeFileSync(path.join(dist, 'artifact.html'), game);

console.log(`Built dist/ with ${levels.length} levels (cache ${version})`);
