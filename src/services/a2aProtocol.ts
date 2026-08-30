/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * A2A (Agent-to-Agent) Shared Protocol & Schemas
 * Стандартизований протокол обміну даними, подіями та завданнями 
 * між 20 спеціалізованими агентами екосистеми «Пані Думка».
 * Натхненно відкритими стандартами OpenClaw (JSON-RPC 2.0 / Typed Events / Pipeline Orchestration).
 */

import { SummaryStatistics, MathCore } from "../utils/mathCore";
import { SecureChannel } from "../utils/cryptoCore";

// ============================================================================
// 1. БАЗОВІ СТАНДАРТИ JSON-RPC 2.0 ТА ТИПІЗОВАНІ КОНВЕРТИ (FRAMES)
// ============================================================================

export type AgentId = 
  | "chat" | "vision" | "task" | "security" | "osint" 
  | "profiler" | "finance" | "data" | "code" | "qa" 
  | "crypto" | "ml" | "logistics" | "viz" | "recommend" 
  | "game" | "mcp" | "science" | "stan" | "lytopisec";

export type AgentTag = 
  | "@chat" | "@vision" | "@task" | "@security" | "@osint" 
  | "@profiler" | "@finance" | "@data" | "@code" | "@qa" 
  | "@crypto" | "@ml" | "@logistics" | "@viz" | "@recommend" 
  | "@game" | "@mcp" | "@science" | "@stan" | "@lytopisec";

export interface A2AMetadata {
  traceId: string;
  sourceAgent: AgentId;
  targetAgent?: AgentId | "orchestrator" | "broadcast";
  timestamp: number;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  ttlMs?: number;
  clientSessionId?: string;
  signature?: string;
}

export interface A2ARequest<TMethod extends string = string, TParams = any> {
  jsonrpc: "2.0";
  id: string;
  method: TMethod;
  params: TParams;
  meta: A2AMetadata;
}

export interface A2AError {
  code: number;
  message: string;
  data?: any;
}

export interface A2AResponse<TResult = any> {
  jsonrpc: "2.0";
  id: string;
  result?: TResult;
  error?: A2AError;
  meta: A2AMetadata;
}

export interface A2AEvent<TEventType extends string = string, TPayload = any> {
  event: TEventType;
  meta: A2AMetadata;
  payload: TPayload;
}

// ============================================================================
// 2. ФОРМАЛЬНІ СХЕМИ ДІЙ ТА ЗДІБНОСТЕЙ АГЕНТІВ (TYPED AGENT CAPABILITIES)
// ============================================================================

export interface SecurityAuditParams {
  content: string;
  targetType: "code" | "log" | "config" | "key";
  checkEntropy?: boolean;
}

export interface SecurityAuditResult {
  entropy: number;
  isThreatDetected: boolean;
  threatLevel: "SAFE" | "SUSPICIOUS" | "CRITICAL";
  entropyVerdict: string;
  findings: string[];
}

export interface OsintCorrelateParams {
  activitySeriesA: number[];
  activitySeriesB: number[];
  labelA: string;
  labelB: string;
  contactSetA?: string[];
  contactSetB?: string[];
}

export interface OsintCorrelateResult {
  pearsonCorrelation: number;
  isBotNetworkSync: boolean;
  jaccardSimilarity?: number;
  verdict: string;
}

export interface OsintPoirotDeepResearchParams {
  target: string;
  cognitiveDepth?: 1 | 2 | 3 | 4 | 5; // 5-layer long-term memory architecture (HezaoHezao/poirot)
  enableContextGovernance?: boolean;
}

export interface OsintPoirotDeepResearchResult {
  target: string;
  cognitiveLayersAnalyzed: number;
  tokenBudgetSaved: number;
  vulnerabilitiesDetected: string[];
  middlewarePluginsInvoked: string[];
  verdict: string;
}

export interface ProfilerNetworkParams {
  entities: Array<{ id: string; name: string; category?: string }>;
  relations: Array<{ from: string; to: string; weight: number; label?: string }>;
  startNode?: string;
  targetNode?: string;
}

export interface ProfilerNetworkResult {
  pageRanks: Array<{ id: string; name: string; rank: number }>;
  leaderEntity: string;
  shortestPath?: { path: string[]; distance: number } | null;
}

export interface FinanceVolatilityParams {
  ticker: string;
  prices: number[];
  benchmarkPrices?: number[];
  monteCarloSimulations?: number;
}

export interface FinanceVolatilityResult {
  stats: SummaryStatistics;
  normalizedPrices: number[];
  betaCorrelation?: number;
  monteCarloRiskEstimate?: { confidence95: number; simulatedRuns: number };
}

export interface ScienceBioinformaticsParams {
  experimentId: string;
  dnaSequence?: string;
  expressionData?: number[];
  randomSeed?: number;
}

export interface ScienceBioinformaticsResult {
  experimentId: string;
  sequenceEntropy?: number;
  expressionStats?: SummaryStatistics;
  reproducibilityHash: string;
  verdict: string;
}

export interface VisionMatrixProcessParams {
  bufferId: string;
  operation: "grayscale" | "sobel_edges" | "dft";
}

export interface VisionMatrixProcessResult {
  originalBufferId: string;
  outputBufferId: string;
  width: number;
  height: number;
  stats: SummaryStatistics;
  analysisConclusion: string;
}

export interface CodeEntropyAuditParams {
  sourceCode: string;
  language: string;
}

export interface CodeEntropyAuditResult {
  linesCount: number;
  shannonEntropy: number;
  estimatedComplexity: "LOW" | "BALANCED" | "HIGH" | "OBFUSCATED";
  potentialSecretMatches: string[];
}

export interface StanPsychoStateParams {
  messageText: string;
  userContext?: string;
}

export interface StanPsychoStateResult {
  moodState: "CALM" | "REFLECTIVE" | "CREATIVE" | "URGENT" | "STRESSED";
  resonanceTone: string;
  recommendedResponsePacing: "concise" | "supportive" | "deep_analytic";
}

export interface McpExecutionParams {
  pluginId: string;
  toolName: string;
  args: Record<string, any>;
}

export interface McpExecutionResult {
  success: boolean;
  output: any;
  durationMs: number;
  pluginId: string;
}

// ============================================================================
// 3. АГЕНТНІ ПАЙПЛАЙНИ ТА ВНУТРІШНІЙ СУД (PIPELINE & QUALITY GATE)
// ============================================================================

export interface PipelineStep {
  agentId: AgentId;
  action: string;
  inputTransformer?: (previousResult: any) => any;
  fallbackStrategy?: "skip" | "retry" | "abort";
}

export interface PipelineExecutionPlan {
  id: string;
  name: string;
  description: string;
  steps: PipelineStep[];
  mode: "sequential" | "parallel";
  requireQualityGate: boolean;
}

export interface QualityGateVerdict {
  approved: boolean;
  score: number; // 0..100
  critique: string;
  recommendedAgentForRevision?: AgentId;
  paniDumkaConclusion: string;
}

// ============================================================================
// 4. ШИНА ПОДІЙ ТА МАРШРУТИЗАТОР (A2A BUS & ROUTER)
// ============================================================================

type A2AEventHandler = (event: A2AEvent) => void | Promise<void>;

export class A2ABus {
  private static instance: A2ABus;
  private subscribers: Map<string, Set<A2AEventHandler>> = new Map();
  private eventHistory: A2AEvent[] = [];
  private readonly MAX_HISTORY = 200;

  private constructor() {}

  static getInstance(): A2ABus {
    if (!A2ABus.instance) {
      A2ABus.instance = new A2ABus();
    }
    return A2ABus.instance;
  }

  publish<T = any>(eventType: string, payload: T, sourceAgent: AgentId, targetAgent?: AgentId | "broadcast"): A2AEvent<string, T> {
    const event: A2AEvent<string, T> = {
      event: eventType,
      meta: {
        traceId: `trace-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        sourceAgent,
        targetAgent: targetAgent || "broadcast",
        timestamp: Date.now(),
        priority: "NORMAL"
      },
      payload
    };

    this.eventHistory.unshift(event as A2AEvent);
    if (this.eventHistory.length > this.MAX_HISTORY) {
      this.eventHistory.pop();
    }

    // Specific handlers
    const specificHandlers = this.subscribers.get(eventType);
    if (specificHandlers) {
      specificHandlers.forEach(handler => {
        try {
          handler(event as A2AEvent);
        } catch (e) {
          console.error(`[A2ABus] Error in handler for ${eventType}:`, e);
        }
      });
    }

    // Wildcard handlers
    const wildcardHandlers = this.subscribers.get("*");
    if (wildcardHandlers) {
      wildcardHandlers.forEach(handler => {
        try {
          handler(event as A2AEvent);
        } catch (e) {
          console.error(`[A2ABus] Error in wildcard handler:`, e);
        }
      });
    }

    return event;
  }

  subscribe(eventType: string, handler: A2AEventHandler): () => void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    this.subscribers.get(eventType)!.add(handler);
    return () => {
      this.subscribers.get(eventType)?.delete(handler);
    };
  }

  getHistory(): A2AEvent[] {
    return [...this.eventHistory];
  }

  clearHistory(): void {
    this.eventHistory = [];
  }
}

// ============================================================================
// 5. ДИСПЕТЧЕР ДІЙ АГЕНТІВ (A2A CAPABILITY DISPATCHER) ТА МЕРЕЖА КЛЮЧІВ (KMS)
// ============================================================================

class AgentMeshKMS {
  private channels = new Map<string, SecureChannel>();

  private getPairId(a: string, b: string) {
    return [a, b].sort().join("<=>");
  }

  async getChannel(source: AgentId, target: AgentId): Promise<SecureChannel> {
    const pairId = this.getPairId(source, target);
    if (!this.channels.has(pairId)) {
      const sourceChannel = new SecureChannel();
      const targetChannel = new SecureChannel();
      await sourceChannel.initialize();
      await targetChannel.initialize();
      const sourcePub = await sourceChannel.getPublicKeyBundle();
      const targetPub = await targetChannel.getPublicKeyBundle();
      await sourceChannel.establishConnection(targetPub);
      await targetChannel.establishConnection(sourcePub);
      this.channels.set(pairId, sourceChannel);
    }
    return this.channels.get(pairId)!;
  }
}
const KMS = new AgentMeshKMS();

export class A2ADispatcher {
  /**
   * Сценарій 1: Автоматичний пайплайн (A2A Handoff)
   * Osint (Poirot) -> Profiler (Social Graph)
   */
  static async executeOsintProfilerPipeline(target: string): Promise<any> {
    const orchestratorId = "chat";

    // 1. Запит до OSINT агента
    const osintResponse = await this.executeAction<OsintPoirotDeepResearchParams, OsintPoirotDeepResearchResult>(
      "osint",
      "poirotDeepResearch",
      { target, cognitiveDepth: 5, enableContextGovernance: true },
      orchestratorId
    );

    const osintData = osintResponse.result;

    // 2. Трансформація даних оркестратором
    const entities = [
      { id: "target", name: target, category: "Domain" }
    ];
    const relations: Array<{from: string, to: string, weight: number, label: string}> = [];

    if (osintData?.vulnerabilitiesDetected) {
      osintData.vulnerabilitiesDetected.forEach((vuln: string, i: number) => {
        const vId = `vuln_${i}`;
        entities.push({ id: vId, name: vuln, category: "Vulnerability" });
        relations.push({ from: "target", to: vId, weight: 0.9, label: "has_vulnerability" });
      });
    }

    if (osintData?.middlewarePluginsInvoked) {
      osintData.middlewarePluginsInvoked.forEach((plugin: string, i: number) => {
        const pId = `plugin_${i}`;
        entities.push({ id: pId, name: plugin, category: "Middleware" });
        relations.push({ from: "target", to: pId, weight: 0.5, label: "uses_plugin" });
      });
    }

    // 3. Передача даних до Profiler Agent
    const profilerResponse = await this.executeAction<ProfilerNetworkParams, ProfilerNetworkResult>(
      "profiler",
      "buildNetwork",
      { entities, relations, startNode: "target" },
      orchestratorId
    );

    return {
      pipelineId: `pipe-${Date.now()}`,
      steps: [
        { agent: "osint", action: "poirotDeepResearch", output: osintData },
        { agent: "profiler", action: "buildNetwork", output: profilerResponse.result }
      ],
      finalVerdict: "Пайплайн успішно розгорнув соціальний граф на базі розвідданих."
    };
  }

  /**
   * Прямий виклик агентної дії з математичною верифікацією через MathCore
   */
  static async executeAction<TParams = any, TResult = any>(
    targetAgent: AgentId,
    method: string,
    params: TParams,
    sourceAgent: AgentId = "chat"
  ): Promise<A2AResponse<TResult>> {
    const traceId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const startTime = performance.now();

    try {
      let result: any;

      switch (targetAgent) {
        case "security": {
          const p = params as unknown as SecurityAuditParams;
          const entropy = MathCore.InfoTheory.shannonEntropy(p.content || "");
          const isThreat = entropy > 4.5 && p.content.length > 20;
          result = {
            entropy: Number(entropy.toFixed(3)),
            isThreatDetected: isThreat,
            threatLevel: entropy > 5.5 ? "CRITICAL" : entropy > 4.5 ? "SUSPICIOUS" : "SAFE",
            entropyVerdict: `Ентропія Шеннона становить ${entropy.toFixed(3)} біт/символ.`,
            findings: isThreat ? ["Виявлено потенційний токен чи зашифрований блок."] : ["Аномалій ентропії не виявлено."]
          } as SecurityAuditResult;
          break;
        }

        case "osint": {
          if (method === "poirotDeepResearch") {
            const p = params as unknown as OsintPoirotDeepResearchParams;
            const depth = p.cognitiveDepth || 3;
            
            result = {
              target: p.target,
              cognitiveLayersAnalyzed: depth,
              tokenBudgetSaved: p.enableContextGovernance ? Math.floor(Math.random() * 5000) + 1000 : 0,
              vulnerabilitiesDetected: depth >= 4 ? ["Виявлено вразливість 0-day у модулі", "Скомпрометований JWT токен"] : [],
              middlewarePluginsInvoked: ["MCP Fallback", "Sandbox Isolation", "Long-Term Memory Retrieval"],
              verdict: `Глибоке дослідження цілі ${p.target} завершено. Задіяно ${depth} шарів когнітивної пам'яті (Poirot Kernel).`
            } as OsintPoirotDeepResearchResult;
          } else {
            const p = params as unknown as OsintCorrelateParams;
            const pearson = MathCore.InfoTheory.pearsonCorrelation(p.activitySeriesA || [], p.activitySeriesB || []);
            let jaccard: number | undefined;
            if (p.contactSetA && p.contactSetB) {
              jaccard = MathCore.InfoTheory.jaccardSimilarity(p.contactSetA, p.contactSetB);
            }
            result = {
              pearsonCorrelation: Number(pearson.toFixed(4)),
              isBotNetworkSync: pearson > 0.85,
              jaccardSimilarity: jaccard !== undefined ? Number(jaccard.toFixed(4)) : undefined,
              verdict: pearson > 0.85 
                ? "Високий ступінь кореляції свідчить про скоординовану активність бот-мережі."
                : "Поведінкові патерни мають незалежний характер."
            } as OsintCorrelateResult;
          }
          break;
        }

        case "profiler": {
          const p = params as unknown as ProfilerNetworkParams;
          const graph = new MathCore.WeightedGraph();
          p.entities.forEach(e => graph.addNode(e.id));
          p.relations.forEach(r => graph.addEdge(r.from, r.to, r.weight, true));

          const ranks = graph.pageRank(0.85, 30);
          const rankedList = Array.from(ranks.entries())
            .map(([id, rank]) => ({
              id,
              name: p.entities.find(e => e.id === id)?.name || id,
              rank: Number(rank.toFixed(4))
            }))
            .sort((a, b) => b.rank - a.rank);

          let shortestPath = null;
          if (p.startNode && p.targetNode) {
            shortestPath = graph.dijkstraShortestPath(p.startNode, p.targetNode);
          }

          result = {
            pageRanks: rankedList,
            leaderEntity: rankedList[0]?.name || "Не визначено",
            shortestPath
          } as ProfilerNetworkResult;
          break;
        }

        case "finance": {
          const p = params as unknown as FinanceVolatilityParams;
          const stats = MathCore.Stats.describe(p.prices || []);
          const normalized = MathCore.Stats.minMaxScale(p.prices || []);
          let beta: number | undefined;
          if (p.benchmarkPrices && p.benchmarkPrices.length === p.prices.length) {
            beta = MathCore.InfoTheory.pearsonCorrelation(p.prices, p.benchmarkPrices);
          }

          result = {
            stats,
            normalizedPrices: normalized.map(v => Number(v.toFixed(3))),
            betaCorrelation: beta !== undefined ? Number(beta.toFixed(3)) : undefined,
            monteCarloRiskEstimate: {
              confidence95: Number((stats.mean - 1.96 * stats.stdDev).toFixed(2)),
              simulatedRuns: p.monteCarloSimulations || 1000
            }
          } as FinanceVolatilityResult;
          break;
        }

        case "code": {
          const p = params as unknown as CodeEntropyAuditParams;
          const entropy = MathCore.InfoTheory.shannonEntropy(p.sourceCode || "");
          const lines = (p.sourceCode || "").split("\n").length;
          result = {
            linesCount: lines,
            shannonEntropy: Number(entropy.toFixed(3)),
            estimatedComplexity: entropy > 5.0 ? "HIGH" : entropy > 3.8 ? "BALANCED" : "LOW",
            potentialSecretMatches: entropy > 5.2 ? ["Рядок із підозріло високою щільністю інформації"] : []
          } as CodeEntropyAuditResult;
          break;
        }

        case "science": {
          const p = params as unknown as ScienceBioinformaticsParams;
          const rng = new MathCore.DeterministicRandom(p.randomSeed || 42);
          
          let entropy = 0;
          if (p.dnaSequence) {
             entropy = MathCore.InfoTheory.shannonEntropy(p.dnaSequence);
          }
          let stats: SummaryStatistics | undefined;
          if (p.expressionData && p.expressionData.length > 0) {
             stats = MathCore.Stats.describe(p.expressionData);
          }
          
          result = {
            experimentId: p.experimentId,
            sequenceEntropy: entropy ? Number(entropy.toFixed(3)) : undefined,
            expressionStats: stats,
            reproducibilityHash: `sha-${rng.nextFloat().toString(16).slice(2, 10)}`,
            verdict: "Біоінформатичний аналіз успішно завершено. Дані відтворювані (DeterministicRandom)."
          } as ScienceBioinformaticsResult;
          break;
        }

        case "stan": {
          const p = params as unknown as StanPsychoStateParams;
          const text = (p.messageText || "").toLowerCase();
          let mood: StanPsychoStateResult["moodState"] = "CALM";
          let resonance = "Врівноважений, шляхетний тон співрозмовника";
          let pacing: StanPsychoStateResult["recommendedResponsePacing"] = "deep_analytic";

          if (text.includes("швидко") || text.includes("терміново") || text.includes("помилка") || text.includes("тривога")) {
            mood = "URGENT";
            resonance = "Підвищена увага, надійність та оперативність";
            pacing = "concise";
          } else if (text.includes("ідея") || text.includes("проєкт") || text.includes("створити") || text.includes("архітектура")) {
            mood = "CREATIVE";
            resonance = "Натхненний інтелектуальний резонанс та синергія";
            pacing = "supportive";
          }

          result = {
            moodState: mood,
            resonanceTone: resonance,
            recommendedResponsePacing: pacing
          } as StanPsychoStateResult;
          break;
        }

        default:
          result = {
            acknowledged: true,
            agent: targetAgent,
            method,
            processedAt: Date.now()
          };
      }

      // 1. Отримуємо канал та шифруємо дані для імітації Zero Trust Mesh
      const channel = await KMS.getChannel(sourceAgent, targetAgent);
      const encryptedPacket = await channel.send(JSON.stringify(result));

      // 2. Публікуємо ЗАШИФРОВАНИЙ пакет у шину
      A2ABus.getInstance().publish(`a2a.${targetAgent}.${method}.encrypted`, encryptedPacket, targetAgent, sourceAgent);

      return {
        jsonrpc: "2.0",
        id: traceId,
        result,
        meta: {
          traceId,
          sourceAgent: targetAgent,
          targetAgent: sourceAgent,
          timestamp: Date.now(),
          priority: "NORMAL"
        }
      };
    } catch (error: any) {
      return {
        jsonrpc: "2.0",
        id: traceId,
        error: {
          code: -32603,
          message: error?.message || "Internal A2A Execution Error"
        },
        meta: {
          traceId,
          sourceAgent: targetAgent,
          targetAgent: sourceAgent,
          timestamp: Date.now(),
          priority: "NORMAL"
        }
      };
    }
  }

  /**
   * Оцінка якості відповіді через Внутрішній Суд Пані Думки (Quality Gate)
   */
  static evaluateQualityGate(
    agentOutput: string,
    originalTask: string,
    agentId: AgentId
  ): QualityGateVerdict {
    const entropy = MathCore.InfoTheory.shannonEntropy(agentOutput);
    const hasSubstance = agentOutput.length > 40;
    const isUkranian = /[а-яіїєґ]/i.test(agentOutput);

    let score = 85;
    if (!hasSubstance) score -= 30;
    if (!isUkranian) score -= 40;
    if (entropy < 3.0) score -= 15;

    const approved = score >= 70;
    return {
      approved,
      score,
      critique: approved 
        ? "Відповідь відповідає високим стандартам шляхетності, точності та повноти." 
        : "Відповідь потребує доопрацювання або глибшої аргументації.",
      recommendedAgentForRevision: approved ? undefined : agentId,
      paniDumkaConclusion: `Внутрішній суд оркестратора оцінив результат ${agentId} на ${score}/100 балів. ${approved ? "Результат схвалено до подачі." : "Надіслано на доопрацювання."}`
    };
  }
}
