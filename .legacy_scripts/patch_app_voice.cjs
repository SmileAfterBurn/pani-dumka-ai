const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add voiceId state
code = code.replace(
  /const \[voiceSpeed, setVoiceSpeed\] = useState\(1\.0\);/,
  'const [voiceSpeed, setVoiceSpeed] = useState(1.0);\n  const [voiceId, setVoiceId] = useState("XsDwVNgam5laFw4WF7S6"); // Default ElevenLabs voice'
);

// 2. Pass voiceId to useLiveConversation
code = code.replace(
  /\} = useLiveConversation\(\);/,
  '} = useLiveConversation(voiceId);'
);

// 3. Pass voiceId to SettingsModal
code = code.replace(
  /voiceSpeed=\{voiceSpeed\}/,
  'voiceSpeed={voiceSpeed}\n        voiceId={voiceId}\n        onVoiceIdChange={setVoiceId}'
);

fs.writeFileSync('src/App.tsx', code);
console.log('patched App.tsx for voiceId');
