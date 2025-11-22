import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    // ─── Identity ───────────────────────────────
    username: { type: String, required: true, unique: true, trim: true },
    name:String,
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ["student", "admin"], default: "student" },
    avatarUrl: { type: String, default: "" },
    verified: { type: Boolean, default: false },

    // ─── Learning Progress ───────────────────────
    xp: { type: Number, default: 0 },
    weeklyXP: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    streakDays: { type: Number, default: 0 },
    personalBestStreak: { type: Number, default: 0 },
    totalStudyTime: { type: Number, default: 0 },
    masteryScore: { type: Number, default: 0 },
    focusScore: { type: Number, default: 0 },
    accuracyScore: { type: Number, default: 0 },

    // ─── Charts / History ────────────────────────
    last7DaysStudy: [{ day: String, hours: Number }],
    xpHistory: [{ 
      date: { type: Date, default: Date.now },
      reason: String,
      amount: Number 
    }],

    // ─── Calendar & Tasks ────────────────────────
    calendarData: [
      {
        taskId: String,
        title: String,
        description: String,
        date: { type: Date, default: Date.now },
        status: {
          type: String,
          enum: ["pending", "completed"],
          default: "pending",
        },
        type: { type: String, default: "task" },
        category: { type: String, default: "General" },
        priority: {
          type: String,
          enum: ["low", "medium", "high"],
          default: "medium",
        },
      },
    ],
    upcomingTasks: [
      { title: String, dueDate: Date, course: String, type: String },
    ],
    completedTasks: [{ taskId: String, completedAt: Date }],

    // ─── Courses & Progress ──────────────────────
    enrolledCourses: [
      {
        courseId: { type: Schema.Types.ObjectId, ref: "Course" },
        title: String,
        progress: { type: Number, default: 0 },
        completed: { type: Boolean, default: false },
        lastAccessed: { type: Date, default: Date.now },
      },
    ],
    quizAttempts: [
      {
        quizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz" },
        resultData: { type: Object, required: true },
        attemptDate: { type: Date, default: Date.now },
      },
    ],
    assignments: [
      {
        assignmentId: { type: Schema.Types.ObjectId, ref: "Assignment" },
        submittedAt: Date,
        grade: Number,
        feedback: String,
      },
    ],

    // ─── Gamification ────────────────────────────
    currentRank: { type: String, default: "Bronze" },
    rankPercentile: { type: Number, default: 100 },
    coins: { type: Number, default: 0 },
    badges: [
      {
        badgeId: { type: Schema.Types.ObjectId, ref: "Badge" },
        earnedAt: { type: Date, default: Date.now },
      },
    ],

    // ─── AI & Personalization ────────────────────
    learningPreferences: {
      pace: { type: String, default: "moderate" },
      preferredTopics: [String],
      weakAreas: [String],
    },
    aiTwinProfile: { type: Map, of: Schema.Types.Mixed, default: {} },

    // ─── Battle Analytics History (NEW) ───────────
    battleHistory: [Object],

    // ─── Analytics & Reports ─────────────────────
    lastLogin: { type: Date, default: Date.now },
    notifications: [
      {
        title: String,
        message: String,
        type: String,
        createdAt: { type: Date, default: Date.now },
        read: { type: Boolean, default: false },
      },
    ],
    reports: [
      {
        weekStart: Date,
        insights: String,
        progressChange: Number,
      },
    ],
  },
  { timestamps: true }
);

//
// ─── PASSWORD HASHING ───────────────────────────────
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

//
// ─── METHODS ────────────────────────────────────────
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.addXP = function (amount) {
  this.xp += amount;
  this.weeklyXP += amount;
  const threshold = this.level * 100;
  if (this.xp >= threshold) {
    this.level += 1;
    this.xp -= threshold;
  }
};

userSchema.methods.updateStreak = function (activeToday) {
  if (activeToday) {
    this.streakDays += 1;
    if (this.streakDays > this.personalBestStreak)
      this.personalBestStreak = this.streakDays;
  } else {
    this.streakDays = 0;
  }
};

userSchema.methods.awardBadge = function (badgeId) {
  const alreadyEarned = this.badges.some(
    (b) => b.badgeId.toString() === badgeId.toString()
  );
  if (!alreadyEarned) this.badges.push({ badgeId });
};

userSchema.methods.addCalendarTask = function (taskData) {
  this.calendarData.push(taskData);
};

userSchema.methods.recordCompletion = function (taskId) {
  const task = this.calendarData.find((t) => t.taskId === taskId);
  if (task) task.status = "completed";
  this.completedTasks.push({ taskId, completedAt: new Date() });
};

userSchema.methods.updateAIProfile = function (feedback) {
  for (const [key, value] of Object.entries(feedback)) {
    this.aiTwinProfile.set(key, value);
  }
};

//
// ─── NEW: RECORD BATTLE ANALYTICS ────────────────────────────────
//
userSchema.methods.recordBattleAnalytics = function (analytics, battleInfo) {
  // battleInfo = { battleId, battleName }
  if (!this.battleHistory) this.battleHistory = [];

  // 1️⃣ Push full analytics object directly into battle history
  this.battleHistory.push({
    battleId: battleInfo?.battleId || null,
    battleName: battleInfo?.battleName || "Unknown Battle",
    date: new Date(),
    ...analytics, // includes analytics.user, leaderboard, etc.
  });

  // 2️⃣ Safely extract user analytics data
  const userStats = analytics?.user || {};

  // 3️⃣ Update gamified stats
  const totalScore = userStats.totalScore || 0;
  const accuracy = parseFloat(userStats.accuracy) || 0;
  const correctCount = userStats.correctCount || 0;
  const totalQuestions = analytics?.totalQuestions || 1;

  // Add XP = 2 × total score
  this.addXP(totalScore * 2);

  // Update skill metrics (bounded 0–100)
  this.masteryScore = Math.min(100, Number((this.masteryScore + accuracy / 10).toFixed(1)));
  this.focusScore = Math.min(
    100,
    Number((this.focusScore + (correctCount / totalQuestions) * 10).toFixed(1))
  );
  this.accuracyScore = accuracy;

  // Award coins based on performance
  this.coins += Math.round(totalScore / 5);

  // Return for chaining
  return this.save();
};


//
// ─── DASHBOARD SUMMARY (for API) ────────────────────────────────
userSchema.methods.getDashboardSummary = function () {
  return {
    _id: this._id,
    name: this.username,
    email: this.email,
    xp: this.xp,
    weeklyXP: this.weeklyXP,
    level: this.level,
    streak: this.streakDays,
    personalBestStreak: this.personalBestStreak,
    masteryScore: this.masteryScore,
    focusScore: this.focusScore,
    accuracyScore: this.accuracyScore,
    rank: this.currentRank,
    rankPercentile: this.rankPercentile,
    coins: this.coins,
    badges: this.badges.length,
    upcomingTasks: this.upcomingTasks.slice(0, 5),
    courses: this.enrolledCourses.map((c) => ({
      title: c.title,
      progress: c.progress,
      completed: c.completed,
    })),
    last7DaysStudy: this.last7DaysStudy,
    xpHistory: this.xpHistory,
    battleHistory: this.battleHistory.slice(-5).reverse(), // last 5 battles
  };
};
userSchema.methods.recordBattleAnalytics = function (data) {
  const {
    battleId,
    battleName,
    rank,
    totalPlayers,
    tagWisePerformance,
    playerAnalytics,
  } = data;

  if (!this.battleHistory) this.battleHistory = [];

  // Save history entry
  this.battleHistory.push({
    battleId: battleId || null,
    battleName: battleName || "Unknown Battle",
    date: new Date(),
    rank: rank || 0,
    totalPlayers: totalPlayers || 0,
    tagWisePerformance: tagWisePerformance || [],
    performance: playerAnalytics || {},
  });

  // Update gamification
  const score = playerAnalytics?.totalScore || 0;
  const accuracy = playerAnalytics?.accuracy || 0;
  const correctCount = playerAnalytics?.correctCount || 0;
  const totalQuestions = playerAnalytics?.completedQuestions || 1;

  // XP
  this.addXP(correctCount * 10);

  // Accuracy Score
  this.accuracyScore = accuracy;

  // Mastery Score (slow gain)
  this.masteryScore = Math.min(
    100,
    Number((this.masteryScore + accuracy / 20).toFixed(1))
  );

  // Focus score = correct consistency
  const consistency = correctCount / totalQuestions;
  this.focusScore = Math.min(
    100,
    Number((this.focusScore + consistency * 8).toFixed(1))
  );

  // Coins
  this.coins += Math.round(score / 5);

  return this.save();
};


const User = mongoose.model("User", userSchema);
export default User;
