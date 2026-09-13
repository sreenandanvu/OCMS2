import React, { useEffect, useMemo, useState } from "react";
import { get, post, put, remove } from "../services/api";
import ConfirmModal from "../components/ConfirmModal";
import Loading from "../components/Loading";
import ErrorBox from "../components/ErrorBox";
import Empty from "../components/Empty";

const EMPTY_FORM = {
  title: "",
  description: "",
  subject: "Web Technologies",
  course: "MCA",
  semester: "1",
  dueDate: "",
};

const SUBJECTS = [
  "Web Technologies",
  "Data Structures",
  "Advanced DBMS",
  "Discrete Mathematics",
];

const COURSES = ["MCA", "MBA", "BCA"];

const SEMESTERS = ["1", "2", "3", "4", "5", "6"];

const PAGE_SIZE = 7;

export default function Assignments() {
  const [assignments, setAssignments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");

  const [page, setPage] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);

  const [viewItem, setViewItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);

  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const storedUser = JSON.parse(
        localStorage.getItem("ocms_user") || "null"
      );

      setUser(storedUser);
    } catch {
      setUser(null);
    }
  }, []);

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
    } catch (err) {
      setError(err.message || "Unable to load assignments.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAssignments();
  }, []);

  function getId(item) {
    return item?._id || item?.id;
  }

  function handleChange(name, value) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function openCreate() {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setShowForm(true);
  }

  function openEdit(item) {
    setEditingItem(item);

    setForm({
      title: item.title || "",
      description: item.description || "",
      subject: item.subject || "Web Technologies",
      course: item.course || "MCA",
      semester: String(item.semester || "1"),
      dueDate: formatDateForInput(item.dueDate),
    });

    setFormError("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setFormError("");
  }

  async function submit(e) {
    e.preventDefault();

    if (!form.title.trim()) {
      setFormError("Assignment title is required.");
      return;
    }

    if (!form.description.trim()) {
      setFormError("Description is required.");
      return;
    }

    if (!form.subject) {
      setFormError("Please select a subject.");
      return;
    }

    if (!form.course) {
      setFormError("Please select a course.");
      return;
    }

    if (!form.semester) {
      setFormError("Please select a semester.");
      return;
    }

    if (!form.dueDate) {
      setFormError("Due date is required.");
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      const facultyName =
        user?.name || "Anjali Faculty";

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        subject: form.subject,
        course: form.course,
        semester: Number(form.semester),
        dueDate: form.dueDate,
        faculty: facultyName,
      };

      if (editingItem) {
        const id = getId(editingItem);

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
            getId(item) === id ? updated : item
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
          created,
          ...current,
        ]);
      }

      closeForm();
      setPage(1);
    } catch (err) {
      setFormError(
        err.message ||
          `Unable to ${
            editingItem ? "update" : "create"
          } assignment.`
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteAssignment() {
    if (!deleteItem) return;

    const id = getId(deleteItem);

    if (!id) {
      setError("Unable to delete assignment: ID not found.");
      setDeleteItem(null);
      return;
    }

    try {
      await remove(`/assignments/${id}`);

      setAssignments((current) =>
        current.filter((item) => getId(item) !== id)
      );

      setDeleteItem(null);

      const remainingAfterDelete =
        filteredAssignments.length - 1;

      const maxPage =
        Math.max(
          1,
          Math.ceil(
            remainingAfterDelete / PAGE_SIZE
          )
        );

      setPage((current) =>
        Math.min(current, maxPage)
      );
    } catch (err) {
      setError(
        err.message || "Unable to delete assignment."
      );
      setDeleteItem(null);
    }
  }

  const filteredAssignments = useMemo(() => {
    const term = search.trim().toLowerCase();

    return assignments.filter((item) => {
      const matchesSearch =
        !term ||
        [
          item.title,
          item.description,
          item.subject,
          item.course,
          item.semester,
          item.dueDate,
          item.faculty,
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

      const matchesSubject =
        !subjectFilter ||
        item.subject === subjectFilter;

      const matchesCourse =
        !courseFilter ||
        item.course === courseFilter;

      const matchesSemester =
        !semesterFilter ||
        String(item.semester) === semesterFilter;

      return (
        matchesSearch &&
        matchesSubject &&
        matchesCourse &&
        matchesSemester
      );
    });
  }, [
    assignments,
    search,
    subjectFilter,
    courseFilter,
    semesterFilter,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredAssignments.length / PAGE_SIZE
    )
  );

  const safePage = Math.min(page, totalPages);

  const paginatedAssignments =
    filteredAssignments.slice(
      (safePage - 1) * PAGE_SIZE,
      safePage * PAGE_SIZE
    );

  useEffect(() => {
    setPage(1);
  }, [
    search,
    subjectFilter,
    courseFilter,
    semesterFilter,
  ]);

  function resetFilters() {
    setSearch("");
    setSubjectFilter("");
    setCourseFilter("");
    setSemesterFilter("");
    setPage(1);
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
              Assignments
            </h2>

            <p className="mt-2 max-w-2xl text-sm text-blue-100">
              Create and manage assignments for your
              students.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreate}
            className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50"
          >
            + Create Assignment
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Total Assignments"
          value={assignments.length}
          icon="📝"
        />

        <SummaryCard
          label="Filtered Results"
          value={filteredAssignments.length}
          icon="🔎"
        />

        <SummaryCard
          label="Subjects"
          value={
            new Set(
              assignments
                .map((item) => item.subject)
                .filter(Boolean)
            ).size
          }
          icon="📚"
        />
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Assignment Management
            </h3>

            <p className="text-sm text-slate-500">
              Search, filter and manage assignments.
            </p>
          </div>

          <button
            type="button"
            onClick={loadAssignments}
            disabled={loading}
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            ↻ Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
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
              placeholder="Search assignments..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <SelectFilter
            label="Subject"
            value={subjectFilter}
            onChange={setSubjectFilter}
            options={SUBJECTS}
            placeholder="All subjects"
          />

          <SelectFilter
            label="Course"
            value={courseFilter}
            onChange={setCourseFilter}
            options={COURSES}
            placeholder="All courses"
          />

          <SelectFilter
            label="Semester"
            value={semesterFilter}
            onChange={setSemesterFilter}
            options={SEMESTERS}
            placeholder="All semesters"
          />
        </div>

        {(search ||
          subjectFilter ||
          courseFilter ||
          semesterFilter) && (
          <div className="mt-3">
            <button
              type="button"
              onClick={resetFilters}
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              Reset filters
            </button>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <ErrorBox
          message={error}
          onRetry={loadAssignments}
        />
      )}

      {/* Table */}
      <div className="w-full max-w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold text-slate-900">
                My Assignments
              </h3>

              <p className="text-sm text-slate-500">
                Showing{" "}
                {filteredAssignments.length === 0
                  ? 0
                  : (safePage - 1) * PAGE_SIZE + 1}
                –
                {Math.min(
                  safePage * PAGE_SIZE,
                  filteredAssignments.length
                )}{" "}
                of {filteredAssignments.length}
              </p>
            </div>

            <span className="text-xs font-medium text-slate-500">
              {PAGE_SIZE} per page
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-8">
            <Loading />
          </div>
        ) : paginatedAssignments.length === 0 ? (
          <div className="p-8">
            <Empty
              title="No assignments found"
              message={
                assignments.length === 0
                  ? "Create your first assignment."
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
                    <th className="w-[25%] px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-4">
                      Assignment
                    </th>

                    <th className="w-[20%] px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-4">
                      Subject
                    </th>

                    <th className="w-[12%] px-2 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Course
                    </th>

                    <th className="w-[12%] px-2 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Sem.
                    </th>

                    <th className="w-[16%] px-2 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Due Date
                    </th>

                    <th className="w-[15%] px-2 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {paginatedAssignments.map(
                    (item) => (
                      <tr
                        key={getId(item)}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-3 py-3 sm:px-4">
                          <div className="min-w-0">
                            <p
                              className="truncate text-sm font-semibold text-slate-900"
                              title={item.title}
                            >
                              {item.title || "Untitled"}
                            </p>

                            <p
                              className="mt-0.5 truncate text-xs text-slate-500"
                              title={item.description}
                            >
                              {item.description ||
                                "No description"}
                            </p>
                          </div>
                        </td>

                        <td className="px-3 py-3 sm:px-4">
                          <span
                            className="block truncate text-sm text-slate-700"
                            title={item.subject}
                          >
                            {item.subject || "—"}
                          </span>
                        </td>

                        <td className="px-2 py-3 text-sm text-slate-700">
                          {item.course || "—"}
                        </td>

                        <td className="px-2 py-3 text-sm text-slate-700">
                          {item.semester
                            ? `S${item.semester}`
                            : "—"}
                        </td>

                        <td className="px-2 py-3">
                          <span className="text-sm text-slate-700">
                            {formatDate(
                              item.dueDate
                            )}
                          </span>
                        </td>

                        <td className="px-2 py-3">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                setViewItem(item)
                              }
                              title="View"
                              className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
                            >
                              <span className="hidden lg:inline">
                                View
                              </span>
                              <span className="lg:hidden">
                                👁
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                openEdit(item)
                              }
                              title="Edit"
                              className="rounded-lg border border-blue-200 px-2 py-1.5 text-xs font-medium text-blue-600 transition hover:bg-blue-50"
                            >
                              <span className="hidden lg:inline">
                                Edit
                              </span>
                              <span className="lg:hidden">
                                ✎
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setDeleteItem(item)
                              }
                              title="Delete"
                              className="rounded-lg border border-red-200 px-2 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                            >
                              <span className="hidden lg:inline">
                                Delete
                              </span>
                              <span className="lg:hidden">
                                🗑
                              </span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Page {safePage} of {totalPages}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={safePage === 1}
                  onClick={() =>
                    setPage((current) =>
                      Math.max(1, current - 1)
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

      {/* Create / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {editingItem
                      ? "Edit Assignment"
                      : "Create Assignment"}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {editingItem
                      ? "Update the assignment details."
                      : "Give your students a new assignment."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  ✕
                </button>
              </div>
            </div>

            <form
              onSubmit={submit}
              className="space-y-5 p-5 sm:p-6"
            >
              {formError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Assignment Title
                </label>

                <input
                  value={form.title}
                  onChange={(e) =>
                    handleChange(
                      "title",
                      e.target.value
                    )
                  }
                  placeholder="Enter assignment title"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Description
                </label>

                <textarea
                  value={form.description}
                  onChange={(e) =>
                    handleChange(
                      "description",
                      e.target.value
                    )
                  }
                  placeholder="Assignment instructions..."
                  rows={4}
                  className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormSelect
                  label="Subject"
                  value={form.subject}
                  onChange={(value) =>
                    handleChange(
                      "subject",
                      value
                    )
                  }
                  options={SUBJECTS}
                />

                <FormSelect
                  label="Course"
                  value={form.course}
                  onChange={(value) =>
                    handleChange(
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
                    handleChange(
                      "semester",
                      value
                    )
                  }
                  options={SEMESTERS}
                />

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Due Date
                  </label>

                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) =>
                      handleChange(
                        "dueDate",
                        e.target.value
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingItem
                    ? "Update Assignment"
                    : "Create Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                    Assignment Details
                  </p>

                  <h3 className="mt-1 text-xl font-bold text-slate-900">
                    {viewItem.title ||
                      "Untitled Assignment"}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setViewItem(null)
                  }
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <div className="grid grid-cols-2 gap-3">
                <InfoItem
                  label="Subject"
                  value={viewItem.subject}
                />

                <InfoItem
                  label="Course"
                  value={viewItem.course}
                />

                <InfoItem
                  label="Semester"
                  value={
                    viewItem.semester
                      ? `Semester ${viewItem.semester}`
                      : "—"
                  }
                />

                <InfoItem
                  label="Due Date"
                  value={formatDate(
                    viewItem.dueDate
                  )}
                />
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Faculty
                </p>

                <p className="text-sm text-slate-800">
                  {viewItem.faculty ||
                    user?.name ||
                    "Anjali Faculty"}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Description
                </p>

                <div className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                  {viewItem.description ||
                    "No description provided."}
                </div>
              </div>

              <div className="flex justify-end border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() =>
                    setViewItem(null)
                  }
                  className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        open={Boolean(deleteItem)}
        title="Delete Assignment?"
        message={
          deleteItem
            ? `Are you sure you want to delete "${deleteItem.title}"? This assignment will be permanently deleted.`
            : "This assignment will be permanently deleted."
        }
        confirmText="Delete"
        onConfirm={deleteAssignment}
        onCancel={() => setDeleteItem(null)}
      />
    </div>
  );
}

function SummaryCard({ label, value, icon }) {
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
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-xl">
          {icon}
        </div>
      </div>
    </div>
  );
}

function SelectFilter({
  label,
  value,
  onChange,
  options,
  placeholder,
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
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      >
        <option value="">{placeholder}</option>

        {options.map((option) => (
          <option key={option} value={option}>
            {label === "Semester"
              ? `Semester ${option}`
              : option}
          </option>
        ))}
      </select>
    </div>
  );
}

function FormSelect({
  label,
  value,
  onChange,
  options,
}) {
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
        required
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {label === "Semester"
              ? `Semester ${option}`
              : option}
          </option>
        ))}
      </select>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-medium text-slate-800">
        {value || "—"}
      </p>
    </div>
  );
}

function formatDate(date) {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return String(date);
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateForInput(date) {
  if (!date) return "";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return String(date).slice(0, 10);
  }

  const year = parsed.getFullYear();
  const month = String(
    parsed.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    parsed.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}