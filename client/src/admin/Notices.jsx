import React, { useEffect, useMemo, useState } from "react";
import { get, post, put, remove } from "../services/api";
import Loading from "../components/Loading";
import ErrorBox from "../components/ErrorBox";
import Empty from "../components/Empty";
import ConfirmModal from "../components/ConfirmModal";

const ITEMS_PER_PAGE = 7;

const EMPTY_FORM = {
  title: "",
  message: "",
  audience: "Everyone",
  date: "",
};

const AUDIENCES = [
  "Everyone",
  "Students",
  "Faculty",
  "MCA",
  "MCA Semester 1",
];

export default function Notices() {
  const [notices, setNotices] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);

  const [deleteItem, setDeleteItem] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);

  /* -------------------------------------------------------
     Load notices
  ------------------------------------------------------- */

  async function loadNotices() {
    setLoading(true);
    setError("");

    try {
      const response = await get("/notices");

      const data = Array.isArray(response)
        ? response
        : response.notices ||
          response.data ||
          [];

      setNotices(data);
      setCurrentPage(1);
    } catch (err) {
      setError(
        err.message || "Unable to load notices."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotices();
  }, []);

  /* -------------------------------------------------------
     Search
  ------------------------------------------------------- */

  const filteredNotices = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return notices;

    return notices.filter((notice) =>
      [
        notice.title,
        notice.message,
        notice.audience,
        notice.date,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [notices, search]);

  /* -------------------------------------------------------
     Pagination
  ------------------------------------------------------- */

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredNotices.length /
        ITEMS_PER_PAGE
    )
  );

  const paginatedNotices = useMemo(() => {
    const start =
      (currentPage - 1) *
      ITEMS_PER_PAGE;

    return filteredNotices.slice(
      start,
      start + ITEMS_PER_PAGE
    );
  }, [filteredNotices, currentPage]);

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
    setEditingNotice(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setShowModal(true);
  }

  function openEditModal(notice) {
    setEditingNotice(notice);

    setForm({
      title: notice.title || "",
      message: notice.message || "",
      audience: notice.audience || "Everyone",
      date: notice.date
        ? String(notice.date).slice(0, 10)
        : "",
    });

    setFormError("");
    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setEditingNotice(null);
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
        "Please enter a notice title."
      );
      return;
    }

    if (!form.message.trim()) {
      setFormError(
        "Please enter a notice message."
      );
      return;
    }

    if (!form.date) {
      setFormError(
        "Please select a publish date."
      );
      return;
    }

    setSaving(true);
    setFormError("");

    const payload = {
      title: form.title.trim(),
      message: form.message.trim(),
      audience: form.audience,
      date: form.date,
    };

    try {
      if (editingNotice) {
        const id =
          editingNotice._id ||
          editingNotice.id;

        const response = await put(
          `/notices/${id}`,
          payload
        );

        const updated =
          response.notice ||
          response.data ||
          response;

        setNotices((current) =>
          current.map((notice) =>
            (notice._id || notice.id) === id
              ? updated
              : notice
          )
        );
      } else {
        const response = await post(
          "/notices",
          payload
        );

        const created =
          response.notice ||
          response.data ||
          response;

        setNotices((current) => [
          ...current,
          created,
        ]);
      }

      closeModal();
    } catch (err) {
      setFormError(
        err.message ||
          "Unable to save notice."
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
      await remove(`/notices/${id}`);

      setNotices((current) =>
        current.filter(
          (notice) =>
            (notice._id || notice.id) !== id
        )
      );

      setDeleteItem(null);
    } catch (err) {
      setError(
        err.message ||
          "Unable to delete notice."
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
     Audience styling
  ------------------------------------------------------- */

  function audienceClass(audience) {
    switch (String(audience).toLowerCase()) {
      case "students":
        return "bg-blue-100 text-blue-700";

      case "faculty":
        return "bg-purple-100 text-purple-700";

      case "mca":
        return "bg-emerald-100 text-emerald-700";

      case "mca semester 1":
        return "bg-amber-100 text-amber-700";

      default:
        return "bg-slate-100 text-slate-700";
    }
  }

  /* -------------------------------------------------------
     Loading
  ------------------------------------------------------- */

  if (loading) {
    return (
      <div className="p-6">
        <Loading message="Loading notices..." />
      </div>
    );
  }

  /* -------------------------------------------------------
     Error
  ------------------------------------------------------- */

  if (error && !notices.length) {
    return (
      <div className="p-6">
        <ErrorBox
          message={error}
          onRetry={loadNotices}
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
            Notices
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Publish important announcements and notices.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={loadNotices}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            ↻ Refresh
          </button>

          <button
            type="button"
            onClick={openAddModal}
            className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
          >
            + Create Notice
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
            placeholder="Search notice title, message, audience..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
          />
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
          <span>
            {filteredNotices.length} notice
            {filteredNotices.length !== 1
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

      {/* Notices table */}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="font-semibold text-slate-900">
            Published Notices
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            {filteredNotices.length} notices found
          </p>
        </div>

        {!filteredNotices.length ? (
          <div className="p-10 text-center">
            {search ? (
              <>
                <div className="text-4xl">
                  🔍
                </div>

                <h3 className="mt-3 font-semibold text-slate-900">
                  No notices found
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Try a different search term.
                </p>
              </>
            ) : (
              <Empty
                title="No notices"
                message="Create a notice to publish an announcement."
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

                  <th className="w-[15%] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Audience
                  </th>

                  <th className="w-[15%] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Date
                  </th>

                  <th className="w-[30%] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Message
                  </th>

                  <th className="w-[20%] px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {paginatedNotices.map(
                  (notice) => {
                    const id =
                      notice._id || notice.id;

                    return (
                      <tr
                        key={id}
                        className="hover:bg-slate-50"
                      >
                        <td className="px-4 py-4">
                          <div className="truncate text-sm font-semibold text-slate-900">
                            {notice.title || "-"}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex max-w-full truncate rounded-full px-2.5 py-1 text-xs font-semibold ${audienceClass(
                              notice.audience
                            )}`}
                          >
                            {notice.audience ||
                              "Everyone"}
                          </span>
                        </td>

                        <td className="truncate px-4 py-4 text-sm text-slate-600">
                          {formatDate(
                            notice.date
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <div
                            title={
                              notice.message
                            }
                            className="truncate text-sm text-slate-600"
                          >
                            {notice.message ||
                              "-"}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(
                                  notice
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
                                  notice
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
                filteredNotices.length
              )}
            </span>{" "}
            of{" "}
            <span className="font-medium text-slate-700">
              {filteredNotices.length}
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
                  {editingNotice
                    ? "Edit Notice"
                    : "Create Notice"}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  {editingNotice
                    ? "Update the notice details."
                    : "Publish a new college announcement."}
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
                  Notice Title
                </label>

                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Enter notice title"
                  required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Message
                </label>

                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Write the notice..."
                  rows={5}
                  required
                  className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Audience
                  </label>

                  <select
                    name="audience"
                    value={form.audience}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                  >
                    {AUDIENCES.map(
                      (audience) => (
                        <option
                          key={audience}
                          value={audience}
                        >
                          {audience}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Publish Date
                  </label>

                  <input
                    type="date"
                    name="date"
                    value={form.date}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                  />
                </div>
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
                    : editingNotice
                    ? "Update Notice"
                    : "Publish Notice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}

      {deleteItem && (
        <ConfirmModal
          title="Delete Notice"
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