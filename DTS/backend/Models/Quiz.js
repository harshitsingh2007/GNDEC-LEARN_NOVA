import mongoose from "mongoose";

const { Schema } = mongoose;

//
// ─── QUESTION SUBSCHEMA ─────────────────────────────────────────────
//
const questionSchema = new Schema({
  questionText: {
    type: String,
    required: true,
    trim: true,
  },
  questionType: {
    type: String,
    enum: ["single", "multiple", "text"],
    default: "single", // MCQ by default
  },
  options: [
    {
      text: { type: String, required: true },
      isCorrect: { type: Boolean, default: false },
    },
  ],
  correctAnswers: [
    {
      type: String, // used for text-based questions or multi-choice
    },
  ],
  explanation: {
    type: String,
    default: "",
  },
  marks: {
    type: Number,
    default: 1,
  },
  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard"],
    default: "medium",
  },
});

//
// ─── QUIZ SCHEMA ───────────────────────────────────────────────────
//
const quizSchema = new Schema(
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
    category: {
      type: String,
      default: "General",
    },
    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner",
    },

    // ─── Course Association ────────────────────────
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      // required: true,
    },

    module: {
      type: String,
      default: "",
    },

    // ─── Questions ─────────────────────────────────
    questions: [questionSchema],

    // ─── Scoring & Time ────────────────────────────
    totalMarks: {
      type: Number,
      default: 0,
    },
    timeLimit: {
      type: Number, // in minutes
      default: 30,
    },
    passingPercentage: {
      type: Number,
      default: 50,
    },
    attemptsAllowed: {
      type: Number,
      default: 3,
    },

    // ─── Ownership ────────────────────────────────
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ─── Attempts ─────────────────────────────────
    attempts: [
      {
        studentId: { type: Schema.Types.ObjectId, ref: "User" },
        score: { type: Number, default: 0 },
        percentage: { type: Number, default: 0 },
        correctCount: { type: Number, default: 0 },
        totalQuestions: { type: Number, default: 0 },
        accuracy: { type: Number, default: 0 },
        passed: { type: Boolean, default: false },
        submittedAt: { type: Date, default: Date.now },
      },
    ],

    averageScore: { type: Number, default: 0 },
    totalAttempts: { type: Number, default: 0 },

    // ─── Visibility ───────────────────────────────
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
quizSchema.pre("save", function (next) {
  this.totalMarks = this.questions.reduce((sum, q) => sum + (q.marks || 0), 0);
  next();
});

//
// ─── METHODS ─────────────────────────────────────────────────────
//
// Record a quiz attempt
quizSchema.methods.recordAttempt = function (studentId, score, correctCount) {
  const percentage = (score / this.totalMarks) * 100;
  const passed = percentage >= this.passingPercentage;

  this.totalAttempts += 1;
  this.attempts.push({
    studentId,
    score,
    correctCount,
    totalQuestions: this.questions.length,
    percentage,
    accuracy: (correctCount / this.questions.length) * 100,
    passed,
    submittedAt: new Date(),
  });

  // Recalculate average score
  this.averageScore =
    this.attempts.reduce((acc, a) => acc + a.score, 0) / this.attempts.length;
};

//
// ─── EXPORT ───────────────────────────────────────────────────────
const Quiz = mongoose.model("Quiz", quizSchema);
export default Quiz;
