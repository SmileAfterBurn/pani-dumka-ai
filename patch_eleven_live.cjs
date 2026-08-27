const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  /const voiceId = "XsDwVNgam5laFw4WF7S6"; \/\/ Дарина Біла/g,
  'const voiceId = process.env.ELEVENLABS_VOICE_ID || "XsDwVNgam5laFw4WF7S6";'
);

code = code.replace(
  /model_id=eleven_multilingual_v2/g,
  'model_id=eleven_flash_v2_5'
);

fs.writeFileSync('server.ts', code);
console.log('patched');
