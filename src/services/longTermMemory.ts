/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Модуль довгострокової пам'яті Пані Думки (3-Tier Memory Architecture).
 * Реалізує принципи з system_prompt/03_memory.md та Python-модуля orchestrator/memory/long_term.py:
 * 1. Семантична пам'ять — факти про користувача (Іллю), проєкти, цілі та уподобання.
 * 2. Епізодична пам'ять — хроніки розмов, контекст SmileAfterBurn та ключові події.
 * 3. Процедурна пам'ять — задачі, статуси, алгоритми та навички (TaskUpdater).
 */

export type MemoryCategory = "semantic" | "episodic" | "procedural";

export type TaskStatus = "pending" | "working" | "completed" | "failed" | "canceled";

export interface FactRecord {
  id: string;
  content: string;
  category: MemoryCategory;
  timestamp: number;
  tags: string[];
}

export interface TaskRecord {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: "low" | "medium" | "high" | "critical";
  assignedAgent?: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Клас управління прогресом задачі TaskUpdater (сумісний з A2A TaskUpdater)
 */
export class TaskUpdater {
  constructor(private memory: LongTermMemoryEngine, private taskId: string) {}

  public startWork(): void {
    this.memory.updateTaskStatus(this.taskId, "working");
  }

  public complete(): void {
    this.memory.updateTaskStatus(this.taskId, "completed");
  }

  public fail(): void {
    this.memory.updateTaskStatus(this.taskId, "failed");
  }

  public cancel(): void {
    this.memory.updateTaskStatus(this.taskId, "canceled");
  }
}

/**
 * Двигун 3-рівневої персистентної пам'яті
 */
export class LongTermMemoryEngine {
  private facts: FactRecord[] = [];
  private tasks: TaskRecord[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const storedFacts = localStorage.getItem("pani_dumka_facts");
      const storedTasks = localStorage.getItem("pani_dumka_tasks");
      if (storedFacts) this.facts = JSON.parse(storedFacts);
      if (storedTasks) this.tasks = JSON.parse(storedTasks);
    } catch (e) {
      console.warn("LongTermMemory storage read notice:", e);
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem("pani_dumka_facts", JSON.stringify(this.facts));
      localStorage.setItem("pani_dumka_tasks", JSON.stringify(this.tasks));
    } catch (e) {
      console.warn("LongTermMemory storage write notice:", e);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Семантична та Епізодична пам'ять
  // ══════════════════════════════════════════════════════════════════════════

  public addFact(content: string, category: MemoryCategory = "semantic", tags: string[] = []): FactRecord {
    const newFact: FactRecord = {
      id: "fact-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      content,
      category,
      timestamp: Date.now(),
      tags
    };
    this.facts.push(newFact);
    this.saveToStorage();
    return newFact;
  }

  public searchFacts(query: string, category?: MemoryCategory): FactRecord[] {
    const q = query.toLowerCase();
    return this.facts.filter(f => {
      const matchesCat = category ? f.category === category : true;
      const matchesQuery = f.content.toLowerCase().includes(q) || f.tags.some(t => t.toLowerCase().includes(q));
      return matchesCat && matchesQuery;
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Процедурна пам'ять та управління задачами
  // ══════════════════════════════════════════════════════════════════════════

  public createTask(
    title: string, 
    description?: string, 
    assignedAgent?: string, 
    priority: "low" | "medium" | "high" | "critical" = "medium"
  ): { task: TaskRecord; updater: TaskUpdater } {
    const newTask: TaskRecord = {
      id: "task-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      title,
      description,
      status: "pending",
      priority,
      assignedAgent,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    this.tasks.push(newTask);
    this.saveToStorage();
    return {
      task: newTask,
      updater: new TaskUpdater(this, newTask.id)
    };
  }

  public updateTaskStatus(taskId: string, status: TaskStatus): void {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.status = status;
      task.updatedAt = Date.now();
      this.saveToStorage();
    }
  }

  public getTasks(status?: TaskStatus): TaskRecord[] {
    if (status) return this.tasks.filter(t => t.status === status);
    return [...this.tasks];
  }
}

export const globalLongTermMemory = new LongTermMemoryEngine();
