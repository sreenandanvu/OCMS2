import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
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
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

function StatCard({ icon: Icon, label, value, helper, tone }) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-700",
    blue: "bg-blue-50 text-blue-700",
    violet: "bg-violet-50 text-violet-700",
    amber: "bg-amber-50 text-amber-700",
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={\`flex h-11 w-11 items-center justify-center rounded-xl \${tones[tone]}\`}>
        <Icon size={20} />
      </div>
      <p className="mt-5 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p className="mt-1 text-3xl font-black tracking-tight text-slate-950">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{helper}</p>
    </div>
  );
}

export default function Dashboard({ onNavigate }) {
  const loggedUser = getLoggedUser();
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadDashboard(isRefresh = false) {
    isRefresh ? setRefreshing(true) : setLoading(true);

    const requests = await Promise.allSettled([
      get("/students"),
      get("/attendance"),
      get("/assignments"),
      get("/exams"),
      get("/results"),
      get("/notices"),
    ]);

    const [studentResult, attendanceResult, assignmentResult, examResult, resultResult, noticeResult] = requests;

    if (studentResult.status === "fulfilled") {
      const data = studentResult.value;
      setStudents(Array.isArray(data) ? data : data?.students || data?.data || []);
    }
    if (attendanceResult.status === "fulfilled") {
      const data = attendanceResult.value;
      setAttendance(Array.isArray(data) ? data : data?.attendance || data?.records || data?.data || []);
    }
    if (assignmentResult.status === "fulfilled") {
      const data = assignmentResult.value;
      setAssignments(Array.isArray(data) ? data : data?.assignments || data?.data || []);
    }
    if (examResult.status === "fulfilled") {
      const data = examResult.value;
      setExams(Array.isArray(data) ? data : data?.exams || data?.data || []);
    }
    if (resultResult.status === "fulfilled") {
      const data = resultResult.value;
      setResults(Array.isArray(data) ? data : data?.results || data?.data || []);
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

  const myStudent = useMemo(() => {
    if (!students.length) return null;
    return (
      students.find((item) => item.email === loggedUser?.email) ||
      students.find((item) => item.rollNo === loggedUser?.rollNo) ||
      students[0]
    );
  }, [students, loggedUser]);

  const myAttendance = useMemo(() => {
    if (!attendance.length) return [];
    const roll = myStudent?.rollNo;
    const email = myStudent?.email;
    const id = myStudent?._id;
    const filtered = attendance.filter((item) => {
      if (id && String(item.student?._id || item.student || "") === String(id)) return true;
      if (roll && String(item.rollNo || "") === String(roll)) return true;
      if (email && String(item.studentEmail || "") === String(email)) return true;
      if (myStudent?.name && String(item.studentName || "").toLowerCase() === String(myStudent.name).toLowerCase()) return true;
      return students.length <= 1;
    });
    return filtered;
  }, [attendance, myStudent, students.length]);

  const myResults = useMemo(() => {
    if (!results.length) return [];
    const roll = myStudent?.rollNo;
    const id = myStudent?._id;
    const filtered = results.filter((item) => {
      if (id && String(item.student?._id || item.student || "") === String(id)) return true;
      if (roll && String(item.rollNo || "") === String(roll)) return true;
      if (myStudent?.name && String(item.studentName || "").toLowerCase() === String(myStudent.name).toLowerCase()) return true;
      return students.length <= 1;
    });
    return filtered;
  }, [results, myStudent, students.length]);

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
    let classes = 0;
    while (total && (attended / total) * 100 < 75 && classes < 200) {
      attended += 1;
      total += 1;
      classes += 1;
    }
    return classes;
  }, [attendancePercentage, myAttendance]);

  const upcomingAssignments = useMemo(() => {
    return [...assignments]
      .filter((item) => item.dueDate)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 4);
  }, [assignments]);

  const upcomingExams = useMemo(() => {
    return [...exams]
      .filter((item) => item.date)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 4);
  }, [exams]);

  const recentResults = useMemo(() => myResults.slice(0, 4), [myResults]);

  const recentNotices = useMemo(() => {
    return [...notices]
      .sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0))
      .slice(0, 3);
  }, [notices]);

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[520px] max-w-[1450px] items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-500 shadow-sm">
          <RefreshCw size={18} className="animate-spin" />
          Loading student workspace...
        </div>
      </div>
    );
  }

  const studentName = myStudent?.name || loggedUser?.name || "Student";
  const course = myStudent?.course || loggedUser?.course || "MCA";
  const semester = myStudent?.semester || loggedUser?.semester || 1;
  const section = myStudent?.section || loggedUser?.section || "A";

  return (
    <div className="mx-auto w-full max-w-[1450px] space-y-6">
      <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl sm:p-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">Student Portal</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Good morning, {studentName.split(" ")[0]} 👋</h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">Everything you need for today’s academic routine, in one place.</p>
          </div>
          <button
            type="button"
            onClick={() => loadDashboard(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 self-start rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/15 disabled:opacity-50 lg:self-auto"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold">{course}</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold">Semester {semester}</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold">Section {section}</span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={ClipboardCheck} label="My attendance" value={\`\${attendancePercentage}%\`} helper={attendancePercentage >= 75 ? "Above the 75% threshold" : \`\${classesNeeded} more attended class(es) to reach 75%\`} tone={attendancePercentage >= 75 ? "emerald" : "amber"} />
        <StatCard icon={ClipboardList} label="Assignments" value={assignments.length} helper="Available in your workspace" tone="violet" />
        <StatCard icon={CalendarDays} label="Upcoming exams" value={upcomingExams.length} helper="Scheduled academic events" tone="blue" />
        <StatCard icon={Trophy} label="Results" value={myResults.length} helper="Published/available records" tone="amber" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-950">Attendance health</h2>
              <p className="mt-1 text-xs text-slate-500">Keep your attendance comfortably above the required threshold.</p>
            </div>
            <button type="button" onClick={() => onNavigate?.("attendance")} className="text-xs font-bold text-emerald-700">
              View details
            </button>
          </div>

          <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="relative flex h-36 w-36 shrink-0 items-center justify-center rounded-full border-[12px] border-slate-100">
              <div className="absolute inset-[-12px] rounded-full border-[12px] border-emerald-500 border-l-transparent border-b-transparent" style={{ transform: \`rotate(\${Math.min(360, Math.max(0, attendancePercentage * 3.6))}deg)\` }} />
              <div className="text-center">
                <p className="text-3xl font-black text-slate-950">{attendancePercentage}%</p>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Overall</p>
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className={\`rounded-xl border p-4 \${attendancePercentage >= 75 ? "border-emerald-100 bg-emerald-50" : "border-amber-100 bg-amber-50"}\`}>
                <div className="flex items-start gap-3">
                  {attendancePercentage >= 75 ? (
                    <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={18} />
                  ) : (
                    <AlertTriangle className="mt-0.5 shrink-0 text-amber-600" size={18} />
                  )}
                  <div>
                    <p className="text-sm font-bold text-slate-900">{attendancePercentage >= 75 ? "You are on track" : "Attendance needs attention"}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {attendancePercentage >= 75
                        ? "Keep attending regularly to maintain a safe attendance margin."
                        : \`Attend your next \${classesNeeded} class(es) to reach the 75% threshold, based on current records.\`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-lg font-black text-slate-950">Upcoming exams</h2>
              <p className="mt-1 text-xs text-slate-500">Your next scheduled academic events.</p>
            </div>
            <CalendarDays size={18} className="text-blue-600" />
          </div>
          <div className="divide-y divide-slate-100">
            {upcomingExams.length ? upcomingExams.map((exam, index) => (
              <div key={exam._id || index} className="flex items-center gap-3 px-5 py-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                  <FileText size={17} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900">{exam.name || "Examination"}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatDate(exam.date)} • Sem {exam.semester || semester}</p>
                </div>
              </div>
            )) : (
              <div className="px-5 py-10 text-center text-sm text-slate-500">No upcoming examinations.</div>
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-lg font-black text-slate-950">Assignments</h2>
              <p className="mt-1 text-xs text-slate-500">Stay ahead of your next submissions.</p>
            </div>
            <button type="button" onClick={() => onNavigate?.("assignments")} className="text-xs font-bold text-violet-700">View all</button>
          </div>
          <div className="divide-y divide-slate-100">
            {upcomingAssignments.length ? upcomingAssignments.map((item, index) => (
              <div key={item._id || index} className="flex items-center gap-3 px-5 py-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                  <ClipboardList size={17} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900">{item.title || "Assignment"}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.subject || "Subject"} • Due {formatDate(item.dueDate)}</p>
                </div>
                <Clock3 size={15} className="text-slate-300" />
              </div>
            )) : (
              <div className="px-5 py-10 text-center text-sm text-slate-500">No upcoming assignments.</div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-lg font-black text-slate-950">Recent results</h2>
            <p className="mt-1 text-xs text-slate-500">Your latest available academic results.</p>
          </div>
          <div className="divide-y divide-slate-100">
            {recentResults.length ? recentResults.map((result, index) => (
              <div key={result._id || index} className="flex items-center gap-3 px-5 py-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                  <Trophy size={17} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900">{result.subject || "Subject"}</p>
                  <p className="mt-1 text-xs text-slate-500">Semester {result.semester || semester}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-700">{result.grade || result.marks || "—"}</span>
              </div>
            )) : (
              <div className="px-5 py-10 text-center text-sm text-slate-500">No student results available yet.</div>
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-lg font-black text-slate-950">Announcements</h2>
              <p className="mt-1 text-xs text-slate-500">Latest college communication.</p>
            </div>
            <Bell size={18} className="text-slate-400" />
          </div>
          <div className="divide-y divide-slate-100">
            {recentNotices.length ? recentNotices.map((notice, index) => (
              <div key={notice._id || index} className="flex items-start gap-3 px-5 py-4">
                <Bell size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900">{notice.title || "Notice"}</p>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{notice.message || notice.description || "Announcement available."}</p>
                </div>
              </div>
            )) : (
              <div className="px-5 py-10 text-center text-sm text-slate-500">No announcements available.</div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-lg font-black text-slate-950">Student snapshot</h2>
              <p className="mt-1 text-xs text-slate-500">Your academic identity inside OCMS.</p>
            </div>
            <BookOpen size={18} className="text-slate-400" />
          </div>
          <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
            {[
              ["Course", course],
              ["Semester", semester],
              ["Section", section],
              ["Roll No.", myStudent?.rollNo || "—"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-slate-50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
                <p className="mt-1 truncate text-sm font-black text-slate-900">{value}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <CalendarDays size={18} className="text-slate-500" />
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-900">Your next step</p>
          <p className="mt-1 text-xs text-slate-500">Check your timetable before your next class and keep an eye on upcoming assignment deadlines.</p>
        </div>
        <span className="hidden rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600 sm:inline-flex">Stay on track</span>
      </div>
    </div>
  );
}
