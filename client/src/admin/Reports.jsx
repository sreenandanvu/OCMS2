import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  FileText,
  Printer,
  RefreshCw,
  Search,
  TrendingUp,
  Users,
  AlertTriangle,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { get } from "../services/api";
import Loading from "../components/Loading";
import ErrorBox from "../components/ErrorBox";
import Empty from "../components/Empty";

const ITEMS_PER_PAGE = 7;

export default function Reports() {
  const [attendance, setAttendance] = useState([]);
  const [examinations, setExaminations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [attendancePage, setAttendancePage] =
    useState(1);

  const [examPage, setExamPage] = useState(1);

  const [activeReport, setActiveReport] =
    useState("attendance");

  // ==========================================================
  // LOAD REPORT DATA
  // ==========================================================

  async function loadReports() {
    try {
      setLoading(true);
      setError("");

      const [
        attendanceResponse,
        examResponse,
      ] = await Promise.all([
        get("/attendance"),
        get("/exams"),
      ]);

      const attendanceData =
        Array.isArray(attendanceResponse)
          ? attendanceResponse
          : attendanceResponse.attendance ||
            attendanceResponse.data ||
            [];

      const examData =
        Array.isArray(examResponse)
          ? examResponse
          : examResponse.exams ||
            examResponse.examinations ||
            examResponse.data ||
            [];

      setAttendance(attendanceData);
      setExaminations(examData);

      setAttendancePage(1);
      setExamPage(1);
    } catch (err) {
      setError(
        err.message ||
          "Unable to load reporting data."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  // ==========================================================
  // ATTENDANCE REPORT
  // ==========================================================

  const attendanceReport = useMemo(() => {
    const map = new Map();

    attendance.forEach((record) => {
      const key =
        record.rollNo ||
        record.studentId ||
        record.student ||
        record.studentName;

      if (!key) return;

      if (!map.has(key)) {
        map.set(key, {
          key,

          name:
            record.studentName ||
            record.student ||
            "Unknown Student",

          rollNo:
            record.rollNo || "-",

          course:
            record.course || "-",

          semester:
            record.semester ?? "-",

          section:
            record.section || "-",

          total: 0,

          present: 0,

          absent: 0,

          late: 0,

          excused: 0,
        });
      }

      const student = map.get(key);

      student.total += 1;

      const status = String(
        record.status || ""
      ).toLowerCase();

      if (status === "present") {
        student.present += 1;
      } else if (status === "absent") {
        student.absent += 1;
      } else if (status === "late") {
        student.late += 1;
      } else if (status === "excused") {
        student.excused += 1;
      }
    });

    return [...map.values()]
      .map((student) => ({
        ...student,

        percentage:
          student.total > 0
            ? Math.round(
                (student.present /
                  student.total) *
                  100
              )
            : 0,
      }))
      .sort((a, b) =>
        a.name.localeCompare(b.name)
      );
  }, [attendance]);

  // ==========================================================
  // EXAMINATION REPORT
  // ==========================================================

  const examinationReport = useMemo(() => {
    const map = new Map();

    examinations.forEach((exam) => {
      const key =
        exam.subject ||
        exam.name ||
        exam._id ||
        exam.id;

      if (!map.has(key)) {
        map.set(key, {
          key,

          subject:
            exam.subject ||
            exam.name ||
            "Examination",

          course:
            exam.course || "-",

          semester:
            exam.semester ?? "-",

          date:
            exam.date || "-",

          status:
            exam.status || "Scheduled",

          marks: [],
        });
      }

      const report = map.get(key);

      const mark =
        exam.marks ??
        exam.averageMarks ??
        exam.average;

      if (
        mark !== undefined &&
        mark !== null &&
        !Number.isNaN(Number(mark))
      ) {
        report.marks.push(Number(mark));
      }
    });

    return [...map.values()];
  }, [examinations]);

  // ==========================================================
  // SEARCH
  // ==========================================================

  const filteredAttendance = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    if (!query) {
      return attendanceReport;
    }

    return attendanceReport.filter(
      (item) =>
        [
          item.name,
          item.rollNo,
          item.course,
          item.semester,
          item.section,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query)
    );
  }, [
    attendanceReport,
    search,
  ]);

  const filteredExaminations =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      if (!query) {
        return examinationReport;
      }

      return examinationReport.filter(
        (item) =>
          [
            item.subject,
            item.course,
            item.semester,
            item.status,
          ]
            .join(" ")
            .toLowerCase()
            .includes(query)
      );
    }, [
      examinationReport,
      search,
    ]);

  function handleSearch(value) {
    setSearch(value);
    setAttendancePage(1);
    setExamPage(1);
  }

  // ==========================================================
  // PAGINATION
  // ==========================================================

  const attendancePages = Math.max(
    1,
    Math.ceil(
      filteredAttendance.length /
        ITEMS_PER_PAGE
    )
  );

  const examPages = Math.max(
    1,
    Math.ceil(
      filteredExaminations.length /
        ITEMS_PER_PAGE
    )
  );

  const paginatedAttendance =
    filteredAttendance.slice(
      (attendancePage - 1) *
        ITEMS_PER_PAGE,
      attendancePage *
        ITEMS_PER_PAGE
    );

  const paginatedExaminations =
    filteredExaminations.slice(
      (examPage - 1) *
        ITEMS_PER_PAGE,
      examPage *
        ITEMS_PER_PAGE
    );

  // ==========================================================
  // STATISTICS
  // ==========================================================

  const averageAttendance = useMemo(() => {
    if (!attendanceReport.length) {
      return 0;
    }

    const total =
      attendanceReport.reduce(
        (sum, item) =>
          sum + item.percentage,
        0
      );

    return Math.round(
      total / attendanceReport.length
    );
  }, [attendanceReport]);

  const excellentAttendance =
    attendanceReport.filter(
      (item) => item.percentage >= 85
    ).length;

  const goodAttendance =
    attendanceReport.filter(
      (item) =>
        item.percentage >= 75 &&
        item.percentage < 85
    ).length;

  const atRiskAttendance =
    attendanceReport.filter(
      (item) => item.percentage < 75
    ).length;

  const totalStudents =
    attendanceReport.length;

  const totalAttendanceRecords =
    attendance.length;

  const totalExaminations =
    examinations.length;

  const courses = useMemo(() => {
    return new Set(
      examinations
        .map((item) => item.course)
        .filter(Boolean)
    ).size;
  }, [examinations]);

  // ==========================================================
  // PRINT
  // ==========================================================

  function handlePrint() {
    window.print();
  }

  // ==========================================================
  // ATTENDANCE STATUS
  // ==========================================================

  function getAttendanceStatus(
    percentage
  ) {
    if (percentage >= 85) {
      return {
        label: "Excellent",
        className:
          "bg-emerald-50 text-emerald-700 border-emerald-200",
        bar:
          "bg-emerald-500",
      };
    }

    if (percentage >= 75) {
      return {
        label: "Good",
        className:
          "bg-blue-50 text-blue-700 border-blue-200",
        bar:
          "bg-blue-500",
      };
    }

    if (percentage >= 60) {
      return {
        label: "Warning",
        className:
          "bg-amber-50 text-amber-700 border-amber-200",
        bar:
          "bg-amber-500",
      };
    }

    return {
      label: "At Risk",
      className:
        "bg-red-50 text-red-700 border-red-200",
      bar:
        "bg-red-500",
    };
  }

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="p-6">
        <Loading message="Loading reports..." />
      </div>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (error) {
    return (
      <div className="p-6">
        <ErrorBox
          message={error}
          onRetry={loadReports}
        />
      </div>
    );
  }

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="space-y-6 print:space-y-4">

      {/* ======================================================
          HEADER
      ======================================================= */}

      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 p-6 text-white shadow-lg print:bg-slate-900">

        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

          <div className="flex items-start gap-4">

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
              <BarChart3 size={25} />
            </div>

            <div>
              <p className="text-xs font-semibold tracking-widest text-slate-300">
                ADMINISTRATION
              </p>

              <h2 className="mt-1 text-2xl font-bold">
                Reports & Analytics
              </h2>

              <p className="mt-1 max-w-xl text-sm text-slate-300">
                Monitor attendance, examinations and
                academic performance from one place.
              </p>
            </div>

          </div>

          <div className="flex gap-2">

            <button
              type="button"
              onClick={loadReports}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20 print:hidden"
            >
              <RefreshCw size={16} />
              Refresh
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100 print:hidden"
            >
              <Printer size={16} />
              Print
            </button>

          </div>

        </div>
      </div>

      {/* ======================================================
          KPI CARDS
      ======================================================= */}

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">

        <ReportCard
          icon={TrendingUp}
          label="Average Attendance"
          value={`${averageAttendance}%`}
          description="Across recorded students"
        />

        <ReportCard
          icon={Users}
          label="Students"
          value={totalStudents}
          description="With attendance records"
        />

        <ReportCard
          icon={BookOpen}
          label="Courses"
          value={courses}
          description="In examination records"
        />

        <ReportCard
          icon={ClipboardList}
          label="Examinations"
          value={totalExaminations}
          description={`${totalAttendanceRecords} attendance records`}
        />

      </div>

      {/* ======================================================
          ATTENDANCE OVERVIEW
      ======================================================= */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* Overall */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">

          <div className="flex items-center justify-between">

            <div>
              <h3 className="text-base font-bold text-slate-900">
                Attendance Overview
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Current attendance health across students.
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <CalendarCheck size={19} />
            </div>

          </div>

          <div className="mt-6">

            <div className="flex items-end justify-between">

              <div>
                <p className="text-4xl font-bold text-slate-900">
                  {averageAttendance}%
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Average attendance
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs text-slate-400">
                  Target
                </p>

                <p className="text-lg font-bold text-slate-700">
                  75%
                </p>
              </div>

            </div>

            <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">

              <div
                className={`h-full rounded-full ${
                  averageAttendance >= 75
                    ? "bg-emerald-500"
                    : "bg-red-500"
                }`}
                style={{
                  width: `${Math.min(
                    averageAttendance,
                    100
                  )}%`,
                }}
              />

            </div>

            <div className="mt-2 flex justify-between text-[11px] text-slate-400">
              <span>0%</span>
              <span>75% target</span>
              <span>100%</span>
            </div>

          </div>

          {/* Distribution */}

          <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3">

            <AttendanceCategory
              icon={CheckCircle2}
              label="Excellent"
              value={excellentAttendance}
              description="85% and above"
              className="text-emerald-600"
            />

            <AttendanceCategory
              icon={TrendingUp}
              label="Good"
              value={goodAttendance}
              description="75% – 84%"
              className="text-blue-600"
            />

            <AttendanceCategory
              icon={AlertTriangle}
              label="At Risk"
              value={atRiskAttendance}
              description="Below 75%"
              className="text-red-600"
            />

          </div>

        </div>

        {/* Report selector */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <h3 className="font-bold text-slate-900">
            Report Center
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            Choose the report you want to review.
          </p>

          <div className="mt-5 space-y-3">

            <ReportSelector
              active={
                activeReport ===
                "attendance"
              }
              icon={CalendarCheck}
              title="Attendance Report"
              description="Student attendance summary"
              onClick={() =>
                setActiveReport(
                  "attendance"
                )
              }
            />

            <ReportSelector
              active={
                activeReport ===
                "examinations"
              }
              icon={FileText}
              title="Examination Report"
              description="Examination overview"
              onClick={() =>
                setActiveReport(
                  "examinations"
                )
              }
            />

          </div>

          <div className="mt-5 rounded-xl bg-slate-50 p-4">

            <div className="flex items-start gap-3">

              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-600 shadow-sm">
                <BarChart3 size={15} />
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-700">
                  Reporting information
                </p>

                <p className="mt-1 text-[11px] leading-5 text-slate-500">
                  Reports are generated from the current
                  attendance and examination data stored in
                  the system.
                </p>
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* ======================================================
          SEARCH
      ======================================================= */}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm print:hidden">

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

          <div className="relative w-full md:max-w-xl">

            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                handleSearch(
                  e.target.value
                )
              }
              placeholder="Search student, roll number, course or subject..."
              className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-10 pr-10 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:bg-white focus:ring-4 focus:ring-slate-100"
            />

            {search && (
              <button
                type="button"
                onClick={() =>
                  handleSearch("")
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X size={17} />
              </button>
            )}

          </div>

          <div className="text-sm text-slate-500">
            Search results:
            <span className="ml-1 font-bold text-slate-800">
              {activeReport ===
              "attendance"
                ? filteredAttendance.length
                : filteredExaminations.length}
            </span>
          </div>

        </div>
      </div>

      {/* ======================================================
          ATTENDANCE TABLE
      ======================================================= */}

      {activeReport ===
        "attendance" && (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm">
                <CalendarCheck size={18} />
              </div>

              <div>
                <h3 className="font-bold text-slate-900">
                  Attendance Report
                </h3>

                <p className="mt-0.5 text-xs text-slate-500">
                  Student-wise attendance performance
                </p>
              </div>

            </div>

            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
              {filteredAttendance.length} students
            </span>

          </div>

          {paginatedAttendance.length ===
          0 ? (
            <div className="p-10">
              <Empty
                title="No attendance data"
                message={
                  search
                    ? "No students match your search."
                    : "No attendance records are available."
                }
              />
            </div>
          ) : (
            <>
              <table className="w-full table-fixed">

                <thead>
                  <tr className="border-b border-slate-200 bg-white">

                    <th className="w-[25%] px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Student
                    </th>

                    <th className="w-[14%] px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Roll No
                    </th>

                    <th className="w-[15%] px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Course
                    </th>

                    <th className="w-[12%] px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Sem
                    </th>

                    <th className="w-[19%] px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Progress
                    </th>

                    <th className="w-[15%] px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Status
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {paginatedAttendance.map(
                    (item) => {

                      const status =
                        getAttendanceStatus(
                          item.percentage
                        );

                      return (
                        <tr
                          key={item.key}
                          className="border-b border-slate-100 transition hover:bg-slate-50"
                        >

                          <td className="px-4 py-4">
                            <div className="flex min-w-0 items-center gap-3">

                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                                {getInitials(
                                  item.name
                                )}
                              </div>

                              <div className="min-w-0">
                                <p
                                  className="truncate text-sm font-semibold text-slate-900"
                                  title={item.name}
                                >
                                  {item.name}
                                </p>

                                <p className="text-[10px] text-slate-400">
                                  {item.present} present /{" "}
                                  {item.total} total
                                </p>
                              </div>

                            </div>
                          </td>

                          <td className="truncate px-3 py-4 text-xs font-medium text-slate-600">
                            {item.rollNo}
                          </td>

                          <td className="truncate px-3 py-4 text-xs text-slate-600">
                            {item.course}
                          </td>

                          <td className="px-3 py-4 text-xs text-slate-600">
                            {item.semester}
                          </td>

                          <td className="px-3 py-4">

                            <div className="flex items-center gap-2">

                              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                                <div
                                  className={`h-full rounded-full ${status.bar}`}
                                  style={{
                                    width: `${Math.min(
                                      item.percentage,
                                      100
                                    )}%`,
                                  }}
                                />
                              </div>

                              <span className="w-9 text-right text-xs font-bold text-slate-700">
                                {item.percentage}%
                              </span>

                            </div>

                          </td>

                          <td className="px-3 py-4">

                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${status.className}`}
                            >
                              {status.label}
                            </span>

                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

              <Pagination
                currentPage={
                  attendancePage
                }
                totalPages={
                  attendancePages
                }
                totalItems={
                  filteredAttendance.length
                }
                onPageChange={
                  setAttendancePage
                }
              />
            </>
          )}

        </section>
      )}

      {/* ======================================================
          EXAMINATION TABLE
      ======================================================= */}

      {activeReport ===
        "examinations" && (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm">
                <FileText size={18} />
              </div>

              <div>
                <h3 className="font-bold text-slate-900">
                  Examination Report
                </h3>

                <p className="mt-0.5 text-xs text-slate-500">
                  Examination schedule and performance data
                </p>
              </div>

            </div>

            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
              {filteredExaminations.length} examinations
            </span>

          </div>

          {paginatedExaminations.length ===
          0 ? (
            <div className="p-10">
              <Empty
                title="No examination data"
                message={
                  search
                    ? "No examinations match your search."
                    : "No examination records are available."
                }
              />
            </div>
          ) : (
            <>
              <table className="w-full table-fixed">

                <thead>
                  <tr className="border-b border-slate-200 bg-white">

                    <th className="w-[30%] px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Examination
                    </th>

                    <th className="w-[18%] px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Course
                    </th>

                    <th className="w-[12%] px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Sem
                    </th>

                    <th className="w-[17%] px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Date
                    </th>

                    <th className="w-[13%] px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Status
                    </th>

                    <th className="w-[10%] px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Average
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {paginatedExaminations.map(
                    (item) => {

                      const average =
                        item.marks &&
                        item.marks.length
                          ? Math.round(
                              item.marks.reduce(
                                (
                                  sum,
                                  mark
                                ) =>
                                  sum +
                                  mark,
                                0
                              ) /
                                item.marks
                                  .length
                            )
                          : null;

                      return (
                        <tr
                          key={item.key}
                          className="border-b border-slate-100 transition hover:bg-slate-50"
                        >

                          <td className="px-4 py-4">

                            <div className="flex min-w-0 items-center gap-3">

                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                                <FileText size={15} />
                              </div>

                              <div className="min-w-0">
                                <p
                                  className="truncate text-sm font-semibold text-slate-900"
                                  title={
                                    item.subject
                                  }
                                >
                                  {item.subject}
                                </p>

                                <p className="text-[10px] text-slate-400">
                                  Examination
                                </p>
                              </div>

                            </div>

                          </td>

                          <td className="truncate px-3 py-4 text-xs text-slate-600">
                            {item.course}
                          </td>

                          <td className="px-3 py-4 text-xs text-slate-600">
                            {item.semester}
                          </td>

                          <td className="truncate px-3 py-4 text-xs text-slate-600">
                            {item.date}
                          </td>

                          <td className="px-3 py-4">

                            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-700">
                              {item.status}
                            </span>

                          </td>

                          <td className="px-3 py-4 text-xs font-bold text-slate-800">

                            {average !== null
                              ? `${average}%`
                              : "N/A"}

                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

              <Pagination
                currentPage={examPage}
                totalPages={examPages}
                totalItems={
                  filteredExaminations.length
                }
                onPageChange={
                  setExamPage
                }
              />
            </>
          )}

        </section>
      )}

    </div>
  );
}

// ============================================================
// REPORT CARD
// ============================================================

function ReportCard({
  icon: Icon,
  label,
  value,
  description,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

      <div className="flex items-start justify-between">

        <div className="min-w-0">

          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {value}
          </p>

          <p className="mt-1 truncate text-xs text-slate-400">
            {description}
          </p>

        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
          <Icon size={19} />
        </div>

      </div>

    </div>
  );
}

// ============================================================
// ATTENDANCE CATEGORY
// ============================================================

function AttendanceCategory({
  icon: Icon,
  label,
  value,
  description,
  className,
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

      <div className="flex items-center justify-between">

        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm ${className}`}
        >
          <Icon size={15} />
        </div>

        <span className="text-xl font-bold text-slate-900">
          {value}
        </span>

      </div>

      <p className="mt-3 text-xs font-bold text-slate-700">
        {label}
      </p>

      <p className="mt-0.5 text-[10px] text-slate-400">
        {description}
      </p>

    </div>
  );
}

// ============================================================
// REPORT SELECTOR
// ============================================================

function ReportSelector({
  active,
  icon: Icon,
  title,
  description,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "flex w-full items-center gap-3 rounded-xl bg-slate-900 p-4 text-left text-white shadow-sm"
          : "flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:bg-slate-50"
      }
    >

      <div
        className={
          active
            ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10"
            : "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600"
        }
      >
        <Icon size={16} />
      </div>

      <div className="min-w-0">

        <p
          className={
            active
              ? "text-sm font-bold"
              : "text-sm font-bold text-slate-800"
          }
        >
          {title}
        </p>

        <p
          className={
            active
              ? "mt-0.5 truncate text-[10px] text-slate-300"
              : "mt-0.5 truncate text-[10px] text-slate-400"
          }
        >
          {description}
        </p>

      </div>

    </button>
  );
}

// ============================================================
// PAGINATION
// ============================================================

function Pagination({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}) {
  const start =
    (currentPage - 1) *
      ITEMS_PER_PAGE +
    1;

  const end = Math.min(
    currentPage * ITEMS_PER_PAGE,
    totalItems
  );

  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">

      <p className="text-xs text-slate-500">
        Showing{" "}
        <span className="font-semibold text-slate-700">
          {start}
        </span>{" "}
        to{" "}
        <span className="font-semibold text-slate-700">
          {end}
        </span>{" "}
        of{" "}
        <span className="font-semibold text-slate-700">
          {totalItems}
        </span>
      </p>

      <div className="flex items-center gap-1">

        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() =>
            onPageChange(
              Math.max(
                1,
                currentPage - 1
              )
            )
          }
          className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={14} />
          Previous
        </button>

        <div className="hidden items-center gap-1 sm:flex">

          {Array.from(
            {
              length: totalPages,
            },
            (_, index) =>
              index + 1
          ).map((number) => (
            <button
              type="button"
              key={number}
              onClick={() =>
                onPageChange(number)
              }
              className={
                number === currentPage
                  ? "h-8 min-w-8 rounded-lg bg-slate-900 px-2 text-xs font-bold text-white"
                  : "h-8 min-w-8 rounded-lg border border-slate-200 px-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              }
            >
              {number}
            </button>
          ))}

        </div>

        <span className="px-2 text-xs text-slate-500 sm:hidden">
          {currentPage} / {totalPages}
        </span>

        <button
          type="button"
          disabled={
            currentPage ===
            totalPages
          }
          onClick={() =>
            onPageChange(
              Math.min(
                totalPages,
                currentPage + 1
              )
            )
          }
          className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
          <ChevronRight size={14} />
        </button>

      </div>
    </div>
  );
}

// ============================================================
// INITIALS
// ============================================================

function getInitials(name) {
  return String(name || "Student")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) =>
      part.charAt(0).toUpperCase()
    )
    .join("");
}