import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type Point = { label: string; value: number };

const axisStyle = { fontSize: 11, fill: "var(--muted-foreground)" } as const;

const tooltipProps = {
  cursor: { fill: "color-mix(in oklab, var(--foreground) 5%, transparent)" },
  contentStyle: {
    borderRadius: 12,
    border: "1px solid var(--border)",
    background: "var(--popover)",
    color: "var(--popover-foreground)",
    fontSize: 12,
    boxShadow: "0 12px 30px -14px color-mix(in oklab, var(--foreground) 40%, transparent)",
  },
  labelStyle: { color: "var(--muted-foreground)", fontSize: 11 },
} as const;

export function ChartCard({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-border/60 bg-background p-5 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Aktivitas harian — area chart 30 hari */
export function ActivityAreaChart({ data }: { data: Point[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={axisStyle} interval="preserveStartEnd" minTickGap={24} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={axisStyle} width={34} />
          <Tooltip {...tooltipProps} />
          <Area
            type="monotone"
            dataKey="value"
            name="Modul selesai"
            stroke="var(--primary)"
            strokeWidth={2}
            fill="url(#activityFill)"
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Peserta per materi — horizontal bar */
export function MaterialBarChart({ data }: { data: Array<Point & { done: number }> }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 0 }} barCategoryGap={12}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
          <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} tick={axisStyle} />
          <YAxis
            type="category"
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={axisStyle}
            width={140}
          />
          <Tooltip {...tooltipProps} />
          <Legend wrapperStyle={{ fontSize: 11, color: "var(--muted-foreground)" }} />
          <Bar dataKey="value" name="Peserta" fill="var(--primary)" radius={[0, 6, 6, 0]} />
          <Bar dataKey="done" name="Modul selesai" fill="color-mix(in oklab, var(--primary) 35%, var(--background))" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Distribusi kelas 7–9 — donut */
export function GradeDonutChart({ data }: { data: Point[] }) {
  const palette = [
    "var(--primary)",
    "color-mix(in oklab, var(--primary) 60%, var(--background))",
    "color-mix(in oklab, var(--primary) 30%, var(--background))",
  ];
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) {
    return (
      <div className="flex h-60 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border/70">
        <p className="text-sm font-medium text-muted-foreground">Belum ada pendaftaran</p>
        <p className="text-xs text-muted-foreground">Distribusi kelas muncul setelah siswa mendaftar</p>
      </div>
    );
  }
  return (
    <div className="relative h-60 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip {...tooltipProps} cursor={false} />
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius="62%"
            outerRadius="88%"
            paddingAngle={3}
            stroke="var(--background)"
            strokeWidth={2}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={palette[i % palette.length]} />
            ))}
          </Pie>
          <Legend wrapperStyle={{ fontSize: 11, color: "var(--muted-foreground)" }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-x-0 top-[38%] -translate-y-1/2 text-center">
        <p className="text-2xl font-semibold tracking-tight">{total}</p>
        <p className="text-[11px] text-muted-foreground">pendaftaran</p>
      </div>
    </div>
  );
}

/** Rata-rata penyelesaian — radial gauge */
export function ProgressRadial({ value, caption }: { value: number; caption: string }) {
  const data = [{ name: "progress", value }];
  return (
    <div className="relative h-60 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          data={data}
          innerRadius="70%"
          outerRadius="100%"
          startAngle={210}
          endAngle={-30}
          barSize={16}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar
            dataKey="value"
            cornerRadius={12}
            fill="var(--primary)"
            background={{ fill: "color-mix(in oklab, var(--foreground) 8%, transparent)" }}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-3xl font-semibold tracking-tight">{value}%</p>
        <p className="mt-1 text-[11px] text-muted-foreground">{caption}</p>
      </div>
    </div>
  );
}
