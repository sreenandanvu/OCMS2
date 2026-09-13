import React, { useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  CalendarDays,
  UserRound,
  BookOpen,
  ExternalLink,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import { get } from "../services/api";

const PAGE_SIZE = 7;

export default function Assignments() {
  const [assignments, setAssignments] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  /* =========================
     LOAD ASSIGNMENTS
  ========================= */

  async function loadAssignments(isRefresh = false) {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const data = await get("/assignments");

      const list = Array.isArray(data)
        ? data
        : data?.assignments ||
          data?.data ||
          [];

      setAssignments(list);
    } catch (err) {
      setError(
        err?.message ||
          "Unable to load assignments."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadAssignments();
  }, []);

  /* =========================
     STATUS
  ========================= */

  function getStatus(assignment) {
    const status = String(
      assignment.status || ""
    ).toLowerCase();

    if (
      status === "submitted" ||
      status === "completed"
    ) {
      return "Submitted";
    }

    if (assignment.dueDate) {
      const due = new Date(
        assignment.dueDate
      );

      if (due < new Date()) {
        return "Overdue";
      }
    }

    return "Pending";
  }

  /* =========================
     FILTER
  ========================= */

  const filteredAssignments = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return assignments.filter(
      (assignment) => {
        const status =
          getStatus(assignment);

        const matchesStatus =
          statusFilter === "All" ||
          status === statusFilter;

        const matchesSearch =
          !query ||
          String(
            assignment.title || ""
          )
            .toLowerCase()
            .includes(query) ||
          String(
            assignment.subject || ""
          )
            .toLowerCase()
            .includes(query) ||
          String(
            assignment.faculty || ""
          )
            .toLowerCase()
            .includes(query) ||
          String(
            assignment.description || ""
          )
            .toLowerCase()
            .includes(query);

        return (
          matchesStatus &&
          matchesSearch
        );
      }
    );
  }, [
    assignments,
    search,
    statusFilter,
  ]);

  /* =========================
     PAGINATION
  ========================= */

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredAssignments.length /
        PAGE_SIZE
    )
  );

  const currentPage = Math.min(
    page,
    totalPages
  );

  const paginatedAssignments =
    filteredAssignments.slice(
      (currentPage - 1) *
        PAGE_SIZE,
      currentPage * PAGE_SIZE
    );

  function changeSearch(value) {
    setSearch(value);
    setPage(1);
  }

  function changeStatus(value) {
    setStatusFilter(value);
    setPage(1);
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("All");
    setPage(1);
  }

  /* =========================
     COUNTS
  ========================= */

  const submittedCount =
    assignments.filter(
      (item) =>
        getStatus(item) ===
        "Submitted"
    ).length;

  const pendingCount =
    assignments.filter(
      (item) =>
        getStatus(item) ===
        "Pending"
    ).length;

  const overdueCount =
    assignments.filter(
      (item) =>
        getStatus(item) ===
        "Overdue"
    ).length;

  /* =========================
     DATE
  ========================= */

  function formatDate(date) {
    if (!date) {
      return "Not specified";
    }

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "Not specified";
    }

    return parsed.toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  }

  /* =========================
     LOADING
  ========================= */

  if (loading) {
    return (
      <div className="w-full max-w-[1600px] mx-auto">
        <div className="
          flex min-h-[400px]
          items-center justify-center
          rounded-2xl border
          border-slate-200 bg-white
          shadow-sm
        ">
          <div className="
            flex items-center gap-3
            text-sm font-medium
            text-slate-500
          ">
            <RefreshCw
              size={18}
              className="
                animate-spin
                text-violet-600
              "
            />
            Loading assignments...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto">

      {/* =========================
          HEADER
      ========================= */}

      <div className="
        mb-8 flex flex-col
        gap-4 sm:flex-row
        sm:items-center
        sm:justify-between
      ">
        <div>
          <p className="
            text-xs font-bold
            uppercase tracking-[0.16em]
            text-violet-600
          ">
            Student Portal
          </p>

          <h1 className="
            mt-2 text-3xl
            font-bold tracking-tight
            text-slate-900
          ">
            Assignments
          </h1>

          <p className="
            mt-2 text-sm
            text-slate-500
          ">
            View your assignments and
            submission deadlines.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            loadAssignments(true)
          }
          disabled={refreshing}
          className="
            inline-flex
            items-center
            justify-center
            gap-2
            self-start
            rounded-xl
            border border-slate-200
            bg-white px-4 py-2.5
            text-sm font-semibold
            text-slate-700
            shadow-sm
            hover:bg-slate-50
            disabled:opacity-60
          "
        >
          <RefreshCw
            size={16}
            className={
              refreshing
                ? "animate-spin"
                : ""
            }
          />

          {refreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </div>

      {/* =========================
          ERROR
      ========================= */}

      {error && (
        <div className="
          mb-6 flex flex-col
          gap-3 rounded-xl
          border border-red-200
          bg-red-50 p-4
          sm:flex-row
          sm:items-center
          sm:justify-between
        ">
          <p className="
            text-sm font-medium
            text-red-700
          ">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              loadAssignments(true)
            }
            className="
              rounded-lg bg-red-600
              px-4 py-2 text-xs
              font-bold text-white
              hover:bg-red-700
            "
          >
            Try Again
          </button>
        </div>
      )}

      {/* =========================
          SUMMARY
      ========================= */}

      <div className="
        mb-6 grid grid-cols-2
        gap-4 lg:grid-cols-4
      ">

        <SummaryCard
          label="Total"
          value={assignments.length}
          icon={ClipboardList}
          iconClass="bg-violet-50 text-violet-600"
        />

        <SummaryCard
          label="Pending"
          value={pendingCount}
          icon={CalendarDays}
          iconClass="bg-amber-50 text-amber-600"
        />

        <SummaryCard
          label="Submitted"
          value={submittedCount}
          icon={BookOpen}
          iconClass="bg-emerald-50 text-emerald-600"
        />

        <SummaryCard
          label="Overdue"
          value={overdueCount}
          icon={CalendarDays}
          iconClass="bg-red-50 text-red-600"
        />

      </div>

      {/* =========================
          FILTER BAR
      ========================= */}

      <section className="
        mb-6 rounded-2xl
        border border-slate-200
        bg-white p-4 shadow-sm
      ">

        <div className="
          flex flex-col gap-3
          lg:flex-row
        ">

          {/* SEARCH */}

          <div className="relative flex-1">

            <Search
              size={17}
              className="
                pointer-events-none
                absolute left-3
                top-1/2 -translate-y-1/2
                text-slate-400
              "
            />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                changeSearch(
                  e.target.value
                )
              }
              placeholder="
                Search assignment, subject or faculty...
              "
              className="
                w-full rounded-xl
                border border-slate-200
                bg-slate-50
                py-2.5 pl-10 pr-10
                text-sm text-slate-800
                outline-none
                placeholder:text-slate-400
                focus:border-violet-400
                focus:bg-white
                focus:ring-2
                focus:ring-violet-100
              "
            />

            {search && (
              <button
                type="button"
                onClick={() =>
                  changeSearch("")
                }
                className="
                  absolute right-3
                  top-1/2
                  -translate-y-1/2
                  text-slate-400
                  hover:text-slate-700
                "
              >
                <X size={16} />
              </button>
            )}

          </div>

          {/* STATUS */}

          <select
            value={statusFilter}
            onChange={(e) =>
              changeStatus(
                e.target.value
              )
            }
            className="
              rounded-xl
              border border-slate-200
              bg-slate-50
              px-4 py-2.5
              text-sm font-medium
              text-slate-700
              outline-none
              focus:border-violet-400
              focus:ring-2
              focus:ring-violet-100
            "
          >
            <option value="All">
              All Status
            </option>

            <option value="Pending">
              Pending
            </option>

            <option value="Submitted">
              Submitted
            </option>

            <option value="Overdue">
              Overdue
            </option>
          </select>

          {(search ||
            statusFilter !== "All") && (
            <button
              type="button"
              onClick={clearFilters}
              className="
                rounded-xl
                border border-slate-200
                px-4 py-2.5
                text-sm font-semibold
                text-slate-600
                hover:bg-slate-50
              "
            >
              Clear
            </button>
          )}

        </div>

        <div className="
          mt-3 text-xs
          text-slate-400
        ">
          Showing{" "}
          {filteredAssignments.length ===
          0
            ? 0
            : (currentPage - 1) *
                PAGE_SIZE +
              1}{" "}
          -{" "}
          {Math.min(
            currentPage * PAGE_SIZE,
            filteredAssignments.length
          )}{" "}
          of{" "}
          {filteredAssignments.length}{" "}
          assignments
        </div>

      </section>

      {/* =========================
          ASSIGNMENT LIST
      ========================= */}

      {filteredAssignments.length ===
      0 ? (
        <div className="
          rounded-2xl border
          border-slate-200
          bg-white p-12
          text-center shadow-sm
        ">
          <div className="
            mx-auto flex h-14
            w-14 items-center
            justify-center
            rounded-2xl
            bg-slate-50
            text-slate-400
          ">
            <ClipboardList
              size={26}
            />
          </div>

          <h3 className="
            mt-4 text-sm
            font-bold text-slate-800
          ">
            No assignments found
          </h3>

          <p className="
            mt-1 text-xs
            text-slate-500
          ">
            Try changing your search
            or status filter.
          </p>
        </div>
      ) : (
        <>
          <div className="
            grid grid-cols-1
            gap-4 xl:grid-cols-2
          ">

            {paginatedAssignments.map(
              (assignment, index) => {
                const status =
                  getStatus(assignment);

                return (
                  <AssignmentCard
                    key={
                      assignment._id ||
                      assignment.id ||
                      `${assignment.title}-${index}`
                    }
                    assignment={assignment}
                    status={status}
                    formatDate={formatDate}
                  />
                );
              }
            )}

          </div>

          {/* =========================
              PAGINATION
          ========================= */}

          {totalPages > 1 && (
            <div className="
              mt-6 flex flex-col
              gap-3 rounded-2xl
              border border-slate-200
              bg-white p-4 shadow-sm
              sm:flex-row
              sm:items-center
              sm:justify-between
            ">

              <p className="
                text-xs text-slate-500
              ">
                Page {currentPage} of{" "}
                {totalPages}
              </p>

              <div className="
                flex items-center
                gap-2
              ">

                <button
                  type="button"
                  disabled={
                    currentPage === 1
                  }
                  onClick={() =>
                    setPage(
                      currentPage - 1
                    )
                  }
                  className="
                    rounded-lg
                    border
                    border-slate-200
                    px-3 py-2
                    text-xs font-semibold
                    text-slate-600
                    hover:bg-slate-50
                    disabled:cursor-not-allowed
                    disabled:opacity-40
                  "
                >
                  Previous
                </button>

                <button
                  type="button"
                  disabled={
                    currentPage ===
                    totalPages
                  }
                  onClick={() =>
                    setPage(
                      currentPage + 1
                    )
                  }
                  className="
                    rounded-lg
                    bg-violet-600
                    px-3 py-2
                    text-xs font-semibold
                    text-white
                    hover:bg-violet-700
                    disabled:cursor-not-allowed
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

/* =====================================================
   SUMMARY CARD
===================================================== */

function SummaryCard({
  label,
  value,
  icon: Icon,
  iconClass,
}) {
  return (
    <div className="
      rounded-2xl border
      border-slate-200
      bg-white p-5 shadow-sm
    ">
      <div className="
        flex items-start
        justify-between gap-3
      ">
        <div>
          <p className="
            text-xs font-semibold
            uppercase tracking-wide
            text-slate-400
          ">
            {label}
          </p>

          <p className="
            mt-3 text-3xl
            font-bold text-slate-900
          ">
            {value}
          </p>
        </div>

        <div className={`
          flex h-11 w-11
          shrink-0 items-center
          justify-center
          rounded-xl
          ${iconClass}
        `}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

/* =====================================================
   ASSIGNMENT CARD
===================================================== */

function AssignmentCard({
  assignment,
  status,
  formatDate,
}) {
  const statusStyles = {
    Submitted:
      "bg-emerald-50 text-emerald-700",
    Pending:
      "bg-amber-50 text-amber-700",
    Overdue:
      "bg-red-50 text-red-700",
  };

  return (
    <article className="
      group flex flex-col
      rounded-2xl border
      border-slate-200
      bg-white p-5
      shadow-sm
      transition
      hover:-translate-y-0.5
      hover:border-violet-200
      hover:shadow-md
    ">

      {/* TOP */}

      <div className="
        flex items-start
        justify-between gap-3
      ">

        <div className="
          flex h-11 w-11
          shrink-0 items-center
          justify-center
          rounded-xl
          bg-violet-50
          text-violet-600
        ">
          <ClipboardList
            size={20}
          />
        </div>

        <span className={`
          rounded-full
          px-3 py-1.5
          text-[10px]
          font-bold
          ${statusStyles[status]}
        `}>
          {status}
        </span>

      </div>

      {/* TITLE */}

      <h2 className="
        mt-5 line-clamp-2
        text-lg font-bold
        text-slate-900
      ">
        {assignment.title ||
          "Untitled Assignment"}
      </h2>

      {/* DESCRIPTION */}

      <p className="
        mt-2 line-clamp-3
        text-sm leading-relaxed
        text-slate-500
      ">
        {assignment.description ||
          "No description provided."}
      </p>

      {/* DETAILS */}

      <div className="
        mt-5 grid
        grid-cols-1 gap-3
        border-t border-slate-100
        pt-5
        sm:grid-cols-2
      ">

        <div className="
          flex min-w-0
          items-center gap-3
        ">
          <BookOpen
            size={16}
            className="
              shrink-0
              text-slate-400
            "
          />

          <div className="min-w-0">
            <p className="
              text-[10px]
              font-semibold
              uppercase
              text-slate-400
            ">
              Subject
            </p>

            <p className="
              mt-0.5 truncate
              text-xs font-bold
              text-slate-700
            ">
              {assignment.subject ||
                "N/A"}
            </p>
          </div>
        </div>

        <div className="
          flex min-w-0
          items-center gap-3
        ">
          <UserRound
            size={16}
            className="
              shrink-0
              text-slate-400
            "
          />

          <div className="min-w-0">
            <p className="
              text-[10px]
              font-semibold
              uppercase
              text-slate-400
            ">
              Faculty
            </p>

            <p className="
              mt-0.5 truncate
              text-xs font-bold
              text-slate-700
            ">
              {assignment.faculty ||
                "N/A"}
            </p>
          </div>
        </div>

        <div className="
          flex min-w-0
          items-center gap-3
          sm:col-span-2
        ">
          <CalendarDays
            size={16}
            className="
              shrink-0
              text-slate-400
            "
          />

          <div>
            <p className="
              text-[10px]
              font-semibold
              uppercase
              text-slate-400
            ">
              Due Date
            </p>

            <p className="
              mt-0.5 text-xs
              font-bold text-slate-700
            ">
              {formatDate(
                assignment.dueDate
              )}
            </p>
          </div>
        </div>

      </div>

      {/* RESOURCE */}

      {assignment.resourceUrl && (
        <a
          href={assignment.resourceUrl}
          target="_blank"
          rel="noreferrer"
          className="
            mt-5 inline-flex
            w-full items-center
            justify-center gap-2
            rounded-xl
            bg-violet-600
            px-4 py-2.5
            text-sm font-bold
            text-white
            transition
            hover:bg-violet-700
          "
        >
          <ExternalLink
            size={16}
          />
          View Resource
        </a>
      )}

    </article>
  );
}