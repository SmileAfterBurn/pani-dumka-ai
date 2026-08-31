const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const replacement = `elevenLabsWs?.send(JSON.stringify({ 
            text: " ",
            voice_settings: {
              stability: 0.0,
              similarity_boost: 1.0,
              style: 0.0,
              use_speaker_boost: true
            }
          }));`;

code = code.replace(
  /elevenLabsWs\?\.send\(JSON\.stringify\(\{ text: " " \}\)\);/g,
  replacement
);

fs.writeFileSync('server.ts', code);
console.log('patched WS settings');
