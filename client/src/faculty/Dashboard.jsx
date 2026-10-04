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

function parseArray(response, keys = []) {
  if (Array.isArray(response)) return response;
  for (const key of keys) {
    if (Array.isArray(response?.[key])) return response[key];
  }
  return Array.isArray(response?.data) ? response.data : [];
}

function getUser() {
  try {
    return JSON.parse(
      localStorage.getItem("ocms_user") ||
      sessionStorage.getItem("ocms_user") ||
      "null"
    );
  } catch {
    return null;
  }
}

function dateLabel(value, includeYear = false) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    ...(includeYear ? { year: "numeric" } : {}),
  });
}

export default function Dashboard({ onNavigate }) {
  const user = getUser();
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [notices, setNotices] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadDashboard(refresh = false) {
    refresh ? setRefreshing(true) : setLoading(true);

    const requests = await Promise.allSettled([
      user?.email
        ? get("/faculty/students?facultyEmail=" + encodeURIComponent(user.email))
        : get("/students"),
      get("/assignments"),
      get("/attendance"),
      get("/exams"),
      get("/results"),
      get("/notices"),
      get("/timetable"),
    ]);

    if (requests[0].status === "fulfilled") setStudents(parseArray(requests[0].value, ["students"]));
    if (requests[1].status === "fulfilled") setAssignments(parseArray(requests[1].value, ["assignments"]));
    if (requests[2].status === "fulfilled") setAttendance(parseArray(requests[2].value, ["attendance", "records"]));
    if (requests[3].status === "fulfilled") setExams(parseArray(requests[3].value, ["exams", "examinations"]));
    if (requests[4].status === "fulfilled") setResults(parseArray(requests[4].value, ["results"]));
    if (requests[5].status === "fulfilled") setNotices(parseArray(requests[5].value, ["notices"]));
    if (requests[6].status === "fulfilled") setTimetable(parseArray(requests[6].value, ["timetable"]));

    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const facultyClasses = useMemo(() => {
    const facultyName = String(user?.name || "").toLowerCase();
    const facultyEmail = String(user?.email || "").toLowerCase();

    const filtered = timetable.filter((item) => {
      const value = String(item.faculty || "").toLowerCase();
      return !value || value === facultyName || value === facultyEmail;
    });

    return filtered.length ? filtered : timetable;
  }, [timetable, user]);

  const todayName = new Date().toLocaleDateString("en-US", { weekday: "long" });

  const todayClasses = useMemo(() => {
    const sameDay = facultyClasses
      .filter((item) => String(item.day || "").toLowerCase() === todayName.toLowerCase())
      .sort((a, b) => Number(a.period || 0) - Number(b.period || 0));

    return sameDay.length ? sameDay : facultyClasses.slice(0, 4);
  }, [facultyClasses, todayName]);

  const attendanceRate = useMemo(() => {
    if (!attendance.length) return 0;
    const present = attendance.filter((item) =>
      ["present", "late"].includes(String(item.status || "").toLowerCase())
    ).length;
    return Math.round((present / attendance.length) * 100);
  }, [attendance]);

  const upcomingAssignments = useMemo(
    () =>
      [...assignments]
        .filter((item) => item.dueDate)
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, 4),
    [assignments]
  );

  const upcomingExams = useMemo(
    () =>
      [...exams]
        .filter((item) => item.date)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 3),
    [exams]
  );

  const recentResults = useMemo(
    () =>
      [...results]
        .filter((item) => item.published !== false)
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 4),
    [results]
  );

  const recentNotices = useMemo(
    () =>
      [...notices]
        .sort(
          (a, b) =>
            new Date(b.createdAt || b.date || 0) -
            new Date(a.createdAt || a.date || 0)
        )
        .slice(0, 3),
    [notices]
  );

  const subjects = useMemo(() => {
    const set = new Set();
    facultyClasses.forEach((item) => item.subject && set.add(String(item.subject)));
    assignments.forEach((item) => item.subject && set.add(String(item.subject)));
    return Array.from(set);
  }, [facultyClasses, assignments]);

  if (loading) {
    return (
      <div className="flex min-h-[520px] items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-500 shadow-sm">
          <RefreshCw size={18} className="animate-spin" />
          Loading faculty dashboard...
        </div>
      </div>
    );
  }

  const firstName = String(user?.name || "Faculty").split(" ")[0];

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-5">
      <div className="flex flex-col gap-5 rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-blue-700">
            <Users size={13} />
            Faculty workspace
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Good morning, {firstName}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Here’s your teaching overview for today.
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadDashboard(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 lg:self-auto"
        >
          <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [BookOpen, "My classes", todayClasses.length, "Today’s scheduled classes", "blue"],
          [Users, "Total students", students.length, "Students in your view", "emerald"],
          [ClipboardList, "Pending assignments", upcomingAssignments.length, "Upcoming deadlines", "amber"],
          [ClipboardCheck, "Attendance", attendanceRate + "%", "Current recorded rate", "violet"],
        ].map(([Icon, label, value, helper, tone]) => {
          const toneClass = {
            blue: "bg-blue-50 text-blue-700",
            emerald: "bg-emerald-50 text-emerald-700",
            amber: "bg-amber-50 text-amber-700",
            violet: "bg-violet-50 text-violet-700",
          }[tone];

          return (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className={"flex h-10 w-10 items-center justify-center rounded-xl " + toneClass}>
                <Icon size={18} />
              </div>
              <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{label}</p>
              <p className="mt-1 text-3xl font-black tracking-tight text-slate-950">{value}</p>
              <p className="mt-1 text-[11px] text-slate-500">{helper}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-base font-black text-slate-950">Today’s schedule</h2>
              <p className="mt-1 text-xs text-slate-500">{todayName} • Your classes at a glance.</p>
            </div>
            <button type="button" onClick={() => onNavigate?.("attendance")} className="text-xs font-bold text-blue-700">
              Attendance
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {todayClasses.length ? todayClasses.map((item, index) => (
              <div key={item._id || index} className="flex items-center gap-3 px-5 py-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                  <CalendarClock size={17} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900">{item.subject || "Class"}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.time || ("Period " + (item.period || "—"))}
                    {item.course ? " • " + item.course : ""}
                    {item.room ? " • Room " + item.room : ""}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                  {item.section ? "Sec " + item.section : "Scheduled"}
                </span>
              </div>
            )) : (
              <div className="px-5 py-12 text-center text-sm text-slate-500">No classes scheduled.</div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
          <div className="flex items-center gap-2 text-blue-300">
            <TrendingUp size={18} />
            <span className="text-xs font-bold uppercase tracking-[0.14em]">Attendance this month</span>
          </div>
          <div className="mt-5 flex items-end justify-between gap-5">
            <div>
              <p className="text-5xl font-black tracking-tight">{attendanceRate}%</p>
              <p className="mt-2 text-xs text-slate-400">Recorded attendance activity.</p>
            </div>
            <div
              className="flex h-28 w-28 items-center justify-center rounded-full"
              style={{ background: "conic-gradient(#22c55e " + attendanceRate + "%, #1e293b " + attendanceRate + "% 100%)" }}
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-950 text-xs font-black">
                {attendance.length} records
              </div>
            </div>
          </div>
          <div className="mt-6 h-2 rounded-full bg-white/10">
            <div className="h-full rounded-full bg-emerald-400" style={{ width: attendanceRate + "%" }} />
          </div>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-base font-black text-slate-950">Pending assignments</h2>
              <p className="mt-1 text-xs text-slate-500">Upcoming work visible to your classes.</p>
            </div>
            <button type="button" onClick={() => onNavigate?.("assignments")} className="text-xs font-bold text-violet-700">View all</button>
          </div>

          <div className="divide-y divide-slate-100">
            {upcomingAssignments.length ? upcomingAssignments.map((item, index) => (
              <div key={item._id || index} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-5 py-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">{item.title || "Assignment"}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.subject || "Subject"}</p>
                </div>
                <span className="whitespace-nowrap text-xs font-semibold text-slate-500">{dateLabel(item.dueDate)}</span>
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">Open</span>
              </div>
            )) : (
              <div className="px-5 py-12 text-center text-sm text-slate-500">No pending assignments.</div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-base font-black text-slate-950">Upcoming exams</h2>
            <p className="mt-1 text-xs text-slate-500">Next scheduled academic events.</p>
          </div>
          <div className="space-y-3 p-5">
            {upcomingExams.length ? upcomingExams.map((exam, index) => (
              <div key={exam._id || index} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-600">
                  <FileText size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-slate-900">{exam.name || "Examination"}</p>
                  <p className="mt-1 text-[11px] text-slate-500">{dateLabel(exam.date)} • Sem {exam.semester || "—"}</p>
                </div>
              </div>
            )) : (
              <div className="py-8 text-center text-sm text-slate-500">No upcoming exams.</div>
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-base font-black text-slate-950">My students</h2>
              <p className="mt-1 text-xs text-slate-500">A compact academic snapshot.</p>
            </div>
            <button type="button" onClick={() => onNavigate?.("students")} className="text-xs font-bold text-blue-700">View all</button>
          </div>
          <div className="p-5">
            {students.length ? (
              <div className="grid grid-cols-[auto_1fr_auto] gap-x-3 gap-y-2 text-xs">
                {students.slice(0, 6).map((student, index) => (
                  <React.Fragment key={student._id || index}>
                    <span className="font-bold text-slate-400">{student.rollNo || String(index + 1).padStart(3, "0")}</span>
                    <span className="truncate font-semibold text-slate-800">{student.name || "Student"}</span>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700">{student.status || "Active"}</span>
                  </React.Fragment>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-slate-500">No students available.</p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-base font-black text-slate-950">Latest notices</h2>
              <p className="mt-1 text-xs text-slate-500">College communication for faculty.</p>
            </div>
            <Bell size={18} className="text-slate-400" />
          </div>
          <div className="divide-y divide-slate-100">
            {recentNotices.length ? recentNotices.map((notice, index) => (
              <button key={notice._id || index} type="button" onClick={() => onNavigate?.("notices")} className="flex w-full items-start gap-3 px-5 py-4 text-left hover:bg-slate-50">
                <Bell size={15} className="mt-0.5 shrink-0 text-blue-600" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-slate-900">{notice.title || "Notice"}</p>
                  <p className="mt-1 line-clamp-1 text-[11px] text-slate-500">{notice.message || notice.description || "Announcement available."}</p>
                </div>
              </button>
            )) : (
              <div className="px-5 py-10 text-center text-sm text-slate-500">No notices available.</div>
            )}
          </div>
        </section>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <CheckCircle2 size={18} className="text-emerald-500" />
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-900">Teaching workspace ready</p>
          <p className="mt-1 text-xs text-slate-500">
            {subjects.length} subject(s) detected across your current classes and assignment records.
          </p>
        </div>
        <ArrowRight size={16} className="text-slate-300" />
      </div>
    </div>
  );
}
