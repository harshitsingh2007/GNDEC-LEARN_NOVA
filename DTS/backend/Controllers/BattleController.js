import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
// import Battle from "../Models/Battle.js";
// import { GoogleGenerativeAI } from "@google/generative-ai";
// import Question from "../Models/Question.js";

import User from "../Models/User.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Battle from "../Models/BattleSchema.js";
import Question from "../Models/Questions.js";

//
// ─── AUTH HELPER ───────────────────────────────────────────────
//


//
// ─── AUTH HELPER ───────────────────────────────────────────────
//
const authenticateUser = async (req) => {
  let token;

  if (req.cookies?.jwt) token = req.cookies.jwt;
  else if (req.headers.authorization?.startsWith("Bearer "))
    token = req.headers.authorization.split(" ")[1];

  if (!token) throw new Error("Not authorized, no token");

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.userId);
  if (!user) throw new Error("User not found");

  return user;
};

//
// ─── CREATE BATTLE ─────────────────────────────────────────────
//
export const createBattle = asyncHandler(async (req, res) => {
  try {
    const user = await authenticateUser(req);
    const { battleName, tags } = req.body;

    const BATTLE_SIZE = 15;
    const MCQ_NEEDED = Math.floor(BATTLE_SIZE / 2);       // 7
    const PARA_NEEDED = BATTLE_SIZE - MCQ_NEEDED;         // 8

    const normalizedTags = tags.map(t => t.trim().toLowerCase());

    // ⬇ Fetch ALL questions matching tags
    let allQuestions = await Question.aggregate([
      {
        $addFields: {
          normalizedTags: {
            $map: {
              input: "$tags",
              as: "tag",
              in: {
                $toLower: {
                  $trim: { input: "$$tag" }
                }
              }
            }
          }
        }
      },
      {
        $match: {
          normalizedTags: { $in: normalizedTags }
        }
      }
    ]);

    // Split into MCQ and Paragraph
    let mcqQuestions = allQuestions.filter(q => q.questionType === "mcq");
    let paraQuestions = allQuestions.filter(q => q.questionType === "paragraph");

    // Randomize
    mcqQuestions.sort(() => Math.random() - 0.5);
    paraQuestions.sort(() => Math.random() - 0.5);

    // Pick required amounts
    let selectedMCQ = mcqQuestions.slice(0, MCQ_NEEDED);
    let selectedPARA = paraQuestions.slice(0, PARA_NEEDED);

    // Count missing
    const missingMCQ = MCQ_NEEDED - selectedMCQ.length;
    const missingPARA = PARA_NEEDED - selectedPARA.length;

    let generated = [];

    // ⬇ If any missing → generate with Gemini
    if (missingMCQ > 0 || missingPARA > 0) {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `
      Generate JSON ONLY.

      Create:
      - ${missingMCQ} MCQ questions
      - ${missingPARA} Paragraph questions

      All must match these tags: ${tags.join(", ")}

      MCQ structure:
      {
        "question": "",
        "questionType": "mcq",
        "options": ["a","b","c","d"],
        "correctAnswer": "a",
        "answerGuidelines": "",
        "category": "",
        "difficulty": "",
        "tags": ["${normalizedTags.join('","')}"]
      }

      Paragraph structure:
      {
        "question": "",
        "questionType": "paragraph",
        "options": [],
        "correctAnswer": null,
        "answerGuidelines": "key points...",
        "category": "",
        "difficulty": "",
        "tags": ["${normalizedTags.join('","')}"]
      }

      Return STRICT JSON ARRAY ONLY.
      `;

      const aiRes = await model.generateContent(prompt);
      let text = aiRes.response.text().replace(/```json|```/g, "").trim();
      generated = JSON.parse(text);

      // Fix MCQ-option errors
      generated = generated.map(q => {
        if (q.questionType === "mcq") {
          if (!Array.isArray(q.options) || q.options.length !== 4) {
            q.options = ["Option A", "Option B", "Option C", "Option D"];
            q.correctAnswer = "Option A";
          }
        }
        return q;
      });

      const inserted = await Question.insertMany(generated);
      generated = inserted;
    }

    // Final merge
    let allSelected = [
      ...selectedMCQ,
      ...selectedPARA,
      ...generated
    ].sort(() => Math.random() - 0.5);

    // Create unique battle code
    const battleCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    await Battle.create({
      battleCode,
      battleName,
      tags,
      createdBy: user._id,
      duration: 10000,
      questions: allSelected,
      players: [
        {
          userId: user._id,
          username: user.username,
          analytics: {
            score: 0,
            completedQuestions: 0,
            accuracy: 0,
            avgTimePerQuestion: 0,
            totalTimeTaken: 0,
            answers: [],
          },
        },
      ],
      status: "waiting",
    });

    res.status(201).json({
      message: "Battle created successfully",
      battleCode,
      battleName,
      createdBy: user.username,
      tags,
      questionCount: allSelected.length,
      mcq: selectedMCQ.length,
      paragraph: selectedPARA.length,
      aiGenerated: generated.length,
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});


//
// ─── JOIN BATTLE ─────────────────────────────────────────────
//
export const joinBattle = asyncHandler(async (req, res) => {
  try {
    const user = await authenticateUser(req);
    const { battleCode } = req.body;

    const battle = await Battle.findOne({ battleCode }).populate("questions");
    if (!battle) return res.status(404).json({ message: "Battle not found" });

    const existingPlayer = battle.players.find(
      (p) => p.userId.toString() === user._id.toString()
    );

    // Join if new player
    if (!existingPlayer) {
      if (battle.players.length >= 2)
        return res.status(400).json({ message: "Battle is full" });

      battle.players.push({
        userId: user._id,
        username: user.username,
        analytics: {
          score: 0,
          completedQuestions: 0,
          accuracy: 0,
          avgTimePerQuestion: 0,
          totalTimeTaken: 0,
          answers: [],
        },
      });

      if (battle.players.length === 2) battle.status = "in-progress";

      await battle.save();
    }

    // Format questions for frontend
    const safeQuestions = battle.questions.map((q) => ({
      _id: q._id.toString(),
      question: q.question,
      questionType: q.questionType,
      options: q.options ?? undefined,
      answerGuidelines: q.answerGuidelines ?? undefined,
      category: q.category ?? undefined,
      difficulty: q.difficulty ?? undefined,
      tags: q.tags ?? [],
    }));

    res.status(200).json({
      message: existingPlayer ? "Rejoined battle" : "Joined battle",
      battleId: battle._id.toString(),
      battleCode,
      battleName: battle.battleName,
      status: battle.status,
      players: battle.players,
      questions: safeQuestions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//
// ─── EVALUATE BATTLE ───────────────────────────────────────────
//
export const evaluateBattle = asyncHandler(async (req, res) => {
  try {
    const user = await authenticateUser(req);
    const { battleId, answers } = req.body;

    const battle = await Battle.findById(battleId).populate("questions");
    if (!battle) return res.status(404).json({ message: "Battle not found" });

    // Storage
    let totalScore = 0;
    let correct = 0;
    let incorrect = 0;
    let totalTime = 0;
    const correctnessTimeline = [];
    const tagHash = {};

    // Prepare paragraph questions
    const paragraphInputs = answers
      .map((ans) => {
        const q = battle.questions.find((qq) => qq._id.toString() === ans.questionId);
        if (!q || q.questionType !== "paragraph") return null;

        return {
          questionId: ans.questionId,
          question: q.question,
          userAnswer: ans.answer || "",
          guidelines: q.answerGuidelines || "",
        };
      })
      .filter(Boolean);

    // 2️⃣ Gemini Evaluation
    let paragraphResults = [];

    if (paragraphInputs.length > 0) {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `
      Evaluate the following student answers.

      Return STRICT JSON ARRAY ONLY:
      {
        "questionId": "",
        "isCorrect": true/false,
        "points": number,
        "feedback": ""
      }

      Data:
      ${JSON.stringify(paragraphInputs, null, 2)}
      `;

      const result = await model.generateContent(prompt);
      let text = result.response.text().replace(/```json|```/g, "").trim();

      try {
        paragraphResults = JSON.parse(text);
      } catch (e) {
        paragraphResults = paragraphInputs.map((p) => ({
          questionId: p.questionId,
          isCorrect: false,
          points: 0,
          feedback: "AI evaluation failed",
        }));
      }
    }

    // 3️⃣ Evaluate MCQ + Paragraph
    answers.forEach((ans, idx) => {
      const q = battle.questions.find((qq) => qq._id.toString() === ans.questionId);
      if (!q) return;

      let isCorrect = false;
      let points = 0;
      let feedback = "";

      // MCQ
      if (q.questionType === "mcq") {
        isCorrect =
          ans.answer.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim();
        points = isCorrect ? 10 : 0;
      }

      // Paragraph
      if (q.questionType === "paragraph") {
        const r = paragraphResults.find((x) => x.questionId === ans.questionId);
        if (r) {
          isCorrect = r.isCorrect;
          points = r.points;
          feedback = r.feedback;
        }
      }

      if (isCorrect) correct++;
      else incorrect++;

      totalScore += points;
      totalTime += ans.timeTaken || 0;

      correctnessTimeline.push({
        questionNumber: idx + 1,
        correct: isCorrect,
      });

      (q.tags || []).forEach((t) => {
        const tag = t.toLowerCase();
        if (!tagHash[tag]) tagHash[tag] = { correct: 0, total: 0 };

        tagHash[tag].total++;
        if (isCorrect) tagHash[tag].correct++;
      });
    });

    // 4️⃣ Analytics
    const totalQuestions = answers.length;
    const accuracy = totalQuestions ? (correct / totalQuestions) * 100 : 0;
    const avgTime = totalQuestions ? totalTime / totalQuestions : 0;

    const tagWisePerformance = Object.keys(tagHash).map((tag) => ({
      tag,
      accuracy: Number(((tagHash[tag].correct / tagHash[tag].total) * 100).toFixed(1)),
    }));

    // 5️⃣ Add Player
    battle.players.push({
      userId: user._id,
      username: user.username,
      score: totalScore,
      accuracy,
      rank: 0,
    });

    // Sort leaderboard
    battle.players.sort((a, b) => b.score - a.score);
    battle.players.forEach((p, i) => (p.rank = i + 1));
    await battle.save();

    const rank = battle.players.find((p) => p.userId.toString() === user._id.toString()).rank;

    const leaderboard = battle.players.map((p) => ({
      username: p.username,
      score: p.score,
      accuracy: p.accuracy,
      rank: p.rank,
    }));

    const summaryAnalytics = {
      totalPlayers: battle.players.length,
      highestScore: Math.max(...battle.players.map((p) => p.score)),
      lowestScore: Math.min(...battle.players.map((p) => p.score)),
      averageScore:
        battle.players.reduce((sum, p) => sum + p.score, 0) / battle.players.length,
      totalQuestions,
    };

    const userPerformance = {
      totalScore,
      correctCount: correct,
      incorrectCount: incorrect,
      accuracy: Number(accuracy.toFixed(1)),
      completedQuestions: totalQuestions,
      timeline: correctnessTimeline,
      avgTime,
      totalTime,
      tagWisePerformance,
      paragraphFeedback: paragraphResults,
    };

    // 6️⃣ Save User side analytics
    await user.recordBattleAnalytics({
      battleId,
      battleName: battle.battleName,
      rank,
      totalPlayers: battle.players.length,
      tagWisePerformance,
      playerAnalytics: userPerformance,
    });

    user.addXP(correct * 10);
    await user.save();

    res.status(200).json({
      message: "Evaluation complete",
      analytics: summaryAnalytics,
      userPerformance,
      players: leaderboard,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});




export const getUserBattleHistory = asyncHandler(async (req, res) => {
  try {
    // Auth user
    const user = await authenticateUser(req);

    // If no history
    if (!user.battleHistory || user.battleHistory.length === 0) {
      return res.status(200).json({
        message: "No previous battles found.",
        user: {
          _id: user._id,
          username: user.username,
        },
        battles: [],
      });
    }

    // Sort newest → oldest
    const sortedHistory = [...user.battleHistory].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    // ----------------------------
    // NORMALIZE EACH HISTORY ENTRY
    // ----------------------------
    const cleanedHistory = sortedHistory.map((b) => ({
      battleId: b.battleId || null,
      battleName: b.battleName || "Unknown Battle",

      // NEW ANALYTICS STRUCTURE
      rank: b.rank ?? null,
      totalPlayers: b.totalPlayers ?? null,

      totalScore: b.performance?.totalScore ?? 0,
      accuracy: b.performance?.accuracy ?? 0,
      correctCount: b.performance?.correctCount ?? 0,
      incorrectCount: b.performance?.incorrectCount ?? 0,
      completedQuestions: b.performance?.completedQuestions ?? 0,

      // Tag-wise performance graph
      tagWisePerformance: Array.isArray(b.tagWisePerformance)
        ? b.tagWisePerformance
        : [],

      // Timeline
      timeline: Array.isArray(b.performance?.timeline)
        ? b.performance.timeline
        : [],

      // Paragraph AI feedback
      paragraphFeedback: Array.isArray(b.performance?.paragraphFeedback)
        ? b.performance.paragraphFeedback
        : [],

      date: b.date,
    }));

    // ----------------------------
    // SAFE RESPONSE
    // ----------------------------
    res.status(200).json({
      message: "Battle history fetched successfully.",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        totalBattles: cleanedHistory.length,
      },
      battles: cleanedHistory,
    });

  } catch (error) {
    console.error("❌ Get Battle History Error:", error);
    res.status(500).json({
      message: "Failed to fetch battle history.",
      error: error.message,
    });
  }
});


export const getAllBattles = asyncHandler(async (req, res) => {
  try {
    const battles = await Battle.find({})
      .sort({ createdAt: -1 })
      .select("battleName battleCode tags status createdAt players");

    res.status(200).json({
      message: "All battles fetched successfully.",
      count: battles.length,
      battles,
    });
  } catch (error) {
    console.error("❌ Error fetching all battles:", error);
    res.status(500).json({
      message: "Failed to fetch battles.",
      error: error.message,
    });
  }
});

export const getBattleAnalysis = asyncHandler(async (req, res) => {
  try {
    const { battleId } = req.body;

    const battle = await Battle.findById(battleId);

    if (!battle) {
      return res.status(404).json({
        message: "Battle not found.",
      });
    }

    // ---------- Build leaderboard ----------
    const leaderboard = (battle.players || [])
      .map((p) => ({
        username: p.username,
        score: p.analytics?.score ?? 0,
        accuracy: p.analytics?.accuracy ?? 0,
        completed: p.analytics?.completedQuestions ?? 0,
      }))
      .sort((a, b) => b.score - a.score);

    // ---------- Battle-level analytics ----------
    const performance = {
      totalPlayers: leaderboard.length,
      highestScore: Math.max(...leaderboard.map((p) => p.score), 0),
      lowestScore: Math.min(...leaderboard.map((p) => p.score), 0),
      averageScore:
        leaderboard.reduce((sum, p) => sum + p.score, 0) /
        Math.max(leaderboard.length, 1),
    };

    // ---------- Response ----------
    res.status(200).json({
      message: "Battle analysis fetched successfully.",
      battle: {
        battleId: battle._id,
        battleName: battle.battleName,
        battleCode: battle.battleCode,
        tags: battle.tags,
        status: battle.status,
        createdAt: battle.createdAt,
        questions: battle.questions,
        players: battle.players,
      },
      leaderboard,
      performance,
    });

  } catch (error) {
    console.error("❌ Error fetching battle analysis:", error);
    res.status(500).json({
      message: "Failed to fetch detailed battle analysis.",
      error: error.message,
    });
  }
});
