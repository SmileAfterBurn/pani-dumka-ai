const fs = require('fs');
let code = fs.readFileSync('.env.example', 'utf8');

if (!code.includes('ELEVENLABS_VOICE_ID')) {
  code += '\n# ELEVENLABS_VOICE_ID: Optional. ID of the custom voice to use in ElevenLabs\nELEVENLABS_VOICE_ID=""\n';
  fs.writeFileSync('.env.example', code);
}
