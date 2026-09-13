import React, { useEffect, useState } from "react";
import { get } from "../services/api";

const quickLinks = [
  {
    title: "Student Management",
    description: "Add, edit and manage student records.",
    icon: "👥",
    page: "students",
    color: "bg-violet-100 text-violet-700",
  },
  {
    title: "Faculty Management",
    description: "Manage faculty and teaching assignments.",
    icon: "🧑‍🏫",
    page: "faculty",
    color: "bg-blue-100 text-blue-700",
  },
  {
    title: "Attendance",
    description: "Review student attendance records.",
    icon: "✅",
    page: "attendance",
    color: "bg-emerald-100 text-emerald-700",
  },
  {
    title: "Examinations",
    description: "Manage exams, marks and results.",
    icon: "📝",
    page: "exams",
    color: "bg-orange-100 text-orange-700",
  },
];

const activities = [
  {
    icon: "👤",
    title: "Student records",
    description: "Student information is available in the system.",
    color: "bg-violet-100 text-violet-600",
  },
  {
    icon: "🧑‍🏫",
    title: "Faculty records",
    description: "Faculty information is available in the system.",
    color: "bg-blue-100 text-blue-600",
  },
  {
    icon: "📊",
    title: "Attendance",
    description: "Attendance records are available for review.",
    color: "bg-emerald-100 text-emerald-600",
  },
  {
    icon: "📢",
    title: "Notices",
    description: "College notices are available in the system.",
    color: "bg-orange-100 text-orange-600",
  },
];

const services = [
  {
    name: "Frontend",
    description: "React application",
    status: "Online",
  },
  {
    name: "Backend API",
    description: "Express server",
    status: "Online",
  },
  {
    name: "Database",
    description: "MongoDB",
    status: "Connected",
  },
];

export default function AdminDashboard({ onNavigate }) {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const data = await get("/dashboard");

      setDashboard(data);
    } catch (err) {
      console.error("Dashboard error:", err);

      setError(
        err.message || "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  }

  const stats = [
    {
      label: "Total Students",
      value: dashboard?.students ?? 0,
      icon: "🎓",
      description: "Currently enrolled",
      color: "from-violet-500 to-purple-600",
      bg: "bg-violet-50",
    },
    {
      label: "Faculty Members",
      value: dashboard?.faculty ?? 0,
      icon: "👨‍🏫",
      description: "Teaching staff",
      color: "from-blue-500 to-cyan-500",
      bg: "bg-blue-50",
    },
    {
      label: "Courses",
      value: dashboard?.courses ?? 0,
      icon: "📚",
      description: "Active courses",
      color: "from-emerald-500 to-teal-500",
      bg: "bg-emerald-50",
    },
    {
      label: "Active Subjects",
      value: dashboard?.subjects ?? 0,
      icon: "📖",
      description: "Currently offered",
      color: "from-orange-500 to-amber-500",
      bg: "bg-orange-50",
    },
  ];

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-7">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-violet-900 p-7 shadow-xl">

        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" />

        <div className="absolute -bottom-24 right-40 h-52 w-52 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 backdrop-blur-sm">

              <span className="h-2 w-2 rounded-full bg-emerald-400" />

              Administrator Workspace

            </div>

            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Welcome back, Administrator 👋
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">
              Manage students, faculty, academics and college
              operations from one centralized dashboard.
            </p>

          </div>

          <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur-md">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-xl">
              📅
            </div>

            <div>

              <span className="block text-xs text-slate-400">
                Academic Year
              </span>

              <strong className="mt-0.5 block text-sm font-bold text-white">
                2026 - 2027
              </strong>

            </div>

          </div>

        </div>

      </div>

      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">

          <div className="flex items-center gap-3">

            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600">
              !
            </span>

            <div>
              <p className="text-sm font-semibold text-red-800">
                Unable to load dashboard
              </p>

              <p className="text-xs text-red-600">
                {error}
              </p>
            </div>

          </div>

          <button
            type="button"
            onClick={loadDashboard}
            className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
          >
            Retry
          </button>

        </div>
      )}

      {/* =====================================================
          REAL STATISTICS
      ====================================================== */}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">

        {stats.map((stat) => (
          <div
            key={stat.label}
            className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >

            <div
              className={`absolute left-0 right-0 top-0 h-1 bg-gradient-to-r ${stat.color}`}
            />

            <div className="flex items-start justify-between">

              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bg} text-xl transition-transform duration-300 group-hover:scale-110`}
              >
                {stat.icon}
              </div>

              <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">

                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                Active

              </span>

            </div>

            <div className="mt-5">

              <p className="text-sm font-medium text-slate-500">
                {stat.label}
              </p>

              {loading ? (
                <div className="mt-2 h-9 w-20 animate-pulse rounded-lg bg-slate-100" />
              ) : (
                <strong className="mt-1 block text-3xl font-bold tracking-tight text-slate-900">
                  {stat.value}
                </strong>
              )}

              <p className="mt-1 text-xs text-slate-400">
                {stat.description}
              </p>

            </div>

          </div>
        ))}

      </div>

      {/* =====================================================
          QUICK ACCESS
      ====================================================== */}

      <div>

        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <h3 className="text-xl font-bold tracking-tight text-slate-900">
              Quick Access
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Frequently used administration modules.
            </p>

          </div>

          <span className="text-xs font-medium text-slate-400">
            Select a module to continue →
          </span>

        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {quickLinks.map((item) => (
            <button
              type="button"
              key={item.title}
              onClick={() => onNavigate?.(item.page)}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-violet-200 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
            >

              <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-slate-50 transition-transform duration-500 group-hover:scale-150" />

              <div className="relative">

                <div className="flex items-start justify-between">

                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl ${item.color} transition-transform duration-300 group-hover:scale-110`}
                  >
                    {item.icon}
                  </div>

                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-all duration-300 group-hover:bg-violet-50 group-hover:text-violet-600">
                    →
                  </span>

                </div>

                <h4 className="mt-5 text-sm font-bold text-slate-800">
                  {item.title}
                </h4>

                <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                  {item.description}
                </p>

                <div className="mt-4 text-[11px] font-semibold text-violet-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  Open module →
                </div>

              </div>

            </button>
          ))}

        </div>

      </div>

      {/* =====================================================
          ACTIVITY + SYSTEM STATUS
      ====================================================== */}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.4fr_1fr]">

        {/* Recent Activity */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">

            <div>

              <h3 className="text-lg font-bold text-slate-900">
                System Activity
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Available OCMS modules and records
              </p>

            </div>

            <span className="rounded-full bg-violet-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-violet-600">
              OCMS
            </span>

          </div>

          <div className="px-6">

            {activities.map((activity, index) => (
              <div
                key={activity.title}
                className="flex items-center gap-4 border-b border-slate-100 py-4 last:border-0"
              >

                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg ${activity.color}`}
                >
                  {activity.icon}
                </div>

                <div className="min-w-0 flex-1">

                  <strong className="block text-sm font-semibold text-slate-700">
                    {activity.title}
                  </strong>

                  <p className="mt-1 text-xs text-slate-400">
                    {activity.description}
                  </p>

                </div>

                <span className="text-xs font-medium text-slate-300">
                  {index + 1}
                </span>

              </div>
            ))}

          </div>

        </div>

        {/* System Status */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">

            <div>

              <h3 className="text-lg font-bold text-slate-900">
                System Status
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Current OCMS services
              </p>

            </div>

            <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-emerald-600">

              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />

              Live

            </div>

          </div>

          <div className="px-6">

            {services.map((service) => (
              <div
                key={service.name}
                className="flex items-center justify-between border-b border-slate-100 py-4 last:border-0"
              >

                <div className="flex items-center gap-3">

                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">

                    <span className="h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />

                  </div>

                  <div>

                    <p className="text-sm font-semibold text-slate-700">
                      {service.name}
                    </p>

                    <p className="mt-0.5 text-[11px] text-slate-400">
                      {service.description}
                    </p>

                  </div>

                </div>

                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                  {service.status}
                </span>

              </div>
            ))}

          </div>

          <div className="mx-6 mb-6 mt-4 flex items-center gap-3 rounded-xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 p-4">

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
              ✓
            </div>

            <div>

              <strong className="block text-xs font-bold text-emerald-800">
                All systems operational
              </strong>

              <p className="mt-0.5 text-[11px] text-emerald-700">
                OCMS services are running normally.
              </p>

            </div>

          </div>

        </div>

      </div>

      {/* =====================================================
          ADMINISTRATION OVERVIEW
      ====================================================== */}

      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-violet-50 blur-2xl" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">

          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-2xl shadow-lg shadow-violet-200">
            🏫
          </div>

          <div className="flex-1">

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">

              <h3 className="text-base font-bold text-slate-900">
                OCMS Administration
              </h3>

              <span className="w-fit rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-bold text-violet-600">
                Administrator
              </span>

            </div>

            <p className="mt-2 max-w-4xl text-xs leading-relaxed text-slate-500">
              Use the navigation menu or Quick Access modules to manage
              students, faculty, academic setup, attendance, examinations,
              assignments, timetable, notices and reports.
            </p>

          </div>

          <div className="hidden shrink-0 text-right sm:block">

            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
              System
            </p>

            <p className="mt-1 text-sm font-bold text-slate-700">
              OCMS 2.0
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}