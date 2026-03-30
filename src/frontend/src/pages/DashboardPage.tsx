import { useQuery } from "@tanstack/react-query";
import { CheckCircle, DollarSign, FileText, FolderKanban } from "lucide-react";
import type { KeyboardEvent } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Page } from "../App";
import {
  Variant_cancelled_pending_completed,
  Variant_paid_unpaid_draft,
  type backendInterface,
} from "../backend";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

interface Props {
  actor: backendInterface;
  navigate: (p: Page) => void;
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const fmtCurrency = (val: bigint) => {
  const num = Number(val) / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(num);
};

const statusColor = (s: Variant_cancelled_pending_completed) => {
  if (s === Variant_cancelled_pending_completed.completed)
    return "bg-green-900/50 text-green-400 border-green-700/50";
  if (s === Variant_cancelled_pending_completed.pending)
    return "bg-amber-900/50 text-amber-400 border-amber-700/50";
  return "bg-red-900/50 text-red-400 border-red-700/50";
};

const invoiceStatusColor = (s: Variant_paid_unpaid_draft) => {
  if (s === Variant_paid_unpaid_draft.paid)
    return "bg-green-900/50 text-green-400 border-green-700/50";
  if (s === Variant_paid_unpaid_draft.unpaid)
    return "bg-red-900/50 text-red-400 border-red-700/50";
  return "bg-slate-800 text-slate-400 border-slate-600";
};

function onEnter(fn: () => void) {
  return (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") fn();
  };
}

export default function DashboardPage({ actor, navigate }: Props) {
  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => actor.listProjects(),
  });
  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => actor.listAllInvoices(),
  });

  const totalEarnings = invoices
    .filter((inv) => inv.status === Variant_paid_unpaid_draft.paid)
    .reduce((sum, inv) => sum + Number(inv.grandTotal), 0);

  const pendingInvoices = invoices.filter(
    (inv) => inv.status === Variant_paid_unpaid_draft.unpaid,
  ).length;
  const activeProjects = projects.filter(
    (p) => p.status === Variant_cancelled_pending_completed.pending,
  ).length;
  const completedProjects = projects.filter(
    (p) => p.status === Variant_cancelled_pending_completed.completed,
  ).length;

  const earningsData = MONTHS.slice(0, 8).map((m) => ({
    month: m,
    value: Math.floor(Math.random() * 8000 + 2000),
  }));

  const revenueData = MONTHS.map((m) => ({
    month: m,
    revenue: Math.floor(Math.random() * 12000 + 3000),
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard
          icon={<DollarSign className="w-5 h-5 text-blue-400" />}
          label="Total Earnings"
          value={fmtCurrency(BigInt(Math.round(totalEarnings)))}
          sub="From paid invoices"
          color="blue"
        />
        <KPICard
          icon={<FileText className="w-5 h-5 text-amber-400" />}
          label="Pending Invoices"
          value={String(pendingInvoices)}
          sub="Awaiting payment"
          color="amber"
        />
        <KPICard
          icon={<FolderKanban className="w-5 h-5 text-purple-400" />}
          label="Active Projects"
          value={String(activeProjects)}
          sub="In progress"
          color="purple"
        />
        <KPICard
          icon={<CheckCircle className="w-5 h-5 text-green-400" />}
          label="Completed"
          value={String(completedProjects)}
          sub="Projects done"
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card className="bg-[#141E2E] border-[#223047]">
          <CardHeader>
            <CardTitle className="text-white text-sm font-semibold uppercase tracking-wide">
              Monthly Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={earningsData} barSize={24}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#223047"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#94A3B8", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#94A3B8", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    background: "#0E1626",
                    border: "1px solid #223047",
                    borderRadius: 8,
                    color: "#EAF0FF",
                  }}
                  formatter={(v: number) => [
                    `$${v.toLocaleString()}`,
                    "Earnings",
                  ]}
                />
                <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-[#141E2E] border-[#223047]">
          <CardHeader>
            <CardTitle className="text-white text-sm font-semibold uppercase tracking-wide">
              Monthly Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#223047"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#94A3B8", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#94A3B8", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    background: "#0E1626",
                    border: "1px solid #223047",
                    borderRadius: 8,
                    color: "#EAF0FF",
                  }}
                  formatter={(v: number) => [
                    `$${v.toLocaleString()}`,
                    "Revenue",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fill="url(#blueGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card className="bg-[#141E2E] border-[#223047]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white text-sm font-semibold uppercase tracking-wide">
              Recent Projects
            </CardTitle>
            <button
              type="button"
              onClick={() => navigate({ name: "projects" })}
              className="text-blue-400 text-xs hover:underline"
            >
              View all
            </button>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#223047]">
                  <th className="text-left text-xs text-[#94A3B8] px-4 py-2">
                    Client
                  </th>
                  <th className="text-left text-xs text-[#94A3B8] px-4 py-2">
                    Progress
                  </th>
                  <th className="text-left text-xs text-[#94A3B8] px-4 py-2">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {projects.slice(0, 5).map((p) => (
                  <tr
                    key={p.id.toString()}
                    tabIndex={0}
                    className="border-b border-[#223047]/50 hover:bg-white/5 cursor-pointer"
                    onClick={() =>
                      navigate({ name: "project-detail", projectId: p.id })
                    }
                    onKeyDown={onEnter(() =>
                      navigate({ name: "project-detail", projectId: p.id }),
                    )}
                  >
                    <td className="px-4 py-3 text-sm text-white">
                      {p.clientCompanyName || "\u2014"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-[#1F2A3A] rounded-full">
                          <div
                            className="h-1.5 bg-blue-500 rounded-full"
                            style={{ width: `${Number(p.progress)}%` }}
                          />
                        </div>
                        <span className="text-xs text-[#94A3B8]">
                          {Number(p.progress)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${statusColor(p.status)}`}
                      >
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {projects.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-6 text-center text-[#94A3B8] text-sm"
                    >
                      No projects yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card className="bg-[#141E2E] border-[#223047]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white text-sm font-semibold uppercase tracking-wide">
              Recent Invoices
            </CardTitle>
            <button
              type="button"
              onClick={() => navigate({ name: "invoices" })}
              className="text-blue-400 text-xs hover:underline"
            >
              View all
            </button>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#223047]">
                  <th className="text-left text-xs text-[#94A3B8] px-4 py-2">
                    Invoice #
                  </th>
                  <th className="text-left text-xs text-[#94A3B8] px-4 py-2">
                    Amount
                  </th>
                  <th className="text-left text-xs text-[#94A3B8] px-4 py-2">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoices.slice(0, 5).map((inv) => (
                  <tr
                    key={inv.id.toString()}
                    tabIndex={0}
                    className="border-b border-[#223047]/50 hover:bg-white/5 cursor-pointer"
                    onClick={() =>
                      navigate({ name: "invoice-detail", invoiceId: inv.id })
                    }
                    onKeyDown={onEnter(() =>
                      navigate({ name: "invoice-detail", invoiceId: inv.id }),
                    )}
                  >
                    <td className="px-4 py-3 text-sm text-white">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-4 py-3 text-sm text-white">
                      {fmtCurrency(inv.grandTotal)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${invoiceStatusColor(inv.status)}`}
                      >
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {invoices.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-6 text-center text-[#94A3B8] text-sm"
                    >
                      No invoices yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KPICard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  const borderColors: Record<string, string> = {
    blue: "border-blue-600/30",
    amber: "border-amber-600/30",
    purple: "border-purple-600/30",
    green: "border-green-600/30",
  };
  return (
    <Card
      className={`bg-[#141E2E] border ${borderColors[color] ?? "border-[#223047]"}`}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-[#94A3B8] uppercase tracking-wide font-medium">
            {label}
          </span>
          <div className="p-2 bg-white/5 rounded-lg">{icon}</div>
        </div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-[#94A3B8] mt-1">{sub}</p>
      </CardContent>
    </Card>
  );
}
