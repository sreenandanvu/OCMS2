import React, { useEffect, useState } from "react";
import { get } from "../services/api";

export default function Profile() {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loggedUser = JSON.parse(
    localStorage.getItem("ocms_user") || "null"
  );

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        setError("");

        const data = await get("/students");

        const students = Array.isArray(data)
          ? data
          : data?.students || data?.data || [];

        const found =
          students.find(
            (item) =>
              item.email === loggedUser?.email ||
              item.name === loggedUser?.name ||
              item.rollNo === loggedUser?.rollNo
          ) || students[0];

        setStudent(found || null);
      } catch (err) {
        setError(
          err?.message || "Unable to load student profile."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [loggedUser?.email, loggedUser?.name, loggedUser?.rollNo]);

  if (loading) {
    return (
      <div className="w-full max-w-[1600px] mx-auto">
        <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-violet-600" />
            Loading profile...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-[1600px] mx-auto">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="w-full max-w-[1600px] mx-auto">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Student profile not found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto">

      {/* HEADER */}

      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-600">
          Student Portal
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          My Profile
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          View your personal and academic information.
        </p>
      </div>

      {/* TOP SECTION */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* PROFILE CARD */}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">

          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-violet-50 text-4xl">
            🎓
          </div>

          <h2 className="mt-5 truncate text-xl font-bold text-slate-900">
            {student.name}
          </h2>

          <p className="mt-1 truncate text-sm text-slate-500">
            {student.email || "Email not provided"}
          </p>

          <div className="mt-4">
            <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-600">
              {student.status || "Active"}
            </span>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-5">

            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">
                Roll Number
              </span>

              <strong className="text-slate-800">
                {student.rollNo || "—"}
              </strong>
            </div>

            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-slate-500">
                Course
              </span>

              <strong className="text-slate-800">
                {student.course || "—"}
              </strong>
            </div>

          </div>
        </section>

        {/* PERSONAL INFORMATION */}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">

          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">
              Personal Information
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Your registered personal details
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            <InfoItem
              label="Full Name"
              value={student.name}
            />

            <InfoItem
              label="Email"
              value={student.email}
            />

            <InfoItem
              label="Phone"
              value={student.phone}
            />

            <InfoItem
              label="Mobile"
              value={student.mobile}
            />

            <InfoItem
              label="Roll Number"
              value={student.rollNo}
            />

            <InfoItem
              label="Register Number"
              value={student.registerNo}
            />

          </div>
        </section>
      </div>

      {/* ACADEMIC INFORMATION */}

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-900">
            Academic Information
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Your current academic details
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <InfoItem
            label="Course"
            value={student.course}
          />

          <InfoItem
            label="Semester"
            value={student.semester}
          />

          <InfoItem
            label="Section"
            value={student.section}
          />

          <InfoItem
            label="Status"
            value={student.status || "Active"}
            success
          />

        </div>

        {/* SUBJECTS */}

        {Array.isArray(student.subjects) &&
          student.subjects.length > 0 && (
            <div className="mt-6 border-t border-slate-100 pt-6">

              <h3 className="text-sm font-bold text-slate-900">
                Registered Subjects
              </h3>

              <div className="mt-4 flex flex-wrap gap-2">

                {student.subjects.map(
                  (subject, index) => (
                    <span
                      key={index}
                      className="
                        rounded-full
                        bg-violet-50
                        px-3 py-1.5
                        text-xs
                        font-semibold
                        text-violet-700
                      "
                    >
                      {typeof subject === "string"
                        ? subject
                        : subject?.name ||
                          subject?.subject ||
                          "Subject"}
                    </span>
                  )
                )}

              </div>
            </div>
          )}

      </section>

    </div>
  );
}

/* =========================
   INFO ITEM
========================= */

function InfoItem({
  label,
  value,
  success = false,
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">

      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </span>

      <p
        className={`
          mt-2 truncate text-sm font-bold
          ${
            success
              ? "text-emerald-600"
              : "text-slate-800"
          }
        `}
      >
        {value !== undefined &&
        value !== null &&
        String(value).trim() !== ""
          ? value
          : "Not provided"}
      </p>

    </div>
  );
}