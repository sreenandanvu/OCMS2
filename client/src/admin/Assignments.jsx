import React, { useEffect, useMemo, useState } from "react";
import { get, post, put, remove } from "../services/api";
import Loading from "../components/Loading";
import ErrorBox from "../components/ErrorBox";
import Empty from "../components/Empty";
import ConfirmModal from "../components/ConfirmModal";

const ITEMS_PER_PAGE = 7;

const EMPTY_FORM = {
  title: "",
  subject: "",
  faculty: "",
  course: "MCA",
  semester: "1",
  dueDate: "",
};

const COURSES = ["MCA", "MBA", "BCA", "BBA"];
const SEMESTERS = ["1", "2", "3", "4", "5", "6"];

export default function Assignments() {
  const [assignments, setAssignments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [editingAssignment, setEditingAssignment] =
    useState(null);

  const [deleteItem, setDeleteItem] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);

  /* -------------------------------------------------------
     Load assignments
  ------------------------------------------------------- */

  async function loadAssignments() {
    setLoading(true);
    setError("");

    try {
      const response = await get("/assignments");

      const data = Array.isArray(response)
        ? response
        : response.assignments ||
          response.data ||
          [];

      setAssignments(data);
      setCurrentPage(1);
    } catch (err) {
      setError(
        err.message ||
          "Unable to load assignments."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAssignments();
  }, []);

  /* -------------------------------------------------------
     Search
  ------------------------------------------------------- */

  const filteredAssignments = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return assignments;

    return assignments.filter((item) =>
      [
        item.title,
        item.subject,
        item.faculty,
        item.course,
        item.semester,
        item.dueDate,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [assignments, search]);

  /* -------------------------------------------------------
     Pagination
  ------------------------------------------------------- */

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredAssignments.length /
        ITEMS_PER_PAGE
    )
  );

  const paginatedAssignments = useMemo(() => {
    const start =
      (currentPage - 1) *
      ITEMS_PER_PAGE;

    return filteredAssignments.slice(
      start,
      start + ITEMS_PER_PAGE
    );
  }, [
    filteredAssignments,
    currentPage,
  ]);

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
     Form
  ------------------------------------------------------- */

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setFormError("");
  }

  function openAddModal() {
    setEditingAssignment(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setShowModal(true);
  }

  function openEditModal(assignment) {
    setEditingAssignment(assignment);

    setForm({
      title: assignment.title || "",
      subject: assignment.subject || "",
      faculty: assignment.faculty || "",
      course: assignment.course || "MCA",
      semester: String(
        assignment.semester || "1"
      ),
      dueDate: assignment.dueDate
        ? String(assignment.dueDate).slice(0, 10)
        : "",
    });

    setFormError("");
    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setEditingAssignment(null);
    setForm(EMPTY_FORM);
    setFormError("");
  }

  /* -------------------------------------------------------
     Add / Update
  ------------------------------------------------------- */

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.title.trim()) {
      setFormError(
        "Please enter an assignment title."
      );
      return;
    }

    if (!form.subject.trim()) {
      setFormError(
        "Please enter a subject."
      );
      return;
    }

    if (!form.faculty.trim()) {
      setFormError(
        "Please enter the faculty name."
      );
      return;
    }

    if (!form.dueDate) {
      setFormError(
        "Please select a due date."
      );
      return;
    }

    setSaving(true);
    setFormError("");

    const payload = {
      title: form.title.trim(),
      subject: form.subject.trim(),
      faculty: form.faculty.trim(),
      course: form.course,
      semester: Number(form.semester),
      dueDate: form.dueDate,
    };

    try {
      if (editingAssignment) {
        const id =
          editingAssignment._id ||
          editingAssignment.id;

        const response = await put(
          `/assignments/${id}`,
          payload
        );

        const updated =
          response.assignment ||
          response.data ||
          response;

        setAssignments((current) =>
          current.map((item) =>
            (item._id || item.id) === id
              ? updated
              : item
          )
        );
      } else {
        const response = await post(
          "/assignments",
          payload
        );

        const created =
          response.assignment ||
          response.data ||
          response;

        setAssignments((current) => [
          ...current,
          created,
        ]);
      }

      closeModal();
    } catch (err) {
      setFormError(
        err.message ||
          "Unable to save assignment."
      );
    } finally {
      setSaving(false);
    }
  }

  /* -------------------------------------------------------
     Delete
  ------------------------------------------------------- */

  async function handleDelete() {
    if (!deleteItem) return;

    const id =
      deleteItem._id || deleteItem.id;

    try {
      await remove(
        `/assignments/${id}`
      );

      setAssignments((current) =>
        current.filter(
          (item) =>
            (item._id || item.id) !== id
        )
      );

      setDeleteItem(null);
    } catch (err) {
      setError(
        err.message ||
          "Unable to delete assignment."
      );

      setDeleteItem(null);
    }
  }

  /* -------------------------------------------------------
     Date formatting
  ------------------------------------------------------- */

  function formatDate(date) {
    if (!date) return "-";

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

  /* -------------------------------------------------------
     Loading
  ------------------------------------------------------- */

  if (loading) {
    return (
      <div className="p-6">
        <Loading message="Loading assignments..." />
      </div>
    );
  }

  /* -------------------------------------------------------
     Error
  ------------------------------------------------------- */

  if (error && !assignments.length) {
    return (
      <div className="p-6">
        <ErrorBox
          message={error}
          onRetry={loadAssignments}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Assignments
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Create and manage assignments for students.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={loadAssignments}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            ↻ Refresh
          </button>

          <button
            type="button"
            onClick={openAddModal}
            className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
          >
            + Add Assignment
          </button>
        </div>
      </div>

      {/* Error */}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Search */}

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            🔍
          </span>

          <input
            type="text"
            value={search}
            onChange={(e) =>
              handleSearch(e.target.value)
            }
            placeholder="Search title, subject, faculty, course..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
          />
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
          <span>
            {filteredAssignments.length} assignment
            {filteredAssignments.length !== 1
              ? "s"
              : ""}
          </span>

          {search && (
            <button
              type="button"
              onClick={() =>
                handleSearch("")
              }
              className="font-medium text-slate-700 hover:text-slate-900"
            >
              Clear search
            </button>
          )}
        </div>
      </div>

      {/* Assignment table */}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="font-semibold text-slate-900">
            Assignment Records
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            {filteredAssignments.length} assignments found
          </p>
        </div>

        {!filteredAssignments.length ? (
          <div className="p-10 text-center">
            {search ? (
              <>
                <div className="text-4xl">
                  🔍
                </div>

                <h3 className="mt-3 font-semibold text-slate-900">
                  No assignments found
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Try a different search term.
                </p>
              </>
            ) : (
              <Empty
                title="No assignments"
                message="Create an assignment to see it here."
              />
            )}
          </div>
        ) : (
          <div className="w-full">
            <table className="w-full table-fixed">
              <thead className="bg-slate-50">
                <tr>
                  <th className="w-[20%] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Title
                  </th>

                  <th className="w-[17%] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Subject
                  </th>

                  <th className="w-[17%] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Faculty
                  </th>

                  <th className="w-[10%] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Course
                  </th>

                  <th className="w-[12%] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Semester
                  </th>

                  <th className="w-[12%] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Due Date
                  </th>

                  <th className="w-[12%] px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {paginatedAssignments.map(
                  (item) => {
                    const id =
                      item._id || item.id;

                    return (
                      <tr
                        key={id}
                        className="hover:bg-slate-50"
                      >
                        <td className="px-4 py-4">
                          <div className="truncate text-sm font-semibold text-slate-900">
                            {item.title || "-"}
                          </div>
                        </td>

                        <td className="truncate px-4 py-4 text-sm text-slate-600">
                          {item.subject || "-"}
                        </td>

                        <td className="truncate px-4 py-4 text-sm text-slate-600">
                          {item.faculty || "-"}
                        </td>

                        <td className="truncate px-4 py-4 text-sm text-slate-600">
                          {item.course || "-"}
                        </td>

                        <td className="truncate px-4 py-4 text-sm text-slate-600">
                          Semester{" "}
                          {item.semester || "-"}
                        </td>

                        <td className="truncate px-4 py-4 text-sm text-slate-600">
                          {formatDate(
                            item.dueDate
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(
                                  item
                                )
                              }
                              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setDeleteItem(
                                  item
                                )
                              }
                              className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                            >
                              Delete
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
      </div>

      {/* Pagination */}

      {totalPages > 1 && (
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Showing{" "}
            <span className="font-medium text-slate-700">
              {(currentPage - 1) *
                ITEMS_PER_PAGE +
                1}
            </span>{" "}
            to{" "}
            <span className="font-medium text-slate-700">
              {Math.min(
                currentPage *
                  ITEMS_PER_PAGE,
                filteredAssignments.length
              )}
            </span>{" "}
            of{" "}
            <span className="font-medium text-slate-700">
              {filteredAssignments.length}
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
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
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
                onClick={() =>
                  setCurrentPage(page)
                }
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
              disabled={
                currentPage === totalPages
              }
              onClick={() =>
                setCurrentPage((page) =>
                  Math.min(
                    totalPages,
                    page + 1
                  )
                )
              }
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingAssignment
                    ? "Edit Assignment"
                    : "Create Assignment"}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  {editingAssignment
                    ? "Update assignment details."
                    : "Enter assignment details."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-4 p-6"
            >
              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Assignment Title
                </label>

                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Enter assignment title"
                  required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Subject
                  </label>

                  <input
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    placeholder="Data Structures"
                    required
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Faculty
                  </label>

                  <input
                    name="faculty"
                    value={form.faculty}
                    onChange={handleChange}
                    placeholder="Faculty name"
                    required
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Course
                  </label>

                  <select
                    name="course"
                    value={form.course}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
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
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Semester
                  </label>

                  <select
                    name="semester"
                    value={form.semester}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
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
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Due Date
                </label>

                <input
                  type="date"
                  name="dueDate"
                  value={form.dueDate}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingAssignment
                    ? "Update Assignment"
                    : "Create Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}

      {deleteItem && (
        <ConfirmModal
          title="Delete Assignment"
          message={`Are you sure you want to delete "${deleteItem.title}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={handleDelete}
          onCancel={() =>
            setDeleteItem(null)
          }
        />
      )}
    </div>
  );
}