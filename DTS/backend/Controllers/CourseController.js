import asyncHandler from "express-async-handler";
import Course from "../Models/Course.js";
import User from "../Models/User.js";
import jwt from 'jsonwebtoken'
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import axios from 'axios';
import JSON5 from 'json5';

const DEFAULT_THUMBNAIL =
  "https://via.placeholder.com/400x250?text=Course+Image";

const buildBaseUrl = () => {
  return process.env.SERVER_URL?.replace(/\/+$/, "") || "http://localhost:5000";
};

const normalizePath = (path, fallback) => {
  if (!path) return fallback;
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.replace(/\\/g, "/").replace(/^\/+/, "");
  return `${buildBaseUrl()}/${normalized}`;
};

const resolveThumbnail = (thumbnail) => normalizePath(thumbnail, DEFAULT_THUMBNAIL);

const resolveVideoUrl = (videoUrl) =>
  normalizePath(videoUrl, "");
//
// ─── GET ALL COURSES ───────────────────────────────────────────────
// @route   GET /api/courses
// @access  Public
//
export const getAllCourses = asyncHandler(async (req, res) => {
    try {
        const { category, level, search } = req.query;
        const query = { published: { $ne: false } }; // Only get published courses

        if (category) query.category = category;
        if (level) query.level = level;
        if (search) {
            query.title = { $regex: search, $options: "i" };
        }

        const courses = await Course.find(query)
            .select("title description category level thumbnail averageRating duration instructor price link instructorName language requirements whatYouWillLearn published")
            .populate("instructor", "username email");

        // Format courses for response
        const publishedCourses = courses.map(course => ({
            _id: course._id,
            title: course.title,
            description: course.description,
            category: course.category,
            level: course.level,
            thumbnail: resolveThumbnail(course.thumbnail),
            averageRating: course.averageRating,
            duration: course.duration,
            instructor: course.instructor,
            instructorName: course.instructorName,
            language: course.language,
            price: course.price,
            link: course.link,
            requirements: course.requirements,
            whatYouWillLearn: course.whatYouWillLearn,
            published: course.published !== false,
        }));
        
        res.status(200).json(publishedCourses);
    } catch (error) {
        console.error("Get Courses Error:", error.message);
        res.status(500).json({ message: "Server error while fetching courses" });
    }
});

//
// ─── GET SINGLE COURSE BY ID ───────────────────────────────────────
// @route   GET /api/courses/:id
// @access  Public
//
export const getCourseDetails = asyncHandler(async (req, res) => {
    try {
      console.log("📩 Course details request received");
  
      // ─── 1. Extract JWT ───────────────────────────────
      let token;
      if (req.cookies && req.cookies.jwt) {
        token = req.cookies.jwt;
      } else if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer ")
      ) {
        token = req.headers.authorization.split(" ")[1];
      }
  
      if (!token) {
        return res.status(401).json({ message: "Not authorized, no token" });
      }
  
      // ─── 2. Verify JWT ────────────────────────────────
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // ─── 3. Get Course ID from Body ───────────────────
      const { courseId } = req.body;
      if (!courseId) {
        return res.status(400).json({ message: "Course ID is required" });
      }
  
      // ─── 4. Fetch Course with Instructor Only ─────────
      const course = await Course.findById(courseId).populate(
        "instructor",
        "username email"
      );
  
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
  
      // ─── 5. Extract User Progress and Completed Lessons ─────────────────────
      const userCourse = user.enrolledCourses.find(
        (ec) => ec.courseId.toString() === courseId.toString()
      );

      // Get completed lessons from course enrollment
      const courseEnrollment = course.enrolledStudents.find(
        (s) => s.studentId.toString() === user._id.toString()
      );

      const completedLessons = courseEnrollment
        ? courseEnrollment.completedLessons.map((cl) => ({
            lessonId: cl.lessonId,
            completedAt: cl.completedAt,
          }))
        : [];

      const userProgress = userCourse
        ? {
            progress: userCourse.progress || 0,
            completed: userCourse.completed || false,
            lastAccessed: userCourse.lastAccessed || null,
          }
        : { progress: 0, completed: false };
  
      // ─── 6. Build Module + Lesson Response ────────────
      const formattedModules = course.modules.map((mod) => ({
        title: mod.title,
        description: mod.description,
        order: mod.order,
        lessons: mod.lessons.map((lesson) => ({
          _id: lesson._id,
          title: lesson.title,
          videoUrl: resolveVideoUrl(lesson.videoUrl),
          duration: lesson.duration,
          order: lesson.order,
        })),
      }));
  
      // ─── 7. Final Response ────────────────────────────
      const response = {
        _id: course._id,
        title: course.title,
        description: course.description,
        category: course.category,
        level: course.level,
        duration: course.duration,
        thumbnail: resolveThumbnail(course.thumbnail),
        instructor: course.instructor,
        modules: formattedModules,
        userProgress,
        completedLessons,
      };
  
      res.status(200).json(response);
    } catch (error) {
        console.error("Get Course Error:", error.message);
        res.status(500).json({
            message: "Server error while fetching course details",
        });
    }
});


//
// ─── CREATE COURSE (ADMIN) ─────────────────────────────────────────
// @route   POST /api/courses
// @access  Private (Admin)
//
export const createCourse = asyncHandler(async (req, res) => {
    try {
        // Extract JWT
        let token = req.cookies?.jwt ||
            (req.headers.authorization?.startsWith("Bearer ")
                ? req.headers.authorization.split(" ")[1]
                : null);

        if (!token) return res.status(401).json({ message: "Not authorized, no token" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        // SAFE DEFAULTS
        const {
            title,
            description,
            category = "Other",
            level = "Beginner",
            duration = 0,
            thumbnail = "",
            price = 0,
            link = "",
            instructorName = user.name || user.username,
            language = "English",
            requirements = [],
            whatYouWillLearn = [],
            modules = []
        } = req.body;

        if (!title || !description)
            return res.status(400).json({ message: "Title and description are required" });

        const course = await Course.create({
            title,
            description,
            category,
            level,
            duration,
            thumbnail,
            price,
            link,
            instructorName,
            language,
            requirements,
            whatYouWillLearn,
            modules,
            instructor: user._id,
            published: false
        });

        res.status(201).json({
            success: true,
            message: "Course created successfully",
            course
        });

    } catch (error) {
        console.error("Create User Course Error:", error);
        res.status(500).json({
            message: "Server error while creating course",
            error: error.message
        });
    }
});
// export const createCourse = asyncHandler(async (req, res) => {
//     try {
//         // req.admin is set by protectAdmin middleware
//         if (!req.admin) {
//             return res.status(401).json({ message: "Not authorized as admin" });
//         }

//         const { 
//             title, 
//             description, 
//             category, 
//             level, 
//             duration, 
//             thumbnail,
//             price,
//             link,
//             instructorName,
//             language,
//             requirements,
//             whatYouWillLearn
//         } = req.body;

//         if (!title || !description) {
//             return res.status(400).json({ message: "Title and description are required" });
//         }

//         // Use admin as instructor
//         const course = await Course.create({
//             title,
//             description,
//             category: category || "Other",
//             level: level || "Beginner",
//             duration: duration || 0,
//             thumbnail: thumbnail || "",
//             price: price || 0,
//             link: link || "",
//             instructorName: instructorName || req.admin.fullName || req.admin.username,
//             language: language || "English",
//             requirements: requirements || [],
//             whatYouWillLearn: whatYouWillLearn || [],
//             instructor: req.admin._id, // Store admin ID as instructor
//             published: true, // Auto-publish courses created by admin
//         });

//         res.status(201).json({
//             success: true,
//             message: "Course created successfully",
//             course
//         });
//     } catch (error) {
//         console.error("Create Course Error:", error.message);
//         res.status(500).json({ message: "Server error while creating course", error: error.message });
//     }
// });
//
// ─── UPDATE COURSE ────────────────────────────────────────────────
// @route   PUT /api/courses/:id
// @access  Private (Admin)
//
export const updateCourse = asyncHandler(async (req, res) => {
    try {
        // req.admin is set by protectAdmin middleware
        if (!req.admin) {
            return res.status(401).json({ message: "Not authorized as admin" });
        }

        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        // Check if admin is the instructor or has permission
        if (course.instructor.toString() !== req.admin._id.toString()) {
            return res.status(403).json({ message: "Not authorized to update this course" });
        }

        const {
            title,
            description,
            category,
            level,
            duration,
            thumbnail,
            price,
            link,
            instructorName,
            language,
            requirements,
            whatYouWillLearn
        } = req.body;

        // Update fields
        if (title) course.title = title;
        if (description) course.description = description;
        if (category) course.category = category;
        if (level) course.level = level;
        if (duration !== undefined) course.duration = duration;
        if (thumbnail !== undefined) course.thumbnail = thumbnail;
        if (price !== undefined) course.price = price;
        if (link !== undefined) course.link = link;
        if (instructorName !== undefined) course.instructorName = instructorName;
        if (language !== undefined) course.language = language;
        if (requirements !== undefined) course.requirements = Array.isArray(requirements) ? requirements : [];
        if (whatYouWillLearn !== undefined) course.whatYouWillLearn = Array.isArray(whatYouWillLearn) ? whatYouWillLearn : [];

        await course.save();

        res.status(200).json({ message: "Course updated successfully", course });
    } catch (error) {
        console.error("Update Course Error:", error.message);
        res.status(500).json({ message: "Server error while updating course" });
    }
});

//
// ─── DELETE COURSE ────────────────────────────────────────────────
// @route   DELETE /api/courses/:id
// @access  Private (Admin)
//
export const deleteCourse = asyncHandler(async (req, res) => {
    try {
        // req.admin is set by protectAdmin middleware
        if (!req.admin) {
            return res.status(401).json({ message: "Not authorized as admin" });
        }

        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        // Check if admin is the instructor or has permission
        if (course.instructor.toString() !== req.admin._id.toString()) {
            return res.status(403).json({ message: "Not authorized to delete this course" });
        }

        await course.deleteOne();
        res.status(200).json({ message: "Course deleted successfully" });
    } catch (error) {
        console.error("Delete Course Error:", error.message);
        res.status(500).json({ message: "Server error while deleting course" });
    }
});

//
// ─── ENROLL STUDENT IN COURSE ─────────────────────────────────────
// @route   POST /api/courses/:id/enroll
// @access  Private (Student)
//
export const enrollInCourse = asyncHandler(async (req, res) => {
    try {
        // ─── 1. Extract JWT ───────────────────────────────
        let token;

        if (req.cookies && req.cookies.jwt) {
            token = req.cookies.jwt;
        } else if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer ")
        ) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({ message: "Not authorized, no token" });
        }

        // ─── 2. Verify Token ──────────────────────────────
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // ─── 3. Fetch User ────────────────────────────────
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // ─── 4. Get Course ID from Body ───────────────────
        const { courseId } = req.body;
        if (!courseId) {
            return res.status(400).json({ message: "Course ID is required" });
        }

        // ─── 5. Find Course ───────────────────────────────
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        // ─── 6. Check if Already Enrolled ─────────────────
        const alreadyEnrolled = course.enrolledStudents.some(
            (s) => s.studentId.toString() === user._id.toString()
        );
        if (alreadyEnrolled) {
            return res.status(400).json({ message: "Already enrolled in this course" });
        }

        // ─── 7. Add Enrollment ────────────────────────────
        course.enrolledStudents.push({ studentId: user._id });
        await course.save();

        user.enrolledCourses.push({
            courseId: course._id,
            title: course.title,
        });
        await user.save();

        // ─── 8. Response ──────────────────────────────────
        res.status(200).json({
            message: `Successfully enrolled in "${course.title}"`,
            courseId: course._id,
            userId: user._id,
        });
    } catch (error) {
        console.error("Enrollment Error:", error.message);
        res.status(401).json({ message: "Invalid or expired token" });
    }
});


//
// ─── GET ENROLLED COURSES AND CREATED COURSES OF A STUDENT ─────────────────────────────
// @route   GET /api/courses/my
// @access  Private (Student)
//
export const getMyCourses = asyncHandler(async (req, res) => {
    console.log('Request Recieved')
    try {
        // ─── 1. Extract JWT from cookies or headers ─────────────────────────────
        let token;

        if (req.cookies && req.cookies.jwt) {
            token = req.cookies.jwt;
        } else if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer ")
        ) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({ message: "Not authorized, no token" });
        }

        // ─── 2. Verify JWT and get user ─────────────────────────────────────────
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).populate(
            "enrolledCourses.courseId"
        );

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // ─── 3. Get Enrolled Courses ───────────────────────────────────────────
        const enrolledCourses = user.enrolledCourses.map((ec) => ({
            _id: ec.courseId?._id,
            title: ec.courseId?.title,
            description: ec.courseId?.description,
            progress: ec.progress || 0,
            completed: ec.completed || false,
            thumbnail: resolveThumbnail(ec.courseId?.thumbnail),
            isCreatedByMe: false, // Mark as enrolled course
        }));

        // ─── 4. Get Courses Created by User ─────────────────────────────────────
        const createdCourses = await Course.find({ instructor: user._id })
            .select("title description thumbnail duration modules")
            .lean();

        const formattedCreatedCourses = createdCourses.map((course) => ({
            _id: course._id,
            title: course.title,
            description: course.description,
            progress: 0, // User-created courses start at 0% progress
            completed: false,
            thumbnail: resolveThumbnail(course.thumbnail),
            isCreatedByMe: true, // Mark as created by user
        }));

        // ─── 5. Combine and Remove Duplicates ───────────────────────────────────
        // Use a Map to avoid duplicates (in case user enrolled in their own course)
        const coursesMap = new Map();
        
        // Add enrolled courses first
        enrolledCourses.forEach(course => {
            if (course._id) {
                coursesMap.set(course._id.toString(), course);
            }
        });

        // Add created courses (will override if user also enrolled in their own course)
        formattedCreatedCourses.forEach(course => {
            if (course._id) {
                coursesMap.set(course._id.toString(), course);
            }
        });

        // ─── 6. Convert Map to Array and Respond ────────────────────────────────
        const allCourses = Array.from(coursesMap.values());
        res.status(200).json(allCourses);
    } catch (error) {
        console.error("My Courses Error:", error.message);
        res
            .status(500)
            .json({ message: "Server error while fetching enrolled courses" });
    }
});

//
// ─── GET MY CREATED COURSES (ADMIN OR USER) ─────────────────────────────
// @route   GET /api/courses/my-created (Admin) or /api/courses/my-created-user (User)
// @access  Private (Admin or User)
//
export const getMyCreatedCourses = asyncHandler(async (req, res) => {
    try {
        let instructorId = null;

        // Check if admin is making the request (req.admin is set by protectAdmin middleware)
        if (req.admin) {
            instructorId = req.admin._id;
        } 
        // Check if user is making the request
        else {
            let token;
            if (req.cookies && req.cookies.jwt) {
                token = req.cookies.jwt;
            } else if (
                req.headers.authorization &&
                req.headers.authorization.startsWith("Bearer ")
            ) {
                token = req.headers.authorization.split(" ")[1];
            }

            if (!token) {
                return res.status(401).json({ message: "Not authorized, no token" });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId);
            
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            
            instructorId = user._id;
        }

        if (!instructorId) {
            return res.status(401).json({ message: "Not authorized" });
        }

        // Fetch courses created by this instructor
        const courses = await Course.find({ instructor: instructorId })
            .select("title description category level thumbnail averageRating duration instructor price link instructorName language requirements whatYouWillLearn published enrolledStudents")
            .populate("instructor", "username email fullName");

        const formattedCourses = courses.map(course => ({
            _id: course._id,
            title: course.title,
            description: course.description,
            category: course.category,
            level: course.level,
            thumbnail: resolveThumbnail(course.thumbnail),
            averageRating: course.averageRating,
            duration: course.duration,
            instructor: course.instructor,
            instructorName: course.instructorName,
            language: course.language,
            price: course.price,
            link: course.link,
            requirements: course.requirements,
            whatYouWillLearn: course.whatYouWillLearn,
            published: course.published !== false,
            enrolledStudents: course.enrolledStudents || [],
        }));

        res.status(200).json(formattedCourses);
    } catch (error) {
        console.error("Get My Created Courses Error:", error.message);
        res.status(500).json({ message: "Server error while fetching created courses" });
    }
});

//
// ─── CREATE COURSE (USER) ─────────────────────────────────────────
// @route   POST /api/courses/user
// @access  Private (User)
//
export const createUserCourse = asyncHandler(async (req, res) => {
    try {
        // Extract JWT
        let token;
        if (req.cookies && req.cookies.jwt) {
            token = req.cookies.jwt;
        } else if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer ")
        ) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({ message: "Not authorized, no token" });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const { 
            title, 
            description, 
            category, 
            level, 
            duration, 
            thumbnail,
            price,
            link,
            instructorName,
            language,
            requirements,
            whatYouWillLearn,
            modules
        } = req.body;

        if (!title || !description) {
            return res.status(400).json({ message: "Title and description are required" });
        }

        // Create course with user as instructor
        const course = await Course.create({
            title,
            description,
            category: category || "Other",
            level: level || "Beginner",
            duration: duration || 0,
            thumbnail: thumbnail || "",
            price: price || 0,
            link: link || "",
            instructorName: instructorName || user.name || user.username,
            language: language || "English",
            requirements: requirements || [],
            whatYouWillLearn: whatYouWillLearn || [],
            modules: modules || [],
            instructor: user._id, // Store user ID as instructor
            published: false, // User-created courses are private by default
        });

        res.status(201).json({
            success: true,
            message: "Course created successfully",
            course
        });
    } catch (error) {
        console.error("Create User Course Error:", error.message);
        res.status(500).json({ message: "Server error while creating course", error: error.message });
    }
});


//
// ─── TRACK COURSE ACCESS ─────────────────────────────────────────────
// @route   POST /api/courses/:id/access
// @access  Private (Student)
//
export const trackCourseAccess = asyncHandler(async (req, res) => {
    try {
        // Extract JWT
        let token;
        if (req.cookies && req.cookies.jwt) {
            token = req.cookies.jwt;
        } else if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer ")
        ) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({ message: "Not authorized, no token" });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const courseId = req.params.id;
        const course = await Course.findById(courseId);

        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        // Check if student is enrolled
        const isEnrolled = user.enrolledCourses.some(
            (ec) => ec.courseId && ec.courseId.toString() === courseId
        );

        if (!isEnrolled) {
            return res.status(403).json({
                message: "You are not enrolled in this course",
            });
        }

        // Update lastAccessed in user's enrolledCourses
        const enrolledCourse = user.enrolledCourses.find(
            (ec) => ec.courseId && ec.courseId.toString() === courseId
        );

        if (enrolledCourse) {
            enrolledCourse.lastAccessed = new Date();
            await user.save();
        }

        // Update lastAccessed in course's enrolledStudents
        const courseEnrollment = course.enrolledStudents.find(
            (s) => s.studentId.toString() === user._id.toString()
        );

        if (courseEnrollment) {
            courseEnrollment.lastAccessed = new Date();
            await course.save();
        }

        res.status(200).json({
            success: true,
            message: "Course access tracked",
        });
    } catch (error) {
        console.error("Track Course Access Error:", error.message);
        res.status(500).json({
            message: "Server error while tracking course access",
        });
    }
});

//
// ─── MARK LESSON AS COMPLETED ─────────────────────────────────────────
// @route   POST /api/courses/:id/complete-lesson
// @access  Private (Student)
//
export const completeLesson = asyncHandler(async (req, res) => {
    try {
        // Extract JWT
        let token;
        if (req.cookies && req.cookies.jwt) {
            token = req.cookies.jwt;
        } else if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer ")
        ) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({ message: "Not authorized, no token" });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const courseId = req.params.id;
        const { lessonId, videoUrl } = req.body;

        if (!lessonId && !videoUrl) {
            return res.status(400).json({
                message: "Lesson ID or video URL is required",
            });
        }

        const course = await Course.findById(courseId);

        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        // Check if student is enrolled
        const isEnrolled = user.enrolledCourses.some(
            (ec) => ec.courseId && ec.courseId.toString() === courseId
        );

        if (!isEnrolled) {
            return res.status(403).json({
                message: "You are not enrolled in this course",
            });
        }

        // Find lesson by ID or videoUrl
        let targetLessonId = lessonId;
        if (!targetLessonId && videoUrl) {
            // Find lesson by videoUrl
            for (const module of course.modules) {
                for (const lesson of module.lessons) {
                    if (lesson.videoUrl === videoUrl) {
                        targetLessonId = lesson._id;
                        break;
                    }
                }
                if (targetLessonId) break;
            }
        }

        if (!targetLessonId) {
            return res.status(404).json({ message: "Lesson not found" });
        }

        // Check if already completed
        const courseEnrollment = course.enrolledStudents.find(
            (s) => s.studentId.toString() === user._id.toString()
        );

        if (!courseEnrollment) {
            return res.status(404).json({
                message: "Enrollment not found",
            });
        }

        const alreadyCompleted = courseEnrollment.completedLessons.some(
            (l) => l.lessonId && l.lessonId.toString() === targetLessonId.toString()
        );

        let xpGained = 0;
        let progressBefore = courseEnrollment.progress;

        if (!alreadyCompleted) {
            // Mark lesson as completed
            course.markLessonCompleted(user._id, targetLessonId);
            await course.save();

            // Refresh course enrollment to get updated progress
            await course.populate('enrolledStudents.studentId');
            const updatedEnrollment = course.enrolledStudents.find(
                (s) => s.studentId.toString() === user._id.toString()
            );

            // Update user's enrolledCourses progress
            const userEnrolledCourse = user.enrolledCourses.find(
                (ec) => ec.courseId && ec.courseId.toString() === courseId
            );

            if (userEnrolledCourse && updatedEnrollment) {
                userEnrolledCourse.progress = Math.round(updatedEnrollment.progress);
                userEnrolledCourse.completed = updatedEnrollment.completed || false;
                await user.save();
            }

            // Award XP (base 10 XP per lesson, bonus for completion)
            xpGained = 10;
            if (updatedEnrollment && updatedEnrollment.completed) {
                xpGained += 50; // Bonus for completing entire course
            }

            user.addXP(xpGained);
            
            // Add to XP history for dashboard charts
            if (!user.xpHistory) user.xpHistory = [];
            user.xpHistory.push({
                date: new Date(),
                reason: `Lesson: ${course.title}`,
                amount: xpGained,
            });
            
            await user.save();
        }

        // Get updated progress
        const progressAfter = courseEnrollment.progress;

        res.status(200).json({
            success: true,
            message: alreadyCompleted
                ? "Lesson already completed"
                : "Lesson marked as completed",
            xpGained: alreadyCompleted ? 0 : xpGained,
            progress: progressAfter,
            progressBefore: progressBefore,
            completed: courseEnrollment.completed,
        });
    } catch (error) {
        console.error("Complete Lesson Error:", error.message);
        res.status(500).json({
            message: "Server error while completing lesson",
        });
    }
});

export const autoCreateCourse = async (req, res) => {
    try {
        const { topic, category = "General", level = "Beginner" } = req.body;
        if (!topic) return res.status(400).json({ error: "Topic is required" });

        // Try to identify the logged-in student (optional for backward compatibility)
        let user = null;
        let token;

        if (req.cookies && req.cookies.jwt) {
            token = req.cookies.jwt;
        } else if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer ")
        ) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                user = await User.findById(decoded.userId);
            } catch (authError) {
                console.warn("Auto course generation auth failed:", authError.message);
            }
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // Prompt (kept small to avoid overload)
        const prompt = `
You are an expert e-learning content creator.
Generate a small sample online course (for demo) using the topic below.

Topic: "${topic}"
Category: "${category}"
Level: "${level}"

⚙️ Rules:
- Only 1–2 modules total.
- Each module has 1–2 lessons.
- Use real YouTube video links related to each lesson topic.
- Keep content concise and realistic for an online course.
- Return ONLY valid JSON, no markdown or explanations.

JSON structure:
{
  "title": "string",
  "description": "string",
  "thumbnail": "https://example.com/image.jpg",
  "modules": [
    {
      "title": "string",
      "description": "string",
      "order": 1,
      "lessons": [
        {
          "title": "string",
          "videoUrl": "https://www.youtube.com/watch?v=REAL_VIDEO_ID",
          "content": "string",
          "duration": 8,
          "order": 1
        }
      ]
    }
  ],
  "tags": ["string", "string"]
}

Output only JSON, nothing else.
`;

        // Ask Gemini to generate
        const result = await model.generateContent(prompt);
        let rawText = "";
        console.log("Result", result)
        try {
            rawText = (await result.response.text()).trim();
        } catch {
            rawText = result.response?.text?.trim?.() || "";
        }

        // Helper: extract JSON safely
        const extractJson = (text) => {
            const match = text.match(/({[\s\S]*})/);
            return match ? match[1] : text;
        };

        let candidate = extractJson(rawText);
        let parsed;
        try {
            parsed = JSON.parse(candidate);
        } catch {
            try {
                parsed = JSON5.parse(candidate);
            } catch {
                console.error("❌ Gemini invalid JSON:", rawText);
                return res.status(500).json({
                    error: "Invalid JSON output from Gemini",
                    raw: rawText,
                });
            }
        }

        // Sanitize & default values
        parsed.modules = Array.isArray(parsed.modules) ? parsed.modules : [];
        parsed.modules.forEach((m, i) => {
            m.order = m.order || i + 1;
            m.lessons = Array.isArray(m.lessons) ? m.lessons : [];
            m.lessons.forEach((l, j) => {
                l.order = l.order || j + 1;
                l.duration = l.duration || 8;
                if (typeof l.videoUrl !== "string") l.videoUrl = "";
            });
        });

        // Save to DB
        const newCourse = new Course({
            title: parsed.title || topic,
            description: parsed.description || "",
            category,
            level,
            thumbnail: parsed.thumbnail || "",
            modules: parsed.modules,
            tags: parsed.tags || [topic],
            published: false,
            instructor: user?._id,
            instructorName: user?.name || user?.username || "AI Course Builder",
            enrolledStudents: user
                ? [
                    {
                        studentId: user._id,
                    },
                ]
                : [],
        });

        await newCourse.save();

        // Automatically enroll the creator so the course appears under "My Learning"
        if (user) {
            const alreadyEnrolled = user.enrolledCourses.some(
                (ec) => ec.courseId && ec.courseId.toString() === newCourse._id.toString()
            );

            if (!alreadyEnrolled) {
                user.enrolledCourses.push({
                    courseId: newCourse._id,
                    title: newCourse.title,
                    progress: 0,
                    completed: false,
                });
                await user.save();
            }
        }

        res.status(201).json({
            message: "✅ Course generated successfully using Gemini 2.5 Flash",
            course: newCourse,
        });
    } catch (error) {
        console.error("❌ Course Generation Error:", error);
        res.status(500).json({ error: "Failed to generate course", details: error.message });
    }
};

export const getPlaylistVideos = async (req, res) => {
    try {
        const { playlistUrl, title, description, category = "Other", level = "Beginner" } = req.body;
        const apiKey = process.env.YOUTUBE_API_KEY;
        let token;
        let user = null;

        if (req.cookies && req.cookies.jwt) {
            token = req.cookies.jwt;
        } else if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer ")
        ) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                user = await User.findById(decoded.userId);
            } catch (authError) {
                console.warn("Playlist course generation auth failed:", authError.message);
            }
        }

        if (!playlistUrl)
            return res.status(400).json({ error: "Playlist URL is required" });
        if (!apiKey)
            return res.status(500).json({ error: "Missing YOUTUBE_API_KEY in .env" });

        // ─── Extract playlist ID ───────────────────────────────
        const idMatch = playlistUrl.match(/[?&]list=([a-zA-Z0-9_-]+)/);
        const playlistId = idMatch ? idMatch[1] : playlistUrl;

        let nextPageToken = "";
        const videos = [];

        // ─── Fetch playlist videos (with snippet for title & thumbnails) ───
        do {
            const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${playlistId}&key=${apiKey}${nextPageToken ? `&pageToken=${nextPageToken}` : ""
                }`;

            const response = await axios.get(url);
            const items = response.data.items || [];

            for (const item of items) {
                const videoId = item.contentDetails?.videoId;
                if (videoId) {
                    videos.push({
                        videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
                        title: item.snippet?.title || `Lesson ${videos.length + 1}`,
                        thumbnail:
                            item.snippet?.thumbnails?.high?.url ||
                            item.snippet?.thumbnails?.default?.url ||
                            "",
                        description: item.snippet?.description || "",
                    });
                }
            }

            nextPageToken = response.data.nextPageToken;
        } while (nextPageToken);

        if (videos.length === 0)
            return res.status(404).json({ error: "No videos found in this playlist" });

        // ─── Group videos: 3 per module ─────────────────────────
        const modules = [];
        let moduleCount = 0;

        for (let i = 0; i < videos.length; i += 3) {
            const chunk = videos.slice(i, i + 3);
            moduleCount++;

            const lessons = chunk.map((v, index) => ({
                title: v.title,
                videoUrl: v.videoUrl,
                content: v.description || "No description available.",
                duration: 10, // placeholder (can use YouTube videos.list API for real durations)
                order: index + 1,
            }));

            modules.push({
                title: `Module ${moduleCount}`,
                description: `Covers lessons ${i + 1} to ${i + chunk.length}.`,
                lessons,
                order: moduleCount,
            });
        }

        // ─── Build course object ───────────────────────────────
        const newCourse = new Course({
            title: title || `Course from YouTube Playlist`,
            description:
                description ||
                `Automatically created from playlist: ${playlistUrl}`,
            category,
            level,
            thumbnail: videos[0]?.thumbnail || "",
            modules,
            tags: ["YouTube", "AutoGenerated", category],
            published: false,
            instructor: user?._id,
            instructorName: user?.name || user?.username || "Playlist Importer",
            enrolledStudents: user
                ? [
                    {
                        studentId: user._id,
                    },
                ]
                : [],
        });

        await newCourse.save();

        if (user) {
            const alreadyEnrolled = user.enrolledCourses.some(
                (ec) => ec.courseId && ec.courseId.toString() === newCourse._id.toString()
            );

            if (!alreadyEnrolled) {
                user.enrolledCourses.push({
                    courseId: newCourse._id,
                    title: newCourse.title,
                    progress: 0,
                    completed: false,
                });
                await user.save();
            }
        }
        
        res.status(201).json({
            message: "✅ Course created successfully from playlist",
            totalVideos: videos.length,
            totalModules: modules.length,
            course: newCourse,
        });
    } catch (error) {
        console.error("❌ Error creating course from playlist:", error.message);
        res.status(500).json({ error: "Failed to create course from playlist"         });
    }
};
