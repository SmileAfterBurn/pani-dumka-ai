const WebSocket = require('ws');

const apiKey = process.env.ELEVENLABS_API_KEY;
const voiceId = "XsDwVNgam5laFw4WF7S6";
const wsUrl = `wss://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream-input?model_id=eleven_multilingual_v2&output_format=pcm_24000`;

const ws = new WebSocket(wsUrl, {
  headers: {
    'xi-api-key': apiKey
  }
});

ws.on('open', () => {
  console.log('Connected');
  ws.send(JSON.stringify({ text: " " }));
  setTimeout(() => {
    ws.send(JSON.stringify({ text: "Привіт, як справи? " }));
  }, 100);
  setTimeout(() => {
    ws.send(JSON.stringify({ text: "" }));
  }, 200);
});

ws.on('message', (data) => {
  console.log('Message received');
  const msg = JSON.parse(data.toString());
  if (msg.audio) {
    console.log('Got audio chunk length:', msg.audio.length);
  }
});

ws.on('error', (err) => {
  console.log('Error:', err);
});

ws.on('close', (code, reason) => {
  console.log('Close:', code, reason.toString());
});
