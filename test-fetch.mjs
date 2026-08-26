async function run() {
  const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/XsDwVNgam5laFw4WF7S6/stream?output_format=pcm_24000', {
      method: 'POST',
      headers: {
        'xi-api-key': '0511d45e0fefe95bc459115284ecbfbec0cb3bf8fe9ec7cd50d1edd3445cc6a3',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: "Привіт, як справи?",
        model_id: 'eleven_multilingual_v3'
      })
  });
  console.log("Status:", response.status);
  if (!response.ok) {
     console.log(await response.text());
  }
}
run().catch(console.error);
