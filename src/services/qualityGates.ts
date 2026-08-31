/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Сервіс Гейтів Якості (Quality Gates Engine)
 * Автономна детермінована перевірка результатів суб-агентів перед видачею.
 */

import { MathCore } from "../utils/mathCore";

export type QualityGateType = 
  | "SECURITY_ENTROPY" 
  | "QA_FUZZING" 
  | "CODE_ARCHITECTURE" 
  | "SPEC_REQUIREMENT";

export interface QualityGateResult {
  gateType: QualityGateType;
  passed: boolean;
  score: number; // 0..100
  verdict: string;
  findings: string[];
  metrics?: Record<string, any>;
}

/**
 * Запустити повний комплекс Гейтів Якості для даного контенту
 */
export async function runQualityGates(content: string, agentType: string = "general"): Promise<QualityGateResult[]> {
  const results: QualityGateResult[] = [];

  // 1. Security & Entropy Gate (Луцик / @security)
  results.push(evaluateSecurityEntropyGate(content));

  // 2. QA & Fuzzing Gate (@qa)
  results.push(evaluateQaFuzzingGate(content));

  // 3. Code & Architecture Gate (@code)
  results.push(evaluateCodeArchitectureGate(content, agentType));

  // 4. Spec Requirement Gate (@task)
  results.push(evaluateSpecRequirementGate(content));

  return results;
}

/**
 * 1. Security Entropy Gate (Аудит ентропії за Шенноном та пошук секретів)
 */
function evaluateSecurityEntropyGate(content: string): QualityGateResult {
  const findings: string[] = [];
  const entropy = MathCore.InfoTheory.shannonEntropy(content);

  // Перевірка на потенційні відкриті API ключі або секрети
  const apiKeyPattern = /(?:sk-[a-zA-Z0-9]{32,}|AIzaSy[a-zA-Z0-9_-]{33}|ghp_[a-zA-Z0-9]{36})/g;
  const matches = content.match(apiKeyPattern);

  if (matches && matches.length > 0) {
    findings.push(`Виявлено потенційно відкриті API-ключі або токени авторизації (${matches.length} шт.).`);
  }

  // Висока ентропія без форматування коду може свідчити обфускацію чи витік токенів
  let passed = true;
  let score = 100;

  if (findings.length > 0) {
    passed = false;
    score = 20;
  } else if (entropy > 5.8 && !content.includes("```")) {
    findings.push(`Високий рівень ентропії (${entropy.toFixed(2)}) у неструктурованому тексті.`);
    score = 75;
  }

  return {
    gateType: "SECURITY_ENTROPY",
    passed,
    score,
    verdict: passed ? "Безпеку підтверджено" : "Виявлено безпекові ризики",
    findings,
    metrics: { shannonEntropy: Number(entropy.toFixed(3)) }
  };
}

/**
 * 2. QA & Fuzzing Gate (Перевірка синтаксичної та логічної цілісності)
 */
function evaluateQaFuzzingGate(content: string): QualityGateResult {
  const findings: string[] = [];
  let score = 100;
  let passed = true;

  if (!content || content.trim().length === 0) {
    findings.push("Порожній вміст відповіді.");
    passed = false;
    score = 0;
    return { gateType: "QA_FUZZING", passed, score, verdict: "Порожня відповідь", findings };
  }

  // Перевірка балансу дужок та лапок у коді
  if (content.includes("```")) {
    const openBraces = (content.match(/\{/g) || []).length;
    const closeBraces = (content.match(/\}/g) || []).length;

    if (Math.abs(openBraces - closeBraces) > 3) {
      findings.push(`Дисбаланс фігурних дужок: відкриваючих ${openBraces}, закриваючих ${closeBraces}.`);
      score -= 30;
    }
  }

  // Перевірка на помилки типів або необроблені винятки в описі
  if (content.includes("TypeError:") || content.includes("Uncaught ReferenceError:")) {
    findings.push("У результаті виявлено незафіксовані помилки виконання JS/TS.");
    score -= 40;
  }

  if (score < 60) {
    passed = false;
  }

  return {
    gateType: "QA_FUZZING",
    passed,
    score,
    verdict: passed ? "Контроль якості пройдено" : "Помилки цілісності коду/даних",
    findings
  };
}

/**
 * 3. Code & Architecture Gate (Перевірка архітектурних стандартів)
 */
function evaluateCodeArchitectureGate(content: string, agentType: string): QualityGateResult {
  const findings: string[] = [];
  let score = 100;
  let passed = true;

  // Якщо агент генерує код
  if (agentType === "code" || content.includes("```typescript") || content.includes("```javascript") || content.includes("```tsx")) {
    if (!content.includes("import ") && !content.includes("export ") && content.length > 500) {
      findings.push("Модульний код не містить явних експортів чи імпортів.");
      score -= 20;
    }

    if (content.includes("// TODO") || content.includes("/* TODO")) {
      findings.push("Код містить незавершені TODO заглушки.");
      score -= 15;
    }
  }

  if (score < 70) {
    passed = false;
  }

  return {
    gateType: "CODE_ARCHITECTURE",
    passed,
    score,
    verdict: passed ? "Архітектурні стандарти дотримано" : "Виявлено відхилення від архітектурних норм",
    findings
  };
}

/**
 * 4. Spec Requirement Gate (Перевірка повноти виконання специфікації)
 */
function evaluateSpecRequirementGate(content: string): QualityGateResult {
  const findings: string[] = [];
  let score = 100;
  let passed = true;

  if (content.length < 50) {
    findings.push("Відповідь занадто коротка для повноцінного виконання завдання.");
    score -= 40;
  }

  if (content.toLowerCase().includes("я не можу") || content.toLowerCase().includes("на жаль, я не знаю")) {
    findings.push("Відповідь містить відмову або невпевненість у виконанні.");
    score -= 50;
  }

  if (score < 60) {
    passed = false;
  }

  return {
    gateType: "SPEC_REQUIREMENT",
    passed,
    score,
    verdict: passed ? "Специфікацію виконано" : "Неповне виконання вимог",
    findings
  };
}
