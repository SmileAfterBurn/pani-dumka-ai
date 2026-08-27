/**
 * ElevenLabs Integration Service
 * Дозволяє використовувати клонований голос (наприклад, Дарини Білої) 
 * для озвучення текстів та відео-сценаріїв.
 */

// Для використання на клієнті краще використовувати REST API безпосередньо,
// оскільки Node.js SDK (elevenlabs) іноді вимагає поліфілів для браузера,
// або ж використовувати @elevenlabs/client для Conversational AI.

const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY || "";
const DEFAULT_VOICE_ID = "EXAVITQu4vr4xnSDxMaL"; // Placeholder (замініть на ID голосу Дарини Білої)

export const generateSpeech = async (text: string, voiceId: string = DEFAULT_VOICE_ID): Promise<Blob> => {
  if (!ELEVENLABS_API_KEY) {
    throw new Error("ELEVENLABS_API_KEY не налаштовано");
  }

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "Accept": "audio/mpeg",
      "Content-Type": "application/json",
      "xi-api-key": ELEVENLABS_API_KEY,
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_flash_v2_5",
      language_code: "uk",
      apply_text_normalization: "on",
      voice_settings: {
        stability: 0.0,
        similarity_boost: 1.0,
        style: 0.0,
        use_speaker_boost: true,
      }
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`ElevenLabs API Error: ${errorData.detail?.message || response.statusText}`);
  }

  return await response.blob();
};

export const playAudioBlob = (audioBlob: Blob) => {
  const audioUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioUrl);
  audio.play();
  
  audio.onended = () => {
    URL.revokeObjectURL(audioUrl);
  };
  
  return audio;
};

/**
 * Conversational AI (WebSockets) Skeleton
 * Використовує новий @elevenlabs/client для створення голосового чату в реальному часі.
 * Ідеально для перекладу жестів -> текст -> голос миттєво.
 */
import { Conversation } from '@elevenlabs/client';

export const startConversationalAgent = async (
  agentId: string, 
  onConnect: () => void,
  onDisconnect: () => void,
  onMessage: (message: string, role: 'user' | 'ai') => void,
  onError: (error: string) => void
) => {
  try {
    const conversation = await Conversation.startSession({
      agentId: agentId, 
      onConnect,
      onDisconnect,
      onError: (err) => onError(typeof err === 'string' ? err : err.message),
      onModeChange: (mode) => console.log('Mode changed:', mode),
    });
    
    return conversation;
  } catch (error) {
    console.error("Failed to start ElevenLabs conversation", error);
    throw error;
  }
};
