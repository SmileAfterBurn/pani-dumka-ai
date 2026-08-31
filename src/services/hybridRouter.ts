/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Гібридний маршрутизатор завдань Пані Думки (Hybrid Router & Composite Pipelines).
 * Перенесено та вдосконалено з Python Оркестратора (orchestrator/core.py):
 * 1. Низьколатентна детермінована перевірка ключових слів (Keyword Map Router).
 * 2. Спрямування медіа-вмісту (Vision Agent).
 * 3. Паралельні (Parallel) та Послідовні (Sequential) композитні пайплайни.
 */

export interface RoutingDecision {
  targetAgent: string;
  agentTag: string;
  confidence: number;
  routingType: "explicit_tag" | "media" | "keyword_fast_path" | "adk_semantic_delegation" | "composite_pipeline";
  pipelineSteps?: string[];
  reason: string;
}

// ══════════════════════════════════════════════════════════════════════════════
// KEYWORD MAPS (з orchestrator/core.py)
// ══════════════════════════════════════════════════════════════════════════════

const KEYWORD_MAPPINGS: Array<{ agent: string; tag: string; keywords: string[] }> = [
  {
    agent: "security",
    tag: "@security",
    keywords: ["безпека", "аудит", "моніторинг", "вразливість", "захист", "луцик", "витік", "security", "audit", "vulnerability", "перевір домен", "перевір ip"]
  },
  {
    agent: "osint",
    tag: "@osint",
    keywords: ["osint", "розвідка", "пошук інформації", "знайди інформацію", "розслідуй", "хто такий", "хто така", "investigate", "whois", "shodan"]
  },
  {
    agent: "profiler",
    tag: "@profiler",
    keywords: ["досьє", "профайлінг", "карта зв'язків", "граф зв'язків", "афілійовані особи", "dossier", "profiling", "link analysis", "ризики особи"]
  },
  {
    agent: "finance",
    tag: "@finance",
    keywords: ["фінанси", "акції", "трейдинг", "ринок", "джессі", "лівермор", "біржа", "економіка", "інвестиції", "finance", "stocks", "market", "trading"]
  },
  {
    agent: "data",
    tag: "@data",
    keywords: ["bigquery", "sql", "датасет", "bigframes", "аналітика даних", "селект", "select", "groupby", "dataframe", "таблиця даних", "dataset"]
  },
  {
    agent: "code",
    tag: "@code",
    keywords: ["напиши код", "рефакторинг", "баг", "дебаг", "функція", "typescript", "next.js", "python script", "solidity", "flutter code", "code review"]
  },
  {
    agent: "qa",
    tag: "@qa",
    keywords: ["тестування", "fuzzing", "фаззінг", "юніт тест", "qa audit", "автотести", "покриття коду", "тестові кейси", "unit test"]
  },
  {
    agent: "crypto",
    tag: "@crypto",
    keywords: ["блокчейн", "смарт-контракт", "taint", "solidity", "web3", "polygon", "eth_call", "транзакція", "гаманець", "crypto audit"]
  },
  {
    agent: "ml",
    tag: "@ml",
    keywords: ["машинне навчання", "predict", "прогноз", "кластеризація", "knn", "zscore", "pearson", "feature selection", "auto-ml"]
  },
  {
    agent: "logistics",
    tag: "@logistics",
    keywords: ["маршрут", "логістика", "доставка", "мапа турботи", "оптимізація шляху", "dijkstra", "найкоротший шлях", "осередки"]
  },
  {
    agent: "viz",
    tag: "@viz",
    keywords: ["візуалізація", "графік", "діаграма", "boxplot", "мережевий граф", "chart", "d3", "візуалізуй"]
  },
  {
    agent: "recommend",
    tag: "@recommend",
    keywords: ["рекомендація", "підбери", "порадь", "коллаборативна фільтрація", "рекомендаційна система", "recommend"]
  },
  {
    agent: "game",
    tag: "@game",
    keywords: ["гра", "квест", "гейммастер", "процедурна генерація", "game master", "симуляція боївки", "d&d"]
  },
  {
    agent: "mcp",
    tag: "@mcp",
    keywords: ["mcp", "інструмент mcp", "mcp tool", "model context protocol", "протокол mcp", "openclaw"]
  },
  {
    agent: "science",
    tag: "@science",
    keywords: ["pubmed", "alphafold", "alphagenome", "геном", "біоінформатика", "днк", "білок", "crispr", "хвороба", "медичне дослідження", "chembl", "ncbi"]
  },
  {
    agent: "stan",
    tag: "@stan",
    keywords: ["настрій", "емоційний стан", "психологічний", "втома", "марковський граф", "stan report", "як почуваєшся"]
  },
  {
    agent: "lytopisec",
    tag: "@lytopisec",
    keywords: ["літопис", "спогад", "хроніка", "архів", "історія спілкування", "пам'ять", "збережи в літопис"]
  },
  {
    agent: "task",
    tag: "@task",
    keywords: ["запам'ятай", "збережи", "нотуй", "задача", "завдання", "нагадай", "нагадування", "remember", "task", "remind", "ортограф завдань"]
  }
];

/**
 * Прийняття рішення про маршрутизацію запиту (Hybrid Router)
 */
export function routeUserRequest(
  text: string, 
  hasMedia: boolean = false, 
  explicitSelectedAgentKey?: string | null
): RoutingDecision {
  const cleanText = text.trim();
  const lowerText = cleanText.toLowerCase();

  // 1. Явне виділення агента користувачем (ручний вибір або тег на початку)
  if (explicitSelectedAgentKey) {
    return {
      targetAgent: explicitSelectedAgentKey,
      agentTag: `@${explicitSelectedAgentKey}`,
      confidence: 1.0,
      routingType: "explicit_tag",
      reason: `Користувач явно обрав агента: ${explicitSelectedAgentKey}`
    };
  }

  // Перевірка тегу в тексті (наприклад, @code або @osint)
  const tagMatch = cleanText.match(/@([a-zA-Z0-9_-]+)/);
  if (tagMatch) {
    const matchedKey = tagMatch[1].toLowerCase();
    return {
      targetAgent: matchedKey,
      agentTag: `@${matchedKey}`,
      confidence: 1.0,
      routingType: "explicit_tag",
      reason: `Знайдено тег агента у тексті: @${matchedKey}`
    };
  }

  // 2. Маршрутизація мультимедіа Вміст (зображення/файли) -> Vision Agent
  if (hasMedia) {
    return {
      targetAgent: "vision",
      agentTag: "@vision",
      confidence: 0.95,
      routingType: "media",
      reason: "Прикріплено медичні/візуальні матеріали -> залучено Vision Agent"
    };
  }

  // 3. Композитний пайплайн для комплексних завдань
  if (lowerText.includes("проведи аудит коду та безпеки") || lowerText.includes("full audit")) {
    return {
      targetAgent: "orchestrator",
      agentTag: "@composite",
      confidence: 0.92,
      routingType: "composite_pipeline",
      pipelineSteps: ["code", "security", "qa", "chat"],
      reason: "Складний запит: створено послідовний композитний пайплайн Code -> Security -> QA -> Chat"
    };
  }

  // 4. Низьколатентний швидкий шлях за ключовими словами (Low-latency Fast Path)
  for (const map of KEYWORD_MAPPINGS) {
    for (const kw of map.keywords) {
      if (lowerText.includes(kw)) {
        return {
          targetAgent: map.agent,
          agentTag: map.tag,
          confidence: 0.88,
          routingType: "keyword_fast_path",
          reason: `Виявлено ключове слово «${kw}» -> спрямовано до ${map.agent}`
        };
      }
    }
  }

  // 5. За замовчуванням: Семантичний роутинг на Chat Agent / Пані Думку
  return {
    targetAgent: "chat",
    agentTag: "@chat",
    confidence: 0.80,
    routingType: "adk_semantic_delegation",
    reason: "Універсальний запит -> залучено Chat Agent (Пані Думка)"
  };
}
