import React, { useEffect, useMemo, useState } from "react";
import { get } from "../services/api";

export default function Notices() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedNotice, setSelectedNotice] = useState(null);

  async function loadNotices() {
    try {
      setLoading(true);
      setError("");

      const data = await get("/notices");

      /*
       * Students should only receive student/general notices.
       * Faculty-only notices are excluded.
       */
      const allNotices = Array.isArray(data) ? data : [];

      const studentNotices = allNotices.filter((notice) => {
        const target = String(notice.audience || "Students")
          .trim()
          .toLowerCase();

        return (
          target === "students" ||
          target === "student" ||
          target === "all" ||
          target === "everyone" ||
          target === "all students"
        );
      });

      setNotices(studentNotices);
    } catch (err) {
      setError(err.message || "Unable to load notices.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotices();
  }, []);

  const filteredNotices = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return notices;

    return notices.filter((notice) => {
      return (
        notice.title?.toLowerCase().includes(query) ||
        notice.message?.toLowerCase().includes(query) ||
        notice.author?.toLowerCase().includes(query)
      );
    });
  }, [notices, search]);

  function formatDate(date) {
    if (!date) return "Date not available";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return date;
    }

    return parsed.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function getInitials(title = "") {
    const words = title
      .split(" ")
      .filter(Boolean)
      .slice(0, 2);

    return words
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <p className="text-sm font-medium text-slate-600">
            Loading notices...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-xl">
                📢
              </div>

              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                Student Notices
              </span>
            </div>

            <h1 className="text-2xl font-bold sm:text-3xl">
              Notices & Announcements
            </h1>

            <p className="mt-2 max-w-xl text-sm text-blue-100">
              Important announcements and updates from your college.
            </p>
          </div>

          <div className="rounded-xl bg-white/10 px-6 py-4 backdrop-blur-sm">
            <p className="text-xs font-medium text-blue-100">
              Available Notices
            </p>

            <p className="mt-1 text-3xl font-bold">
              {notices.length}
            </p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-red-700">
              Unable to load notices
            </p>

            <p className="mt-1 text-sm text-red-600">
              {error}
            </p>
          </div>

          <button
            onClick={loadNotices}
            className="w-fit rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Search & Refresh */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              🔎
            </span>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notices..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <button
            onClick={loadNotices}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-blue-600"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Section heading */}
      <div>
        <h2 className="text-lg font-bold text-slate-800">
          Latest Announcements
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          {filteredNotices.length} notice
          {filteredNotices.length !== 1 ? "s" : ""} available
        </p>
      </div>

      {/* Empty State */}
      {filteredNotices.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl">
            📭
          </div>

          <h3 className="mt-5 text-lg font-bold text-slate-800">
            No notices found
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            {search
              ? "No notices match your search."
              : "There are currently no notices for students."}
          </p>

          {search && (
            <button
              onClick={() => setSearch("")}
              className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        /* Notice Cards */
        <div className="grid grid-cols-1 gap-4">
          {filteredNotices.map((notice, index) => (
            <article
              key={notice._id || index}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
            >
              <div className="p-5">
                <div className="flex gap-4">
                  {/* Notice Icon */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700">
                    {getInitials(notice.title) || "📢"}
                  </div>

                  {/* Notice Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <h3 className="text-lg font-bold text-slate-800">
                          {notice.title || "Untitled Notice"}
                        </h3>

                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span>📅 {formatDate(notice.date)}</span>

                          {notice.author && (
                            <>
                              <span className="text-slate-300">•</span>

                              <span>
                                Posted by {notice.author}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <span className="w-fit shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        Students
                      </span>
                    </div>

                    {/* Message Preview */}
                    <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">
                      {notice.message || "No message available."}
                    </p>

                    {/* Read Button */}
                    <button
                      onClick={() => setSelectedNotice(notice)}
                      className="mt-4 rounded-lg px-3 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
                    >
                      Read Full Notice →
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Accent */}
              <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 transition group-hover:opacity-100" />
            </article>
          ))}
        </div>
      )}

      {/* Full Notice Modal */}
      {selectedNotice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          onClick={() => setSelectedNotice(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                      Students
                    </span>

                    <span className="text-xs text-blue-100">
                      {formatDate(selectedNotice.date)}
                    </span>
                  </div>

                  <h2 className="text-xl font-bold sm:text-2xl">
                    {selectedNotice.title || "Untitled Notice"}
                  </h2>
                </div>

                <button
                  onClick={() => setSelectedNotice(null)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-lg transition hover:bg-white/20"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="max-h-[60vh] overflow-y-auto p-6">
              <div className="rounded-xl bg-slate-50 p-5">
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                  {selectedNotice.message || "No message available."}
                </p>
              </div>

              {selectedNotice.author && (
                <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100">
                    👤
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      Posted by
                    </p>

                    <p className="text-sm font-semibold text-slate-700">
                      {selectedNotice.author}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end border-t border-slate-100 bg-slate-50 p-4">
              <button
                onClick={() => setSelectedNotice(null)}
                className="rounded-xl bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}