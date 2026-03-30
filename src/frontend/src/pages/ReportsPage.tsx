import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Page } from "../App";
import type { backendInterface } from "../backend";
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
const COLORS = [
  "#3B82F6",
  "#22C55E",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4",
];

export default function ReportsPage({ actor, navigate: _navigate }: Props) {
  const { data: perf } = useQuery({
    queryKey: ["perf"],
    queryFn: () => actor.getProjectPerformance(),
  });

  const { data: topClients = [] } = useQuery({
    queryKey: ["top-clients"],
    queryFn: () => actor.getTopClientsByRevenue(10n),
  });

  const year = new Date().getFullYear();
  const monthlyQueries = MONTHS.map((_, i) => {
    const month = `${year}-${String(i + 1).padStart(2, "0")}`;
    return month;
  });

  // Fetch all monthly earnings
  const { data: monthlyEarnings = [] } = useQuery({
    queryKey: ["monthly-earnings", year],
    queryFn: async () => {
      const results = await Promise.all(
        monthlyQueries.map((m) => actor.getMonthlyEarnings(m)),
      );
      return results.map((val, i) => ({
        month: MONTHS[i],
        earnings: Number(val) / 100,
      }));
    },
  });

  const pieData = perf
    ? [
        { name: "Completed", value: Number(perf.completedCount) },
        { name: "Pending", value: Number(perf.pendingCount) },
        { name: "Cancelled", value: Number(perf.cancelledCount) },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {perf && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-[#141E2E] border-[#223047]">
            <CardContent className="p-5">
              <p className="text-xs text-[#94A3B8] uppercase mb-1">
                Total Profit
              </p>
              <p className="text-2xl font-bold text-white">
                ${(Number(perf.totalProfit) / 100).toFixed(2)}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-[#141E2E] border-[#223047]">
            <CardContent className="p-5">
              <p className="text-xs text-[#94A3B8] uppercase mb-1">
                Avg Profit / Project
              </p>
              <p className="text-2xl font-bold text-white">
                ${(Number(perf.averageProfit) / 100).toFixed(2)}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-[#141E2E] border-[#223047]">
            <CardContent className="p-5">
              <p className="text-xs text-[#94A3B8] uppercase mb-1">
                Total Projects
              </p>
              <p className="text-2xl font-bold text-white">
                {Number(perf.completedCount) +
                  Number(perf.pendingCount) +
                  Number(perf.cancelledCount)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Monthly Earnings */}
        <Card className="bg-[#141E2E] border-[#223047]">
          <CardHeader>
            <CardTitle className="text-white text-sm font-semibold uppercase tracking-wide">
              Monthly Earnings {year}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyEarnings} barSize={20}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#223047"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#94A3B8", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#94A3B8", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${v}`}
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
                <Bar dataKey="earnings" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Project Status Breakdown */}
        <Card className="bg-[#141E2E] border-[#223047]">
          <CardHeader>
            <CardTitle className="text-white text-sm font-semibold uppercase tracking-wide">
              Project Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip
                    contentStyle={{
                      background: "#0E1626",
                      border: "1px solid #223047",
                      borderRadius: 8,
                      color: "#EAF0FF",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-[#94A3B8] text-sm">
                No project data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Clients */}
      <Card className="bg-[#141E2E] border-[#223047]">
        <CardHeader>
          <CardTitle className="text-white text-sm font-semibold uppercase tracking-wide">
            Top Clients by Revenue
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#223047]">
                <th className="text-left text-xs text-[#94A3B8] px-4 py-3">
                  #
                </th>
                <th className="text-left text-xs text-[#94A3B8] px-4 py-3">
                  Company
                </th>
                <th className="text-right text-xs text-[#94A3B8] px-4 py-3">
                  Total Revenue
                </th>
              </tr>
            </thead>
            <tbody>
              {topClients.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-8 text-center text-[#94A3B8] text-sm"
                  >
                    No data yet
                  </td>
                </tr>
              ) : (
                topClients.map((c, i) => (
                  <tr
                    key={c.clientId.toString()}
                    className="border-b border-[#223047]/50"
                  >
                    <td className="px-4 py-3 text-sm text-[#94A3B8]">
                      {i + 1}
                    </td>
                    <td className="px-4 py-3 text-sm text-white font-medium">
                      {c.companyName}
                    </td>
                    <td className="px-4 py-3 text-sm text-white font-semibold text-right">
                      ${(Number(c.totalRevenue) / 100).toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
