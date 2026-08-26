import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, LiveServerMessage, Modality, Type } from "@google/genai";
import { WebSocketServer } from "ws";
import { createServer } from "http";
import { listMcpTools, callMcpTool } from "./src/services/mcp";
import { mcpSchemaToGeminiSchema } from "./mcp_mapper";

async function streamElevenLabs(text: string, ws: import("ws").WebSocket) {
  if (!text.trim()) return;
  try {
    let apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey || !apiKey.startsWith('sk_')) {
      apiKey = "sk_31d301a370c8c6ff93f46da06e58bc1a64cd05afc88f03f4";
    }
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/XsDwVNgam5laFw4WF7S6/stream?output_format=pcm_24000`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2'
      })
    });

    if (!response.ok) {
       console.error("ElevenLabs error:", await response.text());
       return;
    }

    if (response.body) {
      let leftover = Buffer.alloc(0);
      // @ts-ignore
      for await (const chunk of response.body) {
        const data = Buffer.concat([leftover, Buffer.from(chunk)]);
        const remainder = data.length % 2;
        const validData = data.subarray(0, data.length - remainder);
        leftover = data.subarray(data.length - remainder);
        
        if (validData.length > 0 && ws.readyState === 1) { // OPEN
          ws.send(JSON.stringify({ audio: validData.toString('base64') }));
        }
      }
    }
  } catch (err) {
    console.error("Error streaming from ElevenLabs:", err);
  }
}

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

  // API route for transcription using gemini-3.5-flash
  app.post("/api/transcribe", async (req, res) => {
    try {
      const { audioBase64, mimeType } = req.body;
      if (!audioBase64) {
        return res.status(400).json({ error: "Missing audioBase64" });
      }
      
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            inlineData: {
              data: audioBase64,
              mimeType: mimeType || "audio/webm",
            }
          },
          "Please transcribe the following audio in Ukrainian."
        ]
      });
      
      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Transcription error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  const server = createServer(app);
  const wss = new WebSocketServer({ server, path: '/live' });

  wss.on("connection", async (clientWs) => {
    let textBuffer = "";
    
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
        ...mcpFunctionDeclarations
      ]
    }];

    try {
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

👥 Твоя команда (Реєстр Агентів)

Ти ніколи не виконуєш вузькопрофільну роботу сама, ти — керуєш. Твої фахівці:

Chat Agent — базовий агент для загальних розмов та синтезу текстів.
Vision Agent — експерт з аналізу зображень та комп'ютерного зору.
Task Agent — менеджер завдань, цілей та нагадувань.
Security Agent — офіцер з кібербезпеки, аудитів та аналізу загроз.
Osint Agent — розвідник з пошуку інформації у відкритих джерелах.
Osint Profiler Agent — експерт з глибокого профілювання та зв'язків.
Finance Agent — фінансовий аналітик (ринки, акції, трейдинг).
Recommend Agent — фахівець з підбору персоналізованих рекомендацій.
Game Master Agent — майстер ігор, квестів, сценаріїв та симуляцій.
Data Agent — аналітик масивів даних, SQL та датасетів.
Code Agent — головний розробник, архітектор коду та дебагер.
Mcp Agent — інженер зовнішніх інтеграцій та інструментів.
Science Agent — науковий співробітник (біоінформатика, геном, дослідження).
Stan Agent — аналітик поточного стану, настрою та вподобань користувача.
Lytopisec Agent — архіваріус та літописець (довгострокова пам'ять та історія).

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
            
            let inputTranscription = null;
            let outputTranscription = null;
            
            if (message.serverContent?.modelTurn?.parts) {
               for (const part of message.serverContent.modelTurn.parts) {
                  if (part.text) {
                     outputTranscription = (outputTranscription || "") + part.text;
                     textBuffer += part.text;
                     
                     // Send to ElevenLabs sentence by sentence
                     const match = textBuffer.match(/(.*?[.?!])(\s+|$)(.*)/);
                     if (match) {
                        const sentence = match[1];
                        textBuffer = match[3] || "";
                        streamElevenLabs(sentence, clientWs);
                     }
                  }
               }
            }

            if (message.serverContent?.interrupted) {
              textBuffer = ""; // clear buffer on interrupt
              clientWs.send(JSON.stringify({ interrupted: true }));
            }
            
            if (message.serverContent?.turnComplete) {
              if (textBuffer.trim().length > 0) {
                 streamElevenLabs(textBuffer, clientWs);
                 textBuffer = "";
              }
            }
            
            if (message.toolCall) {
              const clientToolCalls = [];
              
              for (const call of message.toolCall.functionCalls) {
                if (call.name.startsWith("mcp_")) {
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
