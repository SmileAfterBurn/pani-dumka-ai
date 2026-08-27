const fs = require('fs');
let code = fs.readFileSync('src/hooks/useLiveConversation.ts', 'utf8');

// Update useLiveConversation hook signature to accept voiceId
code = code.replace(
  /export function useLiveConversation\(\) \{/,
  'export function useLiveConversation(voiceId?: string) {'
);

// Update connectWs to include voiceId
code = code.replace(
  /const wsUrl = \`\$\{protocol\}\/\/\$\{window\.location\.host\}\/live\$\{accessToken \? \`\?token=\$\{accessToken\}\` : ''\}\`;/,
  `const queryParams = new URLSearchParams();
    if (accessToken) queryParams.append("token", accessToken);
    if (voiceId) queryParams.append("voiceId", voiceId);
    const queryString = queryParams.toString();
    const wsUrl = \`\$\{protocol\}//\$\{window.location.host\}/live\$\{queryString ? '?' + queryString : ''\}\`;`
);

fs.writeFileSync('src/hooks/useLiveConversation.ts', code);
console.log('patched useLiveConversation');
