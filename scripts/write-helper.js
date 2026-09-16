const fs = require('fs');
const path = require('path');
const targetPath = process.argv[2];
let data = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, data, 'utf8');
  console.log('Wrote ' + targetPath);
});
