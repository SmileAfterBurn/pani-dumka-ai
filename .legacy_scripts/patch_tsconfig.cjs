const fs = require('fs');
let config = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
config.compilerOptions.esModuleInterop = true;
fs.writeFileSync('tsconfig.json', JSON.stringify(config, null, 2));
console.log('patched tsconfig');
