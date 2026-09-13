import React from "react";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  ClipboardCheck,
  BookOpen,
  CalendarDays,
  FileText,
  BarChart3,
  LogOut,
  UserRound,
  ClipboardList,
  Clock3,
  MessageSquare,
  IdCard,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| Navigation
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| Role information
|--------------------------------------------------------------------------
*/

const ROLE_INFO = {
  admin: {
    label: "Administrator",
    icon: "🛡️",
  },

  faculty: {
    label: "Faculty",
    icon: "👨‍🏫",
  },

  student: {
    label: "Student",
    icon: "🎓",
  },
};

/*
|--------------------------------------------------------------------------
| Shell
|--------------------------------------------------------------------------
*/

export default function Shell({
  user,
  page,
  onNavigate,
  onLogout,
  children,
}) {
  const navigation = NAVIGATION[user?.role] || [];

  const role = ROLE_INFO[user?.role] || {
    label: "User",
    icon: "👤",
  };

  const currentPage =
    navigation.find(([key]) => key === page)?.[1] || "Dashboard";

  function handleLogout() {
    if (typeof onLogout === "function") {
      onLogout();
      return;
    }

    localStorage.removeItem("ocms_user");
    localStorage.removeItem("ocms_token");

    window.location.reload();
  }

  return (
    <div className="app-shell">

      {/* ================================================================
          SIDEBAR
          ================================================================ */}

      <aside className="sidebar">

        {/* Logo */}

        <div className="logo">
          <span>O</span>CMS
        </div>

        {/* User profile */}

        <div className="profile">

          <div className="profile-avatar">
            {role.icon}
          </div>

          <div className="profile-info">
            <b>{user?.name || role.label}</b>
            <small>{user?.email || ""}</small>
          </div>

        </div>

        {/* Workspace label */}

        <div className="workspace">
          {user?.role?.toUpperCase()} / WORKSPACE
        </div>

        {/* Navigation */}

        <nav className="sidebar-nav">

          {navigation.map(([key, label, Icon]) => (
            <button
              key={key}
              type="button"
              className={
                page === key
                  ? "nav-item active"
                  : "nav-item"
              }
              onClick={() => onNavigate(key)}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}

        </nav>

        {/* Bottom section */}

        <div className="sidebar-bottom">

          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
          >
            <LogOut size={18} />
            <span>Sign out</span>
          </button>

        </div>

      </aside>

      {/* ================================================================
          MAIN AREA
          ================================================================ */}

      <main className="main">

        {/* Header */}

        <header className="top-header">

          <div className="header-title">

            <div className="breadcrumb">
              OCMS
              <span>/</span>
              {role.label.toUpperCase()}
            </div>

            <h1>{currentPage}</h1>

          </div>

          <div className="header-user">

            <div className="role-pill">
              {role.label}
            </div>

            <div className="header-avatar">
              {role.icon}
            </div>

            <div className="header-user-info">
              <strong>{user?.name || role.label}</strong>
              <small>{user?.email || ""}</small>
            </div>

          </div>

        </header>

        {/* Page content */}

        <section className="content">
          {children}
        </section>

      </main>

    </div>
  );
}