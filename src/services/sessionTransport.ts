/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Session Transport & Realtime Streaming Engine
 * Високопродуктивний протокол сесійного стрімінгу (SSE / Chunked Streams / A2A Events)
 * для обміну повідомленнями у реальному часі між клієнтом, сервером та LLM-агентами.
 */

import { A2ABus, A2AEvent } from "./a2aProtocol";

// ============================================================================
// 1. ТИПІЗАЦІЯ ФРЕЙМІВ СТРІМІНГУ (STREAM FRAMES)
// ============================================================================

export type StreamFrameType = 
  | "token_delta"
  | "thought"
  | "a2a_event"
  | "tool_call"
  | "tool_result"
  | "metric"
  | "heartbeat"
  | "done"
  | "error";

export interface StreamFrame<T = any> {
  type: StreamFrameType;
  sessionId: string;
  sequence: number;
  timestamp: number;
  data: T;
}

export interface TokenDeltaPayload {
  token: string;
  accumulatedLength: number;
  agentTag?: string;
}

export interface ThoughtPayload {
  thoughtText: string;
  phase: "analyzing" | "orchestrating" | "computing" | "judging";
}

export interface ToolCallStreamPayload {
  toolName: string;
  pluginId?: string;
  args: any;
  status: "invoking" | "executing" | "completed" | "failed";
}

export interface StreamMetricPayload {
  rttMs: number;
  tokensPerSecond: number;
  totalTokens: number;
  activeAgents: string[];
}

export interface StreamOptions {
  sessionId?: string;
  userEmail?: string;
  customInstruction?: string;
  selectedAgent?: any;
  history?: Array<{ role: string; content: string }>;
  onToken?: (token: string, accumulated: string) => void;
  onThought?: (thought: string, phase: string) => void;
  onA2AEvent?: (event: any) => void;
  onToolCall?: (payload: ToolCallStreamPayload) => void;
  onMetric?: (metrics: StreamMetricPayload) => void;
  onDone?: (fullText: string) => void;
  onError?: (error: Error) => void;
}

// ============================================================================
// 2. КЛІЄНТСЬКИЙ СТРІМІНГОВИЙ МЕНЕДЖЕР (SESSION TRANSPORT CLIENT)
// ============================================================================

export class SessionTransportClient {
  private static instance: SessionTransportClient;
  private currentSessionId: string = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  private activeAbortController: AbortController | null = null;
  private connectionLatency: number = 0;
  private lastHeartbeatTime: number = Date.now();
  private streamSequence: number = 0;

  private constructor() {
    // Автоматичний моніторинг латентності
    this.startHeartbeatLoop();
  }

  static getInstance(): SessionTransportClient {
    if (!SessionTransportClient.instance) {
      SessionTransportClient.instance = new SessionTransportClient();
    }
    return SessionTransportClient.instance;
  }

  getSessionId(): string {
    return this.currentSessionId;
  }

  getLatencyMs(): number {
    return this.connectionLatency;
  }

  /**
   * Запуск повнотекстового стрімінгу відповіді через /api/stream (Server-Sent Events)
   */
  async startStream(message: string, options: StreamOptions): Promise<string> {
    this.cancelStream();

    this.activeAbortController = new AbortController();
    const sessionId = options.sessionId || this.currentSessionId;
    let accumulatedText = "";
    let tokenCount = 0;
    const streamStart = performance.now();

    try {
      const response = await fetch("/api/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "text/event-stream"
        },
        body: JSON.stringify({
          message,
          sessionId,
          userEmail: options.userEmail,
          customInstruction: options.customInstruction,
          selectedAgent: options.selectedAgent,
          history: options.history || []
        }),
        signal: this.activeAbortController.signal
      });

      if (!response.ok || !response.body) {
        // Fallback to standard chat endpoint if SSE is not available
        console.warn("[SessionTransport] SSE stream unavailable, falling back to /api/chat");
        return this.fallbackChat(message, options);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;

          const jsonString = trimmed.replace(/^data:\s*/, "");
          if (jsonString === "[DONE]") {
            break;
          }

          try {
            const frame: StreamFrame = JSON.parse(jsonString);
            this.handleIncomingFrame(frame, options, (token) => {
              accumulatedText += token;
              tokenCount++;
              options.onToken?.(token, accumulatedText);
            });
          } catch (e) {
            console.error("[SessionTransport] Failed to parse stream frame:", e);
          }
        }
      }

      const elapsedSec = (performance.now() - streamStart) / 1000;
      const tps = elapsedSec > 0 ? Math.round(tokenCount / elapsedSec) : 0;
      options.onMetric?.({
        rttMs: this.connectionLatency,
        tokensPerSecond: tps,
        totalTokens: tokenCount,
        activeAgents: [options.selectedAgent?.tag || "@chat"]
      });

      options.onDone?.(accumulatedText);
      return accumulatedText;
    } catch (error: any) {
      if (error.name === "AbortError") {
        return accumulatedText;
      }
      console.error("[SessionTransport] Stream error:", error);
      options.onError?.(error);
      throw error;
    } finally {
      this.activeAbortController = null;
    }
  }

  cancelStream(): void {
    if (this.activeAbortController) {
      this.activeAbortController.abort();
      this.activeAbortController = null;
    }
  }

  private handleIncomingFrame(
    frame: StreamFrame,
    options: StreamOptions,
    appendToken: (t: string) => void
  ): void {
    this.streamSequence = frame.sequence;

    switch (frame.type) {
      case "token_delta":
        if (frame.data?.token) {
          appendToken(frame.data.token);
        }
        break;

      case "thought":
        options.onThought?.(frame.data.thoughtText, frame.data.phase);
        break;

      case "a2a_event":
        options.onA2AEvent?.(frame.data);
        A2ABus.getInstance().publish(frame.data.event || "a2a.stream.event", frame.data.payload, frame.data.source || "chat");
        break;

      case "tool_call":
      case "tool_result":
        options.onToolCall?.(frame.data);
        break;

      case "metric":
        options.onMetric?.(frame.data);
        break;

      case "heartbeat":
        this.lastHeartbeatTime = Date.now();
        break;

      default:
        break;
    }
  }

  /**
   * Запасний резервний виклик /api/chat у разі перебоїв стрімінгу
   */
  private async fallbackChat(message: string, options: StreamOptions): Promise<string> {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        userEmail: options.userEmail,
        customInstruction: options.customInstruction,
        selectedAgent: options.selectedAgent,
        history: options.history || []
      })
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const data = await response.json();
    const text = data.text || "";
    options.onToken?.(text, text);
    options.onDone?.(text);
    return text;
  }

  private startHeartbeatLoop(): void {
    setInterval(async () => {
      const start = performance.now();
      try {
        const res = await fetch("/api/health", { method: "GET" });
        if (res.ok) {
          this.connectionLatency = Math.round(performance.now() - start);
        }
      } catch (e) {
        // Silent catch for dev mode
      }
    }, 15000);
  }
}
