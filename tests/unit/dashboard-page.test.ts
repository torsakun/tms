import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  project: {
    count: vi.fn(),
    findMany: vi.fn()
  },
  testCase: {
    count: vi.fn()
  },
  testRun: {
    count: vi.fn(),
    findMany: vi.fn()
  },
  pipelineSchedule: {
    findMany: vi.fn()
  }
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) =>
    React.createElement("a", { href, ...props }, children)
}));

vi.mock("@/app/dashboards/components/DashboardCharts", () => ({
  ExecutionTrendChart: ({ data }: { data: unknown[] }) =>
    React.createElement("div", { "data-testid": "execution-trend-chart" }, `Trend points: ${data.length}`),
  AutomationDonutChart: ({ data }: { data: { automated: number; manual: number; toBeAutomated: number } }) =>
    React.createElement(
      "div",
      { "data-testid": "automation-donut-chart" },
      `Automation: ${data.automated}/${data.manual}/${data.toBeAutomated}`
    )
}));

import GlobalDashboardPage from "@/app/dashboards/page";

function renderDashboard() {
  return GlobalDashboardPage().then((element) => renderToStaticMarkup(element));
}

function mockDashboardData() {
  prismaMock.project.count.mockResolvedValue(2);
  prismaMock.testCase.count
    .mockResolvedValueOnce(24)
    .mockResolvedValueOnce(10)
    .mockResolvedValueOnce(8)
    .mockResolvedValueOnce(6);
  prismaMock.testRun.count.mockResolvedValue(5);
  prismaMock.project.findMany.mockResolvedValue([
    {
      code: "PAY",
      name: "Payments",
      _count: { testCases: 3, testRuns: 2 },
      testCases: [
        { automationStatus: "AUTOMATED" },
        { automationStatus: "AUTOMATED" },
        { automationStatus: "MANUAL" }
      ],
      testRuns: [
        {
          results: [
            { status: "PASSED" },
            { status: "FAILED" }
          ]
        }
      ]
    }
  ]);
  prismaMock.testRun.findMany
    .mockResolvedValueOnce([
      {
        id: "run-1",
        title: "Regression Run",
        status: "COMPLETED",
        createdAt: new Date("2026-05-15T10:00:00.000Z"),
        project: { name: "Payments", code: "PAY" },
        results: [
          { status: "PASSED" },
          { status: "PASSED" },
          { status: "FAILED" },
          { status: "SKIPPED" }
        ]
      }
    ])
    .mockResolvedValueOnce([
      {
        createdAt: new Date(),
        results: [
          { status: "PASSED" },
          { status: "FAILED" }
        ]
      }
    ]);
  prismaMock.pipelineSchedule.findMany.mockResolvedValue([
    {
      id: "schedule-1",
      title: "Nightly smoke",
      cron: "0 2 * * *",
      project: { name: "Payments", code: "PAY" }
    }
  ]);
}

function mockEmptyDashboardData() {
  prismaMock.project.count.mockResolvedValue(0);
  prismaMock.testCase.count.mockResolvedValue(0);
  prismaMock.testRun.count.mockResolvedValue(0);
  prismaMock.project.findMany.mockResolvedValue([]);
  prismaMock.testRun.findMany.mockResolvedValue([]);
  prismaMock.pipelineSchedule.findMany.mockResolvedValue([]);
}

describe("GlobalDashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the dashboard header", async () => {
    mockDashboardData();

    const html = await renderDashboard();

    expect(html).toContain("Quality Assurance Dashboard");
    expect(html).toContain("Cross-project testing metrics, coverage, and execution health.");
    expect(html).toContain("View All Projects");
  });

  it("renders summary cards with metrics from mocked dashboard data", async () => {
    mockDashboardData();

    const html = await renderDashboard();

    expect(html).toContain("Total Test Cases");
    expect(html).toContain(">24<");
    expect(html).toContain("Across 2 active projects");
    expect(html).toContain("Global Automation");
    expect(html).toContain(">41.7%<");
    expect(html).toContain("Total Test Runs");
    expect(html).toContain(">5<");
    expect(html).toContain("Global Pass Rate");
    expect(html).toContain(">50.0%<");
  });

  it("renders execution trend and automation chart containers", async () => {
    mockDashboardData();

    const html = await renderDashboard();

    expect(html).toContain("Execution Trends");
    expect(html).toContain("Test results over the last 14 days");
    expect(html).toContain('data-testid="execution-trend-chart"');
    expect(html).toContain("Trend points: 14");
    expect(html).toContain("Automation Distribution");
    expect(html).toContain('data-testid="automation-donut-chart"');
    expect(html).toContain("Automation: 10/8/6");
  });

  it("renders project, schedule, and recent execution data from mocked dashboard data", async () => {
    mockDashboardData();

    const html = await renderDashboard();

    expect(html).toContain("Project Quality Matrix");
    expect(html).toContain("Payments");
    expect(html).toContain("Nightly smoke");
    expect(html).toContain("Live Execution Center");
    expect(html).toContain("Regression Run");
  });

  it("renders empty dashboard states when no data exists", async () => {
    mockEmptyDashboardData();

    const html = await renderDashboard();

    expect(html).toContain(">0<");
    expect(html).toContain(">0.0%<");
    expect(html).toContain("Across 0 active projects");
    expect(html).toContain("Automation: 0/0/0");
    expect(html).toContain("No projects found.");
    expect(html).toContain("No recent test runs found.");
    expect(html).not.toContain("Upcoming Scheduled Pipelines");
  });

  it("falls back to the empty dashboard when data fetching fails", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    prismaMock.project.count.mockRejectedValue(new Error("database unavailable"));

    const html = await renderDashboard();

    expect(html).toContain("Quality Assurance Dashboard");
    expect(html).toContain("Across 0 active projects");
    expect(html).toContain("No projects found.");
    expect(html).toContain("No recent test runs found.");
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to fetch QA dashboard data:",
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });
});
