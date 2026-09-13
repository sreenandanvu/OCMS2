import React, { useEffect, useMemo, useState } from "react";
import { get, post } from "../services/api";
import { QRCodeSVG } from "qrcode.react";
import Loading from "../components/Loading";
import ErrorBox from "../components/ErrorBox";
import Empty from "../components/Empty";

const PAGE_SIZE = 7;

const EMPTY_FORM = {
  student: "",
  date: new Date().toISOString().slice(0, 10),
  subject: "Web Technologies",
  course: "MCA",
  semester: "1",
  section: "A",
  period: "1",
  status: "Present",
};

const SUBJECTS = [
  "Web Technologies",
  "Data Structures",
  "Advanced DBMS",
  "Discrete Mathematics",
];

const COURSES = ["MCA", "MBA", "BCA"];

const SEMESTERS = ["1", "2", "3", "4", "5", "6"];

const SECTIONS = ["A", "B", "C"];

export default function Attendance() {
  const [students, setStudents] = useState([]);
  const [records, setRecords] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState(EMPTY_FORM);

  const [qrSession, setQrSession] = useState(null);

  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] =
    useState("");
  const [semesterFilter, setSemesterFilter] =
    useState("");
  const [sectionFilter, setSectionFilter] =
    useState("");

  const [historySearch, setHistorySearch] =
    useState("");

  const [page, setPage] = useState(1);
  const [historyPage, setHistoryPage] =
    useState(1);

  const [activeTab, setActiveTab] =
    useState("take");

  async function loadAttendance() {
    setLoading(true);
    setError("");

    try {
      const [studentsResponse, attendanceResponse] =
        await Promise.all([
          get("/students"),
          get("/attendance"),
        ]);

      const studentsData =
        Array.isArray(studentsResponse)
          ? studentsResponse
          : studentsResponse.students ||
            studentsResponse.data ||
            [];

      const attendanceData =
        Array.isArray(attendanceResponse)
          ? attendanceResponse
          : attendanceResponse.attendance ||
            attendanceResponse.data ||
            [];

      setStudents(studentsData);
      setRecords(attendanceData);
    } catch (err) {
      setError(
        err.message ||
          "Unable to load attendance data."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAttendance();
  }, []);

  /*
   * -----------------------------------------
   * Student attendance statistics
   * -----------------------------------------
   */

  const studentStats = useMemo(() => {
    const map = new Map();

    students.forEach((student) => {
      const id =
        student._id ||
        student.id ||
        student.registerNo ||
        student.rollNo;

      if (!id) return;

      map.set(String(id), {
        total: 0,
        present: 0,
      });
    });

    records.forEach((record) => {
      const studentId =
        record.studentId ||
        record.student?._id ||
        record.student?.id;

      const rollNo =
        record.rollNo ||
        record.student?.rollNo ||
        record.student?.registerNo;

      const key =
        studentId ||
        rollNo ||
        record.student;

      if (!key) return;

      const normalized = String(key);

      if (!map.has(normalized)) {
        map.set(normalized, {
          total: 0,
          present: 0,
        });
      }

      const stats = map.get(normalized);

      stats.total += 1;

      if (
        String(record.status).toLowerCase() ===
        "present"
      ) {
        stats.present += 1;
      }
    });

    return map;
  }, [students, records]);

  function getStudentId(student) {
    return (
      student?._id ||
      student?.id ||
      student?.registerNo ||
      student?.rollNo ||
      ""
    );
  }

  function getStudentName(student) {
    return (
      student?.name ||
      student?.studentName ||
      "Unknown Student"
    );
  }

  function getStudentRoll(student) {
    return (
      student?.rollNo ||
      student?.registerNo ||
      student?.registerNumber ||
      "—"
    );
  }

  function getStudentCourse(student) {
    return student?.course || "—";
  }

  function getStudentSemester(student) {
    return student?.semester || "—";
  }

  function getStudentSection(student) {
    return student?.section || "—";
  }

  function getAttendancePercentage(student) {
    const id = String(
      getStudentId(student)
    );

    const stats = studentStats.get(id);

    if (!stats || stats.total === 0) {
      return null;
    }

    return Math.round(
      (stats.present / stats.total) * 100
    );
  }

  /*
   * -----------------------------------------
   * Filter students
   * -----------------------------------------
   */

  const filteredStudents = useMemo(() => {
    const term = search
      .trim()
      .toLowerCase();

    return students.filter((student) => {
      const matchesSearch =
        !term ||
        [
          student.name,
          student.email,
          student.phone,
          student.mobile,
          student.rollNo,
          student.registerNo,
          student.course,
          student.semester,
          student.section,
        ]
          .filter(
            (value) =>
              value !== undefined &&
              value !== null
          )
          .some((value) =>
            String(value)
              .toLowerCase()
              .includes(term)
          );

      const matchesCourse =
        !courseFilter ||
        String(student.course) ===
          courseFilter;

      const matchesSemester =
        !semesterFilter ||
        String(student.semester) ===
          semesterFilter;

      const matchesSection =
        !sectionFilter ||
        String(student.section) ===
          sectionFilter;

      return (
        matchesSearch &&
        matchesCourse &&
        matchesSemester &&
        matchesSection
      );
    });
  }, [
    students,
    search,
    courseFilter,
    semesterFilter,
    sectionFilter,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredStudents.length /
        PAGE_SIZE
    )
  );

  const safePage = Math.min(
    page,
    totalPages
  );

  const paginatedStudents =
    filteredStudents.slice(
      (safePage - 1) * PAGE_SIZE,
      safePage * PAGE_SIZE
    );

  /*
   * -----------------------------------------
   * Manual attendance
   * -----------------------------------------
   */

  function handleFormChange(
    name,
    value
  ) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setFormError("");
  }

  function selectStudent(student) {
    const id = getStudentId(student);

    setForm((current) => ({
      ...current,
      student: id,
      course:
        student.course ||
        current.course,
      semester:
        String(
          student.semester ||
            current.semester
        ),
      section:
        student.section ||
        current.section,
    }));

    setFormError("");
  }

  async function markAttendance(e) {
    e.preventDefault();

    if (!form.student) {
      setFormError(
        "Please select a student."
      );
      return;
    }

    if (!form.date) {
      setFormError(
        "Please select a date."
      );
      return;
    }

    if (!form.subject) {
      setFormError(
        "Please select a subject."
      );
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      const student = students.find(
        (item) =>
          String(getStudentId(item)) ===
          String(form.student)
      );

      const payload = {
        student: form.student,
        studentId: form.student,
        studentName:
          getStudentName(student),
        rollNo:
          getStudentRoll(student),
        date: form.date,
        subject: form.subject,
        course:
          student?.course ||
          form.course,
        semester: Number(
          student?.semester ||
            form.semester
        ),
        section:
          student?.section ||
          form.section,
        period: Number(
          form.period
        ),
        status: form.status,
      };

      await post(
        "/attendance",
        payload
      );

      setForm((current) => ({
        ...current,
        student: "",
        status: "Present",
      }));

      await loadAttendance();
    } catch (err) {
      setFormError(
        err.message ||
          "Unable to save attendance."
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * -----------------------------------------
   * QR Attendance
   * -----------------------------------------
   */

  async function createQRSession() {
    setQrLoading(true);
    setError("");

    try {
      const response =
        await post(
          "/attendance/session",
          {
            subject: form.subject,
            course: form.course,
            semester: Number(
              form.semester
            ),
            section: form.section,
            period: Number(
              form.period
            ),
            date: form.date,
            expiresInMinutes: 15,
          }
        );

      const session =
        response.session ||
        response.data ||
        response;

      setQrSession(session);
    } catch (err) {
      setError(
        err.message ||
          "Unable to create QR attendance session."
      );
    } finally {
      setQrLoading(false);
    }
  }

  function closeQRSession() {
    setQrSession(null);
  }

  function getQRValue() {
    if (!qrSession) {
      return "";
    }

    return (
      qrSession.code ||
      qrSession.sessionCode ||
      qrSession.token ||
      JSON.stringify(
        qrSession
      )
    );
  }

  /*
   * -----------------------------------------
   * Attendance history
   * -----------------------------------------
   */

  const filteredHistory =
    useMemo(() => {
      const term =
        historySearch
          .trim()
          .toLowerCase();

      return [...records]
        .filter((record) => {
          if (!term) return true;

          return [
            record.studentName,
            record.student,
            record.rollNo,
            record.subject,
            record.course,
            record.semester,
            record.section,
            record.date,
            record.status,
          ]
            .filter(
              (value) =>
                value !==
                  undefined &&
                value !== null
            )
            .some((value) =>
              String(value)
                .toLowerCase()
                .includes(term)
            );
        })
        .sort((a, b) => {
          return String(
            b.date || ""
          ).localeCompare(
            String(a.date || "")
          );
        });
    }, [records, historySearch]);

  const historyTotalPages =
    Math.max(
      1,
      Math.ceil(
        filteredHistory.length /
          PAGE_SIZE
      )
    );

  const safeHistoryPage =
    Math.min(
      historyPage,
      historyTotalPages
    );

  const paginatedHistory =
    filteredHistory.slice(
      (safeHistoryPage - 1) *
        PAGE_SIZE,
      safeHistoryPage *
        PAGE_SIZE
    );

  useEffect(() => {
    setPage(1);
  }, [
    search,
    courseFilter,
    semesterFilter,
    sectionFilter,
  ]);

  useEffect(() => {
    setHistoryPage(1);
  }, [historySearch]);

  /*
   * -----------------------------------------
   * Date formatting
   * -----------------------------------------
   */

  function formatDate(date) {
    if (!date) return "—";

    const parsed = new Date(
      `${String(date).slice(
        0,
        10
      )}T00:00:00`
    );

    if (
      Number.isNaN(
        parsed.getTime()
      )
    ) {
      return String(date);
    }

    return parsed.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  }

  function statusClass(status) {
    const value =
      String(status || "")
        .toLowerCase();

    if (value === "present") {
      return "bg-emerald-100 text-emerald-700";
    }

    if (value === "absent") {
      return "bg-red-100 text-red-700";
    }

    if (value === "late") {
      return "bg-amber-100 text-amber-700";
    }

    if (value === "excused") {
      return "bg-blue-100 text-blue-700";
    }

    return "bg-slate-100 text-slate-600";
  }

  function attendanceClass(
    percentage
  ) {
    if (percentage === null) {
      return "text-slate-400";
    }

    if (percentage >= 75) {
      return "text-emerald-600";
    }

    if (percentage >= 60) {
      return "text-amber-600";
    }

    return "text-red-600";
  }

  if (loading) {
    return (
      <div className="w-full max-w-full">
        <Loading message="Loading attendance..." />
      </div>
    );
  }

  if (error && !students.length) {
    return (
      <div className="w-full max-w-full">
        <ErrorBox
          message={error}
          onRetry={loadAttendance}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-full space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-100">
              Faculty Workspace
            </p>

            <h2 className="mt-1 text-2xl font-bold sm:text-3xl">
              Attendance
            </h2>

            <p className="mt-2 text-sm text-blue-100">
              Mark attendance manually or
              use QR attendance for your
              class.
            </p>
          </div>

          <button
            type="button"
            onClick={loadAttendance}
            className="w-full rounded-xl bg-white px-5 py-3 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50 sm:w-auto"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <ErrorBox
          message={error}
          onRetry={loadAttendance}
        />
      )}

      {/* Tabs */}
      <div className="flex w-full overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        <button
          type="button"
          onClick={() =>
            setActiveTab("take")
          }
          className={`flex-1 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === "take"
              ? "bg-blue-600 text-white"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          Take Attendance
        </button>

        <button
          type="button"
          onClick={() =>
            setActiveTab("history")
          }
          className={`flex-1 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === "history"
              ? "bg-blue-600 text-white"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          Attendance History
        </button>
      </div>

      {/* ================================
          TAKE ATTENDANCE
      ================================= */}
      {activeTab === "take" && (
        <>
          {/* Class configuration */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h3 className="text-lg font-bold text-slate-900">
                Attendance Session
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Select the class and subject
                before marking attendance.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <FormSelect
                label="Date"
                value={form.date}
                onChange={(value) =>
                  handleFormChange(
                    "date",
                    value
                  )
                }
                options={[]}
                type="date"
              />

              <FormSelect
                label="Course"
                value={form.course}
                onChange={(value) =>
                  handleFormChange(
                    "course",
                    value
                  )
                }
                options={COURSES}
              />

              <FormSelect
                label="Semester"
                value={form.semester}
                onChange={(value) =>
                  handleFormChange(
                    "semester",
                    value
                  )
                }
                options={SEMESTERS}
                formatOption={(value) =>
                  `Semester ${value}`
                }
              />

              <FormSelect
                label="Section"
                value={form.section}
                onChange={(value) =>
                  handleFormChange(
                    "section",
                    value
                  )
                }
                options={SECTIONS}
              />

              <FormSelect
                label="Subject"
                value={form.subject}
                onChange={(value) =>
                  handleFormChange(
                    "subject",
                    value
                  )
                }
                options={SUBJECTS}
              />

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Period
                </label>

                <input
                  type="number"
                  min="1"
                  value={form.period}
                  onChange={(e) =>
                    handleFormChange(
                      "period",
                      e.target.value
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>

          {/* QR + Manual */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {/* QR Attendance */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-xl">
                    📱
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900">
                      QR Attendance
                    </h3>

                    <p className="text-sm text-slate-500">
                      Generate a temporary QR
                      code for students.
                    </p>
                  </div>
                </div>
              </div>

              {!qrSession ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm">
                    📷
                  </div>

                  <h4 className="mt-4 font-semibold text-slate-900">
                    No active QR session
                  </h4>

                  <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                    Generate a short-lived QR
                    session and ask students
                    to scan it.
                  </p>

                  <button
                    type="button"
                    onClick={createQRSession}
                    disabled={qrLoading}
                    className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {qrLoading
                      ? "Generating..."
                      : "Generate QR Code"}
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <div className="mx-auto flex w-fit rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <QRCodeSVG
                      value={getQRValue()}
                      size={220}
                      level="M"
                    />
                  </div>

                  <p className="mt-4 text-sm font-semibold text-slate-900">
                    Students can scan this QR
                    code
                  </p>

                  {(qrSession.code ||
                    qrSession.sessionCode) && (
                    <p className="mt-1 break-all text-xs text-slate-500">
                      Session:{" "}
                      {qrSession.code ||
                        qrSession.sessionCode}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                      ● Active
                    </span>

                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                      Expires automatically
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 text-left">
                    <InfoBox
                      label="Subject"
                      value={
                        form.subject
                      }
                    />

                    <InfoBox
                      label="Period"
                      value={
                        form.period
                      }
                    />

                    <InfoBox
                      label="Course"
                      value={
                        form.course
                      }
                    />

                    <InfoBox
                      label="Semester"
                      value={
                        `S${form.semester}`
                      }
                    />
                  </div>

                  <button
                    type="button"
                    onClick={
                      closeQRSession
                    }
                    className="mt-5 rounded-lg border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                  >
                    Close QR Session
                  </button>
                </div>
              )}
            </div>

            {/* Manual Attendance */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-xl">
                  ✅
                </div>

                <div>
                  <h3 className="font-bold text-slate-900">
                    Manual Attendance
                  </h3>

                  <p className="text-sm text-slate-500">
                    Mark an individual student
                    manually.
                  </p>
                </div>
              </div>

              {formError && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <form
                onSubmit={
                  markAttendance
                }
                className="space-y-4"
              >
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Student
                  </label>

                  <select
                    value={form.student}
                    onChange={(e) =>
                      selectStudent(
                        students.find(
                          (student) =>
                            String(
                              getStudentId(
                                student
                              )
                            ) ===
                            String(
                              e.target.value
                            )
                        )
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    required
                  >
                    <option value="">
                      Select student
                    </option>

                    {filteredStudents.map(
                      (student) => (
                        <option
                          key={getStudentId(
                            student
                          )}
                          value={getStudentId(
                            student
                          )}
                        >
                          {getStudentName(
                            student
                          )}{" "}
                          ·{" "}
                          {getStudentRoll(
                            student
                          )}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Status
                    </label>

                    <select
                      value={form.status}
                      onChange={(e) =>
                        handleFormChange(
                          "status",
                          e.target.value
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="Present">
                        Present
                      </option>

                      <option value="Absent">
                        Absent
                      </option>

                      <option value="Late">
                        Late
                      </option>

                      <option value="Excused">
                        Excused
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Period
                    </label>

                    <input
                      type="number"
                      min="1"
                      value={form.period}
                      onChange={(e) =>
                        handleFormChange(
                          "period",
                          e.target.value
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                      Selected subject
                    </span>

                    <span className="text-sm font-semibold text-slate-800">
                      {form.subject}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                      Date
                    </span>

                    <span className="text-sm font-semibold text-slate-800">
                      {formatDate(
                        form.date
                      )}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : "✓ Mark Attendance"}
                </button>
              </form>
            </div>
          </div>

          {/* Student List */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="font-bold text-slate-900">
                    Students
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Select a student for
                    manual attendance.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) =>
                      setSearch(
                        e.target.value
                      )
                    }
                    placeholder="Search students..."
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                  <select
                    value={courseFilter}
                    onChange={(e) =>
                      setCourseFilter(
                        e.target.value
                      )
                    }
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="">
                      All Courses
                    </option>

                    {COURSES.map(
                      (course) => (
                        <option
                          key={course}
                          value={course}
                        >
                          {course}
                        </option>
                      )
                    )}
                  </select>

                  <select
                    value={semesterFilter}
                    onChange={(e) =>
                      setSemesterFilter(
                        e.target.value
                      )
                    }
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="">
                      All Semesters
                    </option>

                    {SEMESTERS.map(
                      (semester) => (
                        <option
                          key={semester}
                          value={semester}
                        >
                          Semester{" "}
                          {semester}
                        </option>
                      )
                    )}
                  </select>

                  <select
                    value={sectionFilter}
                    onChange={(e) =>
                      setSectionFilter(
                        e.target.value
                      )
                    }
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="">
                      All Sections
                    </option>

                    {SECTIONS.map(
                      (section) => (
                        <option
                          key={section}
                          value={section}
                        >
                          Section {section}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>
            </div>

            {!paginatedStudents.length ? (
              <div className="p-8">
                <Empty
                  title="No students found"
                  message="No students match the selected filters."
                />
              </div>
            ) : (
              <>
                <div className="w-full overflow-hidden">
                  <table className="w-full table-fixed">
                    <thead className="bg-slate-50">
                      <tr className="border-b border-slate-200">
                        <th className="w-[25%] px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-4">
                          Student
                        </th>

                        <th className="w-[15%] px-2 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Roll No.
                        </th>

                        <th className="hidden w-[12%] px-2 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 md:table-cell">
                          Course
                        </th>

                        <th className="hidden w-[10%] px-2 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 lg:table-cell">
                          Sem.
                        </th>

                        <th className="w-[18%] px-2 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Attendance
                        </th>

                        <th className="w-[20%] px-2 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {paginatedStudents.map(
                        (student) => {
                          const percentage =
                            getAttendancePercentage(
                              student
                            );

                          return (
                            <tr
                              key={getStudentId(
                                student
                              )}
                              className="transition hover:bg-slate-50"
                            >
                              <td className="px-3 py-3 sm:px-4">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-slate-900">
                                    {getStudentName(
                                      student
                                    )}
                                  </p>

                                  <p className="truncate text-xs text-slate-500">
                                    {student.email ||
                                      "No email"}
                                  </p>
                                </div>
                              </td>

                              <td className="truncate px-2 py-3 text-sm text-slate-700">
                                {getStudentRoll(
                                  student
                                )}
                              </td>

                              <td className="hidden px-2 py-3 text-sm text-slate-700 md:table-cell">
                                {getStudentCourse(
                                  student
                                )}
                              </td>

                              <td className="hidden px-2 py-3 text-sm text-slate-700 lg:table-cell">
                                {getStudentSemester(
                                  student
                                ) !== "—"
                                  ? `S${getStudentSemester(
                                      student
                                    )}`
                                  : "—"}
                              </td>

                              <td className="px-2 py-3">
                                {percentage ===
                                null ? (
                                  <span className="text-xs text-slate-400">
                                    No records
                                  </span>
                                ) : (
                                  <div>
                                    <div className="mb-1 flex justify-between">
                                      <span
                                        className={`text-xs font-bold ${attendanceClass(
                                          percentage
                                        )}`}
                                      >
                                        {percentage}%
                                      </span>
                                    </div>

                                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                                      <div
                                        className="h-full rounded-full bg-blue-600"
                                        style={{
                                          width: `${percentage}%`,
                                        }}
                                      />
                                    </div>
                                  </div>
                                )}
                              </td>

                              <td className="px-2 py-3 text-right">
                                <button
                                  type="button"
                                  onClick={() =>
                                    selectStudent(
                                      student
                                    )
                                  }
                                  className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                                >
                                  Select
                                </button>
                              </td>
                            </tr>
                          );
                        }
                      )}
                    </tbody>
                  </table>
                </div>

                <Pagination
                  page={safePage}
                  totalPages={totalPages}
                  onPrevious={() =>
                    setPage(
                      (current) =>
                        Math.max(
                          1,
                          current - 1
                        )
                    )
                  }
                  onNext={() =>
                    setPage(
                      (current) =>
                        Math.min(
                          totalPages,
                          current + 1
                        )
                    )
                  }
                />
              </>
            )}
          </div>
        </>
      )}

      {/* ================================
          ATTENDANCE HISTORY
      ================================= */}
      {activeTab === "history" && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-bold text-slate-900">
                  Attendance History
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  View previously recorded
                  attendance.
                </p>
              </div>

              <input
                type="text"
                value={historySearch}
                onChange={(e) =>
                  setHistorySearch(
                    e.target.value
                  )
                }
                placeholder="Search attendance..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-72"
              />
            </div>
          </div>

          {!paginatedHistory.length ? (
            <div className="p-8">
              <Empty
                title="No attendance history"
                message="No attendance records match your search."
              />
            </div>
          ) : (
            <>
              <div className="w-full overflow-hidden">
                <table className="w-full table-fixed">
                  <thead className="bg-slate-50">
                    <tr className="border-b border-slate-200">
                      <th className="w-[13%] px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Date
                      </th>

                      <th className="w-[22%] px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Student
                      </th>

                      <th className="w-[19%] px-2 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Subject
                      </th>

                      <th className="hidden w-[12%] px-2 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 md:table-cell">
                        Course
                      </th>

                      <th className="hidden w-[9%] px-2 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 lg:table-cell">
                        Period
                      </th>

                      <th className="w-[15%] px-2 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Status
                      </th>

                      <th className="w-[10%] px-2 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        —
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {paginatedHistory.map(
                      (record, index) => (
                        <tr
                          key={
                            record._id ||
                            record.id ||
                            `${record.date}-${record.student}-${index}`
                          }
                          className="transition hover:bg-slate-50"
                        >
                          <td className="px-3 py-3 text-sm text-slate-700">
                            {formatDate(
                              record.date
                            )}
                          </td>

                          <td className="px-3 py-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-900">
                                {record.studentName ||
                                  record.student?.name ||
                                  record.student ||
                                  "Unknown Student"}
                              </p>

                              <p className="truncate text-xs text-slate-500">
                                {record.rollNo ||
                                  record.student?.rollNo ||
                                  record.student?.registerNo ||
                                  ""}
                              </p>
                            </div>
                          </td>

                          <td className="truncate px-2 py-3 text-sm text-slate-700">
                            {record.subject ||
                              "—"}
                          </td>

                          <td className="hidden px-2 py-3 text-sm text-slate-700 md:table-cell">
                            {record.course ||
                              "—"}
                          </td>

                          <td className="hidden px-2 py-3 text-sm text-slate-700 lg:table-cell">
                            {record.period ||
                              "—"}
                          </td>

                          <td className="px-2 py-3">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(
                                record.status
                              )}`}
                            >
                              {record.status ||
                                "Unknown"}
                            </span>
                          </td>

                          <td className="px-2 py-3 text-right text-xs text-slate-400">
                            —
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              <Pagination
                page={safeHistoryPage}
                totalPages={
                  historyTotalPages
                }
                onPrevious={() =>
                  setHistoryPage(
                    (current) =>
                      Math.max(
                        1,
                        current - 1
                      )
                  )
                }
                onNext={() =>
                  setHistoryPage(
                    (current) =>
                      Math.min(
                        historyTotalPages,
                        current + 1
                      )
                  )
                }
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* -----------------------------------------
   Form Select
----------------------------------------- */

function FormSelect({
  label,
  value,
  onChange,
  options,
  type,
  formatOption,
}) {
  if (type === "date") {
    return (
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-slate-700">
          {label}
        </label>

        <input
          type="date"
          value={value}
          onChange={(e) =>
            onChange(e.target.value)
          }
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>
    );
  }

  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <select
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      >
        {options.map((option) => (
          <option
            key={option}
            value={option}
          >
            {formatOption
              ? formatOption(option)
              : option}
          </option>
        ))}
      </select>
    </div>
  );
}

/* -----------------------------------------
   Info Box
----------------------------------------- */

function InfoBox({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-semibold text-slate-700">
        {value || "—"}
      </p>
    </div>
  );
}

/* -----------------------------------------
   Pagination
----------------------------------------- */

function Pagination({
  page,
  totalPages,
  onPrevious,
  onNext,
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-500">
        Page {page} of {totalPages}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page === 1}
          onClick={onPrevious}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>

        <span className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">
          {page}
        </span>

        <button
          type="button"
          disabled={
            page === totalPages
          }
          onClick={onNext}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}