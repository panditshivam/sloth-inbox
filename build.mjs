import { mkdir, copyFile, access } from 'node:fs/promises';
const files = ['index.html','style.css','app.mjs','core.mjs','model-worker.mjs','model-config.mjs','demo.png','LICENSE'];
await Promise.all(files.map(file => access(file)));
await mkdir('dist', { recursive: true });
await Promise.all(files.map(file => copyFile(file, `dist/${file}`)));
console.log(`Built ${files.length} public static files in dist/.`);
