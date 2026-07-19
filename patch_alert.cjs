const fs = require('fs');
let code = fs.readFileSync('src/main.tsx', 'utf8');

// Replace the previous patch with a better one
code = code.replace(/window\.alert = .*?\n.*?\n.*?\n.*?\n.*?;/g, `
  window.alert = (msg) => {
    console.log("ALERT:", msg);
    const div = document.createElement('div');
    div.style.position = 'fixed';
    div.style.bottom = '20px';
    div.style.right = '20px';
    div.style.backgroundColor = '#ef4444';
    div.style.color = 'white';
    div.style.padding = '12px 20px';
    div.style.borderRadius = '8px';
    div.style.zIndex = '999999';
    div.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
    div.style.fontFamily = 'system-ui, sans-serif';
    div.style.fontSize = '14px';
    div.style.fontWeight = '500';
    div.innerText = msg;
    document.body.appendChild(div);
    setTimeout(() => {
      div.style.opacity = '0';
      div.style.transition = 'opacity 0.5s ease';
      setTimeout(() => div.remove(), 500);
    }, 4000);
  };
`);

fs.writeFileSync('src/main.tsx', code);
