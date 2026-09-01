const fs = require('fs');
const path = require('path');

const dir = './';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html') && f !== 'Propuesta_Centro_Padres.html');

for (const file of files) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    if (!content.includes('manifest.json')) {
        content = content.replace('</head>', '    <link rel="manifest" href="manifest.json">\n</head>');
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${file}`);
    } else {
        console.log(`Skipped ${file} (already has manifest)`);
    }
}
