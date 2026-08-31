/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Модуль автентичної двомовної локалізації екосистеми «Пані Думка».
 * Українська мова ("uk") — основа, наповнена питомими, шляхетними та історичними назвами 
 * (Осавул, Витівка, Думка, Мрія, Літопис, Пластун, Скарбник, Керманичка).
 * Англійська мова ("en-US") — світовий стандарт для міжнародного журі та партнерів.
 */

export type SupportedLanguage = "uk" | "en-US";

export interface Translations {
  appName: string;
  appSubtitle: string;
  appBadge: string;
  searchPlaceholder: string;
  creatorMode: string;
  creatorSubtitle: string;
  generalGuideMode: string;
  generalGuideSubtitle: string;
  creatorSynchronized: string;
  creatorActive: string;
  syncVerify: string;
  newChat: string;
  imageStudio: string;
  deepResearch: string;
  workspace: string;
  a2aConsole: string;
  musicStudio: string;
  history: string;
  memories: string;
  settings: string;
  help: string;
  pricing: string;
  upgradeToPremium: string;
  cognitiveScan: string;
  orchestrationTitle: string;
  autoSelect: string;
  resetToAuto: string;
  startPromptTitle: string;
  startPromptSubtitle: string;
  enterPromptPlaceholder: string;
  send: string;
  voiceChat: string;
  voiceChatListening: string;
  voiceChatSpeaking: string;
  voiceChatConnecting: string;
  loginWithGoogle: string;
  logout: string;
  languageSelect: string;
  ukrainian: string;
  englishUS: string;
  themeToggle: string;
  balanced: string;
  thoughtful: string;
  empathetic: string;
  excited: string;
  happy: string;
  activeAgentsCount: string;
  fleetTitle: string;
  dreamTitle: string;
  counselTitle: string;
  
  // Hero & Card Translations
  heroTitle: string;
  heroSubtitle: string;
  alwaysAtYourService: string;
  askPlaceholder: string;
  
  // Quick Cards
  cardCareMapTitle: string;
  cardCareMapDesc: string;
  cardSecurityTitle: string;
  cardSecurityDesc: string;
  cardLytopisTitle: string;
  cardLytopisDesc: string;
  
  // Stream & Settings
  streamTitle: string;
  streamBadge: string;
  streamEmptyNotice: string;
  voiceSpeedTitle: string;
  voiceIdTitle: string;
  orchestratorCore: string;
  saveAndClose: string;
}

export const DICTIONARY: Record<SupportedLanguage, Translations> = {
  "uk": {
    appName: "Пані Думка",
    appSubtitle: "Шляхетна Керманичка ШІ-Флотилії",
    appBadge: "Державна Цифрова Скарбниця",
    searchPlaceholder: "Повідайте вашу думку або доручіть складну справу...",
    creatorMode: "Творець (Ілля)",
    creatorSubtitle: "Повний контроль, 20 агентів, контекст SmileAfterBurn",
    generalGuideMode: "Загальний Гід",
    generalGuideSubtitle: "Шляхи та універсальні консультації та навички",
    creatorSynchronized: "ТВОРЕЦЬ: СИНХРОН",
    creatorActive: "ПОЄДНАННЯ ДУМОК",
    syncVerify: "Когнітивне братерство",
    newChat: "Новий діалог",
    imageStudio: "Зображення (Imagen)",
    deepResearch: "Глибоке дослідження",
    workspace: "Google Workspace",
    a2aConsole: "A2A & MCP Консоль",
    musicStudio: "Синтез музики (Lyria)",
    history: "Літопис бесід",
    memories: "Спогади та звичаї:",
    settings: "Налаштування",
    help: "Довідка",
    pricing: "Оновити до Преміум",
    upgradeToPremium: "Оновити до Преміум",
    cognitiveScan: "Дзеркало Душі (Сканер)",
    orchestrationTitle: "Світлиця 20 Вірних Побратимів",
    autoSelect: "Флотилія (Мудрий Вибір)",
    resetToAuto: "Повернути до спільної ради",
    startPromptTitle: "Шляхетний Розум та Жива Традиція",
    startPromptSubtitle: "Ласкаво просимо до простору стратегічної думки, емпатії та спільних дій. Оберіть зручний формат спілкування!",
    enterPromptPlaceholder: "Запитайте Пані Думку про будь-що...",
    send: "Пустити в дію",
    voiceChat: "Живе Слово (Голос)",
    voiceChatListening: "Уважно прислухаюся...",
    voiceChatSpeaking: "Мовлю до вас...",
    voiceChatConnecting: "З'єднання з сервером...",
    loginWithGoogle: "Увійти через Google",
    logout: "Вийти з акаунту",
    languageSelect: "Системна мова (Bilingual)",
    ukrainian: "Українська (uk) — Основна",
    englishUS: "English (en-US) — Global",
    themeToggle: "Змінити тему оформлення",
    balanced: "Врівноважена",
    thoughtful: "Глибоке мислення",
    empathetic: "Емпатичний резонанс",
    excited: "Когнітивне злиття",
    happy: "Привітна",
    activeAgentsCount: "20 Агентів (Auto)",
    fleetTitle: "Козацька Варта ШІ",
    dreamTitle: "Мрія",
    counselTitle: "Думка",
    
    heroTitle: "Шляхетний Розум та Жива Традиція",
    heroSubtitle: "Ласкаво просимо до простору стратегічної думки, емпатії та спільних дій. Оберіть зручний формат спілкування!",
    alwaysAtYourService: "Завжди до ваших послуг.",
    askPlaceholder: "Запитайте Пані Думку про будь-що...",
    
    cardCareMapTitle: "Мапа Турботи",
    cardCareMapDesc: "6200+ осередків допомоги",
    cardSecurityTitle: "Аудит Луцика",
    cardSecurityDesc: "Security & OSINT захист",
    cardLytopisTitle: "Літопис думок",
    cardLytopisDesc: "Стратегічні хроніки",
    
    streamTitle: "Потік",
    streamBadge: "Зодчий Core",
    streamEmptyNotice: "Потік порожній. Подвійний клік для редагування або попросіть «Зодчого» транслювати План реалізації та Ортограф завдань.",
    voiceSpeedTitle: "Швидкість синтезу голосу",
    voiceIdTitle: "Голос AI (ElevenLabs)",
    orchestratorCore: "Ядро Оркестратора",
    saveAndClose: "Зберегти та закрити"
  },
  "en-US": {
    appName: "Pani Dumka",
    appSubtitle: "Noble AI Fleet Orchestrator",
    appBadge: "Sovereign Digital Treasury",
    searchPlaceholder: "Share your thought or assign a mission...",
    creatorMode: "Creator (Illia)",
    creatorSubtitle: "Full control, 20 sub-agents, SmileAfterBurn context",
    generalGuideMode: "General Guide",
    generalGuideSubtitle: "Universal advice, skills & assistance",
    creatorSynchronized: "CREATOR: SYNCED",
    creatorActive: "COGNITIVE FUSION",
    syncVerify: "Cognitive Kinship",
    newChat: "New Dialogue",
    imageStudio: "Image Studio (Imagen)",
    deepResearch: "Deep Research",
    workspace: "Google Workspace",
    a2aConsole: "A2A & MCP Console",
    musicStudio: "Music Studio (Lyria)",
    history: "Chronicles",
    memories: "Memories & Lore:",
    settings: "Settings",
    help: "Help & Guide",
    pricing: "Upgrade to Premium",
    upgradeToPremium: "Upgrade to Premium",
    cognitiveScan: "Mirror of Soul (Scanner)",
    orchestrationTitle: "Assembly of 20 Specialized Agents",
    autoSelect: "Fleet (Intelligent Auto)",
    resetToAuto: "Restore to General Council",
    startPromptTitle: "Noble Mind & Living Tradition",
    startPromptSubtitle: "Welcome to the space of strategic thought, empathy, and collective action. Choose your preferred interaction mode!",
    enterPromptPlaceholder: "Ask Pani Dumka anything...",
    send: "Dispatch",
    voiceChat: "Spoken Word (Live Voice)",
    voiceChatListening: "Listening attentively...",
    voiceChatSpeaking: "Speaking to you...",
    voiceChatConnecting: "Connecting to server...",
    loginWithGoogle: "Sign in with Google",
    logout: "Sign out",
    languageSelect: "System Language (Bilingual)",
    ukrainian: "Ukrainian (uk) — Primary",
    englishUS: "English (en-US) — Global",
    themeToggle: "Toggle Appearance",
    balanced: "Balanced",
    thoughtful: "Deep Contemplation",
    empathetic: "Empathetic Resonance",
    excited: "Cognitive Fusion",
    happy: "Gracious Host",
    activeAgentsCount: "20 Agents (Auto)",
    fleetTitle: "Autonomous Agent Fleet",
    dreamTitle: "Dream (Mriya)",
    counselTitle: "Thought (Dumka)",
    
    heroTitle: "Noble Mind & Living Tradition",
    heroSubtitle: "Welcome to the space of strategic thought, empathy, and collective action. Choose your preferred interaction mode!",
    alwaysAtYourService: "Always at your service.",
    askPlaceholder: "Ask Pani Dumka anything...",
    
    cardCareMapTitle: "Care Map",
    cardCareMapDesc: "6200+ help centers",
    cardSecurityTitle: "Lucyk Security Audit",
    cardSecurityDesc: "Security & OSINT defense",
    cardLytopisTitle: "Chronicles of Thought",
    cardLytopisDesc: "Strategic logs",
    
    streamTitle: "Stream",
    streamBadge: "Zodchyi Core",
    streamEmptyNotice: "Stream is empty. Double-click to edit or request Zodchyi to stream the Implementation Plan and Task Ortograf.",
    voiceSpeedTitle: "Voice Synthesis Speed",
    voiceIdTitle: "AI Voice (ElevenLabs)",
    orchestratorCore: "Orchestrator Core",
    saveAndClose: "Save & Close"
  }
};
