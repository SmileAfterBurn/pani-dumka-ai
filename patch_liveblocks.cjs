const fs = require('fs');
let code = fs.readFileSync('src/liveblocks.config.ts', 'utf8');

code = code.replace(
  /const PUBLIC_KEY = import\.meta\.env\.VITE_LIVEBLOCKS_PUBLIC_KEY \|\| ".*";/,
  'const PUBLIC_KEY = import.meta.env.VITE_LIVEBLOCKS_PUBLIC_KEY || "";'
);

fs.writeFileSync('src/liveblocks.config.ts', code);
console.log('patched liveblocks config');
