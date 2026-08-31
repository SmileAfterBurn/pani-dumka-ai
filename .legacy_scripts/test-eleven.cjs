const WebSocket = require('ws');

const ws = new WebSocket('wss://api.elevenlabs.io/v1/text-to-speech/XsDwVNgam5laFw4WF7S6/stream-input?model_id=eleven_multilingual_v2&output_format=pcm_24000', {
  headers: {
    'xi-api-key': 'sk_31d301a370c8c6ff93f46da06e58bc1a64cd05afc88f03f4'
  }
});

ws.on('open', () => {
  console.log('Connected!');
  ws.send(JSON.stringify({ text: "Hello " }));
  ws.send(JSON.stringify({ text: "world!" }));
  ws.send(JSON.stringify({ text: "" }));
});

ws.on('message', (data) => {
  const response = JSON.parse(data.toString());
  if (response.audio) {
    console.log('Got audio block of size:', response.audio.length);
  }
  if (response.isFinal) {
    console.log('Final message received');
    ws.close();
  }
});

ws.on('error', (err) => console.error(err));
