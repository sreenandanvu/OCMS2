import React from "react";

import AdminDashboard from "./AdminDashboard";
import Students from "./Students";
import Faculty from "./Faculty";
import Attendance from "./Attendance";
import Examinations from "./Examinations";
import Assignments from "./Assignments";
import Timetable from "./Timetable";
import Notices from "./Notices";
import Reports from "./Reports";

export default function AdminPage({ page, onNavigate }) {
  switch (page) {
    case "dashboard":
      return <AdminDashboard onNavigate={onNavigate} />;

    case "students":
      return <Students />;

    case "faculty":
      return <Faculty />;

    case "attendance":
      return <Attendance />;

    case "exams":
      return <Examinations />;

    case "assignments":
      return <Assignments />;

    case "timetable":
      return <Timetable />;

    case "notices":
      return <Notices />;

    case "reports":
      return <Reports />;

    default:
      return <AdminDashboard onNavigate={onNavigate} />;
  }
}