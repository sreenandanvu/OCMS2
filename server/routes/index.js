import express from "express";
import crypto from "crypto";

import {
  Student,
  Faculty,
  Attendance,
  TeachingAssignment,
  Assignment,
  Examination,
  Result,
  Timetable,
  Notice,
} from "../models/index.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Health
|--------------------------------------------------------------------------
*/

router.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "OCMS API",
    time: new Date().toISOString(),
  });
});

/*
|--------------------------------------------------------------------------
| Dashboard
|--------------------------------------------------------------------------
*/
router.get("/dashboard", async (req, res) => {
  try {
    const [
      students,
      faculty,
      attendance,
      exams,
      assignments,
    ] = await Promise.all([
      Student.countDocuments(),
      Faculty.countDocuments(),
      Attendance.countDocuments(),
      Examination.countDocuments(),
      Assignment.countDocuments(),
    ]);

    const courses = await TeachingAssignment.distinct("course");
    const subjects = await TeachingAssignment.distinct("subject");

    res.json({
      students,
      faculty,
      attendance,
      exams,
      assignments,
      courses: courses.filter(Boolean).length,
      subjects: subjects.filter(Boolean).length,
    });
  } catch (error) {
    console.error("Dashboard error:", error);

    res.status(500).json({
      message: "Failed to load dashboard data",
      error: error.message,
    });
  }
});

/*
|--------------------------------------------------------------------------
| Students
|--------------------------------------------------------------------------
*/

router.get("/students", async (req, res) => {
  try {
    const students = await Student.find()
      .sort({ createdAt: -1 })
      .lean();

    res.json(students);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

router.get("/students/:id", async (req, res) => {
  try {
    const student = await Student.findById(
      req.params.id
    );

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    res.json(student);
  } catch (error) {
    res.status(400).json({
      message: "Invalid student ID",
    });
  }
});

router.post("/students", async (req, res) => {
  try {
    const student = await Student.create({
      name: req.body.name,
      email: req.body.email,
      rollNo: req.body.rollNo,
      course: req.body.course || "MCA",
      semester:
        Number(req.body.semester) || 1,
      section: req.body.section || "A",
      phone: req.body.phone || "",
      status: req.body.status || "Active",
      subjects: req.body.subjects || [],
    });

    res.status(201).json(student);
  } catch (error) {
    res.status(400).json({
      message:
        error.code === 11000
          ? "Roll number already exists"
          : error.message,
    });
  }
});

router.put("/students/:id", async (req, res) => {
  try {
    const student =
      await Student.findByIdAndUpdate(
        req.params.id,
        {
          ...req.body,
          semester:
            req.body.semester !== undefined
              ? Number(req.body.semester)
              : undefined,
        },
        {
          new: true,
          runValidators: true,
        }
      );

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    res.json(student);
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
});

router.delete(
  "/students/:id",
  async (req, res) => {
    try {
      const student =
        await Student.findByIdAndDelete(
          req.params.id
        );

      if (!student) {
        return res.status(404).json({
          message: "Student not found",
        });
      }

      res.json({
        message: "Student deleted successfully",
      });
    } catch (error) {
      res.status(400).json({
        message: error.message,
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| Faculty
|--------------------------------------------------------------------------
*/

router.get("/faculty", async (req, res) => {
  try {
    const faculty = await Faculty.find()
      .sort({ createdAt: -1 })
      .lean();

    res.json(faculty);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

router.post("/faculty", async (req, res) => {
  try {
    const faculty = await Faculty.create({
      name: req.body.name,
      email: req.body.email,
      employeeId: req.body.employeeId,
      department:
        req.body.department ||
        "Computer Applications",
      designation:
        req.body.designation ||
        "Assistant Professor",
      phone: req.body.phone || "",
      subjects: req.body.subjects || [],
      classes: req.body.classes || [],
      status: "Active",
    });

    res.status(201).json(faculty);
  } catch (error) {
    res.status(400).json({
      message:
        error.code === 11000
          ? "Employee ID already exists"
          : error.message,
    });
  }
});

router.put("/faculty/:id", async (req, res) => {
  try {
    const faculty =
      await Faculty.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
          runValidators: true,
        }
      );

    if (!faculty) {
      return res.status(404).json({
        message: "Faculty not found",
      });
    }

    res.json(faculty);
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
});

router.delete(
  "/faculty/:id",
  async (req, res) => {
    try {
      const faculty =
        await Faculty.findByIdAndDelete(
          req.params.id
        );

      if (!faculty) {
        return res.status(404).json({
          message: "Faculty not found",
        });
      }

      res.json({
        message: "Faculty deleted successfully",
      });
    } catch (error) {
      res.status(400).json({
        message: error.message,
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| Teaching Assignments
|--------------------------------------------------------------------------
*/

router.get(
  "/academic/teaching-assignments",
  async (req, res) => {
    try {
      const rows =
        await TeachingAssignment.find()
          .sort({ createdAt: -1 })
          .lean();

      res.json(rows);
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }
);

router.post(
  "/academic/teaching-assignments",
  async (req, res) => {
    try {
      const row =
        await TeachingAssignment.create({
          faculty: req.body.faculty,
          subject: req.body.subject,
          course: req.body.course || "MCA",
          semester:
            Number(req.body.semester) || 1,
          section:
            req.body.section || "A",
        });

      res.status(201).json(row);
    } catch (error) {
      res.status(400).json({
        message: error.message,
      });
    }
  }
);

router.delete(
  "/academic/teaching-assignments/:id",
  async (req, res) => {
    try {
      const row =
        await TeachingAssignment.findByIdAndDelete(
          req.params.id
        );

      if (!row) {
        return res.status(404).json({
          message: "Teaching assignment not found",
        });
      }

      res.json({
        message:
          "Teaching assignment deleted",
      });
    } catch (error) {
      res.status(400).json({
        message: error.message,
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| Attendance
|--------------------------------------------------------------------------
*/

router.get("/attendance", async (req, res) => {
  try {
    const rows =
      await Attendance.find()
        .sort({
          date: -1,
          period: 1,
        })
        .lean();

    res.json(rows);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

router.post("/attendance", async (req, res) => {
  try {
    let student = null;

    if (req.body.student) {
      student = await Student.findById(
        req.body.student
      );
    }

    const row = await Attendance.create({
      student: student?._id || null,

      studentName:
        student?.name ||
        req.body.studentName ||
        req.body.student ||
        "",

      rollNo:
        student?.rollNo ||
        req.body.rollNo ||
        "",

      course:
        student?.course ||
        req.body.course ||
        "",

      semester:
        student?.semester ||
        Number(req.body.semester) ||
        1,

      section:
        student?.section ||
        req.body.section ||
        "A",

      date: req.body.date,

      subject: req.body.subject,

      faculty:
        req.body.faculty || "",

      markedBy:
        req.body.markedBy || null,

      period:
        Number(req.body.period) || 1,

      status:
        req.body.status || "Present",
    });

    res.status(201).json(row);
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
});

/*
|--------------------------------------------------------------------------
| QR Attendance Session
|--------------------------------------------------------------------------
*/

const sessions = new Map();

router.post(
  "/attendance/session",
  (req, res) => {
    const code =
      crypto.randomBytes(4).toString("hex");

    const expiresIn =
      Math.max(
        1,
        Number(
          req.body.expiresInMinutes
        ) || 15
      );

    const session = {
      code,
      subject: req.body.subject || "",
      course: req.body.course || "",
      semester:
        Number(req.body.semester) || 0,
      period:
        Number(req.body.period) || 1,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(
        Date.now() +
          expiresIn * 60 * 1000
      ).toISOString(),
    };

    sessions.set(code, session);

    setTimeout(() => {
      sessions.delete(code);
    }, expiresIn * 60 * 1000);

    res.status(201).json(session);
  }
);

/*
|--------------------------------------------------------------------------
| Assignments
|--------------------------------------------------------------------------
*/

router.get("/assignments", async (req, res) => {
  try {
    const rows =
      await Assignment.find()
        .sort({ createdAt: -1 })
        .lean();

    res.json(rows);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

router.post("/assignments", async (req, res) => {
  try {
    const row =
      await Assignment.create({
        title: req.body.title,
        description:
          req.body.description || "",
        subject: req.body.subject,
        faculty:
          req.body.faculty || "",
        course:
          req.body.course || "MCA",
        semester:
          Number(req.body.semester) || 1,
        dueDate:
          req.body.dueDate || "",
        resourceUrl:
          req.body.resourceUrl || "",
      });

    res.status(201).json(row);
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
});

router.put(
  "/assignments/:id",
  async (req, res) => {
    try {
      const row =
        await Assignment.findByIdAndUpdate(
          req.params.id,
          req.body,
          {
            new: true,
            runValidators: true,
          }
        );

      if (!row) {
        return res.status(404).json({
          message: "Assignment not found",
        });
      }

      res.json(row);
    } catch (error) {
      res.status(400).json({
        message: error.message,
      });
    }
  }
);

router.delete(
  "/assignments/:id",
  async (req, res) => {
    try {
      await Assignment.findByIdAndDelete(
        req.params.id
      );

      res.json({
        message: "Assignment deleted",
      });
    } catch (error) {
      res.status(400).json({
        message: error.message,
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| Examinations
|--------------------------------------------------------------------------
*/

router.get("/exams", async (req, res) => {
  try {
    const rows =
      await Examination.find()
        .sort({ date: 1 })
        .lean();

    res.json(rows);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

router.post("/exams", async (req, res) => {
  try {
    const row =
      await Examination.create({
        name: req.body.name,
        course:
          req.body.course || "MCA",
        semester:
          Number(req.body.semester) || 1,
        date:
          req.body.date || "",
        startTime:
          req.body.startTime || "",
        endTime:
          req.body.endTime || "",
        room:
          req.body.room || "",
        subjects:
          req.body.subjects || [],
        status:
          req.body.status || "Scheduled",
      });

    res.status(201).json(row);
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
});

router.put(
  "/exams/:id",
  async (req, res) => {
    try {
      const row =
        await Examination.findByIdAndUpdate(
          req.params.id,
          req.body,
          {
            new: true,
            runValidators: true,
          }
        );

      if (!row) {
        return res.status(404).json({
          message: "Examination not found",
        });
      }

      res.json(row);
    } catch (error) {
      res.status(400).json({
        message: error.message,
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| Results
|--------------------------------------------------------------------------
*/

router.get("/results", async (req, res) => {
  try {
    const rows =
      await Result.find()
        .populate(
          "student",
          "name rollNo email course semester"
        )
        .sort({ createdAt: -1 })
        .lean();

    res.json(rows);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

router.post("/results", async (req, res) => {
  try {
    const marks =
      Number(req.body.marks) || 0;

    const maxMarks =
      Math.max(
        1,
        Number(req.body.maxMarks) || 100
      );

    const percentage =
      marks / maxMarks;

    const grade =
      percentage >= 0.9
        ? "A+"
        : percentage >= 0.8
        ? "A"
        : percentage >= 0.7
        ? "B+"
        : percentage >= 0.6
        ? "B"
        : percentage >= 0.5
        ? "C"
        : percentage >= 0.4
        ? "D"
        : "F";

    const gradePoint =
      percentage >= 0.9
        ? 10
        : percentage >= 0.8
        ? 9
        : percentage >= 0.7
        ? 8
        : percentage >= 0.6
        ? 7
        : percentage >= 0.5
        ? 6
        : percentage >= 0.4
        ? 5
        : 0;

    const row = await Result.create({
      ...req.body,
      marks,
      maxMarks,
      grade,
      gradePoint,
    });

    res.status(201).json(row);
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
});

router.put(
  "/results/:id",
  async (req, res) => {
    try {
      const marks =
        Number(req.body.marks) || 0;

      const maxMarks =
        Math.max(
          1,
          Number(req.body.maxMarks) || 100
        );

      const percentage =
        marks / maxMarks;

      const grade =
        percentage >= 0.9
          ? "A+"
          : percentage >= 0.8
          ? "A"
          : percentage >= 0.7
          ? "B+"
          : percentage >= 0.6
          ? "B"
          : percentage >= 0.5
          ? "C"
          : percentage >= 0.4
          ? "D"
          : "F";

      const gradePoint =
        percentage >= 0.9
          ? 10
          : percentage >= 0.8
          ? 9
          : percentage >= 0.7
          ? 8
          : percentage >= 0.6
          ? 7
          : percentage >= 0.5
          ? 6
          : percentage >= 0.4
          ? 5
          : 0;

      const row =
        await Result.findByIdAndUpdate(
          req.params.id,
          {
            ...req.body,
            marks,
            maxMarks,
            grade,
            gradePoint,
          },
          {
            new: true,
            runValidators: true,
          }
        );

      if (!row) {
        return res.status(404).json({
          message: "Result not found",
        });
      }

      res.json(row);
    } catch (error) {
      res.status(400).json({
        message: error.message,
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| Timetable
|--------------------------------------------------------------------------
*/

router.get("/timetable", async (req, res) => {
  try {
    const rows =
      await Timetable.find()
        .sort({
          day: 1,
          period: 1,
        })
        .lean();

    res.json(rows);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

router.post(
  "/timetable",
  async (req, res) => {
    try {
      const row =
        await Timetable.create({
          day: req.body.day,
          period:
            Number(req.body.period) || 1,
          startTime:
            req.body.startTime || "",
          endTime:
            req.body.endTime || "",
          subject: req.body.subject,
          faculty:
            req.body.faculty || "",
          course:
            req.body.course || "MCA",
          semester:
            Number(req.body.semester) || 1,
          section:
            req.body.section || "A",
          room:
            req.body.room || "",
        });

      res.status(201).json(row);
    } catch (error) {
      res.status(400).json({
        message: error.message,
      });
    }
  }
);

router.delete(
  "/timetable/:id",
  async (req, res) => {
    try {
      await Timetable.findByIdAndDelete(
        req.params.id
      );

      res.json({
        message: "Timetable entry deleted",
      });
    } catch (error) {
      res.status(400).json({
        message: error.message,
      });
    }
  }
);


/*
|--------------------------------------------------------------------------
| Notices / Communications
|--------------------------------------------------------------------------
*/

router.get(
  "/communications",
  async (req, res) => {
    try {
      const rows =
        await Notice.find()
          .sort({ createdAt: -1 })
          .lean();

      res.json(rows);
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }
);

router.get("/notices", async (req, res) => {
  try {
    const rows =
      await Notice.find()
        .sort({ createdAt: -1 })
        .lean();

    res.json(rows);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

router.post(
  "/communications",
  async (req, res) => {
    try {
      const row = await Notice.create({
        title: req.body.title,
        message: req.body.message,
        audience:
          req.body.audience || "Everyone",
        author:
          req.body.author ||
          "Administrator",
        date:
          req.body.date ||
          new Date()
            .toISOString()
            .slice(0, 10),
      });

      res.status(201).json(row);
    } catch (error) {
      res.status(400).json({
        message: error.message,
      });
    }
  }
);

router.post("/notices", async (req, res) => {
  try {
    const row = await Notice.create({
      title: req.body.title,
      message: req.body.message,
      audience:
        req.body.audience || "Everyone",
      author:
        req.body.author ||
        "Administrator",
      date:
        req.body.date ||
        new Date()
          .toISOString()
          .slice(0, 10),
    });

    res.status(201).json(row);
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
});

/*
|--------------------------------------------------------------------------
| Reports
|--------------------------------------------------------------------------
*/

router.get(
  "/reports/attendance",
  async (req, res) => {
    try {
      const rows =
        await Attendance.aggregate([
          {
            $group: {
              _id: {
                student: "$student",
                studentName: "$studentName",
                course: "$course",
              },

              total: {
                $sum: 1,
              },

              present: {
                $sum: {
                  $cond: [
                    {
                      $in: [
                        "$status",
                        [
                          "Present",
                          "Late",
                        ],
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
            },
          },

          {
            $project: {
              _id: 0,
              student: "$_id.studentName",
              course: "$_id.course",
              total: 1,
              present: 1,
              percentage: {
                $cond: [
                  {
                    $gt: ["$total", 0],
                  },
                  {
                    $multiply: [
                      {
                        $divide: [
                          "$present",
                          "$total",
                        ],
                      },
                      100,
                    ],
                  },
                  0,
                ],
              },
            },
          },
        ]);

      res.json(rows);
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }
);

router.get(
  "/reports/performance",
  async (req, res) => {
    try {
      const rows =
        await Result.find()
          .populate(
            "student",
            "name rollNo"
          )
          .lean();

      res.json(
        rows.map((row) => ({
          ...row,
          student:
            row.student?.name ||
            row.studentName ||
            "Unknown",
        }))
      );
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }
);

router.get(
  "/reports/low-attendance",
  async (req, res) => {
    try {
      const rows =
        await Attendance.aggregate([
          {
            $group: {
              _id: {
                student: "$studentName",
                course: "$course",
              },

              total: {
                $sum: 1,
              },

              present: {
                $sum: {
                  $cond: [
                    {
                      $in: [
                        "$status",
                        [
                          "Present",
                          "Late",
                        ],
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
            },
          },

          {
            $project: {
              _id: 0,
              student: "$_id.student",
              course: "$_id.course",
              percentage: {
                $multiply: [
                  {
                    $divide: [
                      "$present",
                      "$total",
                    ],
                  },
                  100,
                ],
              },
            },
          },

          {
            $match: {
              percentage: {
                $lt: 75,
              },
            },
          },
        ]);

      res.json(rows);
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| Faculty / Student compatibility routes
|--------------------------------------------------------------------------
*/

router.get("/me/faculty", async (req, res) => {
  const faculty =
    await Faculty.findOne().lean();

  if (!faculty) {
    return res.status(404).json({
      message: "No faculty account found",
    });
  }

  res.json({
    ...faculty,
    user: faculty._id,
  });
});

router.get("/timetable/me", async (req, res) => {
  const rows =
    await Timetable.find().lean();

  res.json(rows);
});

/*
|--------------------------------------------------------------------------
| 404
|--------------------------------------------------------------------------
*/

router.use((req, res) => {
  res.status(404).json({
    message: "API route not found",
    path: req.originalUrl,
  });
});

router.get("/examinations", async (req, res) => {
  try {
    const exams = await Examination.find().sort({ date: 1 });
    res.json(exams);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch examinations",
      error: error.message,
    });
  }
});

router.get("/results", async (req, res) => {
  try {
    const results = await Result.find().sort({
      semester: 1,
      subject: 1,
    });

    res.json(results);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch results",
      error: error.message,
    });
  }
});

router.get("/dashboard", async (req, res) => {
  try {
    const [
      studentCount,
      facultyCount,
      assignmentCount,
      timetableCount,
    ] = await Promise.all([
      Student.countDocuments(),
      Faculty.countDocuments(),
      Assignment.countDocuments(),
      Timetable.countDocuments(),
    ]);

    const subjects = await TeachingAssignment.distinct("subject");

    res.json({
      students: studentCount,
      faculty: facultyCount,
      courses: timetableCount,
      subjects: subjects.length,
      assignments: assignmentCount,
    });
  } catch (error) {
    console.error("Dashboard error:", error);

    res.status(500).json({
      message: "Failed to load dashboard data",
      error: error.message,
    });
  }
});
// ============================================================
// TIMETABLE
// ============================================================

// GET ALL TIMETABLE ENTRIES
router.get("/timetable", async (req, res) => {
  try {
    const timetable = await Timetable.find().sort({
      day: 1,
      period: 1,
    });

    res.json(timetable);
  } catch (error) {
    console.error(
      "Get timetable error:",
      error
    );

    res.status(500).json({
      message: "Failed to load timetable",
      error: error.message,
    });
  }
});


// CREATE TIMETABLE ENTRY
router.post("/timetable", async (req, res) => {
  try {
    const {
      day,
      period,
      time,
      subject,
      faculty,
      course,
      semester,
      section,
      room,
    } = req.body;

    const timetable = await Timetable.create({
      day,
      period,
      time,
      subject,
      faculty,
      course,
      semester,
      section,
      room,
    });

    res.status(201).json({
      message:
        "Timetable class added successfully",
      timetable,
    });
  } catch (error) {
    console.error(
      "Create timetable error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to create timetable entry",
      error: error.message,
    });
  }
});


// UPDATE TIMETABLE ENTRY
router.put(
  "/timetable/:id",
  async (req, res) => {
    try {
      const {
        day,
        period,
        time,
        subject,
        faculty,
        course,
        semester,
        section,
        room,
      } = req.body;

      const timetable =
        await Timetable.findByIdAndUpdate(
          req.params.id,
          {
            day,
            period,
            time,
            subject,
            faculty,
            course,
            semester,
            section,
            room,
          },
          {
            new: true,
            runValidators: true,
          }
        );

      if (!timetable) {
        return res.status(404).json({
          message:
            "Timetable entry not found",
        });
      }

      res.json({
        message:
          "Timetable class updated successfully",
        timetable,
      });
    } catch (error) {
      console.error(
        "Update timetable error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to update timetable entry",
        error: error.message,
      });
    }
  }
);


// DELETE TIMETABLE ENTRY
router.delete(
  "/timetable/:id",
  async (req, res) => {
    try {
      console.log(
        "Deleting timetable:",
        req.params.id
      );

      const timetable =
        await Timetable.findByIdAndDelete(
          req.params.id
        );

      if (!timetable) {
        return res.status(404).json({
          message:
            "Timetable entry not found",
        });
      }

      console.log(
        "Deleted timetable:",
        timetable._id
      );

      res.json({
        message:
          "Timetable class deleted successfully",
        timetable,
      });
    } catch (error) {
      console.error(
        "Delete timetable error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to delete timetable entry",
        error: error.message,
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| FACULTY - MY STUDENTS
|--------------------------------------------------------------------------
*/

router.get(
  "/faculty/students",
  async (req, res) => {
    try {
      const { facultyEmail } =
        req.query;

      if (!facultyEmail) {
        return res.status(400).json({
          message:
            "Faculty email is required.",
        });
      }

      const faculty =
        await Faculty.findOne({
          email: facultyEmail,
        });

      if (!faculty) {
        return res.status(404).json({
          message:
            "Faculty account not found.",
        });
      }

      const facultyIdentifiers = [
        faculty.name,
        faculty.email,
        faculty.employeeId,
        faculty.employeeID,
        faculty.empId,
      ].filter(Boolean);

      const assignments =
        await TeachingAssignment.find({
          faculty: {
            $in: facultyIdentifiers,
          },
        });

      if (!assignments.length) {
        return res.json([]);
      }

      const classFilters =
        assignments.map(
          (assignment) => {
            const filter = {
              course:
                assignment.course,
              semester:
                assignment.semester,
            };

            if (assignment.section) {
              filter.section =
                assignment.section;
            }

            return filter;
          }
        );

      const students =
        await Student.find({
          $or: classFilters,
        }).sort({
          name: 1,
        });

      /*
       * Remove duplicate students in case
       * the faculty teaches multiple subjects
       * to the same student.
       */
      const uniqueStudents =
        Array.from(
          new Map(
            students.map((student) => [
              String(student._id),
              student,
            ])
          ).values()
        );

      return res.json(uniqueStudents);
    } catch (error) {
      console.error(
        "Faculty students error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to load faculty students.",
        error: error.message,
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| FACULTY - STUDENT ACADEMIC INFORMATION
|--------------------------------------------------------------------------
*/

router.get(
  "/faculty/students/:studentId/academic",
  async (req, res) => {
    try {
      const { studentId } =
        req.params;

      const student =
        await Student.findById(
          studentId
        );

      if (!student) {
        return res.status(404).json({
          message:
            "Student not found.",
        });
      }

      return res.json({
        academic: {
          course: student.course || "",
          semester:
            student.semester || "",
          section:
            student.section || "",
          rollNo:
            student.rollNo ||
            student.registerNo ||
            "",
          admissionYear:
            student.admissionYear || "",
          department:
            student.department || "",
          status:
            student.status || "Active",
        },
      });
    } catch (error) {
      console.error(
        "Student academic information error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to load academic information.",
        error: error.message,
      });
    }
  }
);

router.get("/teaching-assignments", async (req, res) => {
  try {
    const assignments = await TeachingAssignment.find().sort({
      createdAt: -1,
    });

    res.json(assignments);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch teaching assignments",
      error: error.message,
    });
  }
});

router.delete("/students/:id", async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    await Student.findByIdAndDelete(req.params.id);

    res.json({
      message: "Student deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Unable to delete student",
    });
  }
});

export default router;