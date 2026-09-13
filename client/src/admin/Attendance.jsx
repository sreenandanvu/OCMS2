import React, { useEffect, useMemo, useState } from "react";
import { get } from "../services/api";
import Loading from "../components/Loading";
import ErrorBox from "../components/ErrorBox";
import Empty from "../components/Empty";

const ITEMS_PER_PAGE = 7;

export default function Attendance() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  async function loadAttendance() {
    setLoading(true);
    setError("");

    try {
      const response = await get("/attendance");

      const data = Array.isArray(response)
        ? response
        : response.attendance || response.data || [];

      setRecords(data);
      setCurrentPage(1);
    } catch (err) {
      setError(err.message || "Unable to load attendance.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAttendance();
  }, []);

  /* -------------------------------------------------------
     Build unique student list
  ------------------------------------------------------- */

  const students = useMemo(() => {
    const map = new Map();

    records.forEach((record) => {
      const key =
        record.rollNo ||
        record.studentId ||
        record.student;

      if (!key) return;

      if (!map.has(key)) {
        map.set(key, {
          key,
          name:
            record.studentName ||
            record.student ||
            "Unknown Student",
          rollNo: record.rollNo || "-",
          course: record.course || "-",
          semester: record.semester || "-",
          section: record.section || "-",
        });
      }
    });

    return [...map.values()];
  }, [records]);

  /* -------------------------------------------------------
     Search students
  ------------------------------------------------------- */

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return students;

    return students.filter((student) =>
      [
        student.name,
        student.rollNo,
        student.course,
        student.semester,
        student.section,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [students, search]);

  /* -------------------------------------------------------
     Pagination
  ------------------------------------------------------- */

  const totalPages = Math.max(
    1,
    Math.ceil(filteredStudents.length / ITEMS_PER_PAGE)
  );

  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;

    return filteredStudents.slice(
      start,
      start + ITEMS_PER_PAGE
    );
  }, [filteredStudents, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  function handleSearch(value) {
    setSearch(value);
    setCurrentPage(1);
  }

  /* -------------------------------------------------------
     Records for selected student
  ------------------------------------------------------- */

  const studentRecords = useMemo(() => {
    if (!selectedStudent) return [];

    return records.filter((record) => {
      const key =
        record.rollNo ||
        record.studentId ||
        record.student;

      return key === selectedStudent.key;
    });
  }, [records, selectedStudent]);

  /* -------------------------------------------------------
     Attendance dates
  ------------------------------------------------------- */

  const dates = useMemo(() => {
    const map = new Map();

    studentRecords.forEach((record) => {
      if (!record.date) return;

      if (!map.has(record.date)) {
        map.set(record.date, {
          date: record.date,
          records: [],
        });
      }

      map.get(record.date).records.push(record);
    });

    return [...map.values()].sort((a, b) =>
      b.date.localeCompare(a.date)
    );
  }, [studentRecords]);

  /* -------------------------------------------------------
     Selected day's attendance
  ------------------------------------------------------- */

  const dayRecords = useMemo(() => {
    if (!selectedDate) return [];

    return studentRecords.filter(
      (record) => record.date === selectedDate
    );
  }, [studentRecords, selectedDate]);

  function formatDate(date) {
    const value = new Date(`${date}T00:00:00`);

    return value.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function isPresent(status) {
    return String(status).toLowerCase() === "present";
  }

  /* -------------------------------------------------------
     Loading
  ------------------------------------------------------- */

  if (loading) {
    return (
      <div className="p-6">
        <Loading message="Loading attendance..." />
      </div>
    );
  }

  /* -------------------------------------------------------
     Error
  ------------------------------------------------------- */

  if (error) {
    return (
      <div className="p-6">
        <ErrorBox
          message={error}
          onRetry={loadAttendance}
        />
      </div>
    );
  }

  /* -------------------------------------------------------
     Empty
  ------------------------------------------------------- */

  if (!records.length) {
    return (
      <div className="p-6">
        <Empty
          title="No attendance records"
          message="Attendance records will appear here when faculty mark attendance."
        />
      </div>
    );
  }

  /* =======================================================
     STEP 3
     Full attendance for selected day
  ======================================================= */

  if (selectedStudent && selectedDate) {
    return (
      <div className="space-y-6">
        <div>
          <button
            type="button"
            onClick={() => setSelectedDate(null)}
            className="mb-3 text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            ← Back to Days
          </button>

          <h2 className="text-2xl font-bold text-slate-900">
            {formatDate(selectedDate)}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {selectedStudent.name} · {selectedStudent.rollNo}
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="font-semibold text-slate-900">
              Full Attendance
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              All subjects recorded for this day.
            </p>
          </div>

          <div className="w-full">
            <table className="w-full table-fixed">
              <thead className="bg-slate-50">
                <tr>
                  <th className="w-[15%] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Period
                  </th>

                  <th className="w-[35%] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Subject
                  </th>

                  <th className="w-[30%] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Faculty
                  </th>

                  <th className="w-[20%] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {[...dayRecords]
                  .sort(
                    (a, b) =>
                      Number(a.period || 0) -
                      Number(b.period || 0)
                  )
                  .map((record, index) => (
                    <tr
                      key={
                        record._id ||
                        `${record.subject}-${index}`
                      }
                      className="hover:bg-slate-50"
                    >
                      <td className="px-4 py-4 text-sm text-slate-700">
                        {record.period || index + 1}
                      </td>

                      <td className="truncate px-4 py-4 text-sm font-medium text-slate-900">
                        {record.subject || "-"}
                      </td>

                      <td className="truncate px-4 py-4 text-sm text-slate-600">
                        {record.faculty || "-"}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={
                            isPresent(record.status)
                              ? "inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700"
                              : "inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700"
                          }
                        >
                          {record.status || "Unknown"}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  /* =======================================================
     STEP 2
     Days for selected student
  ======================================================= */

  if (selectedStudent) {
    return (
      <div className="space-y-6">
        <div>
          <button
            type="button"
            onClick={() => setSelectedStudent(null)}
            className="mb-3 text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            ← Back to Students
          </button>

          <h2 className="text-2xl font-bold text-slate-900">
            {selectedStudent.name}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {selectedStudent.rollNo} · {selectedStudent.course} ·
            Semester {selectedStudent.semester} · Section{" "}
            {selectedStudent.section}
          </p>
        </div>

        {dates.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
            <div className="text-4xl">📅</div>

            <h3 className="mt-3 font-semibold text-slate-900">
              No attendance dates
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              No attendance has been recorded for this student.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {dates.map((day) => {
              const present = day.records.filter((item) =>
                isPresent(item.status)
              ).length;

              const total = day.records.length;

              return (
                <button
                  type="button"
                  key={day.date}
                  onClick={() => setSelectedDate(day.date)}
                  className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xl">
                    📅
                  </div>

                  <div className="min-w-0 flex-1">
                    <strong className="block truncate text-sm font-semibold text-slate-900">
                      {formatDate(day.date)}
                    </strong>

                    <span className="mt-1 block text-xs text-slate-500">
                      {present}/{total} classes attended
                    </span>
                  </div>

                  <span className="text-lg text-slate-400">
                    →
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  /* =======================================================
     STEP 1
     Student list
  ======================================================= */

  return (
    <div className="space-y-6">
      {/* Header */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Attendance
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Select a student to view attendance by date and subject.
          </p>
        </div>

        <button
          type="button"
          onClick={loadAttendance}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Search */}

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            🔍
          </span>

          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by student name, roll number, course..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
          />
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
          <span>
            {filteredStudents.length} student
            {filteredStudents.length !== 1 ? "s" : ""}
          </span>

          {search && (
            <button
              type="button"
              onClick={() => handleSearch("")}
              className="font-medium text-slate-700 hover:text-slate-900"
            >
              Clear search
            </button>
          )}
        </div>
      </div>

      {/* No search results */}

      {!filteredStudents.length ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="text-4xl">🔍</div>

          <h3 className="mt-3 font-semibold text-slate-900">
            No students found
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Try searching with a different name or roll number.
          </p>
        </div>
      ) : (
        <>
          {/* Student cards */}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {paginatedStudents.map((student) => (
              <button
                type="button"
                key={student.key}
                onClick={() => {
                  setSelectedStudent(student);
                  setSelectedDate(null);
                }}
                className="flex min-w-0 items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-900 text-lg font-bold text-white">
                  {student.name
                    ?.charAt(0)
                    ?.toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <strong className="block truncate text-sm font-semibold text-slate-900">
                    {student.name}
                  </strong>

                  <span className="mt-1 block text-xs text-slate-500">
                    Roll No: {student.rollNo}
                  </span>

                  <small className="mt-1 block truncate text-xs text-slate-400">
                    {student.course} · Semester{" "}
                    {student.semester} · Section{" "}
                    {student.section}
                  </small>
                </div>

                <span className="shrink-0 text-lg text-slate-400">
                  →
                </span>
              </button>
            ))}
          </div>

          {/* Pagination */}

          {totalPages > 1 && (
            <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Showing{" "}
                <span className="font-medium text-slate-700">
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium text-slate-700">
                  {Math.min(
                    currentPage * ITEMS_PER_PAGE,
                    filteredStudents.length
                  )}
                </span>{" "}
                of{" "}
                <span className="font-medium text-slate-700">
                  {filteredStudents.length}
                </span>
              </p>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.max(1, page - 1)
                    )
                  }
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                {Array.from(
                  { length: totalPages },
                  (_, index) => index + 1
                ).map((page) => (
                  <button
                    type="button"
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={
                      page === currentPage
                        ? "rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white"
                        : "rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                    }
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.min(totalPages, page + 1)
                    )
                  }
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}