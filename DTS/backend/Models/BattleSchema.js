import mongoose from "mongoose";

const battleSchema = new mongoose.Schema(
  {
    battleCode: { type: String, unique: true },
    battleName: { type: String, required: true },
    tags: [String],

    duration: Number,
    startTime: Date,
    endTime: Date,

    questions: [Object],

    // ✔ Only lightweight user entries stored here
    players: [
      {
        userId: String,
        username: String,
        score: Number,
        accuracy: Number,
        rank: Number, // <-- ONLY rank stored
      },
    ],

    status: {
      type: String,
      enum: ["waiting", "in-progress", "finished", "expired"],
      default: "waiting",
    },

    winner: String,
  },
  { timestamps: true }
);

export default mongoose.model("Battle", battleSchema);



// export default mongoose.model("Battle", battleSchema);
