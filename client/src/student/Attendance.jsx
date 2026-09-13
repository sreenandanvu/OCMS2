import React, { useEffect, useMemo, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { get, post } from "../services/api";

import {
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock3,
  ChevronRight,
  ArrowLeft,
  RefreshCw,
  UserRound,
  QrCode,
  Camera,
  X,
} from "lucide-react";

export default function Attendance() {
  const [attendance, setAttendance] = useState([]);
  const [students, setStudents] = useState([]);

  const [selectedDate, setSelectedDate] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* QR STATES */
  const [showScanner, setShowScanner] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const [scanning, setScanning] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const scannerRef = useRef(null);
  const scannerStartedRef = useRef(false);

  const loggedUser = useMemo(() => {
    try {
      return JSON.parse(
        localStorage.getItem("ocms_user") || "null"
      );
    } catch {
      return null;
    }
  }, []);

  /* =====================================================
     LOAD ATTENDANCE
  ===================================================== */

  async function loadAttendance() {
    try {
      setLoading(true);
      setError("");

      const [attendanceData, studentData] =
        await Promise.all([
          get("/attendance"),
          get("/students"),
        ]);

      setAttendance(
        Array.isArray(attendanceData)
          ? attendanceData
          : attendanceData?.attendance ||
              attendanceData?.records ||
              attendanceData?.data ||
              []
      );

      setStudents(
        Array.isArray(studentData)
          ? studentData
          : studentData?.students ||
              studentData?.data ||
              []
      );
    } catch (err) {
      setError(
        err?.message ||
          "Unable to load attendance."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAttendance();
  }, []);

  /* =====================================================
     CURRENT STUDENT
  ===================================================== */

  const currentStudent = useMemo(() => {
    return (
      students.find(
        (student) =>
          student.email === loggedUser?.email ||
          student.name === loggedUser?.name ||
          student.rollNo === loggedUser?.rollNo
      ) || {
        name: loggedUser?.name || "Student",
        rollNo: loggedUser?.rollNo || "",
        course: loggedUser?.course || "MCA",
        semester: loggedUser?.semester || 1,
        section: loggedUser?.section || "A",
      }
    );
  }, [
    students,
    loggedUser?.email,
    loggedUser?.name,
    loggedUser?.rollNo,
    loggedUser?.course,
    loggedUser?.semester,
    loggedUser?.section,
  ]);

  /* =====================================================
     MY ATTENDANCE
  ===================================================== */

  const myAttendance = useMemo(() => {
    return attendance.filter((item) => {
      return (
        item.rollNo === currentStudent.rollNo ||
        item.studentName === currentStudent.name ||
        item.student?.rollNo === currentStudent.rollNo ||
        item.student?.name === currentStudent.name ||
        item.studentId === currentStudent._id
      );
    });
  }, [attendance, currentStudent]);

  /* =====================================================
     SUMMARY
  ===================================================== */

  const present = myAttendance.filter(
    (item) =>
      String(item.status || "").toLowerCase() ===
      "present"
  ).length;

  const absent = myAttendance.filter(
    (item) =>
      String(item.status || "").toLowerCase() ===
      "absent"
  ).length;

  const late = myAttendance.filter(
    (item) =>
      String(item.status || "").toLowerCase() ===
      "late"
  ).length;

  const total = myAttendance.length;

  const percentage =
    total > 0
      ? Math.round((present / total) * 100)
      : 0;

  /* =====================================================
     DATES
  ===================================================== */

  const dates = useMemo(() => {
    return [
      ...new Set(
        myAttendance
          .map((item) => item.date)
          .filter(Boolean)
      ),
    ].sort(
      (a, b) =>
        new Date(b).getTime() -
        new Date(a).getTime()
    );
  }, [myAttendance]);

  /* =====================================================
     SELECTED DATE
  ===================================================== */

  const selectedDayAttendance = useMemo(() => {
    if (!selectedDate) return [];

    return myAttendance
      .filter((item) => item.date === selectedDate)
      .sort(
        (a, b) =>
          Number(a.period || 0) -
          Number(b.period || 0)
      );
  }, [myAttendance, selectedDate]);

  /* =====================================================
     DATE FORMAT
  ===================================================== */

  function formatDate(date) {
    if (!date) return "";

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  }

  /* =====================================================
     STATUS
  ===================================================== */

  function getStatusStyle(status) {
    const value = String(
      status || ""
    ).toLowerCase();

    if (value === "present") {
      return {
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        icon: CheckCircle2,
      };
    }

    if (value === "absent") {
      return {
        bg: "bg-red-50",
        text: "text-red-700",
        icon: XCircle,
      };
    }

    if (value === "late") {
      return {
        bg: "bg-amber-50",
        text: "text-amber-700",
        icon: Clock3,
      };
    }

    return {
      bg: "bg-slate-50",
      text: "text-slate-600",
      icon: Clock3,
    };
  }

  /* =====================================================
     QR SCANNER
  ===================================================== */

  async function startScanner() {
    setScannerError("");
    setSuccessMessage("");
    setShowScanner(true);
    setScanning(true);

    /*
     * Wait for the scanner container to appear.
     */
    setTimeout(async () => {
      try {
        if (scannerStartedRef.current) return;

        const scanner = new Html5Qrcode(
          "attendance-qr-reader"
        );

        scannerRef.current = scanner;

        scannerStartedRef.current = true;

        await scanner.start(
          {
            facingMode: "environment",
          },
          {
            fps: 10,
            qrbox: {
              width: 250,
              height: 250,
            },
          },
          async (decodedText) => {
            await handleQrCode(decodedText);
          },
          () => {
            // Ignore normal scanning errors.
          }
        );
      } catch (err) {
        scannerStartedRef.current = false;
        setScanning(false);

        setScannerError(
          "Unable to access the camera. Please allow camera permission and try again."
        );
      }
    }, 200);
  }

  async function stopScanner() {
    try {
      if (scannerRef.current) {
        if (scannerStartedRef.current) {
          await scannerRef.current.stop();
        }

        await scannerRef.current.clear();
      }
    } catch {
      // Scanner may already be stopped.
    }

    scannerRef.current = null;
    scannerStartedRef.current = false;
    setScanning(false);
  }

  async function closeScanner() {
    await stopScanner();

    setShowScanner(false);
    setScannerError("");
  }

  /* =====================================================
     QR CHECK-IN
  ===================================================== */

  async function handleQrCode(decodedText) {
    if (checkingIn) return;

    setCheckingIn(true);
    setScannerError("");

    try {
      /*
       * Faculty QR normally contains the session code.
       *
       * We also support JSON QR data.
       */
      let sessionCode = decodedText.trim();

      try {
        const parsed = JSON.parse(decodedText);

        sessionCode =
          parsed.sessionCode ||
          parsed.code ||
          parsed.session ||
          decodedText;
      } catch {
        // Plain text session code.
      }

      if (!sessionCode) {
        throw new Error(
          "Invalid attendance QR code."
        );
      }

      await stopScanner();

      await post("/attendance/qr-checkin", {
        sessionCode,
      });

      setShowScanner(false);

      setSuccessMessage(
        "Attendance marked successfully!"
      );

      await loadAttendance();
    } catch (err) {
      setScannerError(
        err?.message ||
          "Unable to mark attendance."
      );

      setCheckingIn(false);

      /*
       * Allow the student to scan again.
       */
      if (!scannerStartedRef.current) {
        setTimeout(() => {
          if (showScanner) {
            startScanner();
          }
        }, 500);
      }
    } finally {
      setCheckingIn(false);
    }
  }

  /* =====================================================
     CLEANUP CAMERA
  ===================================================== */

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .catch(() => {});
      }
    };
  }, []);

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="w-full max-w-[1600px] mx-auto">
        <div className="
          flex min-h-[400px]
          items-center justify-center
          rounded-2xl border border-slate-200
          bg-white shadow-sm
        ">
          <div className="
            flex items-center gap-3
            text-sm font-medium text-slate-500
          ">
            <RefreshCw
              size={18}
              className="animate-spin text-violet-600"
            />

            Loading attendance...
          </div>
        </div>
      </div>
    );
  }

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <div className="w-full max-w-[1600px] mx-auto">

      {/* HEADER */}

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
            My Attendance
          </h1>

          <p className="
            mt-2 text-sm
            text-slate-500
          ">
            View attendance and check in using your
            faculty's QR code.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">

          {/* QR BUTTON */}

          <button
            type="button"
            onClick={startScanner}
            className="
              inline-flex items-center
              justify-center gap-2
              rounded-xl
              bg-violet-600
              px-4 py-2.5
              text-sm font-bold
              text-white
              shadow-sm
              transition
              hover:bg-violet-700
            "
          >
            <QrCode size={17} />
            Scan Attendance QR
          </button>

          {/* REFRESH */}

          <button
            type="button"
            onClick={loadAttendance}
            className="
              inline-flex items-center
              justify-center gap-2
              rounded-xl
              border border-slate-200
              bg-white px-4 py-2.5
              text-sm font-semibold
              text-slate-700
              shadow-sm
              hover:bg-slate-50
            "
          >
            <RefreshCw size={16} />
            Refresh
          </button>

        </div>
      </div>

      {/* SUCCESS MESSAGE */}

      {successMessage && (
        <div className="
          mb-6 flex items-center
          gap-3 rounded-xl
          border border-emerald-200
          bg-emerald-50
          p-4 text-sm
          font-semibold
          text-emerald-700
        ">
          <CheckCircle2 size={19} />

          <span>{successMessage}</span>

          <button
            type="button"
            onClick={() =>
              setSuccessMessage("")
            }
            className="
              ml-auto rounded-lg
              p-1 hover:bg-emerald-100
            "
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ERROR */}

      {error && (
        <div className="
          mb-6 rounded-xl
          border border-red-200
          bg-red-50 p-5
          text-sm text-red-700
        ">
          <p className="font-bold">
            Unable to load attendance
          </p>

          <p className="mt-1">
            {error}
          </p>

          <button
            type="button"
            onClick={loadAttendance}
            className="
              mt-4 inline-flex
              items-center gap-2
              rounded-lg bg-red-600
              px-4 py-2
              text-xs font-bold
              text-white
              hover:bg-red-700
            "
          >
            <RefreshCw size={14} />
            Try Again
          </button>
        </div>
      )}

      {/* STUDENT INFO */}

      <div className="
        mb-6 flex flex-col
        gap-4 rounded-2xl
        border border-slate-200
        bg-white p-5
        shadow-sm sm:flex-row
        sm:items-center
        sm:justify-between
      ">

        <div className="flex items-center gap-4">

          <div className="
            flex h-12 w-12
            shrink-0 items-center
            justify-center
            rounded-xl bg-violet-50
            text-violet-600
          ">
            <UserRound size={22} />
          </div>

          <div className="min-w-0">
            <h2 className="
              truncate text-base
              font-bold text-slate-900
            ">
              {currentStudent.name}
            </h2>

            <p className="
              mt-1 truncate
              text-xs text-slate-500
            ">
              {currentStudent.rollNo || "-"}
              {" • "}
              {currentStudent.course || "MCA"}
              {" • "}
              Semester{" "}
              {currentStudent.semester || 1}
              {" • "}
              Section{" "}
              {currentStudent.section || "A"}
            </p>
          </div>

        </div>

        <div className="
          rounded-xl bg-slate-50
          px-5 py-3 text-center
        ">
          <p className="
            text-[10px] font-bold
            uppercase tracking-wide
            text-slate-400
          ">
            Attendance
          </p>

          <p className="
            mt-1 text-2xl
            font-bold text-slate-900
          ">
            {percentage}%
          </p>
        </div>

      </div>

      {/* SUMMARY */}

      <div className="
        mb-8 grid grid-cols-2
        gap-4 lg:grid-cols-4
      ">

        <SummaryCard
          label="Total Classes"
          value={total}
        />

        <SummaryCard
          label="Present"
          value={present}
          type="present"
          icon={<CheckCircle2 size={19} />}
        />

        <SummaryCard
          label="Absent"
          value={absent}
          type="absent"
          icon={<XCircle size={19} />}
        />

        <SummaryCard
          label="Late"
          value={late}
          type="late"
          icon={<Clock3 size={19} />}
        />

      </div>

      {/* SELECTED DATE */}

      {selectedDate ? (
        <section className="
          rounded-2xl border
          border-slate-200 bg-white
          p-5 shadow-sm
        ">

          <div className="
            mb-6 flex flex-col
            gap-4 sm:flex-row
            sm:items-center
          ">

            <button
              type="button"
              onClick={() => setSelectedDate(null)}
              className="
                inline-flex
                items-center gap-2
                self-start
                rounded-xl
                border border-slate-200
                bg-white px-4 py-2.5
                text-sm font-semibold
                text-slate-700
                hover:bg-slate-50
              "
            >
              <ArrowLeft size={16} />
              Back
            </button>

            <div>
              <h2 className="
                text-xl font-bold
                text-slate-900
              ">
                {formatDate(selectedDate)}
              </h2>

              <p className="
                mt-1 text-xs
                text-slate-500
              ">
                Attendance details for this day
              </p>
            </div>

          </div>

          {selectedDayAttendance.length === 0 ? (
            <EmptyState
              icon="📅"
              title="No attendance records"
              message="No attendance was recorded for this date."
            />
          ) : (
            <div className="space-y-3">

              {selectedDayAttendance.map(
                (record, index) => {

                  const style =
                    getStatusStyle(
                      record.status
                    );

                  const StatusIcon =
                    style.icon;

                  return (
                    <div
                      key={
                        record._id ||
                        `${record.subject}-${index}`
                      }
                      className="
                        flex flex-col gap-4
                        rounded-xl border
                        border-slate-100
                        bg-slate-50/70
                        p-4
                        sm:flex-row
                        sm:items-center
                      "
                    >

                      <div className="
                        flex h-12 w-12
                        shrink-0
                        items-center
                        justify-center
                        rounded-xl bg-white
                        text-sm font-bold
                        text-slate-700
                        shadow-sm
                      ">
                        {record.period ||
                          index + 1}
                      </div>

                      <div className="
                        min-w-0 flex-1
                      ">
                        <p className="
                          truncate text-sm
                          font-bold text-slate-900
                        ">
                          {record.subject ||
                            "Subject"}
                        </p>

                        <p className="
                          mt-1 truncate
                          text-xs text-slate-500
                        ">
                          Faculty:{" "}
                          {record.faculty ||
                            "Not specified"}
                        </p>
                      </div>

                      <div className={`
                        inline-flex
                        items-center gap-2
                        self-start
                        rounded-full
                        px-3 py-1.5
                        text-xs font-bold
                        sm:self-auto
                        ${style.bg}
                        ${style.text}
                      `}>
                        <StatusIcon size={14} />
                        {record.status ||
                          "Unknown"}
                      </div>

                    </div>
                  );
                }
              )}

            </div>
          )}

        </section>
      ) : (

        /* DATE LIST */

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
              Attendance by Date
            </h2>

            <p className="
              mt-1 text-xs
              text-slate-500
            ">
              Select a date to see your attendance.
            </p>
          </div>

          {dates.length === 0 ? (
            <EmptyState
              icon="📅"
              title="No attendance records"
              message="Attendance records will appear here when faculty mark your attendance."
            />
          ) : (
            <div className="
              grid grid-cols-1
              gap-3 md:grid-cols-2
            ">

              {dates.map((date) => {

                const dayRecords =
                  myAttendance.filter(
                    (item) =>
                      item.date === date
                  );

                const dayPresent =
                  dayRecords.filter(
                    (item) =>
                      String(
                        item.status || ""
                      ).toLowerCase() ===
                      "present"
                  ).length;

                const dayAbsent =
                  dayRecords.filter(
                    (item) =>
                      String(
                        item.status || ""
                      ).toLowerCase() ===
                      "absent"
                  ).length;

                const dayPercentage =
                  dayRecords.length > 0
                    ? Math.round(
                        (dayPresent /
                          dayRecords.length) *
                          100
                      )
                    : 0;

                return (
                  <button
                    type="button"
                    key={date}
                    onClick={() =>
                      setSelectedDate(date)
                    }
                    className="
                      group flex w-full
                      items-center gap-4
                      rounded-xl border
                      border-slate-200
                      bg-white p-4
                      text-left
                      transition
                      hover:border-violet-300
                      hover:bg-violet-50/30
                      hover:shadow-sm
                    "
                  >

                    <div className="
                      flex h-12 w-12
                      shrink-0 flex-col
                      items-center
                      justify-center
                      rounded-xl
                      bg-violet-50
                      text-violet-600
                    ">
                      <CalendarDays size={18} />

                      <span className="
                        mt-0.5 text-[9px]
                        font-bold uppercase
                      ">
                        {new Date(date)
                          .toLocaleDateString(
                            "en-IN",
                            {
                              weekday: "short",
                            }
                          )}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">

                      <p className="
                        text-sm font-bold
                        text-slate-900
                      ">
                        {formatDate(date)}
                      </p>

                      <div className="
                        mt-1 flex flex-wrap
                        items-center gap-2
                        text-xs
                      ">
                        <span className="
                          text-slate-500
                        ">
                          {dayRecords.length}
                          {" "}
                          {dayRecords.length === 1
                            ? "class"
                            : "classes"}
                        </span>

                        <span className="
                          text-emerald-600
                        ">
                          {dayPresent} present
                        </span>

                        {dayAbsent > 0 && (
                          <span className="
                            text-red-600
                          ">
                            {dayAbsent} absent
                          </span>
                        )}
                      </div>

                    </div>

                    <div className="
                      hidden text-right
                      sm:block
                    ">
                      <p className="
                        text-lg font-bold
                        text-slate-900
                      ">
                        {dayPercentage}%
                      </p>

                      <p className="
                        text-[10px]
                        text-slate-400
                      ">
                        attendance
                      </p>
                    </div>

                    <ChevronRight
                      size={18}
                      className="
                        shrink-0
                        text-slate-400
                        transition
                        group-hover:translate-x-1
                        group-hover:text-violet-600
                      "
                    />

                  </button>
                );
              })}

            </div>
          )}

        </section>
      )}

      {/* =================================================
          QR SCANNER MODAL
      ================================================= */}

      {showScanner && (
        <div className="
          fixed inset-0 z-50
          flex items-center
          justify-center
          bg-slate-950/70
          p-4 backdrop-blur-sm
        ">

          <div className="
            w-full max-w-md
            overflow-hidden
            rounded-2xl
            bg-white
            shadow-2xl
          ">

            {/* Scanner Header */}

            <div className="
              flex items-center
              justify-between
              border-b border-slate-100
              p-5
            ">
              <div>
                <h2 className="
                  text-lg font-bold
                  text-slate-900
                ">
                  Scan Attendance QR
                </h2>

                <p className="
                  mt-1 text-xs
                  text-slate-500
                ">
                  Point your camera at the QR code
                  displayed by your faculty.
                </p>
              </div>

              <button
                type="button"
                onClick={closeScanner}
                className="
                  flex h-9 w-9
                  items-center
                  justify-center
                  rounded-lg
                  bg-slate-100
                  text-slate-600
                  hover:bg-slate-200
                "
              >
                <X size={18} />
              </button>
            </div>

            {/* Scanner */}

            <div className="p-5">

              <div className="
                overflow-hidden
                rounded-2xl
                border border-slate-200
                bg-slate-950
              ">
                <div
                  id="attendance-qr-reader"
                  className="w-full"
                />
              </div>

              {/* CAMERA STATUS */}

              {scanning && !checkingIn && (
                <div className="
                  mt-4 flex
                  items-center
                  justify-center
                  gap-2
                  text-xs
                  font-medium
                  text-slate-500
                ">
                  <Camera size={15} />
                  Camera is ready. Scan the QR code.
                </div>
              )}

              {/* CHECKING IN */}

              {checkingIn && (
                <div className="
                  mt-4 flex
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-violet-50
                  p-3
                  text-xs
                  font-bold
                  text-violet-700
                ">
                  <RefreshCw
                    size={15}
                    className="animate-spin"
                  />
                  Verifying attendance...
                </div>
              )}

              {/* SCANNER ERROR */}

              {scannerError && (
                <div className="
                  mt-4 rounded-xl
                  border border-red-200
                  bg-red-50
                  p-3
                  text-xs
                  font-medium
                  text-red-700
                ">
                  {scannerError}
                </div>
              )}

              <div className="
                mt-4 rounded-xl
                bg-slate-50 p-4
              ">
                <p className="
                  text-xs font-semibold
                  text-slate-700
                ">
                  How it works
                </p>

                <ol className="
                  mt-2 space-y-1
                  text-xs text-slate-500
                ">
                  <li>1. Ask your faculty to display the QR.</li>
                  <li>2. Point your camera at the QR.</li>
                  <li>3. Wait for verification.</li>
                  <li>4. Your attendance will be recorded.</li>
                </ol>
              </div>

            </div>

            {/* Footer */}

            <div className="
              border-t border-slate-100
              bg-slate-50 p-4
            ">
              <button
                type="button"
                onClick={closeScanner}
                className="
                  w-full rounded-xl
                  bg-slate-800
                  px-4 py-2.5
                  text-sm font-semibold
                  text-white
                  hover:bg-slate-900
                "
              >
                Close Scanner
              </button>
            </div>

          </div>
        </div>
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
  type,
  icon,
}) {
  const styles = {
    present: {
      card: "border-emerald-100 bg-emerald-50/50",
      label: "text-emerald-600",
      value: "text-emerald-700",
      icon: "text-emerald-600",
    },
    absent: {
      card: "border-red-100 bg-red-50/50",
      label: "text-red-600",
      value: "text-red-700",
      icon: "text-red-600",
    },
    late: {
      card: "border-amber-100 bg-amber-50/50",
      label: "text-amber-600",
      value: "text-amber-700",
      icon: "text-amber-600",
    },
  };

  const style =
    styles[type] || {
      card: "border-slate-200 bg-white",
      label: "text-slate-400",
      value: "text-slate-900",
      icon: "text-slate-500",
    };

  return (
    <div className={`
      rounded-2xl border
      p-5 shadow-sm
      ${style.card}
    `}>

      <div className="
        flex items-center
        justify-between
      ">
        <p className={`
          text-xs font-semibold
          uppercase tracking-wide
          ${style.label}
        `}>
          {label}
        </p>

        {icon && (
          <span className={style.icon}>
            {icon}
          </span>
        )}
      </div>

      <p className={`
        mt-3 text-3xl
        font-bold
        ${style.value}
      `}>
        {value}
      </p>

    </div>
  );
}

/* =====================================================
   EMPTY STATE
===================================================== */

function EmptyState({
  icon,
  title,
  message,
}) {
  return (
    <div className="
      rounded-xl
      bg-slate-50
      px-6 py-12
      text-center
    ">
      <div className="
        mx-auto flex h-14 w-14
        items-center
        justify-center
        rounded-2xl
        bg-white
        text-2xl
        shadow-sm
      ">
        {icon}
      </div>

      <h3 className="
        mt-4 text-sm
        font-bold text-slate-700
      ">
        {title}
      </h3>

      <p className="
        mx-auto mt-1
        max-w-sm text-xs
        text-slate-500
      ">
        {message}
      </p>
    </div>
  );
}