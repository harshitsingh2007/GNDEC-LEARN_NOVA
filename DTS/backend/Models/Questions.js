import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    // Question text or paragraph
    question: {
      type: String,
      required: true,
      trim: true,
    },

    // "mcq" or "paragraph"
    questionType: {
      type: String,
      enum: ["mcq", "paragraph"],
      required: true,
      default: "mcq",
    },

    // Optional for MCQ-type questions
    options: {
      type: [String], // ["Option A", "Option B", ...]
      validate: {
        validator: function (val) {
          return this.questionType === "mcq" ? val.length === 4 : true;
        },
        message: "MCQ questions must have exactly 4 options.",
      },
      default: [],
    },

    // For MCQ — stores correct option
    correctAnswer: {
      type: String,
      default: null,
    },

    // For paragraph — stores reference or key points (for AI/manual grading)
    answerGuidelines: {
      type: String,
      default: "",
      trim: true,
    },

    // Optional explanation (for post-battle display)
    explanation: {
      type: String,
      default: "",
    },

    // Category (e.g., “Programming”, “Math”, “History”)
    category: {
      type: String,
      default: "General",
    },

    // Difficulty level
    difficulty: {
      type: String,
      // enum: ["easy", "medium", "hard"],
      default: "medium",
    },

    // Keywords for filtering or random mixes
    tags: {
      type: [String],
      default: [],
    },

    // Per-question time limit (optional)
    timeLimit: {
      type: Number, // seconds
      default: 60,
    },

    // Author (for teacher/admin upload)
    createdBy: {
      type: String,
      default: "system",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Question", questionSchema);
