import asyncHandler from "express-async-handler";
import Quiz from "../Models/Quiz.js";
import User from "../Models/User.js";
import jwt from "jsonwebtoken";
import { GoogleGenerativeAI } from "@google/generative-ai";

//
// ─── AUTH HELPER ───────────────────────────────────────────────
//
const authenticateUser = async (req) => {
  let token;

  if (req.cookies?.jwt) token = req.cookies.jwt;
  else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  )
    token = req.headers.authorization.split(" ")[1];

  if (!token) throw new Error("Not authorized, no token");

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.userId);
  if (!user) throw new Error("User not found");

  return user;
};

//
// ─── GET ALL QUIZZES (AUTH REQUIRED) ───────────────────────────
//
export const getAllQuizzes = asyncHandler(async (req, res) => {
  try {
    const user = await authenticateUser(req);
    const quizzes = await Quiz.find()
      .select(
        "title category level totalMarks timeLimit passingPercentage createdAt"
      )
      .populate("course", "title")
      .populate("createdBy", "username email")
      .sort({ createdAt: -1 });

    res.status(200).json({ user: user.username, quizzes });
  } catch (error) {
    console.error("❌ Get All Quizzes Error:", error.message);
    res.status(401).json({ message: error.message || "Unauthorized request" });
  }
});

//
// ─── GET SINGLE QUIZ DETAILS ─────────────────────────────
//
export const getQuizDetails = asyncHandler(async (req, res) => {
  try {
    console.log("📩 Quiz details request received");

    const quizId = req.params.id || req.query.id || req.body.id;
    if (!quizId)
      return res.status(400).json({ message: "Quiz ID is required" });

    const quiz = await Quiz.findById(quizId)
      .populate("course", "title category")
      .populate("createdBy", "username email");

    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    const quizResponse = {
      _id: quiz._id,
      title: quiz.title,
      description: quiz.description,
      category: quiz.category,
      level: quiz.level,
      totalMarks: quiz.totalMarks,
      timeLimit: quiz.timeLimit,
      passingPercentage: quiz.passingPercentage,
      questions: quiz.questions.map((q) => ({
        id: q._id,
        questionText: q.questionText,
        options: q.options.map((o) => o.text),
        marks: q.marks,
        difficulty: q.difficulty,
      })),
      course: quiz.course,
      createdBy: quiz.createdBy,
    };

    res.status(200).json(quizResponse);
  } catch (error) {
    console.error("❌ Get Quiz Error:", error.message);
    res.status(500).json({
      message: "Server error while fetching quiz details",
    });
  }
});

//
// ─── EVALUATE QUIZ ─────────────────────────────
//
export const evaluateQuiz = asyncHandler(async (req, res) => {
  const { quizId, selected, timeTaken } = req.body;

  if (!quizId || !selected)
    return res
      .status(400)
      .json({ message: "Missing quizId or selected answers" });

  const user = await authenticateUser(req);
  const quiz = await Quiz.findById(quizId);

  if (!quiz) return res.status(404).json({ message: "Quiz not found" });

  let correctCount = 0;
  let totalMarks = 0;
  let scoredMarks = 0;
  const questionAnalysis = [];

  quiz.questions.forEach((q, i) => {
    const correctIndex = q.options.findIndex(
      (opt) => opt.isCorrect || opt.text === q.correctAnswer
    );
    const selectedIndex = selected[i] !== null ? selected[i] - 1 : null;

    const isCorrect = selectedIndex === correctIndex;
    const marks = q.marks || 1;
    totalMarks += marks;
    if (isCorrect) scoredMarks += marks;

    questionAnalysis.push({
      question: i + 1,
      questionText: q.questionText,
      selected: selected[i],
      correct: correctIndex + 1,
      result: isCorrect ? "✅" : "❌",
    });

    if (isCorrect) correctCount++;
  });

  const wrongCount = quiz.questions.length - correctCount;
  const accuracy = ((correctCount / quiz.questions.length) * 100).toFixed(2);

  const xpGained = correctCount * 2; // 2 XP per correct answer (better than 1)
  user.addXP(xpGained);

  // ─── Full analysis object (sent to frontend) ─────────────────────────────
  const analysis = {
    quizTitle: quiz.title,
    totalQuestions: quiz.questions.length,
    correctCount,
    wrongCount,
    accuracy,
    totalMarks,
    scoredMarks,
    timeTaken,
    xpGained,
    questionAnalysis,
    charts: {
      pie: [
        { name: "Correct", value: correctCount },
        { name: "Wrong", value: wrongCount },
      ],
      bar: questionAnalysis.map((q) => ({
        question: `Q${q.question}`,
        result: q.result === "✅" ? 1 : 0,
      })),
    },
  };

  // ─── Store entire result object in DB ───────────────────────────────
  user.quizAttempts.push({
    quizId: quiz._id,
    resultData: analysis, // 🔥 full result object stored here
    attemptDate: new Date(),
  });

  // Add to XP history for dashboard charts
  if (!user.xpHistory) user.xpHistory = [];
  user.xpHistory.push({
    date: new Date(),
    reason: `Quiz: ${quiz.title}`,
    amount: xpGained,
  });

  await user.save();

  res.status(200).json({
    message: "Quiz evaluated successfully",
    analysis, // ✅ same object sent to frontend
  });
});


//
// ─── GENERATE AI QUIZ ─────────────────────────────
//
export const generateAIQuiz = asyncHandler(async (req, res) => {
  const user = await authenticateUser(req);
  const { topic, difficulty = "medium", numberOfQuestions = 10 } = req.body;

  if (!topic)
    return res.status(400).json({ message: "Topic is required to generate quiz" });

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
      Generate a ${numberOfQuestions}-question quiz on "${topic}" with difficulty "${difficulty}".
      Return a pure JSON array with each question in this format:
      {
        "questionText": "string",
        "options": ["option1", "option2", "option3", "option4"],
        "correctIndex": number (1-based),
        "marks": number (1 or 2)
      }
      Only return valid JSON array.
    `;

    const result = await model.generateContent(prompt);
    const textResponse = result.response.text();

    const jsonMatch = textResponse.match(/\[[\s\S]*\]/);
    if (!jsonMatch)
      return res
        .status(400)
        .json({ message: "Gemini did not return valid JSON data" });

    let quizData;
    try {
      quizData = JSON.parse(jsonMatch[0]);
    } catch {
      return res.status(400).json({ message: "Failed to parse JSON output" });
    }

    const newQuiz = new Quiz({
      title: `AI Quiz: ${topic}`,
      description: `AI-generated quiz on "${topic}".`,
      category: "AI-Generated",
      level:
        difficulty === "easy"
          ? "Beginner"
          : difficulty === "hard"
          ? "Advanced"
          : "Intermediate",
      createdBy: user._id,
      timeLimit: numberOfQuestions * 2,
      passingPercentage: 50,
      questions: quizData.map((q) => ({
        questionText: q.questionText,
        options: q.options.map((opt, idx) => ({
          text: opt,
          isCorrect: idx + 1 === q.correctIndex,
        })),
        marks: q.marks || 1,
        difficulty,
      })),
    });

    await newQuiz.save();

    user.xp += 3;
    user.weeklyXP += 3;
    user.xpHistory.push({
      date: new Date(),
      reason: `AI Quiz Generated: ${topic}`,
      amount: 3,
    });
    await user.save();

    res.status(201).json({
      message: "AI Quiz created successfully",
      quizId: newQuiz._id,
      title: newQuiz.title,
      totalQuestions: newQuiz.questions.length,
      totalMarks: newQuiz.totalMarks,
    });
  } catch (error) {
    console.error("❌ AI Quiz Generation Error:", error);
    res.status(500).json({
      message: "Failed to generate quiz",
      error: error.message,
    });
  }
});

export const getUserQuizAttempts = asyncHandler(async (req, res) => {
  try {
    const user = await authenticateUser(req);

    // Populate quiz details for each attempt
    const populatedUser = await User.findById(user._id)
      .populate({
        path: "quizAttempts.quizId",
        select: "title category level totalMarks createdAt",
      })
      .select("username email quizAttempts");

    if (!populatedUser || !populatedUser.quizAttempts.length) {
      return res.status(200).json({
        message: "No quiz attempts found for this user",
        attempts: [],
      });
    }

    // Format results for frontend
    const formattedAttempts = populatedUser.quizAttempts.map((attempt) => ({
      quizId: attempt.quizId?._id,
      quizTitle: attempt.quizId?.title || "Deleted Quiz",
      category: attempt.quizId?.category || "N/A",
      level: attempt.quizId?.level || "N/A",
      totalMarks: attempt.quizId?.totalMarks || 0,
      attemptedOn: attempt.attemptDate,
      resultData: attempt.resultData || null, // full stored analysis
    }));

    res.status(200).json({
      message: "User quiz history fetched successfully",
      username: populatedUser.username,
      totalAttempts: formattedAttempts.length,
      attempts: formattedAttempts,
    });
  } catch (error) {
    console.error("❌ Get User Quiz Attempts Error:", error.message);
    res.status(500).json({
      message: "Failed to fetch quiz attempts",
      error: error.message,
    });
  }
});