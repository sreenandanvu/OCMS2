import React, { useEffect, useMemo, useState } from "react";
import { get } from "../services/api";
import Loading from "../components/Loading";
import ErrorBox from "../components/ErrorBox";
import Empty from "../components/Empty";

const PAGE_SIZE = 7;

export default function Notices() {
  const [notices, setNotices] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [audienceFilter, setAudienceFilter] =
    useState("");

  const [page, setPage] = useState(1);
  const [viewNotice, setViewNotice] =
    useState(null);

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
    } catch (err) {
      setError(
        err.message ||
          "Unable to load notices."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotices();
  }, []);

  const audienceOptions = useMemo(() => {
    return [
      ...new Set(
        notices
          .map((notice) => notice.audience)
          .filter(Boolean)
      ),
    ].sort();
  }, [notices]);

  const filteredNotices = useMemo(() => {
    const term = search.trim().toLowerCase();

    return notices.filter((notice) => {
      const matchesSearch =
        !term ||
        [
          notice.title,
          notice.message,
          notice.audience,
          notice.date,
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

      const matchesAudience =
        !audienceFilter ||
        notice.audience === audienceFilter;

      return (
        matchesSearch &&
        matchesAudience
      );
    });
  }, [
    notices,
    search,
    audienceFilter,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredNotices.length / PAGE_SIZE
    )
  );

  const safePage = Math.min(
    page,
    totalPages
  );

  const paginatedNotices =
    filteredNotices.slice(
      (safePage - 1) * PAGE_SIZE,
      safePage * PAGE_SIZE
    );

  useEffect(() => {
    setPage(1);
  }, [search, audienceFilter]);

  function resetFilters() {
    setSearch("");
    setAudienceFilter("");
    setPage(1);
  }

  function formatDate(date) {
    if (!date) {
      return "Recently published";
    }

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

  function getAudienceClass(audience) {
    const value = String(
      audience || ""
    ).toLowerCase();

    if (value.includes("faculty")) {
      return "bg-purple-100 text-purple-700";
    }

    if (value.includes("student")) {
      return "bg-blue-100 text-blue-700";
    }

    if (
      value.includes("all") ||
      value.includes("everyone")
    ) {
      return "bg-emerald-100 text-emerald-700";
    }

    return "bg-slate-100 text-slate-700";
  }

  if (loading) {
    return (
      <div className="w-full max-w-full">
        <Loading message="Loading notices..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-full">
        <ErrorBox
          message={error}
          onRetry={loadNotices}
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
              Notices
            </h2>

            <p className="mt-2 max-w-2xl text-sm text-blue-100">
              Important announcements from
              administration.
            </p>
          </div>

          <button
            type="button"
            onClick={loadNotices}
            disabled={loading}
            className="w-full rounded-xl bg-white px-5 py-3 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          icon="📢"
          label="Total Notices"
          value={notices.length}
          description="Published notices"
        />

        <SummaryCard
          icon="🔎"
          label="Filtered"
          value={filteredNotices.length}
          description="Matching notices"
        />

        <SummaryCard
          icon="👥"
          label="Audiences"
          value={audienceOptions.length}
          description="Notice audiences"
        />
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-slate-900">
            Notice Search
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Search announcements and filter
            them by audience.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
              placeholder="Search title, message..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              Audience
            </label>

            <select
              value={audienceFilter}
              onChange={(e) =>
                setAudienceFilter(
                  e.target.value
                )
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">
                All audiences
              </option>

              {audienceOptions.map(
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
        </div>

        {(search || audienceFilter) && (
          <button
            type="button"
            onClick={resetFilters}
            className="mt-3 text-sm font-semibold text-blue-600 hover:text-blue-800"
          >
            Reset filters
          </button>
        )}
      </div>

      {/* Notices */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold text-slate-900">
                Announcements
              </h3>

              <p className="text-sm text-slate-500">
                Showing{" "}
                {filteredNotices.length === 0
                  ? 0
                  : (safePage - 1) *
                      PAGE_SIZE +
                    1}
                –
                {Math.min(
                  safePage * PAGE_SIZE,
                  filteredNotices.length
                )}{" "}
                of{" "}
                {filteredNotices.length}
              </p>
            </div>

            <span className="text-xs font-medium text-slate-500">
              {PAGE_SIZE} per page
            </span>
          </div>
        </div>

        {paginatedNotices.length === 0 ? (
          <div className="p-8">
            <Empty
              title="No notices found"
              message={
                notices.length === 0
                  ? "There are no notices available."
                  : "Try changing your search or filter."
              }
            />
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-100">
              {paginatedNotices.map(
                (notice, index) => (
                  <div
                    key={
                      notice._id ||
                      notice.id ||
                      `${notice.title}-${index}`
                    }
                    className="p-4 transition hover:bg-slate-50 sm:p-5"
                  >
                    <div className="flex gap-3 sm:gap-4">
                      {/* Icon */}
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xl">
                        📢
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <h4
                              className="truncate text-base font-bold text-slate-900"
                              title={
                                notice.title
                              }
                            >
                              {notice.title ||
                                "Untitled Notice"}
                            </h4>

                            <p className="mt-1 text-xs text-slate-500">
                              {formatDate(
                                notice.date
                              )}
                            </p>
                          </div>

                          <span
                            className={`w-fit shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${getAudienceClass(
                              notice.audience
                            )}`}
                          >
                            {notice.audience ||
                              "General"}
                          </span>
                        </div>

                        <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
                          {notice.message ||
                            "No message available."}
                        </p>

                        <div className="mt-3">
                          <button
                            type="button"
                            onClick={() =>
                              setViewNotice(
                                notice
                              )
                            }
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                          >
                            View Notice
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              )}
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

      {/* View Notice Modal */}
      {viewNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xl">
                    📢
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                      Announcement
                    </p>

                    <h3 className="mt-1 text-xl font-bold text-slate-900">
                      {viewNotice.title ||
                        "Untitled Notice"}
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setViewNotice(null)
                  }
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="space-y-5 p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${getAudienceClass(
                    viewNotice.audience
                  )}`}
                >
                  {viewNotice.audience ||
                    "General"}
                </span>

                <span className="text-sm text-slate-500">
                  {formatDate(
                    viewNotice.date
                  )}
                </span>
              </div>

              <div className="rounded-xl bg-slate-50 p-5">
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                  {viewNotice.message ||
                    "No message available."}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InfoRow
                  label="Audience"
                  value={
                    viewNotice.audience ||
                    "General"
                  }
                />

                <InfoRow
                  label="Published"
                  value={formatDate(
                    viewNotice.date
                  )}
                />
              </div>

              <div className="flex justify-end border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() =>
                    setViewNotice(null)
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

function InfoRow({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium text-slate-800">
        {value || "—"}
      </p>
    </div>
  );
}