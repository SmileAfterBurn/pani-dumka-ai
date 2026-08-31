const fs = require('fs');
let code = fs.readFileSync('.env.example', 'utf8');

if (!code.includes('VITE_LIVEBLOCKS_PUBLIC_KEY')) {
  code += '\n# VITE_LIVEBLOCKS_PUBLIC_KEY: Optional. Public key for Liveblocks real-time features (multiplayer cursors, comments).\n# Get this from https://liveblocks.io\nVITE_LIVEBLOCKS_PUBLIC_KEY=""\n';
  fs.writeFileSync('.env.example', code);
}
