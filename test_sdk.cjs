const { ElevenLabsClient } = require('@elevenlabs/elevenlabs-js');

async function run() {
  const apiKey = "sk_31d301a370c8c6ff93f46da06e58bc1a64cd05afc88f03f4";
  const elevenlabs = new ElevenLabsClient({ apiKey });
  
  console.log(Object.keys(elevenlabs.textToSpeech));
}
run();
