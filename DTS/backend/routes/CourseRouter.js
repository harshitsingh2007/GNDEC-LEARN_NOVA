import express from "express";
import { getAllCourses, createCourse, updateCourse, deleteCourse, enrollInCourse, getMyCourses, getCourseDetails, trackCourseAccess, completeLesson, autoCreateCourse, getPlaylistVideos, getMyCreatedCourses, createUserCourse } from "../Controllers/CourseController.js";
import { protectAdmin } from "../MiddleWare/adminAuthMiddleware.js";
import { protect } from "../MiddleWare/authMiddleware.js";

const router = express.Router();

// Public routes
router.get("/", getAllCourses);
router.get("/my", getMyCourses);
router.post("/getsingle", getCourseDetails);
router.post("/enroll", enrollInCourse);

// Student routes (require authentication via JWT in controller)
router.post("/:id/access", trackCourseAccess);
router.post("/:id/complete-lesson", completeLesson);

// User course creation route
router.post("/user", protect, createUserCourse);

// Get my created courses (works for both admin and user)
// Admin route - protectAdmin middleware sets req.admin
router.get("/my-created", protectAdmin, getMyCreatedCourses);
// User route - will be handled by checking token in controller
router.get("/my-created-user", getMyCreatedCourses);

// Admin protected routes
router.post("/", protectAdmin, createCourse);
router.put("/:id", protectAdmin, updateCourse);
router.delete("/:id", protectAdmin, deleteCourse);

// AI and playlist routes
router.post("/aigen", autoCreateCourse);
router.post("/ytcr", getPlaylistVideos);

export default router;
