const fs = require('fs');
let code = fs.readFileSync('src/services/gemini.ts', 'utf8');

// Ensure firebase auth is imported
if (!code.includes('import { auth } from "./firebase";')) {
  code = 'import { auth } from "./firebase";\n' + code;
}

code = code.replace(
  'body: JSON.stringify({',
  'body: JSON.stringify({\n      userEmail: auth.currentUser?.email,'
);
fs.writeFileSync('src/services/gemini.ts', code);
console.log('patched');
