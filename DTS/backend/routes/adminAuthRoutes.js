import express from 'express';
import {
  registerAdmin,
  loginAdmin,
  logoutAdmin,
  getAdminProfile,
  updateAdminProfile,
  changePassword,
  getAdminDashboardStats,
  getAdminStudents,
  getAdminDashboardActivity,
  getAdminAssessments
} from '../Controllers/adminAuthController.js';
import { protectAdmin, requireSuperAdmin } from '../MiddleWare/adminAuthMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', registerAdmin);
router.post('/login', loginAdmin);

// Protected routes (require admin authentication)
router.post('/logout', protectAdmin, logoutAdmin);
router.get('/profile', protectAdmin, getAdminProfile);
router.put('/profile', protectAdmin, updateAdminProfile);
router.put('/change-password', protectAdmin, changePassword);
router.get('/dashboard/stats', protectAdmin, getAdminDashboardStats);
router.get('/dashboard/activity', protectAdmin, getAdminDashboardActivity);
router.get('/students', protectAdmin, getAdminStudents);
router.get('/assessments', protectAdmin, getAdminAssessments);

export default router;

