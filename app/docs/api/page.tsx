import fs from "node:fs/promises";
import path from "node:path";
import Link from "next/link";
import { ArrowLeft, KeyRound } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CopyButton } from "@/components/docs/CopyButton";
import { DocsToc } from "@/components/docs/DocsToc";

export const metadata = {
  title: "API v1 · QMaster",
  description: "REST API reference for QMaster",
};

// The reference lives in docs/api-v1.md so the repo and this page can never
// drift apart. Read per request — the file is small and this keeps edits live
// without a rebuild.
export const dynamic = "force-dynamic";

/** Heading id that matches what the ToC links to. */
function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function textOf(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (node && typeof node === "object" && "props" in (node as any)) {
    return textOf((node as any).props?.children);
  }
  return "";
}

export default async function ApiDocsPage() {
  let markdown: string;
  try {
    markdown = await fs.readFile(path.join(process.cwd(), "docs", "api-v1.md"), "utf8");
  } catch {
    markdown = "# API reference unavailable\n\nThe reference file could not be read on this server.";
  }

  // Build the sidebar from the h2/h3 headings so it always matches the doc.
  const toc = markdown
    .split("\n")
    .filter((l) => /^##\s|^###\s/.test(l))
    .map((l) => {
      const level = l.startsWith("### ") ? 3 : 2;
      const label = l.replace(/^#+\s*/, "").trim();
      return { level, label, id: slugify(label) };
    });

  return (
    <div className="min-h-screen bg-background text-text-main">
      <header className="sticky top-0 z-20 border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1180px] items-center gap-[14px] px-[24px] py-[13px]">
          <Link
            href="/projects"
            className="flex items-center gap-[6px] text-[13px] font-medium text-text-muted transition-colors hover:text-text-main"
          >
            <ArrowLeft size={16} /> Back to QMaster
          </Link>
          <div className="ml-auto">
            <Link
              href="/profile/api-tokens"
              className="inline-flex items-center gap-[7px] rounded-[9px] bg-primary px-[13px] py-[7px] text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              <KeyRound size={15} /> Create a token
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1180px] gap-[40px] px-[24px] py-[32px]">
        <DocsToc items={toc} />

        <article className="doc-body min-w-0 flex-1">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                <h1 className="mb-[10px] text-[30px] font-bold tracking-[-0.02em]">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2
                  id={slugify(textOf(children))}
                  className="scroll-mt-[80px] mt-[38px] mb-[12px] border-b border-border pb-[8px] text-[21px] font-bold tracking-[-0.015em]"
                >
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3
                  id={slugify(textOf(children))}
                  className="scroll-mt-[80px] mt-[26px] mb-[8px] text-[16.5px] font-bold"
                >
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p className="my-[12px] text-[14.5px] leading-[1.7] text-text-muted">{children}</p>
              ),
              ul: ({ children }) => (
                <ul className="my-[12px] list-disc space-y-[5px] pl-[22px] text-[14.5px] leading-[1.7] text-text-muted">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="my-[12px] list-decimal space-y-[5px] pl-[22px] text-[14.5px] leading-[1.7] text-text-muted">
                  {children}
                </ol>
              ),
              a: ({ href, children }) => (
                <a href={href} className="text-primary underline-offset-2 hover:underline">
                  {children}
                </a>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold text-text-main">{children}</strong>
              ),
              table: ({ children }) => (
                // Tables here list endpoints and can be wide — scroll the table
                // itself rather than letting the page scroll sideways.
                <div className="my-[16px] overflow-x-auto rounded-[10px] border border-border">
                  <table className="w-full border-collapse text-[13.5px]">{children}</table>
                </div>
              ),
              thead: ({ children }) => <thead className="bg-surface-hover/50">{children}</thead>,
              th: ({ children }) => (
                <th className="border-b border-border px-[14px] py-[9px] text-left text-[11.5px] font-semibold uppercase tracking-[0.05em] text-text-faint">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="border-b border-border px-[14px] py-[9px] align-top text-text-muted last:border-0">
                  {children}
                </td>
              ),
              code: ({ className, children }) => {
                const isBlock = Boolean(className?.startsWith("language-"));
                if (!isBlock) {
                  return (
                    <code className="qm-mono rounded-[5px] bg-surface-hover px-[6px] py-[2px] text-[12.5px] text-text-main">
                      {children}
                    </code>
                  );
                }
                return <code className="qm-mono text-[12.5px] leading-[1.65]">{children}</code>;
              },
              pre: ({ children }) => {
                const source = textOf(children);
                return (
                  <div className="group relative my-[16px]">
                    <pre className="overflow-x-auto rounded-[10px] border border-border bg-surface-hover px-[16px] py-[13px]">
                      {children}
                    </pre>
                    <CopyButton value={source} />
                  </div>
                );
              },
              blockquote: ({ children }) => (
                <blockquote className="my-[14px] border-l-[3px] border-primary/40 bg-primary-light/25 py-[2px] pl-[14px]">
                  {children}
                </blockquote>
              ),
              hr: () => <hr className="my-[28px] border-border" />,
            }}
          >
            {markdown}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
}
