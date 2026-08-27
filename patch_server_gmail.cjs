const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// 1. Add imports
code = code.replace(
  /import \{ listMcpTools, callMcpTool \} from "\.\/src\/services\/mcp";/,
  'import { listMcpTools, callMcpTool } from "./src/services/mcp";\nimport { listEmails, readEmail, sendEmail } from "./src/services/gmail";'
);

// 2. Add tools
const gmailTools = `
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
`;
code = code.replace(
  /name: "activate_agent",/,
  gmailTools + '\n        {\n          name: "activate_agent",'
);

// 3. Add handlers
const gmailHandlers = `
              } else if (call.name === "gmail_list_emails") {
                if (!token) {
                  functionResponses.push({ id: call.id, name: call.name, response: { error: "Потрібна авторизація Google Workspace. Попросіть користувача увійти через Google." } });
                } else {
                  try {
                    const emails = await listEmails(token, call.args.query, call.args.maxResults);
                    functionResponses.push({ id: call.id, name: call.name, response: { emails } });
                  } catch (e) {
                    functionResponses.push({ id: call.id, name: call.name, response: { error: e.message } });
                  }
                }
              } else if (call.name === "gmail_read_email") {
                if (!token) {
                  functionResponses.push({ id: call.id, name: call.name, response: { error: "Потрібна авторизація Google Workspace." } });
                } else {
                  try {
                    const email = await readEmail(token, call.args.messageId);
                    functionResponses.push({ id: call.id, name: call.name, response: { email } });
                  } catch (e) {
                    functionResponses.push({ id: call.id, name: call.name, response: { error: e.message } });
                  }
                }
              } else if (call.name === "gmail_send_email") {
                if (!token) {
                  functionResponses.push({ id: call.id, name: call.name, response: { error: "Потрібна авторизація Google Workspace." } });
                } else {
                  try {
                    const result = await sendEmail(token, call.args.to, call.args.subject, call.args.bodyText);
                    functionResponses.push({ id: call.id, name: call.name, response: { result } });
                  } catch (e) {
                    functionResponses.push({ id: call.id, name: call.name, response: { error: e.message } });
                  }
                }
`;
code = code.replace(
  /\} else if \(call\.name === "update_live_canvas"\) \{/,
  '} else if (call.name === "update_live_canvas") {' + gmailHandlers
);

fs.writeFileSync('server.ts', code);
console.log('patched server gmail');
