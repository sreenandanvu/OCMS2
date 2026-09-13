import express from "express";
import mongoose from "mongoose";
import { Examination, Result, Timetable } from "../models/index.js";

// Extend the existing Result model with the fields used by the
// semester-results workflow. This keeps the existing UI unchanged.
if (!Result.schema.path("exam")) {
  Result.schema.add({
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Examination",
      default: null,
    },
  });
}

if (!Result.schema.path("published")) {
  Result.schema.add({
    published: {
      type: Boolean,
      default: false,
    },
  });
}

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Delete Examination
|--------------------------------------------------------------------------
*/

router.delete("/exams/:id", async (req, res) => {
  try {
    const exam = await Examination.findByIdAndDelete(req.params.id);

    if (!exam) {
      return res.status(404).json({
        message: "Examination not found",
      });
    }

    // Remove marks belonging to the deleted examination as well.
    await Result.deleteMany({ exam: req.params.id });

    return res.json({
      message: "Examination deleted successfully",
    });
  } catch (error) {
    console.error("Delete examination error:", error);

    return res.status(400).json({
      message: error.message || "Unable to delete examination",
    });
  }
});

/*
|--------------------------------------------------------------------------
| Timetable Update
|--------------------------------------------------------------------------
*/

router.put("/timetable/:id", async (req, res) => {
  try {
    const row = await Timetable.findByIdAndUpdate(
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

    if (!row) {
      return res.status(404).json({
        message: "Timetable entry not found",
      });
    }

    return res.json(row);
  } catch (error) {
    console.error("Update timetable error:", error);

    return res.status(400).json({
      message: error.message || "Unable to update timetable entry",
    });
  }
});

/*
|--------------------------------------------------------------------------
| Timetable Delete
|--------------------------------------------------------------------------
*/

router.delete("/timetable/:id", async (req, res) => {
  try {
    const row = await Timetable.findByIdAndDelete(req.params.id);

    if (!row) {
      return res.status(404).json({
        message: "Timetable entry not found",
      });
    }

    return res.json({
      message: "Timetable entry deleted successfully",
    });
  } catch (error) {
    console.error("Delete timetable error:", error);

    return res.status(400).json({
      message: error.message || "Unable to delete timetable entry",
    });
  }
});

/*
|--------------------------------------------------------------------------
| Publish Semester Results
|--------------------------------------------------------------------------
*/

router.patch("/results/publish-semester", async (req, res) => {
  try {
    const { course, semester, exam } = req.body;

    if (!course || !semester || !exam) {
      return res.status(400).json({
        message: "Course, semester and examination are required.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(exam)) {
      return res.status(400).json({
        message: "Invalid examination ID.",
      });
    }

    const examination = await Examination.findById(exam).lean();

    if (!examination) {
      return res.status(404).json({
        message: "Examination not found.",
      });
    }

    const semesterNumber = Number(semester);

    const resultFilter = {
      exam,
      course: String(course),
      semester: semesterNumber,
    };

    const existingCount = await Result.countDocuments(resultFilter);

    if (!existingCount) {
      return res.status(404).json({
        message:
          "No results found for the selected course, semester and examination.",
      });
    }

    const update = await Result.updateMany(resultFilter, {
      $set: { published: true },
    });

    return res.json({
      message: "Semester results published successfully.",
      course,
      semester: semesterNumber,
      exam,
      count: update.modifiedCount ?? update.nModified ?? existingCount,
    });
  } catch (error) {
    console.error("Publish semester results error:", error);

    return res.status(500).json({
      message: "Unable to publish semester results.",
    });
  }
});

export default router;
