import React, { useEffect, useMemo, useState } from "react";
import { get } from "../services/api";
import Loading from "../components/Loading";
import Empty from "../components/Empty";

const ITEMS_PER_PAGE = 7;

const COURSES = ["MCA", "MBA", "BCA", "BBA"];

const SEMESTERS = ["1", "2", "3", "4", "5", "6"];

function getId(value) {
  if (!value) return "";

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    return value;
  }

  return value._id || value.id || "";
}

function getArray(response, keys = []) {
  if (Array.isArray(response)) {
    return response;
  }

  for (const key of keys) {
    if (Array.isArray(response?.[key])) {
      return response[key];
    }
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  return [];
}

function getGrade(percentage) {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B+";
  if (percentage >= 60) return "B";
  if (percentage >= 50) return "C";
  if (percentage >= 40) return "D";
  return "F";
}

function getGradeClass(grade) {
  if (grade === "A+" || grade === "A") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (grade === "B+" || grade === "B") {
    return "bg-blue-100 text-blue-700";
  }

  if (grade === "C" || grade === "D") {
    return "bg-amber-100 text-amber-700";
  }

  return "bg-red-100 text-red-700";
}

function getStudentCourse(student) {
  return (
    student?.course ||
    student?.program ||
    student?.department ||
    ""
  );
}

function getStudentSemester(student) {
  return (
    student?.semester ||
    student?.currentSemester ||
    ""
  );
}

export default function Results() {
  const [results, setResults] = useState([]);
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [course, setCourse] = useState("MCA");
  const [semester, setSemester] = useState("1");
  const [exam, setExam] = useState("");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [
        resultsResponse,
        studentsResponse,
        examsResponse,
      ] = await Promise.all([
        get("/results"),
        get("/students"),
        get("/exams"),
      ]);

      setResults(
        getArray(resultsResponse, ["results"])
      );

      setStudents(
        getArray(studentsResponse, ["students"])
      );

      setExams(
        getArray(examsResponse, [
          "exams",
          "examinations",
        ])
      );
    } catch (err) {
      setError(
        err.message ||
          "Unable to load examination results."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  /* =====================================================
     EXAMS FOR SELECTED COURSE + SEMESTER
  ===================================================== */

  const availableExams = useMemo(() => {
    return exams.filter((item) => {
      const courseMatch =
        String(item.course || "")
          .toLowerCase() ===
        String(course).toLowerCase();

      const semesterMatch =
        String(item.semester || "") ===
        String(semester);

      return courseMatch && semesterMatch;
    });
  }, [exams, course, semester]);

  /* =====================================================
     STUDENTS
  ===================================================== */

  const semesterStudents = useMemo(() => {
    return students.filter((student) => {
      const studentCourse =
        getStudentCourse(student);

      const studentSemester =
        getStudentSemester(student);

      const courseMatch =
        !studentCourse ||
        String(studentCourse).toLowerCase() ===
          String(course).toLowerCase();

      const semesterMatch =
        !studentSemester ||
        String(studentSemester) ===
          String(semester);

      return courseMatch && semesterMatch;
    });
  }, [students, course, semester]);

  /* =====================================================
     SELECTED EXAM RESULTS
  ===================================================== */

  const selectedResults = useMemo(() => {
    if (!exam) return [];

    return results.filter(
      (result) =>
        String(getId(result.exam)) ===
        String(exam)
    );
  }, [results, exam]);

  /* =====================================================
     SEARCH
  ===================================================== */

  const filteredStudents = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    if (!query) {
      return semesterStudents;
    }

    return semesterStudents.filter(
      (student) =>
        [
          student.name,
          student.rollNo,
          student.registerNo,
          student.email,
          student.phone,
          student.mobile,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query)
    );
  }, [
    semesterStudents,
    search,
  ]);

  /* =====================================================
     PAGINATION
  ===================================================== */

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredStudents.length /
        ITEMS_PER_PAGE
    )
  );

  const paginatedStudents = useMemo(() => {
    const start =
      (page - 1) *
      ITEMS_PER_PAGE;

    return filteredStudents.slice(
      start,
      start + ITEMS_PER_PAGE
    );
  }, [
    filteredStudents,
    page,
  ]);

  useEffect(() => {
    setPage(1);
  }, [
    course,
    semester,
    exam,
    search,
  ]);

  /* =====================================================
     RESULT HELPERS
  ===================================================== */

  function getStudentResults(studentId) {
    return selectedResults.filter(
      (result) =>
        String(getId(result.student)) ===
        String(studentId)
    );
  }

  function getStudentTotal(studentId) {
    return getStudentResults(
      studentId
    ).reduce(
      (total, result) =>
        total +
        (Number(result.marks) || 0),
      0
    );
  }

  function getStudentMaxMarks(studentId) {
    return getStudentResults(
      studentId
    ).reduce(
      (total, result) =>
        total +
        (Number(result.maxMarks) || 100),
      0
    );
  }

  function getStudentPercentage(studentId) {
    const total =
      getStudentTotal(studentId);

    const max =
      getStudentMaxMarks(studentId);

    if (!max) return 0;

    return (total / max) * 100;
  }

  function getStudentGrade(studentId) {
    return getGrade(
      getStudentPercentage(studentId)
    );
  }

  function isPublished(studentId) {
    const studentResults =
      getStudentResults(studentId);

    if (!studentResults.length) {
      return false;
    }

    return studentResults.every(
      (result) =>
        result.published === true
    );
  }

  const selectedExamObject = exams.find(
    (item) =>
      String(getId(item)) ===
      String(exam)
  );

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="p-6">
        <Loading message="Loading results..." />
      </div>
    );
  }

  /* =====================================================
     UI
  ===================================================== */

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div className="
        flex flex-col gap-4
        sm:flex-row
        sm:items-center
        sm:justify-between
      ">
        <div>
          <h2 className="
            text-2xl font-bold
            text-slate-900
          ">
            Marks & Results
          </h2>

          <p className="
            mt-1 text-sm
            text-slate-500
          ">
            View examination results for your students.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          className="
            rounded-lg
            border border-slate-200
            bg-white
            px-4 py-2.5
            text-sm font-medium
            text-slate-700
            shadow-sm
            hover:bg-slate-50
          "
        >
          ↻ Refresh
        </button>
      </div>

      {/* ERROR */}

      {error && (
        <div className="
          rounded-lg
          border border-red-200
          bg-red-50
          px-4 py-3
          text-sm text-red-700
        ">
          {error}
        </div>
      )}

      {/* FILTERS */}

      <div className="
        rounded-xl
        border border-slate-200
        bg-white
        p-5
        shadow-sm
      ">
        <div className="
          grid grid-cols-1
          gap-4
          md:grid-cols-3
        ">

          <div>
            <label className="
              mb-1.5 block
              text-sm font-medium
              text-slate-700
            ">
              Course
            </label>

            <select
              value={course}
              onChange={(e) =>
                setCourse(e.target.value)
              }
              className="
                w-full rounded-lg
                border border-slate-200
                bg-white
                px-3 py-2.5
                text-sm
                outline-none
                focus:border-slate-400
              "
            >
              {COURSES.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label className="
              mb-1.5 block
              text-sm font-medium
              text-slate-700
            ">
              Semester
            </label>

            <select
              value={semester}
              onChange={(e) =>
                setSemester(e.target.value)
              }
              className="
                w-full rounded-lg
                border border-slate-200
                bg-white
                px-3 py-2.5
                text-sm
                outline-none
                focus:border-slate-400
              "
            >
              {SEMESTERS.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    Semester {item}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label className="
              mb-1.5 block
              text-sm font-medium
              text-slate-700
            ">
              Examination
            </label>

            <select
              value={exam}
              onChange={(e) =>
                setExam(e.target.value)
              }
              className="
                w-full rounded-lg
                border border-slate-200
                bg-white
                px-3 py-2.5
                text-sm
                outline-none
                focus:border-slate-400
              "
            >
              <option value="">
                Select Examination
              </option>

              {availableExams.map(
                (item) => (
                  <option
                    key={getId(item)}
                    value={getId(item)}
                  >
                    {item.name}
                  </option>
                )
              )}
            </select>
          </div>

        </div>

        {selectedExamObject && (
          <div className="
            mt-4
            rounded-lg
            border border-blue-100
            bg-blue-50
            px-4 py-3
          ">
            <p className="
              text-sm font-semibold
              text-blue-900
            ">
              {selectedExamObject.name}
            </p>

            <p className="
              mt-1 text-xs
              text-blue-700
            ">
              {course} • Semester{" "}
              {semester}
            </p>
          </div>
        )}
      </div>

      {!exam ? (
        <div className="
          rounded-xl
          border border-slate-200
          bg-white
          p-12
          text-center
          shadow-sm
        ">
          <div className="text-5xl">
            🏆
          </div>

          <h3 className="
            mt-4
            text-lg font-bold
            text-slate-900
          ">
            Select an examination
          </h3>

          <p className="
            mx-auto mt-2
            max-w-md
            text-sm text-slate-500
          ">
            Select a course, semester and examination
            to view your students' results.
          </p>
        </div>
      ) : (
        <>
          {/* SUMMARY */}

          <div className="
            grid grid-cols-1
            gap-4
            sm:grid-cols-2
            lg:grid-cols-4
          ">
            <SummaryCard
              title="Students"
              value={
                semesterStudents.length
              }
              icon="👨‍🎓"
            />

            <SummaryCard
              title="Results Entered"
              value={
                semesterStudents.filter(
                  (student) =>
                    getStudentResults(
                      getId(student)
                    ).length > 0
                ).length
              }
              icon="📝"
            />

            <SummaryCard
              title="Published"
              value={
                semesterStudents.filter(
                  (student) =>
                    isPublished(
                      getId(student)
                    )
                ).length
              }
              icon="✅"
            />

            <SummaryCard
              title="Pending"
              value={
                semesterStudents.filter(
                  (student) =>
                    !isPublished(
                      getId(student)
                    )
                ).length
              }
              icon="⏳"
            />
          </div>

          {/* SEARCH */}

          <div className="
            rounded-xl
            border border-slate-200
            bg-white
            p-4
            shadow-sm
          ">
            <div className="relative">
              <span className="
                pointer-events-none
                absolute left-3 top-1/2
                -translate-y-1/2
                text-slate-400
              ">
                🔍
              </span>

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search student or roll number..."
                className="
                  w-full rounded-lg
                  border border-slate-200
                  bg-slate-50
                  py-2.5 pl-10 pr-4
                  text-sm
                  outline-none
                  focus:border-slate-400
                  focus:bg-white
                "
              />
            </div>
          </div>

          {/* RESULTS */}

          <div className="
            overflow-hidden
            rounded-xl
            border border-slate-200
            bg-white
            shadow-sm
          ">
            <div className="
              border-b
              border-slate-200
              px-5 py-4
            ">
              <h3 className="
                font-semibold
                text-slate-900
              ">
                {course} — Semester{" "}
                {semester}
              </h3>

              <p className="
                mt-1 text-xs
                text-slate-500
              ">
                Faculty view • Results are managed and
                published by Admin.
              </p>
            </div>

            {!semesterStudents.length ? (
              <div className="p-10">
                <Empty
                  title="No students found"
                  message="There are no students in this course and semester."
                />
              </div>
            ) : (
              <div className="
                w-full
                overflow-hidden
              ">
                <table className="
                  w-full
                  table-fixed
                ">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="
                        w-[22%]
                        px-4 py-3
                        text-left
                        text-xs
                        font-semibold
                        uppercase
                        tracking-wide
                        text-slate-500
                      ">
                        Student
                      </th>

                      <th className="
                        w-[12%]
                        px-4 py-3
                        text-left
                        text-xs
                        font-semibold
                        uppercase
                        tracking-wide
                        text-slate-500
                      ">
                        Roll No.
                      </th>

                      <th className="
                        w-[12%]
                        px-4 py-3
                        text-center
                        text-xs
                        font-semibold
                        uppercase
                        tracking-wide
                        text-slate-500
                      ">
                        Subjects
                      </th>

                      <th className="
                        w-[14%]
                        px-4 py-3
                        text-center
                        text-xs
                        font-semibold
                        uppercase
                        tracking-wide
                        text-slate-500
                      ">
                        Total
                      </th>

                      <th className="
                        w-[14%]
                        px-4 py-3
                        text-center
                        text-xs
                        font-semibold
                        uppercase
                        tracking-wide
                        text-slate-500
                      ">
                        Percentage
                      </th>

                      <th className="
                        w-[10%]
                        px-4 py-3
                        text-center
                        text-xs
                        font-semibold
                        uppercase
                        tracking-wide
                        text-slate-500
                      ">
                        Grade
                      </th>

                      <th className="
                        w-[16%]
                        px-4 py-3
                        text-center
                        text-xs
                        font-semibold
                        uppercase
                        tracking-wide
                        text-slate-500
                      ">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody className="
                    divide-y
                    divide-slate-100
                  ">
                    {paginatedStudents.map(
                      (student, index) => {
                        const id =
                          getId(student) ||
                          index;

                        const studentResults =
                          getStudentResults(
                            id
                          );

                        const total =
                          getStudentTotal(id);

                        const max =
                          getStudentMaxMarks(
                            id
                          );

                        const percentage =
                          getStudentPercentage(
                            id
                          );

                        const grade =
                          getStudentGrade(id);

                        const published =
                          isPublished(id);

                        return (
                          <tr
                            key={id}
                            className="
                              hover:bg-slate-50
                            "
                          >
                            <td className="
                              px-4 py-4
                            ">
                              <div className="
                                truncate
                                text-sm
                                font-semibold
                                text-slate-900
                              ">
                                {student.name ||
                                  "Unnamed Student"}
                              </div>

                              <div className="
                                truncate
                                text-xs
                                text-slate-400
                              ">
                                {student.email ||
                                  "-"}
                              </div>
                            </td>

                            <td className="
                              truncate
                              px-4 py-4
                              text-sm
                              text-slate-600
                            ">
                              {student.rollNo ||
                                student.registerNo ||
                                "-"}
                            </td>

                            <td className="
                              px-4 py-4
                              text-center
                            ">
                              <span className="
                                font-semibold
                                text-slate-700
                              ">
                                {
                                  studentResults.length
                                }
                              </span>
                            </td>

                            <td className="
                              px-4 py-4
                              text-center
                            ">
                              <span className="
                                font-bold
                                text-slate-900
                              ">
                                {total}
                              </span>

                              <span className="
                                text-xs
                                text-slate-400
                              ">
                                /{max}
                              </span>
                            </td>

                            <td className="
                              px-4 py-4
                              text-center
                            ">
                              <span className="
                                font-bold
                                text-slate-900
                              ">
                                {percentage.toFixed(
                                  1
                                )}
                                %
                              </span>
                            </td>

                            <td className="
                              px-4 py-4
                              text-center
                            ">
                              <span
                                className={`
                                  inline-flex
                                  rounded-full
                                  px-2.5 py-1
                                  text-xs
                                  font-bold
                                  ${getGradeClass(
                                    grade
                                  )}
                                `}
                              >
                                {grade}
                              </span>
                            </td>

                            <td className="
                              px-4 py-4
                              text-center
                            ">
                              <span
                                className={`
                                  inline-flex
                                  rounded-full
                                  px-2.5 py-1
                                  text-xs
                                  font-semibold
                                  ${
                                    published
                                      ? "bg-emerald-100 text-emerald-700"
                                      : "bg-amber-100 text-amber-700"
                                  }
                                `}
                              >
                                {published
                                  ? "Published"
                                  : "Not Published"}
                              </span>
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* PAGINATION */}

          {totalPages > 1 && (
            <div className="
              flex flex-col gap-3
              rounded-xl
              border border-slate-200
              bg-white
              p-4
              shadow-sm
              sm:flex-row
              sm:items-center
              sm:justify-between
            ">
              <p className="
                text-sm
                text-slate-500
              ">
                Showing{" "}
                <strong>
                  {(page - 1) *
                    ITEMS_PER_PAGE +
                    1}
                </strong>{" "}
                to{" "}
                <strong>
                  {Math.min(
                    page *
                      ITEMS_PER_PAGE,
                    filteredStudents.length
                  )}
                </strong>{" "}
                of{" "}
                <strong>
                  {filteredStudents.length}
                </strong>
              </p>

              <div className="
                flex items-center gap-2
              ">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() =>
                    setPage(
                      (current) =>
                        Math.max(
                          1,
                          current - 1
                        )
                    )
                  }
                  className="
                    rounded-lg
                    border
                    border-slate-200
                    px-3 py-2
                    text-sm
                    text-slate-600
                    hover:bg-slate-50
                    disabled:opacity-40
                  "
                >
                  Previous
                </button>

                <span className="
                  rounded-lg
                  bg-slate-900
                  px-3 py-2
                  text-sm
                  font-medium
                  text-white
                ">
                  {page} / {totalPages}
                </span>

                <button
                  type="button"
                  disabled={
                    page === totalPages
                  }
                  onClick={() =>
                    setPage(
                      (current) =>
                        Math.min(
                          totalPages,
                          current + 1
                        )
                    )
                  }
                  className="
                    rounded-lg
                    border
                    border-slate-200
                    px-3 py-2
                    text-sm
                    text-slate-600
                    hover:bg-slate-50
                    disabled:opacity-40
                  "
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

/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  title,
  value,
  icon,
}) {
  return (
    <div className="
      rounded-xl
      border border-slate-200
      bg-white
      p-5
      shadow-sm
    ">
      <div className="
        flex items-center
        justify-between
      ">
        <div>
          <p className="
            text-sm
            text-slate-500
          ">
            {title}
          </p>

          <p className="
            mt-1
            text-2xl
            font-bold
            text-slate-900
          ">
            {value}
          </p>
        </div>

        <div className="
          flex h-11 w-11
          items-center justify-center
          rounded-xl
          bg-slate-100
          text-xl
        ">
          {icon}
        </div>
      </div>
    </div>
  );
}