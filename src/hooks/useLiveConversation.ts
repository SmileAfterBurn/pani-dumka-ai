import { useState, useEffect, useRef, useCallback } from "react";

export function useLiveConversation() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>("");
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<AudioWorkletNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoIntervalRef = useRef<number | null>(null);

  const stopConversation = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
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
    if (videoIntervalRef.current) {
      window.clearInterval(videoIntervalRef.current);
      videoIntervalRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }
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
      // Ensure even length for Int16Array
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
        nextStartTimeRef.current = currentTime + 0.05; // small buffer
      }
      
      source.start(nextStartTimeRef.current);
      nextStartTimeRef.current += audioBuffer.duration;
    } catch (e) {
      console.error("Audio playback error:", e);
    }
  }, []);

  const [activeAgent, setActiveAgent] = useState<{name: string, task: string} | null>(null);
  const [canvasContent, setCanvasContent] = useState<string | null>(null);

  const sendToolResponse = useCallback((functionResponses: any[]) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ 
        toolResponse: { functionResponses }
      }));
    }
  }, []);

  const startConversation = useCallback(async (customInstruction?: string, useScreenShare = false) => {
    setIsConnecting(true);
    setError(null);
    setTranscript("");

    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      let videoStream: MediaStream | null = null;
      
      if (useScreenShare) {
        try {
          videoStream = await navigator.mediaDevices.getDisplayMedia({ video: { width: 1280, height: 720 } });
        } catch (e) {
          console.warn("Screen share cancelled", e);
          // No fallback to camera, just use audio
        }
      }

      // Combine streams
      const combinedStream = new MediaStream([
        ...audioStream.getTracks(),
        ...(videoStream ? videoStream.getTracks() : [])
      ]);

      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      outputAudioContextRef.current = new AudioContext(); // Use browser's native sample rate (usually 44.1kHz or 48kHz)
      
      const workletCode = `
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
      `;
      const blob = new Blob([workletCode], { type: 'application/javascript' });
      const blobUrl = URL.createObjectURL(blob);
      await audioContextRef.current.audioWorklet.addModule(blobUrl);
      
      if (!videoRef.current) {
        videoRef.current = document.createElement('video');
        videoRef.current.autoplay = true;
        videoRef.current.muted = true;
        canvasRef.current = document.createElement('canvas');
        canvasRef.current.width = 640;
        canvasRef.current.height = 480;
      }
      videoRef.current.srcObject = combinedStream;
      
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      
      ws.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);
        
        sourceRef.current = audioContextRef.current!.createMediaStreamSource(audioStream);
        
        const workletNode = new AudioWorkletNode(audioContextRef.current!, 'pcm-processor');
        processorRef.current = workletNode;
        
        workletNode.port.onmessage = (e) => {
          if (ws.readyState === WebSocket.OPEN) {
            const pcmData = e.data;
            const base64Data = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
            ws.send(JSON.stringify({ audio: base64Data }));
          }
        };
        
        sourceRef.current.connect(workletNode);
        workletNode.connect(audioContextRef.current!.destination);

        // Send video frames at 1 FPS if we have a video stream
        videoIntervalRef.current = window.setInterval(() => {
          if (ws.readyState === WebSocket.OPEN && videoRef.current && canvasRef.current && videoStream) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
              ctx.drawImage(videoRef.current, 0, 0, 640, 480);
              const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);
              const base64Video = dataUrl.split(',')[1];
              ws.send(JSON.stringify({ video: base64Video }));
            }
          }
        }, 1000);
      };
      
      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.audio) {
          playAudioChunk(msg.audio);
        }
        if (msg.interrupted) {
          nextStartTimeRef.current = 0;
        }
        if (msg.transcript) {
          setTranscript(prev => prev + " " + msg.transcript);
        }
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
          
          if (functionResponses.length > 0) {
            ws.send(JSON.stringify({ toolResponse: functionResponses }));
          }
        }
      };
      
      ws.onclose = () => stopConversation();
      ws.onerror = (err) => {
        console.error("Live API WebSocket Error:", err);
        setError("Помилка з'єднання з сервером");
        stopConversation();
      };
    } catch (err: any) {
      console.error("Failed to start conversation:", err);
      if (err.name === 'NotAllowedError' || err.message?.includes('Permission denied')) {
        setError("Відмовлено у доступі до мікрофона. Будь ласка, натисніть на іконку замка 🔒 в адресному рядку браузера та дозвольте мікрофон.");
      } else {
        setError("Не вдалося отримати доступ до мікрофона. Перевірте підключення обладнання.");
      }
      setIsConnecting(false);
    }
  }, [stopConversation, playAudioChunk]);

  useEffect(() => {
    return () => stopConversation();
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
