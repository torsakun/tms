"use client";

import React, { useState, useEffect, use } from "react";
import {
  GitBranch,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function ProjectIntegrationsPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [settings, setSettings] = useState({
    githubOwner: "",
    githubRepo: "",
    githubToken: "",
    githubWorkflowId: "",
    msTeamsWebhookUrl: "",
  });

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/projects/${code}/integrations`);
        if (res.ok) {
          const data = await res.json();
          const integ = data.integrations || {};
          setSettings({
            githubOwner: integ.githubOwner || "",
            githubRepo: integ.githubRepo || "",
            githubToken: integ.githubToken || "",
            githubWorkflowId: integ.githubWorkflowId || "",
            msTeamsWebhookUrl: integ.msTeamsWebhookUrl || "",
          });
        }
      } catch (err) {
        console.error("Failed to load settings", err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [code]);

  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/projects/${code}/integrations`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save settings");

      setSuccess("Integrations saved successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 overflow-y-auto h-full pb-20">
      <header>
        <h1 className="text-2xl font-bold text-text-main flex items-center">
          <GitBranch className="mr-3 text-text-main dark:text-slate-200" />
          Integrations
        </h1>
        <p className="text-sm text-text-muted mt-2">
          Configure external services and tools for your project.
        </p>
      </header>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center shadow-inner">
          <AlertCircle size={18} className="mr-2" /> {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 flex items-center shadow-inner">
          <CheckCircle2 size={18} className="mr-2" /> {success}
        </div>
      )}

      <div className="bg-surface rounded-2xl shadow-premium border border-border/80 p-6 space-y-6 animate-in zoom-in-95 duration-200">
        <h2 className="text-lg font-bold text-text-main mb-4 border-b border-border/80 pb-3">
          GitHub Setup
        </h2>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[13px] font-bold text-text-main uppercase tracking-wider">
              GitHub Owner
            </label>
            <input
              type="text"
              value={settings.githubOwner}
              onChange={(e) =>
                setSettings({ ...settings, githubOwner: e.target.value })
              }
              placeholder="e.g., torsakun"
              className="w-full bg-background border border-border/80 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-text-main focus:ring-4 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-inner hover:border-text-muted/40"
            />
            <p className="text-xs text-text-muted">
              The organization or user account name.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-bold text-text-main uppercase tracking-wider">
              GitHub Repository Name
            </label>
            <input
              type="text"
              value={settings.githubRepo}
              onChange={(e) =>
                setSettings({ ...settings, githubRepo: e.target.value })
              }
              placeholder="e.g., ai_testing"
              className="w-full bg-background border border-border/80 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-text-main focus:ring-4 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-inner hover:border-text-muted/40"
            />
            <p className="text-xs text-text-muted">
              The name of the target repository.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[13px] font-bold text-text-main uppercase tracking-wider">
            GitHub Personal Access Token
          </label>
          <input
            type="password"
            value={settings.githubToken}
            onChange={(e) =>
              setSettings({ ...settings, githubToken: e.target.value })
            }
            placeholder="ghp_..."
            className="w-full bg-background border border-border/80 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-text-main focus:ring-4 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-inner hover:border-text-muted/40"
          />
          <p className="text-xs text-text-muted">
            A token with 'repo' scope access. Leave blank to use the global
            token from .env.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-[13px] font-bold text-text-main uppercase tracking-wider">
            Actions Workflow Filename
          </label>
          <input
            type="text"
            value={settings.githubWorkflowId}
            onChange={(e) =>
              setSettings({ ...settings, githubWorkflowId: e.target.value })
            }
            placeholder="e.g., playwright.yml"
            className="w-full bg-background border border-border/80 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-text-main focus:ring-4 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-inner hover:border-text-muted/40"
          />
          <p className="text-xs text-text-muted">
            Optional. Specify a custom workflow YAML file name. Defaults to
            playwright.yml
          </p>
        </div>

        <h2 className="text-lg font-bold text-text-main mt-8 mb-4 border-b border-border/80 pb-3">
          Microsoft Teams Notifications
        </h2>
        <div className="space-y-2">
          <label className="text-[13px] font-bold text-text-main uppercase tracking-wider">
            MS Teams Incoming Webhook URL
          </label>
          <input
            type="text"
            value={settings.msTeamsWebhookUrl}
            onChange={(e) =>
              setSettings({ ...settings, msTeamsWebhookUrl: e.target.value })
            }
            placeholder="https://your-company.webhook.office.com/..."
            className="w-full bg-background border border-border/80 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-text-main focus:ring-4 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-inner hover:border-text-muted/40"
          />
          <p className="text-xs text-text-muted">
            When a Test Run completes, a summary card will be posted to this
            channel.
          </p>
        </div>

        <div className="pt-8 border-t border-border/80 flex justify-end">
          <Button
            variant="primary"
            onClick={handleSave}
            loading={isSaving}
            className="shadow-premium hover:-translate-y-0.5"
          >
            {!isSaving && <Save size={16} />}
            Save Settings
          </Button>
        </div>
      </div>

      {/* Setup Instructions Section */}
      <div className="bg-surface rounded-2xl shadow-premium border border-border/80 p-6 mt-8 space-y-6 animate-in zoom-in-95 duration-200">
        <header>
          <h2 className="text-xl font-bold text-text-main">
            Setup Instructions for GitHub Repository
          </h2>
          <p className="text-sm text-text-muted mt-2">
            To allow your GitHub repository to automatically report Playwright
            test results back to TESSA, add the following files to your
            repository.
          </p>
        </header>

        <div className="space-y-6">
          {/* Step 1 */}
          <div>
            <h3 className="text-[14px] font-bold text-text-main mb-2">
              1. Add Custom Reporter (<code>tessa-reporter.ts</code>)
            </h3>
            <p className="text-xs text-text-muted mb-3">
              Save this file in the root of your Playwright project. It sends
              pass/fail logs back to our webhook.
            </p>
            <div className="relative group">
              <textarea
                readOnly
                className="w-full h-64 p-4 bg-[#0d1117] border border-slate-800/80 rounded-xl text-xs font-mono leading-relaxed text-[#c9d1d9] resize-none focus:outline-none shadow-inner"
                value={`import { Reporter, TestCase, TestResult } from '@playwright/test/reporter';

class TessaReporter implements Reporter {
  private apiUrl = process.env.TESSA_API_URL || '';
  private runId = process.env.TESSA_RUN_ID;

  async onTestEnd(test: TestCase, result: TestResult) {
    if (!this.runId || !this.apiUrl) return;

    // Extract Case ID from test title or file name
    const filename = test.location.file.split(/[\\/]/).pop() || '';
    const match = test.title.match(/([A-Z0-9]+-[A-Za-z0-9]{4})/i) || 
                  filename.match(/([A-Z0-9]+-[A-Za-z0-9]{4})/i);
    const caseId = match ? match[1] : null;

    if (caseId) {
      const status = result.status === 'passed' ? 'PASSED' : 
                     result.status === 'skipped' ? 'SKIPPED' : 'FAILED';
      
      const logs = result.errors.map(e => e.message).join('\\n') || 'Test completed successfully.';

      try {
        await fetch(\`\${this.apiUrl}/api/webhooks/playwright/reporter\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ runId: this.runId, caseId, status, logs })
        });
      } catch (err) {
        console.error('Failed to report to TESSA:', err);
      }
    }
  }
}
export default TessaReporter;`}
              />
              <button
                onClick={(e) => {
                  const target = e.currentTarget;
                  navigator.clipboard.writeText(
                    target.previousElementSibling!.textContent || "",
                  );
                  const originalText = target.innerHTML;
                  target.innerHTML = "Copied!";
                  setTimeout(() => {
                    target.innerHTML = originalText;
                  }, 2000);
                }}
                className="absolute top-4 right-4 px-3 py-1.5 bg-slate-800 text-slate-300 rounded-md text-xs font-bold hover:bg-slate-700 hover:text-white transition-colors shadow-sm"
              >
                Copy
              </button>
            </div>
          </div>

          {/* Step 2 */}
          <div>
            <h3 className="text-[14px] font-bold text-text-main mb-2">
              2. GitHub Actions Workflow (
              <code>.github/workflows/playwright.yml</code>)
            </h3>
            <p className="text-xs text-text-muted mb-3">
              Create or update this workflow file to listen for API triggers
              from TESSA.
            </p>
            <div className="relative group">
              <textarea
                readOnly
                className="w-full h-[400px] p-4 bg-[#0d1117] border border-slate-800/80 rounded-xl text-xs font-mono leading-relaxed text-[#c9d1d9] resize-none focus:outline-none shadow-inner"
                value={`name: Playwright Tests
on:
  workflow_dispatch:
    inputs:
      run_id:
        description: 'TESSA Run ID'
        required: true
      case_ids:
        description: 'TESSA Case IDs (space separated)'
        required: true

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
      
      - name: Install dependencies
        run: npm install

      - name: Install Playwright Browsers
        run: npx playwright install --with-deps

      - name: Run Playwright tests
        run: |
          PATTERN=$(echo "\${{ github.event.inputs.case_ids }}" | tr ' ' '|')
          npx playwright test -g "$PATTERN" --reporter="./tessa-reporter.ts,html"
        env:
          TESSA_RUN_ID: \${{ github.event.inputs.run_id }}
          TESSA_API_URL: \${{ secrets.TESSA_API_URL }}

      - name: Upload HTML Report to TESSA
        if: always()
        run: |
          if [ -d "playwright-report" ]; then
            cd playwright-report
            zip -r report.zip .
            curl -X POST -F "file=@report.zip" \${{ secrets.TESSA_API_URL }}/api/webhooks/playwright/\${{ github.event.inputs.run_id }}/report
          else
            echo "No playwright-report directory found."
          fi`}
              />
              <button
                onClick={(e) => {
                  const target = e.currentTarget;
                  navigator.clipboard.writeText(
                    target.previousElementSibling!.textContent || "",
                  );
                  const originalText = target.innerHTML;
                  target.innerHTML = "Copied!";
                  setTimeout(() => {
                    target.innerHTML = originalText;
                  }, 2000);
                }}
                className="absolute top-4 right-4 px-3 py-1.5 bg-slate-800 text-slate-300 rounded-md text-xs font-bold hover:bg-slate-700 hover:text-white transition-colors shadow-sm"
              >
                Copy
              </button>
            </div>
          </div>

          {/* Step 3 */}
          <div>
            <h3 className="text-[14px] font-bold text-text-main mb-2">
              3. Configure GitHub Secrets
            </h3>
            <p className="text-xs text-text-muted">
              In your GitHub repository, go to{" "}
              <strong>Settings &gt; Secrets and variables &gt; Actions</strong>{" "}
              and add a new repository secret:
            </p>
            <div className="mt-3 p-5 bg-surface-hover/50 border border-border/80 rounded-xl text-[13px]">
              <div>
                <strong className="text-text-main">Name:</strong>{" "}
                <code className="bg-slate-200 px-1 py-0.5 rounded text-text-main">
                  TESSA_API_URL
                </code>
              </div>
              <div className="mt-1">
                <strong className="text-text-main">Value:</strong> (The URL
                where your TESSA instance is hosted, e.g.,{" "}
                <code>https://tms.yourdomain.com</code>)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
