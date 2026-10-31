// Builds dist/index.html: the game source with every level (and its best solution) baked in.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const levels = JSON.parse(fs.readFileSync(path.join(root, 'levels/levels.json'), 'utf8'));
const src = fs.readFileSync(path.join(root, 'src/game.html'), 'utf8');
if (!src.includes('/*LEVELS*/[]')) throw new Error('src/game.html is missing the /*LEVELS*/[] placeholder');

fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist/index.html'), src.replace('/*LEVELS*/[]', JSON.stringify(levels)));
console.log(`Built dist/index.html with ${levels.length} levels`);
