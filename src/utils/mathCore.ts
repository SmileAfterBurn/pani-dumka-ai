/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * MathCore: Архітектурний модуль математичних та статистичних обчислень
 * для екосистеми «Пані Думка» (Data Agent, Science Agent, OSINT Profiler).
 * Базується на еталонних алгоритмах стандартної бібліотеки Go (math, math/bits, math/rand/v2).
 */

// ============================================================================
// 1. БІТОВІ ОПЕРАЦІЇ ТА ШВИДКА АРИФМЕТИКА (Go `math/bits`)
// ============================================================================

export const Bits = {
  /**
   * Кількість встановлених одиничних бітів у 32-бітному числі (Population Count / Hamming Weight).
   * Еквівалент bits.OnesCount32 у Go.
   */
  onesCount32(x: number): number {
    x = x >>> 0;
    x = x - ((x >>> 1) & 0x55555555);
    x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
    x = (x + (x >>> 4)) & 0x0f0f0f0f;
    x = x + (x >>> 8);
    x = x + (x >>> 16);
    return x & 0x3f;
  },

  /**
   * Кількість провідних нульових бітів (Leading Zeros).
   * Еквівалент bits.LeadingZeros32 у Go.
   */
  leadingZeros32(x: number): number {
    x = x >>> 0;
    if (x === 0) return 32;
    return 31 - Math.floor(Math.log2(x));
  },

  /**
   * Кількість завершальних нульових бітів (Trailing Zeros).
   * Еквівалент bits.TrailingZeros32 у Go.
   */
  trailingZeros32(x: number): number {
    x = x >>> 0;
    if (x === 0) return 32;
    return Bits.onesCount32((x & -x) - 1);
  },

  /**
   * Циклічний зсув вліво (Rotate Left).
   * Еквівалент bits.RotateLeft32 у Go.
   */
  rotateLeft32(x: number, k: number): number {
    const s = k & 31;
    return ((x << s) | (x >>> (32 - s))) >>> 0;
  }
};

// ============================================================================
// 2. ДЕСКРИПТИВНА ТА СТАТИСТИЧНА АНАЛІТИКА (Go `math` & Welford algorithm)
// ============================================================================

export interface SummaryStatistics {
  count: number;
  min: number;
  max: number;
  sum: number;
  mean: number;
  variance: number;
  stdDev: number;
  median: number;
  q1: number;
  q3: number;
  iqr: number;
  skewness: number;
  kurtosis: number;
}

export const Stats = {
  /**
   * Середнє арифметичне значення вибірки.
   */
  mean(data: number[]): number {
    if (data.length === 0) return 0;
    const sum = data.reduce((acc, val) => acc + val, 0);
    return sum / data.length;
  },

  /**
   * Чисельно стабільне обчислення дисперсії та стандартного відхилення
   * за алгоритмом Велфорда (Welford's Algorithm), що мінімізує похибку округлення.
   */
  welfordVariance(data: number[], isSample = true): { mean: number; variance: number; stdDev: number } {
    const n = data.length;
    if (n === 0) return { mean: 0, variance: 0, stdDev: 0 };
    if (n === 1) return { mean: data[0], variance: 0, stdDev: 0 };

    let count = 0;
    let mean = 0;
    let m2 = 0;

    for (const x of data) {
      count++;
      const delta = x - mean;
      mean += delta / count;
      const delta2 = x - mean;
      m2 += delta * delta2;
    }

    const variance = isSample ? m2 / (count - 1) : m2 / count;
    return {
      mean,
      variance,
      stdDev: Math.sqrt(variance)
    };
  },

  /**
   * Медіана та квартилі вибірки.
   */
  quantiles(data: number[]): { min: number; q1: number; median: number; q3: number; max: number; iqr: number } {
    if (data.length === 0) {
      return { min: 0, q1: 0, median: 0, q3: 0, max: 0, iqr: 0 };
    }

    const sorted = [...data].sort((a, b) => a - b);
    const n = sorted.length;

    const getPercentile = (p: number): number => {
      const pos = (n - 1) * p;
      const base = Math.floor(pos);
      const rest = pos - base;
      if (sorted[base + 1] !== undefined) {
        return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
      }
      return sorted[base];
    };

    const min = sorted[0];
    const max = sorted[n - 1];
    const q1 = getPercentile(0.25);
    const median = getPercentile(0.50);
    const q3 = getPercentile(0.75);
    const iqr = q3 - q1;

    return { min, q1, median, q3, max, iqr };
  },

  /**
   * Комплексний аналіз вибірки (Повний звіт для Data Agent).
   */
  describe(data: number[]): SummaryStatistics {
    if (data.length === 0) {
      return {
        count: 0, min: 0, max: 0, sum: 0, mean: 0, variance: 0,
        stdDev: 0, median: 0, q1: 0, q3: 0, iqr: 0, skewness: 0, kurtosis: 0
      };
    }

    const n = data.length;
    const sum = data.reduce((acc, v) => acc + v, 0);
    const { mean, variance, stdDev } = Stats.welfordVariance(data, true);
    const { min, q1, median, q3, max, iqr } = Stats.quantiles(data);

    // Асиметрія (Skewness) та ексцес (Kurtosis)
    let m3 = 0;
    let m4 = 0;
    if (stdDev > 0 && n > 2) {
      for (const val of data) {
        const diff = (val - mean) / stdDev;
        m3 += Math.pow(diff, 3);
        m4 += Math.pow(diff, 4);
      }
      m3 = (n / ((n - 1) * (n - 2))) * m3;
      m4 = ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * m4 - (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3));
    }

    return {
      count: n,
      min,
      max,
      sum,
      mean,
      variance,
      stdDev,
      median,
      q1,
      q3,
      iqr,
      skewness: Number.isFinite(m3) ? m3 : 0,
      kurtosis: Number.isFinite(m4) ? m4 : 0
    };
  },

  /**
   * Z-Score нормалізація (стандартизація даних).
   */
  zScoreNormalize(data: number[]): number[] {
    const { mean, stdDev } = Stats.welfordVariance(data);
    if (stdDev === 0) return data.map(() => 0);
    return data.map(x => (x - mean) / stdDev);
  },

  /**
   * Min-Max масштабування в діапазон [0, 1].
   */
  minMaxScale(data: number[]): number[] {
    if (data.length === 0) return [];
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min;
    if (range === 0) return data.map(() => 0.5);
    return data.map(x => (x - min) / range);
  }
};

// ============================================================================
// 3. ТЕОРІЯ ІНФОРМАЦІЇ, ЕНТРОПІЯ ТА МЕТРИКИ ПОДІБНОСТІ (Security / Osint)
// ============================================================================

export const InfoTheory = {
  /**
   * Ентропія Шеннона для довільного рядка або масиву байтів (в бітах на символ).
   * Використовується Security Agent для виявлення зашифрованих/обфускованих ключів та паролів.
   */
  shannonEntropy(input: string | Uint8Array): number {
    if (input.length === 0) return 0;

    const frequencies = new Map<number | string, number>();
    const total = input.length;

    for (let i = 0; i < total; i++) {
      const char = input[i];
      frequencies.set(char, (frequencies.get(char) || 0) + 1);
    }

    let entropy = 0;
    for (const count of frequencies.values()) {
      const p = count / total;
      if (p > 0) {
        entropy -= p * Math.log2(p);
      }
    }

    return entropy;
  },

  /**
   * Косинусна схожість (Cosine Similarity) між двома числовими векторами.
   * Використовується для семантичного пошуку та векторних порівнянь.
   */
  cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length || vecA.length === 0) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dotProduct / denom;
  },

  /**
   * Коефіцієнт лінійної кореляції Пірсона (Pearson Correlation).
   */
  pearsonCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length < 2) return 0;

    const n = x.length;
    const meanX = Stats.mean(x);
    const meanY = Stats.mean(y);

    let num = 0;
    let denX = 0;
    let denY = 0;

    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX;
      const dy = y[i] - meanY;
      num += dx * dy;
      denX += dx * dx;
      denY += dy * dy;
    }

    const den = Math.sqrt(denX) * Math.sqrt(denY);
    return den === 0 ? 0 : num / den;
  },

  /**
   * Індекс схожості Жаккара (Jaccard Index) для множин.
   */
  jaccardSimilarity<T>(setA: Set<T> | T[], setB: Set<T> | T[]): number {
    const a = setA instanceof Set ? setA : new Set(setA);
    const b = setB instanceof Set ? setB : new Set(setB);

    if (a.size === 0 && b.size === 0) return 1.0;

    let intersectionSize = 0;
    for (const item of a) {
      if (b.has(item)) {
        intersectionSize++;
      }
    }

    const unionSize = a.size + b.size - intersectionSize;
    return unionSize === 0 ? 0 : intersectionSize / unionSize;
  }
};

// ============================================================================
// 4. ГРАФОВИЙ АНАЛІЗ ТА ЗВАЖЕНІ МЕРЕЖІ (OSINT Profiler Agent)
// ============================================================================

export interface GraphEdge {
  from: string;
  to: string;
  weight: number;
}

export class WeightedGraph {
  private nodes: Set<string> = new Set();
  private adjacency: Map<string, Map<string, number>> = new Map();

  addNode(id: string): void {
    this.nodes.add(id);
    if (!this.adjacency.has(id)) {
      this.adjacency.set(id, new Map());
    }
  }

  addEdge(from: string, to: string, weight = 1.0, bidirectional = false): void {
    this.addNode(from);
    this.addNode(to);

    this.adjacency.get(from)!.set(to, weight);
    if (bidirectional) {
      this.adjacency.get(to)!.set(from, weight);
    }
  }

  getNodes(): string[] {
    return Array.from(this.nodes);
  }

  getNeighbors(node: string): Array<{ node: string; weight: number }> {
    const map = this.adjacency.get(node);
    if (!map) return [];
    return Array.from(map.entries()).map(([target, weight]) => ({ node: target, weight }));
  }

  /**
   * Розрахунок центральності вузлів методом PageRank (Power Iteration).
   * Виявляє найвпливовіші персони чи вузли в досьє OSINT Profiler.
   */
  pageRank(dampingFactor = 0.85, maxIterations = 50, tolerance = 1e-6): Map<string, number> {
    const nodeIds = this.getNodes();
    const n = nodeIds.length;
    if (n === 0) return new Map();

    let ranks = new Map<string, number>();
    const initialRank = 1.0 / n;
    for (const node of nodeIds) {
      ranks.set(node, initialRank);
    }

    for (let iter = 0; iter < maxIterations; iter++) {
      const nextRanks = new Map<string, number>();
      let danglingSum = 0;

      // Підрахунок вихідних ваг для кожного вузла
      for (const node of nodeIds) {
        const neighbors = this.adjacency.get(node);
        if (!neighbors || neighbors.size === 0) {
          danglingSum += ranks.get(node) || 0;
        }
      }

      for (const target of nodeIds) {
        let incomingSum = 0;
        for (const source of nodeIds) {
          const neighbors = this.adjacency.get(source);
          if (neighbors && neighbors.has(target)) {
            const outDegree = neighbors.size;
            incomingSum += (ranks.get(source) || 0) / outDegree;
          }
        }

        const newRank = ((1.0 - dampingFactor) / n) +
          dampingFactor * (incomingSum + danglingSum / n);
        nextRanks.set(target, newRank);
      }

      // Перевірка збіжності
      let diff = 0;
      for (const node of nodeIds) {
        diff += Math.abs((nextRanks.get(node) || 0) - (ranks.get(node) || 0));
      }

      ranks = nextRanks;
      if (diff < tolerance) break;
    }

    return ranks;
  }

  /**
   * Найкоротший шлях між двома вузлами (Алгоритм Дейкстри).
   */
  dijkstraShortestPath(startNode: string, targetNode: string): { path: string[]; distance: number } | null {
    if (!this.nodes.has(startNode) || !this.nodes.has(targetNode)) return null;

    const distances = new Map<string, number>();
    const previous = new Map<string, string | null>();
    const unvisited = new Set<string>(this.nodes);

    for (const node of this.nodes) {
      distances.set(node, node === startNode ? 0 : Infinity);
      previous.set(node, null);
    }

    while (unvisited.size > 0) {
      // Знаходимо невідвіданий вузол з мінімальною дистанцією
      let closestNode: string | null = null;
      let minDistance = Infinity;

      for (const node of unvisited) {
        const dist = distances.get(node)!;
        if (dist < minDistance) {
          minDistance = dist;
          closestNode = node;
        }
      }

      if (!closestNode || minDistance === Infinity) break;
      if (closestNode === targetNode) break;

      unvisited.delete(closestNode);

      const neighbors = this.getNeighbors(closestNode);
      for (const { node: neighbor, weight } of neighbors) {
        if (!unvisited.has(neighbor)) continue;

        const alt = distances.get(closestNode)! + weight;
        if (alt < distances.get(neighbor)!) {
          distances.set(neighbor, alt);
          previous.set(neighbor, closestNode);
        }
      }
    }

    const totalDistance = distances.get(targetNode);
    if (totalDistance === undefined || totalDistance === Infinity) return null;

    // Відновлення шляху
    const path: string[] = [];
    let current: string | null = targetNode;
    while (current) {
      path.unshift(current);
      current = previous.get(current) || null;
    }

    return { path, distance: totalDistance };
  }
}

// ============================================================================
// 5. ДЕТЕРМІНІСТИЧНИЙ ГЕНЕРАТОР ВИПАДКОВИХ ЧИСЕЛ (Go `math/rand/v2` PCG)
// ============================================================================

/**
 * Швидкий детерміністичний генератор псевдовипадкових чисел
 * з підтримкою сидів (Seed) для повторюваних симуляцій у Game Master / Data Agent.
 */
export class DeterministicRandom {
  private state: bigint;
  private inc: bigint;

  constructor(seed = 42n, sequence = 54n) {
    this.state = 0n;
    this.inc = (sequence << 1n) | 1n;
    this.nextUint32();
    this.state = this.state + seed;
    this.nextUint32();
  }

  /**
   * Генерація наступного 32-бітного псевдовипадкового цілого числа (PCG-XSH-RR).
   */
  nextUint32(): number {
    const oldState = this.state;
    this.state = (oldState * 6364136223846793005n + this.inc) & 0xFFFFFFFFFFFFFFFFn;
    const xorShifted = Number(((oldState >> 18n) ^ oldState) >> 27n) >>> 0;
    const rot = Number(oldState >> 59n);
    return Bits.rotateLeft32(xorShifted, 32 - rot);
  }

  /**
   * Випадкове число з плаваючою комою в діапазоні [0, 1).
   */
  nextFloat(): number {
    return this.nextUint32() / 4294967296;
  }

  /**
   * Випадкове ціле число в діапазоні [min, max].
   */
  rangeInt(min: number, max: number): number {
    return min + Math.floor(this.nextFloat() * (max - min + 1));
  }
}

/**
 * Єдиний уніфікований експорт MathCore для агентів екосистеми
 */
export const MathCore = {
  Bits,
  Stats,
  InfoTheory,
  WeightedGraph,
  DeterministicRandom
};

