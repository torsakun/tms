import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  project: {
    findMany: vi.fn()
  },
  testRunResult: {
    findMany: vi.fn()
  },
  testRun: {
    findMany: vi.fn()
  },
  linkedIssue: {
    findMany: vi.fn()
  },
  auditLog: {
    findMany: vi.fn()
  },
  pipelineSchedule: {
    findMany: vi.fn()
  }
}));

const getServerSessionMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock
}));

vi.mock("next-auth/next", () => ({
  getServerSession: getServerSessionMock
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {}
}));

vi.mock("next/font/google", () => ({
  Inter: () => ({ className: "font-inter" })
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) =>
    React.createElement("a", { href, ...props }, children)
}));

vi.mock("@/app/dashboards/DashboardFilters", () => ({
  DashboardFilters: ({ timeframe }: { timeframe: number }) =>
    React.createElement("div", { "data-testid": "dashboard-filters" }, `Filters ${timeframe}`)
}));

import GlobalDashboardPage from "@/app/dashboards/page";

function renderDashboard(searchParams: Record<string, string> = {}) {
  return GlobalDashboardPage({ searchParams: Promise.resolve(searchParams) }).then((element) =>
    renderToStaticMarkup(element)
  );
}

const oldDate = new Date("2026-01-01T00:00:00.000Z");
const recentDate = new Date();

function makeProject() {
  return {
    id: "p1",
    code: "PAY",
    name: "Payments",
    isArchived: false,
    createdAt: oldDate,
    updatedAt: recentDate,
    _count: { suites: 2, testCases: 3, testRuns: 2 },
    testCases: [
      { id: "tc1", automationStatus: "AUTOMATED", suiteId: "s1", priority: "HIGH", title: "Login test" },
      { id: "tc2", automationStatus: "AUTOMATED", suiteId: "s1", priority: "HIGH", title: "Payment test" },
      { id: "tc3", automationStatus: "MANUAL", suiteId: "s1", priority: "LOW", title: "Refund test" }
    ],
    testRuns: [
      {
        id: "r1",
        status: "ACTIVE",
        createdAt: recentDate,
        results: [{ status: "PASSED" }, { status: "FAILED" }]
      }
    ]
  };
}

function mockDashboardData() {
  getServerSessionMock.mockResolvedValue(null);

  // project.findMany is called twice: once for the filter list, once for projectData.
  prismaMock.project.findMany.mockResolvedValue([makeProject()]);

  const currentResults = [
    {
      status: "PASSED",
      updatedAt: recentDate,
      testRun: {
        id: "r1",
        title: "Regression Run",
        createdAt: recentDate,
        project: { code: "PAY", name: "Payments" }
      },
      testCase: { id: "tc1", title: "Login test", priority: "HIGH", suite: { title: "Auth" } }
    },
    {
      status: "FAILED",
      updatedAt: recentDate,
      testRun: {
        id: "r1",
        title: "Regression Run",
        createdAt: recentDate,
        project: { code: "PAY", name: "Payments" }
      },
      testCase: { id: "tc2", title: "Payment test", priority: "HIGH", suite: { title: "Pay" } }
    }
  ];

  // First testRunResult.findMany -> current results, second -> previous results.
  prismaMock.testRunResult.findMany.mockResolvedValueOnce(currentResults).mockResolvedValueOnce([]);

  // First testRun.findMany -> current runs, second -> previous runs.
  prismaMock.testRun.findMany
    .mockResolvedValueOnce([
      {
        id: "r1",
        title: "Regression Run",
        status: "COMPLETED",
        createdAt: recentDate,
        project: { code: "PAY", name: "Payments" },
        results: [{ status: "PASSED" }, { status: "FAILED" }]
      }
    ])
    .mockResolvedValueOnce([{ id: "r1" }]);

  prismaMock.linkedIssue.findMany.mockResolvedValue([
    {
      id: "issue-1",
      key: "BUG-1",
      summary: "Payment fails on retry",
      severity: "P1",
      status: "OPEN",
      url: "https://tracker/BUG-1",
      project: { code: "PAY" }
    }
  ]);

  prismaMock.auditLog.findMany.mockResolvedValue([
    {
      id: "audit-1",
      action: "CREATE_PROJECT",
      createdAt: recentDate,
      user: { name: "Alice", email: "alice@example.com" },
      project: { code: "PAY", name: "Payments" }
    }
  ]);

  prismaMock.pipelineSchedule.findMany.mockResolvedValue([
    {
      id: "schedule-1",
      title: "Nightly smoke",
      cron: "0 2 * * *",
      isActive: true,
      project: { code: "PAY", name: "Payments" }
    }
  ]);
}

function mockEmptyDashboardData() {
  getServerSessionMock.mockResolvedValue(null);
  prismaMock.project.findMany.mockResolvedValue([]);
  prismaMock.testRunResult.findMany.mockResolvedValue([]);
  prismaMock.testRun.findMany.mockResolvedValue([]);
  prismaMock.linkedIssue.findMany.mockResolvedValue([]);
  prismaMock.auditLog.findMany.mockResolvedValue([]);
  prismaMock.pipelineSchedule.findMany.mockResolvedValue([]);
}

describe("GlobalDashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the dashboard header", async () => {
    mockDashboardData();

    const html = await renderDashboard();

    expect(html).toContain("QA Overview");
    expect(html).toContain("Portfolio");
    expect(html).toContain("Quality across all 1 projects");
    expect(html).toContain("last 30 days");
  });

  it("renders KPI cards with metrics from mocked dashboard data", async () => {
    mockDashboardData();

    const html = await renderDashboard();

    expect(html).toContain("Overall pass rate");
    expect(html).toContain(">50%<"); // 1 of 2 current results passed
    expect(html).toContain("Total projects");
    expect(html).toContain("Total runs");
    expect(html).toContain(">2<"); // sum of _count.testRuns
    expect(html).toContain("Org automation");
    expect(html).toContain(">67%<"); // 2 of 3 cases automated
  });

  it("renders the ranked project list and quality grid visualizations", async () => {
    mockDashboardData();

    const html = await renderDashboard();

    expect(html).toContain("Projects, ranked by health");
    expect(html).toContain("click a project to open its overview");
    expect(html).toContain("Quality grid");
    expect(html).toContain("<polyline"); // sparkline trend markup
  });

  it("renders project, schedule, activity, and risk data from mocked dashboard data", async () => {
    mockDashboardData();

    const html = await renderDashboard();

    expect(html).toContain("Payments");
    expect(html).toContain("Upcoming schedules");
    expect(html).toContain("Nightly smoke");
    expect(html).toContain("Org activity");
    expect(html).toContain("Alice");
    expect(html).toContain("Payment test"); // top failing case
    expect(html).toContain("Payment fails on retry"); // open defect
  });

  it("renders empty dashboard states when no data exists", async () => {
    mockEmptyDashboardData();

    const html = await renderDashboard();

    expect(html).toContain(">0<");
    expect(html).toContain(">0%<");
    expect(html).toContain("Quality across all 0 projects");
    expect(html).toContain("No projects yet.");
    expect(html).toContain("No execution data in the last 30 days.");
    expect(html).toContain("No items to review.");
    expect(html).toContain("No assigned active work.");
    expect(html).toContain("No recent activity.");
    expect(html).toContain("No active schedules.");
  });

  it("propagates the error when data fetching fails (no fallback exists on main)", async () => {
    getServerSessionMock.mockResolvedValue(null);
    prismaMock.project.findMany.mockRejectedValue(new Error("database unavailable"));

    await expect(renderDashboard()).rejects.toThrow("database unavailable");
  });
});
