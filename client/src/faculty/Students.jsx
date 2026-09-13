import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  RefreshCw,
  Search,
  UserRound,
  Users,
} from "lucide-react";

import { get } from "../services/api";

const ROWS_PER_PAGE = 7;

function getId(student) {
  return student?._id || student?.id || "";
}

export default function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [semesterFilter, setSemesterFilter] =
    useState("");
  const [sectionFilter, setSectionFilter] =
    useState("");

  const [page, setPage] = useState(1);
  const [selectedStudent, setSelectedStudent] =
    useState(null);

  /*
  |--------------------------------------------------------------------------
  | Load all students
  |--------------------------------------------------------------------------
  */

  async function loadStudents() {
    setLoading(true);
    setError("");

    try {
      const response = await get("/students");

      const data = Array.isArray(response)
        ? response
        : response.students ||
          response.data ||
          [];

      setStudents(data);
      setPage(1);
    } catch (err) {
      setError(
        err.message ||
          "Unable to load students."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStudents();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Filter options
  |--------------------------------------------------------------------------
  */

  const courses = useMemo(() => {
    return [
      ...new Set(
        students
          .map((student) => student.course)
          .filter(Boolean)
      ),
    ].sort();
  }, [students]);

  const semesters = useMemo(() => {
    return [
      ...new Set(
        students
          .map((student) => student.semester)
          .filter(
            (semester) =>
              semester !== undefined &&
              semester !== null &&
              semester !== ""
          )
      ),
    ].sort((a, b) => Number(a) - Number(b));
  }, [students]);

  const sections = useMemo(() => {
    return [
      ...new Set(
        students
          .map((student) => student.section)
          .filter(Boolean)
      ),
    ].sort();
  }, [students]);

  /*
  |--------------------------------------------------------------------------
  | Search + filters
  |--------------------------------------------------------------------------
  */

  const filteredStudents = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return students.filter((student) => {
      const matchesSearch =
        !query ||
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
          student.gender,
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(query)
        );

      const matchesCourse =
        !courseFilter ||
        String(student.course || "") ===
          String(courseFilter);

      const matchesSemester =
        !semesterFilter ||
        String(student.semester || "") ===
          String(semesterFilter);

      const matchesSection =
        !sectionFilter ||
        String(student.section || "") ===
          String(sectionFilter);

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

  /*
  |--------------------------------------------------------------------------
  | Pagination
  |--------------------------------------------------------------------------
  */

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredStudents.length /
        ROWS_PER_PAGE
    )
  );

  const currentStudents =
    filteredStudents.slice(
      (page - 1) * ROWS_PER_PAGE,
      page * ROWS_PER_PAGE
    );

  /*
  |--------------------------------------------------------------------------
  | Reset filters
  |--------------------------------------------------------------------------
  */

  function resetFilters() {
    setSearch("");
    setCourseFilter("");
    setSemesterFilter("");
    setSectionFilter("");
    setPage(1);
  }

  /*
  |--------------------------------------------------------------------------
  | Student details
  |--------------------------------------------------------------------------
  */

  if (selectedStudent) {
    return (
      <StudentDetails
        student={selectedStudent}
        onBack={() =>
          setSelectedStudent(null)
        }
      />
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="w-full space-y-6">
        <PageHeader />

        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <RefreshCw
            size={28}
            className="mx-auto animate-spin text-slate-400"
          />

          <p className="mt-3 text-sm text-slate-500">
            Loading students...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Page heading */}

      <PageHeader
        onRefresh={loadStudents}
      />

      {/* Error */}

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>

          <button
            type="button"
            onClick={loadStudents}
            className="ml-auto rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
          >
            Retry
          </button>
        </div>
      )}

      {/* Student table */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Panel header */}

        <div className="border-b border-slate-200 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                All Students
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {filteredStudents.length}{" "}
                student
                {filteredStudents.length !== 1
                  ? "s"
                  : ""}{" "}
                found
              </p>
            </div>

            <button
              type="button"
              onClick={loadStudents}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>

          {/* Search */}

          <div className="mt-5">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) => {
                  setSearch(
                    event.target.value
                  );
                  setPage(1);
                }}
                placeholder="Search by name, roll number, email, phone..."
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />
            </div>
          </div>

          {/* Filters */}

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <select
              value={courseFilter}
              onChange={(event) => {
                setCourseFilter(
                  event.target.value
                );
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            >
              <option value="">
                All Courses
              </option>

              {courses.map((course) => (
                <option
                  key={course}
                  value={course}
                >
                  {course}
                </option>
              ))}
            </select>

            <select
              value={semesterFilter}
              onChange={(event) => {
                setSemesterFilter(
                  event.target.value
                );
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            >
              <option value="">
                All Semesters
              </option>

              {semesters.map((semester) => (
                <option
                  key={semester}
                  value={semester}
                >
                  Semester {semester}
                </option>
              ))}
            </select>

            <select
              value={sectionFilter}
              onChange={(event) => {
                setSectionFilter(
                  event.target.value
                );
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            >
              <option value="">
                All Sections
              </option>

              {sections.map((section) => (
                <option
                  key={section}
                  value={section}
                >
                  Section {section}
                </option>
              ))}
            </select>
          </div>

          {(search ||
            courseFilter ||
            semesterFilter ||
            sectionFilter) && (
            <button
              type="button"
              onClick={resetFilters}
              className="mt-3 text-xs font-semibold text-slate-500 hover:text-slate-900"
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Empty state */}

        {!currentStudents.length ? (
          <div className="p-12 text-center">
            <Users
              size={36}
              className="mx-auto text-slate-300"
            />

            <h3 className="mt-3 text-sm font-semibold text-slate-800">
              No students found
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Try changing your search or
              filters.
            </p>
          </div>
        ) : (
          <>
            {/* Table */}

            <table className="w-full table-fixed">
              <thead className="bg-slate-50">
                <tr>
                  <th className="w-[28%] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Student
                  </th>

                  <th className="w-[16%] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Roll No
                  </th>

                  <th className="w-[18%] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Course
                  </th>

                  <th className="w-[14%] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Semester
                  </th>

                  <th className="w-[10%] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Section
                  </th>

                  <th className="w-[14%] px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Details
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {currentStudents.map(
                  (student) => (
                    <tr
                      key={getId(student)}
                      className="transition hover:bg-slate-50"
                    >
                      {/* Student */}

                      <td className="px-4 py-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                            {student.name
                              ?.charAt(0)
                              ?.toUpperCase() ||
                              "S"}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-800">
                              {student.name ||
                                "Unnamed Student"}
                            </p>

                            <p className="truncate text-xs text-slate-400">
                              {student.email ||
                                "No email"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Roll number */}

                      <td className="truncate px-4 py-4 text-sm text-slate-600">
                        {student.rollNo ||
                          student.registerNo ||
                          "-"}
                      </td>

                      {/* Course */}

                      <td className="truncate px-4 py-4 text-sm text-slate-600">
                        {student.course ||
                          "-"}
                      </td>

                      {/* Semester */}

                      <td className="px-4 py-4 text-sm text-slate-600">
                        {student.semester
                          ? `Semester ${student.semester}`
                          : "-"}
                      </td>

                      {/* Section */}

                      <td className="px-4 py-4">
                        <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                          {student.section ||
                            "-"}
                        </span>
                      </td>

                      {/* Details */}

                      <td className="px-4 py-4 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedStudent(
                              student
                            )
                          }
                          className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>

            {/* Pagination */}

            <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">
                Showing{" "}
                {filteredStudents.length ===
                0
                  ? 0
                  : (page - 1) *
                      ROWS_PER_PAGE +
                    1}{" "}
                to{" "}
                {Math.min(
                  page *
                    ROWS_PER_PAGE,
                  filteredStudents.length
                )}{" "}
                of{" "}
                {filteredStudents.length}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() =>
                    setPage(page - 1)
                  }
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft
                    size={16}
                  />
                </button>

                <span className="min-w-[80px] text-center text-xs font-medium text-slate-500">
                  Page {page} of{" "}
                  {totalPages}
                </span>

                <button
                  type="button"
                  disabled={
                    page === totalPages
                  }
                  onClick={() =>
                    setPage(page + 1)
                  }
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight
                    size={16}
                  />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Page Header
|--------------------------------------------------------------------------
*/

function PageHeader({ onRefresh }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="mb-2 inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold tracking-wide text-slate-500">
          FACULTY
        </div>

        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          My Students
        </h2>

        <p className="mt-1.5 text-sm text-slate-500">
          View student details and academic
          information.
        </p>
      </div>

      <button
        type="button"
        onClick={onRefresh}
        className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
      >
        <RefreshCw size={16} />
        Refresh
      </button>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Student Details
|--------------------------------------------------------------------------
*/

function StudentDetails({
  student,
  onBack,
}) {
  return (
    <div className="w-full space-y-6">
      {/* Back */}

      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50"
      >
        <ArrowLeft size={17} />
        Back to My Students
      </button>

      {/* Profile header */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-28 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700" />

        <div className="px-6 pb-6">
          <div className="-mt-10 flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-slate-100 text-2xl font-bold text-slate-600 shadow-sm">
              {student.name
                ?.charAt(0)
                ?.toUpperCase() || "S"}
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-bold text-slate-900">
                {student.name ||
                  "Unnamed Student"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {student.rollNo ||
                  student.registerNo ||
                  "No roll number"}
              </p>
            </div>

            <span className="w-fit rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
              Section{" "}
              {student.section || "-"}
            </span>
          </div>
        </div>
      </div>

      {/* Information cards */}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Academic */}

        <InfoCard title="Academic Information">
          <InfoRow
            icon={<BookOpen size={17} />}
            label="Course"
            value={
              student.course || "-"
            }
          />

          <InfoRow
            icon={
              <CalendarDays
                size={17}
              />
            }
            label="Semester"
            value={
              student.semester
                ? `Semester ${student.semester}`
                : "-"
            }
          />

          <InfoRow
            icon={<Users size={17} />}
            label="Section"
            value={
              student.section || "-"
            }
          />

          <InfoRow
            icon={<UserRound size={17} />}
            label="Roll Number"
            value={
              student.rollNo ||
              student.registerNo ||
              "-"
            }
          />

          <InfoRow
            icon={<BookOpen size={17} />}
            label="Department"
            value={
              student.department || "-"
            }
          />

          <InfoRow
            icon={
              <CalendarDays
                size={17}
              />
            }
            label="Admission Year"
            value={
              student.admissionYear ||
              "-"
            }
          />
        </InfoCard>

        {/* Contact */}

        <InfoCard title="Contact & Basic Information">
          <InfoRow
            icon={<Mail size={17} />}
            label="Email"
            value={
              student.email || "-"
            }
          />

          <InfoRow
            icon={<Phone size={17} />}
            label="Phone"
            value={
              student.phone ||
              student.mobile ||
              "-"
            }
          />

          <InfoRow
            icon={<UserRound size={17} />}
            label="Gender"
            value={
              student.gender || "-"
            }
          />

          <InfoRow
            icon={
              <CalendarDays
                size={17}
              />
            }
            label="Date of Birth"
            value={
              student.dateOfBirth ||
              student.dob ||
              "-"
            }
          />

          <InfoRow
            icon={<Users size={17} />}
            label="Guardian"
            value={
              student.guardianName ||
              student.parentName ||
              "-"
            }
          />

          <InfoRow
            icon={<Phone size={17} />}
            label="Guardian Phone"
            value={
              student.guardianPhone ||
              student.parentPhone ||
              "-"
            }
          />
        </InfoCard>
      </div>

      {/* Additional information */}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">
          Student Information
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Additional information available in
          the student record.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DetailBox
            label="Student ID"
            value={
              getId(student) || "-"
            }
          />

          <DetailBox
            label="Status"
            value={
              student.status || "Active"
            }
          />

          <DetailBox
            label="Nationality"
            value={
              student.nationality || "-"
            }
          />

          <DetailBox
            label="Address"
            value={
              student.address || "-"
            }
          />

          <DetailBox
            label="City"
            value={
              student.city || "-"
            }
          />

          <DetailBox
            label="State"
            value={
              student.state || "-"
            }
          />
        </div>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Information Card
|--------------------------------------------------------------------------
*/

function InfoCard({
  title,
  children,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-lg font-bold text-slate-900">
        {title}
      </h3>

      <div className="divide-y divide-slate-100">
        {children}
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Information Row
|--------------------------------------------------------------------------
*/

function InfoRow({
  icon,
  label,
  value,
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-400">
          {label}
        </p>

        <p className="mt-0.5 truncate text-sm font-medium text-slate-700">
          {value}
        </p>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Detail Box
|--------------------------------------------------------------------------
*/

function DetailBox({
  label,
  value,
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-medium text-slate-400">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-bold text-slate-700">
        {value}
      </p>
    </div>
  );
}