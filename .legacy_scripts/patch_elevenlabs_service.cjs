const fs = require('fs');
let code = fs.readFileSync('src/services/elevenlabs.ts', 'utf8');

code = code.replace(
  /model_id: "eleven_multilingual_v2", \/\/ Підтримує українську мову/g,
  'model_id: "eleven_flash_v2_5",'
);

code = code.replace(
  /voice_settings: \{[\s\S]*?\}/g,
  `voice_settings: {
        stability: 0.0,
        similarity_boost: 1.0,
        style: 0.0,
        use_speaker_boost: true,
      }`
);

fs.writeFileSync('src/services/elevenlabs.ts', code);
console.log('Patched elevenlabs.ts');
