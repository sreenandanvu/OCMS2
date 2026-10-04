import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  FileText,
  RefreshCw,
  Trophy,
} from "lucide-react";
import { get } from "../services/api";

function parseArray(response, keys = []) {
  if (Array.isArray(response)) return response;
  for (const key of keys) {
    if (Array.isArray(response?.[key])) return response[key];
  }
  return Array.isArray(response?.data) ? response.data : [];
}

function getLoggedUser() {
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

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
      });
}

export default function Dashboard({ onNavigate }) {
  const loggedUser = getLoggedUser();
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [notices, setNotices] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadDashboard(refresh = false) {
    refresh ? setRefreshing(true) : setLoading(true);

    const requests = await Promise.allSettled([
      get("/students"),
      get("/attendance"),
      get("/assignments"),
      get("/exams"),
      get("/results"),
      get("/notices"),
      get("/timetable"),
    ]);

    if (requests[0].status === "fulfilled") setStudents(parseArray(requests[0].value, ["students"]));
    if (requests[1].status === "fulfilled") setAttendance(parseArray(requests[1].value, ["attendance", "records"]));
    if (requests[2].status === "fulfilled") setAssignments(parseArray(requests[2].value, ["assignments"]));
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

  const myStudent = useMemo(() => {
    if (!students.length) return null;
    return (
      students.find((item) => item.email === loggedUser?.email) ||
      students.find((item) => item.rollNo === loggedUser?.rollNo) ||
      students.find((item) => item.name === loggedUser?.name) ||
      students[0]
    );
  }, [students, loggedUser]);

  const myAttendance = useMemo(() => {
    if (!attendance.length) return [];
    const id = myStudent?._id;
    const roll = myStudent?.rollNo;
    const email = myStudent?.email;
    const name = myStudent?.name;

    return attendance.filter((item) => {
      if (id && String(item.student?._id || item.student || "") === String(id)) return true;
      if (roll && String(item.rollNo || "") === String(roll)) return true;
      if (email && String(item.studentEmail || "").toLowerCase() === String(email).toLowerCase()) return true;
      if (name && String(item.studentName || "").toLowerCase() === String(name).toLowerCase()) return true;
      return students.length <= 1;
    });
  }, [attendance, myStudent, students.length]);

  const myResults = useMemo(() => {
    if (!results.length) return [];
    const id = myStudent?._id;
    const roll = myStudent?.rollNo;
    const name = myStudent?.name;

    return results.filter((item) => {
      if (id && String(item.student?._id || item.student || "") === String(id)) return true;
      if (roll && String(item.rollNo || "") === String(roll)) return true;
      if (name && String(item.studentName || "").toLowerCase() === String(name).toLowerCase()) return true;
      return students.length <= 1;
    });
  }, [results, myStudent, students.length]);

  const course = myStudent?.course || loggedUser?.course || "MCA";
  const semester = Number(myStudent?.semester || loggedUser?.semester || 1);
  const section = myStudent?.section || loggedUser?.section || "A";

  const myTimetable = useMemo(() => {
    const filtered = timetable.filter((item) => {
      const courseMatches = !item.course || String(item.course).toLowerCase() === String(course).toLowerCase();
      const semesterMatches = !item.semester || Number(item.semester) === semester;
      const sectionMatches = !item.section || String(item.section).toLowerCase() === String(section).toLowerCase();
      return courseMatches && semesterMatches && sectionMatches;
    });

    return filtered.length ? filtered : timetable;
  }, [timetable, course, semester, section]);

  const todayName = new Date().toLocaleDateString("en-US", { weekday: "long" });

  const todayClasses = useMemo(() => {
    const sameDay = myTimetable
      .filter((item) => String(item.day || "").toLowerCase() === todayName.toLowerCase())
      .sort((a, b) => Number(a.period || 0) - Number(b.period || 0));
    return sameDay.length ? sameDay : myTimetable.slice(0, 4);
  }, [myTimetable, todayName]);

  const attendancePercentage = useMemo(() => {
    if (!myAttendance.length) return 0;
    const attended = myAttendance.filter((item) =>
      ["present", "late"].includes(String(item.status || "").toLowerCase())
    ).length;
    return Math.round((attended / myAttendance.length) * 100);
  }, [myAttendance]);

  const classesNeeded = useMemo(() => {
    if (!myAttendance.length || attendancePercentage >= 75) return 0;
    let attended = myAttendance.filter((item) =>
      ["present", "late"].includes(String(item.status || "").toLowerCase())
    ).length;
    let total = myAttendance.length;
    let needed = 0;
    while (needed < 200 && (attended / total) * 100 < 75) {
      attended += 1;
      total += 1;
      needed += 1;
    }
    return needed;
  }, [attendancePercentage, myAttendance]);

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
      myResults
        .filter((item) => item.published !== false)
        .slice(0, 4),
    [myResults]
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

  if (loading) {
    return (
      <div className="flex min-h-[520px] items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-500 shadow-sm">
          <RefreshCw size={18} className="animate-spin" />
          Loading student dashboard...
        </div>
      </div>
    );
  }

  const firstName = String(myStudent?.name || loggedUser?.name || "Student").split(" ")[0];

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-5">
      <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">Student workspace</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Welcome back, {firstName}!</h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">Here’s your academic overview.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold">{course}</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold">Semester {semester}</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold">Section {section}</span>
            <button
              type="button"
              onClick={() => loadDashboard(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[11px] font-bold hover:bg-white/15 disabled:opacity-50"
            >
              <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [ClipboardCheck, "Attendance", attendancePercentage + "%", attendancePercentage >= 75 ? "Good standing" : "Needs attention", attendancePercentage >= 75 ? "emerald" : "amber"],
          [ClipboardList, "Pending assignments", upcomingAssignments.length, "Upcoming submissions", "amber"],
          [CalendarDays, "Upcoming exams", upcomingExams.length, "Next academic events", "violet"],
          [Trophy, "Published results", myResults.length, "Available result records", "blue"],
        ].map(([Icon, label, value, helper, tone]) => {
          const toneClass = {
            emerald: "bg-emerald-50 text-emerald-700",
            amber: "bg-amber-50 text-amber-700",
            violet: "bg-violet-50 text-violet-700",
            blue: "bg-blue-50 text-blue-700",
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

      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-950">Today’s timetable</h2>
              <p className="mt-1 text-xs text-slate-500">{todayName} • Your classes at a glance.</p>
            </div>
            <button type="button" onClick={() => onNavigate?.("timetable")} className="text-xs font-bold text-blue-700">
              View all
            </button>
          </div>

          <div className="mt-5 overflow-hidden rounded-xl border border-slate-100">
            {todayClasses.length ? todayClasses.map((item, index) => (
              <div key={item._id || index} className="grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-slate-100 px-4 py-3 last:border-0">
                <span className="w-16 text-[11px] font-bold text-slate-500">{item.time || "Period " + (item.period || "—")}</span>
                <div className="min-w-0 border-l-2 border-blue-500 pl-3">
                  <p className="truncate text-sm font-bold text-slate-900">{item.subject || "Class"}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">{item.faculty || "Faculty"}{item.room ? " • Room " + item.room : ""}</p>
                </div>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700">
                  {item.room || "Scheduled"}
                </span>
              </div>
            )) : (
              <div className="p-10 text-center text-sm text-slate-500">No classes scheduled.</div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-950">Attendance overview</h2>
              <p className="mt-1 text-xs text-slate-500">Your current attendance health.</p>
            </div>
            <button type="button" onClick={() => onNavigate?.("attendance")} className="text-xs font-bold text-emerald-700">Details</button>
          </div>

          <div className="mt-6 flex items-center justify-center">
            <div
              className="flex h-40 w-40 items-center justify-center rounded-full"
              style={{ background: "conic-gradient(#10b981 " + attendancePercentage + "%, #e2e8f0 " + attendancePercentage + "% 100%)" }}
            >
              <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white">
                <span className="text-3xl font-black text-slate-950">{attendancePercentage}%</span>
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Present</span>
              </div>
            </div>
          </div>

          <div className={"mt-5 flex items-start gap-3 rounded-xl border p-3 " + (attendancePercentage >= 75 ? "border-emerald-100 bg-emerald-50" : "border-amber-100 bg-amber-50")}>
            {attendancePercentage >= 75 ? (
              <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-600" />
            ) : (
              <AlertTriangle size={17} className="mt-0.5 shrink-0 text-amber-600" />
            )}
            <div>
              <p className="text-xs font-bold text-slate-900">
                {attendancePercentage >= 75 ? "You are in good standing" : "Attendance needs attention"}
              </p>
              <p className="mt-1 text-[11px] leading-5 text-slate-500">
                {attendancePercentage >= 75
                  ? "Keep attending regularly to maintain a safe margin."
                  : "Attend your next " + classesNeeded + " class(es) to reach 75% based on current records."}
              </p>
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-base font-black text-slate-950">Upcoming assignments</h2>
              <p className="mt-1 text-xs text-slate-500">Keep track of your next submissions.</p>
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
                <span className="whitespace-nowrap text-xs font-semibold text-slate-500">Due {formatDate(item.dueDate)}</span>
                <span className="rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-600">Not submitted</span>
              </div>
            )) : (
              <div className="px-5 py-12 text-center text-sm text-slate-500">No upcoming assignments.</div>
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-base font-black text-slate-950">Upcoming exams</h2>
              <p className="mt-1 text-xs text-slate-500">Next scheduled exams.</p>
            </div>
            <FileText size={18} className="text-violet-600" />
          </div>

          <div className="divide-y divide-slate-100">
            {upcomingExams.length ? upcomingExams.map((exam, index) => (
              <div key={exam._id || index} className="flex items-center gap-3 px-5 py-4">
                <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                  <span className="text-[9px] font-black uppercase">{exam.date ? new Date(exam.date).toLocaleDateString("en-IN", { month: "short" }) : "—"}</span>
                  <span className="text-lg font-black leading-none">{exam.date ? new Date(exam.date).getDate() : "—"}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-slate-900">{exam.name || "Examination"}</p>
                  <p className="mt-1 text-[11px] text-slate-500">{exam.course || course} • Sem {exam.semester || semester}</p>
                </div>
              </div>
            )) : (
              <div className="px-5 py-10 text-center text-sm text-slate-500">No upcoming exams.</div>
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-base font-black text-slate-950">Recent results</h2>
              <p className="mt-1 text-xs text-slate-500">Your latest published result records.</p>
            </div>
            <button type="button" onClick={() => onNavigate?.("exams")} className="text-xs font-bold text-blue-700">View results</button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentResults.length ? recentResults.map((result, index) => (
              <div key={result._id || index} className="flex items-center gap-3 px-5 py-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                  <Trophy size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900">{result.subject || "Subject"}</p>
                  <p className="mt-1 text-[11px] text-slate-500">Semester {result.semester || semester}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-700">{result.grade || result.marks || "—"}</span>
              </div>
            )) : (
              <div className="px-5 py-10 text-center text-sm text-slate-500">No published results available.</div>
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-base font-black text-slate-950">Announcements</h2>
              <p className="mt-1 text-xs text-slate-500">Latest college updates.</p>
            </div>
            <Bell size={18} className="text-slate-400" />
          </div>

          <div className="divide-y divide-slate-100">
            {recentNotices.length ? recentNotices.map((notice, index) => (
              <button key={notice._id || index} type="button" onClick={() => onNavigate?.("notices")} className="flex w-full items-start gap-3 px-5 py-4 text-left hover:bg-slate-50">
                <Bell size={15} className="mt-0.5 shrink-0 text-emerald-600" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-slate-900">{notice.title || "Notice"}</p>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-slate-500">{notice.message || notice.description || "Announcement available."}</p>
                </div>
              </button>
            )) : (
              <div className="px-5 py-10 text-center text-sm text-slate-500">No announcements available.</div>
            )}
          </div>
        </section>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <BookOpen size={18} className="text-blue-600" />
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-900">Stay on track</p>
          <p className="mt-1 text-xs text-slate-500">
            Check your timetable before class and review assignment deadlines regularly.
          </p>
        </div>
        <ArrowRight size={16} className="text-slate-300" />
      </div>
    </div>
  );
}
