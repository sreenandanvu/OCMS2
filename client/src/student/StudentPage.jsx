import React from "react";

import Dashboard from "./Dashboard";
import Profile from "./Profile";
import Attendance from "./Attendance";
import Assignments from "./Assignments";
import Exams from "./Exams";
import Timetable from "./Timetable";
import Notices from "./Notices";

export default function StudentPage({ page }) {
  switch (page) {
    case "dashboard":
      return <Dashboard />;

    case "profile":
      return <Profile />;

    case "attendance":
      return <Attendance />;

    case "assignments":
      return <Assignments />;

    case "exams":
      return <Exams />;

    case "timetable":
      return <Timetable />;

    case "notices":
      return <Notices />;

    default:
      return <Dashboard />;
  }
}