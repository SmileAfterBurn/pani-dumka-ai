# 🏛️ Центральний Реєстр Агентів Пані Думка (Agents Registry)

Даний індексний файл є глобальним каталогом спеціалізованих ШІ-агентів екосистеми **Пані Думка**. Оркестратор використовує цей реєстр для швидкої семантичної маршрутизації задач, перевірки можливостей та завантаження специфікацій конкретного виконавця за потреби.

---

## 👥 Реєстр 20 Спеціалізованих Агентів

| Тег | Ім'я Агента | Файл Специфікації | Основна Спеціалізація | Ключові Інструменти & Математика |
|---|---|---|---|---|
| `@chat` | Chat Agent | [`chat.md`](file:///c:/Users/Home/Desktop/pani-dumka-skrynya/пані-думка-виробництво/agents/chat.md) | Загальні розмови, текстовий синтез, бесіда | `ReactMarkdown`, `ElevenLabs TTS` |
| `@vision` | Vision Agent | [`vision.md`](file:///c:/Users/Home/Desktop/pani-dumka-skrynya/пані-думка-виробництво/agents/vision.md) | Комп'ютерний зір, аналіз зображень та відео | `gs:// Zero-Copy`, Gemini Multimodal |
| `@task` | Task Agent | [`task.md`](file:///c:/Users/Home/Desktop/pani-dumka-skrynya/пані-думка-виробництво/agents/task.md) | Менеджер завдань, декомпозиція ТЗ, нагадування | SDLC Planner, Zodchyi Task DAG |
| `@security` | Security Agent (Луцик) | [`lucyk.md`](file:///c:/Users/Home/Desktop/pani-dumka-skrynya/пані-думка-виробництво/agents/lucyk.md) | Кібербезпека, аудит ентропії, аналіз загроз | `MathCore.InfoTheory.shannonEntropy` |
| `@osint` | Osint Agent | [`osint.md`](file:///c:/Users/Home/Desktop/pani-dumka-skrynya/пані-думка-виробництво/agents/osint.md) | Розвідка у відкритих джерелах, ботнети | `MathCore.InfoTheory.pearsonCorrelation` |
| `@profiler` | Osint Profiler Agent | [`profiler.md`](file:///c:/Users/Home/Desktop/pani-dumka-skrynya/пані-думка-виробництво/agents/profiler.md) | Профілювання, соціальні графи, граф зв'язків | `MathCore.WeightedGraph`, `pageRank`, `dijkstra` |
| `@finance` | Finance Agent (Лівермор) | [`livermor.md`](file:///c:/Users/Home/Desktop/pani-dumka-skrynya/пані-думка-виробництво/agents/livermor.md) | Фінансовий аналіз, волатильність, ринки | `MathCore.Stats.welfordVariance`, `minMax/zScore` |
| `@data` | Data Agent | [`data.md`](file:///c:/Users/Home/Desktop/pani-dumka-skrynya/пані-думка-виробництво/agents/data.md) | Аналіз масивів даних, SQL, датасети | `MathCore.Stats.describe`, `skewness/kurtosis` |
| `@code` | Code Agent | [`code.md`](file:///c:/Users/Home/Desktop/pani-dumka-skrynya/пані-думка-виробництво/agents/code.md) | Архітектор коду, розробка, дебаг | `MathCore.Bits`, AST Parser |
| `@qa` | QA Agent | [`qa.md`](file:///c:/Users/Home/Desktop/pani-dumka-skrynya/пані-думка-виробництво/agents/qa.md) | Забезпечення якості, детермінований фаззінг | `MathCore.DeterministicRandom`, Quality Gates |
| `@crypto` | Crypto Agent | [`crypto.md`](file:///c:/Users/Home/Desktop/pani-dumka-skrynya/пані-думка-виробництво/agents/crypto.md) | Блокчейн-аналітика, Taint-аналіз коштів | `WeightedGraph`, `dijkstraShortestPath`, `shannonEntropy` |
| `@ml` | Auto-ML Agent | [`ml.md`](file:///c:/Users/Home/Desktop/pani-dumka-skrynya/пані-думка-виробництво/agents/ml.md) | Предиктивні моделі, ML, Feature Selection | `cosineSimilarity`, `pearsonCorrelation` |
| `@logistics` | Logistics Agent | [`logistics.md`](file:///c:/Users/Home/Desktop/pani-dumka-skrynya/пані-думка-виробництво/agents/logistics.md) | Оптимізація маршрутів та ресурсів | `WeightedGraph`, `dijkstraShortestPath` |
| `@viz` | Visualization Agent | [`viz.md`](file:///c:/Users/Home/Desktop/pani-dumka-skrynya/пані-думка-виробництво/agents/viz.md) | Візуалізація даних, квантилі, графи | `Stats.quantiles`, `Stats.mean`, `pageRank` |
| `@recommend` | Recommend Agent | [`recommend.md`](file:///c:/Users/Home/Desktop/pani-dumka-skrynya/пані-думка-виробництво/agents/recommend.md) | Персоналізовані рекомендації, підбір | `cosineSimilarity`, `jaccardSimilarity` |
| `@game` | Game Master Agent | [`game.md`](file:///c:/Users/Home/Desktop/pani-dumka-skrynya/пані-думка-виробництво/agents/game.md) | Майстер ігор, квести, процедурна генерація | `DeterministicRandom(seed)`, `Stats.describe` |
| `@mcp` | MCP Agent | [`mcp.md`](file:///c:/Users/Home/Desktop/pani-dumka-skrynya/пані-думка-виробництво/agents/mcp.md) | Інженер зовнішніх інтеграцій, протокол MCP | `McpPluginManifest`, `callMcpTool` |
| `@science` | Science Agent | [`science.md`](file:///c:/Users/Home/Desktop/pani-dumka-skrynya/пані-думка-виробництво/agents/science.md) | Наукові дослідження, PubMed, біоінформатика | `DeterministicRandom`, параметрична статистика |
| `@stan` | Stan Agent | [`stan.md`](file:///c:/Users/Home/Desktop/pani-dumka-skrynya/пані-думка-виробництво/agents/stan.md) | Аналітик психоемоційного стану | Марковські графи (`WeightedGraph`), емпатія |
| `@lytopisec` | Lytopisec Agent | [`lytopisec.md`](file:///c:/Users/Home/Desktop/pani-dumka-skrynya/пані-думка-виробництво/agents/lytopisec.md) | Архіваріус, довгострокова пам'ять | `cosineSimilarity`, `jaccardSimilarity` |

---

## 🎯 Алгоритм Маршрутизації Оркестратора
1. **Зчитування запиту:** Оркестратор аналізує явні теги (наприклад, `@security` чи `@code`).
2. **Семантичний підбір:** Якщо тегу немає, Оркестратор звертається до даного індексу `agents_registry.md`.
3. **Завантаження специфікації:** Оркестратор зчитує лише релевантний файл агента (наприклад, `agents/lucyk.md`) для побудови ізольованого контексту (Bounded Context).
4. **Виконання та верифікація:** Результати агента проходять через **Гейти Якості (Quality Gates)** перед видачею у Потік.
