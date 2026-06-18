const fs = require('fs');
const path = require('path');

function replaceGradients(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceGradients(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      let newContent = content;
      // Replace all linear-gradients with var(--primary)
      newContent = newContent.replace(/linear-gradient\([^)]+\)/g, "var(--primary)");
      
      // Also remove topnav-accent
      newContent = newContent.replace(/<div className="topnav-accent w-full" \/>/g, "");
      
      // Also remove boxShadow: "0 4px 20px rgba(79,70,229,0.30)"
      newContent = newContent.replace(/boxShadow:\s*"[^"]*rgba\([^)]+\)[^"]*"/g, 'boxShadow: "var(--shadow-sm)"');
      
      if (newContent !== content) {
        fs.writeFileSync(fullPath, newContent);
        console.log("Updated", fullPath);
      }
    }
  }
}

replaceGradients(path.join(__dirname, 'app'));
replaceGradients(path.join(__dirname, 'components'));
