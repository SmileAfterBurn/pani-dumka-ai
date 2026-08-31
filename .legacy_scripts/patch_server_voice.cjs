const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Inside wss.on("connection", ...) we have:
// const token = url.searchParams.get("token");
code = code.replace(
  /const token = url\.searchParams\.get\("token"\);/,
  'const token = url.searchParams.get("token");\n    const reqVoiceId = url.searchParams.get("voiceId");'
);

// We find: const voiceId = process.env.ELEVENLABS_VOICE_ID || "XsDwVNgam5laFw4WF7S6";
code = code.replace(
  /const voiceId = process\.env\.ELEVENLABS_VOICE_ID \|\| "XsDwVNgam5laFw4WF7S6";/,
  'const voiceId = reqVoiceId || process.env.ELEVENLABS_VOICE_ID || "XsDwVNgam5laFw4WF7S6";'
);

fs.writeFileSync('server.ts', code);
console.log('patched server voice');
