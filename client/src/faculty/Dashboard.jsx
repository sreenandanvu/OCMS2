import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  FileText,
  RefreshCw,
  TrendingUp,
  Users,
} from "lucide-react";
import { get } from "../services/api";

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
}

export default function Dashboard({ onNavigate }) {
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [exams, setExams] = useState([]);
  const [notices, setNotices] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadDashboard(isRefresh = false) {
    isRefresh ? setRefreshing(true) : setLoading(true);
    const requests = await Promise.allSettled([
      get("/students"),
      get("/assignments"),
      get("/attendance"),
      get("/exams"),
      get("/notices"),
    ]);

    const [studentResult, assignmentResult, attendanceResult, examResult, noticeResult] = requests;

    if (studentResult.status === "fulfilled") {
      const data = studentResult.value;
      setStudents(Array.isArray(data) ? data : data?.students || data?.data || []);
    }
    if (assignmentResult.status === "fulfilled") {
      const data = assignmentResult.value;
      setAssignments(Array.isArray(data) ? data : data?.assignments || data?.data || []);
    }
    if (attendanceResult.status === "fulfilled") {
      const data = attendanceResult.value;
      setAttendance(Array.isArray(data) ? data : data?.attendance || data?.records || data?.data || []);
    }
    if (examResult.status === "fulfilled") {
      const data = examResult.value;
      setExams(Array.isArray(data) ? data : data?.exams || data?.data || []);
    }
    if (noticeResult.status === "fulfilled") {
      const data = noticeResult.value;
      setNotices(Array.isArray(data) ? data : data?.notices || data?.data || []);
    }

    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const attendancePercentage = useMemo(() => {
    if (!attendance.length) return 0;
    const attended = attendance.filter((item) =>
      ["present", "late"].includes(String(item.status || "").toLowerCase())
    ).length;
    return Math.round((attended / attendance.length) * 100);
  }, [attendance]);

  const pendingAssignments = useMemo(() => {
    return assignments.filter((item) => {
      const due = item.dueDate ? new Date(item.dueDate) : null;
      return due && !Number.isNaN(due.getTime()) && due >= new Date();
    }).slice(0, 5);
  }, [assignments]);

  const upcomingExams = useMemo(() => {
    return [...exams]
      .filter((item) => item.date)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 4);
  }, [exams]);

  const recentNotices = useMemo(() => {
    return [...notices]
      .sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0))
      .slice(0, 3);
  }, [notices]);

  const subjects = useMemo(() => {
    const set = new Set();
    attendance.forEach((item) => item.subject && set.add(String(item.subject)));
    assignments.forEach((item) => item.subject && set.add(String(item.subject)));
    return Array.from(set);
  }, [attendance, assignments]);

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[520px] max-w-[1500px] items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-500 shadow-sm">
          <RefreshCw size={18} className="animate-spin" />
          Loading faculty workspace...
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6 shadow-sm sm:p-7 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">Faculty Portal</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Good morning, Anjali</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Your teaching workspace for classes, attendance, assignments and student progress.
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadDashboard(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [Users, "My Students", students.length, "Assigned student records", "students", "blue"],
          [ClipboardCheck, "Attendance", \`\${attendancePercentage}%\`, "Across recorded sessions", "attendance", "emerald"],
          [ClipboardList, "Assignments", assignments.length, "Available assignment records", "assignments", "violet"],
          [BookOpen, "Subjects", subjects.length, "Subjects in current records", "assignments", "amber"],
        ].map(([Icon, label, value, helper, page, tone]) => {
          const toneMap = {
            blue: "bg-blue-50 text-blue-700",
            emerald: "bg-emerald-50 text-emerald-700",
            violet: "bg-violet-50 text-violet-700",
            amber: "bg-amber-50 text-amber-700",
          };
          return (
            <button
              type="button"
              key={label}
              onClick={() => onNavigate?.(page)}
              className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className={\`flex h-11 w-11 items-center justify-center rounded-xl \${toneMap[tone]}\`}>
                <Icon size={20} />
              </div>
              <p className="mt-5 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p>
              <p className="mt-1 text-3xl font-black tracking-tight text-slate-950">{value}</p>
              <p className="mt-1 text-xs text-slate-500">{helper}</p>
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-950">Teaching priorities</h2>
              <p className="mt-1 text-xs text-slate-500">The actions most likely to need your attention today.</p>
            </div>
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
              <CheckCircle2 size={13} />
              Workspace ready
            </span>
          </div>
          <div className="grid gap-3 p-5 sm:grid-cols-2">
            <button type="button" onClick={() => onNavigate?.("attendance")} className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-left">
              <div className="flex items-center justify-between">
                <ClipboardCheck size={19} className="text-emerald-700" />
                <ArrowRight size={15} className="text-emerald-300" />
              </div>
              <p className="mt-5 text-sm font-bold text-slate-900">Take attendance</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">Open the attendance workflow for your classes.</p>
            </button>
            <button type="button" onClick={() => onNavigate?.("assignments")} className="rounded-xl border border-violet-100 bg-violet-50 p-4 text-left">
              <div className="flex items-center justify-between">
                <ClipboardList size={19} className="text-violet-700" />
                <ArrowRight size={15} className="text-violet-300" />
              </div>
              <p className="mt-5 text-sm font-bold text-slate-900">Review assignments</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{pendingAssignments.length} active item(s) are approaching their due dates.</p>
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
          <div className="flex items-center gap-2 text-blue-300">
            <TrendingUp size={18} />
            <span className="text-xs font-bold uppercase tracking-[0.14em]">Attendance pulse</span>
          </div>
          <p className="mt-4 text-5xl font-black tracking-tight">{attendancePercentage}%</p>
          <p className="mt-2 text-xs leading-5 text-slate-400">Based on all attendance records currently returned by the OCMS API.</p>
          <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-emerald-400" style={{ width: \`\${Math.min(100, attendancePercentage)}%\` }} />
          </div>
          <button type="button" onClick={() => onNavigate?.("attendance")} className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-white">
            Open attendance
            <ArrowRight size={14} />
          </button>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-lg font-black text-slate-950">Upcoming assignments</h2>
              <p className="mt-1 text-xs text-slate-500">Keep deadlines and student work visible.</p>
            </div>
            <button type="button" onClick={() => onNavigate?.("assignments")} className="text-xs font-bold text-blue-700">View all</button>
          </div>
          <div className="divide-y divide-slate-100">
            {pendingAssignments.length ? pendingAssignments.map((item, index) => (
              <div key={item._id || index} className="flex items-center gap-3 px-5 py-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <ClipboardList size={17} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900">{item.title || "Assignment"}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.subject || "Subject"} • Due {formatDate(item.dueDate)}</p>
                </div>
                <ArrowRight size={15} className="text-slate-300" />
              </div>
            )) : (
              <div className="px-5 py-12 text-center text-sm text-slate-500">No active assignment deadlines found.</div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-lg font-black text-slate-950">Upcoming exams</h2>
            <p className="mt-1 text-xs text-slate-500">Next academic events.</p>
          </div>
          <div className="space-y-3 p-5">
            {upcomingExams.length ? upcomingExams.map((exam, index) => (
              <div key={exam._id || index} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                <CalendarClock size={17} className="text-blue-600" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900">{exam.name || "Examination"}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatDate(exam.date)} • Sem {exam.semester || "—"}</p>
                </div>
              </div>
            )) : (
              <p className="py-8 text-center text-sm text-slate-500">No upcoming exams.</p>
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-lg font-black text-slate-950">Student attention</h2>
              <p className="mt-1 text-xs text-slate-500">Signals to review in your teaching workflow.</p>
            </div>
            <AlertTriangle size={18} className="text-amber-500" />
          </div>
          <button type="button" onClick={() => onNavigate?.("students")} className="flex w-full items-center gap-3 p-5 text-left">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <Users size={19} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900">{students.length} students in the current data view</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">Open My Students to review individual academic and attendance information.</p>
            </div>
            <ArrowRight size={15} className="text-slate-300" />
          </button>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-lg font-black text-slate-950">Latest notices</h2>
              <p className="mt-1 text-xs text-slate-500">Recent college announcements.</p>
            </div>
            <Bell size={18} className="text-slate-400" />
          </div>
          <div className="divide-y divide-slate-100">
            {recentNotices.length ? recentNotices.map((notice, index) => (
              <button key={notice._id || index} type="button" onClick={() => onNavigate?.("notices")} className="flex w-full items-start gap-3 px-5 py-4 text-left hover:bg-slate-50">
                <Bell size={16} className="mt-0.5 shrink-0 text-blue-600" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900">{notice.title || "Notice"}</p>
                  <p className="mt-1 line-clamp-1 text-xs text-slate-500">{notice.message || notice.description || "Announcement available."}</p>
                </div>
              </button>
            )) : (
              <div className="px-5 py-10 text-center text-sm text-slate-500">No notices available.</div>
            )}
          </div>
        </section>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <FileText size={18} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-900">Teaching workspace</p>
            <p className="mt-0.5 text-xs text-slate-500">Attendance, assignments, marks, students and performance are available from the left navigation.</p>
          </div>
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
            <CheckCircle2 size={13} />
            Ready
          </span>
        </div>
      </div>
    </div>
  );
}
