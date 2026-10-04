import React, { useState } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  GraduationCap,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import Shell from "./components/Shell";
import AdminPage from "./admin/AdminPage";
import FacultyPage from "./faculty/FacultyPage";
import StudentPage from "./student/StudentPage";

const users = {
  admin: {
    name: "OCMS Administrator",
    email: "admin@ocms.com",
    password: "admin123",
    role: "admin",
    label: "Administrator",
    description: "Manage the institution, people and academic operations.",
    accent: "violet",
  },
  faculty: {
    name: "Anjali Faculty",
    email: "anjali@ocms.com",
    password: "faculty123",
    role: "faculty",
    label: "Faculty",
    description: "Manage classes, attendance, assignments and student performance.",
    accent: "blue",
  },
  student: {
    name: "Akhil Raj",
    email: "akhil@ocms.com",
    password: "student123",
    role: "student",
    label: "Student",
    description: "Track your timetable, attendance, assignments and results.",
    accent: "emerald",
  },
};

const roleVisuals = {
  admin: { icon: ShieldCheck, title: "Administration", tone: "violet" },
  faculty: { icon: GraduationCap, title: "Faculty", tone: "blue" },
  student: { icon: UserRound, title: "Student", tone: "emerald" },
};

export default function App() {
  const [signed, setSigned] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("ocms_user") ||
        sessionStorage.getItem("ocms_user") ||
        "null"
      );
    } catch {
      return null;
    }
  });
  const [page, setPage] = useState("dashboard");

  function handleLogin(user, remember) {
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem("ocms_user", JSON.stringify(user));
    if (remember) sessionStorage.removeItem("ocms_user");
    else localStorage.removeItem("ocms_user");
    setSigned(user);
    setPage("dashboard");
  }

  function handleLogout() {
    localStorage.removeItem("ocms_user");
    sessionStorage.removeItem("ocms_user");
    localStorage.removeItem("ocms_token");
    setSigned(null);
    setPage("dashboard");
  }

  if (!signed) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Shell
      user={signed}
      page={page}
      onNavigate={setPage}
      onLogout={handleLogout}
    >
      {signed.role === "admin" ? (
        <AdminPage page={page} onNavigate={setPage} />
      ) : signed.role === "faculty" ? (
        <FacultyPage page={page} onNavigate={setPage} />
      ) : (
        <StudentPage page={page} onNavigate={setPage} />
      )}
    </Shell>
  );
}

function Login({ onLogin }) {
  const [selected, setSelected] = useState("student");
  const activeUser = users[selected];
  const visual = roleVisuals[selected];
  const ActiveIcon = visual.icon;
  const [email, setEmail] = useState(activeUser.email);
  const [password, setPassword] = useState(activeUser.password);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function selectRole(role) {
    setSelected(role);
    setEmail(users[role].email);
    setPassword(users[role].password);
    setError("");
  }

  async function submit(event) {
    event.preventDefault();
    setError("");

    const candidate = users[selected];
    if (email.trim().toLowerCase() !== candidate.email || password !== candidate.password) {
      setError("The email or password is incorrect. Please check your details and try again.");
      return;
    }

    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 350));
    onLogin(candidate, remember);
    setSubmitting(false);
  }

  const toneClasses = {
    violet: {
      panel: "from-violet-600 via-indigo-600 to-slate-950",
      soft: "bg-violet-50 text-violet-700",
      ring: "focus:ring-violet-500",
      button: "bg-violet-600 hover:bg-violet-700",
    },
    blue: {
      panel: "from-blue-600 via-cyan-600 to-slate-950",
      soft: "bg-blue-50 text-blue-700",
      ring: "focus:ring-blue-500",
      button: "bg-blue-600 hover:bg-blue-700",
    },
    emerald: {
      panel: "from-emerald-600 via-teal-600 to-slate-950",
      soft: "bg-emerald-50 text-emerald-700",
      ring: "focus:ring-emerald-500",
      button: "bg-emerald-600 hover:bg-emerald-700",
    },
  };

  const tone = toneClasses[visual.tone];

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-2.5rem)] max-w-6xl overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-2xl shadow-slate-200/60 lg:grid-cols-[1.05fr_0.95fr]">
        <section className={`relative hidden overflow-hidden bg-gradient-to-br p-10 text-white lg:flex lg:flex-col ${tone.panel}`}>
          <div className="absolute -right-28 -top-28 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />

          <div className="relative flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 shadow-lg backdrop-blur">
              <Sparkles size={21} />
            </div>
            <div>
              <p className="text-lg font-black tracking-tight">OCMS</p>
              <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-white/60">
                College Management
              </p>
            </div>
          </div>

          <div className="relative mt-auto max-w-xl pb-6 pt-20">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/60">
              One campus. One workspace.
            </p>
            <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight xl:text-5xl">
              Everything your college needs, in one place.
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-7 text-white/75">
              Coordinate academics, attendance, assessments and communication
              through a role-aware workspace built for everyday college operations.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                ["Academics", "Timetable, exams & results"],
                ["Operations", "Students, faculty & attendance"],
                ["Communication", "Notices and updates"],
              ].map(([title, text]) => (
                <div
                  key={title}
                  className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur"
                >
                  <p className="text-xs font-bold">{title}</p>
                  <p className="mt-1.5 text-[11px] leading-5 text-white/60">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex items-center justify-between border-t border-white/10 pt-5 text-[11px] text-white/45">
            <span>OCMS 2.0</span>
            <span>Academic Year 2026–27</span>
          </div>
        </section>

        <section className="flex flex-col justify-center p-6 sm:p-10 lg:p-12">
          <div className="mx-auto w-full max-w-md">
            <div className="lg:hidden">
              <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-3 py-2 text-sm font-black text-white">
                <Sparkles size={16} />
                OCMS
              </div>
            </div>

            <div className="mt-8 lg:mt-0">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                Secure sign in
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                Welcome back
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Select your workspace and continue to OCMS.
              </p>
            </div>

            <div className="mt-7 grid grid-cols-3 gap-2">
              {Object.entries(roleVisuals).map(([role, item]) => {
                const Icon = item.icon;
                const active = selected === role;
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => selectRole(role)}
                    className={`group rounded-2xl border px-3 py-3.5 text-left transition ${
                      active
                        ? "border-slate-900 bg-slate-900 text-white shadow-lg"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-xl ${
                      active ? "bg-white/10" : "bg-slate-100"
                    }`}>
                      <Icon size={16} />
                    </div>
                    <p className="text-xs font-bold">{item.title}</p>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${tone.soft}`}>
                <ActiveIcon size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Selected workspace</p>
                <p className="mt-0.5 text-sm font-bold text-slate-900">{activeUser.label}</p>
                <p className="mt-0.5 text-xs text-slate-500">{activeUser.description}</p>
              </div>
            </div>

            <form className="mt-6 space-y-5" onSubmit={submit}>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                  <input
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    className={`w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-10 pr-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 ${tone.ring} focus:border-slate-300 focus:ring-2`}
                    placeholder="name@college.edu"
                    type="email"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Password
                </label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                  <input
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    className={`w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-10 pr-12 text-sm text-slate-900 outline-none ${tone.ring} focus:border-slate-300 focus:ring-2`}
                    placeholder="Enter your password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-500">
                  <input
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() => setError("Password recovery is not enabled in the current demo environment.")}
                  className="text-xs font-bold text-slate-700 hover:text-slate-950"
                >
                  Forgot password?
                </button>
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-xs font-medium leading-5 text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-60 ${tone.button}`}
              >
                {submitting ? "Signing you in..." : `Continue as ${activeUser.label}`}
                {!submitting && <ArrowRight size={17} />}
              </button>
            </form>

            <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Local demo environment
              </p>
              <p className="mt-1.5 text-xs leading-5 text-slate-500">
                Demo accounts remain available for this development build. Production authentication can be connected later without changing the dashboard experience.
              </p>
            </div>

            <p className="mt-6 text-center text-[11px] text-slate-400">
              © 2026 OCMS • Online College Management System
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
