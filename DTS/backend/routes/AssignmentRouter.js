import express from "express";
import {
  createAssignment,
  updateAssignment,
  getAssignmentById,
  getAdminAssignments,
  getStudentAssignments,
  submitAssignment,
  getAssignmentSubmissions,
  gradeAssignment,
  aiGradeAssignment,
} from "../Controllers/AssignmentController.js";
import { protectAdmin } from "../MiddleWare/adminAuthMiddleware.js";

const router = express.Router();

// ─── Specific routes MUST come before parameterized routes ───
// Admin routes
router.post("/", protectAdmin, createAssignment);
router.get("/admin", protectAdmin, getAdminAssignments);

// Student routes
router.get("/student", getStudentAssignments);

// ─── Parameterized routes (must come after specific routes) ───
router.get("/:id/submissions", protectAdmin, getAssignmentSubmissions);
router.get("/:id", protectAdmin, getAssignmentById);
router.put("/:id", protectAdmin, updateAssignment);
router.put("/:assignmentId/grade/:submissionId", protectAdmin, gradeAssignment);
router.post("/:assignmentId/ai-grade/:submissionId", protectAdmin, aiGradeAssignment);
router.post("/:id/submit", submitAssignment);

export default router;

