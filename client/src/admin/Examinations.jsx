import React, { useEffect, useMemo, useState } from "react";
import { get, post, put, patch, remove } from "../services/api";
import Loading from "../components/Loading";
import Empty from "../components/Empty";

const ITEMS_PER_PAGE = 7;

const COURSES = ["MCA", "MBA", "BCA", "BBA"];

const SEMESTERS = ["1", "2", "3", "4", "5", "6"];

const EXAM_STATUSES = [
  "Scheduled",
  "Upcoming",
  "Completed",
  "Cancelled",
];

const EMPTY_EXAM = {
  name: "",
  course: "MCA",
  semester: "1",
  date: "",
  status: "Scheduled",
};

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
  if (!date) return "-";

  const d = new Date(`${String(date).slice(0, 10)}T00:00:00`);

  if (Number.isNaN(d.getTime())) {
    return String(date).slice(0, 10);
  }

  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
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

const inputClass = `
  w-full rounded-lg
  border border-slate-200
  bg-white px-3 py-2.5
  text-sm text-slate-900
  outline-none
  focus:border-slate-400
  focus:ring-2 focus:ring-slate-100
`;

/* =========================================================
   MAIN
========================================================= */

export default function Examinations() {
  const [tab, setTab] = useState("exams");

  /* =====================================================
     EXAMS
  ===================================================== */

  const [exams, setExams] = useState([]);
  const [examLoading, setExamLoading] = useState(true);
  const [examError, setExamError] = useState("");

  const [examSearch, setExamSearch] = useState("");
  const [examPage, setExamPage] = useState(1);

  const [showExamModal, setShowExamModal] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [deleteExam, setDeleteExam] = useState(null);
  const [examSaving, setExamSaving] = useState(false);

  const [examForm, setExamForm] = useState({
    ...EMPTY_EXAM,
  });

  const [examFormError, setExamFormError] = useState("");

  /* =====================================================
     SEMESTER RESULTS
  ===================================================== */

  const [students, setStudents] = useState([]);
  const [results, setResults] = useState([]);

  const [resultLoading, setResultLoading] = useState(false);
  const [resultError, setResultError] = useState("");

  const [selectedCourse, setSelectedCourse] = useState("MCA");
  const [selectedSemester, setSelectedSemester] = useState("1");
  const [selectedExam, setSelectedExam] = useState("");

  const [resultSearch, setResultSearch] = useState("");
  const [resultPage, setResultPage] = useState(1);

  const [resultSaving, setResultSaving] = useState(false);

  const [publishLoading, setPublishLoading] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);

  /* =====================================================
     LOAD EXAMS
  ===================================================== */

  async function loadExams() {
    try {
      setExamLoading(true);
      setExamError("");

      const response = await get("/exams");

      const data = getArray(response, [
        "exams",
        "examinations",
      ]);

      setExams(data);
    } catch (error) {
      setExamError(
        error.message || "Unable to load examinations."
      );
    } finally {
      setExamLoading(false);
    }
  }

  /* =====================================================
     LOAD STUDENTS
  ===================================================== */

  async function loadStudents() {
    try {
      const response = await get("/students");

      const data = getArray(response, ["students"]);

      setStudents(data);
    } catch (error) {
      setResultError(
        error.message || "Unable to load students."
      );
    }
  }

  /* =====================================================
     LOAD RESULTS
  ===================================================== */

  async function loadResults() {
    try {
      setResultLoading(true);
      setResultError("");

      const response = await get("/results");

      const data = getArray(response, ["results"]);

      setResults(data);
    } catch (error) {
      setResultError(
        error.message || "Unable to load results."
      );
    } finally {
      setResultLoading(false);
    }
  }

  useEffect(() => {
    loadExams();
    loadStudents();
  }, []);

  useEffect(() => {
    if (tab === "results") {
      loadResults();
    }
  }, [tab]);

  /* =====================================================
     EXAM FILTERING
  ===================================================== */

  const filteredExams = useMemo(() => {
    const query = examSearch.trim().toLowerCase();

    if (!query) return exams;

    return exams.filter((exam) =>
      [
        exam.name,
        exam.course,
        exam.semester,
        exam.date,
        exam.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [exams, examSearch]);

  const examTotalPages = Math.max(
    1,
    Math.ceil(filteredExams.length / ITEMS_PER_PAGE)
  );

  const paginatedExams = useMemo(() => {
    const start = (examPage - 1) * ITEMS_PER_PAGE;

    return filteredExams.slice(
      start,
      start + ITEMS_PER_PAGE
    );
  }, [filteredExams, examPage]);

  useEffect(() => {
    if (examPage > examTotalPages) {
      setExamPage(examTotalPages);
    }
  }, [examPage, examTotalPages]);

  /* =====================================================
     SELECTED EXAM
  ===================================================== */

  const selectedExamObject = useMemo(() => {
    return exams.find(
      (exam) =>
        String(getId(exam)) === String(selectedExam)
    );
  }, [exams, selectedExam]);

  /* =====================================================
     AVAILABLE EXAMS FOR COURSE + SEMESTER
  ===================================================== */

  const semesterExams = useMemo(() => {
    return exams.filter((exam) => {
      const courseMatch =
        String(exam.course || "MCA").toLowerCase() ===
        String(selectedCourse).toLowerCase();

      const semesterMatch =
        String(exam.semester || "1") ===
        String(selectedSemester);

      return courseMatch && semesterMatch;
    });
  }, [
    exams,
    selectedCourse,
    selectedSemester,
  ]);

  /* =====================================================
     STUDENTS OF SELECTED SEMESTER
  ===================================================== */

  const semesterStudents = useMemo(() => {
    return students.filter((student) => {
      const course =
        student.course ||
        student.program ||
        student.department ||
        "";

      const semester =
        student.semester ||
        student.currentSemester ||
        "";

      const courseMatch =
        !course ||
        String(course).toLowerCase() ===
          String(selectedCourse).toLowerCase();

      const semesterMatch =
        !semester ||
        String(semester) ===
          String(selectedSemester);

      return courseMatch && semesterMatch;
    });
  }, [
    students,
    selectedCourse,
    selectedSemester,
  ]);

  /* =====================================================
     RESULTS FOR SELECTED SEMESTER + EXAM
  ===================================================== */

  const semesterResults = useMemo(() => {
    if (!selectedExam) return [];

    return results.filter((result) => {
      const resultExamId = getId(result.exam);

      return (
        String(resultExamId) ===
        String(selectedExam)
      );
    });
  }, [results, selectedExam]);

  /* =====================================================
     SEARCH STUDENTS
  ===================================================== */

  const filteredStudents = useMemo(() => {
    const query =
      resultSearch.trim().toLowerCase();

    if (!query) {
      return semesterStudents;
    }

    return semesterStudents.filter((student) =>
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
    resultSearch,
  ]);

  const resultTotalPages = Math.max(
    1,
    Math.ceil(
      filteredStudents.length /
        ITEMS_PER_PAGE
    )
  );

  const paginatedStudents = useMemo(() => {
    const start =
      (resultPage - 1) *
      ITEMS_PER_PAGE;

    return filteredStudents.slice(
      start,
      start + ITEMS_PER_PAGE
    );
  }, [
    filteredStudents,
    resultPage,
  ]);

  useEffect(() => {
    setResultPage(1);
  }, [
    selectedCourse,
    selectedSemester,
    selectedExam,
    resultSearch,
  ]);

  /* =====================================================
     SUBJECTS
  ===================================================== */

  const subjects = useMemo(() => {
    const subjectSet = new Set();

    semesterResults.forEach((result) => {
      if (result.subject) {
        subjectSet.add(result.subject);
      }
    });

    return Array.from(subjectSet);
  }, [semesterResults]);

  /* =====================================================
     RESULT HELPERS
  ===================================================== */

  function getStudentId(result) {
    return getId(result?.student);
  }

  function getStudentName(student) {
    return (
      student?.name ||
      student?.fullName ||
      "Unknown Student"
    );
  }

  function getStudentRoll(student) {
    return (
      student?.rollNo ||
      student?.registerNo ||
      student?.registrationNo ||
      "-"
    );
  }

  function getStudentResults(studentId) {
    return semesterResults.filter(
      (result) =>
        String(getStudentId(result)) ===
        String(studentId)
    );
  }

  function getStudentMarks(studentId) {
    const studentResults =
      getStudentResults(studentId);

    const marks = {};

    studentResults.forEach((result) => {
      marks[result.subject] =
        result.marks ?? "";
    });

    return marks;
  }

  function getStudentTotal(studentId) {
    const studentResults =
      getStudentResults(studentId);

    return studentResults.reduce(
      (total, result) =>
        total + (Number(result.marks) || 0),
      0
    );
  }

  function getStudentMaxTotal(studentId) {
    const studentResults =
      getStudentResults(studentId);

    return studentResults.reduce(
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
      getStudentMaxTotal(studentId);

    if (!max) return 0;

    return (total / max) * 100;
  }

  function getStudentGrade(studentId) {
    return getGrade(
      getStudentPercentage(studentId)
    );
  }

  function isStudentPublished(studentId) {
    const studentResults =
      getStudentResults(studentId);

    return (
      studentResults.length > 0 &&
      studentResults.every(
        (result) =>
          result.published === true
      )
    );
  }

  /* =====================================================
     EXAM FORM
  ===================================================== */

  function handleExamChange(e) {
    const { name, value } = e.target;

    setExamForm((current) => ({
      ...current,
      [name]: value,
    }));

    setExamFormError("");
  }

  function openAddExam() {
    setEditingExam(null);

    setExamForm({
      ...EMPTY_EXAM,
    });

    setExamFormError("");
    setShowExamModal(true);
  }

  function openEditExam(exam) {
    setEditingExam(exam);

    setExamForm({
      name: exam.name || "",
      course: exam.course || "MCA",
      semester: String(
        exam.semester || "1"
      ),
      date: exam.date
        ? String(exam.date).slice(0, 10)
        : "",
      status:
        exam.status || "Scheduled",
    });

    setExamFormError("");
    setShowExamModal(true);
  }

  function closeExamModal() {
    if (examSaving) return;

    setShowExamModal(false);
    setEditingExam(null);
    setExamForm({
      ...EMPTY_EXAM,
    });
    setExamFormError("");
  }

  /* =====================================================
     SAVE EXAM
  ===================================================== */

  async function handleExamSubmit(e) {
    e.preventDefault();

    if (!examForm.name.trim()) {
      setExamFormError(
        "Please enter examination name."
      );
      return;
    }

    if (!examForm.date) {
      setExamFormError(
        "Please select examination date."
      );
      return;
    }

    try {
      setExamSaving(true);
      setExamFormError("");

      const payload = {
        name: examForm.name.trim(),
        course: examForm.course,
        semester: Number(
          examForm.semester
        ),
        date: examForm.date,
        status: examForm.status,
      };

      if (editingExam) {
        const id = getId(editingExam);

        const response = await put(
          `/exams/${id}`,
          payload
        );

        const updated =
          response?.exam ||
          response?.data ||
          response;

        setExams((current) =>
          current.map((exam) =>
            String(getId(exam)) ===
            String(id)
              ? {
                  ...exam,
                  ...updated,
                }
              : exam
          )
        );
      } else {
        const response = await post(
          "/exams",
          payload
        );

        const created =
          response?.exam ||
          response?.data ||
          response;

        setExams((current) => [
          created,
          ...current,
        ]);
      }

      closeExamModal();
    } catch (error) {
      setExamFormError(
        error.message ||
          "Unable to save examination."
      );
    } finally {
      setExamSaving(false);
    }
  }

  /* =====================================================
     DELETE EXAM
  ===================================================== */

  async function handleExamDelete() {
    if (!deleteExam) return;

    try {
      const id = getId(deleteExam);

      await remove(`/exams/${id}`);

      setExams((current) =>
        current.filter(
          (exam) =>
            String(getId(exam)) !==
            String(id)
        )
      );

      setDeleteExam(null);
    } catch (error) {
      setExamError(
        error.message ||
          "Unable to delete examination."
      );
    } finally {
      setExamSaving(false);
    }
  }

  /* =====================================================
     CREATE / UPDATE RESULT
  ===================================================== */

  async function saveStudentSubjectMark(
    student,
    subject,
    value
  ) {
    if (!selectedExam) {
      setResultError(
        "Please select an examination first."
      );
      return;
    }

    const marks = Number(value);

    if (
      value !== "" &&
      (Number.isNaN(marks) || marks < 0)
    ) {
      return;
    }

    const studentId = getId(student);

    const existing = semesterResults.find(
      (result) =>
        String(getStudentId(result)) ===
          String(studentId) &&
        String(result.subject) ===
          String(subject)
    );

    try {
      setResultSaving(true);
      setResultError("");

      if (existing) {
        const id = getId(existing);

        const response = await put(
          `/results/${id}`,
          {
            ...existing,
            student: studentId,
            exam: selectedExam,
            subject,
            marks:
              value === ""
                ? 0
                : marks,
            maxMarks:
              existing.maxMarks || 100,
          }
        );

        const updated =
          response?.result ||
          response?.data ||
          response;

        setResults((current) =>
          current.map((result) =>
            String(getId(result)) ===
            String(id)
              ? {
                  ...result,
                  ...updated,
                }
              : result
          )
        );
      } else {
        const response = await post(
          "/results",
          {
            student: studentId,
            exam: selectedExam,
            subject,
            internal: 0,
            marks:
              value === ""
                ? 0
                : marks,
            maxMarks: 100,
            grade: getGrade(
              value === ""
                ? 0
                : marks
            ),
            gradePoint: 0,
            published: false,
          }
        );

        const created =
          response?.result ||
          response?.data ||
          response;

        setResults((current) => [
          ...current,
          created,
        ]);
      }
    } catch (error) {
      setResultError(
        error.message ||
          "Unable to save marks."
      );
    } finally {
      setResultSaving(false);
    }
  }

  /* =====================================================
     SAVE ALL CURRENT MARKS
  ===================================================== */

  async function saveAllMarks() {
    if (!selectedExam) {
      setResultError(
        "Please select an examination."
      );
      return;
    }

    try {
      setResultSaving(true);
      setResultError("");

      /*
       * Existing result records are already saved
       * individually through the mark inputs.
       *
       * This button simply refreshes the data so
       * the admin gets the latest database state.
       */

      await loadResults();
    } catch (error) {
      setResultError(
        error.message ||
          "Unable to refresh results."
      );
    } finally {
      setResultSaving(false);
    }
  }

  /* =====================================================
     PUBLISH SEMESTER
  ===================================================== */

  async function publishSemesterResults() {
    if (!selectedExam) {
      setResultError(
        "Please select an examination."
      );
      return;
    }

    if (!semesterStudents.length) {
      setResultError(
        "No students found for this course and semester."
      );
      return;
    }

    try {
      setPublishLoading(true);
      setResultError("");

      /*
       * This endpoint publishes every result belonging
       * to the selected course + semester + examination.
       */
      await patch(
        "/results/publish-semester",
        {
          course: selectedCourse,
          semester: Number(
            selectedSemester
          ),
          exam: selectedExam,
        }
      );

      setShowPublishModal(false);

      await loadResults();
    } catch (error) {
      setResultError(
        error.message ||
          "Unable to publish semester results."
      );
    } finally {
      setPublishLoading(false);
    }
  }

  /* =====================================================
     EXAM LOADING
  ===================================================== */

  if (
    tab === "exams" &&
    examLoading
  ) {
    return (
      <div className="p-6">
        <Loading message="Loading examinations..." />
      </div>
    );
  }

  /* =====================================================
     MAIN UI
  ===================================================== */

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div className="
        flex flex-col gap-4
        lg:flex-row lg:items-center
        lg:justify-between
      ">
        <div>
          <h2 className="
            text-2xl font-bold
            text-slate-900
          ">
            Examinations
          </h2>

          <p className="
            mt-1 text-sm
            text-slate-500
          ">
            Manage examination schedules and semester results.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            tab === "exams"
              ? loadExams()
              : loadResults()
          }
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

      {/* TABS */}

      <div className="
        rounded-xl
        border border-slate-200
        bg-white p-2
        shadow-sm
      ">
        <div className="
          grid grid-cols-2 gap-2
        ">
          <button
            type="button"
            onClick={() =>
              setTab("exams")
            }
            className={`
              rounded-lg
              px-4 py-3
              text-sm font-semibold
              ${
                tab === "exams"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }
            `}
          >
            📅 Examination Schedule
          </button>

          <button
            type="button"
            onClick={() =>
              setTab("results")
            }
            className={`
              rounded-lg
              px-4 py-3
              text-sm font-semibold
              ${
                tab === "results"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }
            `}
          >
            🏆 Semester Results
          </button>
        </div>
      </div>

      {/* =================================================
          EXAMINATION SCHEDULE
      ================================================= */}

      {tab === "exams" && (
        <div className="space-y-5">

          <div className="
            flex flex-col gap-4
            sm:flex-row
            sm:items-center
            sm:justify-between
          ">
            <div>
              <h3 className="
                text-xl font-bold
                text-slate-900
              ">
                Examination Schedule
              </h3>

              <p className="
                mt-1 text-sm
                text-slate-500
              ">
                Create and manage examination schedules.
              </p>
            </div>

            <button
              type="button"
              onClick={openAddExam}
              className="
                rounded-lg
                bg-slate-900
                px-4 py-2.5
                text-sm font-semibold
                text-white
                hover:bg-slate-800
              "
            >
              + Add Examination
            </button>
          </div>

          {examError && (
            <div className="
              rounded-lg
              border border-red-200
              bg-red-50
              px-4 py-3
              text-sm text-red-700
            ">
              {examError}
            </div>
          )}

          <div className="
            rounded-xl
            border border-slate-200
            bg-white p-4
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
                value={examSearch}
                onChange={(e) => {
                  setExamSearch(
                    e.target.value
                  );
                  setExamPage(1);
                }}
                placeholder="Search examinations..."
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

          <div className="
            overflow-hidden
            rounded-xl
            border border-slate-200
            bg-white
            shadow-sm
          ">
            {!filteredExams.length ? (
              <div className="p-10">
                <Empty
                  title="No examinations"
                  message="Create an examination schedule to get started."
                />
              </div>
            ) : (
              <div className="w-full overflow-hidden">
                <table className="w-full table-fixed">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="
                        w-[28%] px-4 py-3
                        text-left text-xs
                        font-semibold uppercase
                        tracking-wide text-slate-500
                      ">
                        Examination
                      </th>

                      <th className="
                        w-[15%] px-4 py-3
                        text-left text-xs
                        font-semibold uppercase
                        tracking-wide text-slate-500
                      ">
                        Course
                      </th>

                      <th className="
                        w-[15%] px-4 py-3
                        text-left text-xs
                        font-semibold uppercase
                        tracking-wide text-slate-500
                      ">
                        Semester
                      </th>

                      <th className="
                        w-[15%] px-4 py-3
                        text-left text-xs
                        font-semibold uppercase
                        tracking-wide text-slate-500
                      ">
                        Date
                      </th>

                      <th className="
                        w-[12%] px-4 py-3
                        text-left text-xs
                        font-semibold uppercase
                        tracking-wide text-slate-500
                      ">
                        Status
                      </th>

                      <th className="
                        w-[15%] px-4 py-3
                        text-center text-xs
                        font-semibold uppercase
                        tracking-wide text-slate-500
                      ">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="
                    divide-y divide-slate-100
                  ">
                    {paginatedExams.map(
                      (exam, index) => (
                        <tr
                          key={
                            getId(exam) ||
                            index
                          }
                          className="
                            hover:bg-slate-50
                          "
                        >
                          <td className="px-4 py-4">
                            <div className="
                              truncate
                              text-sm font-semibold
                              text-slate-900
                            ">
                              {exam.name || "-"}
                            </div>
                          </td>

                          <td className="
                            truncate
                            px-4 py-4
                            text-sm text-slate-600
                          ">
                            {exam.course || "-"}
                          </td>

                          <td className="
                            truncate
                            px-4 py-4
                            text-sm text-slate-600
                          ">
                            Semester{" "}
                            {exam.semester || "-"}
                          </td>

                          <td className="
                            truncate
                            px-4 py-4
                            text-sm text-slate-600
                          ">
                            {formatDate(
                              exam.date
                            )}
                          </td>

                          <td className="px-4 py-4">
                            <span className="
                              inline-flex
                              rounded-full
                              bg-slate-100
                              px-2.5 py-1
                              text-xs font-semibold
                              text-slate-700
                            ">
                              {exam.status ||
                                "Scheduled"}
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            <div className="
                              flex items-center
                              justify-center gap-2
                            ">
                              <button
                                type="button"
                                onClick={() =>
                                  openEditExam(
                                    exam
                                  )
                                }
                                className="
                                  rounded-lg
                                  border
                                  border-slate-200
                                  px-3 py-1.5
                                  text-xs
                                  font-medium
                                  text-slate-600
                                  hover:bg-slate-100
                                "
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteExam(
                                    exam
                                  )
                                }
                                className="
                                  rounded-lg
                                  border
                                  border-red-200
                                  px-3 py-1.5
                                  text-xs
                                  font-medium
                                  text-red-600
                                  hover:bg-red-50
                                "
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {examTotalPages > 1 && (
            <Pagination
              currentPage={examPage}
              totalPages={examTotalPages}
              totalItems={
                filteredExams.length
              }
              onPageChange={setExamPage}
            />
          )}
        </div>
      )}

      {/* =================================================
          SEMESTER RESULTS
      ================================================= */}

      {tab === "results" && (
        <div className="space-y-5">

          <div>
            <h3 className="
              text-xl font-bold
              text-slate-900
            ">
              Semester Results
            </h3>

            <p className="
              mt-1 text-sm
              text-slate-500
            ">
              Manage results for an entire semester.
            </p>
          </div>

          {resultError && (
            <div className="
              rounded-lg
              border border-red-200
              bg-red-50
              px-4 py-3
              text-sm text-red-700
            ">
              {resultError}
            </div>
          )}

          {/* SELECT SEMESTER */}

          <div className="
            rounded-xl
            border border-slate-200
            bg-white p-5
            shadow-sm
          ">
            <div className="
              grid grid-cols-1
              gap-4
              md:grid-cols-3
            ">

              <FormField label="Course">
                <select
                  value={selectedCourse}
                  onChange={(e) =>
                    setSelectedCourse(
                      e.target.value
                    )
                  }
                  className={inputClass}
                >
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
              </FormField>

              <FormField label="Semester">
                <select
                  value={selectedSemester}
                  onChange={(e) =>
                    setSelectedSemester(
                      e.target.value
                    )
                  }
                  className={inputClass}
                >
                  {SEMESTERS.map(
                    (semester) => (
                      <option
                        key={semester}
                        value={semester}
                      >
                        Semester {semester}
                      </option>
                    )
                  )}
                </select>
              </FormField>

              <FormField label="Examination">
                <select
                  value={selectedExam}
                  onChange={(e) =>
                    setSelectedExam(
                      e.target.value
                    )
                  }
                  className={inputClass}
                >
                  <option value="">
                    Select Examination
                  </option>

                  {semesterExams.map(
                    (exam) => (
                      <option
                        key={getId(exam)}
                        value={getId(exam)}
                      >
                        {exam.name}
                      </option>
                    )
                  )}
                </select>
              </FormField>

            </div>

            {selectedExamObject && (
              <div className="
                mt-4 rounded-lg
                border border-blue-100
                bg-blue-50
                px-4 py-3
              ">
                <div className="
                  flex flex-col gap-1
                  sm:flex-row
                  sm:items-center
                  sm:justify-between
                ">
                  <div>
                    <p className="
                      text-sm font-semibold
                      text-blue-900
                    ">
                      {selectedExamObject.name}
                    </p>

                    <p className="
                      text-xs text-blue-700
                    ">
                      {selectedCourse} •
                      Semester{" "}
                      {selectedSemester}
                    </p>
                  </div>

                  <p className="
                    text-xs text-blue-700
                  ">
                    {formatDate(
                      selectedExamObject.date
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>

          {!selectedExam ? (
            <div className="
              rounded-xl
              border border-slate-200
              bg-white
              p-12
              text-center
              shadow-sm
            ">
              <div className="text-5xl">
                📚
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
                Select the course, semester and examination
                to view the complete semester result.
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
                  value={semesterStudents.length}
                  icon="👨‍🎓"
                />

                <SummaryCard
                  title="Subjects"
                  value={subjects.length}
                  icon="📖"
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
                        isStudentPublished(
                          getId(student)
                        )
                    ).length
                  }
                  icon="✅"
                />
              </div>

              {/* SEARCH */}

              <div className="
                rounded-xl
                border border-slate-200
                bg-white p-4
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
                    value={resultSearch}
                    onChange={(e) =>
                      setResultSearch(
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

              {/* RESULT TABLE */}

              <div className="
                overflow-hidden
                rounded-xl
                border border-slate-200
                bg-white
                shadow-sm
              ">

                <div className="
                  flex flex-col gap-3
                  border-b
                  border-slate-200
                  px-5 py-4
                  sm:flex-row
                  sm:items-center
                  sm:justify-between
                ">
                  <div>
                    <h3 className="
                      font-semibold
                      text-slate-900
                    ">
                      {selectedCourse} —
                      Semester{" "}
                      {selectedSemester}
                    </h3>

                    <p className="
                      mt-1 text-xs
                      text-slate-500
                    ">
                      Enter marks for all students.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={saveAllMarks}
                    disabled={resultSaving}
                    className="
                      rounded-lg
                      border
                      border-slate-200
                      px-4 py-2
                      text-sm font-medium
                      text-slate-700
                      hover:bg-slate-50
                      disabled:opacity-50
                    "
                  >
                    {resultSaving
                      ? "Saving..."
                      : "↻ Save / Refresh"}
                  </button>
                </div>

                {resultLoading ? (
                  <div className="p-10">
                    <Loading message="Loading semester results..." />
                  </div>
                ) : !filteredStudents.length ? (
                  <div className="p-10">
                    <Empty
                      title="No students found"
                      message="No students match this course, semester or search."
                    />
                  </div>
                ) : (
                  <div className="w-full overflow-hidden">
                    <table className="
                      w-full
                      table-fixed
                    ">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="
                            w-[18%]
                            px-3 py-3
                            text-left
                            text-xs font-semibold
                            uppercase
                            tracking-wide
                            text-slate-500
                          ">
                            Student
                          </th>

                          <th className="
                            w-[10%]
                            px-3 py-3
                            text-left
                            text-xs font-semibold
                            uppercase
                            tracking-wide
                            text-slate-500
                          ">
                            Roll No.
                          </th>

                          <th className="
                            w-[10%]
                            px-3 py-3
                            text-center
                            text-xs font-semibold
                            uppercase
                            tracking-wide
                            text-slate-500
                          ">
                            Subjects
                          </th>

                          <th className="
                            w-[10%]
                            px-3 py-3
                            text-center
                            text-xs font-semibold
                            uppercase
                            tracking-wide
                            text-slate-500
                          ">
                            Total
                          </th>

                          <th className="
                            w-[11%]
                            px-3 py-3
                            text-center
                            text-xs font-semibold
                            uppercase
                            tracking-wide
                            text-slate-500
                          ">
                            Percentage
                          </th>

                          <th className="
                            w-[9%]
                            px-3 py-3
                            text-center
                            text-xs font-semibold
                            uppercase
                            tracking-wide
                            text-slate-500
                          ">
                            Grade
                          </th>

                          <th className="
                            w-[12%]
                            px-3 py-3
                            text-center
                            text-xs font-semibold
                            uppercase
                            tracking-wide
                            text-slate-500
                          ">
                            Status
                          </th>

                          <th className="
                            w-[20%]
                            px-3 py-3
                            text-center
                            text-xs font-semibold
                            uppercase
                            tracking-wide
                            text-slate-500
                          ">
                            Marks
                          </th>
                        </tr>
                      </thead>

                      <tbody className="
                        divide-y divide-slate-100
                      ">
                        {paginatedStudents.map(
                          (student, index) => {
                            const studentId =
                              getId(student);

                            const studentResults =
                              getStudentResults(
                                studentId
                              );

                            const marks =
                              getStudentMarks(
                                studentId
                              );

                            const total =
                              getStudentTotal(
                                studentId
                              );

                            const maxTotal =
                              getStudentMaxTotal(
                                studentId
                              );

                            const percentage =
                              getStudentPercentage(
                                studentId
                              );

                            const grade =
                              getStudentGrade(
                                studentId
                              );

                            const published =
                              isStudentPublished(
                                studentId
                              );

                            return (
                              <tr
                                key={
                                  studentId ||
                                  index
                                }
                                className="
                                  hover:bg-slate-50
                                "
                              >
                                <td className="
                                  px-3 py-4
                                ">
                                  <div className="
                                    truncate
                                    text-sm
                                    font-semibold
                                    text-slate-900
                                  ">
                                    {getStudentName(
                                      student
                                    )}
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
                                  px-3 py-4
                                  text-sm
                                  text-slate-600
                                ">
                                  {getStudentRoll(
                                    student
                                  )}
                                </td>

                                <td className="
                                  px-3 py-4
                                  text-center
                                ">
                                  <span className="
                                    text-sm
                                    font-semibold
                                    text-slate-700
                                  ">
                                    {
                                      studentResults.length
                                    }
                                  </span>
                                  <span className="
                                    text-xs
                                    text-slate-400
                                  ">
                                    /
                                    {subjects.length ||
                                      "-"}
                                  </span>
                                </td>

                                <td className="
                                  px-3 py-4
                                  text-center
                                ">
                                  <span className="
                                    text-sm
                                    font-bold
                                    text-slate-900
                                  ">
                                    {total}
                                  </span>

                                  <span className="
                                    text-xs
                                    text-slate-400
                                  ">
                                    /
                                    {maxTotal}
                                  </span>
                                </td>

                                <td className="
                                  px-3 py-4
                                  text-center
                                ">
                                  <span className="
                                    text-sm
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
                                  px-3 py-4
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
                                  px-3 py-4
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
                                      : "Draft"}
                                  </span>
                                </td>

                                <td className="
                                  px-3 py-4
                                ">
                                  <div className="
                                    flex
                                    flex-wrap
                                    justify-center
                                    gap-1.5
                                  ">
                                    {subjects.length ? (
                                      subjects.map(
                                        (
                                          subject
                                        ) => (
                                          <input
                                            key={
                                              subject
                                            }
                                            type="number"
                                            min="0"
                                            max="100"
                                            defaultValue={
                                              marks[
                                                subject
                                              ] ??
                                              ""
                                            }
                                            onBlur={(
                                              e
                                            ) =>
                                              saveStudentSubjectMark(
                                                student,
                                                subject,
                                                e
                                                  .target
                                                  .value
                                              )
                                            }
                                            title={
                                              subject
                                            }
                                            placeholder={
                                              subject
                                            }
                                            className="
                                              w-14
                                              rounded-md
                                              border
                                              border-slate-200
                                              px-1.5 py-1.5
                                              text-center
                                              text-xs
                                              outline-none
                                              focus:border-slate-400
                                            "
                                          />
                                        )
                                      )
                                    ) : (
                                      <span className="
                                        text-xs
                                        text-slate-400
                                      ">
                                        Add subject
                                        results
                                      </span>
                                    )}
                                  </div>
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

              {/* PUBLISH PANEL */}

              <div className="
                rounded-xl
                border
                border-emerald-200
                bg-emerald-50
                p-5
              ">
                <div className="
                  flex flex-col gap-4
                  lg:flex-row
                  lg:items-center
                  lg:justify-between
                ">
                  <div>
                    <h3 className="
                      text-lg font-bold
                      text-emerald-900
                    ">
                      Publish Semester Results
                    </h3>

                    <p className="
                      mt-1 max-w-2xl
                      text-sm
                      text-emerald-700
                    ">
                      Publishing will make the results
                      available to all students in{" "}
                      <strong>
                        {selectedCourse}
                      </strong>{" "}
                      Semester{" "}
                      <strong>
                        {selectedSemester}
                      </strong>{" "}
                      for{" "}
                      <strong>
                        {selectedExamObject?.name ||
                          "this examination"}
                      </strong>.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setShowPublishModal(true)
                    }
                    disabled={
                      publishLoading ||
                      !semesterStudents.length
                    }
                    className="
                      shrink-0
                      rounded-lg
                      bg-emerald-600
                      px-5 py-3
                      text-sm font-semibold
                      text-white
                      hover:bg-emerald-700
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                  >
                    Publish Semester Results
                  </button>
                </div>
              </div>

              {resultTotalPages > 1 && (
                <Pagination
                  currentPage={resultPage}
                  totalPages={resultTotalPages}
                  totalItems={
                    filteredStudents.length
                  }
                  onPageChange={
                    setResultPage
                  }
                />
              )}
            </>
          )}
        </div>
      )}

      {/* =================================================
          EXAM MODAL
      ================================================= */}

      {showExamModal && (
        <div className="
          fixed inset-0 z-50
          flex items-center justify-center
          bg-slate-950/50 p-4
        ">
          <div className="
            w-full max-w-lg
            rounded-2xl
            bg-white
            shadow-2xl
          ">
            <div className="
              flex items-center
              justify-between
              border-b
              border-slate-200
              px-6 py-5
            ">
              <div>
                <h3 className="
                  text-lg font-bold
                  text-slate-900
                ">
                  {editingExam
                    ? "Edit Examination"
                    : "Add Examination"}
                </h3>
              </div>

              <button
                type="button"
                onClick={closeExamModal}
                className="
                  rounded-lg p-2
                  text-slate-400
                  hover:bg-slate-100
                "
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleExamSubmit}
              className="space-y-4 p-6"
            >
              {examFormError && (
                <div className="
                  rounded-lg
                  border border-red-200
                  bg-red-50
                  px-4 py-3
                  text-sm text-red-700
                ">
                  {examFormError}
                </div>
              )}

              <FormField label="Examination Name">
                <input
                  name="name"
                  value={examForm.name}
                  onChange={handleExamChange}
                  placeholder="Semester Examination"
                  required
                  className={inputClass}
                />
              </FormField>

              <div className="
                grid grid-cols-1
                gap-4 sm:grid-cols-2
              ">
                <FormField label="Course">
                  <select
                    name="course"
                    value={examForm.course}
                    onChange={handleExamChange}
                    className={inputClass}
                  >
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
                </FormField>

                <FormField label="Semester">
                  <select
                    name="semester"
                    value={examForm.semester}
                    onChange={handleExamChange}
                    className={inputClass}
                  >
                    {SEMESTERS.map(
                      (semester) => (
                        <option
                          key={semester}
                          value={semester}
                        >
                          Semester {semester}
                        </option>
                      )
                    )}
                  </select>
                </FormField>
              </div>

              <div className="
                grid grid-cols-1
                gap-4 sm:grid-cols-2
              ">
                <FormField label="Date">
                  <input
                    type="date"
                    name="date"
                    value={examForm.date}
                    onChange={handleExamChange}
                    required
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Status">
                  <select
                    name="status"
                    value={examForm.status}
                    onChange={handleExamChange}
                    className={inputClass}
                  >
                    {EXAM_STATUSES.map(
                      (status) => (
                        <option
                          key={status}
                          value={status}
                        >
                          {status}
                        </option>
                      )
                    )}
                  </select>
                </FormField>
              </div>

              <div className="
                flex justify-end gap-3
                border-t
                border-slate-100
                pt-5
              ">
                <button
                  type="button"
                  onClick={closeExamModal}
                  className="
                    rounded-lg
                    border border-slate-200
                    px-4 py-2.5
                    text-sm font-medium
                    text-slate-700
                    hover:bg-slate-50
                  "
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={examSaving}
                  className="
                    rounded-lg
                    bg-slate-900
                    px-5 py-2.5
                    text-sm font-semibold
                    text-white
                    hover:bg-slate-800
                    disabled:opacity-50
                  "
                >
                  {examSaving
                    ? "Saving..."
                    : editingExam
                    ? "Update"
                    : "Create Examination"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================
          PUBLISH MODAL
      ================================================= */}

      {showPublishModal && (
        <div className="
          fixed inset-0 z-50
          flex items-center justify-center
          bg-slate-950/50 p-4
        ">
          <div className="
            w-full max-w-md
            rounded-2xl
            bg-white
            p-6
            shadow-2xl
          ">
            <div className="
              flex h-12 w-12
              items-center justify-center
              rounded-full
              bg-emerald-100
              text-xl
            ">
              ✓
            </div>

            <h3 className="
              mt-4
              text-xl font-bold
              text-slate-900
            ">
              Publish Semester Results?
            </h3>

            <p className="
              mt-2
              text-sm leading-6
              text-slate-500
            ">
              This will publish the results for all
              students in{" "}
              <strong className="text-slate-700">
                {selectedCourse}
              </strong>{" "}
              Semester{" "}
              <strong className="text-slate-700">
                {selectedSemester}
              </strong>{" "}
              for{" "}
              <strong className="text-slate-700">
                {selectedExamObject?.name}
              </strong>.
            </p>

            <div className="
              mt-4 rounded-lg
              bg-amber-50
              px-4 py-3
              text-sm text-amber-700
            ">
              Students will be able to view their
              published results after this action.
            </div>

            <div className="
              mt-6
              flex justify-end gap-3
            ">
              <button
                type="button"
                onClick={() =>
                  setShowPublishModal(false)
                }
                disabled={publishLoading}
                className="
                  rounded-lg
                  border
                  border-slate-200
                  px-4 py-2.5
                  text-sm font-medium
                  text-slate-700
                  hover:bg-slate-50
                "
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  publishSemesterResults
                }
                disabled={publishLoading}
                className="
                  rounded-lg
                  bg-emerald-600
                  px-5 py-2.5
                  text-sm font-semibold
                  text-white
                  hover:bg-emerald-700
                  disabled:opacity-50
                "
              >
                {publishLoading
                  ? "Publishing..."
                  : "Publish Results"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================
          DELETE EXAM
      ================================================= */}

      {deleteExam && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-xl">
              🗑️
            </div>

            <h3 className="mt-4 text-xl font-bold text-slate-900">
              Delete Examination?
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Are you sure you want to delete {" "}
              <strong className="text-slate-700">
                "{deleteExam.name}"
              </strong>
              ?
              <br />
              This action cannot be undone.
            </p>

            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-slate-500">Course</span>
                <span className="text-sm font-semibold text-slate-800">
                  {deleteExam.course || "-"}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-slate-500">Semester</span>
                <span className="text-sm font-semibold text-slate-800">
                  Semester {deleteExam.semester || "-"}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-slate-500">Date</span>
                <span className="text-sm font-semibold text-slate-800">
                  {formatDate(deleteExam.date)}
                </span>
              </div>
            </div>

            {examError && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {examError}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  if (examSaving) return;
                  setDeleteExam(null);
                  setExamError("");
                }}
                disabled={examSaving}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleExamDelete}
                disabled={examSaving}
                className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {examSaving ? "Deleting..." : "Delete Examination"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   FORM FIELD
========================================================= */

function FormField({
  label,
  children,
}) {
  return (
    <div>
      <label className="
        mb-1.5 block
        text-sm font-medium
        text-slate-700
      ">
        {label}
      </label>

      {children}
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

/* =========================================================
   PAGINATION
========================================================= */

function Pagination({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}) {
  const start =
    totalItems === 0
      ? 0
      : (currentPage - 1) *
          ITEMS_PER_PAGE +
        1;

  const end = Math.min(
    currentPage * ITEMS_PER_PAGE,
    totalItems
  );

  return (
    <div className="
      flex flex-col gap-3
      rounded-xl
      border border-slate-200
      bg-white p-4
      shadow-sm
      sm:flex-row
      sm:items-center
      sm:justify-between
    ">
      <p className="
        text-sm text-slate-500
      ">
        Showing{" "}
        <span className="
          font-medium
          text-slate-700
        ">
          {start}
        </span>{" "}
        to{" "}
        <span className="
          font-medium
          text-slate-700
        ">
          {end}
        </span>{" "}
        of{" "}
        <span className="
          font-medium
          text-slate-700
        ">
          {totalItems}
        </span>
      </p>

      <div className="
        flex items-center gap-1
      ">
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
          className="
            rounded-lg
            border border-slate-200
            px-3 py-2
            text-sm
            text-slate-600
            hover:bg-slate-50
            disabled:opacity-40
          "
        >
          Previous
        </button>

        {Array.from(
          {
            length: totalPages,
          },
          (_, i) => i + 1
        ).map((page) => (
          <button
            type="button"
            key={page}
            onClick={() =>
              onPageChange(page)
            }
            className={`
              rounded-lg
              px-3 py-2
              text-sm
              font-medium
              ${
                page === currentPage
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 text-slate-600 hover:bg-slate-50"
              }
            `}
          >
            {page}
          </button>
        ))}

        <button
          type="button"
          disabled={
            currentPage === totalPages
          }
          onClick={() =>
            onPageChange(
              Math.min(
                totalPages,
                currentPage + 1
              )
            )
          }
          className="
            rounded-lg
            border border-slate-200
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
  );
}