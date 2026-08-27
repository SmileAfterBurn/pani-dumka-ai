const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  /const wsUrl = \`wss:\/\/api\.elevenlabs\.io\/v1\/text-to-speech\/\$\{voiceId\}\/stream-input\?model_id=eleven_flash_v2_5&output_format=pcm_24000\`;/g,
  'const wsUrl = `wss://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream-input?model_id=eleven_flash_v2_5&output_format=pcm_24000&language_code=uk&apply_text_normalization=on&optimize_streaming_latency=0`;'
);

fs.writeFileSync('server.ts', code);
console.log('patched server.ts wsUrl');
