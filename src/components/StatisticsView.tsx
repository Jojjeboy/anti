import React, { useMemo } from "react";
import { useApp } from "../context/AppContext";
import { useTranslation } from "react-i18next";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
  LabelList,
} from "recharts";
import {
  TrendingUp,
  List,
  CheckCircle2,
  PlayCircle,
  PieChart as PieIcon,
  BarChart3,
  ListTodo,
} from "lucide-react";

export const StatisticsView: React.FC = () => {
  const { t } = useTranslation();
  const { lists, categories, todos, sessions } = useApp();

  // Color constants for charts
  const COLORS = [
    "#3B82F6",
    "#8B5CF6",
    "#EC4899",
    "#F59E0B",
    "#10B981",
    "#6366F1",
  ];
  const PRIORITY_COLORS = {
    high: "#EF4444",
    medium: "#F59E0B",
    low: "#10B981",
  };

  // Calculate overall metrics
  const metrics = useMemo(() => {
    const totalCompletedItems = lists.reduce(
      (acc, list) =>
        acc + (list.items ?? []).filter((item) => item.completed).length,
      0,
    );

    return [
      {
        id: "lists",
        label: t("stats.metrics.totalLists"),
        value: lists.length,
        icon: List,
        color: "text-blue-600",
        bg: "bg-blue-100/50",
      },
      {
        id: "items",
        label: t("stats.metrics.completedItems"),
        value: totalCompletedItems,
        icon: CheckCircle2,
        color: "text-green-600",
        bg: "bg-green-100/50",
      },
      {
        id: "todos",
        label: t("stats.metrics.totalTodos"),
        value: todos.length,
        icon: ListTodo,
        color: "text-purple-600",
        bg: "bg-purple-100/50",
      },
      {
        id: "sessions",
        label: t("stats.metrics.totalSessions"),
        value: sessions.length,
        icon: PlayCircle,
        color: "text-amber-600",
        bg: "bg-amber-100/50",
      },
    ];
  }, [lists, todos, sessions, t]);

  // Data for Category Distribution (Pie Chart)
  const categoryData = useMemo(() => {
    return (categories ?? [])
      .map((cat) => ({
        name: cat.name,
        value: (lists ?? []).filter((l) => l.categoryId === cat.id).length,
      }))
      .filter((d) => d.value > 0);
  }, [categories, lists]);

  // Data for Priority Distribution
  const priorityData = useMemo(() => {
    return [
      {
        name: t("todos.priority.high"),
        value: (todos ?? []).filter((t) => t.priority === "high").length,
        fill: PRIORITY_COLORS.high,
      },
      {
        name: t("todos.priority.medium"),
        value: (todos ?? []).filter((t) => t.priority === "medium").length,
        fill: PRIORITY_COLORS.medium,
      },
      {
        name: t("todos.priority.low"),
        value: (todos ?? []).filter((t) => t.priority === "low").length,
        fill: PRIORITY_COLORS.low,
      },
    ].filter((d) => d.value > 0);
  }, [todos, t]);

  // Data for Activity Trend (Area Chart)
  const activityTrend = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toISOString().split("T")[0];
    });

    return last30Days.map((dateStr) => {
      const count = (sessions ?? []).filter((s) =>
        s.createdAt?.startsWith(dateStr),
      ).length;
      return {
        date: new Date(dateStr).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        count,
      };
    });
  }, [sessions]);

  // Data for Top Lists
  const topLists = useMemo(() => {
    const listUsage: Record<string, number> = {};

    (sessions ?? []).forEach((session) => {
      (session.listIds ?? []).forEach((id) => {
        listUsage[id] = (listUsage[id] || 0) + 1;
      });
    });

    return Object.entries(listUsage)
      .map(([id, count]) => {
        const list = lists.find((l) => l.id === id);
        const name = list ? list.name : "Deleted List";
        return {
          name,
          count,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [sessions, lists]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          {t("stats.title")}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 font-medium">
          {t("stats.subtitle")}
        </p>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <div
            key={metric.id}
            className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center group hover:shadow-md transition-all"
          >
            <div
              className={`p-3 rounded-xl ${metric.bg} ${metric.color} mb-3 group-hover:scale-110 transition-transform`}
            >
              <metric.icon size={24} />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {metric.value}
            </div>
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {metric.label}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Activity Trend */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="text-blue-500" size={20} />
            <h3 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-sm">
              {t("stats.activityTrend")}
            </h3>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityTrend}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E5E7EB"
                />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#9CA3AF" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#9CA3AF" }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  cursor={{ stroke: "#3B82F6", strokeWidth: 2 }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorCount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Lists */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="text-purple-500" size={20} />
            <h3 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-sm">
              {t("stats.topLists")}
            </h3>
          </div>
          {topLists.length > 0 ? (
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topLists}
                  layout="vertical"
                  margin={{ left: 0, right: 30, top: 20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="#F3F4F6"
                  />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" hide />
                  <Tooltip
                    cursor={{ fill: "#F9FAFB" }}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="#8B5CF6"
                    radius={[0, 4, 4, 0]}
                    barSize={24}
                  >
                    <LabelList
                      dataKey="name"
                      position="top"
                      offset={8}
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        fill: "currentColor",
                      }}
                      className="text-gray-700 dark:text-gray-300"
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400 italic text-sm">
              {t("sessions.noLists")}
            </div>
          )}
        </div>

        {/* Categories & Priorities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:col-span-2">
          {/* Category Distribution */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-6">
              <PieIcon className="text-green-500" size={20} />
              <h3 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-sm">
                {t("stats.categoryDist")}
              </h3>
            </div>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {categoryData.map((entry) => (
                      <Cell
                        key={`cell-${entry.name}`}
                        fill={
                          COLORS[categoryData.indexOf(entry) % COLORS.length]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Priorities Distribution */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-6">
              <ListTodo className="text-orange-500" size={20} />
              <h3 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-sm">
                {t("stats.todosPriority")}
              </h3>
            </div>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {priorityData.map((entry) => (
                      <Cell
                        key={`cell-priority-${entry.name}`}
                        fill={entry.fill}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="pb-8"></div>
    </div>
  );
};
