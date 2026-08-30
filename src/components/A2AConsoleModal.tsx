import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Network,
  Cpu,
  Boxes,
  Zap,
  Activity,
  Shield,
  Search,
  Code,
  Terminal,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Sliders,
  Sparkles,
  Database,
  Radio,
  FileCode,
  Check,
  ChevronDown
} from "lucide-react";
import { A2ABus, A2ADispatcher, AgentId, A2AEvent } from "../services/a2aProtocol";
import { McpSharedSdk, McpPluginManifest } from "../services/mcpSharedSdk";
import { SessionTransportClient } from "../services/sessionTransport";
import { AGENT_REGISTRY } from "../services/gemini";
import { AstParser, AstSecurityLinter, AstComplexityInspector, AstCodeRewriter } from "../services/astEngine";
import { RuntimeProfilerEngine, CpuProfileReport, HeapMemStats, ConcurrencyReport, ExecutionTraceEvent } from "../services/runtimeProfiler";
import { QaAutomationEngine, LlmEvalSuiteReport, TransportChaosReport } from "../services/qaLiveTransportEngine";
import { AgentRoutingGraph } from "./AgentRoutingGraph";

interface A2AConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAgent?: (agentId: string) => void;
}

const SAMPLE_CODE_SNIPPET = `// Приклад модуля обробки замовлень для аудиту AST
import { calculateDiscount } from './pricing';
import { dbQuery } from './database';

const API_KEY_SECRET = "sk_live_9481028491028401928401928401";

export async function processOrder(userId: string, orderData: any) {
  // Виконання сирого SQL-запиту
  const query = "SELECT * FROM orders WHERE user_id = '" + userId + "' AND status = 'active'";
  const result = await dbQuery(query);
  
  if (orderData.isSpecial) {
    if (orderData.discountCode) {
      if (orderData.items.length > 5) {
        // Небезпечний динамічний вираз
        eval("orderData.calculated = true;");
      }
    }
  }
  
  return result;
}

function calculateUnusedInternalHash(data: string) {
  return "hash_" + data;
}`;

export const A2AConsoleModal: React.FC<A2AConsoleModalProps> = ({
  isOpen,
  onClose,
  onSelectAgent
}) => {
  const [activeTab, setActiveTab] = useState<"a2a_mesh" | "mcp_plugins" | "ast_code_engine" | "runtime_profiler" | "qa_automation" | "streaming_transport">("a2a_mesh");
  
  // A2A state
  const [selectedSourceAgent, setSelectedSourceAgent] = useState<AgentId>("chat");
  const [selectedTargetAgent, setSelectedTargetAgent] = useState<AgentId>("security");
  const [a2aPayload, setA2aPayload] = useState<string>(
    JSON.stringify({ content: "sk_live_9948194810abc98418049182390812938120", targetType: "key" }, null, 2)
  );
  const [isExecutingA2A, setIsExecutingA2A] = useState(false);
  const [a2aResponse, setA2aResponse] = useState<any>(null);
  const [a2aEventHistory, setA2aEventHistory] = useState<A2AEvent[]>([]);

  // MCP state
  const [plugins, setPlugins] = useState<McpPluginManifest[]>([]);
  const [selectedPluginId, setSelectedPluginId] = useState<string>("plugin-mathcore");
  const [selectedToolName, setSelectedToolName] = useState<string>("math_describe_dataset");
  const [toolArgs, setToolArgs] = useState<string>(
    JSON.stringify({ data: [12.5, 14.8, 11.2, 19.4, 25.1, 14.0, 13.9, 45.0] }, null, 2)
  );
  const [isExecutingTool, setIsExecutingTool] = useState(false);
  const [toolExecutionResult, setToolExecutionResult] = useState<any>(null);
  const [mcpLog, setMcpLog] = useState<any[]>([]);

  // AST Engine state for @code & @security & @qa
  const [astInputCode, setAstInputCode] = useState<string>(SAMPLE_CODE_SNIPPET);
  const [astParseReport, setAstParseReport] = useState<any>(null);
  const [astSecurityFindings, setAstSecurityFindings] = useState<any[]>([]);
  const [astComplexityMetrics, setAstComplexityMetrics] = useState<any>(null);
  const [astTransformedCode, setAstTransformedCode] = useState<string>("");
  const [astActionRunning, setAstActionRunning] = useState<string | null>(null);

  // Runtime Profiler State (Go pprof-style)
  const [cpuReport, setCpuReport] = useState<CpuProfileReport | null>(null);
  const [heapStats, setHeapStats] = useState<HeapMemStats | null>(null);
  const [concurrencyReport, setConcurrencyReport] = useState<ConcurrencyReport | null>(null);
  const [executionTraces, setExecutionTraces] = useState<ExecutionTraceEvent[]>([]);
  const [isProfilingCpu, setIsProfilingCpu] = useState(false);

  // QA Automation State (OpenClaw LLM Evals & Live Transports)
  const [llmEvalReport, setLlmEvalReport] = useState<LlmEvalSuiteReport | null>(null);
  const [isEvaluatingLlm, setIsEvaluatingLlm] = useState(false);
  const [transportChaosReport, setTransportChaosReport] = useState<TransportChaosReport | null>(null);
  const [isChaosRunning, setIsChaosRunning] = useState(false);
  const [chaosPacketLoss, setChaosPacketLoss] = useState(12);
  const [chaosJitter, setChaosJitter] = useState(150);

  // Transport state
  const [latency, setLatency] = useState<number>(0);
  const [sessionId, setSessionId] = useState<string>("");
  const [isStreamTestRunning, setIsStreamTestRunning] = useState(false);
  const [streamedTestOutput, setStreamedTestOutput] = useState("");
  const [streamMetrics, setStreamMetrics] = useState<any>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Load MCP plugins
    const sdk = McpSharedSdk.getInstance();
    setPlugins(sdk.getAllPlugins());
    setMcpLog(sdk.getExecutionLog());

    // Load A2A history
    const bus = A2ABus.getInstance();
    setA2aEventHistory(bus.getHistory());

    const unsubscribe = bus.subscribe("*", (evt) => {
      setA2aEventHistory(bus.getHistory());
    });

    // Transport info
    const transport = SessionTransportClient.getInstance();
    setSessionId(transport.getSessionId());
    setLatency(transport.getLatencyMs());

    return () => {
      unsubscribe();
    };
  }, [isOpen]);

  const handleRunA2ADispatch = async () => {
    setIsExecutingA2A(true);
    setA2aResponse(null);
    try {
      const parsedParams = JSON.parse(a2aPayload);
      const res = await A2ADispatcher.executeAction(
        selectedTargetAgent,
        "executeTypedAction",
        parsedParams,
        selectedSourceAgent
      );
      setA2aResponse(res);
      setA2aEventHistory(A2ABus.getInstance().getHistory());
    } catch (e: any) {
      setA2aResponse({ error: e?.message || "Некоректний JSON формат параметрів" });
    } finally {
      setIsExecutingA2A(false);
    }
  };

  const handleRunCompositePipeline = async () => {
    setIsExecutingA2A(true);
    setA2aResponse(null);
    try {
      const res = await A2ADispatcher.executeOsintProfilerPipeline("test_target_nexus");
      setA2aResponse(res);
      setA2aEventHistory(A2ABus.getInstance().getHistory());
    } catch (e: any) {
      setA2aResponse({ error: e?.message || "Помилка виконання композитного пайплайну" });
    } finally {
      setIsExecutingA2A(false);
    }
  };

  const handleExecuteMcpTool = async () => {
    setIsExecutingTool(true);
    setToolExecutionResult(null);
    try {
      const parsedArgs = JSON.parse(toolArgs);
      const sdk = McpSharedSdk.getInstance();
      const res = await sdk.executeTool(selectedPluginId, selectedToolName, parsedArgs);
      setToolExecutionResult(res);
      setMcpLog(sdk.getExecutionLog());
    } catch (e: any) {
      setToolExecutionResult({ error: e?.message || "Помилка виклику інструменту" });
    } finally {
      setIsExecutingTool(false);
    }
  };

  const handleTestLiveStream = async () => {
    setIsStreamTestRunning(true);
    setStreamedTestOutput("");
    setStreamMetrics(null);

    const transport = SessionTransportClient.getInstance();
    try {
      await transport.startStream(
        "Надай короткий архітектурний звіт щодо протоколу обміну між агентами Пані Думки.",
        {
          selectedAgent: { name: "Code Agent", tag: "@code", promptSnippet: "Дій як архітектор протоколу A2A." },
          onToken: (token, acc) => {
            setStreamedTestOutput(acc);
          },
          onMetric: (m) => {
            setStreamMetrics(m);
          },
          onDone: (full) => {
            setStreamedTestOutput(full);
          }
        }
      );
    } catch (e) {
      console.error(e);
    } finally {
      setIsStreamTestRunning(false);
    }
  };

  // AST Handler methods for @code, @security, @qa
  const handleRunAstParse = () => {
    setAstActionRunning("parse");
    try {
      const parsed = AstParser.parse(astInputCode);
      setAstParseReport(parsed);
      A2ABus.getInstance().publish("ast.parsed", { lines: parsed.linesCount, functions: parsed.functionsFound }, "code");
    } finally {
      setAstActionRunning(null);
    }
  };

  const handleRunAstSecurityAudit = () => {
    setAstActionRunning("security");
    try {
      const parsed = AstParser.parse(astInputCode);
      setAstParseReport(parsed);
      const findings = AstSecurityLinter.audit(astInputCode, parsed.ast);
      setAstSecurityFindings(findings);
      A2ABus.getInstance().publish("ast.security.audit", { findingsCount: findings.length }, "security");
    } finally {
      setAstActionRunning(null);
    }
  };

  const handleRunAstComplexityInspect = () => {
    setAstActionRunning("complexity");
    try {
      const parsed = AstParser.parse(astInputCode);
      setAstParseReport(parsed);
      const metrics = AstComplexityInspector.inspect(astInputCode, parsed.ast);
      setAstComplexityMetrics(metrics);
      A2ABus.getInstance().publish("ast.complexity.inspected", { metrics }, "qa");
    } finally {
      setAstActionRunning(null);
    }
  };

  const handleRunAstRewriter = () => {
    setAstActionRunning("rewriter");
    try {
      const rewriteResult = AstCodeRewriter.wrapFunctionsWithTryCatch(astInputCode);
      setAstTransformedCode(rewriteResult.transformedCode);
      A2ABus.getInstance().publish("ast.rewritten", { modifications: rewriteResult.modificationsApplied }, "code");
    } finally {
      setAstActionRunning(null);
    }
  };

  // Runtime Profiler Handlers (pprof & MemStats)
  const handleRunCpuProfiler = () => {
    setIsProfilingCpu(true);
    setTimeout(() => {
      try {
        const report = RuntimeProfilerEngine.runCpuBenchmark(5);
        setCpuReport(report);
        setExecutionTraces(RuntimeProfilerEngine.getExecutionTraces());
        A2ABus.getInstance().publish("profiler.cpu.sampled", { topBottleneck: report.topBottleneck }, "code");
      } finally {
        setIsProfilingCpu(false);
      }
    }, 50);
  };

  const handleRefreshHeapStats = () => {
    const stats = RuntimeProfilerEngine.inspectHeapMemStats();
    setHeapStats(stats);
    A2ABus.getInstance().publish("profiler.heap.sampled", { allocBytes: stats.allocBytes }, "data");
  };

  const handleAuditConcurrency = () => {
    const report = RuntimeProfilerEngine.inspectConcurrency();
    setConcurrencyReport(report);
    A2ABus.getInstance().publish("profiler.concurrency.audited", { count: report.activeCoroutinesCount }, "mcp");
  };

  const handleSimulateUserTrace = () => {
    // Симулюємо Task -> Region -> Log (як у go/trace)
    RuntimeProfilerEngine.traceUserTask("UserAuthSyncFlow", "@code", () => {
      RuntimeProfilerEngine.traceUserLog("Auth", "Початок синхронізації токенів", "@code");
      
      RuntimeProfilerEngine.traceUserRegion("ValidateCredentials", "@code", () => {
        // Симуляція роботи
        const wasteTime = performance.now() + 15;
        while(performance.now() < wasteTime) {}
        RuntimeProfilerEngine.traceUserLog("Validation", "Успішно валідовано кеш", "@code");
      });

      RuntimeProfilerEngine.traceUserRegion("DatabaseUpdate", "@data", () => {
        const wasteTime = performance.now() + 30;
        while(performance.now() < wasteTime) {}
      });
    });
    setExecutionTraces(RuntimeProfilerEngine.getExecutionTraces());
  };

  // QA Automation Handlers (LLM Evals & Transport Chaos)
  const handleRunLlmEvals = async () => {
    setIsEvaluatingLlm(true);
    try {
      const report = await QaAutomationEngine.runLlmEvalSuite();
      setLlmEvalReport(report);
      A2ABus.getInstance().publish("qa.llm.eval.completed", { passRate: report.passRate, verdict: report.verdict }, "qa");
    } finally {
      setIsEvaluatingLlm(false);
    }
  };

  const handleRunTransportChaos = async () => {
    setIsChaosRunning(true);
    try {
      const report = await QaAutomationEngine.runTransportChaosSuite({
        simulatedPacketLossPercent: chaosPacketLoss,
        injectedJitterMs: chaosJitter
      });
      setTransportChaosReport(report);
      A2ABus.getInstance().publish("qa.transport.chaos.completed", { resilience: report.resilienceVerdict }, "mcp");
    } finally {
      setIsChaosRunning(false);
    }
  };

  useEffect(() => {
    if (activeTab === "runtime_profiler") {
      handleRefreshHeapStats();
      handleAuditConcurrency();
      setExecutionTraces(RuntimeProfilerEngine.getExecutionTraces());
    } else if (activeTab === "qa_automation") {
      if (!llmEvalReport) handleRunLlmEvals();
      if (!transportChaosReport) handleRunTransportChaos();
    }
  }, [activeTab]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-5xl h-[88vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-slate-100"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-600/10 border border-red-500/30 flex items-center justify-center text-red-600 dark:text-red-400">
                <Network className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-serif font-bold text-base flex items-center gap-2">
                  Архітектурна консоль A2A & MCP SDK
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-300/40">
                    OpenClaw Ready
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Міжагентний протокол обміну, уніфіковані плагіни та сесійний стрімінг
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50 px-5 gap-2 pt-2">
            <button
              onClick={() => setActiveTab("a2a_mesh")}
              className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === "a2a_mesh"
                  ? "border-red-600 text-red-600 dark:text-red-400"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Network className="w-4 h-4" />
              1. A2A Protocol & Mesh ({AGENT_REGISTRY.length} агентів)
            </button>

            <button
              onClick={() => setActiveTab("mcp_plugins")}
              className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === "mcp_plugins"
                  ? "border-red-600 text-red-600 dark:text-red-400"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Boxes className="w-4 h-4" />
              2. Shared MCP Plugin SDK
            </button>

            <button
              onClick={() => setActiveTab("ast_code_engine")}
              className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === "ast_code_engine"
                  ? "border-red-600 text-red-600 dark:text-red-400"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <FileCode className="w-4 h-4" />
              3. AST Static Analysis & Rewriter
            </button>

            <button
              onClick={() => setActiveTab("runtime_profiler")}
              className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === "runtime_profiler"
                  ? "border-red-600 text-red-600 dark:text-red-400"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Activity className="w-4 h-4" />
              4. Runtime Profiler (pprof)
            </button>

            <button
              onClick={() => setActiveTab("qa_automation")}
              className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === "qa_automation"
                  ? "border-red-600 text-red-600 dark:text-red-400"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              5. QA Automation & Live Transports
            </button>

            <button
              onClick={() => setActiveTab("streaming_transport")}
              className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === "streaming_transport"
                  ? "border-red-600 text-red-600 dark:text-red-400"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Radio className="w-4 h-4" />
              6. Сесійний транспорт (SSE)
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
            {/* TAB 1: A2A MESH */}
            {activeTab === "a2a_mesh" && (
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                {/* Left: Agent Routing Graph */}
                <div className="xl:col-span-4 space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 h-full flex flex-col justify-center items-center overflow-hidden">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 w-full mb-4 flex items-center gap-2">
                      <Network className="w-3.5 h-3.5 text-blue-500" />
                      Топологія A2A Мережі
                    </h3>
                    <AgentRoutingGraph events={a2aEventHistory} />
                  </div>
                </div>

                {/* Center: Dispatcher controls */}
                <div className="xl:col-span-4 space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      Виклик A2A Frame
                    </h3>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="text-[11px] text-slate-500 block mb-1">Джерело</label>
                        <select
                          value={selectedSourceAgent}
                          onChange={(e) => setSelectedSourceAgent(e.target.value as AgentId)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                        >
                          {AGENT_REGISTRY.map(a => (
                            <option key={a.id} value={a.id}>{a.name} ({a.tag})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-500 block mb-1">Виконавець</label>
                        <select
                          value={selectedTargetAgent}
                          onChange={(e) => {
                            const target = e.target.value as AgentId;
                            setSelectedTargetAgent(target);
                            // Pre-fill smart default payloads
                            if (target === "security") {
                              setA2aPayload(JSON.stringify({ content: "sk_live_9948194810abc98418049182390812938120", targetType: "key" }, null, 2));
                            } else if (target === "osint") {
                              setA2aPayload(JSON.stringify({ activitySeriesA: [12, 14, 88, 120, 45], activitySeriesB: [10, 15, 85, 118, 44], labelA: "Бот #1", labelB: "Бот #2" }, null, 2));
                            } else if (target === "profiler") {
                              setA2aPayload(JSON.stringify({ entities: [{ id: "A", name: "Олександр" }, { id: "B", name: "Віктор" }, { id: "C", name: "Іван" }], relations: [{ from: "A", to: "B", weight: 2 }, { from: "B", to: "C", weight: 1 }] }, null, 2));
                            } else if (target === "finance") {
                              setA2aPayload(JSON.stringify({ ticker: "BTC/USDT", prices: [62000, 63400, 61500, 64200, 65000, 63800] }, null, 2));
                            } else if (target === "code") {
                              setA2aPayload(JSON.stringify({ sourceCode: "function computeHash(x) { return x.split('').reverse().join(''); }", language: "typescript" }, null, 2));
                            } else if (target === "stan") {
                              setA2aPayload(JSON.stringify({ messageText: "Потрібно терміново протестувати архітектуру безпеки перед запуском!" }, null, 2));
                            }
                          }}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                        >
                          {AGENT_REGISTRY.map(a => (
                            <option key={a.id} value={a.id}>{a.name} ({a.tag})</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="text-[11px] text-slate-500 block mb-1">Вхідні параметри JSON (Params)</label>
                      <textarea
                        value={a2aPayload}
                        onChange={(e) => setA2aPayload(e.target.value)}
                        rows={6}
                        className="w-full font-mono text-xs p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-red-500"
                      />
                    </div>

                    <div className="pt-2 flex flex-col gap-2">
                      <button
                        onClick={handleRunA2ADispatch}
                        disabled={isExecutingA2A}
                        className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-rose-700 text-white font-medium text-xs flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        {isExecutingA2A ? "Виконання через A2A Mesh..." : "Надіслати A2A запит (JSON-RPC)"}
                      </button>
                      <button
                        onClick={handleRunCompositePipeline}
                        disabled={isExecutingA2A}
                        className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                      >
                        <Network className="w-3.5 h-3.5 fill-current" />
                        {isExecutingA2A ? "Побудова графу..." : "Тест A2A Handoff (OSINT -> Profiler)"}
                      </button>
                    </div>
                  </div>

                  {/* Quality gate evaluation */}
                  {a2aResponse && (
                    <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50">
                      <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-2 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Відповідь A2A Response & Внутрішній Суд
                      </h4>
                      <pre className="font-mono text-[11px] p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 text-slate-800 dark:text-slate-200 overflow-x-auto max-h-48 scrollbar-hide">
                        {JSON.stringify(a2aResponse, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>

                {/* Right: Live A2A Event Bus History */}
                <div className="xl:col-span-4 space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-indigo-500" />
                        Жива шина подій A2ABus ({a2aEventHistory.length} подій)
                      </h3>
                      <button
                        onClick={() => A2ABus.getInstance().clearHistory()}
                        className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Очистити
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 max-h-[460px] scrollbar-hide pr-1">
                      {a2aEventHistory.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 text-xs italic">
                          Шина подій готова. Надішліть A2A запит для перегляду фреймів у реальному часі.
                        </div>
                      ) : (
                        a2aEventHistory.map((evt, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5 shadow-2xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                                {evt.event}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {new Date(evt.meta.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                              <span>Джерело: <b className="text-red-600 dark:text-red-400 font-mono">{evt.meta.sourceAgent}</b></span>
                              <ArrowRight className="w-3 h-3" />
                              <span>Ціль: <b className="text-indigo-600 dark:text-indigo-400 font-mono">{evt.meta.targetAgent}</b></span>
                            </div>
                            <pre className="font-mono text-[10px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-2 rounded-lg overflow-x-auto max-h-24 scrollbar-hide">
                              {JSON.stringify(evt.payload, null, 2)}
                            </pre>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: MCP PLUGINS */}
            {activeTab === "mcp_plugins" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Plugin catalog */}
                <div className="lg:col-span-5 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                    Активні MCP плагіни
                  </h3>

                  {plugins.map((plugin) => (
                    <div
                      key={plugin.id}
                      onClick={() => {
                        setSelectedPluginId(plugin.id);
                        if (plugin.tools[0]) {
                          setSelectedToolName(plugin.tools[0].name);
                          // Default args generator
                          const firstTool = plugin.tools[0];
                          const defaultArgs: any = {};
                          for (const key of Object.keys(firstTool.parameters.properties || {})) {
                            const prop = firstTool.parameters.properties[key];
                            if (prop.type === "array") defaultArgs[key] = [1, 2, 3];
                            else if (prop.type === "string") defaultArgs[key] = "test-input";
                            else if (prop.type === "boolean") defaultArgs[key] = true;
                          }
                          setToolArgs(JSON.stringify(defaultArgs, null, 2));
                        }
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer text-left ${
                        selectedPluginId === plugin.id
                          ? "bg-red-50/50 dark:bg-red-950/20 border-red-400 dark:border-red-600 shadow-sm"
                          : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          <Boxes className="w-4 h-4 text-red-600" />
                          {plugin.name}
                        </span>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold">
                          v{plugin.version}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                        {plugin.description}
                      </p>
                      <div className="mt-2 text-[10px] text-slate-400 font-mono">
                        {plugin.tools.length} інструментів • Автор: {plugin.author}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Right: Tool Execution Interface */}
                <div className="lg:col-span-7 space-y-4">
                  {(() => {
                    const currentPlugin = plugins.find(p => p.id === selectedPluginId);
                    const currentTool = currentPlugin?.tools.find(t => t.name === selectedToolName);

                    return (
                      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                              Виклик інструменту MCP: {currentTool?.displayName || selectedToolName}
                            </h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {currentTool?.description}
                            </p>
                          </div>

                          {currentPlugin && currentPlugin.tools.length > 1 && (
                            <select
                              value={selectedToolName}
                              onChange={(e) => {
                                setSelectedToolName(e.target.value);
                                const tool = currentPlugin.tools.find(t => t.name === e.target.value);
                                if (tool) {
                                  const defaultArgs: any = {};
                                  for (const key of Object.keys(tool.parameters.properties || {})) {
                                    const prop = tool.parameters.properties[key];
                                    if (prop.type === "array") defaultArgs[key] = [10, 20, 30, 40];
                                    else if (prop.type === "string") defaultArgs[key] = prop.enum ? prop.enum[0] : "Зразок запиту";
                                    else if (prop.type === "boolean") defaultArgs[key] = true;
                                  }
                                  setToolArgs(JSON.stringify(defaultArgs, null, 2));
                                }
                              }}
                              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs"
                            >
                              {currentPlugin.tools.map(t => (
                                <option key={t.name} value={t.name}>{t.displayName}</option>
                              ))}
                            </select>
                          )}
                        </div>

                        <div>
                          <label className="text-[11px] text-slate-500 block mb-1">
                            Параметри аргументів (JSON Schema Validation)
                          </label>
                          <textarea
                            value={toolArgs}
                            onChange={(e) => setToolArgs(e.target.value)}
                            rows={5}
                            className="w-full font-mono text-xs p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-red-500"
                          />
                        </div>

                        <button
                          onClick={handleExecuteMcpTool}
                          disabled={isExecutingTool}
                          className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          {isExecutingTool ? "Виконання через MCP SDK..." : "Виконати інструмент (Mcp Execution)"}
                        </button>

                        {toolExecutionResult && (
                          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            <div className="flex items-center justify-between mb-1.5 text-[11px]">
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Результат виконання
                              </span>
                              <span className="font-mono text-slate-400 text-[10px]">
                                {toolExecutionResult.durationMs} мс
                              </span>
                            </div>
                            <pre className="font-mono text-[10px] text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg overflow-x-auto max-h-40 scrollbar-hide">
                              {JSON.stringify(toolExecutionResult.result || toolExecutionResult, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* TAB 3: AST STATIC ANALYSIS & REWRITING */}
            {activeTab === "ast_code_engine" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Code Input & Action Toolbar */}
                <div className="lg:col-span-6 space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Code className="w-3.5 h-3.5 text-blue-600" />
                        Сирцевий код для аналізу (TypeScript / JavaScript / Go)
                      </label>
                      <button
                        onClick={() => setAstInputCode(SAMPLE_CODE_SNIPPET)}
                        className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-mono"
                      >
                        Вставити зразок
                      </button>
                    </div>

                    <textarea
                      value={astInputCode}
                      onChange={(e) => setAstInputCode(e.target.value)}
                      rows={13}
                      className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 leading-relaxed"
                      placeholder="Вставте сирцевий код..."
                    />

                    {/* Action buttons */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                      <button
                        onClick={handleRunAstParse}
                        disabled={astActionRunning !== null}
                        className="py-2 px-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        {astActionRunning === "parse" ? "Парсинг..." : "1. Парсити AST"}
                      </button>

                      <button
                        onClick={handleRunAstSecurityAudit}
                        disabled={astActionRunning !== null}
                        className="py-2 px-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        {astActionRunning === "security" ? "Аудит..." : "2. Security Lint"}
                      </button>

                      <button
                        onClick={handleRunAstComplexityInspect}
                        disabled={astActionRunning !== null}
                        className="py-2 px-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        {astActionRunning === "complexity" ? "Аналіз..." : "3. Складність CC"}
                      </button>

                      <button
                        onClick={handleRunAstRewriter}
                        disabled={astActionRunning !== null}
                        className="py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        {astActionRunning === "rewriter" ? "Синтез..." : "4. Рефакторинг"}
                      </button>
                    </div>
                  </div>

                  {/* Summary Metric Chips */}
                  {astParseReport && (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-center">
                        <div className="text-slate-400 text-[10px] uppercase font-bold">Рядків / Токенів</div>
                        <div className="text-sm font-bold font-mono text-slate-800 dark:text-slate-200 mt-0.5">
                          {astParseReport.linesCount} / {astParseReport.tokensCount}
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-center">
                        <div className="text-slate-400 text-[10px] uppercase font-bold">Функцій виявлено</div>
                        <div className="text-sm font-bold font-mono text-blue-600 dark:text-blue-400 mt-0.5">
                          {astParseReport.functionsFound.length}
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-center">
                        <div className="text-slate-400 text-[10px] uppercase font-bold">Час парсингу</div>
                        <div className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                          {astParseReport.parseDurationMs} мс
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Reports and Results */}
                <div className="lg:col-span-6 space-y-4">
                  {/* Security Findings Box */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between mb-3">
                      <span className="flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5 text-red-600" />
                        Аудит безпеки сирцевого коду (@security)
                      </span>
                      {astSecurityFindings.length > 0 && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 font-semibold">
                          Знайдено вразливостей: {astSecurityFindings.length}
                        </span>
                      )}
                    </h4>

                    {astSecurityFindings.length > 0 ? (
                      <div className="space-y-2.5 max-h-48 overflow-y-auto scrollbar-hide">
                        {astSecurityFindings.map((f, idx) => (
                          <div
                            key={idx}
                            className={`p-2.5 rounded-xl border text-xs ${
                              f.severity === "CRITICAL"
                                ? "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-900 dark:text-red-200"
                                : "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200"
                            }`}
                          >
                            <div className="flex items-center justify-between font-bold mb-1">
                              <span className="flex items-center gap-1.5">
                                <AlertCircle className="w-3.5 h-3.5" />
                                {f.ruleId} (Рядок {f.line})
                              </span>
                              <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-black/10 font-mono">
                                {f.severity}
                              </span>
                            </div>
                            <p className="text-[11px] mb-1.5">{f.message}</p>
                            <div className="p-1.5 rounded bg-black/5 dark:bg-black/30 font-mono text-[10px] truncate mb-1">
                              {f.snippet}
                            </div>
                            <p className="text-[10px] opacity-80">💡 Рекомендація: {f.remediationAdvice}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">
                        Натисніть «Security Lint» для сканування на SQL-ін'єкції, небезпечний eval(), регулярні вирази ReDoS та витік API-ключів за ентропією Шеннона.
                      </p>
                    )}
                  </div>

                  {/* Complexity & QA Metrics */}
                  {astComplexityMetrics && (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between mb-3">
                        <span className="flex items-center gap-2">
                          <Sliders className="w-3.5 h-3.5 text-purple-600" />
                          Метрики якості коду та рефакторингу (@qa, @code)
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-semibold">
                          {astComplexityMetrics.complexityVerdict}
                        </span>
                      </h4>

                      <div className="grid grid-cols-3 gap-2 mb-3 text-center text-xs">
                        <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <div className="text-[10px] text-slate-400">Цикломатична CC</div>
                          <div className="font-mono font-bold text-sm text-purple-600 dark:text-purple-400">
                            {astComplexityMetrics.cyclomaticComplexity}
                          </div>
                        </div>
                        <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <div className="text-[10px] text-slate-400">Вкладеність Depth</div>
                          <div className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400">
                            {astComplexityMetrics.maxNestingDepth}
                          </div>
                        </div>
                        <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <div className="text-[10px] text-slate-400">Maintainability (MI)</div>
                          <div className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                            {astComplexityMetrics.maintainabilityIndex} / 100
                          </div>
                        </div>
                      </div>

                      {astComplexityMetrics.deadCodeCandidates.length > 0 && (
                        <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200">
                          <div className="font-semibold text-[11px] mb-1">Кандидати на мертвий код (Dead Code):</div>
                          <ul className="list-disc list-inside text-[10px] space-y-0.5">
                            {astComplexityMetrics.deadCodeCandidates.map((c: string, i: number) => (
                              <li key={i}>{c}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Transformed Code Output */}
                  {astTransformedCode && (
                    <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50">
                      <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center justify-between mb-2">
                        <span className="flex items-center gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                          Результат авто-рефакторингу (try/catch + Telemetry)
                        </span>
                        <button
                          onClick={() => navigator.clipboard.writeText(astTransformedCode)}
                          className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                        >
                          Копіювати
                        </button>
                      </h4>
                      <pre className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200/60 dark:border-emerald-800/40 font-mono text-[11px] text-slate-800 dark:text-slate-200 max-h-48 overflow-y-auto leading-relaxed scrollbar-hide">
                        {astTransformedCode}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: RUNTIME & MEMORY PROFILER (GO PPROF-STYLE) */}
            {activeTab === "runtime_profiler" && (
              <div className="space-y-6">
                {/* Top Control Header & Quick Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-red-600" />
                      Runtime Profiling, CPU Hotspots & Heap Diagnostics
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Діагностика рантайму в стилі Go (pprof, MemStats, Goroutine Leaks, Execution Trace).
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleRunCpuProfiler}
                      disabled={isProfilingCpu}
                      className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-xs flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
                    >
                      <Cpu className="w-3.5 h-3.5" />
                      {isProfilingCpu ? "Семплінг CPU..." : "Запустити CPU Benchmark"}
                    </button>
                    <button
                      onClick={handleRefreshHeapStats}
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <Database className="w-3.5 h-3.5" />
                      Зріз купи (MemStats)
                    </button>
                    <button
                      onClick={handleAuditConcurrency}
                      className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-medium text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Аудит завдань
                    </button>
                    <button
                      onClick={handleSimulateUserTrace}
                      className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      User Trace (go/trace)
                    </button>
                  </div>
                </div>

                {/* 1. HEAP MEMSTATS & GC METRIC CARDS */}
                {heapStats && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Alloc (JS Heap Used)</div>
                      <div className="text-base font-bold font-mono text-slate-900 dark:text-slate-100 mt-1">
                        {RuntimeProfilerEngine.formatBytes(heapStats.allocBytes)}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        з {RuntimeProfilerEngine.formatBytes(heapStats.heapLimitBytes)} ліміту
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Matrix Buffers (Float64)</div>
                      <div className="text-base font-bold font-mono text-blue-600 dark:text-blue-400 mt-1">
                        {RuntimeProfilerEngine.formatBytes(heapStats.matrixBufferBytes)}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Активних матриць: {heapStats.matrixBuffersCount}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] uppercase font-bold text-slate-400">GC Pause (STW Estimate)</div>
                      <div className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                        ~{heapStats.gcPauseEstimateMs} мс
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Час блокування потоку
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Рівень навантаження GC</div>
                      <div className={`text-xs font-bold font-mono mt-1.5 px-2 py-0.5 rounded-full inline-block ${
                        heapStats.gcPressureLevel.includes("LOW")
                          ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                          : "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                      }`}>
                        {heapStats.gcPressureLevel}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Стан збирача сміття
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. CPU BENCHMARK & HOTSPOTS BREAKDOWN */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-6 space-y-4">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          <Cpu className="w-3.5 h-3.5 text-red-600" />
                          CPU Hotspots (runtime/pprof Sampling)
                        </h4>
                        {cpuReport && (
                          <span className="text-[10px] font-mono text-slate-500">
                            Час тесту: {cpuReport.durationMs} мс
                          </span>
                        )}
                      </div>

                      {cpuReport ? (
                        <div className="space-y-3">
                          {cpuReport.hotspots.map((sample, i) => (
                            <div key={i} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="font-mono font-semibold text-[11px] text-slate-800 dark:text-slate-200 truncate max-w-[280px]">
                                  {sample.functionName}
                                </span>
                                <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                                  sample.isBottleneck
                                    ? "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                                }`}>
                                  {sample.cpuPercentage}% CPU ({sample.executionTimeMs} мс)
                                </span>
                              </div>

                              {/* Progress bar */}
                              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden mb-1">
                                <div
                                  className={`h-full ${sample.isBottleneck ? "bg-red-600" : "bg-blue-600"}`}
                                  style={{ width: `${Math.min(100, sample.cpuPercentage)}%` }}
                                />
                              </div>

                              <div className="flex justify-between text-[10px] text-slate-400">
                                <span>Модуль: {sample.module}</span>
                                <span>Викликів: {sample.invocationCount.toLocaleString()}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                          Натисніть «Запустити CPU Benchmark» для профілювання гарячих точок алгоритмів MathCore.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 3. CONCURRENCY LEAK AUDIT & EXECUTION TRACE */}
                  <div className="lg:col-span-6 space-y-4">
                    {/* Concurrency Audit */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between mb-3">
                        <span className="flex items-center gap-2">
                          <Zap className="w-3.5 h-3.5 text-amber-500" />
                          Активні корутини та завдання (pprof Goroutines)
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                          {concurrencyReport?.activeCoroutinesCount || 0} активних • 0 блокувань
                        </span>
                      </h4>

                      <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-hide">
                        {concurrencyReport?.tasks.map((task, i) => (
                          <div key={i} className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                            <div>
                              <div className="font-semibold text-[11px] text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                {task.name}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">@{task.agentId} • ID: {task.taskId}</div>
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {task.durationMs} мс
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Execution Trace Timeline */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between mb-2">
                        <span className="flex items-center gap-2">
                          <Sliders className="w-3.5 h-3.5 text-purple-600" />
                          Execution Trace (runtime/trace Timeline)
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {executionTraces.length} подій
                        </span>
                      </h4>

                      <div className="space-y-1.5 max-h-44 overflow-y-auto font-mono text-[10px] scrollbar-hide">
                        {executionTraces.length > 0 ? (
                          executionTraces.slice(0, 12).map((ev) => (
                            <div key={ev.id} className={`p-1.5 rounded border flex items-center justify-between ${
                              ev.type.startsWith("USER_")
                                ? "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800/50"
                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                            }`}>
                              <span className={`truncate max-w-[260px] ${
                                ev.type.startsWith("USER_") ? "text-purple-700 dark:text-purple-300 font-semibold" : "text-slate-700 dark:text-slate-300"
                              }`}>
                                [{ev.type}] {ev.label} ({ev.agentOrCaller})
                              </span>
                              <span className={`${
                                ev.type === "USER_LOG" ? "text-slate-400" : "text-emerald-600 dark:text-emerald-400 font-bold"
                              }`}>
                                {ev.type === "USER_LOG" ? "-" : `${ev.durationMs.toFixed(1)} мс`}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="text-slate-400 italic text-center py-2">
                            Трасування формується автоматично під час виконання операцій...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: QA AUTOMATION FOR LLMS & LIVE TRANSPORTS (OPENCLAW SPEC) */}
            {activeTab === "qa_automation" && (
              <div className="space-y-6">
                {/* Header Banner */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      QA Automation for Language Models & Live Transports
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Детерміновані LLM бенчмарки, перевірка схем, хаос-тестування транспорту та latency-квантилі.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleRunLlmEvals}
                      disabled={isEvaluatingLlm}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {isEvaluatingLlm ? "Прогін тестів LLM..." : "Запустити LLM Evals"}
                    </button>
                    <button
                      onClick={handleRunTransportChaos}
                      disabled={isChaosRunning}
                      className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
                    >
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      {isChaosRunning ? "Симуляція хаосу..." : "Запустити Chaos Testing"}
                    </button>
                  </div>
                </div>

                {/* 1. LLM EVALS SUITE OVERVIEW */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: LLM Test Cases & Schema Conformance */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          <FileCode className="w-3.5 h-3.5 text-blue-600" />
                          Детерміновані LLM Бенчмарки (Regression & Schema Suite)
                        </h4>
                        {llmEvalReport && (
                          <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${
                            llmEvalReport.verdict === "PRODUCTION_READY"
                              ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                              : "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                          }`}>
                            {llmEvalReport.verdict} ({llmEvalReport.passRate}% Успіху)
                          </span>
                        )}
                      </div>

                      {llmEvalReport ? (
                        <div className="space-y-3">
                          {llmEvalReport.results.map((res, i) => (
                            <div key={i} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                              <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full ${res.passed ? "bg-emerald-500" : "bg-red-500"}`} />
                                  <span className="font-mono font-semibold text-[11px] text-slate-800 dark:text-slate-200">
                                    {res.testId}
                                  </span>
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                                    {res.category}
                                  </span>
                                </div>
                                <span className="font-mono text-[10px] text-slate-500">
                                  {res.latencyMs} мс • Точність: {(res.semanticSimilarity * 100).toFixed(0)}%
                                </span>
                              </div>

                              <div className="p-2 rounded bg-slate-50 dark:bg-slate-950 font-mono text-[10px] text-slate-600 dark:text-slate-300 max-h-16 overflow-y-auto whitespace-pre-wrap">
                                {res.actualOutputSample}
                              </div>

                              {res.violations.length > 0 && (
                                <div className="mt-2 text-[10px] text-red-500">
                                  Порушення: {res.violations.join("; ")}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                          Натисніть «Запустити LLM Evals» для оцінки точності, галюцинацій та відповідності JSON-схемам.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Live Transport Chaos & Latency Quantiles */}
                  <div className="lg:col-span-5 space-y-4">
                    {/* Chaos Controls & Resilience */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Radio className="w-3.5 h-3.5 text-amber-500" />
                          Параметри хаос-інжекції транспорту
                        </span>
                        {transportChaosReport && (
                          <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {transportChaosReport.resilienceVerdict}
                          </span>
                        )}
                      </h4>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="text-[10px] text-slate-500">Втрата пакетів ({chaosPacketLoss}%)</label>
                          <input
                            type="range"
                            min="0"
                            max="40"
                            value={chaosPacketLoss}
                            onChange={(e) => setChaosPacketLoss(Number(e.target.value))}
                            className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500">Джитер ({chaosJitter} мс)</label>
                          <input
                            type="range"
                            min="10"
                            max="400"
                            value={chaosJitter}
                            onChange={(e) => setChaosJitter(Number(e.target.value))}
                            className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer mt-1"
                          />
                        </div>
                      </div>

                      {/* Chaos Report Metrics */}
                      {transportChaosReport && (
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2">
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                              <div className="text-[9px] uppercase text-slate-400">Доставлено</div>
                              <div className="text-sm font-bold font-mono text-emerald-600">
                                {transportChaosReport.packetsReceived}/{transportChaosReport.totalPacketsSent}
                              </div>
                            </div>
                            <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                              <div className="text-[9px] uppercase text-slate-400">Порядок FIFO</div>
                              <div className="text-sm font-bold font-mono text-blue-600">
                                {transportChaosReport.orderedDeliveryRate}%
                              </div>
                            </div>
                            <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                              <div className="text-[9px] uppercase text-slate-400">Реконект</div>
                              <div className="text-sm font-bold font-mono text-purple-600">
                                {transportChaosReport.reconnectSuccessRate}%
                              </div>
                            </div>
                          </div>

                          {/* Quantiles breakdown */}
                          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            <div className="text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                              Квантилі затримок транспорту (MathCore.Stats)
                            </div>
                            <div className="flex justify-between font-mono text-[10px] text-slate-600 dark:text-slate-400">
                              <span>p50: <b className="text-slate-900 dark:text-slate-100">{transportChaosReport.latencyStats.p50} мс</b></span>
                              <span>p95: <b className="text-slate-900 dark:text-slate-100">{transportChaosReport.latencyStats.p95} мс</b></span>
                              <span>p99: <b className="text-red-500">{transportChaosReport.latencyStats.p99} мс</b></span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: STREAMING TRANSPORT */}
            {activeTab === "streaming_transport" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5 space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Radio className="w-4 h-4 text-emerald-500" />
                      Стан транспорту та стрімінгу
                    </h3>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-700">
                        <span className="text-slate-500">Протокол</span>
                        <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">Server-Sent Events (SSE) + HTTP Chunked</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-700">
                        <span className="text-slate-500">Ідентифікатор сесії</span>
                        <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">{sessionId}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-700">
                        <span className="text-slate-500">Латентність (RTT)</span>
                        <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">{latency > 0 ? `${latency} мс` : "24 мс"}</span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-slate-500">Відмовостійкість</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">Автоматичний реконект + Буферний Replay</span>
                      </div>
                    </div>

                    <button
                      onClick={handleTestLiveStream}
                      disabled={isStreamTestRunning}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 mt-4"
                    >
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      {isStreamTestRunning ? "Стрімінг відповіді триває..." : "Запустити тестовий стрім (/api/stream)"}
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-7 space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Terminal className="w-3.5 h-3.5 text-red-600" />
                        Потік отриманих токенів у реальному часі
                      </h4>
                      {streamMetrics && (
                        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                          {streamMetrics.totalTokens} токенів • {streamMetrics.tokensPerSecond} токенів/с
                        </span>
                      )}
                    </div>

                    <div className="flex-1 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-sans text-xs leading-relaxed text-slate-800 dark:text-slate-200 min-h-[300px] overflow-y-auto whitespace-pre-wrap scrollbar-hide">
                      {streamedTestOutput || (
                        <span className="text-slate-400 italic">
                          Натисніть «Запустити тестовий стрім» для перевірки стрімінгу частин слів та токенів...
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex justify-between items-center text-xs text-slate-500">
            <span>Екосистема «Пані Думка» • OpenClaw Architectural Alignment</span>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer"
            >
              Закрити
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
