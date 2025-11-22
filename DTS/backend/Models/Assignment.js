import mongoose from "mongoose";

const { Schema } = mongoose;

//
// ─── QUESTION SUBSCHEMA ─────────────────────────────────────────────
//
const assignmentQuestionSchema = new Schema({
  questionText: {
    type: String,
    required: true,
    trim: true,
  },
  questionType: {
    type: String,
    enum: ["text", "code", "file", "multiple_choice"],
    default: "text",
  },
  marks: {
    type: Number,
    default: 1,
    min: 0,
  },
  required: {
    type: Boolean,
    default: true,
  },
  order: {
    type: Number,
    default: 0,
  },
});

//
// ─── SUBMISSION SUBSCHEMA ─────────────────────────────────────────────
//
const submissionSchema = new Schema({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  answers: [
    {
      questionId: { type: Schema.Types.ObjectId },
      answer: { type: Schema.Types.Mixed }, // Can be text, code, or file URL
      submittedAt: { type: Date, default: Date.now },
    },
  ],
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ["submitted", "graded", "returned"],
    default: "submitted",
  },
  grade: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalMarks: {
    type: Number,
    default: 0,
  },
  feedback: {
    type: String,
    default: "",
  },
  gradedBy: {
    type: Schema.Types.ObjectId,
    ref: "Admin",
  },
  gradedAt: {
    type: Date,
  },
});

//
// ─── ASSIGNMENT SCHEMA ───────────────────────────────────────────────────
//
const assignmentSchema = new Schema(
  {
    // ─── Basic Info ────────────────────────────────
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    module: {
      type: String,
      default: "",
    },
    videoUrl: {
      type: String,
      default: "",
    },

    // ─── Questions ─────────────────────────────────
    questions: [assignmentQuestionSchema],

    // ─── Due Date & Time ────────────────────────────
    dueDate: {
      type: Date,
      required: true,
    },
    allowLateSubmission: {
      type: Boolean,
      default: false,
    },
    latePenalty: {
      type: Number,
      default: 0, // Percentage penalty for late submission
      min: 0,
      max: 100,
    },

    // ─── Scoring ────────────────────────────
    totalMarks: {
      type: Number,
      default: 0,
    },

    // ─── Ownership ────────────────────────────────
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },

    // ─── Submissions ─────────────────────────────────
    submissions: [submissionSchema],

    // ─── Status ────────────────────────────────
    published: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

//
// ─── PRE SAVE HOOK ────────────────────────────────────────────────
// Calculates total marks before saving
//
assignmentSchema.pre("save", function (next) {
  this.totalMarks = this.questions.reduce((sum, q) => sum + (q.marks || 0), 0);
  next();
});

//
// ─── METHODS ─────────────────────────────────────────────────────
//
// Add a submission
assignmentSchema.methods.addSubmission = function (studentId, answers) {
  const submission = {
    studentId,
    answers,
    submittedAt: new Date(),
    status: "submitted",
    totalMarks: this.totalMarks,
  };

  // Check if student already submitted
  const existingIndex = this.submissions.findIndex(
    (s) => s.studentId.toString() === studentId.toString()
  );

  if (existingIndex >= 0) {
    // Update existing submission
    this.submissions[existingIndex] = submission;
  } else {
    // Add new submission
    this.submissions.push(submission);
  }
};

// Grade a submission
assignmentSchema.methods.gradeSubmission = function (studentId, grade, feedback, gradedBy) {
  const submission = this.submissions.find(
    (s) => s.studentId.toString() === studentId.toString()
  );

  if (submission) {
    submission.grade = grade;
    submission.feedback = feedback || "";
    submission.gradedBy = gradedBy;
    submission.gradedAt = new Date();
    submission.status = "graded";
  }
};

//
// ─── EXPORT ───────────────────────────────────────────────────────
const Assignment = mongoose.model("Assignment", assignmentSchema);
export default Assignment;

