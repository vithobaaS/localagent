const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// Replace fetch('/api/...) but not /api/auth
content = content.replace(/\bfetch\((['"`])\/api\/(?!auth)/g, 'api($1/api/');

// Replace fetch(url
content = content.replace(/\bfetch\(url/g, 'api(url');

fs.writeFileSync('frontend/src/App.jsx', content);
console.log('App.jsx updated');
