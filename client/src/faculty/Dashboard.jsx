import React, { useEffect, useMemo, useState } from "react";
import {
  Users,
  ClipboardCheck,
  ClipboardList,
  FileText,
  Bell,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  CalendarDays,
} from "lucide-react";

import { get } from "../services/api";

const PAGE_SIZE = 7;

export default function Dashboard({ onNavigate }) {
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [notices, setNotices] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadDashboard(isRefresh = false) {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    /*
     * Each API is loaded separately.
     * If one route fails, the rest of the dashboard still works.
     */

    try {
      const response = await get("/students");

      setStudents(
        Array.isArray(response)
          ? response
          : response?.students || response?.data || []
      );
    } catch {
      setStudents([]);
    }

    try {
      const response = await get("/assignments");

      setAssignments(
        Array.isArray(response)
          ? response
          : response?.assignments || response?.data || []
      );
    } catch {
      setAssignments([]);
    }

    try {
      const response = await get("/attendance");

      setAttendance(
        Array.isArray(response)
          ? response
          : response?.attendance ||
              response?.records ||
              response?.data ||
              []
      );
    } catch {
      setAttendance([]);
    }

    try {
      const response = await get("/exams");

      setExams(
        Array.isArray(response)
          ? response
          : response?.exams || response?.data || []
      );
    } catch {
      setExams([]);
    }

    try {
      const response = await get("/results");

      setResults(
        Array.isArray(response)
          ? response
          : response?.results || response?.data || []
      );
    } catch {
      setResults([]);
    }

    try {
      const response = await get("/notices");

      setNotices(
        Array.isArray(response)
          ? response
          : response?.notices || response?.data || []
      );
    } catch {
      setNotices([]);
    }

    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  /* =========================
     ATTENDANCE %
  ========================= */

  const attendancePercentage = useMemo(() => {
    if (!attendance.length) return 0;

    const present = attendance.filter(
      (item) =>
        String(item.status || "").toLowerCase() === "present"
    ).length;

    return Math.round((present / attendance.length) * 100);
  }, [attendance]);

  /* =========================
     SUBJECTS
  ========================= */

  const subjects = useMemo(() => {
    const values = new Set();

    assignments.forEach((item) => {
      if (item.subject) {
        values.add(String(item.subject).trim());
      }
    });

    exams.forEach((item) => {
      if (item.subject) {
        values.add(String(item.subject).trim());
      }
    });

    attendance.forEach((item) => {
      if (item.subject) {
        values.add(String(item.subject).trim());
      }
    });

    return Array.from(values).filter(Boolean);
  }, [assignments, exams, attendance]);

  /* =========================
     RECENT ASSIGNMENTS
  ========================= */

  const recentAssignments = useMemo(() => {
    return [...assignments]
      .sort((a, b) => {
        return (
          new Date(b.createdAt || b.dueDate || 0) -
          new Date(a.createdAt || a.dueDate || 0)
        );
      })
      .slice(0, PAGE_SIZE);
  }, [assignments]);

  /* =========================
     RECENT ATTENDANCE
  ========================= */

  const recentAttendance = useMemo(() => {
    return [...attendance]
      .sort((a, b) => {
        return (
          new Date(b.date || b.createdAt || 0) -
          new Date(a.date || a.createdAt || 0)
        );
      })
      .slice(0, PAGE_SIZE);
  }, [attendance]);

  /* =========================
     RECENT NOTICES
  ========================= */

  const recentNotices = useMemo(() => {
    return [...notices]
      .sort((a, b) => {
        return (
          new Date(b.createdAt || b.date || 0) -
          new Date(a.createdAt || a.date || 0)
        );
      })
      .slice(0, 5);
  }, [notices]);

  /* =========================
     STATS
  ========================= */

  const stats = [
    {
      title: "Students",
      value: students.length,
      description: "Student records",
      icon: Users,
      page: "students",
    },
    {
      title: "Attendance",
      value: `${attendancePercentage}%`,
      description: "Overall attendance",
      icon: ClipboardCheck,
      page: "attendance",
    },
    {
      title: "Assignments",
      value: assignments.length,
      description: "Available assignments",
      icon: ClipboardList,
      page: "assignments",
    },
    {
      title: "Subjects",
      value: subjects.length,
      description: "Subjects in records",
      icon: FileText,
      page: "assignments",
    },
  ];

  /* =========================
     QUICK ACTIONS
  ========================= */

  const quickActions = [
    {
      title: "Take Attendance",
      description: "Mark student attendance",
      icon: ClipboardCheck,
      page: "attendance",
    },
    {
      title: "Assignments",
      description: "Manage assignments",
      icon: ClipboardList,
      page: "assignments",
    },
    {
      title: "Marks & Results",
      description: "View student results",
      icon: FileText,
      page: "results",
    },
    {
      title: "Notices",
      description: "View college notices",
      icon: Bell,
      page: "notices",
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
          <RefreshCw size={18} className="animate-spin" />
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto">

      {/* HEADER */}

      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-600">
            Faculty Portal
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            My Dashboard
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Overview of your academic activities.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadDashboard(true)}
          disabled={refreshing}
          className="
            inline-flex items-center justify-center gap-2
            self-start rounded-xl border border-slate-200
            bg-white px-4 py-2.5 text-sm font-semibold
            text-slate-700 shadow-sm
            hover:bg-slate-50
            disabled:opacity-60
          "
        >
          <RefreshCw
            size={16}
            className={refreshing ? "animate-spin" : ""}
          />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* STAT CARDS */}

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.title}
              type="button"
              onClick={() =>
                onNavigate && onNavigate(item.page)
              }
              className="
                group rounded-2xl border border-slate-200
                bg-white p-5 text-left shadow-sm
                transition hover:-translate-y-0.5 hover:shadow-md
              "
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {item.title}
                  </p>

                  <p className="mt-3 text-3xl font-bold text-slate-900">
                    {item.value}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {item.description}
                  </p>
                </div>

                <div className="
                  flex h-11 w-11 items-center justify-center
                  rounded-xl bg-violet-50 text-violet-600
                ">
                  <Icon size={21} />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* MAIN GRID */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* QUICK ACTIONS */}

        <div className="
          rounded-2xl border border-slate-200
          bg-white p-5 shadow-sm
        ">
          <h2 className="text-lg font-bold text-slate-900">
            Quick Actions
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Frequently used functions
          </p>

          <div className="mt-5 space-y-3">
            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <button
                  key={action.title}
                  type="button"
                  onClick={() =>
                    onNavigate && onNavigate(action.page)
                  }
                  className="
                    flex w-full items-center gap-3
                    rounded-xl border border-slate-100
                    bg-slate-50 p-3 text-left
                    hover:border-violet-200 hover:bg-violet-50
                  "
                >
                  <div className="
                    flex h-10 w-10 shrink-0 items-center
                    justify-center rounded-lg bg-white
                    text-violet-600 shadow-sm
                  ">
                    <Icon size={18} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-800">
                      {action.title}
                    </p>

                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {action.description}
                    </p>
                  </div>

                  <ArrowRight
                    size={16}
                    className="shrink-0 text-slate-400"
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* RECENT ASSIGNMENTS */}

        <div className="
          rounded-2xl border border-slate-200
          bg-white p-5 shadow-sm xl:col-span-2
        ">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Recent Assignments
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Latest assignment records
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                onNavigate && onNavigate("assignments")
              }
              className="
                inline-flex items-center gap-1
                text-xs font-bold text-violet-600
              "
            >
              View all
              <ArrowRight size={14} />
            </button>
          </div>

          {recentAssignments.length === 0 ? (
            <div className="rounded-xl bg-slate-50 p-8 text-center">
              <p className="text-sm font-medium text-slate-500">
                No assignments found
              </p>
            </div>
          ) : (
            <div className="w-full overflow-hidden">
              <table className="w-full table-fixed">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="w-[34%] px-3 py-3 text-left text-[11px] font-bold uppercase text-slate-500">
                      Assignment
                    </th>

                    <th className="w-[26%] px-3 py-3 text-left text-[11px] font-bold uppercase text-slate-500">
                      Subject
                    </th>

                    <th className="w-[22%] px-3 py-3 text-left text-[11px] font-bold uppercase text-slate-500">
                      Due Date
                    </th>

                    <th className="w-[18%] px-3 py-3 text-left text-[11px] font-bold uppercase text-slate-500">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {recentAssignments.map((item, index) => {
                    const dueDate = item.dueDate
                      ? new Date(item.dueDate)
                      : null;

                    const isOverdue =
                      dueDate &&
                      dueDate < new Date();

                    return (
                      <tr
                        key={
                          item._id ||
                          item.id ||
                          `${item.title}-${index}`
                        }
                        className="border-b border-slate-100"
                      >
                        <td className="px-3 py-3">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {item.title || "Untitled"}
                          </p>
                        </td>

                        <td className="px-3 py-3">
                          <p className="truncate text-xs text-slate-500">
                            {item.subject || "—"}
                          </p>
                        </td>

                        <td className="px-3 py-3 text-xs text-slate-500">
                          {dueDate
                            ? dueDate.toLocaleDateString()
                            : "—"}
                        </td>

                        <td className="px-3 py-3">
                          <span
                            className={`
                              inline-flex rounded-full px-2.5 py-1
                              text-[10px] font-bold
                              ${
                                isOverdue
                                  ? "bg-red-50 text-red-600"
                                  : "bg-emerald-50 text-emerald-600"
                              }
                            `}
                          >
                            {isOverdue ? "Overdue" : "Active"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* LOWER GRID */}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* ATTENDANCE */}

        <div className="
          rounded-2xl border border-slate-200
          bg-white p-5 shadow-sm
        ">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Attendance
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Recent attendance records
              </p>
            </div>

            <div className="
              flex h-10 w-10 items-center justify-center
              rounded-xl bg-emerald-50 text-emerald-600
            ">
              <TrendingUp size={19} />
            </div>
          </div>

          <div className="mb-5 rounded-xl bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Overall attendance
              </span>

              <strong className="text-xl font-bold text-slate-900">
                {attendancePercentage}%
              </strong>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{
                  width: `${Math.min(
                    100,
                    attendancePercentage
                  )}%`,
                }}
              />
            </div>
          </div>

          {recentAttendance.length === 0 ? (
            <div className="rounded-xl bg-slate-50 p-8 text-center">
              <p className="text-sm font-medium text-slate-500">
                No attendance records found
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentAttendance.slice(0, 5).map((item, index) => {
                const status = String(
                  item.status || ""
                ).toLowerCase();

                const present = status === "present";

                return (
                  <div
                    key={
                      item._id ||
                      item.id ||
                      `${item.date}-${index}`
                    }
                    className="
                      flex items-center justify-between gap-3
                      rounded-xl border border-slate-100 p-3
                    "
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {item.student?.name ||
                          item.studentName ||
                          item.name ||
                          "Student"}
                      </p>

                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {item.subject || "Attendance"}
                        {item.date
                          ? ` • ${new Date(
                              item.date
                            ).toLocaleDateString()}`
                          : ""}
                      </p>
                    </div>

                    <span
                      className={`
                        shrink-0 rounded-full px-2.5 py-1
                        text-[10px] font-bold
                        ${
                          present
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-red-50 text-red-600"
                        }
                      `}
                    >
                      {present ? "Present" : "Absent"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* NOTICES */}

        <div className="
          rounded-2xl border border-slate-200
          bg-white p-5 shadow-sm
        ">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Recent Notices
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Latest college announcements
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                onNavigate && onNavigate("notices")
              }
              className="
                inline-flex items-center gap-1
                text-xs font-bold text-violet-600
              "
            >
              View all
              <ArrowRight size={14} />
            </button>
          </div>

          {recentNotices.length === 0 ? (
            <div className="rounded-xl bg-slate-50 p-8 text-center">
              <p className="text-sm font-medium text-slate-500">
                No notices found
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentNotices.map((notice, index) => (
                <div
                  key={
                    notice._id ||
                    notice.id ||
                    `${notice.title}-${index}`
                  }
                  className="
                    flex items-start gap-3
                    rounded-xl border border-slate-100 p-4
                  "
                >
                  <div className="
                    flex h-9 w-9 shrink-0 items-center
                    justify-center rounded-lg
                    bg-violet-50 text-violet-600
                  ">
                    <Bell size={17} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-800">
                      {notice.title || "Notice"}
                    </p>

                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                      {notice.message ||
                        notice.description ||
                        "No description available."}
                    </p>

                    {notice.createdAt && (
                      <p className="mt-2 text-[10px] text-slate-400">
                        {new Date(
                          notice.createdAt
                        ).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ACADEMIC SUMMARY */}

      <div className="
        mt-6 rounded-2xl border border-slate-200
        bg-white p-5 shadow-sm
      ">
        <div className="
          flex flex-col gap-5
          sm:flex-row sm:items-center sm:justify-between
        ">
          <div className="flex items-center gap-3">
            <div className="
              flex h-11 w-11 shrink-0 items-center
              justify-center rounded-xl
              bg-slate-100 text-slate-600
            ">
              <CalendarDays size={20} />
            </div>

            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Academic Overview
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Current records available in OCMS.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-[10px] font-semibold uppercase text-slate-400">
                Exams
              </p>

              <p className="mt-1 text-lg font-bold text-slate-900">
                {exams.length}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase text-slate-400">
                Results
              </p>

              <p className="mt-1 text-lg font-bold text-slate-900">
                {results.length}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase text-slate-400">
                Notices
              </p>

              <p className="mt-1 text-lg font-bold text-slate-900">
                {notices.length}
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}