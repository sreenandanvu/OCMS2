import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Clock3,
  Users,
  BookOpen,
  Search,
  RefreshCw,
  Plus,
  Pencil,
  Trash2,
  X,
  MapPin,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { get, post, put, remove } from "../services/api";
import Loading from "../components/Loading";
import ErrorBox from "../components/ErrorBox";
import Empty from "../components/Empty";
import ConfirmModal from "../components/ConfirmModal";

const ITEMS_PER_PAGE = 7;

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const emptyForm = {
  day: "",
  period: "",
  time: "",
  subject: "",
  faculty: "",
  course: "MCA",
  semester: "1",
  section: "A",
  room: "",
};

export default function Timetable() {
  const [entries, setEntries] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [selectedDay, setSelectedDay] = useState("All");
  const [page, setPage] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);

  const [form, setForm] = useState(emptyForm);

  const [deleteItem, setDeleteItem] = useState(null);

  // ==========================================================
  // LOAD DATA
  // ==========================================================

  async function loadTimetable() {
    try {
      setLoading(true);
      setError("");

      const data = await get("/timetable");

      const list = Array.isArray(data)
        ? data
        : data.timetable ||
          data.entries ||
          data.data ||
          [];

      setEntries(list);
    } catch (err) {
      setError(
        err.message || "Unable to load timetable."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTimetable();
  }, []);

  // ==========================================================
  // STATISTICS
  // ==========================================================

  const statistics = useMemo(() => {
    const courses = new Set();
    const faculty = new Set();

    entries.forEach((entry) => {
      if (entry.course) {
        courses.add(String(entry.course));
      }

      if (entry.faculty) {
        faculty.add(String(entry.faculty));
      }
    });

    const todayName = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
    }).format(new Date());

    const todayClasses = entries.filter(
      (entry) =>
        String(entry.day || "").toLowerCase() ===
        todayName.toLowerCase()
    ).length;

    return {
      total: entries.length,
      today: todayClasses,
      courses: courses.size,
      faculty: faculty.size,
    };
  }, [entries]);

  // ==========================================================
  // FILTER
  // ==========================================================

  const filteredEntries = useMemo(() => {
    const query = search.trim().toLowerCase();

    return entries.filter((entry) => {
      const matchesDay =
        selectedDay === "All" ||
        String(entry.day || "").toLowerCase() ===
          selectedDay.toLowerCase();

      if (!matchesDay) {
        return false;
      }

      if (!query) {
        return true;
      }

      const text = [
        entry.day,
        entry.period,
        entry.time,
        entry.subject,
        entry.faculty,
        entry.course,
        entry.semester,
        entry.section,
        entry.room,
      ]
        .join(" ")
        .toLowerCase();

      return text.includes(query);
    });
  }, [entries, search, selectedDay]);

  // ==========================================================
  // PAGINATION
  // ==========================================================

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredEntries.length / ITEMS_PER_PAGE
    )
  );

  const currentPage = Math.min(page, totalPages);

  const paginatedEntries = filteredEntries.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // ==========================================================
  // FORM
  // ==========================================================

  function updateForm(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function openAdd() {
    setEditingEntry(null);
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  }

  function openEdit(entry) {
    setEditingEntry(entry);

    setForm({
      day: entry.day || "",
      period: entry.period || "",
      time: entry.time || "",
      subject: entry.subject || "",
      faculty: entry.faculty || "",
      course: entry.course || "MCA",
      semester: String(entry.semester ?? 1),
      section: entry.section || "A",
      room: entry.room || "",
    });

    setError("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditingEntry(null);
    setForm(emptyForm);
  }

  // ==========================================================
  // CREATE / UPDATE
  // ==========================================================

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");

    if (!form.day) {
      setError("Please select a day.");
      return;
    }

    if (!form.period.trim()) {
      setError("Please enter the period.");
      return;
    }

    if (!form.subject.trim()) {
      setError("Please enter the subject.");
      return;
    }

    if (!form.faculty.trim()) {
      setError("Please enter the faculty.");
      return;
    }

    if (!form.course.trim()) {
      setError("Please enter the course.");
      return;
    }

    if (!form.semester.trim()) {
      setError("Please enter the semester.");
      return;
    }

    if (!form.section.trim()) {
      setError("Please enter the section.");
      return;
    }

    if (!form.room.trim()) {
      setError("Please enter the room.");
      return;
    }

    try {
      setSaving(true);

      if (editingEntry) {
        const id =
          editingEntry._id ||
          editingEntry.id;

        if (!id) {
          throw new Error(
            "Timetable entry does not have a valid ID."
          );
        }

        await put(`/timetable/${id}`, {
          ...form,
          semester: Number(form.semester),
        });
      } else {
        await post("/timetable", {
          ...form,
          semester: Number(form.semester),
        });
      }

      closeForm();

      await loadTimetable();
    } catch (err) {
      setError(
        err.message ||
          `Unable to ${
            editingEntry ? "update" : "create"
          } timetable entry.`
      );
    } finally {
      setSaving(false);
    }
  }

  // ==========================================================
  // DELETE
  // ==========================================================

  async function handleDelete() {
    if (!deleteItem) return;

    const id =
      deleteItem._id ||
      deleteItem.id;

    if (!id) {
      setError(
        "Unable to delete this timetable entry because its ID is missing."
      );

      setDeleteItem(null);
      return;
    }

    try {
      setDeleting(true);
      setError("");

      await remove(`/timetable/${id}`);

      setEntries((current) =>
        current.filter(
          (entry) =>
            String(
              entry._id || entry.id
            ) !== String(id)
        )
      );

      setDeleteItem(null);

      await loadTimetable();
    } catch (err) {
      setError(
        err.message ||
          "Unable to delete timetable entry."
      );
    } finally {
      setDeleting(false);
    }
  }

  // ==========================================================
  // RESET
  // ==========================================================

  function resetFilters() {
    setSearch("");
    setSelectedDay("All");
    setPage(1);
  }

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return <Loading />;
  }

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="space-y-6">

      {/* ======================================================
          HEADER
      ======================================================= */}

      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 p-6 text-white shadow-lg">

        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

          <div className="flex items-start gap-4">

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
              <CalendarDays size={25} />
            </div>

            <div>
              <p className="mb-1 text-sm font-medium text-slate-300">
                ADMINISTRATION
              </p>

              <h2 className="text-2xl font-bold">
                Timetable Management
              </h2>

              <p className="mt-1 max-w-xl text-sm text-slate-300">
                Manage the complete weekly class schedule,
                faculty allocation, rooms and academic periods.
              </p>
            </div>

          </div>

          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-md transition hover:bg-slate-100"
          >
            <Plus size={18} />
            Add Class
          </button>

        </div>
      </div>

      {/* ======================================================
          ERROR
      ======================================================= */}

      {error && (
        <ErrorBox
          message={error}
          onClose={() => setError("")}
        />
      )}

      {/* ======================================================
          STAT CARDS
      ======================================================= */}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">

        <StatCard
          icon={CalendarDays}
          label="Total Classes"
          value={statistics.total}
          description="Scheduled classes"
        />

        <StatCard
          icon={Clock3}
          label="Today"
          value={statistics.today}
          description="Classes today"
        />

        <StatCard
          icon={BookOpen}
          label="Courses"
          value={statistics.courses}
          description="Active courses"
        />

        <StatCard
          icon={Users}
          label="Faculty"
          value={statistics.faculty}
          description="Assigned faculty"
        />

      </div>

      {/* ======================================================
          DAY SELECTOR
      ======================================================= */}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

        <div className="mb-4 flex items-center justify-between">

          <div>
            <h3 className="text-base font-bold text-slate-900">
              Weekly Schedule
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Select a day to view its classes.
            </p>
          </div>

          <CalendarDays
            size={20}
            className="text-slate-400"
          />

        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">

          <DayButton
            label="All"
            active={selectedDay === "All"}
            onClick={() => {
              setSelectedDay("All");
              setPage(1);
            }}
          />

          {DAYS.map((day) => (
            <DayButton
              key={day}
              label={day}
              active={selectedDay === day}
              onClick={() => {
                setSelectedDay(day);
                setPage(1);
              }}
            />
          ))}

        </div>
      </div>

      {/* ======================================================
          SEARCH TOOLBAR
      ======================================================= */}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

          <div className="relative w-full lg:max-w-xl">

            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search subject, faculty, course, room..."
              className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:bg-white focus:ring-4 focus:ring-slate-100"
            />

          </div>

          <div className="flex flex-wrap items-center gap-2">

            <span className="mr-1 text-sm text-slate-500">
              <span className="font-semibold text-slate-800">
                {filteredEntries.length}
              </span>{" "}
              classes
            </span>

            {(search || selectedDay !== "All") && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <X size={15} />
                Reset
              </button>
            )}

            <button
              type="button"
              onClick={loadTimetable}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <RefreshCw size={15} />
              Refresh
            </button>

          </div>
        </div>
      </div>

      {/* ======================================================
          TABLE
      ======================================================= */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* TABLE HEADER */}
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">

          <div className="flex items-center justify-between">

            <div>
              <h3 className="font-bold text-slate-900">
                Class Schedule
              </h3>

              <p className="mt-0.5 text-xs text-slate-500">
                {selectedDay === "All"
                  ? "All scheduled classes"
                  : `${selectedDay} schedule`}
              </p>
            </div>

            <div className="hidden items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-medium text-slate-500 shadow-sm sm:flex">
              <CalendarDays size={14} />
              {filteredEntries.length} entries
            </div>

          </div>
        </div>

        {paginatedEntries.length === 0 ? (
          <div className="p-10">
            <Empty
              message={
                search || selectedDay !== "All"
                  ? "No timetable classes match your filters."
                  : "No timetable classes have been added yet."
              }
            />
          </div>
        ) : (
          <table className="w-full table-fixed">

            <thead>
              <tr className="border-b border-slate-200 bg-white">

                <th className="w-[9%] px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Day
                </th>

                <th className="w-[7%] px-2 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Period
                </th>

                <th className="w-[10%] px-2 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Time
                </th>

                <th className="w-[17%] px-2 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Subject
                </th>

                <th className="w-[15%] px-2 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Faculty
                </th>

                <th className="w-[12%] px-2 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Course
                </th>

                <th className="w-[7%] px-2 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Sem
                </th>

                <th className="w-[7%] px-2 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Sec
                </th>

                <th className="w-[8%] px-2 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Room
                </th>

                <th className="w-[8%] px-1 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Actions
                </th>

              </tr>
            </thead>

            <tbody>

              {paginatedEntries.map((entry) => {

                const id =
                  entry._id || entry.id;

                return (
                  <tr
                    key={id}
                    className="group border-b border-slate-100 transition hover:bg-slate-50"
                  >

                    {/* DAY */}
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-2">

                        <div className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 sm:flex">
                          <CalendarDays size={14} />
                        </div>

                        <span
                          className="truncate text-xs font-semibold text-slate-800"
                          title={entry.day}
                        >
                          {entry.day || "—"}
                        </span>

                      </div>
                    </td>

                    {/* PERIOD */}
                    <td className="px-2 py-4">
                      <span className="inline-flex min-w-[28px] items-center justify-center rounded-lg bg-slate-900 px-2 py-1.5 text-xs font-bold text-white">
                        {entry.period || "—"}
                      </span>
                    </td>

                    {/* TIME */}
                    <td className="px-2 py-4">
                      <div className="flex items-center gap-1">

                        <Clock3
                          size={13}
                          className="hidden shrink-0 text-slate-400 sm:block"
                        />

                        <span
                          className="truncate text-xs text-slate-600"
                          title={entry.time}
                        >
                          {entry.time || "—"}
                        </span>

                      </div>
                    </td>

                    {/* SUBJECT */}
                    <td className="px-2 py-4">
                      <div className="flex min-w-0 items-center gap-2">

                        <div className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 sm:flex">
                          <BookOpen size={14} />
                        </div>

                        <div className="min-w-0">
                          <p
                            className="truncate text-xs font-bold text-slate-900"
                            title={entry.subject}
                          >
                            {entry.subject || "—"}
                          </p>

                          <p className="truncate text-[10px] text-slate-400">
                            Subject
                          </p>
                        </div>

                      </div>
                    </td>

                    {/* FACULTY */}
                    <td className="px-2 py-4">
                      <div className="flex min-w-0 items-center gap-2">

                        <div className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 sm:flex">
                          <Users size={13} />
                        </div>

                        <span
                          className="truncate text-xs font-medium text-slate-700"
                          title={entry.faculty}
                        >
                          {entry.faculty || "—"}
                        </span>

                      </div>
                    </td>

                    {/* COURSE */}
                    <td className="px-2 py-4">
                      <div className="flex min-w-0 items-center gap-1.5">

                        <GraduationCap
                          size={13}
                          className="hidden shrink-0 text-slate-400 sm:block"
                        />

                        <span
                          className="truncate text-xs font-medium text-slate-700"
                          title={entry.course}
                        >
                          {entry.course || "—"}
                        </span>

                      </div>
                    </td>

                    {/* SEMESTER */}
                    <td className="px-2 py-4">
                      <span className="text-xs font-semibold text-slate-700">
                        {entry.semester || "—"}
                      </span>
                    </td>

                    {/* SECTION */}
                    <td className="px-2 py-4">
                      <span className="inline-flex rounded-md bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-700">
                        {entry.section || "—"}
                      </span>
                    </td>

                    {/* ROOM */}
                    <td className="px-2 py-4">
                      <div className="flex min-w-0 items-center gap-1">

                        <MapPin
                          size={13}
                          className="hidden shrink-0 text-slate-400 sm:block"
                        />

                        <span
                          className="truncate text-xs font-medium text-slate-700"
                          title={entry.room}
                        >
                          {entry.room || "—"}
                        </span>

                      </div>
                    </td>

                    {/* ACTIONS */}
                    <td className="px-1 py-4">

                      <div className="flex items-center justify-center gap-1">

                        <button
                          type="button"
                          onClick={() =>
                            openEdit(entry)
                          }
                          title="Edit timetable"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                        >
                          <Pencil size={14} />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setDeleteItem(entry)
                          }
                          title="Delete timetable"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 size={14} />
                        </button>

                      </div>

                    </td>

                  </tr>
                );
              })}

            </tbody>

          </table>
        )}

      </div>

      {/* ======================================================
          PAGINATION
      ======================================================= */}

      {filteredEntries.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <p className="text-xs text-slate-500">

              Showing{" "}
              <span className="font-semibold text-slate-800">
                {(currentPage - 1) *
                  ITEMS_PER_PAGE +
                  1}
              </span>
              –
              <span className="font-semibold text-slate-800">
                {Math.min(
                  currentPage *
                    ITEMS_PER_PAGE,
                  filteredEntries.length
                )}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-800">
                {filteredEntries.length}
              </span>

            </p>

            <div className="flex items-center gap-1">

              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() =>
                  setPage((p) =>
                    Math.max(1, p - 1)
                  )
                }
                className="flex h-9 items-center gap-1 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={14} />
                Previous
              </button>

              <div className="hidden items-center gap-1 sm:flex">

                {Array.from(
                  {
                    length: totalPages,
                  },
                  (_, index) =>
                    index + 1
                ).map((number) => (
                  <button
                    key={number}
                    type="button"
                    onClick={() =>
                      setPage(number)
                    }
                    className={
                      number === currentPage
                        ? "h-9 min-w-9 rounded-lg bg-slate-900 px-2 text-xs font-bold text-white"
                        : "h-9 min-w-9 rounded-lg border border-slate-300 px-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    }
                  >
                    {number}
                  </button>
                ))}

              </div>

              <span className="px-2 text-xs text-slate-500 sm:hidden">
                {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                disabled={
                  currentPage === totalPages
                }
                onClick={() =>
                  setPage((p) =>
                    Math.min(
                      totalPages,
                      p + 1
                    )
                  )
                }
                className="flex h-9 items-center gap-1 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight size={14} />
              </button>

            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          ADD / EDIT MODAL
      ======================================================= */}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">

          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

            {/* MODAL HEADER */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <CalendarDays size={19} />
                </div>

                <div>
                  <h3 className="font-bold text-slate-900">
                    {editingEntry
                      ? "Edit Class Schedule"
                      : "Add Class Schedule"}
                  </h3>

                  <p className="mt-0.5 text-xs text-slate-500">
                    {editingEntry
                      ? "Update the selected timetable entry."
                      : "Add a new class to the college timetable."}
                  </p>
                </div>

              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={19} />
              </button>

            </div>

            {/* FORM */}
            <form
              onSubmit={handleSubmit}
              className="p-6"
            >

              {/* BASIC INFORMATION */}
              <div className="mb-6">

                <div className="mb-4">
                  <h4 className="text-sm font-bold text-slate-900">
                    Class Information
                  </h4>

                  <p className="mt-1 text-xs text-slate-500">
                    Set when and where the class takes place.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                  <FormField
                    label="Day"
                    required
                  >
                    <select
                      value={form.day}
                      onChange={(e) =>
                        updateForm(
                          "day",
                          e.target.value
                        )
                      }
                      className={inputClass}
                    >
                      <option value="">
                        Select day
                      </option>

                      {DAYS.map((day) => (
                        <option
                          key={day}
                          value={day}
                        >
                          {day}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField
                    label="Period"
                    required
                  >
                    <input
                      type="text"
                      value={form.period}
                      onChange={(e) =>
                        updateForm(
                          "period",
                          e.target.value
                        )
                      }
                      placeholder="Example: 1"
                      className={inputClass}
                    />
                  </FormField>

                  <FormField label="Time">
                    <input
                      type="text"
                      value={form.time}
                      onChange={(e) =>
                        updateForm(
                          "time",
                          e.target.value
                        )
                      }
                      placeholder="Example: 9:00 AM - 10:00 AM"
                      className={inputClass}
                    />
                  </FormField>

                  <FormField
                    label="Room"
                    required
                  >
                    <input
                      type="text"
                      value={form.room}
                      onChange={(e) =>
                        updateForm(
                          "room",
                          e.target.value
                        )
                      }
                      placeholder="Example: Room 101"
                      className={inputClass}
                    />
                  </FormField>

                </div>
              </div>

              {/* ACADEMIC INFORMATION */}
              <div className="mb-6">

                <div className="mb-4">
                  <h4 className="text-sm font-bold text-slate-900">
                    Academic Information
                  </h4>

                  <p className="mt-1 text-xs text-slate-500">
                    Specify the subject, faculty and class group.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                  <FormField
                    label="Subject"
                    required
                  >
                    <input
                      type="text"
                      value={form.subject}
                      onChange={(e) =>
                        updateForm(
                          "subject",
                          e.target.value
                        )
                      }
                      placeholder="Example: Data Structures"
                      className={inputClass}
                    />
                  </FormField>

                  <FormField
                    label="Faculty"
                    required
                  >
                    <input
                      type="text"
                      value={form.faculty}
                      onChange={(e) =>
                        updateForm(
                          "faculty",
                          e.target.value
                        )
                      }
                      placeholder="Example: Anjali"
                      className={inputClass}
                    />
                  </FormField>

                  <FormField
                    label="Course"
                    required
                  >
                    <input
                      type="text"
                      value={form.course}
                      onChange={(e) =>
                        updateForm(
                          "course",
                          e.target.value
                        )
                      }
                      placeholder="Example: MCA"
                      className={inputClass}
                    />
                  </FormField>

                  <FormField
                    label="Semester"
                    required
                  >
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={form.semester}
                      onChange={(e) =>
                        updateForm(
                          "semester",
                          e.target.value
                        )
                      }
                      placeholder="Example: 1"
                      className={inputClass}
                    />
                  </FormField>

                  <FormField
                    label="Section"
                    required
                  >
                    <input
                      type="text"
                      value={form.section}
                      onChange={(e) =>
                        updateForm(
                          "section",
                          e.target.value
                        )
                      }
                      placeholder="Example: A"
                      className={inputClass}
                    />
                  </FormField>

                </div>
              </div>

              {/* ERROR */}
              {error && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* ACTIONS */}
              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <RefreshCw
                        size={15}
                        className="animate-spin"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      {editingEntry ? (
                        <Pencil size={15} />
                      ) : (
                        <Plus size={16} />
                      )}

                      {editingEntry
                        ? "Update Class"
                        : "Add Class"}
                    </>
                  )}
                </button>

              </div>

            </form>
          </div>
        </div>
      )}

      {/* ======================================================
          DELETE MODAL
      ======================================================= */}

      {deleteItem && (
        <ConfirmModal
          title="Delete Class Schedule"
          message={`Are you sure you want to delete the ${
            deleteItem.subject ||
            "selected class"
          } scheduled on ${
            deleteItem.day ||
            "this day"
          }? This action cannot be undone.`}
          confirmText={
            deleting
              ? "Deleting..."
              : "Delete"
          }
          cancelText="Cancel"
          onConfirm={handleDelete}
          onCancel={() => {
            if (!deleting) {
              setDeleteItem(null);
            }
          }}
          danger
        />
      )}

    </div>
  );
}

// ============================================================
// STAT CARD
// ============================================================

function StatCard({
  icon: Icon,
  label,
  value,
  description,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

      <div className="flex items-start justify-between">

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {description}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
          <Icon size={19} />
        </div>

      </div>
    </div>
  );
}

// ============================================================
// DAY BUTTON
// ============================================================

function DayButton({
  label,
  active,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-xl bg-slate-900 px-3 py-2.5 text-xs font-bold text-white shadow-sm"
          : "rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
      }
    >
      {label === "All" ? "All Days" : label}
    </button>
  );
}

// ============================================================
// FORM FIELD
// ============================================================

function FormField({
  label,
  required = false,
  children,
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-slate-700">
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

// ============================================================
// INPUT CLASS
// ============================================================

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.75 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:bg-white focus:ring-4 focus:ring-slate-100";