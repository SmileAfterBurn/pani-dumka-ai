import fs from 'fs';
async function run() {
  const apiKey = "sk_31d301a370c8c6ff93f46da06e58bc1a64cd05afc88f03f4";
  const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/XsDwVNgam5laFw4WF7S6/stream?output_format=pcm_24000', {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: "Привіт, як справи?",
        model_id: 'eleven_multilingual_v2'
      })
  });
  console.log("Status:", response.status);
  if (!response.ok) {
     console.log(await response.text());
  } else {
     const buf = await response.arrayBuffer();
     console.log("OK, bytes:", buf.byteLength);
     const int16 = new Int16Array(buf);
     console.log("First samples:", int16[0], int16[1], int16[2]);
  }
}
run().catch(console.error);
