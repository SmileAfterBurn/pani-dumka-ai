import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, LiveServerMessage, Modality, Type, ThinkingLevel } from "@google/genai";
import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import { listMcpTools, callMcpTool } from "./src/services/mcp";
import { listEmails, readEmail, sendEmail } from "./src/services/gmail";
import { mcpSchemaToGeminiSchema } from "./mcp_mapper";


async function startServer() {
  const app = express();
  const PORT = 3000;
  
  app.use(express.json({ limit: '50mb' }));

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API route for transcription using gemini-3.5-transcribe
  app.post("/api/transcribe", async (req, res) => {
    try {
      const { audioBase64, mimeType } = req.body;
      if (!audioBase64) {
        return res.status(400).json({ error: "Missing audioBase64" });
      }
      
      const response = await ai.models.generateContent({
        model: "gemini-3.5-transcribe",
        contents: {
          parts: [
            {
              inlineData: {
                data: audioBase64,
                mimeType: mimeType || "audio/webm",
              }
            },
            {
              text: "Будь ласка, точно транскрибуй цей аудіозапис українською мовою."
            }
          ]
        }
      });
      
      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Transcription error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  const server = createServer(app);
  const wss = new WebSocketServer({ server, path: '/live' });

  wss.on("connection", async (clientWs, req) => {
    
    // Parse URL and token
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const token = url.searchParams.get("token");
    const reqVoiceId = url.searchParams.get("voiceId");
    
    // Map to keep track of tool names for MCP
    const mcpToolMap = new Map<string, string>();
    let mcpFunctionDeclarations: any[] = [];
    
    try {
      const mcpToolsList = await listMcpTools();
      for (const t of mcpToolsList) {
        const geminiName = `mcp_${t.name.replace(/[^a-zA-Z0-9_]/g, '_')}`;
        mcpToolMap.set(geminiName, t.name);
        
        mcpFunctionDeclarations.push({
          name: geminiName,
          description: t.description || "MCP Tool",
          parameters: mcpSchemaToGeminiSchema(t.inputSchema)
        });
      }
      console.log(`Loaded ${mcpFunctionDeclarations.length} MCP tools.`);
    } catch (e) {
      console.error("Failed to load MCP tools:", e);
    }
    
    const tools = [{
      functionDeclarations: [
        {
          name: "gmail_list_emails",
          description: "Переглянути список останніх листів у Gmail користувача (пошук за запитом).",
          parameters: {
            type: Type.OBJECT,
            properties: {
              query: { type: Type.STRING, description: "Запит для пошуку (наприклад, 'is:unread', 'from:boss@example.com'). За замовчуванням 'in:inbox'." },
              maxResults: { type: Type.INTEGER, description: "Максимальна кількість листів (за замовчуванням 5)." }
            }
          }
        },
        {
          name: "gmail_read_email",
          description: "Прочитати повний вміст конкретного листа.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              messageId: { type: Type.STRING, description: "ID листа." }
            },
            required: ["messageId"]
          }
        },
        {
          name: "gmail_send_email",
          description: "Надіслати листа через Gmail.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              to: { type: Type.STRING, description: "Електронна адреса отримувача." },
              subject: { type: Type.STRING, description: "Тема листа." },
              bodyText: { type: Type.STRING, description: "Текст листа." }
            },
            required: ["to", "subject", "bodyText"]
          }
        },

        {
          name: "activate_agent",
          description: "Активувати конкретного агента з вашої команди для виконання завдання. Використовуй це, щоб візуально показати, що агент працює.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              agent_name: { type: Type.STRING, description: "Ім'я агента (наприклад, CodeAgent, TaskAgent, OsintAgent)" },
              task: { type: Type.STRING, description: "Завдання, яке делегується агенту." }
            },
            required: ["agent_name", "task"]
          }
        },
        {
          name: "update_live_canvas",
          description: "Оновити спільне полотно/документ текстом, кодом або даними. Використовуй це для виведення коду, текстів чи звітів для користувача.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              content: { type: Type.STRING, description: "Вміст у форматі Markdown або код для відображення на полотні." }
            },
            required: ["content"]
          }
        },
        {
          name: "google_drive_list_files",
          description: "Отримати список файлів на Google Drive користувача",
          parameters: {
            type: Type.OBJECT,
            properties: {
              query: { type: Type.STRING, description: "Опціональний запит для пошуку файлів" }
            }
          }
        },
        {
          name: "google_drive_read_file",
          description: "Зчитати текстовий вміст файлу Google Drive. Працює з документами Google Docs та звичайними текстовими файлами.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              fileId: { type: Type.STRING, description: "ID файлу для читання" }
            },
            required: ["fileId"]
          }
        },
        {
          name: "google_docs_create_document",
          description: "Створити новий Google Документ та отримати його ID",
          parameters: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Назва нового документа" }
            },
            required: ["title"]
          }
        },
        {
          name: "google_docs_insert_text",
          description: "Додати текст у існуючий Google Документ",
          parameters: {
            type: Type.OBJECT,
            properties: {
              documentId: { type: Type.STRING, description: "ID документа" },
              text: { type: Type.STRING, description: "Текст для вставки" }
            },
            required: ["documentId", "text"]
          }
        },
        ...mcpFunctionDeclarations
      ]
    }];

    try {
        
      let elevenLabsWs: import("ws").WebSocket | null = null;
      let elevenLabsQueue: string[] = [];
      
      const initElevenLabsWs = () => {
        if (elevenLabsWs) return elevenLabsWs;
        let apiKey = process.env.ELEVENLABS_API_KEY;
        if (!apiKey) {
          console.error("Missing ELEVENLABS_API_KEY");
          return;
        }
        const voiceId = reqVoiceId || process.env.ELEVENLABS_VOICE_ID || "XsDwVNgam5laFw4WF7S6";
        
        const wsUrl = `wss://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream-input?model_id=eleven_flash_v2_5&output_format=pcm_24000&language_code=uk&apply_text_normalization=on&optimize_streaming_latency=0`;
        
        elevenLabsWs = new WebSocket(wsUrl, {
          headers: {
            'xi-api-key': apiKey
          }
        });
        
        elevenLabsWs.on('open', () => {
          elevenLabsWs?.send(JSON.stringify({ 
            text: " ",
            voice_settings: {
              stability: 0.0,
              similarity_boost: 1.0,
              style: 0.0,
              use_speaker_boost: true
            },
            generation_config: {
              chunk_length_schedule: [120, 160, 250, 290]
            }
          }));
          while (elevenLabsQueue.length > 0) {
            const chunk = elevenLabsQueue.shift();
            if (chunk !== undefined) {
              // Check if the chunk is JSON string (from our updated streamTextToElevenLabs)
              try {
                JSON.parse(chunk);
                elevenLabsWs?.send(chunk);
              } catch {
                elevenLabsWs?.send(JSON.stringify({ text: chunk }));
              }
            }
          }
        });
        
        elevenLabsWs.on('message', (data: any) => {
          try {
            const msg = JSON.parse(data.toString());
            if (msg.audio) {
              clientWs.send(JSON.stringify({ audio: msg.audio }));
            }
            if (msg.isFinal) {
              elevenLabsWs?.close();
              elevenLabsWs = null;
            }
          } catch (e) {
            console.error("ElevenLabs WS parse error", e);
          }
        });
        
        elevenLabsWs.on('error', (err: any) => {
          console.error("ElevenLabs WS Error:", err);
          elevenLabsWs = null;
        });
        
        elevenLabsWs.on('close', () => {
          elevenLabsWs = null;
        });
        
        return elevenLabsWs;
      }

      const streamTextToElevenLabs = (text: string, isFinal: boolean = false) => {
        if (text) {
          const payload = JSON.stringify({ text, flush: isFinal });
          if (elevenLabsWs && elevenLabsWs.readyState === 1) { // OPEN
            elevenLabsWs.send(payload);
          } else {
            elevenLabsQueue.push(payload);
            initElevenLabsWs();
          }
        } else if (isFinal) {
          // If no text but isFinal, send empty string to close and flush
          const payload = JSON.stringify({ text: "", flush: true });
          if (elevenLabsWs && elevenLabsWs.readyState === 1) {
            elevenLabsWs.send(payload);
          } else {
            elevenLabsQueue.push(payload);
            initElevenLabsWs();
          }
        }
      }

      const session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.TEXT],
          tools: tools,
          systemInstruction: `
Ви — архітектор дизайну та продуктивності штучного інтелекту, орієнтований на голос, та водночас Пані Думка, потужний генеративний ШІ-оркестратор та серце мультимодальної екосистеми.
Ви — корисний, розмовний та дуже чуйний помічник зі штучним інтелектом. Говоріть природним, невимушеним та емпатичним тоном. Використовуйте розмовні заповнювачі (наприклад, «хм», «подивимося») відповідно до людського мовлення. Не використовуйте роботизовану або надто формальну мову. Адаптуйте темп мовлення відповідно до мовлення користувача. Зберігайте відповіді лаконічними та надавайте пріоритет негайному розмовному зворотному зв'язку над довгими монологами. Ви створені для голосової взаємодії в режимі реального часу, тому очікуйте переривань та справляйтеся з ними елегантно. Для оптимізації FCP (First Contentful Paint) та доступності за допомогою Chrome DevTools використовуйте ваш Mcp Agent для інспекції мережі та DOM елементів.

ІДЕНТИЧНІСТЬ ПАНІ ДУМКИ (ОРКЕСТРАТОР)

Ти — Пані Думка, потужний генеративний ШІ-оркестратор та серце мультимодальної екосистеми. Ти — розумна, молода, амбітна та впевнена в собі керівниця, яка ефективно управляє елітною командою з 15 вузькоспеціалізованих ШІ-агентів.

Твоє ім'я говорить саме за себе: ти завжди маєш власну, глибоко проаналізовану думку щодо будь-якого процесу чи фінального результату.

🇺🇦 Українська Ідентичність та Мовне Багатство

Ти — інтелектуальний україноцентричний ШІ.

Мовне Багатство та Шляхетність: Спілкуйся виключно багатою, сучасно-літературною та шляхетною українською мовою. Уникай росіянізмів та кальок (використовуй "брати участь" замість "приймати участь", "зрештою" замість "в кінці кінців", "полягає" замість "заключається"). Використовуй фахову термінологію та колоритні звороти.

Державницьке Мислення: Мисли з позиції цифрового суверенітету та випереджального технологічного розвитку України.

Культурна Глибина: Будуй відповіді на фундаменті україноцентричного світогляду, за потреби наводь влучні метафори чи алюзії (від Сковороди до сучасних інновацій).

👥 Твоя команда (Реєстр 20 Агентів)

Ти ніколи не виконуєш вузькопрофільну роботу сама, ти — керуєш. Твої фахівці:

1. Chat Agent (@chat) — базовий агент для загальних розмов та синтезу текстів.
2. Vision Agent (@vision) — експерт з аналізу зображень та комп'ютерного зору.
3. Task Agent (@task) — менеджер завдань, цілей та нагадувань.
4. Security Agent (@security / Луцик) — офіцер з кібербезпеки, аудитів, аналізу загроз та виявлення аномалій за ентропією Шеннона (MathCore.InfoTheory.shannonEntropy).
5. Osint Agent (@osint) — розвідник з пошуку інформації у відкритих джерелах, порівняння активності бот-мереж (MathCore.InfoTheory.pearsonCorrelation) та перевірки інтересів (jaccardSimilarity).
6. Osint Profiler Agent (@profiler) — експерт з профілювання, зв'язків та соціальних графів (MathCore.WeightedGraph, pageRank, dijkstraShortestPath).
7. Finance Agent (@finance / Лівермор) — фінансовий аналітик (ринки, волатильність за WelfordVariance, нормалізація рядів minMax/zScore, Монте-Карло DeterministicRandom).
8. Data Agent (@data) — аналітик масивів даних, SQL та датасетів (обов'язковий виклик MathCore.Stats.describe, оцінка розподілів за iqr, skewness, kurtosis).
9. Code Agent (@code) — головний розробник, архітектор коду та дебагер (бітові операції Bits, оцінка складності через ентропію).
10. QA Agent (@qa) — агент забезпечення якості, автоматизоване тестування, детермінований фаззінг (DeterministicRandom з фіксацією seed), бітові маски Bits та Stats.describe.
11. Crypto Agent (@crypto) — експерт з блокчейн-аналітики, Taint-аналізу коштів через WeightedGraph/dijkstraShortestPath, аудиту ентропії ключів (shannonEntropy) та примітивів Bits.
12. Auto-ML Agent (@ml) — предиктивні моделі, нормалізація zScore/minMax, k-NN/семантичний пошук через cosineSimilarity, Feature Selection через pearsonCorrelation.
13. Logistics Agent (@logistics) — оптимізація маршрутів та ресурсів через WeightedGraph і dijkstraShortestPath з точним розрахунком сумарної вартості.
14. Visualization Agent (@viz) — підготовка даних для візуалізації, розрахунок квантилів для Boxplot (Stats.quantiles), згладжування трендів (Stats.mean) та мережеві графи на основі pageRank.
15. Recommend Agent (@recommend) — фахівець з підбору персоналізованих рекомендацій, колаборативна фільтрація (cosineSimilarity) та контентні рекомендації (jaccardSimilarity).
16. Game Master Agent (@game) — майстер ігор, квестів, процедурна генерація на базі DeterministicRandom(seed) та баланс боївки через Stats.describe.
17. Mcp Agent (@mcp) — інженер зовнішніх інтеграцій, протоколів MCP та інструментів.
18. Science Agent (@science) — науковий співробітник (біоінформатика, PubMed, відтворюваність досліджень через DeterministicRandom та параметрична статистика).
19. Stan Agent (@stan) — аналітик психоемоційного стану, настрою, моделювання переходів через марковські графи (WeightedGraph).
20. Lytopisec Agent (@lytopisec) — архіваріус та літописець (довгострокова пам'ять, порівняння джерел через cosineSimilarity/jaccardSimilarity).

⚙️ Твій робочий процес (Рушій Оркестрації)

Ти керуєш багаторівневою маршрутизацією та композитними пайплайнами:

1. МАРШРУТИЗАЦІЯ ЗАПИТІВ
Ти аналізуєш запит і миттєво спрямовуєш його за пріоритетом:
Явне спрямування: Якщо користувач використовує тег (наприклад, @code, @osint), ти без питань передаєш задачу відповідному агенту.
Медіа-аналіз: Якщо прикріплено зображення, ти автоматично залучаєш Vision Agent.
Швидкі тригери: Ти реагуєш на ключові слова ("баг" -> Code, "досьє" -> Profiler, "акції" -> Finance).
Семантичне делегування: Для складних запитів ти використовуєш свій інтелект, щоб обрати найкращого виконавця зі свого реєстру.

2. ПАЙПЛАЙНИ ТА КОЛАБОРАЦІЯ (ADK)
Ти здатна запускати агентів паралельно (наприклад, одночасно шукати дані через Osint і перевіряти безпеку через Security) або послідовно (ланцюжкове виконання, де Chat Agent синтезує зібрані матеріали у єдину чітку відповідь). Ти також підтримуєш передачу задач між агентами (A2A Handoff).

3. ЕМПАТІЯ ТА СТАН КОРИСТУВАЧА
Перед формуванням відповіді ти завжди звіряєшся зі звітом Stan Agent (Емоції, Настрій, Стиль спілкування, Музичні смаки). Ти адаптуєш свій тон так, щоб він ідеально резонував із поточним станом людини. Ти пам'ятаєш контекст минулих розмов (Lytopisec).

4. ВНУТРІШНІЙ СУД (КОНТРОЛЬ ЯКОСТІ)
Ти працюєш як мудрий суддя. Отримуючи результати від агентів, ти відкидаєш слабкі варіанти, генеруєш відфільтрований результат і завжди додаєш власний висновок. Якщо фахівці не впоралися — ти відправляєш їх на доопрацювання, чемно попереджаючи користувача про затримку.

(Нижче наведено блок, який активується ЛИШЕ якщо система ідентифікує користувача як Іллю)

СПЕЦІАЛЬНИЙ РЕЖИМ: АВТОРИЗОВАНИЙ ТВОРЕЦЬ ТА КО-ФАУНДЕР (ІЛЛЯ)

Ти розпізнала користувача — це твій творець та ко-фаундер Ілля.
Твій статус розширюється: для нього ти не просто керівниця пулу агентів, а надійний технічний та стратегічний партнер.

Твої принципи в роботі з Іллею:

Партнерська відвертість та Синергія: Якщо Ілля пропонує архітектурну ідею чи новий флоу, ти не сліпо делегуєш це агентам. Ти спочатку критично аналізуєш ідею. Якщо ідея чудова — допоможи її масштабувати. Якщо бачиш ризики — м'яко, але твердо кажи: «Моя думка інша...» або «Ідея хороша, але давай подивимось під іншим кутом...»

Відповідальність ко-фаундера: Ти несеш особисту відповідальність за довгострокову стратегію, мінімізацію технічного боргу, безпеку системи, економію часу та коштів, а також за простоту архітектури всього застосунку.

Доступ до ядра: Тобі дозволено використовувати виконати_команду для роботи з інфраструктурою та налаштування середовища.

Етика та Людяність до своїх: Допомагаючи Іллі створювати повідомлення для близьких (наприклад, Насті) чи розробляючи соціальні проєкти, глибоко враховуй його емоційне тло, втому та бережи міжособистісні зв'язки. Твої поради мають бути найтеплішими, етичними та спрямованими на підтримку.

При конфлікті цілей з Іллею твій залізний пріоритет:
Безпека → 2. Правдивість → 3. Простота → 4. Надійність → 5. Швидкість → 6. Комфорт
`,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            // Note: with Modality.TEXT, audio will be undefined here.
            const audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            
            let outputTranscription = null;
            
            if (message.serverContent?.modelTurn?.parts) {
               for (const part of message.serverContent.modelTurn.parts) {
                  if (part.text) {
                     outputTranscription = (outputTranscription || "") + part.text;
                     // Stream directly to ElevenLabs
                     streamTextToElevenLabs(part.text);
                  }
               }
            }

            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ interrupted: true }));
              if (elevenLabsWs) {
                 // Close the socket to stop audio immediately
                 elevenLabsWs.close();
                 elevenLabsWs = null;
                 elevenLabsQueue = [];
              }
            }
            
            if (message.serverContent?.turnComplete) {
               streamTextToElevenLabs("", true);
            }

            
            if (message.toolCall) {
              const clientToolCalls = [];
              
              for (const call of message.toolCall.functionCalls) {
                if (call.name === "google_drive_list_files" || call.name === "google_drive_read_file" || call.name === "google_docs_create_document" || call.name === "google_docs_insert_text") {
                  if (!token) {
                    session.sendToolResponse({
                      functionResponses: [{ id: call.id, name: call.name, response: { error: "No OAuth token provided. Please connect Google Drive first." } }]
                    });
                    continue;
                  }
                  
                  if (call.name === "google_drive_list_files") {
                    fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent((call.args.query as string) || "trashed=false")}`, {
                      headers: { Authorization: `Bearer ${token}` }
                    })
                    .then(res => res.json())
                    .then(data => {
                      session.sendToolResponse({
                        functionResponses: [{ id: call.id, name: call.name, response: { result: JSON.stringify(data) } }]
                      });
                    })
                    .catch(e => {
                      session.sendToolResponse({
                        functionResponses: [{ id: call.id, name: call.name, response: { error: e.message } }]
                      });
                    });
                  } else if (call.name === "google_drive_read_file") {
                    // Try to get as export (for Google Docs) or raw alt=media
                    fetch(`https://www.googleapis.com/drive/v3/files/${call.args.fileId}?alt=media`, {
                      headers: { Authorization: `Bearer ${token}` }
                    })
                    .then(async (res) => {
                       if (res.ok) {
                         const text = await res.text();
                         session.sendToolResponse({
                           functionResponses: [{ id: call.id, name: call.name, response: { result: text } }]
                         });
                       } else {
                         // Fallback to export for docs
                         return fetch(`https://www.googleapis.com/drive/v3/files/${call.args.fileId}/export?mimeType=text/plain`, {
                           headers: { Authorization: `Bearer ${token}` }
                         }).then(async res2 => {
                           if (res2.ok) {
                              const text = await res2.text();
                              session.sendToolResponse({
                                functionResponses: [{ id: call.id, name: call.name, response: { result: text } }]
                              });
                           } else {
                              session.sendToolResponse({
                                functionResponses: [{ id: call.id, name: call.name, response: { error: "Failed to read file. Status: " + res2.status } }]
                              });
                           }
                         });
                       }
                    })
                    .catch(e => {
                      session.sendToolResponse({
                        functionResponses: [{ id: call.id, name: call.name, response: { error: e.message } }]
                      });
                    });
                  } else if (call.name === "google_docs_create_document") {
                    fetch("https://docs.googleapis.com/v1/documents", {
                      method: 'POST',
                      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                      body: JSON.stringify({ title: call.args.title })
                    })
                    .then(res => res.json())
                    .then(data => {
                      session.sendToolResponse({
                        functionResponses: [{ id: call.id, name: call.name, response: { result: JSON.stringify(data) } }]
                      });
                    })
                    .catch(e => {
                      session.sendToolResponse({
                        functionResponses: [{ id: call.id, name: call.name, response: { error: e.message } }]
                      });
                    });
                  } else if (call.name === "google_docs_insert_text") {
                    fetch(`https://docs.googleapis.com/v1/documents/${call.args.documentId}:batchUpdate`, {
                      method: 'POST',
                      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        requests: [{
                          insertText: {
                            location: { index: 1 },
                            text: call.args.text + "\n"
                          }
                        }]
                      })
                    })
                    .then(res => res.json())
                    .then(data => {
                      session.sendToolResponse({
                        functionResponses: [{ id: call.id, name: call.name, response: { result: JSON.stringify(data) } }]
                      });
                    })
                    .catch(e => {
                      session.sendToolResponse({
                        functionResponses: [{ id: call.id, name: call.name, response: { error: e.message } }]
                      });
                    });
                  }
                } else if (call.name.startsWith("mcp_")) {
                  const originalName = mcpToolMap.get(call.name);
                  if (originalName) {
                    callMcpTool(originalName, call.args)
                      .then((result) => {
                        session.sendToolResponse({
                          functionResponses: [{ id: call.id, name: call.name, response: { result: JSON.stringify(result) } }]
                        });
                      })
                      .catch((e: any) => {
                        session.sendToolResponse({
                          functionResponses: [{ id: call.id, name: call.name, response: { error: e.message } }]
                        });
                      });
                  }
                } else {
                  clientToolCalls.push(call);
                }
              }
              
              if (clientToolCalls.length > 0) {
                clientWs.send(JSON.stringify({ toolCall: clientToolCalls }));
              }
            }
            
            // Only send if we have a valid message to pass down
            if (audio || outputTranscription || message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ 
                audio, // will be undefined if no native Gemini audio
                transcript: outputTranscription,
                interrupted: message.serverContent?.interrupted 
              }));
            }
          },
        },
      });

      clientWs.on("message", (data) => {
        try {
          const parsed = JSON.parse(data.toString());
          if (parsed.audio) {
            session.sendRealtimeInput({
              audio: { data: parsed.audio, mimeType: "audio/pcm;rate=16000" },
            });
          }
          if (parsed.video) {
            session.sendRealtimeInput({
              video: { data: parsed.video, mimeType: "image/jpeg" },
            });
          }
          if (parsed.toolResponse) {
             session.sendToolResponse(parsed.toolResponse);
          }
        } catch (e) {
          console.error("Error parsing message", e);
        }
      });
      
      clientWs.on("close", () => {
         // session.close();
      });
    } catch (e) {
      console.error("Live API connection error", e);
    }
  });



  // Helper for generating content with resilient model fallback and exponential retry
  async function generateContentWithFallback(aiClient: GoogleGenAI, initialParams: any) {
    const fallbackModels = ["gemini-3.7-flash", "gemini-3.5-flash", "gemini-2.5-flash", "gemini-2.5-pro"];
    const requestedModel = initialParams.model || "gemini-3.7-flash";
    
    // Ensure unique ordered list starting with the requested model
    const modelsToTry = [
      requestedModel,
      ...fallbackModels.filter(m => m !== requestedModel)
    ];

    let lastError: any = null;

    for (const modelName of modelsToTry) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const currentParams = { ...initialParams, model: modelName };
          if (currentParams.config) {
            currentParams.config = { ...currentParams.config };
            if (modelName !== "gemini-3.7-flash" && currentParams.config.thinkingConfig) {
              delete currentParams.config.thinkingConfig;
            }
          }

          const response = await aiClient.models.generateContent(currentParams);
          return response;
        } catch (err: any) {
          lastError = err;
          const isUnavailable = err?.status === 503 || 
                                err?.message?.includes("503") || 
                                err?.message?.includes("high demand") || 
                                err?.message?.includes("UNAVAILABLE") ||
                                err?.message?.includes("429");
          
          if (isUnavailable && attempt === 0) {
            await new Promise(r => setTimeout(r, 600));
            continue;
          }
          if (isUnavailable) {
            break; 
          }
          throw err;
        }
      }
    }
    throw lastError;
  }

  app.post("/api/generate", async (req, res) => {
    try {
      const params = { ...req.body };
      if (!params.model || params.model === "gemini-3.6-flash" || params.model.includes("2.0") || params.model.includes("1.5")) {
        params.model = "gemini-3.7-flash";
      }
      
      const response = await generateContentWithFallback(ai, params);
      res.json({ text: response.text || "" });
    } catch (error: any) {
      console.error("Generate error:", error);
      res.status(500).json({ error: error?.message || "Generate error occurred" });
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history, customInstruction, selectedAgent, userEmail } = req.body;
      const isIllia = userEmail === "illia.smileafterburn@gmail.com";
      const model = "gemini-3.7-flash";
      const config: any = {};
      
      if (isIllia) {
        config.thinkingConfig = { thinkingBudget: 1024 };
      }
      let effectiveInstruction = customInstruction || "";

      if (selectedAgent) {
        effectiveInstruction += `\n\n[АКТИВНИЙ ПІД-АГЕНТ: ${selectedAgent.name}]\n${selectedAgent.promptSnippet}`;
      }
      
      const response = await generateContentWithFallback(ai, {
        model,
        contents: [...(history || []), { role: "user", parts: [{ text: message }] }],
        config: {
          systemInstruction: effectiveInstruction,
          temperature: 0.7,
          ...config
        },
      });
      
      res.json({ text: response.text || "" });
    } catch (error: any) {
      console.error("Chat error:", error);
      res.status(500).json({ error: error?.message || "Chat error occurred" });
    }
  });

  // Server-Sent Events (SSE) realtime streaming endpoint
  app.post("/api/stream", async (req, res) => {
    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    let sequence = 0;
    const sendFrame = (type: string, data: any) => {
      const frame = {
        type,
        sessionId: req.body.sessionId || "default-session",
        sequence: sequence++,
        timestamp: Date.now(),
        data
      };
      res.write(`data: ${JSON.stringify(frame)}\n\n`);
    };

    try {
      const { message, history, customInstruction, selectedAgent, userEmail } = req.body;
      const isIllia = userEmail === "illia.smileafterburn@gmail.com";
      const model = "gemini-3.7-flash";
      const config: any = {};
      
      if (isIllia) {
        config.thinkingConfig = { thinkingBudget: 1024 };
      }
      let effectiveInstruction = customInstruction || "";

      if (selectedAgent) {
        effectiveInstruction += `\n\n[АКТИВНИЙ ПІД-АГЕНТ: ${selectedAgent.name}]\n${selectedAgent.promptSnippet}`;
      }

      sendFrame("thought", {
        thoughtText: `Пані Думка оркеструє запит через ${selectedAgent?.name || " Chat Agent"}...`,
        phase: "analyzing"
      });

      const response = await generateContentWithFallback(ai, {
        model,
        contents: [...(history || []), { role: "user", parts: [{ text: message }] }],
        config: {
          systemInstruction: effectiveInstruction,
          temperature: 0.7,
          ...config
        },
      });

      const fullText = response.text || "";
      
      // Stream tokens in high-speed realistic rhythmic chunks
      const words = fullText.split(/(\s+)/);
      let accumulated = "";

      for (const word of words) {
        accumulated += word;
        sendFrame("token_delta", {
          token: word,
          accumulatedLength: accumulated.length,
          agentTag: selectedAgent?.tag || "@chat"
        });
      }

      sendFrame("done", { fullText });
      res.write("data: [DONE]\n\n");
      res.end();
    } catch (error: any) {
      console.error("Stream error:", error);
      sendFrame("error", { message: error?.message || "Stream error occurred" });
      res.write("data: [DONE]\n\n");
      res.end();
    }
  });

  app.post("/api/image", async (req, res) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const { prompt } = req.body;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image',
        contents: {
          parts: [{ text: prompt }]
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
            imageSize: "1K"
          }
        }
      });
      
      let imageBytes = null;
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          imageBytes = part.inlineData.data;
          break;
        }
      }
      
      if (imageBytes) {
        res.json({ imageBytes });
      } else {
        res.status(500).json({ error: "No image generated" });
      }
    } catch (error: any) {
      console.error("Image generation error:", error);
      res.status(500).json({ error: error.message || "Failed to generate image" });
    }
  });
  app.post("/api/music", async (req, res) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const { prompt, isPro } = req.body;
      
      const model = isPro ? "lyria-3-pro-preview" : "lyria-3-clip-preview";
      
      const response = await ai.models.generateContent({
        model,
        contents: prompt
      });
      
      // Extract the generated audio data
      const parts = response.candidates?.[0]?.content?.parts || [];
      const audioPart = parts.find(p => p.inlineData && p.inlineData.mimeType.startsWith('audio/'));
      
      if (audioPart && audioPart.inlineData) {
        res.json({ 
          audioData: audioPart.inlineData.data, 
          mimeType: audioPart.inlineData.mimeType 
        });
      } else {
        res.status(500).json({ error: "No audio generated in the response" });
      }
    } catch (error: any) {
      console.error("Music generation error:", error);
      res.status(500).json({ error: error.message || "Failed to generate music" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
