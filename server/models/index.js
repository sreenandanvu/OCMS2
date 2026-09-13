import mongoose from "mongoose";

const { Schema } = mongoose;

/*
|--------------------------------------------------------------------------
| Student
|--------------------------------------------------------------------------
*/

const studentSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    rollNo: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    course: {
      type: String,
      default: "MCA",
      trim: true,
    },

    semester: {
      type: Number,
      default: 1,
    },

    section: {
      type: String,
      default: "A",
    },

    phone: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      default: "Active",
    },

    subjects: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

/*
|--------------------------------------------------------------------------
| Faculty
|--------------------------------------------------------------------------
*/

const facultySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    employeeId: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    department: {
      type: String,
      default: "Computer Applications",
    },

    designation: {
      type: String,
      default: "Assistant Professor",
    },

    phone: {
      type: String,
      default: "",
    },

    subjects: {
      type: [String],
      default: [],
    },

    classes: {
      type: [String],
      default: [],
    },

    status: {
      type: String,
      default: "Active",
    },
  },
  {
    timestamps: true,
  }
);

/*
|--------------------------------------------------------------------------
| Attendance
|--------------------------------------------------------------------------
*/

const attendanceSchema = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "Student",
    },

    studentName: {
      type: String,
      default: "",
    },

    rollNo: {
      type: String,
      default: "",
    },

    course: {
      type: String,
      default: "",
    },

    semester: {
      type: Number,
      default: 1,
    },

    section: {
      type: String,
      default: "A",
    },

    date: {
      type: String,
      required: true,
    },

    subject: {
      type: String,
      required: true,
    },

    faculty: {
      type: String,
      default: "",
    },

    markedBy: {
      type: Schema.Types.ObjectId,
      ref: "Faculty",
      default: null,
    },

    period: {
      type: Number,
      default: 1,
    },

    status: {
      type: String,
      enum: [
        "Present",
        "Absent",
        "Late",
        "Excused",
      ],
      default: "Present",
    },
  },
  {
    timestamps: true,
  }
);

/*
|--------------------------------------------------------------------------
| Teaching Assignment
|--------------------------------------------------------------------------
*/

const teachingAssignmentSchema = new Schema(
  {
    faculty: {
      type: String,
      required: true,
    },

    subject: {
      type: String,
      required: true,
    },

    course: {
      type: String,
      default: "MCA",
    },

    semester: {
      type: Number,
      default: 1,
    },

    section: {
      type: String,
      default: "A",
    },
  },
  {
    timestamps: true,
  }
);

/*
|--------------------------------------------------------------------------
| Assignment
|--------------------------------------------------------------------------
*/

const assignmentSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      default: "",
    },

    subject: {
      type: String,
      required: true,
    },

    faculty: {
      type: String,
      default: "",
    },

    course: {
      type: String,
      default: "MCA",
    },

    semester: {
      type: Number,
      default: 1,
    },

    dueDate: {
      type: String,
      default: "",
    },

    resourceUrl: {
      type: String,
      default: "",
    },

    submissions: {
      type: Array,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

/*
|--------------------------------------------------------------------------
| Examination
|--------------------------------------------------------------------------
*/

const examinationSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },

    course: {
      type: String,
      default: "MCA",
    },

    semester: {
      type: Number,
      default: 1,
    },

    date: {
      type: String,
      default: "",
    },

    startTime: {
      type: String,
      default: "",
    },

    endTime: {
      type: String,
      default: "",
    },

    room: {
      type: String,
      default: "",
    },

    subjects: {
      type: [String],
      default: [],
    },

    published: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      default: "Scheduled",
    },
  },
  {
    timestamps: true,
  }
);

/*
|--------------------------------------------------------------------------
| Result
|--------------------------------------------------------------------------
*/

const resultSchema = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      default: null,
    },

    studentName: {
      type: String,
      default: "",
    },

    subject: {
      type: String,
      required: true,
    },

    course: {
      type: String,
      default: "MCA",
    },

    semester: {
      type: Number,
      default: 1,
    },

    internal: {
      type: Number,
      default: 0,
    },

    marks: {
      type: Number,
      default: 0,
    },

    maxMarks: {
      type: Number,
      default: 100,
    },

    grade: {
      type: String,
      default: "",
    },

    gradePoint: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

/*
|--------------------------------------------------------------------------
| Timetable
|--------------------------------------------------------------------------
*/

const timetableSchema = new Schema(
  {
    day: {
      type: String,
      required: true,
      trim: true,
    },

    period: {
      type: String,
      required: true,
      trim: true,
    },

    time: {
      type: String,
      default: "",
      trim: true,
    },

    subject: {
      type: String,
      required: true,
      trim: true,
    },

    faculty: {
      type: String,
      required: true,
      trim: true,
    },

    course: {
      type: String,
      default: "MCA",
      trim: true,
    },

    semester: {
      type: Number,
      default: 1,
    },

    section: {
      type: String,
      default: "A",
      trim: true,
    },

    room: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

/*
|--------------------------------------------------------------------------
| Notice
|--------------------------------------------------------------------------
*/

const noticeSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    audience: {
      type: String,
      default: "Everyone",
    },

    author: {
      type: String,
      default: "Administrator",
    },

    date: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

/*
|--------------------------------------------------------------------------
| Export Models
|--------------------------------------------------------------------------
*/

export const Student =
  mongoose.models.Student ||
  mongoose.model(
    "Student",
    studentSchema
  );

export const Faculty =
  mongoose.models.Faculty ||
  mongoose.model(
    "Faculty",
    facultySchema
  );

export const Attendance =
  mongoose.models.Attendance ||
  mongoose.model(
    "Attendance",
    attendanceSchema
  );

export const TeachingAssignment =
  mongoose.models.TeachingAssignment ||
  mongoose.model(
    "TeachingAssignment",
    teachingAssignmentSchema
  );

export const Assignment =
  mongoose.models.Assignment ||
  mongoose.model(
    "Assignment",
    assignmentSchema
  );

export const Examination =
  mongoose.models.Examination ||
  mongoose.model(
    "Examination",
    examinationSchema
  );

export const Result =
  mongoose.models.Result ||
  mongoose.model(
    "Result",
    resultSchema
  );

export const Timetable =
  mongoose.models.Timetable ||
  mongoose.model(
    "Timetable",
    timetableSchema
  );

export const Notice =
  mongoose.models.Notice ||
  mongoose.model(
    "Notice",
    noticeSchema
  );