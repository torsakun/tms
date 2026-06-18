const fs = require('fs');

const file = "components/runs/RunExecutionClient.tsx";
let content = fs.readFileSync(file, 'utf8');

const target = `<span
            className={\`inline-flex px-2 py-0.5 text-[11px] font-bold rounded mr-3 \${getStatusColor(result.status)}\`}
          >
            {result.status === "IN_PROGRESS"
              ? "Untested"
              : result.status.charAt(0) + result.status.slice(1).toLowerCase()}
          </span>`;

const replacement = `<span
            className={\`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-extrabold rounded-md uppercase tracking-wider mr-3 transition-all \${getStatusColor(result.status)}\`}
          >
            {result.status === "IN_PROGRESS" && (
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-slate-400"></span>
              </span>
            )}
            {result.status === "IN_PROGRESS"
              ? "Untested"
              : result.status}
          </span>`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content);
console.log("Updated span rendering in RunExecutionClient.tsx");
