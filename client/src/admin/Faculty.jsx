import React, { useEffect, useMemo, useState } from "react";
import { get, post, put, remove } from "../services/api";
import ConfirmModal from "../components/ConfirmModal";

const EMPTY_FORM = {
  name: "",
  email: "",
  employeeId: "",
  department: "Computer Applications",
  designation: "Assistant Professor",
  phone: "",
};

const ROWS_PER_PAGE = 7;

const DEPARTMENTS = [
  "Computer Applications",
  "Computer Science",
  "Commerce",
  "Management",
  "Mathematics",
];

const DESIGNATIONS = [
  "Professor",
  "Associate Professor",
  "Assistant Professor",
  "Lecturer",
];

export default function Faculty() {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const [editingFaculty, setEditingFaculty] = useState(null);
  const [deleteFaculty, setDeleteFaculty] = useState(null);

  const [form, setForm] = useState({ ...EMPTY_FORM });

  // --------------------------------------------------
  // LOAD FACULTY
  // --------------------------------------------------

  async function loadFaculty() {
    setLoading(true);
    setError("");

    try {
      const response = await get("/faculty");

      const data = Array.isArray(response)
        ? response
        : response?.faculty || response?.data || [];

      setFaculty(data);
      setCurrentPage(1);
    } catch (err) {
      setError(err.message || "Unable to load faculty.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFaculty();
  }, []);

  // --------------------------------------------------
  // SEARCH
  // --------------------------------------------------

  const filteredFaculty = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return faculty;
    }

    return faculty.filter((member) => {
      const employeeId =
        member.employeeId ||
        member.employeeID ||
        member.empId ||
        "";

      return [
        member.name,
        member.email,
        employeeId,
        member.department,
        member.designation,
        member.phone,
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(query)
      );
    });
  }, [faculty, search]);

  // --------------------------------------------------
  // PAGINATION
  // --------------------------------------------------

  const totalPages = Math.max(
    1,
    Math.ceil(filteredFaculty.length / ROWS_PER_PAGE)
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;

  const paginatedFaculty = filteredFaculty.slice(
    startIndex,
    startIndex + ROWS_PER_PAGE
  );

  // --------------------------------------------------
  // ADD
  // --------------------------------------------------

  function openAddModal() {
    setForm({ ...EMPTY_FORM });
    setFormError("");
    setEditingFaculty(null);
    setShowAdd(true);
  }

  function closeAddModal() {
    if (saving) return;

    setShowAdd(false);
    setForm({ ...EMPTY_FORM });
    setFormError("");
  }

  // --------------------------------------------------
  // EDIT
  // --------------------------------------------------

  function openEditModal(member) {
    setEditingFaculty(member);

    setForm({
      name: member.name || "",
      email: member.email || "",
      employeeId:
        member.employeeId ||
        member.employeeID ||
        member.empId ||
        "",
      department:
        member.department || "Computer Applications",
      designation:
        member.designation || "Assistant Professor",
      phone: member.phone || "",
    });

    setFormError("");
    setShowEdit(true);
  }

  function closeEditModal() {
    if (saving) return;

    setShowEdit(false);
    setEditingFaculty(null);
    setForm({ ...EMPTY_FORM });
    setFormError("");
  }

  // --------------------------------------------------
  // FORM CHANGE
  // --------------------------------------------------

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  // --------------------------------------------------
  // SAVE
  // --------------------------------------------------

  async function handleSubmit(event) {
    event.preventDefault();

    setSaving(true);
    setFormError("");

    try {
      if (editingFaculty) {
        const id =
          editingFaculty._id ||
          editingFaculty.id;

        const response = await put(
          `/faculty/${id}`,
          form
        );

        const updated =
          response?.faculty ||
          response?.data ||
          response;

        setFaculty((current) =>
          current.map((member) =>
            (member._id || member.id) === id
              ? updated
              : member
          )
        );

        closeEditModal();
      } else {
        const response = await post(
          "/faculty",
          form
        );

        const created =
          response?.faculty ||
          response?.data ||
          response;

        setFaculty((current) => [
          ...current,
          created,
        ]);

        setCurrentPage(1);
        closeAddModal();
      }
    } catch (err) {
      setFormError(
        err.message || "Unable to save faculty."
      );
    } finally {
      setSaving(false);
    }
  }

  // --------------------------------------------------
  // DELETE
  // --------------------------------------------------

  async function handleDelete() {
    if (!deleteFaculty) return;

    const id =
      deleteFaculty._id ||
      deleteFaculty.id;

    setDeleting(true);

    try {
      await remove(`/faculty/${id}`);

      setFaculty((current) =>
        current.filter(
          (member) =>
            (member._id || member.id) !== id
        )
      );

      setDeleteFaculty(null);
    } catch (err) {
      setError(
        err.message || "Unable to delete faculty."
      );

      setDeleteFaculty(null);
    } finally {
      setDeleting(false);
    }
  }

  // --------------------------------------------------
  // EXPORT
  // --------------------------------------------------

  function exportFaculty() {
    if (!filteredFaculty.length) return;

    const headers = [
      "Faculty Name",
      "Email",
      "Employee ID",
      "Department",
      "Designation",
      "Phone",
    ];

    const rows = filteredFaculty.map((member) => [
      member.name || "",
      member.email || "",
      member.employeeId ||
        member.employeeID ||
        member.empId ||
        "",
      member.department || "",
      member.designation || "",
      member.phone || "",
    ]);

    function escapeCSV(value) {
      const text = String(value ?? "");

      if (
        text.includes(",") ||
        text.includes('"') ||
        text.includes("\n")
      ) {
        return `"${text.replace(/"/g, '""')}"`;
      }

      return text;
    }

    const csv = [headers, ...rows]
      .map((row) =>
        row.map(escapeCSV).join(",")
      )
      .join("\n");

    const blob = new Blob(
      ["\ufeff" + csv],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "ocms-faculty.csv";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  // --------------------------------------------------
  // PAGE NUMBERS
  // --------------------------------------------------

  const pageNumbers = Array.from(
    { length: totalPages },
    (_, index) => index + 1
  );

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">

      {/* HEADER */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Faculty
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Manage faculty members, departments and teaching information.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
        >
          <span className="text-lg">+</span>
          Add Faculty
        </button>
      </div>

      {/* MAIN CARD */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* CARD HEADER */}
        <div className="border-b border-slate-200 p-5 sm:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Faculty Records
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-700">
                  {filteredFaculty.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-700">
                  {faculty.length}
                </span>{" "}
                faculty members
              </p>
            </div>

            {/* TOOLS */}
            <div className="flex flex-col gap-3 sm:flex-row">

              {/* SEARCH */}
              <div className="relative sm:w-72">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  🔎
                </span>

                <input
                  type="text"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search faculty..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-9 text-sm outline-none transition focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-100"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setCurrentPage(1);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-lg text-slate-400 hover:text-slate-700"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* EXPORT */}
              <button
                type="button"
                onClick={exportFaculty}
                disabled={!filteredFaculty.length}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                ↓ Export CSV
              </button>

              {/* REFRESH */}
              <button
                type="button"
                onClick={loadFaculty}
                disabled={loading}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                ↻ Refresh
              </button>

            </div>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="m-5 rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-red-800">
                  Unable to load faculty
                </p>

                <p className="mt-1 text-sm text-red-600">
                  {error}
                </p>
              </div>

              <button
                type="button"
                onClick={loadFaculty}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* LOADING */}
        {loading ? (
          <div className="space-y-4 p-6">
            {Array.from({ length: 7 }).map(
              (_, index) => (
                <div
                  key={index}
                  className="flex animate-pulse gap-3"
                >
                  <div className="h-10 w-10 rounded-full bg-slate-200" />

                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-48 rounded bg-slate-200" />
                    <div className="h-3 w-36 rounded bg-slate-100" />
                  </div>
                </div>
              )
            )}
          </div>
        ) : filteredFaculty.length === 0 ? (

          /* EMPTY */
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50 text-3xl">
              {search ? "🔎" : "👨‍🏫"}
            </div>

            <h3 className="mt-4 text-lg font-bold text-slate-900">
              {search
                ? "No faculty found"
                : "No faculty members yet"}
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              {search
                ? `No records match "${search}".`
                : "Add your first faculty member to begin."}
            </p>

            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCurrentPage(1);
                }}
                className="mt-5 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Clear Search
              </button>
            )}
          </div>

        ) : (

          /* TABLE */
          <div className="w-full">

            <table className="w-full table-fixed">

              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">

                  <th className="w-[23%] px-3 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500 sm:px-4">
                    Faculty
                  </th>

                  <th className="w-[13%] px-2 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Employee ID
                  </th>

                  <th className="w-[20%] px-2 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Department
                  </th>

                  <th className="w-[19%] px-2 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Designation
                  </th>

                  <th className="w-[13%] px-2 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Phone
                  </th>

                  <th className="w-[12%] px-2 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-500">
                    Actions
                  </th>

                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">

                {paginatedFaculty.map((member) => {
                  const id =
                    member._id ||
                    member.id;

                  const initial =
                    member.name
                      ?.charAt(0)
                      ?.toUpperCase() || "F";

                  const employeeId =
                    member.employeeId ||
                    member.employeeID ||
                    member.empId ||
                    "-";

                  return (
                    <tr
                      key={id}
                      className="hover:bg-slate-50"
                    >

                      {/* FACULTY */}
                      <td className="px-3 py-3 sm:px-4">
                        <div className="flex min-w-0 items-center gap-2">

                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">
                            {initial}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {member.name || "-"}
                            </p>

                            <p className="truncate text-xs text-slate-500">
                              {member.email || "-"}
                            </p>
                          </div>

                        </div>
                      </td>

                      {/* EMPLOYEE ID */}
                      <td className="px-2 py-3">
                        <span className="block truncate rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                          {employeeId}
                        </span>
                      </td>

                      {/* DEPARTMENT */}
                      <td className="px-2 py-3">
                        <p className="truncate text-sm font-medium text-slate-700">
                          {member.department || "-"}
                        </p>
                      </td>

                      {/* DESIGNATION */}
                      <td className="px-2 py-3">
                        <span className="block truncate rounded-full bg-violet-50 px-2 py-1 text-xs font-semibold text-violet-700">
                          {member.designation || "-"}
                        </span>
                      </td>

                      {/* PHONE */}
                      <td className="px-2 py-3">
                        <p className="truncate text-sm text-slate-600">
                          {member.phone || "-"}
                        </p>
                      </td>

                      {/* ACTIONS */}
                      <td className="px-1 py-3">

                        <div className="flex items-center justify-center gap-1">

                          <button
                            type="button"
                            onClick={() =>
                              openEditModal(member)
                            }
                            title="Edit faculty"
                            className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-xs hover:border-violet-300 hover:bg-violet-50"
                          >
                            ✏️
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setDeleteFaculty(member)
                            }
                            title="Delete faculty"
                            className="flex h-8 w-8 items-center justify-center rounded-md border border-red-100 bg-white text-xs hover:bg-red-50"
                          >
                            🗑️
                          </button>

                        </div>

                      </td>

                    </tr>
                  );
                })}

              </tbody>

            </table>

          </div>
        )}

        {/* PAGINATION */}
        {!loading &&
          filteredFaculty.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">

              <p className="text-sm text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-800">
                  {startIndex + 1}
                </span>{" "}
                -{" "}
                <span className="font-semibold text-slate-800">
                  {Math.min(
                    startIndex + ROWS_PER_PAGE,
                    filteredFaculty.length
                  )}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-800">
                  {filteredFaculty.length}
                </span>
              </p>

              {totalPages > 1 && (
                <div className="flex items-center gap-1">

                  {/* PREVIOUS */}
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() =>
                      setCurrentPage(
                        (page) =>
                          Math.max(
                            page - 1,
                            1
                          )
                      )
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm hover:bg-slate-100 disabled:opacity-40"
                  >
                    ←
                  </button>

                  {/* NUMBERS */}
                  {pageNumbers.map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() =>
                        setCurrentPage(page)
                      }
                      className={
                        currentPage === page
                          ? "flex h-9 min-w-9 items-center justify-center rounded-lg bg-violet-600 px-2 text-sm font-semibold text-white"
                          : "flex h-9 min-w-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                      }
                    >
                      {page}
                    </button>
                  ))}

                  {/* NEXT */}
                  <button
                    type="button"
                    disabled={
                      currentPage === totalPages
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
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm hover:bg-slate-100 disabled:opacity-40"
                  >
                    →
                  </button>

                </div>
              )}

            </div>
          )}

      </div>

      {/* ADD POPUP */}
      {showAdd && (
        <FacultyModal
          title="Add Faculty"
          description="Enter the faculty member's details."
          form={form}
          setForm={setForm}
          onSubmit={handleSubmit}
          onClose={closeAddModal}
          loading={saving}
          error={formError}
          submitText="Add Faculty"
        />
      )}

      {/* EDIT POPUP */}
      {showEdit && (
        <FacultyModal
          title="Edit Faculty"
          description="Update the faculty member's details."
          form={form}
          setForm={setForm}
          onSubmit={handleSubmit}
          onClose={closeEditModal}
          loading={saving}
          error={formError}
          submitText="Update Faculty"
        />
      )}

      {/* DELETE POPUP */}
      <ConfirmModal
        open={Boolean(deleteFaculty)}
        title="Delete Faculty?"
        message={
          deleteFaculty
            ? `Are you sure you want to delete ${deleteFaculty.name}? This action cannot be undone.`
            : ""
        }
        confirmText="Delete Faculty"
        cancelText="Cancel"
        onConfirm={handleDelete}
        onCancel={() =>
          setDeleteFaculty(null)
        }
        loading={deleting}
      />

    </div>
  );
}

// ==================================================
// FACULTY FORM MODAL
// ==================================================

function FacultyModal({
  title,
  description,
  form,
  setForm,
  onSubmit,
  onClose,
  loading,
  error,
  submitText,
}) {
  function updateField(name, value) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !loading
        ) {
          onClose();
        }
      }}
    >

      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >

        {/* MODAL HEADER */}
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">

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
            className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
          >
            ×
          </button>

        </div>

        {/* FORM */}
        <form
          onSubmit={onSubmit}
          className="p-6"
        >

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

            {/* NAME */}
            <FormField
              label="Faculty Name"
              required
            >
              <input
                name="name"
                value={form.name}
                onChange={handleChangeWrapper(
                  updateField
                )}
                placeholder="Enter faculty name"
                required
                className={inputClass}
              />
            </FormField>

            {/* EMAIL */}
            <FormField
              label="Email"
              required
            >
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChangeWrapper(
                  updateField
                )}
                placeholder="faculty@example.com"
                required
                className={inputClass}
              />
            </FormField>

            {/* EMPLOYEE ID */}
            <FormField
              label="Employee ID"
              required
            >
              <input
                name="employeeId"
                value={form.employeeId}
                onChange={handleChangeWrapper(
                  updateField
                )}
                placeholder="FAC001"
                required
                className={inputClass}
              />
            </FormField>

            {/* DEPARTMENT */}
            <FormField
              label="Department"
              required
            >
              <select
                name="department"
                value={form.department}
                onChange={handleChange}
                required
                className={inputClass}
              >
                {DEPARTMENTS.map(
                  (department) => (
                    <option
                      key={department}
                      value={department}
                    >
                      {department}
                    </option>
                  )
                )}
              </select>
            </FormField>

            {/* DESIGNATION */}
            <FormField
              label="Designation"
              required
            >
              <select
                name="designation"
                value={form.designation}
                onChange={handleChange}
                required
                className={inputClass}
              >
                {DESIGNATIONS.map(
                  (designation) => (
                    <option
                      key={designation}
                      value={designation}
                    >
                      {designation}
                    </option>
                  )
                )}
              </select>
            </FormField>

            {/* PHONE */}
            <FormField label="Phone Number">
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
                className={inputClass}
              />
            </FormField>

          </div>

          {/* BUTTONS */}
          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
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

// ==================================================
// FORM HELPERS
// ==================================================

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-100";

function handleChangeWrapper(updateField) {
  return (event) => {
    updateField(
      event.target.name,
      event.target.value
    );
  };
}

function FormField({
  label,
  required = false,
  children,
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </label>

      {children}
    </div>
  );
}