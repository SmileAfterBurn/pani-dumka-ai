const fs = require('fs');

const content = `import { useState, useEffect, useRef, useCallback } from "react";
import { cachedAccessToken } from '../services/firebase';

export function useLiveConversation() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>("");
  const [activeAgent, setActiveAgent] = useState<{name: string, task: string} | null>(null);
  const [canvasContent, setCanvasContent] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  
  // Reconnection logic refs
  const isIntentionalCloseRef = useRef<boolean>(false);
  const reconnectAttemptRef = useRef<number>(0);
  const maxReconnectAttempts = 5;
  const reconnectTimeoutRef = useRef<number | null>(null);

  // Audio Input Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<AudioWorkletNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const isWorkletRegisteredRef = useRef<boolean>(false);

  // Audio Output Refs
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  // Video Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoIntervalRef = useRef<number | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);

  const stopConversation = useCallback(() => {
    isIntentionalCloseRef.current = true;
    
    if (reconnectTimeoutRef.current) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    reconnectAttemptRef.current = 0;

    // 1. Close WebSocket
    if (wsRef.current) {
      wsRef.current.onclose = null; 
      wsRef.current.onerror = null;
      wsRef.current.close();
      wsRef.current = null;
    }

    // 2. Stop Audio Input Processing
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    // 3. Stop Media Streams (Camera/Mic)
    if (sourceRef.current) {
      sourceRef.current.mediaStream.getTracks().forEach(track => track.stop());
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach(track => track.stop());
        videoStreamRef.current = null;
    }

    // 4. Clear Intervals
    if (videoIntervalRef.current) {
      window.clearInterval(videoIntervalRef.current);
      videoIntervalRef.current = null;
    }

    // 5. Suspend (don't close) AudioContexts to reuse them later
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.suspend();
    }
    if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
      outputAudioContextRef.current.suspend();
    }

    // 6. Reset State
    setIsConnected(false);
    setIsConnecting(false);
    nextStartTimeRef.current = 0;
  }, []);

  const playAudioChunk = useCallback((base64Audio: string) => {
    if (!outputAudioContextRef.current) return;
    
    if (outputAudioContextRef.current.state === 'suspended') {
      outputAudioContextRef.current.resume();
    }

    try {
      const binaryString = atob(base64Audio);
      const len = binaryString.length - (binaryString.length % 2);
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const pcmData = new Int16Array(bytes.buffer);
      
      const audioBuffer = outputAudioContextRef.current.createBuffer(1, pcmData.length, 24000);
      const channelData = audioBuffer.getChannelData(0);
      for (let i = 0; i < pcmData.length; i++) {
        channelData[i] = pcmData[i] / 32768.0;
      }

      const source = outputAudioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(outputAudioContextRef.current.destination);
      
      const currentTime = outputAudioContextRef.current.currentTime;
      if (nextStartTimeRef.current < currentTime) {
        nextStartTimeRef.current = currentTime + 0.05; 
      }
      
      source.start(nextStartTimeRef.current);
      nextStartTimeRef.current += audioBuffer.duration;
    } catch (e) {
      console.error("Audio playback error:", e);
    }
  }, []);

  const connectWs = useCallback(() => {
    if (isIntentionalCloseRef.current) return;
    
    const accessToken = cachedAccessToken;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = \`\${protocol}//\${window.location.host}/live\${accessToken ? \`?token=\${accessToken}\` : ''}\`;
    
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.close();
    }

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);
      reconnectAttemptRef.current = 0;
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.audio) playAudioChunk(msg.audio);
      if (msg.interrupted) nextStartTimeRef.current = 0;
      if (msg.transcript) setTranscript(prev => prev + (prev ? " " : "") + msg.transcript);
      if (msg.toolCall) {
        const functionResponses: any[] = [];
        msg.toolCall.forEach((call: any) => {
          if (call.name === "activate_agent") {
            setActiveAgent({ name: call.args.agent_name, task: call.args.task });
            functionResponses.push({ id: call.id, name: call.name, response: { success: true } });
          } else if (call.name === "update_live_canvas") {
            setCanvasContent(call.args.content);
            functionResponses.push({ id: call.id, name: call.name, response: { success: true } });
          }
        });
        if (functionResponses.length > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ toolResponse: functionResponses }));
        }
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      if (!isIntentionalCloseRef.current) {
        if (reconnectAttemptRef.current < maxReconnectAttempts) {
          setIsConnecting(true);
          const delay = Math.pow(2, reconnectAttemptRef.current) * 1000;
          reconnectAttemptRef.current += 1;
          setError(\`З'єднання втрачено. Повторна спроба через \${delay/1000}с...\`);
          
          reconnectTimeoutRef.current = window.setTimeout(() => {
            connectWs();
          }, delay);
        } else {
          setError("Не вдалося відновити з'єднання після кількох спроб. Будь ласка, спробуйте пізніше.");
          stopConversation();
        }
      }
    };

    ws.onerror = (err) => {
      console.error("Live API WebSocket Error:", err);
      // Don't stop conversation here; let onclose trigger the reconnect
    };
  }, [playAudioChunk, stopConversation]);

  const startConversation = useCallback(async (customInstruction?: string, useScreenShare = false) => {
    isIntentionalCloseRef.current = false;
    setIsConnecting(true);
    setError(null);
    setTranscript("");
    reconnectAttemptRef.current = 0;

    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      let videoStream: MediaStream | null = null;
      
      if (useScreenShare) {
        try {
          videoStream = await navigator.mediaDevices.getDisplayMedia({ video: { width: 1280, height: 720 } });
          videoStreamRef.current = videoStream;
        } catch (e) {
          console.warn("Screen share cancelled", e);
        }
      }

      const combinedStream = new MediaStream([
        ...audioStream.getTracks(),
        ...(videoStream ? videoStream.getTracks() : [])
      ]);

      // Initialize or resume Input AudioContext
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new AudioContext({ sampleRate: 16000 });
        isWorkletRegisteredRef.current = false;
      } else if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // Initialize or resume Output AudioContext
      if (!outputAudioContextRef.current || outputAudioContextRef.current.state === 'closed') {
        outputAudioContextRef.current = new AudioContext();
      } else if (outputAudioContextRef.current.state === 'suspended') {
        await outputAudioContextRef.current.resume();
      }
      
      // Register Worklet only once per context
      if (!isWorkletRegisteredRef.current) {
        const workletCode = \`
          class PCMProcessor extends AudioWorkletProcessor {
            process(inputs, outputs, parameters) {
              const input = inputs[0];
              if (input && input.length > 0) {
                const channelData = input[0];
                const pcmData = new Int16Array(channelData.length);
                for (let i = 0; i < channelData.length; i++) {
                  pcmData[i] = Math.max(-1, Math.min(1, channelData[i])) * 0x7FFF;
                }
                this.port.postMessage(pcmData);
              }
              return true;
            }
          }
          registerProcessor('pcm-processor', PCMProcessor);
        \`;
        const blob = new Blob([workletCode], { type: 'application/javascript' });
        const blobUrl = URL.createObjectURL(blob);
        await audioContextRef.current.audioWorklet.addModule(blobUrl);
        isWorkletRegisteredRef.current = true;
      }
      
      if (!videoRef.current) {
        videoRef.current = document.createElement('video');
        videoRef.current.autoplay = true;
        videoRef.current.muted = true;
        canvasRef.current = document.createElement('canvas');
        canvasRef.current.width = 640;
        canvasRef.current.height = 480;
      }
      videoRef.current.srcObject = combinedStream;
      
      sourceRef.current = audioContextRef.current!.createMediaStreamSource(audioStream);
      const workletNode = new AudioWorkletNode(audioContextRef.current!, 'pcm-processor');
      processorRef.current = workletNode;
      
      workletNode.port.onmessage = (e) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          const pcmData = e.data;
          let binary = '';
          const bytes = new Uint8Array(pcmData.buffer);
          const len = bytes.byteLength;
          for (let i = 0; i < len; i++) {
              binary += String.fromCharCode(bytes[i]);
          }
          wsRef.current.send(JSON.stringify({ audio: window.btoa(binary) }));
        }
      };
      
      sourceRef.current.connect(workletNode);
      workletNode.connect(audioContextRef.current!.destination);

      if (videoIntervalRef.current) window.clearInterval(videoIntervalRef.current);
      videoIntervalRef.current = window.setInterval(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && videoRef.current && canvasRef.current && videoStreamRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0, 640, 480);
            const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);
            const base64Video = dataUrl.split(',')[1];
            wsRef.current.send(JSON.stringify({ video: base64Video }));
          }
        }
      }, 1000);

      // Connect WebSocket
      connectWs();

    } catch (err: any) {
      console.error("Failed to start conversation:", err);
      if (err.name === 'NotAllowedError' || err.message?.includes('Permission denied')) {
        setError("Відмовлено у доступі до мікрофона або камери. Будь ласка, перевірте дозволи браузера.");
      } else {
        setError("Не вдалося ініціалізувати медіа-пристрої.");
      }
      setIsConnecting(false);
    }
  }, [connectWs]);

  const sendToolResponse = useCallback((functionResponses: any[]) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ 
        toolResponse: { functionResponses }
      }));
    }
  }, []);

  useEffect(() => {
    return () => {
      stopConversation();
    };
  }, [stopConversation]);

  return {
    isConnected,
    isConnecting,
    error,
    transcript,
    activeAgent,
    canvasContent,
    sendToolResponse,
    startConversation,
    stopConversation
  };
}
`;

fs.writeFileSync('src/hooks/useLiveConversation.ts', content);
