async function run() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/XsDwVNgam5laFw4WF7S6/stream?output_format=pcm_24000', {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: "Привіт, як справи?",
        model_id: 'eleven_multilingual_v3'
      })
  });
  console.log("Status:", response.status);
  const text = await response.text();
  console.log("Body:", text);
}
run().catch(console.error);
