import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
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

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

function StatCard({ icon: Icon, label, value, helper, onClick, tone = "violet" }) {
  const tones = {
    violet: "bg-violet-50 text-violet-700",
    blue: "bg-blue-50 text-blue-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${tones[tone]}`}>
          <Icon size={20} />
        </div>
        <ArrowRight size={16} className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500" />
      </div>
      <p className="mt-5 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p className="mt-1 text-3xl font-black tracking-tight text-slate-950">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{helper}</p>
    </button>
  );
}

export default function AdminDashboard({ onNavigate }) {
  const [dashboard, setDashboard] = useState(null);
  const [students, setStudents] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [exams, setExams] = useState([]);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadDashboard(isRefresh = false) {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError("");

    const requests = await Promise.allSettled([
      get("/dashboard"),
      get("/students"),
      get("/faculty"),
      get("/attendance"),
      get("/exams"),
      get("/notices"),
    ]);

    const [dashboardResult, studentResult, facultyResult, attendanceResult, examsResult, noticesResult] = requests;

    if (dashboardResult.status === "fulfilled") setDashboard(dashboardResult.value || {});
    if (studentResult.status === "fulfilled") {
      const data = studentResult.value;
      setStudents(Array.isArray(data) ? data : data?.students || data?.data || []);
    }
    if (facultyResult.status === "fulfilled") {
      const data = facultyResult.value;
      setFaculty(Array.isArray(data) ? data : data?.faculty || data?.data || []);
    }
    if (attendanceResult.status === "fulfilled") {
      const data = attendanceResult.value;
      setAttendance(Array.isArray(data) ? data : data?.attendance || data?.records || data?.data || []);
    }
    if (examsResult.status === "fulfilled") {
      const data = examsResult.value;
      setExams(Array.isArray(data) ? data : data?.exams || data?.data || []);
    }
    if (noticesResult.status === "fulfilled") {
      const data = noticesResult.value;
      setNotices(Array.isArray(data) ? data : data?.notices || data?.data || []);
    }

    if (requests.every((item) => item.status === "rejected")) {
      setError("Unable to load dashboard data. Check that the OCMS backend is running.");
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

  const lowAttendanceCount = useMemo(() => {
    const grouped = new Map();
    attendance.forEach((item) => {
      const key = item.student?._id || item.student || item.rollNo || item.studentName;
      if (!key) return;
      const current = grouped.get(String(key)) || { total: 0, attended: 0 };
      current.total += 1;
      if (["present", "late"].includes(String(item.status || "").toLowerCase())) current.attended += 1;
      grouped.set(String(key), current);
    });
    let count = 0;
    grouped.forEach((item) => {
      if (item.total && (item.attended / item.total) * 100 < 75) count += 1;
    });
    return count;
  }, [attendance]);

  const upcomingExams = useMemo(() => {
    return [...exams]
      .filter((item) => item.date)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 5);
  }, [exams]);

  const recentNotices = useMemo(() => {
    return [...notices]
      .sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0))
      .slice(0, 4);
  }, [notices]);

  const quickActions = [
    ["Add Student", "students", Users],
    ["Add Faculty", "faculty", GraduationCap],
    ["Create Exam", "exams", CalendarDays],
    ["Post Notice", "notices", Bell],
  ];

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[520px] max-w-[1600px] items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-500 shadow-sm">
          <RefreshCw size={18} className="animate-spin" />
          Loading administration workspace...
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl bg-slate-950 p-6 text-white shadow-xl sm:p-7 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-300">
            <ShieldCheck size={14} />
            Administration
          </div>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Good morning, Administrator</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            A central view of enrollment, attendance, academic activity and important actions across OCMS.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Academic year</p>
            <p className="mt-1 text-sm font-bold">2026–27</p>
          </div>
          <button
            type="button"
            onClick={() => loadDashboard(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/15 disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm">
          <div className="flex items-center gap-3 text-red-700">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
          <button type="button" onClick={() => loadDashboard(true)} className="font-bold text-red-700 hover:text-red-900">
            Retry
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Students" value={dashboard?.students ?? students.length} helper="Enrolled student records" tone="violet" onClick={() => onNavigate?.("students")} />
        <StatCard icon={GraduationCap} label="Faculty" value={dashboard?.faculty ?? faculty.length} helper="Teaching staff records" tone="blue" onClick={() => onNavigate?.("faculty")} />
        <StatCard icon={ClipboardCheck} label="Attendance" value={`${attendancePercentage}%`} helper="Across recorded sessions" tone="emerald" onClick={() => onNavigate?.("attendance")} />
        <StatCard icon={Activity} label="Attention needed" value={lowAttendanceCount} helper="Students below 75% attendance" tone="amber" onClick={() => onNavigate?.("reports")} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickActions.map(([title, page, Icon]) => (
          <button
            key={title}
            type="button"
            onClick={() => onNavigate?.(page)}
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-violet-200 hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <Icon size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900">{title}</p>
              <p className="mt-0.5 text-xs text-slate-500">Open module</p>
            </div>
            <ArrowRight size={15} className="ml-auto text-slate-300" />
          </button>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-lg font-black text-slate-950">Upcoming examinations</h2>
              <p className="mt-1 text-xs text-slate-500">The next scheduled academic events.</p>
            </div>
            <button type="button" onClick={() => onNavigate?.("exams")} className="text-xs font-bold text-violet-600 hover:text-violet-800">
              View all
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {upcomingExams.length ? upcomingExams.map((exam, index) => (
              <div key={exam._id || index} className="flex items-center gap-4 px-5 py-4">
                <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                  <span className="text-[10px] font-black uppercase">{new Date(exam.date).toLocaleDateString(undefined, { month: "short" })}</span>
                  <span className="text-lg font-black leading-none">{new Date(exam.date).getDate()}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900">{exam.name || "Examination"}</p>
                  <p className="mt-1 text-xs text-slate-500">{exam.course || "Course"} • Semester {exam.semester || "—"} • {formatDate(exam.date)}</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">{exam.status || "Scheduled"}</span>
              </div>
            )) : (
              <div className="px-5 py-12 text-center">
                <CalendarDays className="mx-auto text-slate-300" size={26} />
                <p className="mt-3 text-sm font-semibold text-slate-500">No upcoming examinations</p>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-lg font-black text-slate-950">Attention required</h2>
              <p className="mt-1 text-xs text-slate-500">Operational signals worth reviewing.</p>
            </div>
            <AlertTriangle size={18} className="text-amber-500" />
          </div>
          <div className="space-y-3 p-5">
            <button type="button" onClick={() => onNavigate?.("reports")} className="flex w-full items-center gap-3 rounded-xl border border-amber-100 bg-amber-50 p-3 text-left">
              <AlertTriangle size={17} className="shrink-0 text-amber-600" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900">Low attendance</p>
                <p className="mt-0.5 text-xs text-slate-500">{lowAttendanceCount} students are below the 75% threshold.</p>
              </div>
              <ArrowRight size={15} className="text-slate-300" />
            </button>
            <button type="button" onClick={() => onNavigate?.("exams")} className="flex w-full items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 p-3 text-left">
              <ClipboardList size={17} className="shrink-0 text-blue-600" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900">Exam management</p>
                <p className="mt-0.5 text-xs text-slate-500">{exams.length} examination record(s) in the system.</p>
              </div>
              <ArrowRight size={15} className="text-slate-300" />
            </button>
            <button type="button" onClick={() => onNavigate?.("notices")} className="flex w-full items-center gap-3 rounded-xl border border-violet-100 bg-violet-50 p-3 text-left">
              <Bell size={17} className="shrink-0 text-violet-600" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900">Published communication</p>
                <p className="mt-0.5 text-xs text-slate-500">{notices.length} notice record(s) available.</p>
              </div>
              <ArrowRight size={15} className="text-slate-300" />
            </button>
          </div>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-lg font-black text-slate-950">Recent notices</h2>
              <p className="mt-1 text-xs text-slate-500">Latest announcements published to users.</p>
            </div>
            <Bell size={18} className="text-slate-400" />
          </div>
          <div className="divide-y divide-slate-100">
            {recentNotices.length ? recentNotices.map((notice, index) => (
              <div key={notice._id || index} className="flex items-start gap-3 px-5 py-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <Bell size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900">{notice.title || notice.subject || "Notice"}</p>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{notice.message || notice.description || "College announcement available."}</p>
                </div>
                <span className="whitespace-nowrap text-[10px] font-semibold text-slate-400">{formatDate(notice.createdAt || notice.date)}</span>
              </div>
            )) : (
              <div className="px-5 py-10 text-center text-sm text-slate-500">No notices available.</div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-lg font-black text-slate-950">System snapshot</h2>
              <p className="mt-1 text-xs text-slate-500">Current operational inventory.</p>
            </div>
            <CheckCircle2 size={18} className="text-emerald-500" />
          </div>
          <div className="grid gap-3 p-5 sm:grid-cols-2">
            {[
              ["Students", students.length, Users],
              ["Faculty", faculty.length, GraduationCap],
              ["Subjects", dashboard?.subjects ?? 0, BookOpen],
              ["Assignments", dashboard?.assignments ?? 0, ClipboardList],
              ["Attendance records", attendance.length, ClipboardCheck],
              ["Examinations", exams.length, CalendarDays],
            ].map(([label, value, Icon]) => (
              <button
                type="button"
                key={label}
                onClick={() => onNavigate?.(label === "Students" ? "students" : label === "Faculty" ? "faculty" : label === "Examinations" ? "exams" : "reports")}
                className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 text-left"
              >
                <Icon size={17} className="text-slate-500" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-500">{label}</p>
                  <p className="text-lg font-black text-slate-900">{value}</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <BarChart3 size={18} className="text-violet-600" />
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-900">Administration workspace</p>
          <p className="mt-0.5 text-xs text-slate-500">Use the navigation to manage people, academics, attendance, communication and reporting.</p>
        </div>
        <span className="hidden rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 sm:inline-flex">Operational</span>
      </div>
    </div>
  );
}
