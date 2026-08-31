const fs = require('fs');
let code = fs.readFileSync('src/services/elevenlabs.ts', 'utf8');

const newBody = `body: JSON.stringify({
      text,
      model_id: "eleven_flash_v2_5",
      language_code: "uk",
      apply_text_normalization: "on",
      voice_settings: {
        stability: 0.0,
        similarity_boost: 1.0,
        style: 0.0,
        use_speaker_boost: true,
      }
    }),`;

code = code.replace(/body: JSON\.stringify\(\{\s+text,\s+model_id: "eleven_flash_v2_5",\s+voice_settings: \{\s+stability: 0\.0,\s+similarity_boost: 1\.0,\s+style: 0\.0,\s+use_speaker_boost: true,\s+\}\s+\}\),/g, newBody);

fs.writeFileSync('src/services/elevenlabs.ts', code);
console.log('patched elevenlabs service');
