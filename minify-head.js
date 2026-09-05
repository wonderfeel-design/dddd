/* Regenerates head.min.html from head.html.
   Usage: npm install terser --no-save && node minify-head.js
   Run this after every edit to head.html, commit both files together.
   Tilda's code-injection field silently truncates head.html once it grows
   too large — publish head.min.html instead, never head.html directly. */
const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

(async () => {
  const file = path.join(__dirname, 'head.html');
  const out = path.join(__dirname, 'head.min.html');
  let content = fs.readFileSync(file, 'utf8');

  const re = /<script([^>]*)>([\s\S]*?)<\/script>/g;
  const blocks = [];
  let match;
  while ((match = re.exec(content)) !== null) {
    if (/\bsrc\s*=/.test(match[1])) continue;
    if (!match[2].trim()) continue;
    blocks.push({ full: match[0], attrs: match[1], body: match[2] });
  }

  for (const b of blocks) {
    const minified = await minify(b.body, {
      compress: { passes: 1 },
      mangle: false,
      format: { comments: false }
    });
    if (minified.error) throw minified.error;
    content = content.split(b.full).join(`<script${b.attrs}>${minified.code}</script>`);
  }

  fs.writeFileSync(out, content, 'utf8');
  console.log(`head.html: ${fs.statSync(file).size} bytes -> head.min.html: ${fs.statSync(out).size} bytes`);
})();
