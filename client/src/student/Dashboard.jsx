import React, { useEffect, useState } from "react";
import { get } from "../services/api";

export default function Dashboard() {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [exams, setExams] = useState([]);
  const [notices, setNotices] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const student = JSON.parse(
    localStorage.getItem("ocms_user") || "null"
  );

  const studentName = student?.name || "Akhil Raj";
  const rollNo = student?.rollNo || "MCA001";

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const [
          studentData,
          attendanceData,
          assignmentData,
          examData,
          noticeData,
        ] = await Promise.all([
          get("/students"),
          get("/attendance"),
          get("/assignments"),
          get("/exams"),
          get("/notices"),
        ]);

        setStudents(
          Array.isArray(studentData)
            ? studentData
            : studentData?.students || studentData?.data || []
        );

        setAttendance(
          Array.isArray(attendanceData)
            ? attendanceData
            : attendanceData?.attendance ||
              attendanceData?.records ||
              attendanceData?.data ||
              []
        );

        setAssignments(
          Array.isArray(assignmentData)
            ? assignmentData
            : assignmentData?.assignments ||
              assignmentData?.data ||
              []
        );

        setExams(
          Array.isArray(examData)
            ? examData
            : examData?.exams || examData?.data || []
        );

        setNotices(
          Array.isArray(noticeData)
            ? noticeData
            : noticeData?.notices || noticeData?.data || []
        );
      } catch (err) {
        setError(err?.message || "Unable to load dashboard data.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  /* =========================
     CURRENT STUDENT
  ========================= */

  const currentStudent =
    students.find(
      (item) =>
        item.rollNo === rollNo ||
        item.name === studentName ||
        item.email === student?.email
    ) || {
      name: studentName,
      rollNo,
      course: "MCA",
      semester: 1,
      section: "A",
      status: "Active",
    };

  /* =========================
     STUDENT ATTENDANCE
  ========================= */

  const studentAttendance = attendance.filter(
    (item) =>
      item.rollNo === currentStudent.rollNo ||
      item.studentName === currentStudent.name ||
      item.student?.rollNo === currentStudent.rollNo ||
      item.student?.name === currentStudent.name
  );

  const present = studentAttendance.filter(
    (item) =>
      String(item.status || "").toLowerCase() === "present"
  ).length;

  const totalAttendance = studentAttendance.length;

  const attendancePercentage =
    totalAttendance > 0
      ? Math.round((present / totalAttendance) * 100)
      : 0;

  /* =========================
     PENDING ASSIGNMENTS
  ========================= */

  const pendingAssignments = assignments.filter(
    (item) => {
      const status = String(
        item.status || ""
      ).toLowerCase();

      return (
        status !== "completed" &&
        status !== "submitted"
      );
    }
  ).length;

  /* =========================
     UPCOMING EXAMS
  ========================= */

  const upcomingExams = exams.filter(
    (item) => item.published !== false
  );

  /* =========================
     LOADING
  ========================= */

  if (loading) {
    return (
      <div className="w-full max-w-[1600px] mx-auto">
        <div className="
          flex min-h-[400px]
          items-center justify-center
          rounded-2xl border border-slate-200
          bg-white shadow-sm
        ">
          <div className="flex items-center gap-3">
            <div className="
              h-5 w-5 animate-spin rounded-full
              border-2 border-slate-200
              border-t-violet-600
            " />

            <p className="text-sm font-medium text-slate-500">
              Loading student dashboard...
            </p>
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

      <div className="mb-8">
        <p className="
          text-xs font-bold uppercase
          tracking-[0.16em] text-violet-600
        ">
          Student Portal
        </p>

        <h1 className="
          mt-2 text-3xl font-bold
          tracking-tight text-slate-900
        ">
          Welcome, {studentName}
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Here's an overview of your academic activities.
        </p>
      </div>

      {/* =========================
          ERROR
      ========================= */}

      {error && (
        <div className="
          mb-6 rounded-xl border
          border-red-200 bg-red-50
          px-4 py-3 text-sm
          font-medium text-red-700
        ">
          {error}
        </div>
      )}

      {/* =========================
          STAT CARDS
      ========================= */}

      <div className="
        mb-8 grid grid-cols-1
        gap-4 sm:grid-cols-2
        xl:grid-cols-4
      ">

        {/* COURSE */}

        <div className="
          rounded-2xl border
          border-slate-200 bg-white
          p-5 shadow-sm
        ">
          <div className="flex items-start justify-between">

            <div>
              <p className="
                text-xs font-semibold
                uppercase tracking-wide
                text-slate-400
              ">
                Course
              </p>

              <p className="
                mt-3 text-2xl
                font-bold text-slate-900
              ">
                {currentStudent.course || "MCA"}
              </p>
            </div>

            <div className="
              flex h-11 w-11
              items-center justify-center
              rounded-xl bg-violet-50
              text-xl
            ">
              🎓
            </div>

          </div>
        </div>

        {/* SEMESTER */}

        <div className="
          rounded-2xl border
          border-slate-200 bg-white
          p-5 shadow-sm
        ">
          <div className="flex items-start justify-between">

            <div>
              <p className="
                text-xs font-semibold
                uppercase tracking-wide
                text-slate-400
              ">
                Semester
              </p>

              <p className="
                mt-3 text-2xl
                font-bold text-slate-900
              ">
                {currentStudent.semester || 1}
              </p>
            </div>

            <div className="
              flex h-11 w-11
              items-center justify-center
              rounded-xl bg-blue-50
              text-xl
            ">
              📚
            </div>

          </div>
        </div>

        {/* ATTENDANCE */}

        <div className="
          rounded-2xl border
          border-slate-200 bg-white
          p-5 shadow-sm
        ">
          <div className="flex items-start justify-between">

            <div>
              <p className="
                text-xs font-semibold
                uppercase tracking-wide
                text-slate-400
              ">
                Attendance
              </p>

              <p className="
                mt-3 text-2xl
                font-bold text-slate-900
              ">
                {attendancePercentage}%
              </p>
            </div>

            <div className="
              flex h-11 w-11
              items-center justify-center
              rounded-xl bg-emerald-50
              text-xl
            ">
              📊
            </div>

          </div>
        </div>

        {/* ASSIGNMENTS */}

        <div className="
          rounded-2xl border
          border-slate-200 bg-white
          p-5 shadow-sm
        ">
          <div className="flex items-start justify-between">

            <div>
              <p className="
                text-xs font-semibold
                uppercase tracking-wide
                text-slate-400
              ">
                Pending Assignments
              </p>

              <p className="
                mt-3 text-2xl
                font-bold text-slate-900
              ">
                {pendingAssignments}
              </p>
            </div>

            <div className="
              flex h-11 w-11
              items-center justify-center
              rounded-xl bg-amber-50
              text-xl
            ">
              📝
            </div>

          </div>
        </div>

      </div>

      {/* =========================
          PROFILE + ATTENDANCE
      ========================= */}

      <div className="
        mb-6 grid grid-cols-1
        gap-6 xl:grid-cols-2
      ">

        {/* PROFILE */}

        <section className="
          rounded-2xl border
          border-slate-200 bg-white
          p-5 shadow-sm
        ">

          <div className="mb-6">
            <h2 className="
              text-lg font-bold
              text-slate-900
            ">
              My Profile
            </h2>

            <p className="
              mt-1 text-xs
              text-slate-500
            ">
              Basic academic information
            </p>
          </div>

          <div className="
            grid grid-cols-1
            gap-4 sm:grid-cols-2
          ">

            <div className="
              rounded-xl bg-slate-50
              p-4
            ">
              <span className="
                text-[11px] font-semibold
                uppercase tracking-wide
                text-slate-400
              ">
                Name
              </span>

              <p className="
                mt-2 truncate
                text-sm font-bold
                text-slate-800
              ">
                {currentStudent.name}
              </p>
            </div>

            <div className="
              rounded-xl bg-slate-50
              p-4
            ">
              <span className="
                text-[11px] font-semibold
                uppercase tracking-wide
                text-slate-400
              ">
                Roll Number
              </span>

              <p className="
                mt-2 truncate
                text-sm font-bold
                text-slate-800
              ">
                {currentStudent.rollNo}
              </p>
            </div>

            <div className="
              rounded-xl bg-slate-50
              p-4
            ">
              <span className="
                text-[11px] font-semibold
                uppercase tracking-wide
                text-slate-400
              ">
                Course
              </span>

              <p className="
                mt-2 text-sm
                font-bold text-slate-800
              ">
                {currentStudent.course || "MCA"}
              </p>
            </div>

            <div className="
              rounded-xl bg-slate-50
              p-4
            ">
              <span className="
                text-[11px] font-semibold
                uppercase tracking-wide
                text-slate-400
              ">
                Semester
              </span>

              <p className="
                mt-2 text-sm
                font-bold text-slate-800
              ">
                {currentStudent.semester || 1}
              </p>
            </div>

            <div className="
              rounded-xl bg-slate-50
              p-4
            ">
              <span className="
                text-[11px] font-semibold
                uppercase tracking-wide
                text-slate-400
              ">
                Section
              </span>

              <p className="
                mt-2 text-sm
                font-bold text-slate-800
              ">
                {currentStudent.section || "A"}
              </p>
            </div>

            <div className="
              rounded-xl bg-slate-50
              p-4
            ">
              <span className="
                text-[11px] font-semibold
                uppercase tracking-wide
                text-slate-400
              ">
                Status
              </span>

              <p className="
                mt-2 text-sm
                font-bold text-emerald-600
              ">
                {currentStudent.status || "Active"}
              </p>
            </div>

          </div>
        </section>

        {/* ATTENDANCE */}

        <section className="
          rounded-2xl border
          border-slate-200 bg-white
          p-5 shadow-sm
        ">

          <div className="mb-6">
            <h2 className="
              text-lg font-bold
              text-slate-900
            ">
              Attendance
            </h2>

            <p className="
              mt-1 text-xs
              text-slate-500
            ">
              Current attendance overview
            </p>
          </div>

          <div className="
            flex flex-col
            items-center gap-8
            sm:flex-row
          ">

            {/* CIRCLE */}

            <div className="
              relative flex h-36
              w-36 shrink-0
              items-center justify-center
              rounded-full
              border-[12px]
              border-violet-100
            ">

              <div className="text-center">
                <strong className="
                  block text-3xl
                  font-bold text-slate-900
                ">
                  {attendancePercentage}%
                </strong>

                <span className="
                  text-xs font-medium
                  text-slate-500
                ">
                  Present
                </span>
              </div>

            </div>

            {/* DETAILS */}

            <div className="
              grid w-full
              grid-cols-2 gap-4
            ">

              <div className="
                rounded-xl
                bg-emerald-50
                p-4 text-center
              ">
                <span className="
                  block text-xs
                  font-semibold text-emerald-600
                ">
                  Present
                </span>

                <strong className="
                  mt-2 block text-2xl
                  font-bold text-emerald-700
                ">
                  {present}
                </strong>
              </div>

              <div className="
                rounded-xl
                bg-slate-50
                p-4 text-center
              ">
                <span className="
                  block text-xs
                  font-semibold text-slate-500
                ">
                  Total Classes
                </span>

                <strong className="
                  mt-2 block text-2xl
                  font-bold text-slate-800
                ">
                  {totalAttendance}
                </strong>
              </div>

            </div>

          </div>
        </section>

      </div>

      {/* =========================
          EXAMS + NOTICES
      ========================= */}

      <div className="
        grid grid-cols-1
        gap-6 xl:grid-cols-2
      ">

        {/* EXAMS */}

        <section className="
          rounded-2xl border
          border-slate-200 bg-white
          p-5 shadow-sm
        ">

          <div className="
            mb-5 flex
            items-center
            justify-between
          ">
            <div>
              <h2 className="
                text-lg font-bold
                text-slate-900
              ">
                Upcoming Exams
              </h2>

              <p className="
                mt-1 text-xs
                text-slate-500
              ">
                {upcomingExams.length} examination records
              </p>
            </div>

            <div className="
              flex h-10 w-10
              items-center justify-center
              rounded-xl bg-blue-50
              text-xl
            ">
              📅
            </div>
          </div>

          {upcomingExams.length === 0 ? (
            <div className="
              rounded-xl bg-slate-50
              p-8 text-center
            ">
              <p className="
                text-sm font-medium
                text-slate-500
              ">
                No upcoming examinations.
              </p>
            </div>
          ) : (
            <div className="space-y-3">

              {upcomingExams
                .slice(0, 5)
                .map((exam, index) => (
                  <div
                    key={
                      exam._id ||
                      exam.id ||
                      `${exam.name}-${index}`
                    }
                    className="
                      flex items-center
                      justify-between gap-4
                      rounded-xl border
                      border-slate-100
                      bg-slate-50
                      p-4
                    "
                  >

                    <div className="min-w-0">
                      <p className="
                        truncate text-sm
                        font-bold text-slate-800
                      ">
                        {exam.name ||
                          exam.title ||
                          "Examination"}
                      </p>

                      <p className="
                        mt-1 truncate
                        text-xs text-slate-500
                      ">
                        {exam.course || "MCA"}
                        {" • "}
                        Semester{" "}
                        {exam.semester || 1}
                      </p>
                    </div>

                    <span className="
                      shrink-0 rounded-lg
                      bg-white px-3 py-2
                      text-xs font-semibold
                      text-slate-600
                      shadow-sm
                    ">
                      {exam.date
                        ? new Date(
                            exam.date
                          ).toLocaleDateString()
                        : "TBA"}
                    </span>

                  </div>
                ))}

            </div>
          )}
        </section>

        {/* NOTICES */}

        <section className="
          rounded-2xl border
          border-slate-200 bg-white
          p-5 shadow-sm
        ">

          <div className="
            mb-5 flex
            items-center
            justify-between
          ">
            <div>
              <h2 className="
                text-lg font-bold
                text-slate-900
              ">
                Latest Notices
              </h2>

              <p className="
                mt-1 text-xs
                text-slate-500
              ">
                Important college announcements
              </p>
            </div>

            <div className="
              flex h-10 w-10
              items-center justify-center
              rounded-xl bg-amber-50
              text-xl
            ">
              🔔
            </div>
          </div>

          {notices.length === 0 ? (
            <div className="
              rounded-xl bg-slate-50
              p-8 text-center
            ">
              <p className="
                text-sm font-medium
                text-slate-500
              ">
                No notices available.
              </p>
            </div>
          ) : (
            <div className="space-y-3">

              {notices
                .slice(0, 5)
                .map((notice, index) => (
                  <div
                    key={
                      notice._id ||
                      notice.id ||
                      `${notice.title}-${index}`
                    }
                    className="
                      flex items-start
                      gap-3 rounded-xl
                      border border-slate-100
                      p-4
                    "
                  >

                    <div className="
                      flex h-9 w-9
                      shrink-0 items-center
                      justify-center
                      rounded-lg
                      bg-violet-50
                      text-lg
                    ">
                      🔔
                    </div>

                    <div className="min-w-0 flex-1">

                      <p className="
                        truncate text-sm
                        font-bold text-slate-800
                      ">
                        {notice.title || "Notice"}
                      </p>

                      <p className="
                        mt-1 line-clamp-2
                        text-xs leading-relaxed
                        text-slate-500
                      ">
                        {notice.message ||
                          notice.description ||
                          "No message available."}
                      </p>

                      {(notice.date ||
                        notice.createdAt) && (
                        <p className="
                          mt-2 text-[10px]
                          font-medium
                          text-slate-400
                        ">
                          {new Date(
                            notice.date ||
                              notice.createdAt
                          ).toLocaleDateString()}
                        </p>
                      )}

                    </div>

                  </div>
                ))}

            </div>
          )}
        </section>

      </div>

    </div>
  );
}