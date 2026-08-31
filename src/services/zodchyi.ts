/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Рушій «Зодчий» (Zodchyi Core Engine)
 * Автономний декомпозитор цілей, побудова Ортографа завдань (Task DAG) 
 * та формування Плану реалізації для мультимодальної екосистеми «Пані Думка».
 */

import { AgentTag, AgentId } from "./a2aProtocol";
import { QualityGateResult, runQualityGates } from "./qualityGates";
import { logPaperworkSession, PaperworkRecord } from "./paperwork";

export interface TaskNode {
  id: string;
  title: string;
  agentTag: AgentTag;
  agentId: AgentId;
  description: string;
  status: "PENDING" | "IN_PROGRESS" | "PASSED" | "FAILED";
  inputContract: string;
  outputResult?: string;
  dependencies: string[]; // IDs of required previous task nodes
  qualityGateResults?: QualityGateResult[];
  retryCount: number;
}

export interface TaskOrtograf {
  id: string;
  goal: string;
  planRealization: string; // План реалізації у Markdown
  nodes: TaskNode[];
  status: "PLANNING" | "EXECUTING" | "VERIFYING" | "COMPLETED" | "FAILED";
  createdAt: number;
  updatedAt: number;
}

/**
 * Створити Ортограф завдань та План реалізації за запитом користувача
 */
export async function createZodchyiPlan(goal: string): Promise<TaskOrtograf> {
  const timestamp = Date.now();
  const ortografId = `ortograf_${timestamp}_${Math.random().toString(36).substring(2, 7)}`;

  // Аналізуємо запит та визначаємо релевантні етапи виконання
  const lowerGoal = goal.toLowerCase();

  const nodes: TaskNode[] = [];

  // Етап 1: Декомпозиція та ТЗ (Task Agent)
  nodes.push({
    id: "step-1-spec",
    title: "Формулювання технічних вимог та контракту",
    agentTag: "@task",
    agentId: "task",
    description: "Аналіз мети та декомпозиція на чіткі інструкції та вхідні контракти.",
    status: "PENDING",
    inputContract: `Мета: ${goal}`,
    dependencies: [],
    retryCount: 0
  });

  // Етап 2: Архітектура та Розробка (Code Agent / Data Agent / Osint Agent)
  if (lowerGoal.includes("код") || lowerGoal.includes("компонент") || lowerGoal.includes("функц") || lowerGoal.includes("архітектур") || lowerGoal.includes("розроб")) {
    nodes.push({
      id: "step-2-dev",
      title: "Розробка архітектурного рішення та коду",
      agentTag: "@code",
      agentId: "code",
      description: "Написання продуктового коду відповідно до специфікації.",
      status: "PENDING",
      inputContract: "Очікується ТЗ від @task",
      dependencies: ["step-1-spec"],
      retryCount: 0
    });
  } else if (lowerGoal.includes("дані") || lowerGoal.includes("аналіз") || lowerGoal.includes("таблиц") || lowerGoal.includes("sql")) {
    nodes.push({
      id: "step-2-dev",
      title: "Аналіз масивів даних та статистичне оброблення",
      agentTag: "@data",
      agentId: "data",
      description: "Аналіз даних, побудова запросів та обчислення статистик.",
      status: "PENDING",
      inputContract: "Очікується ТЗ від @task",
      dependencies: ["step-1-spec"],
      retryCount: 0
    });
  } else if (lowerGoal.includes("розвідка") || lowerGoal.includes("досьє") || lowerGoal.includes("джерел")) {
    nodes.push({
      id: "step-2-dev",
      title: "OSINT розвідка та аналіз джерел",
      agentTag: "@osint",
      agentId: "osint",
      description: "Пошук та кореляція даних у відкритих джерелах.",
      status: "PENDING",
      inputContract: "Очікується ТЗ від @task",
      dependencies: ["step-1-spec"],
      retryCount: 0
    });
  } else {
    nodes.push({
      id: "step-2-dev",
      title: "Синтез основного розв'язку та логічний аналіз",
      agentTag: "@chat",
      agentId: "chat",
      description: "Аналітичний розбір та підготовка фундаментальної відповіді.",
      status: "PENDING",
      inputContract: "Очікується ТЗ від @task",
      dependencies: ["step-1-spec"],
      retryCount: 0
    });
  }

  // Етап 3: Перевірка Безпеки (Security Agent - Луцик)
  nodes.push({
    id: "step-3-security",
    title: "Аудит безпеки та перевірка ентропії (Луцик)",
    agentTag: "@security",
    agentId: "security",
    description: "Аудит ентропії за Шенноном та перевірка на загрози / вразливості.",
    status: "PENDING",
    inputContract: "Вміст для аудиту з етапу розробки",
    dependencies: ["step-2-dev"],
    retryCount: 0
  });

  // Етап 4: Контроль якості та фаззінг (QA Agent)
  nodes.push({
    id: "step-4-qa",
    title: "Контроль якості та детермінована верифікація",
    agentTag: "@qa",
    agentId: "qa",
    description: "Перевірка типів, логічної цілісності та проходження Quality Gates.",
    status: "PENDING",
    inputContract: "Вміст розробки та аудит безпеки",
    dependencies: ["step-3-security"],
    retryCount: 0
  });

  // Формуємо План реалізації у форматованому Markdown
  const planRealization = generatePlanRealizationMarkdown(goal, nodes);

  return {
    id: ortografId,
    goal,
    planRealization,
    nodes,
    status: "PLANNING",
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

/**
 * Згенерувати План реалізації у форматованому Markdown
 */
function generatePlanRealizationMarkdown(goal: string, nodes: TaskNode[]): string {
  let md = `# 🏛️ План реалізації «Зодчий»\n\n`;
  md += `**Головна мета:** ${goal}\n\n`;
  md += `### 📐 Ортограф завдань (Task DAG):\n\n`;

  nodes.forEach((node, idx) => {
    md += `${idx + 1}. **[${node.agentTag}] ${node.title}**\n`;
    md += `   - *Опис:* ${node.description}\n`;
    md += `   - *Залежності:* ${node.dependencies.length > 0 ? node.dependencies.join(", ") : "Немає"}\n\n`;
  });

  return md;
}

/**
 * Виконати автономне проходження Ортографа завдань з Гейтами Якості
 */
export async function executeZodchyiPipeline(
  ortograf: TaskOrtograf,
  executorCallback: (node: TaskNode, boundContext: string) => Promise<string>
): Promise<{ ortograf: TaskOrtograf; paperwork: PaperworkRecord }> {
  const startTime = Date.now();
  ortograf.status = "EXECUTING";
  ortograf.updatedAt = startTime;

  let accumulatedContext = `Головна мета: ${ortograf.goal}\n\n`;

  for (const node of ortograf.nodes) {
    node.status = "IN_PROGRESS";

    // Створюємо ізольований контекст для вузького sub-агента (Bounded Context)
    const boundContext = `[ІЗОЛЬОВАНИЙ КОНТЕКСТ ДЛЯ ${node.agentTag}]\n` +
      `Завдання: ${node.title}\n` +
      `Опис: ${node.description}\n` +
      `Попередні результати:\n${accumulatedContext}`;

    let nodeSuccess = false;
    let attempts = 0;
    const maxAttempts = 3;

    while (!nodeSuccess && attempts < maxAttempts) {
      attempts++;
      node.retryCount = attempts - 1;

      // 1. Виконання завдання sub-агентом
      const rawResult = await executorCallback(node, boundContext);
      node.outputResult = rawResult;

      // 2. Автономне перевіряння через Гейти Якості (Quality Gates)
      const gateResults = await runQualityGates(rawResult, node.agentId);
      node.qualityGateResults = gateResults;

      const allGatesPassed = gateResults.every((g) => g.passed);

      if (allGatesPassed) {
        node.status = "PASSED";
        nodeSuccess = true;
        accumulatedContext += `\n--- Результат етапу "${node.title}" (${node.agentTag}) ---\n${rawResult}\n`;
      } else {
        console.warn(`[Зодчий] Вузол ${node.id} не пройшов гейти якості (Спроба ${attempts}/${maxAttempts}).`);
        if (attempts >= maxAttempts) {
          node.status = "FAILED";
          ortograf.status = "FAILED";
        }
      }
    }

    if (!nodeSuccess) {
      break;
    }
  }

  if (ortograf.nodes.every((n) => n.status === "PASSED")) {
    ortograf.status = "COMPLETED";
  }

  ortograf.updatedAt = Date.now();

  // Фіксуємо аудит-запис у Paperwork
  const allGateResults = ortograf.nodes.flatMap((n) => n.qualityGateResults || []);
  const paperworkRecord: PaperworkRecord = {
    id: `paperwork_${ortograf.id}`,
    timestamp: Date.now(),
    traceId: ortograf.id,
    goal: ortograf.goal,
    ortografSummary: generatePlanRealizationMarkdown(ortograf.goal, ortograf.nodes),
    gateResults: allGateResults,
    finalArtifact: accumulatedContext,
    durationMs: Date.now() - startTime
  };

  logPaperworkSession(paperworkRecord);

  return { ortograf, paperwork: paperworkRecord };
}

/**
 * Експортувати Ортограф завдань у Markdown для відображення у Потоці
 */
export function exportOrtografToMarkdown(ortograf: TaskOrtograf): string {
  let md = `# 🏛️ Рушій «Зодчий»: Статус Ортографа завдань\n\n`;
  md += `**Статус системи:** \`${ortograf.status}\` | **ID:** \`${ortograf.id}\`\n\n`;
  md += `### 🎯 План реалізації:\n\n`;

  ortograf.nodes.forEach((node) => {
    const statusIcon =
      node.status === "PASSED" ? "✅" :
      node.status === "IN_PROGRESS" ? "⏳" :
      node.status === "FAILED" ? "❌" : "⏸️";

    md += `#### ${statusIcon} **[${node.agentTag}] ${node.title}**\n`;
    md += `- **Статус:** ${node.status} ${node.retryCount > 0 ? `(Спроб: ${node.retryCount + 1})` : ""}\n`;
    md += `- **Опис:** ${node.description}\n`;

    if (node.qualityGateResults && node.qualityGateResults.length > 0) {
      md += `- **Гейти Якості:**\n`;
      node.qualityGateResults.forEach((gate) => {
        const gateIcon = gate.passed ? "🟢" : "🔴";
        md += `  - ${gateIcon} \`${gate.gateType}\`: ${gate.verdict} (Оцінка: ${gate.score}/100)\n`;
      });
    }

    if (node.outputResult) {
      md += `\n<details><summary>📄 Переглянути результат етапу</summary>\n\n\`\`\`text\n${node.outputResult.substring(0, 500)}${node.outputResult.length > 500 ? "..." : ""}\n\`\`\`\n</details>\n`;
    }
    md += `\n---\n`;
  });

  return md;
}
