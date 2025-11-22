import express from "express";
import {
  getCalendar,
  completeTask,
  getCalendarSummary,
  updateStudyPreferences,
  regenerateTodaysTask,
  updateTaskStatus,
  getTaskById,
  createCustomTask,
} from "../Controllers/CalendarController.js";

const router = express.Router();

router.get("/", getCalendar);
router.patch("/complete/:taskId", completeTask);
router.get("/task/:taskId", getTaskById);
router.get("/summary", getCalendarSummary);
router.patch("/preferences", updateStudyPreferences);
router.post("/regenerate-today", regenerateTodaysTask);
router.patch("/task/:taskId", updateTaskStatus);
router.post("/create-task", createCustomTask);

export default router;