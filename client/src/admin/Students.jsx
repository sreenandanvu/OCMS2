import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  get,
  post,
  put,
  remove,
} from "../services/api";


// =====================================================
// DEFAULT STUDENT
// =====================================================

const emptyStudent = {
  name: "",
  email: "",
  rollNo: "",
  course: "MCA",
  semester: "1",
  section: "A",
  phone: "",
};


// =====================================================
// FORM FIELDS
// =====================================================

const studentFields = [
  {
    name: "name",
    label: "Student Name",
    placeholder: "Enter student name",
    required: true,
  },
  {
    name: "email",
    label: "Email",
    type: "email",
    placeholder: "student@example.com",
    required: true,
  },
  {
    name: "rollNo",
    label: "Roll Number",
    placeholder: "MCA001",
    required: true,
  },
  {
    name: "course",
    label: "Course",
    type: "select",
    options: [
      {
        value: "MCA",
        label: "MCA",
      },
      {
        value: "MBA",
        label: "MBA",
      },
      {
        value: "BCA",
        label: "BCA",
      },
      {
        value: "BBA",
        label: "BBA",
      },
    ],
    required: true,
  },
  {
    name: "semester",
    label: "Semester",
    type: "select",
    options: [
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
    ],
    required: true,
  },
  {
    name: "section",
    label: "Section",
    type: "select",
    options: [
      "A",
      "B",
      "C",
    ],
    required: true,
  },
  {
    name: "phone",
    label: "Phone Number",
    placeholder: "Enter phone number",
  },
];


// =====================================================
// ROWS PER PAGE
// =====================================================

const ROWS_PER_PAGE = 7;


// =====================================================
// MAIN COMPONENT
// =====================================================

export default function Students() {
  const [students, setStudents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const [search, setSearch] = useState("");

  const [currentPage, setCurrentPage] =
    useState(1);

  const [showAddModal, setShowAddModal] =
    useState(false);

  const [showEditModal, setShowEditModal] =
    useState(false);

  const [editingStudent, setEditingStudent] =
    useState(null);

  // Student selected for delete confirmation
  const [deleteStudent, setDeleteStudent] =
    useState(null);

  const [form, setForm] =
    useState({
      ...emptyStudent,
    });


  // ===================================================
  // LOAD STUDENTS
  // ===================================================

  async function loadStudents() {
    setLoading(true);
    setError("");

    try {
      const response =
        await get("/students");

      const data = Array.isArray(response)
        ? response
        : response.students ||
          response.data ||
          [];

      setStudents(data);

      setCurrentPage(1);
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


  // ===================================================
  // SEARCH
  // ===================================================

  const filteredStudents = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    if (!query) {
      return students;
    }

    return students.filter(
      (student) => {
        return [
          student.name,
          student.email,
          student.rollNo,
          student.course,
          student.semester,
          student.section,
          student.phone,
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(query)
        );
      }
    );
  }, [students, search]);


  // ===================================================
  // PAGINATION
  // ===================================================

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredStudents.length /
        ROWS_PER_PAGE
    )
  );


  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [
    currentPage,
    totalPages,
  ]);


  const startIndex =
    (currentPage - 1) *
    ROWS_PER_PAGE;

  const endIndex =
    startIndex + ROWS_PER_PAGE;

  const paginatedStudents =
    filteredStudents.slice(
      startIndex,
      endIndex
    );


  // ===================================================
  // ADD MODAL
  // ===================================================

  function openAddModal() {
    setForm({
      ...emptyStudent,
    });

    setEditingStudent(null);
    setFormError("");
    setShowAddModal(true);
  }


  function closeAddModal() {
    if (saving) return;

    setShowAddModal(false);

    setForm({
      ...emptyStudent,
    });

    setFormError("");
  }


  // ===================================================
  // EDIT MODAL
  // ===================================================

  function openEditModal(student) {
    setEditingStudent(student);

    setForm({
      name: student.name || "",
      email: student.email || "",
      rollNo: student.rollNo || "",
      course: student.course || "MCA",
      semester: String(
        student.semester || "1"
      ),
      section:
        student.section || "A",
      phone: student.phone || "",
    });

    setFormError("");
    setShowEditModal(true);
  }


  function closeEditModal() {
    if (saving) return;

    setShowEditModal(false);
    setEditingStudent(null);

    setForm({
      ...emptyStudent,
    });

    setFormError("");
  }


  // ===================================================
  // FORM CHANGE
  // ===================================================

  function handleChange(
    name,
    value
  ) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }


  // ===================================================
  // SAVE STUDENT
  // ===================================================

  async function handleSubmit(event) {
    event.preventDefault();

    setSaving(true);
    setFormError("");

    const payload = {
      ...form,
      semester: Number(
        form.semester
      ),
    };

    try {

      // ===============================================
      // EDIT
      // ===============================================

      if (editingStudent) {
        const id =
          editingStudent._id ||
          editingStudent.id;

        if (!id) {
          throw new Error(
            "Student ID is missing."
          );
        }

        const response =
          await put(
            `/students/${id}`,
            payload
          );

        const updated =
          response.student ||
          response.data ||
          response;

        setStudents(
          (current) =>
            current.map(
              (student) =>
                (
                  student._id ||
                  student.id
                ) === id
                  ? updated
                  : student
            )
        );

        closeEditModal();
      }

      // ===============================================
      // ADD
      // ===============================================

      else {
        const response =
          await post(
            "/students",
            payload
          );

        const created =
          response.student ||
          response.data ||
          response;

        setStudents(
          (current) => [
            ...current,
            created,
          ]
        );

        setCurrentPage(1);

        closeAddModal();
      }

    } catch (err) {
      setFormError(
        err.message ||
          "Unable to save student."
      );
    } finally {
      setSaving(false);
    }
  }


  // ===================================================
  // OPEN DELETE POPUP
  // ===================================================

  function openDeleteModal(student) {
    if (deleting) return;

    setDeleteStudent(student);
    setError("");
  }


  // ===================================================
  // CLOSE DELETE POPUP
  // ===================================================

  function closeDeleteModal() {
    if (deleting) return;

    setDeleteStudent(null);
  }


  // ===================================================
  // DELETE STUDENT
  // ===================================================

  async function handleDelete() {
    if (!deleteStudent || deleting) {
      return;
    }

    const id =
      deleteStudent._id ||
      deleteStudent.id;

    if (!id) {
      setError(
        "Unable to delete student: Student ID is missing."
      );

      setDeleteStudent(null);
      return;
    }

    setDeleting(true);
    setError("");

    try {
      // DELETE /api/students/:id
      await remove(
        `/students/${id}`
      );

      // Remove the deleted student
      // immediately from the UI.
      setStudents(
        (current) =>
          current.filter(
            (student) =>
              (
                student._id ||
                student.id
              ) !== id
          )
      );

      // Close popup after successful deletion.
      setDeleteStudent(null);

    } catch (err) {
      setError(
        err.message ||
          "Unable to delete student."
      );

    } finally {
      setDeleting(false);
    }
  }


  // ===================================================
  // EXPORT CSV
  // ===================================================

  function exportStudents() {
    if (
      filteredStudents.length === 0
    ) {
      return;
    }

    const headers = [
      "Student Name",
      "Email",
      "Roll Number",
      "Course",
      "Semester",
      "Section",
      "Phone",
    ];

    const rows =
      filteredStudents.map(
        (student) => [
          student.name || "",
          student.email || "",
          student.rollNo || "",
          student.course || "",
          student.semester || "",
          student.section || "",
          student.phone || "",
        ]
      );


    function escapeCSV(value) {
      const text =
        String(value ?? "");

      if (
        text.includes(",") ||
        text.includes('"') ||
        text.includes("\n")
      ) {
        return `"${text.replace(
          /"/g,
          '""'
        )}"`;
      }

      return text;
    }


    const csv = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map(escapeCSV)
          .join(",")
      )
      .join("\n");


    const blob =
      new Blob(
        ["\ufeff" + csv],
        {
          type:
            "text/csv;charset=utf-8;",
        }
      );


    const url =
      URL.createObjectURL(
        blob
      );


    const link =
      document.createElement(
        "a"
      );

    link.href = url;

    link.download =
      "ocms-students.csv";

    document.body.appendChild(
      link
    );

    link.click();

    document.body.removeChild(
      link
    );

    URL.revokeObjectURL(url);
  }


  // ===================================================
  // PAGE NUMBERS
  // ===================================================

  function getPageNumbers() {
    const pages = [];

    for (
      let page = 1;
      page <= totalPages;
      page++
    ) {
      pages.push(page);
    }

    return pages;
  }


  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">

      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Students
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Manage student records,
            courses and academic
            information.
          </p>
        </div>


        <button
          type="button"
          onClick={openAddModal}
          className="
            inline-flex
            items-center
            justify-center
            gap-2
            rounded-xl
            bg-violet-600
            px-5
            py-2.5
            text-sm
            font-semibold
            text-white
            shadow-sm
            transition
            hover:bg-violet-700
            hover:shadow-md
            focus:outline-none
            focus:ring-2
            focus:ring-violet-500
            focus:ring-offset-2
          "
        >
          <span className="text-lg">
            +
          </span>

          Add Student
        </button>
      </div>


      {/* =================================================
          STUDENT RECORD PANEL
      ================================================= */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* =================================================
            PANEL HEADER
        ================================================= */}

        <div className="border-b border-slate-200 p-5 sm:p-6">

          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">

            {/* TITLE */}

            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Student Records
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-700">
                  {
                    filteredStudents.length
                  }
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-700">
                  {students.length}
                </span>{" "}
                students
              </p>
            </div>


            {/* ACTIONS */}

            <div className="flex flex-col gap-3 sm:flex-row">

              {/* SEARCH */}

              <div className="relative sm:w-80">

                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  🔎
                </span>

                <input
                  type="text"
                  value={search}
                  onChange={(event) => {
                    setSearch(
                      event.target.value
                    );

                    setCurrentPage(1);
                  }}
                  placeholder="Search students..."
                  className="
                    w-full
                    rounded-xl
                    border
                    border-slate-200
                    bg-slate-50
                    py-2.5
                    pl-10
                    pr-10
                    text-sm
                    text-slate-800
                    outline-none
                    transition
                    placeholder:text-slate-400
                    focus:border-violet-500
                    focus:bg-white
                    focus:ring-2
                    focus:ring-violet-100
                  "
                />

                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setCurrentPage(1);
                    }}
                    className="
                      absolute
                      right-3
                      top-1/2
                      -translate-y-1/2
                      text-lg
                      text-slate-400
                      hover:text-slate-700
                    "
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>


              {/* EXPORT */}

              <button
                type="button"
                onClick={
                  exportStudents
                }
                disabled={
                  filteredStudents.length ===
                  0
                }
                className="
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  px-4
                  py-2.5
                  text-sm
                  font-semibold
                  text-slate-700
                  transition
                  hover:border-slate-300
                  hover:bg-slate-50
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                "
              >
                ↓ Export CSV
              </button>


              {/* REFRESH */}

              <button
                type="button"
                onClick={
                  loadStudents
                }
                disabled={loading}
                className="
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  px-4
                  py-2.5
                  text-sm
                  font-semibold
                  text-slate-700
                  transition
                  hover:border-slate-300
                  hover:bg-slate-50
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                ↻ Refresh
              </button>
            </div>
          </div>
        </div>


        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="m-5 rounded-xl border border-red-200 bg-red-50 p-4">

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <p className="text-sm font-bold text-red-800">
                  Unable to process request
                </p>

                <p className="mt-1 text-sm text-red-600">
                  {error}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setError("");
                  loadStudents();
                }}
                className="
                  rounded-lg
                  bg-red-600
                  px-4
                  py-2
                  text-sm
                  font-semibold
                  text-white
                  hover:bg-red-700
                "
              >
                Retry
              </button>
            </div>
          </div>
        )}


        {/* =================================================
            LOADING
        ================================================= */}

        {loading ? (
          <div className="space-y-4 p-6">

            {Array.from({
              length: 7,
            }).map(
              (_, index) => (
                <div
                  key={index}
                  className="flex animate-pulse gap-4"
                >
                  <div className="h-11 w-11 shrink-0 rounded-full bg-slate-200" />

                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-48 rounded bg-slate-200" />

                    <div className="h-3 w-32 rounded bg-slate-100" />
                  </div>
                </div>
              )
            )}
          </div>

        ) : filteredStudents.length ===
          0 ? (

          /* =================================================
             EMPTY
          ================================================= */

          <div className="px-6 py-16 text-center">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50 text-3xl">
              {search
                ? "🔎"
                : "🎓"}
            </div>

            <h3 className="mt-4 text-lg font-bold text-slate-900">
              {search
                ? "No students found"
                : "No students yet"}
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              {search
                ? `No student records match "${search}". Try another search.`
                : "Add your first student to begin managing student records."}
            </p>

            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCurrentPage(1);
                }}
                className="
                  mt-5
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  px-5
                  py-2.5
                  text-sm
                  font-semibold
                  text-slate-700
                  hover:bg-slate-50
                "
              >
                Clear Search
              </button>
            )}
          </div>

        ) : (

          /* =================================================
             TABLE
          ================================================= */

          <div className="overflow-x-auto">

            <table className="min-w-[950px] w-full">

              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Student
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Roll No
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Course
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Semester
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Section
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                    Actions
                  </th>

                </tr>
              </thead>


              <tbody className="divide-y divide-slate-100">

                {paginatedStudents.map(
                  (student) => {

                    const id =
                      student._id ||
                      student.id;

                    const initial =
                      student.name
                        ?.charAt(0)
                        ?.toUpperCase() ||
                      "S";

                    return (
                      <tr
                        key={id}
                        className="
                          transition
                          hover:bg-slate-50
                        "
                      >

                        {/* STUDENT */}

                        <td className="px-6 py-4">

                          <div className="flex items-center gap-3">

                            <div className="
                              flex
                              h-11
                              w-11
                              shrink-0
                              items-center
                              justify-center
                              rounded-full
                              bg-violet-100
                              text-sm
                              font-bold
                              text-violet-700
                            ">
                              {initial}
                            </div>

                            <div className="min-w-0">

                              <p className="truncate text-sm font-semibold text-slate-900">
                                {student.name ||
                                  "-"}
                              </p>

                              <p className="truncate text-xs text-slate-500">
                                {student.email ||
                                  "-"}
                              </p>

                            </div>
                          </div>

                        </td>


                        {/* ROLL */}

                        <td className="px-6 py-4">

                          <span className="
                            rounded-lg
                            bg-slate-100
                            px-2.5
                            py-1
                            text-xs
                            font-semibold
                            text-slate-700
                          ">
                            {student.rollNo ||
                              "-"}
                          </span>

                        </td>


                        {/* COURSE */}

                        <td className="px-6 py-4 text-sm font-medium text-slate-700">
                          {student.course ||
                            "-"}
                        </td>


                        {/* SEMESTER */}

                        <td className="px-6 py-4 text-sm text-slate-600">
                          Semester{" "}
                          {student.semester ||
                            "-"}
                        </td>


                        {/* SECTION */}

                        <td className="px-6 py-4">

                          <span className="
                            inline-flex
                            rounded-full
                            bg-violet-50
                            px-3
                            py-1
                            text-xs
                            font-bold
                            text-violet-700
                          ">
                            Section{" "}
                            {student.section ||
                              "-"}
                          </span>

                        </td>


                        {/* ACTIONS */}

                        <td className="px-6 py-4">

                          <div className="flex justify-end gap-2">

                            {/* EDIT */}

                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(
                                  student
                                )
                              }
                              className="
                                rounded-lg
                                border
                                border-slate-200
                                bg-white
                                px-3
                                py-1.5
                                text-xs
                                font-semibold
                                text-slate-700
                                transition
                                hover:border-violet-200
                                hover:bg-violet-50
                                hover:text-violet-700
                              "
                            >
                              ✏ Edit
                            </button>


                            {/* DELETE */}

                            <button
                              type="button"
                              onClick={() =>
                                openDeleteModal(
                                  student
                                )
                              }
                              disabled={deleting}
                              className="
                                rounded-lg
                                border
                                border-red-100
                                bg-white
                                px-3
                                py-1.5
                                text-xs
                                font-semibold
                                text-red-600
                                transition
                                hover:bg-red-50
                                disabled:cursor-not-allowed
                                disabled:opacity-50
                              "
                            >
                              🗑 Delete
                            </button>

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


        {/* =================================================
            PAGINATION
        ================================================= */}

        {!loading &&
          filteredStudents.length >
            0 && (

            <div className="
              flex
              flex-col
              gap-4
              border-t
              border-slate-200
              bg-slate-50
              px-6
              py-4
              sm:flex-row
              sm:items-center
              sm:justify-between
            ">

              {/* RANGE */}

              <div className="text-sm text-slate-500">

                Showing{" "}

                <span className="font-semibold text-slate-800">
                  {startIndex + 1}
                </span>

                {" - "}

                <span className="font-semibold text-slate-800">
                  {Math.min(
                    endIndex,
                    filteredStudents.length
                  )}
                </span>

                {" of "}

                <span className="font-semibold text-slate-800">
                  {
                    filteredStudents.length
                  }
                </span>

                {" students"}

              </div>


              {/* PAGINATION BUTTONS */}

              {totalPages > 1 && (

                <div className="flex items-center gap-1">

                  {/* PREVIOUS */}

                  <button
                    type="button"
                    disabled={
                      currentPage ===
                      1
                    }
                    onClick={() =>
                      setCurrentPage(
                        (page) =>
                          Math.max(
                            page - 1,
                            1
                          )
                      )
                    }
                    className="
                      flex
                      h-9
                      w-9
                      items-center
                      justify-center
                      rounded-lg
                      border
                      border-slate-200
                      bg-white
                      text-sm
                      font-semibold
                      text-slate-600
                      transition
                      hover:bg-slate-100
                      disabled:cursor-not-allowed
                      disabled:opacity-40
                    "
                    aria-label="Previous page"
                  >
                    ←
                  </button>


                  {/* PAGE NUMBERS */}

                  {getPageNumbers().map(
                    (page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() =>
                          setCurrentPage(
                            page
                          )
                        }
                        className={`
                          flex
                          h-9
                          min-w-9
                          items-center
                          justify-center
                          rounded-lg
                          px-2
                          text-sm
                          font-semibold
                          transition
                          ${
                            currentPage ===
                            page
                              ? "bg-violet-600 text-white shadow-sm"
                              : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                          }
                        `}
                      >
                        {page}
                      </button>
                    )
                  )}


                  {/* NEXT */}

                  <button
                    type="button"
                    disabled={
                      currentPage ===
                      totalPages
                    }
                    onClick={() =>
                      setCurrentPage(
                        (page) =>
                          Math.min(
                            page + 1,
                            totalPages
                          )
                      )
                    }
                    className="
                      flex
                      h-9
                      w-9
                      items-center
                      justify-center
                      rounded-lg
                      border
                      border-slate-200
                      bg-white
                      text-sm
                      font-semibold
                      text-slate-600
                      transition
                      hover:bg-slate-100
                      disabled:cursor-not-allowed
                      disabled:opacity-40
                    "
                    aria-label="Next page"
                  >
                    →
                  </button>

                </div>
              )}

            </div>
          )}

      </div>


      {/* =================================================
          ADD STUDENT MODAL
      ================================================= */}

      {showAddModal && (
        <StudentModal
          title="Add Student"
          description="Enter the student's details below."
          fields={studentFields}
          values={form}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onClose={closeAddModal}
          loading={saving}
          error={formError}
          submitText="Add Student"
        />
      )}


      {/* =================================================
          EDIT STUDENT MODAL
      ================================================= */}

      {showEditModal && (
        <StudentModal
          title="Edit Student"
          description="Update the student's information."
          fields={studentFields}
          values={form}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onClose={closeEditModal}
          loading={saving}
          error={formError}
          submitText="Update Student"
        />
      )}


      {/* =================================================
          DELETE CONFIRMATION POPUP
      ================================================= */}

      {deleteStudent && (
        <DeleteConfirmationModal
          student={deleteStudent}
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={closeDeleteModal}
        />
      )}

    </div>
  );
}


// =====================================================
// DELETE CONFIRMATION MODAL
// =====================================================

function DeleteConfirmationModal({
  student,
  loading,
  onConfirm,
  onCancel,
}) {
  return (
    <div
      className="
        fixed
        inset-0
        z-[100]
        flex
        items-center
        justify-center
        bg-slate-950/50
        p-4
        backdrop-blur-sm
      "
      onMouseDown={(event) => {
        if (
          event.target ===
            event.currentTarget &&
          !loading
        ) {
          onCancel();
        }
      }}
    >

      <div
        className="
          w-full
          max-w-md
          overflow-hidden
          rounded-2xl
          bg-white
          shadow-2xl
        "
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >

        {/* HEADER */}

        <div className="
          flex
          items-start
          justify-between
          border-b
          border-slate-200
          px-6
          py-5
        ">

          <div className="flex items-center gap-3">

            <div className="
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-red-100
              text-xl
            ">
              🗑
            </div>

            <div>

              <h3 className="text-lg font-bold text-slate-900">
                Delete Student?
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Confirm student deletion
              </p>

            </div>

          </div>


          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-lg
              text-xl
              text-slate-400
              transition
              hover:bg-slate-100
              hover:text-slate-700
              disabled:cursor-not-allowed
              disabled:opacity-40
            "
            aria-label="Close"
          >
            ×
          </button>

        </div>


        {/* CONTENT */}

        <div className="px-6 py-6">

          <p className="text-sm leading-6 text-slate-600">
            Are you sure you want to delete
            this student?
          </p>


          {/* STUDENT INFO */}

          <div className="
            mt-4
            rounded-xl
            border
            border-red-100
            bg-red-50
            p-4
          ">

            <div className="flex items-center gap-3">

              <div className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-full
                bg-violet-100
                text-sm
                font-bold
                text-violet-700
              ">
                {student.name
                  ?.charAt(0)
                  ?.toUpperCase() || "S"}
              </div>


              <div className="min-w-0">

                <p className="truncate text-sm font-bold text-slate-900">
                  {student.name ||
                    "Unknown Student"}
                </p>

                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {student.rollNo ||
                    "No roll number"}
                </p>

              </div>

            </div>

          </div>


          <p className="mt-4 text-xs leading-5 text-red-600">
            This action cannot be undone.
            The student record will be permanently
            removed.
          </p>

        </div>


        {/* BUTTONS */}

        <div className="
          flex
          flex-col-reverse
          gap-3
          border-t
          border-slate-100
          px-6
          py-5
          sm:flex-row
          sm:justify-end
        ">

          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="
              rounded-xl
              border
              border-slate-200
              bg-white
              px-5
              py-2.5
              text-sm
              font-semibold
              text-slate-700
              transition
              hover:bg-slate-50
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            Cancel
          </button>


          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-red-600
              px-5
              py-2.5
              text-sm
              font-semibold
              text-white
              shadow-sm
              transition
              hover:bg-red-700
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            {loading ? (
              <>
                <span className="
                  h-4
                  w-4
                  animate-spin
                  rounded-full
                  border-2
                  border-white/40
                  border-t-white
                " />

                Deleting...
              </>
            ) : (
              <>
                🗑 Delete Student
              </>
            )}
          </button>

        </div>

      </div>
    </div>
  );
}


// =====================================================
// STUDENT ADD / EDIT MODAL
// =====================================================

function StudentModal({
  title,
  description,
  fields,
  values,
  onChange,
  onSubmit,
  onClose,
  loading,
  error,
  submitText,
}) {

  function handleBackdrop(event) {
    if (
      event.target ===
        event.currentTarget &&
      !loading
    ) {
      onClose();
    }
  }


  return (
    <div
      className="
        fixed
        inset-0
        z-50
        flex
        items-center
        justify-center
        bg-slate-950/50
        p-4
        backdrop-blur-sm
      "
      onMouseDown={
        handleBackdrop
      }
    >

      <div
        className="
          max-h-[90vh]
          w-full
          max-w-2xl
          overflow-y-auto
          rounded-2xl
          bg-white
          shadow-2xl
        "
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >

        {/* MODAL HEADER */}

        <div className="
          flex
          items-start
          justify-between
          border-b
          border-slate-200
          px-6
          py-5
        ">

          <div>

            <h3 className="text-xl font-bold text-slate-900">
              {title}
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {description}
            </p>

          </div>


          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-lg
              text-xl
              text-slate-400
              transition
              hover:bg-slate-100
              hover:text-slate-700
              disabled:cursor-not-allowed
              disabled:opacity-40
            "
            aria-label="Close"
          >
            ×
          </button>

        </div>


        {/* FORM */}

        <form
          onSubmit={onSubmit}
          className="p-6"
        >

          {/* ERROR */}

          {error && (
            <div className="
              mb-5
              rounded-xl
              border
              border-red-200
              bg-red-50
              px-4
              py-3
              text-sm
              text-red-700
            ">
              {error}
            </div>
          )}


          {/* FIELDS */}

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

            {fields.map(
              (field) => {

                const value =
                  values[
                    field.name
                  ] ?? "";

                const fullWidth =
                  field.name ===
                  "phone";

                return (
                  <div
                    key={
                      field.name
                    }
                    className={
                      fullWidth
                        ? "sm:col-span-2"
                        : ""
                    }
                  >

                    <label className="
                      mb-1.5
                      block
                      text-sm
                      font-semibold
                      text-slate-700
                    ">

                      {field.label}

                      {field.required && (
                        <span className="ml-1 text-red-500">
                          *
                        </span>
                      )}

                    </label>


                    {field.type ===
                    "select" ? (

                      <select
                        value={
                          value
                        }
                        onChange={(
                          event
                        ) =>
                          onChange(
                            field.name,
                            event
                              .target
                              .value
                          )
                        }
                        required={
                          field.required
                        }
                        className="
                          w-full
                          rounded-xl
                          border
                          border-slate-200
                          bg-white
                          px-4
                          py-2.5
                          text-sm
                          text-slate-800
                          outline-none
                          transition
                          focus:border-violet-500
                          focus:ring-2
                          focus:ring-violet-100
                        "
                      >

                        {field.options.map(
                          (
                            option
                          ) => {

                            const optionValue =
                              typeof option ===
                              "string"
                                ? option
                                : option.value;

                            const optionLabel =
                              typeof option ===
                              "string"
                                ? option
                                : option.label;

                            return (
                              <option
                                key={
                                  optionValue
                                }
                                value={
                                  optionValue
                                }
                              >
                                {
                                  optionLabel
                                }
                              </option>
                            );
                          }
                        )}

                      </select>

                    ) : (

                      <input
                        type={
                          field.type ||
                          "text"
                        }
                        value={
                          value
                        }
                        onChange={(
                          event
                        ) =>
                          onChange(
                            field.name,
                            event
                              .target
                              .value
                          )
                        }
                        placeholder={
                          field.placeholder
                        }
                        required={
                          field.required
                        }
                        className="
                          w-full
                          rounded-xl
                          border
                          border-slate-200
                          bg-white
                          px-4
                          py-2.5
                          text-sm
                          text-slate-800
                          outline-none
                          transition
                          placeholder:text-slate-400
                          focus:border-violet-500
                          focus:ring-2
                          focus:ring-violet-100
                        "
                      />

                    )}

                  </div>
                );
              }
            )}

          </div>


          {/* BUTTONS */}

          <div className="
            mt-6
            flex
            flex-col-reverse
            gap-3
            border-t
            border-slate-100
            pt-5
            sm:flex-row
            sm:justify-end
          ">

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="
                rounded-xl
                border
                border-slate-200
                bg-white
                px-5
                py-2.5
                text-sm
                font-semibold
                text-slate-700
                transition
                hover:bg-slate-50
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              Cancel
            </button>


            <button
              type="submit"
              disabled={loading}
              className="
                rounded-xl
                bg-violet-600
                px-5
                py-2.5
                text-sm
                font-semibold
                text-white
                shadow-sm
                transition
                hover:bg-violet-700
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              {loading
                ? "Saving..."
                : submitText}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}