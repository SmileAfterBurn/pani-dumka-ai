const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  /\{\s*\{\s*name: "gmail_list_emails",/,
  '{\n          name: "gmail_list_emails",'
);

fs.writeFileSync('server.ts', code);
console.log('fixed server.ts');
