"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { formatKes } from "@/lib/utils";

export type EscrowChartPoint = { w: string; v: number };

export default function DashboardEscrowChart({ data }: { data: EscrowChartPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={[...data]} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="escrowFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1A56DB" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#1A56DB" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="w" tick={{ fontSize: 11 }} stroke="#94A3B8" />
        <Tooltip
          formatter={(v) => [
            formatKes(typeof v === "number" ? v : Number(v)),
            "Balance",
          ]}
          contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0" }}
        />
        <Area
          type="monotone"
          dataKey="v"
          stroke="#1A56DB"
          strokeWidth={2}
          fill="url(#escrowFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
