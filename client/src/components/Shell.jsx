import React from "react";
import "./shell-fix.css";
import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";

const NAVIGATION = {
  admin: [
    ["dashboard", "Dashboard", LayoutDashboard],
    ["students", "Students", Users],
    ["faculty", "Faculty", GraduationCap],
    ["attendance", "Attendance", ClipboardCheck],
    ["exams", "Examinations", FileText],
    ["assignments", "Assignments", ClipboardList],
    ["timetable", "Timetable", CalendarDays],
    ["notices", "Notices", MessageSquare],
    ["reports", "Reports", BarChart3],
  ],
  faculty: [
    ["dashboard", "My Dashboard", LayoutDashboard],
    ["students", "My Students", Users],
    ["attendance", "Attendance", ClipboardCheck],
    ["assignments", "Assignments", ClipboardList],
    ["results", "Marks & Results", FileText],
    ["notices", "Notices", MessageSquare],
    ["performance", "Performance", BarChart3],
  ],
  student: [
    ["dashboard", "My Dashboard", LayoutDashboard],
    ["profile", "My Profile", UserRound],
    ["attendance", "My Attendance", ClipboardCheck],
    ["assignments", "Assignments", ClipboardList],
    ["exams", "Exams & Results", FileText],
    ["timetable", "My Timetable", CalendarDays],
    ["notices", "Notices", MessageSquare],
  ],
};

const SECTION_LABELS = {
  admin: {
    dashboard: "Overview",
    students: "People",
    faculty: "People",
    attendance: "Academics",
    exams: "Academics",
    assignments: "Academics",
    timetable: "Academics",
    notices: "Communication",
    reports: "Insights",
  },
  faculty: {
    dashboard: "Overview",
    students: "Teaching",
    attendance: "Teaching",
    assignments: "Teaching",
    results: "Teaching",
    performance: "Insights",
    notices: "Communication",
  },
  student: {
    dashboard: "Overview",
    profile: "Personal",
    attendance: "Academics",
    assignments: "Academics",
    exams: "Academics",
    timetable: "Academics",
    notices: "Communication",
  },
};

const ROLE_INFO = {
  admin: { label: "Administrator", icon: ShieldCheck, accent: "violet" },
  faculty: { label: "Faculty", icon: GraduationCap, accent: "blue" },
  student: { label: "Student", icon: UserRound, accent: "emerald" },
};

export default function Shell({ user, page, onNavigate, onLogout, children }) {
  const navigation = NAVIGATION[user?.role] || [];
  const role = ROLE_INFO[user?.role] || { label: "User", icon: UserRound, accent: "violet" };
  const RoleIcon = role.icon;
  const currentPage = navigation.find(([key]) => key === page)?.[1] || "Dashboard";
  const initials = String(user?.name || role.label)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  function handleLogout() {
    if (typeof onLogout === "function") {
      onLogout();
      return;
    }
    localStorage.removeItem("ocms_user");
    sessionStorage.removeItem("ocms_user");
    localStorage.removeItem("ocms_token");
    window.location.reload();
  }

  let lastSection = "";
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="shell-brand">
          <div className="shell-brand-mark">O</div>
          <div>
            <div className="shell-brand-name">OCMS</div>
            <div className="shell-brand-subtitle">College Management</div>
          </div>
        </div>

        <div className="shell-profile">
          <div className={`shell-avatar shell-avatar-${role.accent}`}>{initials || <RoleIcon size={18} />}</div>
          <div className="shell-profile-copy">
            <strong>{user?.name || role.label}</strong>
            <span>{role.label}</span>
          </div>
          <CheckCircle2 size={16} className="shell-profile-status" />
        </div>

        <div className="workspace">
          {user?.role === "admin" ? "ADMINISTRATION" : user?.role === "faculty" ? "FACULTY WORKSPACE" : "STUDENT WORKSPACE"}
        </div>

        <nav className="sidebar-nav">
          {navigation.map(([key, label, Icon]) => {
            const section = SECTION_LABELS[user?.role]?.[key] || "";
            const showSection = section && section !== lastSection;
            lastSection = section;
            return (
              <React.Fragment key={key}>
                {showSection && <div className="nav-section-label">{section}</div>}
                <button
                  type="button"
                  className={page === key ? "nav-item active" : "nav-item"}
                  onClick={() => onNavigate(key)}
                >
                  <Icon size={17} strokeWidth={page === key ? 2.3 : 2} />
                  <span>{label}</span>
                </button>
              </React.Fragment>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-footer-note">
            <Activity size={14} />
            <span>OCMS 2.0</span>
          </div>
          <button type="button" className="logout-button" onClick={handleLogout}>
            <LogOut size={17} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="top-header">
          <div className="header-title">
            <div className="breadcrumb">
              OCMS <span>/</span> {role.label}
            </div>
            <h1>{currentPage}</h1>
          </div>

          <div className="header-actions">
            <button
              type="button"
              className="header-icon-button"
              title="Open notices"
              onClick={() => onNavigate?.("notices")}
            >
              <Bell size={18} />
            </button>
            <div className="header-divider" />
            <div className={`header-avatar header-avatar-${role.accent}`}>{initials || <RoleIcon size={18} />}</div>
            <div className="header-user-info">
              <strong>{user?.name || role.label}</strong>
              <small>{user?.email || ""}</small>
            </div>
          </div>
        </header>

        <section className="content">{children}</section>
      </main>
    </div>
  );
}
