"use client";

import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { CHART, ChartTooltip, axisProps } from "./primitives";
import { formatCurrency } from "@/lib/format";

export { ChartCard, ChartLegend, CHART } from "./primitives";

const H = 280;

/* ----------------------------- Score trend --------------------------- */

export function ScoreTrendChart({
  data,
  height = H,
}: {
  data: { exam: string; score: number; average: number; topper: number }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART.ember} stopOpacity={0.28} />
            <stop offset="100%" stopColor={CHART.ember} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="exam" {...axisProps} />
        <YAxis domain={[0, 360]} {...axisProps} />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: CHART.grid }} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
        />
        <Area
          type="monotone"
          dataKey="topper"
          name="Topper"
          stroke={CHART.muted}
          strokeDasharray="4 4"
          fill="none"
          strokeWidth={1.5}
          dot={false}
        />
        <Area
          type="monotone"
          dataKey="average"
          name="Cohort average"
          stroke={CHART.royal}
          fill="none"
          strokeWidth={1.75}
          dot={{ r: 3, fill: CHART.royal }}
        />
        <Area
          type="monotone"
          dataKey="score"
          name="Your score"
          stroke={CHART.ember}
          fill="url(#scoreFill)"
          strokeWidth={2.75}
          dot={{ r: 4, fill: CHART.ember, strokeWidth: 2, stroke: "#fff" }}
          activeDot={{ r: 6 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ------------------------ Rank / percentile trend -------------------- */

export function RankTrendChart({
  data,
  height = H,
}: {
  data: { exam: string; rank: number; percentile: number }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="exam" {...axisProps} />
        <YAxis
          yAxisId="rank"
          reversed
          {...axisProps}
          label={undefined}
        />
        <YAxis yAxisId="pct" orientation="right" domain={[80, 100]} {...axisProps} />
        <Tooltip content={<ChartTooltip />} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
        <Line
          yAxisId="rank"
          type="monotone"
          dataKey="rank"
          name="All-India rank"
          stroke={CHART.navy}
          strokeWidth={2.75}
          dot={{ r: 4, fill: CHART.navy, strokeWidth: 2, stroke: "#fff" }}
        />
        <Line
          yAxisId="pct"
          type="monotone"
          dataKey="percentile"
          name="Percentile"
          stroke={CHART.success}
          strokeWidth={2.25}
          strokeDasharray="5 4"
          dot={{ r: 3, fill: CHART.success }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

/* -------------------------- Subject comparison ----------------------- */

export function SubjectComparisonChart({
  data,
  height = H,
}: {
  data: { subject: string; you: number; average: number; topper: number }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barGap={4}>
        <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="subject" {...axisProps} />
        <YAxis domain={[0, 100]} unit="%" {...axisProps} />
        <Tooltip
          content={<ChartTooltip formatter={(v) => `${v}%`} />}
          cursor={{ fill: "rgba(14,29,74,0.04)" }}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
        <Bar dataKey="you" name="You" fill={CHART.ember} radius={[5, 5, 0, 0]} maxBarSize={38} />
        <Bar dataKey="average" name="Cohort average" fill={CHART.royal} radius={[5, 5, 0, 0]} maxBarSize={38} />
        <Bar dataKey="topper" name="Topper" fill={CHART.muted} radius={[5, 5, 0, 0]} maxBarSize={38} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ------------------------------ Accuracy ----------------------------- */

export function AccuracyGauge({
  value,
  height = 200,
  label = "Accuracy",
}: {
  value: number;
  height?: number;
  label?: string;
}) {
  const data = [{ name: label, value, fill: CHART.ember }];
  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          data={data}
          innerRadius="72%"
          outerRadius="100%"
          startAngle={220}
          endAngle={-40}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar background={{ fill: CHART.grid }} dataKey="value" cornerRadius={12} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-3xl font-bold tabular text-navy-900">
          {value.toFixed(1)}%
        </span>
        <span className="mt-0.5 text-2xs font-semibold uppercase tracking-wider text-ink-400">
          {label}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------ Donut -------------------------------- */

export function DonutChart({
  data,
  height = 240,
  centerLabel,
  centerValue,
  unit = "",
}: {
  data: { name: string; value: number; color: string }[];
  height?: number;
  centerLabel?: string;
  centerValue?: string;
  unit?: string;
}) {
  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="62%"
            outerRadius="92%"
            paddingAngle={2}
            strokeWidth={0}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip formatter={(v) => `${v}${unit}`} />} />
        </PieChart>
      </ResponsiveContainer>
      {centerValue && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-2xl font-bold tabular text-navy-900">{centerValue}</span>
          {centerLabel && (
            <span className="mt-0.5 text-2xs font-semibold uppercase tracking-wider text-ink-400">
              {centerLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------ Admin -------------------------------- */

export function RevenueChart({
  data,
  height = H,
}: {
  data: { month: string; revenue: number; purchases: number }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
        <defs>
          <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART.navy} stopOpacity={0.24} />
            <stop offset="100%" stopColor={CHART.navy} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="month" {...axisProps} />
        <YAxis {...axisProps} tickFormatter={(v) => formatCurrency(Number(v), { compact: true })} width={56} />
        <Tooltip
          content={<ChartTooltip formatter={(v, name) => (name === "Revenue" ? formatCurrency(Number(v)) : String(v))} />}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          name="Revenue"
          stroke={CHART.navy}
          fill="url(#revFill)"
          strokeWidth={2.75}
          dot={{ r: 3.5, fill: CHART.navy, strokeWidth: 2, stroke: "#fff" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function RegistrationsChart({
  data,
  height = H,
}: {
  data: { month: string; registrations: number; active: number }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }} barGap={4}>
        <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="month" {...axisProps} />
        <YAxis {...axisProps} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(14,29,74,0.04)" }} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
        <Bar dataKey="registrations" name="Registrations" fill={CHART.royal} radius={[5, 5, 0, 0]} maxBarSize={34} />
        <Bar dataKey="active" name="Converted to enrolment" fill={CHART.ember} radius={[5, 5, 0, 0]} maxBarSize={34} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ParticipationChart({
  data,
  height = H,
}: {
  data: { exam: string; registered: number; appeared: number; absent: number }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="exam" {...axisProps} />
        <YAxis {...axisProps} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(14,29,74,0.04)" }} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
        <Bar dataKey="appeared" name="Appeared" stackId="a" fill={CHART.success} radius={[0, 0, 0, 0]} maxBarSize={44} />
        <Bar dataKey="absent" name="Absent" stackId="a" fill={CHART.danger} radius={[5, 5, 0, 0]} maxBarSize={44} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ScoreDistributionChart({
  data,
  height = H,
}: {
  data: { band: string; students: number }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="band" {...axisProps} />
        <YAxis {...axisProps} />
        <Tooltip content={<ChartTooltip labelSuffix=" marks" />} cursor={{ fill: "rgba(14,29,74,0.04)" }} />
        <Bar dataKey="students" name="Candidates" radius={[5, 5, 0, 0]} maxBarSize={54}>
          {data.map((entry, index) => (
            <Cell
              key={entry.band}
              fill={index >= data.length - 2 ? CHART.ember : CHART.royal}
              fillOpacity={index >= data.length - 2 ? 1 : 0.55 + index * 0.1}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CentrePerformanceChart({
  data,
  height = H,
}: {
  data: { centre: string; average: number; candidates: number }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" domain={[0, 360]} {...axisProps} />
        <YAxis type="category" dataKey="centre" width={78} {...axisProps} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(14,29,74,0.04)" }} />
        <Bar dataKey="average" name="Average score" fill={CHART.navy} radius={[0, 5, 5, 0]} maxBarSize={22} />
      </BarChart>
    </ResponsiveContainer>
  );
}
