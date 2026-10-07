"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { OrgSnapshot } from "@/lib/salesforce/types";

export function MetricsChart({ metrics }: { metrics: OrgSnapshot["metrics"] }) {
  const months = [...new Set([...metrics.leadsByMonth.map((m) => m.month), ...metrics.opportunitiesByMonth.map((m) => m.month)])].sort();
  const data = months.map((month) => ({
    month,
    Leads: metrics.leadsByMonth.find((m) => m.month === month)?.count ?? 0,
    Opportunities: metrics.opportunitiesByMonth.find((m) => m.month === month)?.count ?? 0,
    Won: metrics.opportunitiesByMonth.find((m) => m.month === month)?.won ?? 0,
  }));
  if (data.length === 0) return <p className="text-sm text-muted-foreground">No lead or opportunity activity in the last 6 months.</p>;
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" fontSize={12} />
          <YAxis fontSize={12} allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="Leads" fill="#d6d3d1" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Opportunities" fill="#78716c" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Won" fill="#047857" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
