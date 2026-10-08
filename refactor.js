const fs = require('fs');
const files = ['FrontPG.html', 'CgpACal.html', 'PreviousQ.html', 'study-material.html', 'submitQ.html', 'MakeupExam.html', 'Permission.html', 'admin.html', 'admin-approve.html', 'admin-resources.html', 'clubFrom.html'];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');

  if (content.includes('<classmate-navbar')) return;

  const headerStart = content.indexOf('<header');
  const headerEnd = content.indexOf('</header>', headerStart);

  if (headerStart !== -1 && headerEnd !== -1) {
    const beforeHeader = content.substring(0, headerStart);
    const afterHeader = content.substring(headerEnd + 9);
    
    // Add script to head if missing
    let newBeforeHeader = beforeHeader;
    if (!newBeforeHeader.includes('js/components/navbar.js')) {
      newBeforeHeader = newBeforeHeader.replace('</head>', '  <script src=\"js/components/navbar.js\"></script>\n</head>');
    }

    content = newBeforeHeader + '  <classmate-navbar home-link=\"index.html\"></classmate-navbar>' + afterHeader;

    fs.writeFileSync(file, content);
    console.log('Updated', file);
  }
});
