import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import User from "../Models/User.js";
import Roadmap from "../Models/RoadMapSchema.js";
// import Roadmap from "../Models/Roadmap.js";

import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

let cachedRoadmapModel = null;
const getRoadmapModel = () => {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key missing — set GEMINI_API_KEY in your env");
  }

  if (!cachedRoadmapModel) {
    const client = new GoogleGenerativeAI(GEMINI_API_KEY);
    cachedRoadmapModel = client.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        maxOutputTokens: 300,
        temperature: 0.2,
      },
    });
  }

  return cachedRoadmapModel;
};

const extractJSON = (text) => {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const callGeminiWithRetry = async (model, prompt, attempts = 5) => {
  let lastError = null;

  for (let i = 0; i < attempts; i += 1) {
    try {
      return await model.generateContent(prompt);
    } catch (error) {
      lastError = error;

      const status = error?.status ?? error?.response?.status;
      const message = error?.message ?? "";
      const isOverloaded =
        status === 429 ||
        status === 503 ||
        /overload/i.test(message) ||
        /resource exhausted/i.test(message);

      if (!isOverloaded || i === attempts - 1) {
        throw error;
      }

      const jitter = Math.random() * 200;
      const backoffMs = 500 * Math.pow(2, i) + jitter;
      await sleep(backoffMs);
    }
  }

  throw lastError;
};
//
// ─── AUTH HELPER ───────────────────────────────────────────────
//
const authenticateUser = async (req) => {
  let token;

  if (req.cookies?.jwt) token = req.cookies.jwt;
  else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) throw new Error("Not authorized, no token");

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.userId);
  if (!user) throw new Error("User not found");

  return user;
};

//
// ─── CREATE ROADMAP ───────────────────────────────────────────
//
export const createRoadmap = asyncHandler(async (req, res) => {
  const user = await authenticateUser(req);

  const { title, modules } = req.body;

  if (!title) {
    res.status(400);
    throw new Error("Roadmap title is required");
  }

  const roadmap = await Roadmap.create({
    title,
    modules,
    createdBy: user._id,
  });

  res.status(201).json({
    success: true,
    message: "Roadmap created successfully",
    roadmap,
  });
});

//
// ─── GET ALL ROADMAPS ──────────────────────────────────────────
//
export const getAllRoadmaps = asyncHandler(async (req, res) => {
  const user = await authenticateUser(req);

  const roadmaps = await Roadmap.find();

  res.status(200).json({
    success: true,
    count: roadmaps.length,
    roadmaps,
  });
});

//
// ─── GET SINGLE ROADMAP ───────────────────────────────────────
//
export const getRoadmapById = asyncHandler(async (req, res) => {
  const user = await authenticateUser(req);

  const roadmap = await Roadmap.findById(req.params.id);

  if (!roadmap) {
    res.status(404);
    throw new Error("Roadmap not found");
  }

  res.status(200).json({
    success: true,
    roadmap,
  });
});

//
// ─── UPDATE ROADMAP ────────────────────────────────────────────
//
export const updateRoadmap = asyncHandler(async (req, res) => {
  const user = await authenticateUser(req);

  const roadmap = await Roadmap.findById(req.params.id);

  if (!roadmap) {
    res.status(404);
    throw new Error("Roadmap not found");
  }

  const updatedRoadmap = await Roadmap.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

  res.status(200).json({
    success: true,
    message: "Roadmap updated successfully",
    updatedRoadmap,
  });
});




//
// ─── DELETE ROADMAP (OPTIONAL) ─────────────────────────────────
//
export const deleteRoadmap = asyncHandler(async (req, res) => {
  const user = await authenticateUser(req);

  const roadmap = await Roadmap.findById(req.params.id);

  if (!roadmap) {
    res.status(404);
    throw new Error("Roadmap not found");
  }

  await roadmap.deleteOne();

  res.status(200).json({
    success: true,
    message: "Roadmap deleted successfully",
  });
});




export const createRoadmapWithAI = asyncHandler(async (req, res) => {
  const user = await authenticateUser(req);
  const { topic, level } = req.body;

  if (!topic || !level) {
    return res.status(400).json({
      success: false,
      message: "Topic and level are required",
    });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({
      success: false,
      message: "Gemini API key missing",
    });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-thinking", // ⚡ BEST FAST MODEL WITH DEEP OUTPUT
    });

    const prompt = `
      You are an expert curriculum designer.

      Return ONLY pure JSON. No descriptions, no markdown.

      Generate a **full detailed learning roadmap** for:
      Topic: "${topic}"
      Level: "${level}"

      Produce a DEEP and COMPLETE structure:

      {
        "title": "",
        "modules": [
          {
            "name": "",
            "topics": [
              {
                "name": "",
                "subtopics": [
                  {"name": ""}
                ]
              }
            ]
          }
        ]
      }

      RULES:
      - Create **6 modules**
      - Each module: **4–6 topics**
      - Each topic: **2–3 subtopics**
      - Keep names clean and concise
      - Output must be 100% valid JSON
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    let json;
    try {
      json = JSON.parse(text);
    } catch (err) {
      console.log("❌ Gemini JSON Error:", text);
      return res.status(500).json({
        success: false,
        message: "AI returned invalid JSON",
      });
    }

    // Save to DB
    const roadmap = await Roadmap.create({
      title: json.title || `${topic} Roadmap (${level})`,
      modules: json.modules || [],
      createdBy: user._id,
    });

    return res.status(201).json({
      success: true,
      message: "AI roadmap created successfully",
      roadmap,
    });

  } catch (err) {
    console.error("❌ AI Error:", err.message);

    // Fallback
    const fallback = await Roadmap.create({
      title: `${topic} Roadmap (${level}) — Fallback`,
      modules: [
        {
          name: `${topic} Basics`,
          topics: [
            { name: `Introduction to ${topic}`, subtopics: [{ name: "Overview" }] },
            { name: `${topic} core concepts`, subtopics: [{ name: "Key fundamentals" }] },
          ],
        },
        {
          name: `${topic} Advanced`,
          topics: [
            { name: `${topic} workflows`, subtopics: [{ name: "Real examples" }] },
            { name: `${topic} project`, subtopics: [{ name: "Build something" }] },
          ],
        },
      ],
      createdBy: user._id,
      fallback: true,
    });

    return res.status(200).json({
      success: true,
      message: "Gemini overloaded — fallback roadmap created.",
      roadmap: fallback,
    });
  }
});
