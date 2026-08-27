const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(/function initElevenLabsWs\(\) \{/g, 'const initElevenLabsWs = () => {');
code = code.replace(/function streamTextToElevenLabs\(text: string, isFinal: boolean = false\) \{/g, 'const streamTextToElevenLabs = (text: string, isFinal: boolean = false) => {');
fs.writeFileSync('server.ts', code);
console.log('patched funcs');
