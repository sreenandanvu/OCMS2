import React, { useEffect, useMemo, useState } from "react";
import { get } from "../services/api";
import Loading from "../components/Loading";
import Empty from "../components/Empty";

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

function formatDate(date) {
  if (!date) return "Date TBA";

  const value = new Date(
    `${String(date).slice(0, 10)}T00:00:00`
  );

  if (Number.isNaN(value.getTime())) {
    return String(date).slice(0, 10);
  }

  return value.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
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

  if (grade === "F") {
    return "bg-red-100 text-red-700";
  }

  return "bg-slate-100 text-slate-600";
}

export default function Exams() {
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [student, setStudent] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loggedUser = useMemo(() => {
    try {
      return JSON.parse(
        localStorage.getItem("ocms_user") || "null"
      );
    } catch {
      return null;
    }
  }, []);

  /* =====================================================
     LOAD DATA
  ===================================================== */

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [
        studentsResponse,
        examsResponse,
        resultsResponse,
      ] = await Promise.all([
        get("/students"),
        get("/exams"),
        get("/results"),
      ]);

      const studentData = getArray(
        studentsResponse,
        ["students"]
      );

      const examData = getArray(
        examsResponse,
        ["exams", "examinations"]
      );

      const resultData = getArray(
        resultsResponse,
        ["results"]
      );

      /* =================================================
         FIND LOGGED-IN STUDENT
      ================================================= */

      const currentStudent =
        studentData.find((item) => {
          const sameId =
            loggedUser?.studentId &&
            String(getId(item)) ===
              String(loggedUser.studentId);

          const sameEmail =
            loggedUser?.email &&
            item.email &&
            String(item.email).toLowerCase() ===
              String(loggedUser.email).toLowerCase();

          const sameName =
            loggedUser?.name &&
            item.name &&
            String(item.name).toLowerCase() ===
              String(loggedUser.name).toLowerCase();

          return (
            sameId ||
            sameEmail ||
            sameName
          );
        }) || null;

      if (!currentStudent) {
        throw new Error(
          "Unable to identify your student account."
        );
      }

      setStudent(currentStudent);
      setExams(examData);
      setResults(resultData);
    } catch (err) {
      setError(
        err.message ||
          "Unable to load examinations and results."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  /* =====================================================
     STUDENT COURSE + SEMESTER
  ===================================================== */

  const studentCourse =
    student?.course ||
    student?.program ||
    student?.department ||
    "";

  const studentSemester =
    student?.semester ||
    student?.currentSemester ||
    "";

  /* =====================================================
     ONLY MY EXAMS
  ===================================================== */

  const myExams = useMemo(() => {
    if (!student) return [];

    return exams.filter((exam) => {
      const examCourse =
        exam.course || "";

      const examSemester =
        exam.semester || "";

      const courseMatches =
        !studentCourse ||
        !examCourse ||
        String(examCourse).toLowerCase() ===
          String(studentCourse).toLowerCase();

      const semesterMatches =
        !studentSemester ||
        !examSemester ||
        String(examSemester) ===
          String(studentSemester);

      return (
        courseMatches &&
        semesterMatches
      );
    });
  }, [
    exams,
    student,
    studentCourse,
    studentSemester,
  ]);

  /* =====================================================
     ONLY MY PUBLISHED RESULTS
  ===================================================== */

  const myResults = useMemo(() => {
    if (!student) return [];

    const studentId = getId(student);

    return results.filter((result) => {
      const resultStudent =
        result.student;

      let belongsToStudent = false;

      /*
       * Preferred:
       * result.student contains the Student _id
       */
      if (
        resultStudent &&
        typeof resultStudent === "object"
      ) {
        belongsToStudent =
          String(
            getId(resultStudent)
          ) === String(studentId);
      } else {
        belongsToStudent =
          String(resultStudent) ===
          String(studentId);
      }

      /*
       * Some older result records may store
       * studentName / studentEmail instead.
       * These are checked against the CURRENT
       * student only.
       */
      if (!belongsToStudent) {
        const sameName =
          result.studentName &&
          student.name &&
          String(
            result.studentName
          ).toLowerCase() ===
            String(student.name).toLowerCase();

        const sameEmail =
          result.studentEmail &&
          student.email &&
          String(
            result.studentEmail
          ).toLowerCase() ===
            String(student.email).toLowerCase();

        const sameRoll =
          result.rollNo &&
          (
            student.rollNo ||
            student.registerNo
          ) &&
          String(result.rollNo) ===
            String(
              student.rollNo ||
                student.registerNo
            );

        belongsToStudent =
          sameName ||
          sameEmail ||
          sameRoll;
      }

      /*
       * IMPORTANT:
       * Student can see ONLY published results.
       */
      return (
        belongsToStudent &&
        result.published === true
      );
    });
  }, [
    results,
    student,
  ]);

  /* =====================================================
     RESULT EXAM NAME
  ===================================================== */

  function getResultExamName(result) {
    if (
      result.exam &&
      typeof result.exam === "object"
    ) {
      return (
        result.exam.name ||
        "Examination"
      );
    }

    const exam = exams.find(
      (item) =>
        String(getId(item)) ===
        String(getId(result.exam))
    );

    return (
      exam?.name ||
      result.examName ||
      "Examination"
    );
  }

  /* =====================================================
     RESULT PERCENTAGE
  ===================================================== */

  function getPercentage(result) {
    const marks =
      Number(result.marks) || 0;

    const maxMarks =
      Number(result.maxMarks) || 100;

    if (!maxMarks) return 0;

    return (
      (marks / maxMarks) *
      100
    );
  }

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="p-6">
        <Loading message="Loading examinations..." />
      </div>
    );
  }

  /* =====================================================
     ERROR
  ===================================================== */

  if (error) {
    return (
      <div className="
        m-6
        rounded-xl
        border border-red-200
        bg-red-50
        p-4
        text-sm
        text-red-700
      ">
        <p>{error}</p>

        <button
          type="button"
          onClick={loadData}
          className="
            mt-3
            rounded-lg
            bg-red-600
            px-4 py-2
            text-sm font-semibold
            text-white
            hover:bg-red-700
          "
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* =================================================
          HEADER
      ================================================= */}

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
            Exams & Results
          </h2>

          <p className="
            mt-1 text-sm
            text-slate-500
          ">
            Your examination schedule and published results.
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

      {/* =================================================
          STUDENT INFO
      ================================================= */}

      {student && (
        <div className="
          rounded-xl
          border border-slate-200
          bg-white
          p-5
          shadow-sm
        ">
          <div className="
            flex flex-col gap-3
            sm:flex-row
            sm:items-center
            sm:justify-between
          ">
            <div>
              <p className="
                text-xs
                font-medium
                uppercase
                tracking-wide
                text-slate-400
              ">
                Student
              </p>

              <h3 className="
                mt-1
                text-lg font-bold
                text-slate-900
              ">
                {student.name}
              </h3>

              <p className="
                mt-1
                text-sm
                text-slate-500
              ">
                {student.rollNo ||
                  student.registerNo ||
                  "-"}
              </p>
            </div>

            <div className="
              rounded-lg
              bg-slate-50
              px-4 py-3
              text-sm
              text-slate-600
            ">
              <span className="font-semibold">
                {studentCourse || "-"}
              </span>

              {" • "}

              Semester{" "}
              <span className="font-semibold">
                {studentSemester || "-"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* =================================================
          EXAMINATION SCHEDULE
      ================================================= */}

      <section className="
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
          <div>
            <h3 className="
              text-lg font-bold
              text-slate-900
            ">
              Examination Schedule
            </h3>

            <p className="
              mt-1 text-sm
              text-slate-500
            ">
              Examinations for your course and semester.
            </p>
          </div>
        </div>

        {!myExams.length ? (
          <div className="p-10">
            <Empty
              title="No examinations available"
              message="There are currently no examinations scheduled for your course and semester."
            />
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {myExams.map(
              (exam, index) => {
                const published =
                  exam.published !== false;

                return (
                  <div
                    key={
                      getId(exam) ||
                      index
                    }
                    className="
                      flex flex-col
                      gap-4
                      p-5
                      transition
                      hover:bg-slate-50
                      sm:flex-row
                      sm:items-center
                    "
                  >

                    {/* DATE */}

                    <div className="
                      flex
                      h-16 w-16
                      shrink-0
                      flex-col
                      items-center
                      justify-center
                      rounded-xl
                      bg-slate-900
                      text-white
                    ">
                      <span className="
                        text-xl
                        font-bold
                      ">
                        {exam.date
                          ? new Date(
                              `${String(
                                exam.date
                              ).slice(
                                0,
                                10
                              )}T00:00:00`
                            ).getDate()
                          : "--"}
                      </span>

                      <span className="
                        text-xs
                        uppercase
                      ">
                        {exam.date
                          ? new Date(
                              `${String(
                                exam.date
                              ).slice(
                                0,
                                10
                              )}T00:00:00`
                            ).toLocaleDateString(
                              "en-IN",
                              {
                                month:
                                  "short",
                              }
                            )
                          : ""}
                      </span>
                    </div>

                    {/* INFO */}

                    <div className="
                      min-w-0
                      flex-1
                    ">
                      <h4 className="
                        truncate
                        text-base
                        font-bold
                        text-slate-900
                      ">
                        {exam.name ||
                          "Examination"}
                      </h4>

                      <p className="
                        mt-1
                        text-sm
                        text-slate-500
                      ">
                        {exam.course ||
                          studentCourse ||
                          "-"}
                        {" • "}
                        Semester{" "}
                        {exam.semester ||
                          studentSemester ||
                          "-"}
                      </p>

                      <p className="
                        mt-1
                        text-sm
                        text-slate-500
                      ">
                        {formatDate(
                          exam.date
                        )}
                        {" • "}
                        {exam.startTime ||
                          "Time TBA"}
                        {" - "}
                        {exam.endTime ||
                          "TBA"}
                        {" • Room "}
                        {exam.room ||
                          "TBA"}
                      </p>
                    </div>

                    {/* STATUS */}

                    <span
                      className={`
                        inline-flex
                        w-fit
                        rounded-full
                        px-3 py-1.5
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
                  </div>
                );
              }
            )}
          </div>
        )}
      </section>

      {/* =================================================
          MY RESULTS
      ================================================= */}

      <section className="
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
          <div>
            <h3 className="
              text-lg font-bold
              text-slate-900
            ">
              My Results
            </h3>

            <p className="
              mt-1 text-sm
              text-slate-500
            ">
              Only your published examination results are shown.
            </p>
          </div>
        </div>

        {!myResults.length ? (
          <div className="p-10">
            <Empty
              title="No published results"
              message="Your results will appear here after the Admin publishes them."
            />
          </div>
        ) : (
          <div className="
            grid grid-cols-1
            gap-4
            p-5
            md:grid-cols-2
          ">
            {myResults.map(
              (result, index) => {
                const percentage =
                  getPercentage(
                    result
                  );

                const grade =
                  result.grade ||
                  getGrade(
                    percentage
                  );

                return (
                  <div
                    key={
                      getId(result) ||
                      index
                    }
                    className="
                      rounded-xl
                      border
                      border-slate-200
                      bg-slate-50
                      p-5
                    "
                  >
                    {/* RESULT HEADER */}

                    <div className="
                      flex items-start
                      justify-between
                      gap-3
                    ">
                      <div className="min-w-0">
                        <p className="
                          text-xs
                          font-medium
                          uppercase
                          tracking-wide
                          text-slate-400
                        ">
                          {getResultExamName(
                            result
                          )}
                        </p>

                        <h4 className="
                          mt-1
                          truncate
                          text-lg
                          font-bold
                          text-slate-900
                        ">
                          {result.subject ||
                            "-"}
                        </h4>
                      </div>

                      <span
                        className={`
                          shrink-0
                          rounded-full
                          px-3 py-1
                          text-sm
                          font-bold
                          ${getGradeClass(
                            grade
                          )}
                        `}
                      >
                        {grade}
                      </span>
                    </div>

                    {/* MARKS */}

                    <div className="
                      mt-5
                      grid grid-cols-2
                      gap-3
                    ">
                      <div className="
                        rounded-lg
                        bg-white
                        p-3
                      ">
                        <p className="
                          text-xs
                          text-slate-400
                        ">
                          Internal
                        </p>

                        <p className="
                          mt-1
                          text-lg
                          font-bold
                          text-slate-900
                        ">
                          {result.internal ??
                            "-"}
                        </p>
                      </div>

                      <div className="
                        rounded-lg
                        bg-white
                        p-3
                      ">
                        <p className="
                          text-xs
                          text-slate-400
                        ">
                          Marks
                        </p>

                        <p className="
                          mt-1
                          text-lg
                          font-bold
                          text-slate-900
                        ">
                          {result.marks ??
                            "-"}
                          {" / "}
                          {result.maxMarks ??
                            100}
                        </p>
                      </div>

                      <div className="
                        rounded-lg
                        bg-white
                        p-3
                      ">
                        <p className="
                          text-xs
                          text-slate-400
                        ">
                          Percentage
                        </p>

                        <p className="
                          mt-1
                          text-lg
                          font-bold
                          text-slate-900
                        ">
                          {percentage.toFixed(
                            1
                          )}
                          %
                        </p>
                      </div>

                      <div className="
                        rounded-lg
                        bg-white
                        p-3
                      ">
                        <p className="
                          text-xs
                          text-slate-400
                        ">
                          Grade Point
                        </p>

                        <p className="
                          mt-1
                          text-lg
                          font-bold
                          text-slate-900
                        ">
                          {result.gradePoint ??
                            "-"}
                        </p>
                      </div>
                    </div>

                    {/* PUBLISHED */}

                    <div className="
                      mt-4
                      flex items-center
                      justify-between
                      border-t
                      border-slate-200
                      pt-4
                    ">
                      <span className="
                        text-xs
                        text-slate-400
                      ">
                        Result Status
                      </span>

                      <span className="
                        rounded-full
                        bg-emerald-100
                        px-3 py-1
                        text-xs
                        font-semibold
                        text-emerald-700
                      ">
                        Published
                      </span>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </section>
    </div>
  );
}