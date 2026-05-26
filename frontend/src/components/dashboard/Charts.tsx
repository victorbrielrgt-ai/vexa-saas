"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell,
} from "recharts";

const CATEGORY_COLORS: Record<string, string> = {
  alimentacao: "#5B2EFF",
  transporte: "#00D084",
  lazer: "#FFB800",
  saude: "#00C4FF",
  moradia: "#FF4444",
  roupas: "#FF6B6B",
  outros: "#8B9AB5",
};

interface SpendingTrendChartProps {
  data: Array<{ day: string; amount: number }>;
}

export function SpendingTrendChart({ data }: SpendingTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#5B2EFF" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#5B2EFF" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" vertical={false} />
        <XAxis dataKey="day" tick={{ fill: "#5A6680", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#5A6680", fontSize: 11 }} axisLine={false} tickLine={false}
          tickFormatter={(v) => `R$${v}`} />
        <Tooltip
          contentStyle={{ background: "#1A2235", border: "1px solid #2A3A5A", borderRadius: "12px", color: "#F0F4FF" }}
          formatter={(value: number) => [`R$${value.toFixed(2)}`, "Spent"]}
        />
        <Area type="monotone" dataKey="amount" stroke="#5B2EFF" strokeWidth={2}
          fill="url(#purpleGrad)" dot={false} activeDot={{ r: 4, fill: "#5B2EFF", stroke: "#0B1020", strokeWidth: 2 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

interface CategoryBreakdownChartProps {
  data: Array<{ category: string; total: number; percent_used: number | null }>;
}

export function CategoryBreakdownChart({ data }: CategoryBreakdownChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
        barSize={28} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" vertical={false} />
        <XAxis dataKey="category" tick={{ fill: "#5A6680", fontSize: 11 }}
          axisLine={false} tickLine={false}
          tickFormatter={(v) => v.charAt(0).toUpperCase() + v.slice(1, 5)} />
        <YAxis tick={{ fill: "#5A6680", fontSize: 11 }} axisLine={false} tickLine={false}
          tickFormatter={(v) => `R$${v}`} />
        <Tooltip
          contentStyle={{ background: "#1A2235", border: "1px solid #2A3A5A", borderRadius: "12px", color: "#F0F4FF" }}
          formatter={(value: number, _: string, props: any) => [`R$${value.toFixed(2)}`, props.payload.category]}
        />
        <Bar dataKey="total" radius={[6, 6, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={index} fill={CATEGORY_COLORS[entry.category] || "#8B9AB5"} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// Mini sparkline
interface SparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}

export function Sparkline({ data, color = "#5B2EFF", width = 80, height = 32 }: SparklineProps) {
  const chartData = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width={width} height={height}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id={`spark-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5}
          fill={`url(#spark-${color.replace("#", "")})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
