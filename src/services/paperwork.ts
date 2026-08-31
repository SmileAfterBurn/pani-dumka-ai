/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Сервіс Paperwork (Аудит-Журнал Та Телеметрія)
 * Фіксація виконання, звітів гейтів якості та збереження артефактів рішень.
 */

import { QualityGateResult } from "./qualityGates";

export interface PaperworkRecord {
  id: string;
  timestamp: number;
  traceId: string;
  goal: string;
  ortografSummary: string;
  gateResults: QualityGateResult[];
  finalArtifact: string;
  durationMs: number;
}

const paperworkLogStorage: PaperworkRecord[] = [];

/**
 * Зафіксувати сесію виконання у аудит-журналі Paperwork
 */
export function logPaperworkSession(record: PaperworkRecord): void {
  paperworkLogStorage.push(record);
  console.log(`[Paperwork] Зафіксовано запис аудиту ID: ${record.id} (Тривалість: ${record.durationMs}ms)`);
}

/**
 * Отримати всі збережені записи Paperwork
 */
export function getPaperworkLogs(): PaperworkRecord[] {
  return [...paperworkLogStorage];
}

/**
 * Згенерувати підсумковий звіт Paperwork у форматованому Markdown
 */
export function exportPaperworkToMarkdown(record: PaperworkRecord): string {
  let md = `# 📜 Аудит-Журнал Paperwork\n\n`;
  md += `**ID Сесії:** \`${record.id}\` | **Дата:** ${new Date(record.timestamp).toLocaleString("uk-UA")}\n`;
  md += `**Тривалість виконання:** ${record.durationMs} ms\n\n`;

  md += `### 🎯 Початкова Мета:\n> ${record.goal}\n\n`;

  md += `### 📐 Зведення Ортографа завдань:\n${record.ortografSummary}\n\n`;

  md += `### 🛡️ Звіт проходження Гейтів Якості (Quality Gates):\n`;
  record.gateResults.forEach((gate) => {
    const gateIcon = gate.passed ? "🟢" : "🔴";
    md += `- ${gateIcon} **[${gate.gateType}]** ${gate.verdict} (Оцінка: ${gate.score}/100)\n`;
    if (gate.findings.length > 0) {
      gate.findings.forEach((f) => {
        md += `  - 🔍 *Зауваження:* ${f}\n`;
      });
    }
  });

  md += `\n---\n*Згенеровано рушієм «Зодчий» екосистеми Пані Думка*\n`;
  return md;
}
