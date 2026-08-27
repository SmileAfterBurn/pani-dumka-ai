import { google } from 'googleapis';

export async function getGmailClient(token: string) {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: token });
  return google.gmail({ version: 'v1', auth: oauth2Client });
}

export async function listEmails(token: string, query: string = "in:inbox", maxResults: number = 5) {
  const gmail = await getGmailClient(token);
  const res = await gmail.users.messages.list({
    userId: 'me',
    q: query,
    maxResults
  });
  
  const messages = res.data.messages || [];
  const detailedMessages = [];
  
  for (const msg of messages) {
    if (msg.id) {
      const msgDetails = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'metadata',
        metadataHeaders: ['From', 'Subject', 'Date']
      });
      
      const headers = msgDetails.data.payload?.headers || [];
      const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
      const from = headers.find(h => h.name === 'From')?.value || 'Unknown';
      const date = headers.find(h => h.name === 'Date')?.value || '';
      
      detailedMessages.push({
        id: msg.id,
        snippet: msgDetails.data.snippet,
        subject,
        from,
        date
      });
    }
  }
  return detailedMessages;
}

export async function readEmail(token: string, messageId: string) {
  const gmail = await getGmailClient(token);
  const res = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'full'
  });
  
  // Basic plain text extraction
  let body = '';
  
  function extractParts(parts: any[]) {
    for (const part of parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        body += Buffer.from(part.body.data, 'base64').toString('utf8') + '\n';
      } else if (part.parts) {
        extractParts(part.parts);
      }
    }
  }
  
  const payload = res.data.payload;
  if (payload) {
    if (payload.mimeType === 'text/plain' && payload.body?.data) {
      body = Buffer.from(payload.body.data, 'base64').toString('utf8');
    } else if (payload.parts) {
      extractParts(payload.parts);
    }
  }
  
  return {
    id: res.data.id,
    snippet: res.data.snippet,
    body: body || res.data.snippet
  };
}

export async function sendEmail(token: string, to: string, subject: string, bodyText: string) {
  const gmail = await getGmailClient(token);
  
  const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
  const messageParts = [
    `To: ${to}`,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${utf8Subject}`,
    '',
    bodyText,
  ];
  const message = messageParts.join('\n');
  const encodedMessage = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
    
  const res = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedMessage,
    },
  });
  
  return res.data;
}
