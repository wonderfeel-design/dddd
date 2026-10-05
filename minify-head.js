const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

const MAX_CHARS = 52000;

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
      compress: { passes: 2 },
      mangle: true,
      format: { comments: false }
    });
    if (minified.error) throw minified.error;
    content = content.split(b.full).join(`<script${b.attrs}>${minified.code}</script>`);
  }

  content = content.replace(/<style([^>]*)>([\s\S]*?)<\/style>/g, (m, attrs, css) => {
    const min = css
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\s+/g, ' ')
      .replace(/\s*([{};,>])\s*/g, '$1')
      .replace(/;}/g, '}')
      .trim();
    return `<style${attrs}>${min}</style>`;
  });

  content = content
    .replace(/<!--(?!\s*\[if)[\s\S]*?-->/g, '')
    .replace(/\n\s*\n+/g, '\n')
    .trim() + '\n';

  content = `<meta name="nx-build" content="${new Date().toISOString().slice(0, 16)}Z">\n` + content;

  if (content.length > MAX_CHARS) {
    console.error(`head.min.html would be ${content.length} chars, over the ${MAX_CHARS} budget ` +
      `(Tilda truncates the HEAD field at ~56,000). Not written. Move code out of head.html.`);
    process.exit(1);
  }

  fs.writeFileSync(out, content, 'utf8');
  console.log(`head.html: ${fs.statSync(file).size} bytes -> head.min.html: ${content.length} chars ` +
    `(${MAX_CHARS - content.length} under budget)`);
})();
