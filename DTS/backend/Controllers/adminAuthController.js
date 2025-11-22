import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import Admin from "../Models/Admin.js";

//
// ─── GENERATE ADMIN TOKEN ──────────────────────────────────────
const generateAdminToken = (res, adminId) => {
  const token = jwt.sign(
    { adminId, type: 'admin' },
    process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.ADMIN_JWT_EXPIRE || '7d' }
  );

  res.cookie("admin_jwt", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return token;
};

//
// ─── REGISTER ADMIN (Super Admin Only) ────────────────────────
// @route   POST /api/admin/auth/register
// @access  Private (Super Admin)
//
export const registerAdmin = asyncHandler(async (req, res) => {
  try {
    const { username, email, password, fullName, department, role, permissions } = req.body;

    // Check if admin exists
    const adminExists = await Admin.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (adminExists) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const admin = await Admin.create({
      username,
      email,
      password,
      fullName,
      department,
      role: role || "admin",
      permissions: permissions || {}
    });

    if (!admin) {
      return res.status(400).json({ message: "Invalid admin data" });
    }

    res.status(201).json({
      success: true,
      message: "Admin created successfully",
      admin: {
        _id: admin._id,
        username: admin.username,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
        department: admin.department,
      }
    });
  } catch (error) {
    console.error("Admin Register Error:", error.message);
    res.status(500).json({ message: "Server error while registering admin" });
  }
});

//
// ─── LOGIN ADMIN ────────────────────────────────────────────────
// @route   POST /api/admin/auth/login
// @access  Public
//
export const loginAdmin = asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const admin = await Admin.findOne({ email }).select("+password");
    
    if (!admin) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(403).json({ message: "Account deactivated. Contact super admin." });
    }

    const isMatch = await admin.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // ✅ Create and send JWT
    const token = generateAdminToken(res, admin._id);

    // Update last login
    admin.recordLogin(req.ip, req.get('User-Agent'));
    await admin.save();

    res.json({
      success: true,
      token,
      admin: {
        _id: admin._id,
        username: admin.username,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
        department: admin.department,
        permissions: admin.permissions,
        lastLogin: admin.lastLogin,
      }
    });
  } catch (error) {
    console.error("Admin Login Error:", error);
    res.status(500).json({ message: "Server error while logging in" });
  }
});

//
// ─── LOGOUT ADMIN ───────────────────────────────────────────────
// @route   POST /api/admin/auth/logout
// @access  Private (Admin)
//
export const logoutAdmin = asyncHandler(async (req, res) => {
  try {
    res.cookie("admin_jwt", "", {
      httpOnly: true,
      expires: new Date(0),
    });
    
    res.status(200).json({ 
      success: true,
      message: "Admin logged out successfully" 
    });
  } catch (error) {
    console.error("Admin Logout Error:", error.message);
    res.status(500).json({ message: "Server error while logging out" });
  }
});

//
// ─── GET ADMIN PROFILE ─────────────────────────────────────────
// @route   GET /api/admin/auth/profile
// @access  Private (Admin)
//
export const getAdminProfile = asyncHandler(async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id);

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.status(200).json({
      success: true,
      admin: admin.getDashboardSummary()
    });
  } catch (error) {
    console.error("Admin Profile Fetch Error:", error.message);
    res.status(500).json({ message: "Server error while fetching profile" });
  }
});

//
// ─── UPDATE ADMIN PROFILE ──────────────────────────────────────
// @route   PUT /api/admin/auth/profile
// @access  Private (Admin)
//
export const updateAdminProfile = asyncHandler(async (req, res) => {
  try {
    const { fullName, department, phone } = req.body;
    
    const admin = await Admin.findById(req.admin._id);

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    admin.fullName = fullName || admin.fullName;
    admin.department = department || admin.department;
    admin.phone = phone || admin.phone;

    await admin.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      admin: admin.getDashboardSummary()
    });
  } catch (error) {
    console.error("Admin Profile Update Error:", error.message);
    res.status(500).json({ message: "Server error while updating profile" });
  }
});

//
// ─── CHANGE PASSWORD ───────────────────────────────────────────
// @route   PUT /api/admin/auth/change-password
// @access  Private (Admin)
//
export const changePassword = asyncHandler(async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new password are required" });
    }

    const admin = await Admin.findById(req.admin._id).select("+password");

    const isMatch = await admin.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    admin.password = newPassword;
    admin.lastPasswordChange = new Date();
    await admin.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully"
    });
  } catch (error) {
    console.error("Change Password Error:", error.message);
    res.status(500).json({ message: "Server error while changing password" });
  }
});

//
// ─── GET ADMIN DASHBOARD STATISTICS ───────────────────────────
// @route   GET /api/admin/dashboard/stats
// @access  Private (Admin)
//
export const getAdminDashboardStats = asyncHandler(async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id);

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Import models
    const Course = (await import("../Models/Course.js")).default;
    const Assignment = (await import("../Models/Assignment.js")).default;
    const Quiz = (await import("../Models/Quiz.js")).default;

    // Count active courses (published courses created by this admin)
    const activeCoursesCount = await Course.countDocuments({
      instructor: req.admin._id,
      published: { $ne: false }
    });

    // Get all courses created by this admin
    const adminCourses = await Course.find({
      instructor: req.admin._id
    }).select("enrolledStudents title performance");

    // Count unique students enrolled in admin's courses
    const enrolledStudentIds = new Set();
    adminCourses.forEach(course => {
      course.enrolledStudents.forEach(enrollment => {
        if (enrollment.studentId) {
          enrolledStudentIds.add(enrollment.studentId.toString());
        }
      });
    });

    const totalEnrolledStudents = enrolledStudentIds.size;

    // Get pending assignments count
    const courseIds = adminCourses.map(c => c._id);
    const assignments = await Assignment.find({
      course: { $in: courseIds }
    }).select("submissions");

    let pendingAssignments = 0;
    assignments.forEach(assignment => {
      const pending = assignment.submissions.filter(s => s.status !== 'graded').length;
      pendingAssignments += pending;
    });

    // Calculate average performance across all courses
    let totalPerformance = 0;
    let coursesWithPerformance = 0;
    adminCourses.forEach(course => {
      if (course.performance && course.performance.avgScore > 0) {
        totalPerformance += course.performance.avgScore;
        coursesWithPerformance++;
      }
    });
    const avgPerformance = coursesWithPerformance > 0 
      ? Math.round(totalPerformance / coursesWithPerformance) 
      : 0;

    // Calculate performance improvement (simplified - compare with previous period)
    const performanceImprovement = avgPerformance > 75 ? 3 : avgPerformance > 60 ? 2 : 1;

    // Get course performance data for chart
    const coursePerformanceData = adminCourses
      .filter(course => course.performance && course.performance.avgScore > 0)
      .map(course => ({
        course: course.title.length > 10 ? course.title.substring(0, 10) + '...' : course.title,
        avg: Math.round(course.performance.avgScore || 0)
      }))
      .slice(0, 6); // Limit to 6 courses for chart

    // Get student engagement data (last 4 weeks)
    const engagementData = [];
    const now = new Date();
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7));
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      // Count students who accessed courses in this week
      let weekStudents = 0;
      adminCourses.forEach(course => {
        course.enrolledStudents.forEach(enrollment => {
          if (enrollment.lastAccessed) {
            const lastAccess = new Date(enrollment.lastAccessed);
            if (lastAccess >= weekStart && lastAccess < weekEnd) {
              weekStudents++;
            }
          }
        });
      });

      engagementData.push({
        week: `W${4 - i}`,
        students: weekStudents
      });
    }

    res.status(200).json({
      success: true,
      stats: {
        educatorName: admin.fullName || admin.username,
        activeCourses: activeCoursesCount,
        enrolledStudents: totalEnrolledStudents,
        pendingAssignments: pendingAssignments,
        avgPerformance: avgPerformance,
        performanceImprovement: performanceImprovement,
        coursePerformanceData: coursePerformanceData,
        engagementData: engagementData,
        admin: {
          _id: admin._id,
          username: admin.username,
          email: admin.email,
          fullName: admin.fullName,
          department: admin.department,
        }
      }
    });
  } catch (error) {
    console.error("Admin Dashboard Stats Error:", error.message);
    res.status(500).json({ message: "Server error while fetching dashboard stats" });
  }
});

//
// ─── GET STUDENTS ENROLLED IN ADMIN COURSES ────────────────────
// @route   GET /api/admin/students
// @access  Private (Admin)
//
export const getAdminStudents = asyncHandler(async (req, res) => {
  try {
    // Import Course and User models
    const Course = (await import("../Models/Course.js")).default;
    const User = (await import("../Models/User.js")).default;

    // Get all courses created by this admin
    const adminCourses = await Course.find({
      instructor: req.admin._id
    }).select("enrolledStudents");

    // Collect all unique student IDs
    const enrolledStudentIds = new Set();
    const studentCourseMap = new Map(); // Map studentId to course progress

    adminCourses.forEach(course => {
      course.enrolledStudents.forEach(enrollment => {
        if (enrollment.studentId) {
          const studentId = enrollment.studentId.toString();
          enrolledStudentIds.add(studentId);
          
          // Track course progress for this student
          if (!studentCourseMap.has(studentId)) {
            studentCourseMap.set(studentId, []);
          }
          studentCourseMap.get(studentId).push({
            courseId: course._id,
            progress: enrollment.progress || 0,
            completed: enrollment.completed || false
          });
        }
      });
    });

    // Fetch all enrolled students
    const students = await User.find({
      _id: { $in: Array.from(enrolledStudentIds) },
      role: 'student'
    }).select("username email xp level streakDays totalStudyTime masteryScore focusScore accuracyScore enrolledCourses avatarUrl");

    // Format student data with course progress
    const formattedStudents = students.map(student => {
      const courseProgresses = studentCourseMap.get(student._id.toString()) || [];
      const avgProgress = courseProgresses.length > 0
        ? Math.round(courseProgresses.reduce((sum, cp) => sum + cp.progress, 0) / courseProgresses.length)
        : 0;

      // Calculate trend (simplified - based on recent XP or progress)
      const trend = student.xp > 1000 ? 'up' : 'down';

      return {
        _id: student._id,
        name: student.username,
        email: student.email,
        progress: avgProgress,
        xp: student.xp || 0,
        level: student.level || 1,
        streakDays: student.streakDays || 0,
        totalStudyTime: student.totalStudyTime || 0,
        masteryScore: student.masteryScore || 0,
        focusScore: student.focusScore || 0,
        accuracyScore: student.accuracyScore || 0,
        enrolledCoursesCount: courseProgresses.length,
        avatarUrl: student.avatarUrl,
        trend: trend,
        lastActive: 'Recently', // Could be enhanced with actual last activity timestamp
      };
    });

    res.status(200).json({
      success: true,
      students: formattedStudents,
      total: formattedStudents.length
    });
  } catch (error) {
    console.error("Get Admin Students Error:", error.message);
    res.status(500).json({ message: "Server error while fetching students" });
  }
});

//
// ─── GET RECENT ACTIVITY FOR ADMIN DASHBOARD ──────────────────
// @route   GET /api/admin/dashboard/activity
// @access  Private (Admin)
//
export const getAdminDashboardActivity = asyncHandler(async (req, res) => {
  try {
    // Import Course and User models
    const Course = (await import("../Models/Course.js")).default;
    const User = (await import("../Models/User.js")).default;

    // Get all courses created by this admin
    const adminCourses = await Course.find({
      instructor: req.admin._id
    }).select("title enrolledStudents");

    // Collect recent enrollments and completions
    const activities = [];

    for (const course of adminCourses) {
      // Get recent enrollments (last 10)
      const recentEnrollments = course.enrolledStudents
        .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
        .slice(0, 5);

      for (const enrollment of recentEnrollments) {
        const student = await User.findById(enrollment.studentId).select("username");
        if (student) {
          activities.push({
            student: student.username,
            action: enrollment.completed ? 'completed' : 'enrolled in',
            item: course.title,
            time: enrollment.startedAt,
            type: enrollment.completed ? 'completion' : 'enrollment'
          });
        }
      }
    }

    // Sort by time (most recent first) and limit to 10
    const recentActivities = activities
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 10)
      .map(activity => ({
        student: activity.student,
        action: activity.action,
        item: activity.item,
        time: formatTimeAgo(new Date(activity.time))
      }));

    res.status(200).json({
      success: true,
      activities: recentActivities
    });
  } catch (error) {
    console.error("Get Admin Dashboard Activity Error:", error.message);
    res.status(500).json({ message: "Server error while fetching activity" });
  }
});

// Helper function to format time ago
function formatTimeAgo(date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds} sec ago`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} min ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
}

//
// ─── GET ASSESSMENTS FOR ADMIN COURSES ────────────────────────
// @route   GET /api/admin/assessments
// @access  Private (Admin)
//
export const getAdminAssessments = asyncHandler(async (req, res) => {
  try {
    // Import Course and Quiz models
    const Course = (await import("../Models/Course.js")).default;
    const Quiz = (await import("../Models/Quiz.js")).default;

    // Get all courses created by this admin
    const adminCourses = await Course.find({
      instructor: req.admin._id
    }).select("_id title");

    const courseIds = adminCourses.map(course => course._id);

    // Get all quizzes/assessments for these courses
    const quizzes = await Quiz.find({
      course: { $in: courseIds }
    })
    .populate("course", "title")
    .select("title description course totalMarks timeLimit passingPercentage attempts totalAttempts published createdAt")
    .sort({ createdAt: -1 });

    // Format assessments with student statistics
    const formattedAssessments = await Promise.all(quizzes.map(async (quiz) => {
      // Get course to find enrolled students
      const course = await Course.findById(quiz.course).select("enrolledStudents");
      const totalStudents = course ? course.enrolledStudents.length : 0;

      // Count submitted attempts
      const submittedCount = quiz.attempts.length;
      const pendingCount = Math.max(0, totalStudents - submittedCount);

      // Calculate due date (if exists in course assignments)
      let dueDate = null;
      if (course && course.assignments) {
        const assignment = course.assignments.find(a => 
          a.assignmentId && a.assignmentId.toString() === quiz._id.toString()
        );
        if (assignment && assignment.dueDate) {
          dueDate = new Date(assignment.dueDate).toISOString().split('T')[0];
        }
      }

      return {
        _id: quiz._id,
        title: quiz.title,
        description: quiz.description,
        course: quiz.course?.title || 'Unknown Course',
        courseId: quiz.course?._id,
        students: totalStudents,
        submitted: submittedCount,
        pending: pendingCount,
        totalMarks: quiz.totalMarks,
        timeLimit: quiz.timeLimit,
        passingPercentage: quiz.passingPercentage,
        dueDate: dueDate,
        published: quiz.published,
        createdAt: quiz.createdAt
      };
    }));

    res.status(200).json({
      success: true,
      assessments: formattedAssessments,
      total: formattedAssessments.length
    });
  } catch (error) {
    console.error("Get Admin Assessments Error:", error.message);
    res.status(500).json({ message: "Server error while fetching assessments" });
  }
});