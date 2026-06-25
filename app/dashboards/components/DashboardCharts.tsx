"use client";

import React, { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["var(--success)", "var(--warning)", "var(--skip)"];

interface DashboardChartsProps {
  trendData: Array<{
    date: string;
    passed: number;
    failed: number;
    blocked: number;
    skipped: number;
  }>;
  automationData: {
    automated: number;
    manual: number;
    toBeAutomated: number;
  };
}

type TooltipPayload = {
  color?: string;
  name?: string;
  value?: React.ReactNode;
};

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: React.ReactNode;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border bg-surface p-3 shadow-lg">
        <p className="text-sm font-bold text-text-main mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div
            key={`item-${index}`}
            className="flex items-center space-x-2 text-sm mb-1"
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="font-medium text-text-muted capitalize">
              {entry.name}:
            </span>
            <span className="font-bold text-text-main">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function ExecutionTrendChart({
  data,
}: {
  data: DashboardChartsProps["trendData"];
}) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-text-muted font-medium text-sm">
        No execution data available for trend analysis.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={280} minHeight={220}>
      <AreaChart
        data={data}
        margin={{ top: 8, right: 12, left: -18, bottom: 0 }}
      >
        <defs>
          <linearGradient id="colorPassed" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--success)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--success)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--danger)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--danger)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="4 4"
          vertical={false}
          stroke="var(--border-color)"
        />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12, fill: "var(--text-muted)" }}
          dy={10}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12, fill: "var(--text-muted)" }}
        />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{
            stroke: "var(--border-color)",
            strokeWidth: 1,
            strokeDasharray: "4 4",
          }}
        />
        <Area
          type="monotone"
          dataKey="passed"
          name="Passed"
          stroke="var(--success)"
          strokeWidth={3}
          fillOpacity={1}
          fill="url(#colorPassed)"
          activeDot={{ r: 6, strokeWidth: 0, fill: "var(--success)" }}
        />
        <Area
          type="monotone"
          dataKey="failed"
          name="Failed"
          stroke="var(--danger)"
          strokeWidth={3}
          fillOpacity={1}
          fill="url(#colorFailed)"
          activeDot={{ r: 6, strokeWidth: 0, fill: "var(--danger)" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function AutomationDonutChart({
  data,
}: {
  data: DashboardChartsProps["automationData"];
}) {
  const pieData = useMemo(
    () =>
      [
        { name: "Automated", value: data.automated },
        { name: "Manual", value: data.manual },
        { name: "To Be Automated", value: data.toBeAutomated },
      ].filter((item) => item.value > 0),
    [data],
  );

  const total = data.automated + data.manual + data.toBeAutomated;
  const automatedPercent =
    total > 0 ? Math.round((data.automated / total) * 100) : 0;

  if (total === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm font-medium text-text-muted">
        No test cases found.
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      <ResponsiveContainer width="100%" height="100%" minWidth={180} minHeight={180}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius="65%"
            outerRadius="85%"
            paddingAngle={2}
            dataKey="value"
            stroke="none"
          >
            {pieData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid var(--border-color)",
              backgroundColor: "var(--bg-surface)",
              color: "var(--text-main)",
              boxShadow: "0 12px 28px rgba(15, 23, 42, 0.16)",
            }}
            itemStyle={{ fontWeight: "bold", color: "var(--text-main)" }}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* Center Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="font-mono text-3xl font-extrabold tabular-nums text-text-main">
          {automatedPercent}%
        </span>
        <span className="mt-0.5 text-xs font-bold text-text-muted">
          Automated
        </span>
      </div>
    </div>
  );
}
