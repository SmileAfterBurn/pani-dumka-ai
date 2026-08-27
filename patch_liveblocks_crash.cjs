const fs = require('fs');
let code = fs.readFileSync('src/liveblocks.config.ts', 'utf8');

code = code.replace(
  /const PUBLIC_KEY = import\.meta\.env\.VITE_LIVEBLOCKS_PUBLIC_KEY \|\| "";\nexport const hasLiveblocksKey = PUBLIC_KEY\.startsWith\("pk_"\);/,
  `const PUBLIC_KEY = import.meta.env.VITE_LIVEBLOCKS_PUBLIC_KEY || "";
export const hasLiveblocksKey = PUBLIC_KEY.startsWith("pk_");
const safePublicKey = hasLiveblocksKey ? PUBLIC_KEY : "pk_dummy_key_to_prevent_crash_1234567890";`
);

code = code.replace(
  /publicApiKey: PUBLIC_KEY,/,
  'publicApiKey: safePublicKey,'
);

fs.writeFileSync('src/liveblocks.config.ts', code);
console.log('patched liveblocks crash');
