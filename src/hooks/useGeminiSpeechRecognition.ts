import { useState, useRef, useCallback } from 'react';

// Helper to convert Float32Array PCM to 16-bit WAV Blob
function encodeWAV(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return new Blob([view], { type: 'audio/wav' });
}

export function useGeminiSpeechRecognition(onResult: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<AudioWorkletNode | null>(null);
  const audioDataRef = useRef<Float32Array[]>([]);

  const toggleListening = useCallback(async () => {
    if (isListening) {
      setIsListening(false);

      // Stop processing and collect audio
      if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current = null;
      }

      if (audioContextRef.current) {
        const sampleRate = audioContextRef.current.sampleRate;
        audioContextRef.current.close();
        audioContextRef.current = null;

        // Flatten collected audio chunks
        let totalLength = 0;
        for (const chunk of audioDataRef.current) {
          totalLength += chunk.length;
        }
        const flattenedData = new Float32Array(totalLength);
        let offset = 0;
        for (const chunk of audioDataRef.current) {
          flattenedData.set(chunk, offset);
          offset += chunk.length;
        }

        // Convert to WAV and send to API
        if (totalLength > 0) {
          const wavBlob = encodeWAV(flattenedData, sampleRate);
          const reader = new FileReader();
          reader.readAsDataURL(wavBlob);
          reader.onloadend = async () => {
            const base64data = (reader.result as string).split(',')[1];
            try {
              const response = await fetch('/api/transcribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ audioBase64: base64data, mimeType: 'audio/wav' })
              });
              const data = await response.json();
              if (data.text) {
                onResult(data.text);
              }
            } catch (error) {
              console.error('Transcription error:', error);
            }
          };
        }
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        audioDataRef.current = [];

        // Initialize Web Audio API AudioContext
        const audioContext = new AudioContext({ sampleRate: 16000 });
        audioContextRef.current = audioContext;

        const workletCode = `
          class RecorderProcessor extends AudioWorkletProcessor {
            process(inputs, outputs, parameters) {
              const input = inputs[0];
              if (input && input.length > 0) {
                const channelData = input[0];
                const dataCopy = new Float32Array(channelData);
                this.port.postMessage(dataCopy);
              }
              return true;
            }
          }
          registerProcessor('recorder-processor', RecorderProcessor);
        `;
        const blob = new Blob([workletCode], { type: 'application/javascript' });
        const blobUrl = URL.createObjectURL(blob);
        await audioContext.audioWorklet.addModule(blobUrl);

        const source = audioContext.createMediaStreamSource(stream);
        const workletNode = new AudioWorkletNode(audioContext, 'recorder-processor');
        processorRef.current = workletNode;

        workletNode.port.onmessage = (e) => {
          audioDataRef.current.push(e.data);
        };

        source.connect(workletNode);
        workletNode.connect(audioContext.destination);

        setIsListening(true);
      } catch (err) {
        console.error('Microphone access denied or error:', err);
      }
    }
  }, [isListening, onResult]);

  return {
    isListening,
    toggleListening,
    isSupported: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
  };
}
