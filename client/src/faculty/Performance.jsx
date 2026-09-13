import React, { useEffect, useMemo, useState } from "react";
import { get } from "../services/api";
import Loading from "../components/Loading";
import ErrorBox from "../components/ErrorBox";
import Empty from "../components/Empty";

const PAGE_SIZE = 7;

export default function Performance() {
  const [results, setResults] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");

  const [page, setPage] = useState(1);
  const [viewItem, setViewItem] = useState(null);

  async function loadPerformance() {
    setLoading(true);
    setError("");

    try {
      const response = await get("/reports/performance");

      const data = Array.isArray(response)
        ? response
        : response.results ||
          response.data ||
          [];

      setResults(data);
    } catch (err) {
      setError(
        err.message ||
          "Unable to load performance data."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPerformance();
  }, []);

  /*
   * Get percentage only when valid marks exist.
   * Missing marks are NOT treated as zero.
   */
  function getPercentage(result) {
    const marks = Number(result?.marks);
    const maxMarks = Number(result?.maxMarks);

    if (
      !Number.isFinite(marks) ||
      !Number.isFinite(maxMarks) ||
      maxMarks <= 0
    ) {
      return null;
    }

    return Math.max(
      0,
      Math.min(100, (marks / maxMarks) * 100)
    );
  }

  function getStudentName(result) {
    return (
      result?.student ||
      result?.studentName ||
      result?.student?.name ||
      "Unknown Student"
    );
  }

  function getRollNumber(result) {
    return (
      result?.rollNo ||
      result?.registerNo ||
      result?.registerNumber ||
      result?.studentRollNo ||
      result?.studentRegisterNo ||
      result?.student?.rollNo ||
      result?.student?.registerNo ||
      ""
    );
  }

  function getCourse(result) {
    return (
      result?.course ||
      result?.studentCourse ||
      result?.student?.course ||
      "—"
    );
  }

  function getSemester(result) {
    return (
      result?.semester ||
      result?.studentSemester ||
      result?.student?.semester ||
      ""
    );
  }

  function getSubject(result) {
    return (
      result?.subject ||
      result?.examSubject ||
      "—"
    );
  }

  function getGrade(result) {
    if (result?.grade) {
      return result.grade;
    }

    const percentage = getPercentage(result);

    if (percentage === null) {
      return "N/A";
    }

    if (percentage >= 90) return "A+";
    if (percentage >= 80) return "A";
    if (percentage >= 70) return "B+";
    if (percentage >= 60) return "B";
    if (percentage >= 50) return "C";
    if (percentage >= 40) return "D";

    return "F";
  }

  function getPerformanceStatus(result) {
    const percentage = getPercentage(result);

    if (percentage === null) {
      return {
        label: "No Marks",
        className:
          "bg-slate-100 text-slate-600",
      };
    }

    if (percentage >= 80) {
      return {
        label: "Excellent",
        className:
          "bg-emerald-100 text-emerald-700",
      };
    }

    if (percentage >= 60) {
      return {
        label: "Good",
        className:
          "bg-blue-100 text-blue-700",
      };
    }

    if (percentage >= 40) {
      return {
        label: "Average",
        className:
          "bg-amber-100 text-amber-700",
      };
    }

    return {
      label: "Needs Improvement",
      className:
        "bg-red-100 text-red-700",
    };
  }

  /*
   * Unique filter options
   */
  const courseOptions = useMemo(() => {
    return [
      ...new Set(
        results
          .map((result) => getCourse(result))
          .filter(
            (value) =>
              value &&
              value !== "—"
          )
      ),
    ].sort();
  }, [results]);

  const semesterOptions = useMemo(() => {
    return [
      ...new Set(
        results
          .map((result) =>
            String(getSemester(result))
          )
          .filter(
            (value) =>
              value &&
              value !== "undefined"
          )
      ),
    ].sort((a, b) => Number(a) - Number(b));
  }, [results]);

  const subjectOptions = useMemo(() => {
    return [
      ...new Set(
        results
          .map((result) =>
            getSubject(result)
          )
          .filter(
            (value) =>
              value &&
              value !== "—"
          )
      ),
    ].sort();
  }, [results]);

  /*
   * Filtering
   */
  const filteredResults = useMemo(() => {
    const term = search
      .trim()
      .toLowerCase();

    return results.filter((result) => {
      const studentName =
        getStudentName(result);

      const rollNumber =
        getRollNumber(result);

      const course =
        getCourse(result);

      const semester =
        getSemester(result);

      const subject =
        getSubject(result);

      const grade =
        getGrade(result);

      const matchesSearch =
        !term ||
        [
          studentName,
          rollNumber,
          course,
          semester,
          subject,
          grade,
          result?.marks,
          result?.maxMarks,
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
        course === courseFilter;

      const matchesSemester =
        !semesterFilter ||
        String(semester) ===
          semesterFilter;

      const matchesSubject =
        !subjectFilter ||
        subject === subjectFilter;

      return (
        matchesSearch &&
        matchesCourse &&
        matchesSemester &&
        matchesSubject
      );
    });
  }, [
    results,
    search,
    courseFilter,
    semesterFilter,
    subjectFilter,
  ]);

  /*
   * Summary statistics
   */
  const summary = useMemo(() => {
    const percentages = results
      .map(getPercentage)
      .filter(
        (value) => value !== null
      );

    if (!percentages.length) {
      return {
        average: null,
        highest: null,
        lowest: null,
      };
    }

    const total = percentages.reduce(
      (sum, value) => sum + value,
      0
    );

    return {
      average: Math.round(
        total / percentages.length
      ),
      highest: Math.round(
        Math.max(...percentages)
      ),
      lowest: Math.round(
        Math.min(...percentages)
      ),
    };
  }, [results]);

  /*
   * Pagination
   */
  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredResults.length /
        PAGE_SIZE
    )
  );

  const safePage = Math.min(
    page,
    totalPages
  );

  const paginatedResults =
    filteredResults.slice(
      (safePage - 1) * PAGE_SIZE,
      safePage * PAGE_SIZE
    );

  useEffect(() => {
    setPage(1);
  }, [
    search,
    courseFilter,
    semesterFilter,
    subjectFilter,
  ]);

  function resetFilters() {
    setSearch("");
    setCourseFilter("");
    setSemesterFilter("");
    setSubjectFilter("");
    setPage(1);
  }

  if (loading) {
    return (
      <div className="w-full max-w-full">
        <Loading message="Loading performance..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-full">
        <ErrorBox
          message={error}
          onRetry={loadPerformance}
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
              Performance
            </h2>

            <p className="mt-2 max-w-2xl text-sm text-blue-100">
              Analyse student academic
              performance, marks and
              grades.
            </p>
          </div>

          <button
            type="button"
            onClick={loadPerformance}
            disabled={loading}
            className="w-full rounded-xl bg-white px-5 py-3 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon="📊"
          label="Average"
          value={
            summary.average === null
              ? "N/A"
              : `${summary.average}%`
          }
          description="Overall performance"
        />

        <SummaryCard
          icon="🏆"
          label="Highest"
          value={
            summary.highest === null
              ? "N/A"
              : `${summary.highest}%`
          }
          description="Highest score"
        />

        <SummaryCard
          icon="📉"
          label="Lowest"
          value={
            summary.lowest === null
              ? "N/A"
              : `${summary.lowest}%`
          }
          description="Lowest score"
        />

        <SummaryCard
          icon="🎓"
          label="Records"
          value={results.length}
          description="Result records"
        />
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-slate-900">
            Performance Filters
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Search and filter student
            performance records.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          {/* Search */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              Search
            </label>

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Student, subject, roll no..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Course */}
          <FilterSelect
            label="Course"
            value={courseFilter}
            onChange={setCourseFilter}
            options={courseOptions}
            placeholder="All courses"
          />

          {/* Semester */}
          <FilterSelect
            label="Semester"
            value={semesterFilter}
            onChange={setSemesterFilter}
            options={semesterOptions}
            placeholder="All semesters"
            formatOption={(value) =>
              `Semester ${value}`
            }
          />

          {/* Subject */}
          <FilterSelect
            label="Subject"
            value={subjectFilter}
            onChange={setSubjectFilter}
            options={subjectOptions}
            placeholder="All subjects"
          />
        </div>

        {(search ||
          courseFilter ||
          semesterFilter ||
          subjectFilter) && (
          <button
            type="button"
            onClick={resetFilters}
            className="mt-3 text-sm font-semibold text-blue-600 hover:text-blue-800"
          >
            Reset filters
          </button>
        )}
      </div>

      {/* Performance Table */}
      <div className="w-full max-w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold text-slate-900">
                Student Performance
              </h3>

              <p className="text-sm text-slate-500">
                Showing{" "}
                {filteredResults.length === 0
                  ? 0
                  : (safePage - 1) *
                      PAGE_SIZE +
                    1}
                –
                {Math.min(
                  safePage * PAGE_SIZE,
                  filteredResults.length
                )}{" "}
                of{" "}
                {filteredResults.length}
              </p>
            </div>

            <span className="text-xs font-medium text-slate-500">
              {PAGE_SIZE} per page
            </span>
          </div>
        </div>

        {paginatedResults.length === 0 ? (
          <div className="p-8">
            <Empty
              title="No performance records"
              message={
                results.length === 0
                  ? "No student result records are available yet."
                  : "Try changing your search or filters."
              }
            />
          </div>
        ) : (
          <>
            <div className="w-full overflow-hidden">
              <table className="w-full table-fixed">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-200">
                    <th className="w-[23%] px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-4">
                      Student
                    </th>

                    <th className="w-[17%] px-2 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Subject
                    </th>

                    <th className="hidden w-[10%] px-2 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 md:table-cell">
                      Course
                    </th>

                    <th className="hidden w-[9%] px-2 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 lg:table-cell">
                      Sem.
                    </th>

                    <th className="w-[12%] px-2 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Marks
                    </th>

                    <th className="w-[9%] px-2 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Grade
                    </th>

                    <th className="w-[13%] px-2 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Score
                    </th>

                    <th className="w-[7%] px-2 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      View
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {paginatedResults.map(
                    (result, index) => {
                      const percentage =
                        getPercentage(
                          result
                        );

                      const status =
                        getPerformanceStatus(
                          result
                        );

                      const marks =
                        result.marks;

                      const maxMarks =
                        result.maxMarks;

                      return (
                        <tr
                          key={
                            result._id ||
                            result.id ||
                            index
                          }
                          className="transition hover:bg-slate-50"
                        >
                          {/* Student */}
                          <td className="px-3 py-3 sm:px-4">
                            <div className="min-w-0">
                              <p
                                className="truncate text-sm font-semibold text-slate-900"
                                title={getStudentName(
                                  result
                                )}
                              >
                                {getStudentName(
                                  result
                                )}
                              </p>

                              {getRollNumber(
                                result
                              ) && (
                                <p className="mt-0.5 truncate text-xs text-slate-500">
                                  Roll:{" "}
                                  {getRollNumber(
                                    result
                                  )}
                                </p>
                              )}
                            </div>
                          </td>

                          {/* Subject */}
                          <td className="px-2 py-3">
                            <span
                              className="block truncate text-sm text-slate-700"
                              title={getSubject(
                                result
                              )}
                            >
                              {getSubject(
                                result
                              )}
                            </span>
                          </td>

                          {/* Course */}
                          <td className="hidden px-2 py-3 text-sm text-slate-700 md:table-cell">
                            {getCourse(
                              result
                            )}
                          </td>

                          {/* Semester */}
                          <td className="hidden px-2 py-3 text-sm text-slate-700 lg:table-cell">
                            {getSemester(
                              result
                            )
                              ? `S${getSemester(
                                  result
                                )}`
                              : "—"}
                          </td>

                          {/* Marks */}
                          <td className="px-2 py-3 text-sm font-medium text-slate-800">
                            {marks !==
                              undefined &&
                            marks !== null &&
                            maxMarks !==
                              undefined &&
                            maxMarks !== null
                              ? `${marks}/${maxMarks}`
                              : "N/A"}
                          </td>

                          {/* Grade */}
                          <td className="px-2 py-3">
                            <span className="inline-flex rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
                              {getGrade(
                                result
                              )}
                            </span>
                          </td>

                          {/* Score */}
                          <td className="px-2 py-3">
                            {percentage ===
                            null ? (
                              <span className="text-xs font-medium text-slate-400">
                                N/A
                              </span>
                            ) : (
                              <div className="min-w-0">
                                <div className="mb-1 flex items-center justify-between gap-1">
                                  <span className="text-xs font-semibold text-slate-700">
                                    {Math.round(
                                      percentage
                                    )}
                                    %
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

                          {/* View */}
                          <td className="px-2 py-3 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                setViewItem(
                                  result
                                )
                              }
                              title="View details"
                              className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                            >
                              <span className="hidden lg:inline">
                                View
                              </span>

                              <span className="lg:hidden">
                                👁
                              </span>
                            </button>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Page {safePage} of{" "}
                {totalPages}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={safePage === 1}
                  onClick={() =>
                    setPage((current) =>
                      Math.max(
                        1,
                        current - 1
                      )
                    )
                  }
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                <span className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">
                  {safePage}
                </span>

                <button
                  type="button"
                  disabled={
                    safePage === totalPages
                  }
                  onClick={() =>
                    setPage((current) =>
                      Math.min(
                        totalPages,
                        current + 1
                      )
                    )
                  }
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* View Details Modal */}
      {viewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                    Performance Details
                  </p>

                  <h3 className="mt-1 truncate text-xl font-bold text-slate-900">
                    {getStudentName(
                      viewItem
                    )}
                  </h3>

                  {getRollNumber(
                    viewItem
                  ) && (
                    <p className="mt-1 text-sm text-slate-500">
                      Roll Number:{" "}
                      {getRollNumber(
                        viewItem
                      )}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setViewItem(null)
                  }
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="space-y-5 p-5 sm:p-6">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <InfoCard
                  label="Subject"
                  value={getSubject(
                    viewItem
                  )}
                />

                <InfoCard
                  label="Course"
                  value={getCourse(
                    viewItem
                  )}
                />

                <InfoCard
                  label="Semester"
                  value={
                    getSemester(
                      viewItem
                    )
                      ? `Semester ${getSemester(
                          viewItem
                        )}`
                      : "—"
                  }
                />

                <InfoCard
                  label="Grade"
                  value={getGrade(
                    viewItem
                  )}
                />
              </div>

              {/* Score */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      Overall Score
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Based on the recorded
                      marks.
                    </p>
                  </div>

                  <p className="text-2xl font-bold text-blue-600">
                    {getPercentage(
                      viewItem
                    ) === null
                      ? "N/A"
                      : `${Math.round(
                          getPercentage(
                            viewItem
                          )
                        )}%`}
                  </p>
                </div>

                {getPercentage(
                  viewItem
                ) !== null && (
                  <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{
                        width: `${getPercentage(
                          viewItem
                        )}%`,
                      }}
                    />
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    Marks
                  </span>

                  <span className="font-semibold text-slate-800">
                    {viewItem.marks !==
                      undefined &&
                    viewItem.marks !==
                      null &&
                    viewItem.maxMarks !==
                      undefined &&
                    viewItem.maxMarks !==
                      null
                      ? `${viewItem.marks}/${viewItem.maxMarks}`
                      : "N/A"}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    Status
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      getPerformanceStatus(
                        viewItem
                      ).className
                    }`}
                  >
                    {
                      getPerformanceStatus(
                        viewItem
                      ).label
                    }
                  </span>
                </div>
              </div>

              {/* Additional Details */}
              <div>
                <h4 className="mb-3 text-sm font-bold text-slate-900">
                  Academic Information
                </h4>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <InfoRow
                    label="Student"
                    value={getStudentName(
                      viewItem
                    )}
                  />

                  <InfoRow
                    label="Roll / Register No."
                    value={
                      getRollNumber(
                        viewItem
                      ) || "—"
                    }
                  />

                  <InfoRow
                    label="Course"
                    value={getCourse(
                      viewItem
                    )}
                  />

                  <InfoRow
                    label="Semester"
                    value={
                      getSemester(
                        viewItem
                      )
                        ? `Semester ${getSemester(
                            viewItem
                          )}`
                        : "—"
                    }
                  />

                  <InfoRow
                    label="Subject"
                    value={getSubject(
                      viewItem
                    )}
                  />

                  <InfoRow
                    label="Grade"
                    value={getGrade(
                      viewItem
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-end border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() =>
                    setViewItem(null)
                  }
                  className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* -----------------------------
   Summary Card
----------------------------- */

function SummaryCard({
  icon,
  label,
  value,
  description,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {description}
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xl">
          {icon}
        </div>
      </div>
    </div>
  );
}

/* -----------------------------
   Filter Select
----------------------------- */

function FilterSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  formatOption,
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-slate-600">
        {label}
      </label>

      <select
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      >
        <option value="">
          {placeholder}
        </option>

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

/* -----------------------------
   Info Card
----------------------------- */

function InfoCard({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p
        className="mt-1 truncate text-sm font-semibold text-slate-800"
        title={value}
      >
        {value || "—"}
      </p>
    </div>
  );
}

/* -----------------------------
   Info Row
----------------------------- */

function InfoRow({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p
        className="mt-1 truncate text-sm font-medium text-slate-800"
        title={value}
      >
        {value || "—"}
      </p>
    </div>
  );
}