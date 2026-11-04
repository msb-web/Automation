"use client";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

const tooltipStyle = {
  background: "#161a27",
  border: "1px solid #2a3146",
  borderRadius: 8,
  color: "#e7eaf3",
  fontSize: 12,
};

export function TrendChart({
  data,
  color = "#2563eb",
  height = 220,
}: {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
}) {
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={`g-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2533" vertical={false} />
          <XAxis dataKey="label" stroke="#6b7493" fontSize={10} tickLine={false} axisLine={false} />
          <YAxis stroke="#6b7493" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: color, strokeOpacity: 0.3 }} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2.5}
            fill={`url(#g-${color})`}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DonutChart({
  data,
  height = 200,
}: {
  data: { name: string; value: number; color: string }[];
  height?: number;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div style={{ width: "100%", height, position: "relative" }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="58%"
            outerRadius="85%"
            paddingAngle={2}
            stroke="none"
          >
            {data.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-extrabold">{total}</span>
        <span className="text-[10px] text-muted-foreground">projects</span>
      </div>
    </div>
  );
}

export function BarsChart({
  data,
  height = 220,
}: {
  data: { label: string; value: number; color: string }[];
  height?: number;
}) {
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2533" vertical={false} />
          <XAxis dataKey="label" stroke="#6b7493" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="#6b7493" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#ffffff08" }} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Build a per-day count series from items with a createdAt. */
export function daySeries(
  items: { createdAt: string }[],
  days: number
): { label: string; value: number }[] {
  const out: { label: string; value: number }[] = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const next = new Date(d);
    next.setDate(d.getDate() + 1);
    const count = items.filter((it) => {
      const c = new Date(it.createdAt);
      return c >= d && c < next;
    }).length;
    out.push({ label: d.toLocaleDateString("en-US", { month: "numeric", day: "numeric" }), value: count });
  }
  return out;
}
