import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  GraduationCap,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react";
import { get } from "../services/api";

function parseArray(response, keys = []) {
  if (Array.isArray(response)) return response;
  for (const key of keys) {
    if (Array.isArray(response?.[key])) return response[key];
  }
  return Array.isArray(response?.data) ? response.data : [];
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

function StatCard({ icon: Icon, label, value, helper, tone, onClick }) {
  const tones = {
    blue: "bg-blue-50 text-blue-700",
    emerald: "bg-emerald-50 text-emerald-700",
    violet: "bg-violet-50 text-violet-700",
    amber: "bg-amber-50 text-amber-700",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div className={"flex h-10 w-10 items-center justify-center rounded-xl " + tones[tone]}>
          <Icon size={18} />
        </div>
        <ArrowRight size={15} className="text-slate-300 group-hover:text-slate-500" />
      </div>
      <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-1 text-3xl font-black tracking-tight text-slate-950">{value}</p>
      <p className="mt-1 text-[11px] text-slate-500">{helper}</p>
    </button>
  );
}

export default function AdminDashboard({ onNavigate }) {
  const [dashboard, setDashboard] = useState({});
  const [students, setStudents] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [exams, setExams] = useState([]);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadDashboard(refresh = false) {
    refresh ? setRefreshing(true) : setLoading(true);
    setError("");

    const requests = await Promise.allSettled([
      get("/dashboard"),
      get("/students"),
      get("/faculty"),
      get("/attendance"),
      get("/exams"),
      get("/notices"),
    ]);

    if (requests[0].status === "fulfilled") setDashboard(requests[0].value || {});
    if (requests[1].status === "fulfilled") setStudents(parseArray(requests[1].value, ["students"]));
    if (requests[2].status === "fulfilled") setFaculty(parseArray(requests[2].value, ["faculty"]));
    if (requests[3].status === "fulfilled") setAttendance(parseArray(requests[3].value, ["attendance", "records"]));
    if (requests[4].status === "fulfilled") setExams(parseArray(requests[4].value, ["exams", "examinations"]));
    if (requests[5].status === "fulfilled") setNotices(parseArray(requests[5].value, ["notices"]));

    if (requests.every((item) => item.status === "rejected")) {
      setError("Unable to load administration data. Check the backend connection.");
    }

    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const attendanceRate = useMemo(() => {
    if (!attendance.length) return 0;
    const active = attendance.filter((item) =>
      ["present", "late"].includes(String(item.status || "").toLowerCase())
    ).length;
    return Math.round((active / attendance.length) * 100);
  }, [attendance]);

  const lowAttendance = useMemo(() => {
    const map = new Map();
    attendance.forEach((item) => {
      const key = item.student?._id || item.student || item.rollNo || item.studentName;
      if (!key) return;
      const current = map.get(String(key)) || { total: 0, present: 0 };
      current.total += 1;
      if (["present", "late"].includes(String(item.status || "").toLowerCase())) current.present += 1;
      map.set(String(key), current);
    });

    let count = 0;
    map.forEach((item) => {
      if (item.total && (item.present / item.total) * 100 < 75) count += 1;
    });
    return count;
  }, [attendance]);

  const semesterCounts = useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0];
    students.forEach((student) => {
      const semester = Number(student.semester);
      if (semester >= 1 && semester <= 6) counts[semester - 1] += 1;
    });
    return counts;
  }, [students]);

  const maxSemester = Math.max(1, ...semesterCounts);

  const upcomingExams = useMemo(
    () =>
      [...exams]
        .filter((exam) => exam.date)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 4),
    [exams]
  );

  const recentNotices = useMemo(
    () =>
      [...notices]
        .sort(
          (a, b) =>
            new Date(b.createdAt || b.date || 0) -
            new Date(a.createdAt || a.date || 0)
        )
        .slice(0, 4),
    [notices]
  );

  if (loading) {
    return (
      <div className="flex min-h-[520px] items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-500 shadow-sm">
          <RefreshCw size={18} className="animate-spin" />
          Loading administration dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-5">
      <div className="flex flex-col gap-5 rounded-3xl bg-slate-950 p-6 text-white shadow-xl lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-300">
            <ShieldCheck size={13} />
            Administration
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Welcome back. Here’s what’s happening across your institution.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">Academic year</p>
            <p className="mt-1 text-sm font-bold">2026–27</p>
          </div>
          <button
            type="button"
            onClick={() => loadDashboard(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-xs font-bold hover:bg-white/15 disabled:opacity-50"
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <div className="flex items-center gap-2">
            <AlertTriangle size={17} />
            {error}
          </div>
          <button type="button" onClick={() => loadDashboard(true)} className="font-bold">Retry</button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Total students" value={dashboard.students ?? students.length} helper="Enrolled student records" tone="blue" onClick={() => onNavigate?.("students")} />
        <StatCard icon={GraduationCap} label="Total faculty" value={dashboard.faculty ?? faculty.length} helper="Teaching staff" tone="emerald" onClick={() => onNavigate?.("faculty")} />
        <StatCard icon={ClipboardCheck} label="Attendance rate" value={attendanceRate + "%"} helper="Across recorded sessions" tone="violet" onClick={() => onNavigate?.("attendance")} />
        <StatCard icon={AlertTriangle} label="Needs attention" value={lowAttendance} helper="Students below 75%" tone="amber" onClick={() => onNavigate?.("reports")} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-950">Student enrollment</h2>
              <p className="mt-1 text-xs text-slate-500">Current student distribution by semester.</p>
            </div>
            <BarChart3 size={18} className="text-blue-600" />
          </div>

          <div className="mt-7 flex h-56 items-end gap-3 border-b border-slate-100 px-2 pb-2">
            {semesterCounts.map((count, index) => {
              const height = Math.max(8, Math.round((count / maxSemester) * 175));
              return (
                <div key={index} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                  <span className="text-[10px] font-bold text-slate-500">{count}</span>
                  <div className="w-full max-w-12 rounded-t-xl bg-blue-600/90" style={{ height: height }} />
                  <span className="text-[10px] font-bold text-slate-400">Sem {index + 1}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-950">Attendance overview</h2>
              <p className="mt-1 text-xs text-slate-500">Present and absent sessions.</p>
            </div>
            <ClipboardCheck size={18} className="text-emerald-600" />
          </div>

          <div className="mt-8 flex items-center justify-center">
            <div
              className="flex h-40 w-40 items-center justify-center rounded-full"
              style={{ background: "conic-gradient(#10b981 " + attendanceRate + "%, #fecaca " + attendanceRate + "% 100%)" }}
            >
              <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white">
                <span className="text-3xl font-black text-slate-950">{attendanceRate}%</span>
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Overall</span>
              </div>
            </div>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-emerald-50 p-3">
              <p className="text-[10px] font-bold uppercase text-emerald-700">Present</p>
              <p className="mt-1 text-lg font-black text-slate-900">{Math.round((attendanceRate / 100) * attendance.length)}</p>
            </div>
            <div className="rounded-xl bg-red-50 p-3">
              <p className="text-[10px] font-bold uppercase text-red-700">Other</p>
              <p className="mt-1 text-lg font-black text-slate-900">{Math.max(0, attendance.length - Math.round((attendanceRate / 100) * attendance.length))}</p>
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-base font-black text-slate-950">Upcoming examinations</h2>
              <p className="mt-1 text-xs text-slate-500">Next academic events across the institution.</p>
            </div>
            <button type="button" onClick={() => onNavigate?.("exams")} className="text-xs font-bold text-blue-700">View all</button>
          </div>

          <div className="divide-y divide-slate-100">
            {upcomingExams.length ? upcomingExams.map((exam, index) => (
              <div key={exam._id || index} className="flex items-center gap-4 px-5 py-4">
                <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                  <span className="text-[9px] font-black uppercase">{new Date(exam.date).toLocaleDateString("en-IN", { month: "short" })}</span>
                  <span className="text-lg font-black leading-none">{new Date(exam.date).getDate()}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900">{exam.name || "Examination"}</p>
                  <p className="mt-1 text-xs text-slate-500">{exam.course || "Course"} • Semester {exam.semester || "—"} • {formatDate(exam.date)}</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">{exam.status || "Scheduled"}</span>
              </div>
            )) : (
              <div className="px-5 py-12 text-center text-sm text-slate-500">
                <CalendarDays className="mx-auto text-slate-300" size={26} />
                <p className="mt-2">No upcoming examinations.</p>
              </div>
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-base font-black text-slate-950">Recent notices</h2>
              <p className="mt-1 text-xs text-slate-500">Latest communication.</p>
            </div>
            <Bell size={18} className="text-slate-400" />
          </div>

          <div className="divide-y divide-slate-100">
            {recentNotices.length ? recentNotices.map((notice, index) => (
              <button
                key={notice._id || index}
                type="button"
                onClick={() => onNavigate?.("notices")}
                className="flex w-full items-start gap-3 px-5 py-4 text-left hover:bg-slate-50"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <Bell size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-slate-900">{notice.title || "Notice"}</p>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-slate-500">{notice.message || notice.description || "Announcement available."}</p>
                </div>
              </button>
            )) : (
              <div className="px-5 py-12 text-center text-sm text-slate-500">No notices available.</div>
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          [Users, "Students", "students", students.length],
          [GraduationCap, "Faculty", "faculty", faculty.length],
          [ClipboardList, "Assignments", "assignments", dashboard.assignments ?? 0],
          [BookOpen, "Subjects", "reports", dashboard.subjects ?? 0],
        ].map(([Icon, label, page, value]) => (
          <button
            key={label}
            type="button"
            onClick={() => onNavigate?.(page)}
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <Icon size={17} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
              <p className="mt-0.5 text-lg font-black text-slate-900">{value}</p>
            </div>
            <CheckCircle2 size={15} className="text-emerald-500" />
          </button>
        ))}
      </div>
    </div>
  );
}
