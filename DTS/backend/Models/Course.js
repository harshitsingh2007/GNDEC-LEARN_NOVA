import mongoose from "mongoose";

const { Schema } = mongoose;

const lessonSchema = new Schema({
  title: { type: String, required: true },
  videoUrl: { type: String, required: true },
  content: { type: String },
  duration: { type: Number, default: 0 }, // minutes
  order: { type: Number, default: 0 },
});

const moduleSchema = new Schema({
  title: { type: String, },
  description: String,
  lessons: [lessonSchema],
  order: { type: Number, default: 0 },
});

const courseSchema = new Schema(
  {
    // ─── Basic Info ─────────────────────────────
    title: {
      type: String,
      // required: true,
      trim: true,
    },
    description: {
      type: String,
      // required: true,
    },
    category: {
      type: String,
      default: "Other",
    },
    thumbnail: {
      type: String,
      default: "",
    },
    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner",
    },
    duration: {
      type: Number, // total duration (hours)
      default: 0,
    },
    price: {
      type: Number,
      default: 0,
      min: 0,
    },
    link: {
      type: String,
      default: "",
    },
    instructorName: {
      type: String,
      default: "",
    },
    language: {
      type: String,
      default: "English",
    },
    requirements: {
      type: [String],
      default: [],
    },
    whatYouWillLearn: {
      type: [String],
      default: [],
    },

    // ─── Instructor ─────────────────────────────
    instructor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      // required: true,
    },

    // ─── Course Structure ───────────────────────
    modules: [moduleSchema],

    // ─── Enrolled Students ──────────────────────
    enrolledStudents: [
      {
        studentId: { type: Schema.Types.ObjectId, ref: "User" },
        progress: { type: Number, default: 0 },
        completedLessons: [
          {
            lessonId: { type: Schema.Types.ObjectId }, // Track which lesson was completed
            completedAt: { type: Date, default: Date.now },
          },
        ],
        completed: { type: Boolean, default: false },
        startedAt: { type: Date, default: Date.now },
        lastAccessed: { type: Date, default: Date.now },
      },
    ],

    // ─── Quizzes / Assignments ──────────────────
    quizzes: [
      {
        quizId: { type: Schema.Types.ObjectId, ref: "Quiz" },
        title: String,
        totalMarks: Number,
      },
    ],
    assignments: [
      {
        assignmentId: { type: Schema.Types.ObjectId, ref: "Assignment" },
        title: String,
        dueDate: Date,
      },
    ],

    // ─── Analytics ──────────────────────────────
    performance: {
      avgScore: { type: Number, default: 0 },
      completionRate: { type: Number, default: 0 },
      activeStudents: { type: Number, default: 0 },
    },

    // ─── Ratings & Feedback ─────────────────────
    ratings: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User" },
        rating: { type: Number, min: 1, max: 5 },
        review: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],

    averageRating: { type: Number, default: 0 },

    // ─── Extra Metadata ─────────────────────────
    tags: [String],
    aiSummary: { type: String, default: "" },
    recommendedCourses: [{ type: Schema.Types.ObjectId, ref: "Course" }],

    // ─── Status ─────────────────────────────────
    published: { type: Boolean, default: false },
  },
  { timestamps: true }
);

//
// ─── METHODS ───────────────────────────────────────────────
//

// Calculate average rating dynamically
courseSchema.methods.calculateAverageRating = function () {
  if (this.ratings.length === 0) {
    this.averageRating = 0;
  } else {
    const total = this.ratings.reduce((sum, r) => sum + r.rating, 0);
    this.averageRating = total / this.ratings.length;
  }
};

// Update performance stats
courseSchema.methods.updatePerformance = function () {
  const total = this.enrolledStudents.length || 1;
  const completed = this.enrolledStudents.filter((s) => s.completed).length;
  this.performance.completionRate = (completed / total) * 100;
};

// Mark a lesson as completed for a student
courseSchema.methods.markLessonCompleted = function (studentId, lessonId) {
  const student = this.enrolledStudents.find(
    (s) => s.studentId.toString() === studentId.toString()
  );
  if (!student) return;

  const alreadyDone = student.completedLessons.some(
    (l) => l.lessonId.toString() === lessonId.toString()
  );
  if (!alreadyDone) {
    student.completedLessons.push({ lessonId });
  }

  const totalLessons = this.modules.reduce(
    (count, mod) => count + mod.lessons.length,
    0
  );

  student.progress =
    (student.completedLessons.length / totalLessons) * 100;

  if (student.progress >= 100) {
    student.completed = true;
  }
};

//
// ─── EXPORT MODEL ──────────────────────────────────────────
//
const Course = mongoose.model("Course", courseSchema);
export default Course;
