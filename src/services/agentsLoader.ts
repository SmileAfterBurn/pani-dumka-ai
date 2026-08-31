/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Сервіс Динамічного Завантаження Агентів (Agents Loader)
 * Дозволяє Оркестратору зчитувати специфікації з каталогу agents/ за потреби.
 */

import fs from "fs";
import path from "path";

const AGENTS_DIR = path.join(process.cwd(), "agents");

/**
 * Зчитати центральний реєстр агентів (agents_registry.md)
 */
export function readAgentsRegistry(): string {
  const filePath = path.join(AGENTS_DIR, "agents_registry.md");
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, "utf-8");
  }
  return "Реєстр агентів тимчасово недоступний.";
}

/**
 * Зчитати специфікацію конкретного агента (наприклад, lucyk.md, livermor.md, code.md)
 */
export function readAgentSpecification(agentKey: string): string | null {
  const sanitizedKey = agentKey.replace(/[^a-zA-Z0-9_-]/g, "");
  const filePath = path.join(AGENTS_DIR, `${sanitizedKey}.md`);
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, "utf-8");
  }
  return null;
}

/**
 * Отримати список усіх наявних файлів специфікацій агентів
 */
export function listAgentFiles(): string[] {
  if (!fs.existsSync(AGENTS_DIR)) return [];
  return fs.readdirSync(AGENTS_DIR).filter(f => f.endsWith(".md"));
}
