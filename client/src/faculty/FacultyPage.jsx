import React from "react";

import Dashboard from "./Dashboard";
import Students from "./Students";
import Attendance from "./Attendance";
import Assignments from "./Assignments";
import Results from "./Results";
import Notices from "./Notices";
import Performance from "./Performance";

export default function FacultyPage({ page }) {
  switch (page) {
    case "dashboard":
      return <Dashboard />;

    case "students":
      return <Students />;

    case "attendance":
      return <Attendance />;

    case "assignments":
      return <Assignments />;

    case "results":
      return <Results />;

    case "notices":
      return <Notices />;

    case "performance":
      return <Performance />;

    default:
      return <Dashboard />;
  }
}