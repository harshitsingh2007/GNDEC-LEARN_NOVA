import express from "express";
// import {
//   registerUser,
//   loginUser,
//   logoutUser,
//   getUserProfile,
// } from "../controllers/authController.js";
// import { protect } from "../middleware/authMiddleware.js";
import { registerUser, loginUser, logoutUser, getUserProfile, getStudentDashboard, getUserProfilesetting, updateUserProfile } from "../Controllers/AuthController.js";
import { protect } from "../MiddleWare/authMiddleware.js";  


const router = express.Router();

router.post("/register", registerUser);
router.get("/getuserprofile",getUserProfilesetting)
router.post("/update",updateUserProfile)
router.post("/login", loginUser);
router.post("/logout", protect, logoutUser);
router.get("/profile", protect, getUserProfile);
router.get("/dashboard", protect, getStudentDashboard);

export default router;
