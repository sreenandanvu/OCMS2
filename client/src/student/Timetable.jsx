import React, { useEffect, useMemo, useState } from "react";
import { get } from "../services/api";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function Timetable() {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDay, setSelectedDay] = useState("Monday");

  const loggedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("ocms_user") || "null");
    } catch {
      return null;
    }
  }, []);

  async function loadTimetable() {
    try {
      setLoading(true);
      setError("");

      const data = await get("/timetable");

      setTimetable(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Unable to load timetable.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTimetable();
  }, []);

  /*
   * Student information.
   * These values can later come directly from the student's profile/API.
   */
  const studentCourse = loggedUser?.course || "MCA";
  const studentSemester = Number(loggedUser?.semester || 1);
  const studentSection = loggedUser?.section || "A";

  const filteredTimetable = useMemo(() => {
    return timetable.filter((item) => {
      const courseMatch =
        !item.course ||
        item.course.toLowerCase() === studentCourse.toLowerCase();

      const semesterMatch =
        item.semester === undefined ||
        Number(item.semester) === studentSemester;

      const sectionMatch =
        !item.section ||
        item.section.toLowerCase() === studentSection.toLowerCase();

      return courseMatch && semesterMatch && sectionMatch;
    });
  }, [
    timetable,
    studentCourse,
    studentSemester,
    studentSection,
  ]);

  const selectedDayItems = useMemo(() => {
    return filteredTimetable
      .filter(
        (item) =>
          item.day?.toLowerCase() === selectedDay.toLowerCase()
      )
      .sort((a, b) => {
        const periodA = Number(a.period) || 0;
        const periodB = Number(b.period) || 0;

        return periodA - periodB;
      });
  }, [filteredTimetable, selectedDay]);

  const totalClasses = filteredTimetable.length;

  const classesByDay = useMemo(() => {
    const result = {};

    DAYS.forEach((day) => {
      result[day] = filteredTimetable.filter(
        (item) =>
          item.day?.toLowerCase() === day.toLowerCase()
      ).length;
    });

    return result;
  }, [filteredTimetable]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <p className="text-sm font-medium text-slate-600">
            Loading timetable...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-xl">
                🗓️
              </div>

              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                Class Schedule
              </span>
            </div>

            <h1 className="text-2xl font-bold sm:text-3xl">
              My Timetable
            </h1>

            <p className="mt-2 text-sm text-blue-100">
              Your weekly class schedule at a glance.
            </p>
          </div>

          <div className="rounded-xl bg-white/10 px-6 py-4 backdrop-blur-sm">
            <p className="text-xs text-blue-100">
              Classes This Week
            </p>

            <p className="mt-1 text-3xl font-bold">
              {totalClasses}
            </p>
          </div>
        </div>
      </div>

      {/* Student Info */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <InfoCard
          label="Course"
          value={studentCourse}
          icon="🎓"
        />

        <InfoCard
          label="Semester"
          value={`Semester ${studentSemester}`}
          icon="📚"
        />

        <InfoCard
          label="Section"
          value={`Section ${studentSection}`}
          icon="👥"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-red-700">
              Unable to load timetable
            </p>

            <p className="mt-1 text-sm text-red-600">
              {error}
            </p>
          </div>

          <button
            onClick={loadTimetable}
            className="w-fit rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Day Selector */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3">
          <h2 className="font-bold text-slate-800">
            Select Day
          </h2>

          <p className="text-sm text-slate-500">
            Choose a day to view your classes.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {DAYS.map((day) => {
            const active = selectedDay === day;

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`rounded-xl px-3 py-3 text-sm font-semibold transition ${
                  active
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600"
                }`}
              >
                <div>{day}</div>

                <div
                  className={`mt-1 text-xs ${
                    active
                      ? "text-blue-100"
                      : "text-slate-400"
                  }`}
                >
                  {classesByDay[day]}{" "}
                  {classesByDay[day] === 1
                    ? "class"
                    : "classes"}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                {selectedDay}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {selectedDayItems.length}{" "}
                {selectedDayItems.length === 1
                  ? "class"
                  : "classes"}{" "}
                scheduled
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-xl">
              📅
            </div>
          </div>
        </div>

        {selectedDayItems.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl">
              ☕
            </div>

            <h3 className="mt-4 font-bold text-slate-800">
              No classes today
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              You don't have any classes scheduled for{" "}
              {selectedDay}.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {selectedDayItems.map((item, index) => (
              <div
                key={item._id || index}
                className="p-5 transition hover:bg-slate-50"
              >
                <div className="flex gap-4">
                  {/* Period */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white">
                    {item.period || index + 1}
                  </div>

                  {/* Class */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-base font-bold text-slate-800 sm:text-lg">
                          {item.subject || "Subject not specified"}
                        </h3>

                        <p className="mt-1 text-sm font-medium text-blue-600">
                          {item.time || "Time not specified"}
                        </p>
                      </div>

                      {item.room && (
                        <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          Room {item.room}
                        </span>
                      )}
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                      <div className="flex items-center gap-2 text-slate-600">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100">
                          👨‍🏫
                        </span>

                        <span>
                          <span className="text-xs text-slate-400">
                            Faculty
                          </span>
                          <br />
                          <span className="font-medium text-slate-700">
                            {item.faculty || "Not specified"}
                          </span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-slate-600">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100">
                          📍
                        </span>

                        <span>
                          <span className="text-xs text-slate-400">
                            Room
                          </span>
                          <br />
                          <span className="font-medium text-slate-700">
                            {item.room || "Not specified"}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Weekly Overview */}
      {filteredTimetable.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800">
            Weekly Overview
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Number of classes scheduled each day.
          </p>

          <div className="mt-5 space-y-4">
            {DAYS.map((day) => {
              const count = classesByDay[day];

              const percentage =
                totalClasses > 0
                  ? Math.round((count / totalClasses) * 100)
                  : 0;

              return (
                <div key={day}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">
                      {day}
                    </span>

                    <span className="text-xs font-semibold text-slate-500">
                      {count}{" "}
                      {count === 1 ? "class" : "classes"}
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Refresh */}
      <div className="flex justify-end">
        <button
          onClick={loadTimetable}
          className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-blue-600"
        >
          ↻ Refresh Timetable
        </button>
      </div>
    </div>
  );
}

function InfoCard({ label, value, icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-xl">
          {icon}
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            {label}
          </p>

          <p className="mt-1 text-base font-bold text-slate-800">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}