const fs = require('fs');

const files = [
  "app/projects/ProjectList.tsx",
  "app/projects/[code]/runs/TestRunsList.tsx",
  "components/repository/RepositoryContent.tsx",
  "components/runs/RunExecutionClient.tsx"
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/var\(--primary\)/g, "linear-gradient(135deg, #4f46e5, #7c3aed)");
  content = content.replace(/var\(--shadow-sm\)/g, "0 4px 20px rgba(79,70,229,0.30)");
  fs.writeFileSync(file, content);
}
console.log("Reversed var(--primary) in 4 files");
