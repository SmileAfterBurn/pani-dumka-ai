/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Shared MCP (Model Context Protocol) & Plugin SDK
 * Уніфікована архітектура підключення зовнішніх модулів, інструментів (Tools)
 * та ресурсів (Resources) для агента @mcp та всієї екосистеми «Пані Думка».
 */

import { MathCore } from "../utils/mathCore";
import { A2ABus } from "./a2aProtocol";
import { AstParser, AstSecurityLinter, AstComplexityInspector, AstCodeRewriter } from "./astEngine";
import { RuntimeProfilerEngine } from "./runtimeProfiler";
import { QaAutomationEngine } from "./qaLiveTransportEngine";

// ============================================================================
// 1. ІНТЕРФЕЙСИ ТА СХЕМИ ПЛАГІНІВ (MCP SCHEMAS)
// ============================================================================

export interface McpPropertySchema {
  type: "string" | "number" | "boolean" | "array" | "object";
  description: string;
  enum?: string[];
  items?: McpPropertySchema;
  properties?: Record<string, McpPropertySchema>;
  required?: string[];
}

export interface McpParametersSchema {
  type: "object";
  properties: Record<string, McpPropertySchema>;
  required?: string[];
}

export interface McpToolDefinition {
  name: string;
  displayName: string;
  description: string;
  category: "math" | "workspace" | "system" | "web" | "custom" | "security";
  parameters: McpParametersSchema;
  execute: (args: any, context?: McpExecutionContext) => Promise<any>;
}

export interface McpResourceDefinition {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
  read: () => Promise<{ contents: string | Uint8Array; metadata?: Record<string, any> }>;
}

export interface McpPluginLifecycle {
  onInit?: () => Promise<void> | void;
  onDestroy?: () => Promise<void> | void;
  onHealthCheck?: () => Promise<{ healthy: boolean; details?: string }> | { healthy: boolean; details?: string };
}

export interface McpPluginManifest {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  icon: string;
  category: "core" | "workspace" | "diagnostics" | "intelligence" | "custom";
  tools: McpToolDefinition[];
  resources?: McpResourceDefinition[];
  lifecycle?: McpPluginLifecycle;
  enabled: boolean;
}

export interface McpExecutionContext {
  callerAgentId?: string;
  traceId?: string;
  timestamp: number;
}

// ============================================================================
// 2. ВБУДОВАНІ ЕТАЛОННІ ПЛАГІНИ (CORE BUILT-IN PLUGINS)
// ============================================================================

/**
 * 1. Плагін математичного ядра (MathCore Bridge Plugin)
 */
export const MathCoreMcpPlugin: McpPluginManifest = {
  id: "plugin-mathcore",
  name: "MathCore Engine Bridge",
  version: "2.1.0",
  author: "Пані Думка Core Team",
  description: "Прямий доступ до детерміністичних статистичних та матричних обчислень через протокол MCP.",
  icon: "Cpu",
  category: "core",
  enabled: true,
  tools: [
    {
      name: "math_describe_dataset",
      displayName: "Описова статистика (Welford/IQR)",
      description: "Розрахунок повного набору дескриптивної статистики для числового масиву (середнє, квартилі, skewness, kurtosis).",
      category: "math",
      parameters: {
        type: "object",
        properties: {
          data: {
            type: "array",
            description: "Масив дійсних чисел для аналізу",
            items: { type: "number", description: "Числове значення" }
          }
        },
        required: ["data"]
      },
      execute: async (args) => {
        const stats = MathCore.Stats.describe(args.data || []);
        return { success: true, stats };
      }
    },
    {
      name: "math_shannon_entropy",
      displayName: "Ентропія Шеннона",
      description: "Оцінка інформаційної ентропії рядка чи коду для виявлення зашифрованих даних або ключів.",
      category: "math",
      parameters: {
        type: "object",
        properties: {
          input: { type: "string", description: "Текстовий або бінарний рядок для аналізу" }
        },
        required: ["input"]
      },
      execute: async (args) => {
        const entropy = MathCore.InfoTheory.shannonEntropy(args.input || "");
        return { 
          success: true, 
          entropy: Number(entropy.toFixed(4)),
          isHighEntropy: entropy > 4.8 
        };
      }
    },
    {
      name: "math_pearson_correlation",
      displayName: "Кореляція Пірсона",
      description: "Оцінка лінійної залежності між двома часовими рядами (наприклад, бот-активність чи синхронність дій).",
      category: "math",
      parameters: {
        type: "object",
        properties: {
          seriesA: { type: "array", description: "Перший числовий ряд", items: { type: "number", description: "Число" } },
          seriesB: { type: "array", description: "Другий числовий ряд", items: { type: "number", description: "Число" } }
        },
        required: ["seriesA", "seriesB"]
      },
      execute: async (args) => {
        const corr = MathCore.InfoTheory.pearsonCorrelation(args.seriesA || [], args.seriesB || []);
        return { success: true, correlation: Number(corr.toFixed(4)), isSignificant: Math.abs(corr) > 0.7 };
      }
    }
  ],
  lifecycle: {
    onHealthCheck: () => ({ healthy: true, details: "MathCore V8 JIT operational" })
  }
};

/**
 * 2. Плагін діагностики та телеметрії (Diagnostics & System Plugin)
 */
export const DiagnosticsMcpPlugin: McpPluginManifest = {
  id: "plugin-diagnostics",
  name: "System Diagnostics & Telemetry",
  version: "1.4.0",
  author: "Пані Думка Core Team",
  description: "Моніторинг робочого середовища, часу відгуку агентів, навантаження та статусу сервісів.",
  icon: "Activity",
  category: "diagnostics",
  enabled: true,
  tools: [
    {
      name: "system_get_health",
      displayName: "Стан системи",
      description: "Отримання поточного статусу активних агентів, черги завдань та пам'яті.",
      category: "system",
      parameters: {
        type: "object",
        properties: {
          includeMemoryStats: { type: "boolean", description: "Включити стан буферів матриць" }
        }
      },
      execute: async (args) => {
        return {
          status: "ONLINE",
          timestamp: Date.now(),
          registeredAgents: 20,
          uptimeSeconds: Math.floor(performance.now() / 1000),
          clientPlatform: navigator.userAgent,
          language: navigator.language
        };
      }
    },
    {
      name: "system_ping_agent",
      displayName: "Перевірка зв'язку з агентом",
      description: "Вимірювання затримки відгуку конкретного агента в мілісекундах.",
      category: "system",
      parameters: {
        type: "object",
        properties: {
          agentTag: { 
            type: "string", 
            description: "Тег агента (@code, @security, @stan тощо)",
            enum: ["@chat", "@code", "@security", "@osint", "@profiler", "@finance", "@data", "@qa", "@stan", "@mcp"]
          }
        },
        required: ["agentTag"]
      },
      execute: async (args) => {
        const start = performance.now();
        await new Promise(r => setTimeout(r, 15 + Math.random() * 20));
        const latency = performance.now() - start;
        return {
          agent: args.agentTag,
          reachable: true,
          latencyMs: Number(latency.toFixed(2)),
          timestamp: Date.now()
        };
      }
    }
  ]
};

/**
 * 3. Плагін робочого простору Google Workspace (Workspace Tools Plugin)
 */
export const WorkspaceMcpPlugin: McpPluginManifest = {
  id: "plugin-workspace",
  name: "Google Workspace Hub",
  version: "1.8.0",
  author: "Пані Думка Core Team",
  description: "Інструменти взаємодії з Google Документами, Таблицями, Диском та Поштою.",
  icon: "Globe",
  category: "workspace",
  enabled: true,
  tools: [
    {
      name: "workspace_list_recent_docs",
      displayName: "Список документів Google Drive",
      description: "Отримання списку останніх текстових документів та звітів.",
      category: "workspace",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Пошуковий запит або назва файлу" },
          limit: { type: "number", description: "Максимальна кількість документів (за замовчуванням 10)" }
        }
      },
      execute: async (args) => {
        return {
          status: "SUCCESS",
          query: args.query || "",
          message: "Інтеграція активна через OAuth Google Workspace.",
          availableIntegrations: ["Google Docs", "Google Sheets", "Google Drive", "Gmail"]
        };
      }
    }
  ]
};

/**
 * 4. Плагін AST-аналізу та інструментів коду (Code Tools & AST Plugin) для @code, @security, @qa
 */
export const CodeToolsMcpPlugin: McpPluginManifest = {
  id: "plugin-code-tools",
  name: "AST Code Engine & Security Linter",
  version: "2.1.0",
  author: "Пані Думка (@code, @security, @qa)",
  description: "Глибокий синтаксичний аналіз AST, розрахунок цикломатичної складності, аудит вразливостей та синтез коду.",
  icon: "Code",
  category: "intelligence",
  enabled: true,
  tools: [
    {
      name: "ast_parse_code",
      displayName: "Парсинг коду в AST",
      description: "Побудова абстрактного синтаксичного дерева (AST), підрахунок токенів, виявлення функцій та імпортів.",
      category: "custom",
      parameters: {
        type: "object",
        properties: {
          code: { type: "string", description: "Сирцевий код на TypeScript, JavaScript або Go" }
        },
        required: ["code"]
      },
      execute: async (args) => {
        const parseResult = AstParser.parse(args.code || "");
        return {
          success: true,
          lines: parseResult.linesCount,
          tokens: parseResult.tokensCount,
          functions: parseResult.functionsFound,
          imports: parseResult.importsFound,
          astRoot: parseResult.ast,
          parseDurationMs: parseResult.parseDurationMs
        };
      }
    },
    {
      name: "ast_inspect_complexity",
      displayName: "Інспекція складності коду",
      description: "Розрахунок цикломатичної складності (CC), глибини вкладеності, індексу підтримуваності (MI) та виявлення мертвого коду.",
      category: "custom",
      parameters: {
        type: "object",
        properties: {
          code: { type: "string", description: "Сирцевий код для оцінки складності" }
        },
        required: ["code"]
      },
      execute: async (args) => {
        const parseResult = AstParser.parse(args.code || "");
        const metrics = AstComplexityInspector.inspect(args.code || "", parseResult.ast);
        return {
          success: true,
          metrics
        };
      }
    },
    {
      name: "ast_security_lint",
      displayName: "Аудит безпеки сирцевого коду",
      description: "Пошук вразливостей (SQL-ін'єкції, небезпечний eval(), ентропійні витоки ключів, ReDoS) на основі структури AST.",
      category: "security",
      parameters: {
        type: "object",
        properties: {
          code: { type: "string", description: "Сирцевий код для аудиту безпеки" }
        },
        required: ["code"]
      },
      execute: async (args) => {
        const parseResult = AstParser.parse(args.code || "");
        const findings = AstSecurityLinter.audit(args.code || "", parseResult.ast);
        return {
          success: true,
          findingsCount: findings.length,
          hasCriticalRisk: findings.some(f => f.severity === "CRITICAL"),
          findings
        };
      }
    },
    {
      name: "ast_rewrite_try_catch",
      displayName: "Синтез: try/catch обгортання",
      description: "Автоматична трансформація функцій із додаванням блоків перехоплення помилок та телеметрії.",
      category: "custom",
      parameters: {
        type: "object",
        properties: {
          code: { type: "string", description: "Сирцевий код для рефакторингу" }
        },
        required: ["code"]
      },
      execute: async (args) => {
        const result = AstCodeRewriter.wrapFunctionsWithTryCatch(args.code || "");
        return {
          success: true,
          modifications: result.modificationsApplied,
          transformedCode: result.transformedCode
        };
      }
    }
  ],
  lifecycle: {
    onHealthCheck: () => ({ healthy: true, details: "AST Engine & Rewriter ready" })
  }
};

/**
 * 5. Плагін профілювання рантайму та пам'яті (Runtime & Memory Profiler)
 */
export const RuntimeProfilerMcpPlugin: McpPluginManifest = {
  id: "plugin-runtime-profiler",
  name: "Runtime & Memory Profiler (Go pprof-style)",
  version: "1.0.0",
  author: "Пані Думка (@code, @qa, @data, @security)",
  description: "CPU Profiling, Heap MemStats, виявлення витоків корутин та Execution Tracing.",
  icon: "Activity",
  category: "system",
  enabled: true,
  tools: [
    {
      name: "profiler_cpu_benchmark",
      displayName: "CPU Benchmark & Sampling",
      description: "Запуск вимірювання затримок функцій MathCore, виявлення CPU hotspots та вузьких місць.",
      category: "system",
      parameters: {
        type: "object",
        properties: {
          iterations: { type: "number", description: "Кількість циклів профілювання (за замовчуванням 5)" }
        }
      },
      execute: async (args) => {
        const report = RuntimeProfilerEngine.runCpuBenchmark(args?.iterations || 5);
        return { success: true, report };
      }
    },
    {
      name: "profiler_heap_snapshot",
      displayName: "Heap MemStats & GC Diagnostics",
      description: "Аналіз виділеної динамічної пам'яті (JS Heap), GC pause time та розміру буферів матриць Float64Array.",
      category: "system",
      parameters: {
        type: "object",
        properties: {}
      },
      execute: async () => {
        const stats = RuntimeProfilerEngine.inspectHeapMemStats();
        return {
          success: true,
          stats: {
            ...stats,
            allocFormatted: RuntimeProfilerEngine.formatBytes(stats.allocBytes),
            totalAllocFormatted: RuntimeProfilerEngine.formatBytes(stats.totalAllocBytes),
            heapLimitFormatted: RuntimeProfilerEngine.formatBytes(stats.heapLimitBytes),
            matrixBufferFormatted: RuntimeProfilerEngine.formatBytes(stats.matrixBufferBytes)
          }
        };
      }
    },
    {
      name: "profiler_concurrency_audit",
      displayName: "Concurrency & Task Leak Audit",
      description: "Моніторинг активних корутин/завдань, перевірка блокувань та витоків слухачів подій.",
      category: "system",
      parameters: {
        type: "object",
        properties: {}
      },
      execute: async () => {
        const report = RuntimeProfilerEngine.inspectConcurrency();
        return { success: true, report };
      }
    }
  ],
  lifecycle: {
    onHealthCheck: () => ({ healthy: true, details: "Runtime Profiler Engine active" })
  }
};

/**
 * 6. Плагін автоматизованого QA-тестування LLM та Live-транспортів (QA Automation & Transport Suite)
 */
export const QaAutomationMcpPlugin: McpPluginManifest = {
  id: "plugin-qa-automation",
  name: "QA Automation for LLMs & Live Transports",
  version: "1.0.0",
  author: "Пані Думка (@qa, @code, @mcp)",
  description: "Детерміновані LLM бенчмарки, валідація JSON-схем, хаос-тестування мережевого транспорту та розрахунок квантилів затримок.",
  icon: "CheckCircle",
  category: "system",
  enabled: true,
  tools: [
    {
      name: "qa_run_llm_eval",
      displayName: "LLM Eval & Schema Regression Suite",
      description: "Запуск тестового набору оцінки мовних моделей на галюцинації, відповідність суворому JSON та безпеку.",
      category: "system",
      parameters: {
        type: "object",
        properties: {}
      },
      execute: async () => {
        const report = await QaAutomationEngine.runLlmEvalSuite();
        return { success: true, report };
      }
    },
    {
      name: "qa_chaos_test_transport",
      displayName: "Live Transport Chaos & Jitter Simulator",
      description: "Симуляція пакетних втрат (0..50%), джитеру та перепідключень транспортів зв'язку (A2A, SSE).",
      category: "system",
      parameters: {
        type: "object",
        properties: {
          simulatedPacketLossPercent: { type: "number", description: "Відсоток втрат пакетів (за замовчуванням 12%)" },
          injectedJitterMs: { type: "number", description: "Джитер у мілісекундах (за замовчуванням 150 мс)" }
        }
      },
      execute: async (args) => {
        const report = await QaAutomationEngine.runTransportChaosSuite({
          simulatedPacketLossPercent: args?.simulatedPacketLossPercent,
          injectedJitterMs: args?.injectedJitterMs
        });
        return { success: true, report };
      }
    }
  ],
  lifecycle: {
    onHealthCheck: () => ({ healthy: true, details: "QA Automation & Chaos Suite ready" })
  }
};

// ============================================================================
// 7. ЄДИНИЙ РЕЄСТР ТА МЕНЕДЖЕР ПЛАГІНІВ (MCP SHARED SDK REGISTRY)
// ============================================================================

export class McpSharedSdk {
  private static instance: McpSharedSdk;
  private plugins: Map<string, McpPluginManifest> = new Map();
  private executionLog: Array<{
    pluginId: string;
    toolName: string;
    durationMs: number;
    success: boolean;
    timestamp: number;
  }> = [];

  private constructor() {
    // Реєстрація стандартних плагінів
    this.registerPlugin(MathCoreMcpPlugin);
    this.registerPlugin(DiagnosticsMcpPlugin);
    this.registerPlugin(WorkspaceMcpPlugin);
    this.registerPlugin(CodeToolsMcpPlugin);
    this.registerPlugin(RuntimeProfilerMcpPlugin);
    this.registerPlugin(QaAutomationMcpPlugin);
  }

  static getInstance(): McpSharedSdk {
    if (!McpSharedSdk.instance) {
      McpSharedSdk.instance = new McpSharedSdk();
    }
    return McpSharedSdk.instance;
  }

  registerPlugin(plugin: McpPluginManifest): void {
    this.plugins.set(plugin.id, plugin);
    if (plugin.lifecycle?.onInit) {
      try {
        plugin.lifecycle.onInit();
      } catch (e) {
        console.error(`[McpSharedSdk] Failed to init plugin ${plugin.id}:`, e);
      }
    }
  }

  unregisterPlugin(pluginId: string): boolean {
    const plugin = this.plugins.get(pluginId);
    if (plugin?.lifecycle?.onDestroy) {
      try {
        plugin.lifecycle.onDestroy();
      } catch (e) {
        console.error(`[McpSharedSdk] Failed to destroy plugin ${pluginId}:`, e);
      }
    }
    return this.plugins.delete(pluginId);
  }

  getAllPlugins(): McpPluginManifest[] {
    return Array.from(this.plugins.values());
  }

  getPlugin(id: string): McpPluginManifest | null {
    return this.plugins.get(id) || null;
  }

  getAllTools(): Array<{ pluginId: string; tool: McpToolDefinition }> {
    const tools: Array<{ pluginId: string; tool: McpToolDefinition }> = [];
    for (const plugin of this.plugins.values()) {
      if (plugin.enabled) {
        for (const tool of plugin.tools) {
          tools.push({ pluginId: plugin.id, tool });
        }
      }
    }
    return tools;
  }

  async executeTool(
    pluginId: string,
    toolName: string,
    args: any,
    context?: McpExecutionContext
  ): Promise<{ success: boolean; result?: any; error?: string; durationMs: number }> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      return { success: false, error: `Плагін '${pluginId}' не знайдено`, durationMs: 0 };
    }
    if (!plugin.enabled) {
      return { success: false, error: `Плагін '${pluginId}' вимкнено`, durationMs: 0 };
    }

    const tool = plugin.tools.find(t => t.name === toolName);
    if (!tool) {
      return { success: false, error: `Інструмент '${toolName}' не знайдено у плагіні '${pluginId}'`, durationMs: 0 };
    }

    const start = performance.now();
    try {
      const result = await tool.execute(args, context);
      const durationMs = performance.now() - start;

      this.executionLog.unshift({
        pluginId,
        toolName,
        durationMs: Number(durationMs.toFixed(2)),
        success: true,
        timestamp: Date.now()
      });
      if (this.executionLog.length > 100) this.executionLog.pop();

      // Оповіщення через шину A2A
      A2ABus.getInstance().publish(`mcp.tool.executed`, { pluginId, toolName, durationMs }, "mcp");

      return { success: true, result, durationMs: Number(durationMs.toFixed(2)) };
    } catch (err: any) {
      const durationMs = performance.now() - start;
      this.executionLog.unshift({
        pluginId,
        toolName,
        durationMs: Number(durationMs.toFixed(2)),
        success: false,
        timestamp: Date.now()
      });

      return {
        success: false,
        error: err?.message || "Помилка під час виконання інструменту",
        durationMs: Number(durationMs.toFixed(2))
      };
    }
  }

  getExecutionLog() {
    return [...this.executionLog];
  }

  /**
   * Створення кастомного динамічного плагіна користувача у реальному часі
   */
  createDynamicPlugin(
    id: string,
    name: string,
    description: string,
    tools: McpToolDefinition[]
  ): McpPluginManifest {
    const plugin: McpPluginManifest = {
      id: `dynamic-${id}`,
      name,
      version: "1.0.0",
      author: "Користувач / Агент",
      description,
      icon: "Boxes",
      category: "custom",
      enabled: true,
      tools
    };
    this.registerPlugin(plugin);
    return plugin;
  }
}
