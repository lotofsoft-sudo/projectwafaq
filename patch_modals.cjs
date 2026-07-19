const fs = require('fs');
let code = fs.readFileSync('src/main.tsx', 'utf8');

if (!code.includes('window.confirm =')) {
  const patch = `
if (typeof window !== 'undefined') {
  window.confirm = () => true;
  const originalAlert = window.alert;
  window.alert = (msg) => {
    console.log("ALERT:", msg);
    // Try to use original alert, but catch if it's blocked by sandbox
    try { originalAlert(msg); } catch (e) { console.warn("Alert blocked by sandbox:", e); }
  };
}
`;
  code = code.replace("import App from './App.tsx';", "import App from './App.tsx';" + patch);
  fs.writeFileSync('src/main.tsx', code);
}
