import asyncHandler from "express-async-handler";
import Assignment from "../Models/Assignment.js";
import Course from "../Models/Course.js";
import User from "../Models/User.js";
import Admin from "../Models/Admin.js";
import jwt from "jsonwebtoken";
import { GoogleGenerativeAI } from "@google/generative-ai";

//
// ─── CREATE ASSIGNMENT (ADMIN) ─────────────────────────────────────────
// @route   POST /api/assignments
// @access  Private (Admin)
//
export const createAssignment = asyncHandler(async (req, res) => {
  try {
    // req.admin is set by protectAdmin middleware
    if (!req.admin) {
      return res.status(401).json({ message: "Not authorized as admin" });
    }

    const {
      title,
      description,
      courseId,
      module,
      videoUrl,
      questions,
      dueDate,
      allowLateSubmission,
      latePenalty,
      published,
    } = req.body;

    if (!title || !courseId || !dueDate) {
      return res.status(400).json({
        message: "Title, course ID, and due date are required",
      });
    }

    if (!questions || !Array.isArray(questions) || questions.length < 2) {
      return res.status(400).json({
        message: "At least 2 questions are required",
      });
    }

    // Verify course exists and admin is the instructor
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (course.instructor.toString() !== req.admin._id.toString()) {
      return res.status(403).json({
        message: "Not authorized to create assignments for this course",
      });
    }

    // Create assignment
    const assignment = await Assignment.create({
      title,
      description: description || "",
      course: courseId,
      module: module || "",
      videoUrl: videoUrl || "",
      questions: questions.map((q, index) => ({
        questionText: q.questionText,
        questionType: q.questionType || "text",
        marks: q.marks || 1,
        required: q.required !== false,
        order: index,
      })),
      dueDate: new Date(dueDate),
      allowLateSubmission: allowLateSubmission || false,
      latePenalty: latePenalty || 0,
      createdBy: req.admin._id,
      published: published !== false,
    });

    // Add assignment to course
    course.assignments.push({
      assignmentId: assignment._id,
      title: assignment.title,
      dueDate: assignment.dueDate,
    });
    await course.save();

    res.status(201).json({
      success: true,
      message: "Assignment created successfully",
      assignment,
    });
  } catch (error) {
    console.error("Create Assignment Error:", error.message);
    res.status(500).json({
      message: "Server error while creating assignment",
      error: error.message,
    });
  }
});

//
// ─── UPDATE ASSIGNMENT (ADMIN) ─────────────────────────────────────────
// @route   PUT /api/assignments/:id
// @access  Private (Admin)
//
export const updateAssignment = asyncHandler(async (req, res) => {
  try {
    if (!req.admin) {
      return res.status(401).json({ message: "Not authorized as admin" });
    }

    const assignmentId = req.params.id;
    const {
      title,
      description,
      module,
      videoUrl,
      questions,
      dueDate,
      allowLateSubmission,
      latePenalty,
      published,
    } = req.body;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    // Verify admin is the instructor
    const course = await Course.findById(assignment.course);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (course.instructor.toString() !== req.admin._id.toString()) {
      return res.status(403).json({
        message: "Not authorized to update this assignment",
      });
    }

    // Update assignment fields
    if (title !== undefined) assignment.title = title;
    if (description !== undefined) assignment.description = description;
    if (module !== undefined) assignment.module = module;
    if (videoUrl !== undefined) assignment.videoUrl = videoUrl;
    if (dueDate !== undefined) assignment.dueDate = new Date(dueDate);
    if (allowLateSubmission !== undefined) assignment.allowLateSubmission = allowLateSubmission;
    if (latePenalty !== undefined) assignment.latePenalty = latePenalty;
    if (published !== undefined) assignment.published = published;

    // Update questions if provided
    if (questions && Array.isArray(questions) && questions.length >= 2) {
      assignment.questions = questions.map((q, index) => ({
        questionText: q.questionText,
        questionType: q.questionType || "text",
        marks: q.marks || 1,
        required: q.required !== false,
        order: index,
      }));
      // Recalculate total marks
      assignment.totalMarks = assignment.questions.reduce((sum, q) => sum + (q.marks || 0), 0);
    }

    await assignment.save();

    res.status(200).json({
      success: true,
      message: "Assignment updated successfully",
      assignment,
    });
  } catch (error) {
    console.error("Update Assignment Error:", error.message);
    res.status(500).json({
      message: "Server error while updating assignment",
      error: error.message,
    });
  }
});

//
// ─── GET SINGLE ASSIGNMENT BY ID (ADMIN) ─────────────────────────────
// @route   GET /api/assignments/:id
// @access  Private (Admin)
//
export const getAssignmentById = asyncHandler(async (req, res) => {
  try {
    if (!req.admin) {
      return res.status(401).json({ message: "Not authorized as admin" });
    }

    const assignmentId = req.params.id;
    const assignment = await Assignment.findById(assignmentId)
      .populate("course", "title")
      .select("title description course module questions dueDate allowLateSubmission latePenalty published videoUrl");

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    // Verify admin is the instructor
    const course = await Course.findById(assignment.course);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (course.instructor.toString() !== req.admin._id.toString()) {
      return res.status(403).json({
        message: "Not authorized to view this assignment",
      });
    }

    res.status(200).json({
      success: true,
      assignment: {
        _id: assignment._id,
        title: assignment.title,
        description: assignment.description,
        courseId: assignment.course._id,
        module: assignment.module,
        questions: assignment.questions.map((q) => ({
          _id: q._id,
          questionText: q.questionText,
          questionType: q.questionType,
          marks: q.marks,
          required: q.required,
        })),
        dueDate: assignment.dueDate,
        allowLateSubmission: assignment.allowLateSubmission,
        latePenalty: assignment.latePenalty,
        published: assignment.published,
        videoUrl: assignment.videoUrl || "",
      },
    });
  } catch (error) {
    console.error("Get Assignment By ID Error:", error.message);
    res.status(500).json({
      message: "Server error while fetching assignment",
    });
  }
});

//
// ─── GET ASSIGNMENTS FOR ADMIN COURSES ─────────────────────────────
// @route   GET /api/assignments/admin
// @access  Private (Admin)
//
export const getAdminAssignments = asyncHandler(async (req, res) => {
  try {
    if (!req.admin) {
      return res.status(401).json({ message: "Not authorized as admin" });
    }

    // Get all courses created by this admin
    const adminCourses = await Course.find({
      instructor: req.admin._id,
    }).select("_id");

    const courseIds = adminCourses.map((course) => course._id);

    // Get all assignments for these courses
    const assignments = await Assignment.find({
      course: { $in: courseIds },
    })
      .populate("course", "title")
      .populate("createdBy", "username fullName")
      .select(
        "title description course dueDate totalMarks questions published submissions createdAt"
      )
      .sort({ createdAt: -1 });

    // Format assignments with submission statistics
    const formattedAssignments = assignments.map((assignment) => {
      const totalStudents = assignment.submissions.length;
      const gradedCount = assignment.submissions.filter(
        (s) => s.status === "graded"
      ).length;
      const pendingCount = totalStudents - gradedCount;

      return {
        _id: assignment._id,
        title: assignment.title,
        description: assignment.description,
        course: assignment.course?.title || "Unknown Course",
        courseId: assignment.course?._id,
        dueDate: assignment.dueDate,
        totalMarks: assignment.totalMarks,
        questionsCount: assignment.questions.length,
        totalStudents,
        graded: gradedCount,
        pending: pendingCount,
        published: assignment.published,
        createdAt: assignment.createdAt,
      };
    });

    res.status(200).json({
      success: true,
      assignments: formattedAssignments,
      total: formattedAssignments.length,
    });
  } catch (error) {
    console.error("Get Admin Assignments Error:", error.message);
    res.status(500).json({
      message: "Server error while fetching assignments",
    });
  }
});

//
// ─── GET ASSIGNMENTS FOR STUDENT ───────────────────────────────────
// @route   GET /api/assignments/student
// @access  Private (Student)
//
// export const getStudentAssignments = asyncHandler(async (req, res) => {
//   try {
//     // Extract JWT
//     let token;
//     if (req.cookies && req.cookies.jwt) {
//       token = req.cookies.jwt;
//     } else if (
//       req.headers.authorization &&
//       req.headers.authorization.startsWith("Bearer ")
//     ) {
//       token = req.headers.authorization.split(" ")[1];
//     }

//     if (!token) {
//       return res.status(401).json({ message: "Not authorized, no token" });
//     }

//     // Verify token
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     const user = await User.findById(decoded.userId);

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // Get enrolled course IDs
//     const enrolledCourseIds = user.enrolledCourses
//       .map((ec) => ec.courseId)
//       .filter((id) => id != null); // Filter out null/undefined values

//     console.log(`📚 User ${user._id} enrolled in ${enrolledCourseIds.length} courses`);

//     if (enrolledCourseIds.length === 0) {
//       return res.status(200).json({
//         success: true,
//         assignments: [],
//         message: "No enrolled courses found",
//       });
//     }

//     // Get assignments for enrolled courses
//     const assignments = await Assignment.find({
//       course: { $in: enrolledCourseIds },
//       published: true,
//     })
//       .populate("course", "title")
//       .select(
//         "title description course dueDate totalMarks questions allowLateSubmission latePenalty submissions createdAt videoUrl"
//       )
//       .sort({ dueDate: 1 });

//     console.log(`📝 Found ${assignments.length} published assignments for user ${user._id}`);

//     // Format assignments with student submission status
//     const formattedAssignments = assignments.map((assignment) => {
//       const submission = assignment.submissions.find(
//         (s) => s.studentId.toString() === user._id.toString()
//       );

//       const isOverdue = new Date(assignment.dueDate) < new Date();
//       const isSubmitted = !!submission;
//       const isGraded = submission?.status === "graded";

//       return {
//         _id: assignment._id,
//         title: assignment.title,
//         description: assignment.description,
//         course: assignment.course?.title || "Unknown Course",
//         courseId: assignment.course?._id,
//         dueDate: assignment.dueDate,
//         totalMarks: assignment.totalMarks,
//         questionsCount: assignment.questions.length,
//         questions: assignment.questions.map((q) => ({
//           _id: q._id,
//           questionText: q.questionText,
//           questionType: q.questionType,
//           marks: q.marks,
//           required: q.required,
//           order: q.order,
//         })),
//         allowLateSubmission: assignment.allowLateSubmission,
//         latePenalty: assignment.latePenalty,
//         videoUrl: assignment.videoUrl || "",
//         isSubmitted,
//         isGraded,
//         isOverdue,
//         submission: submission
//           ? {
//               grade: submission.grade,
//               feedback: submission.feedback,
//               submittedAt: submission.submittedAt,
//               status: submission.status,
//             }
//           : null,
//       };
//     });

//     res.status(200).json({
//       success: true,
//       assignments: formattedAssignments,
//     });
//   } catch (error) {
//     console.error("Get Student Assignments Error:", error.message);
//     res.status(500).json({
//       message: "Server error while fetching assignments",
//     });
//   }
// });
export const getStudentAssignments = asyncHandler(async (req, res) => {
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // STRICT enrolled course IDs
    const enrolledCourseIds = user.enrolledCourses
      .map((ec) =>
        ec.courseId
          ? ec.courseId._id
            ? ec.courseId._id.toString()
            : ec.courseId.toString()
          : null
      )
      .filter((id) => id !== null);

    console.log("Student enrolled in:", enrolledCourseIds);

    if (enrolledCourseIds.length === 0) {
      return res.status(200).json({
        success: true,
        assignments: [],
        message: "No enrolled courses found",
      });
    }

    // ONLY assignments from enrolled courses
    const assignments = await Assignment.find({
      course: { $in: enrolledCourseIds },
      published: true,
    })
      .populate("course", "title")
      .select(
        "title description course dueDate totalMarks questions allowLateSubmission latePenalty submissions createdAt videoUrl"
      )
      .sort({ dueDate: 1 });

    // FORMAT ANSWERS WITH CORRECT FILTERING
    const formattedAssignments = assignments.map((assignment) => {
      const submission = assignment.submissions.find(
        (s) => s.studentId.toString() === user._id.toString()
      );

      const isOverdue = new Date(assignment.dueDate) < new Date();

      return {
        _id: assignment._id,
        title: assignment.title,
        description: assignment.description,
        course: assignment.course?.title || "Unknown Course",
        courseId: assignment.course?._id,
        dueDate: assignment.dueDate,
        totalMarks: assignment.totalMarks,
        questionsCount: assignment.questions.length,
        questions: assignment.questions.map((q) => ({
          _id: q._id,
          questionText: q.questionText,
          questionType: q.questionType,
          marks: q.marks,
          required: q.required,
          order: q.order,
        })),
        allowLateSubmission: assignment.allowLateSubmission,
        latePenalty: assignment.latePenalty,
        videoUrl: assignment.videoUrl || "",
        isSubmitted: !!submission,
        isGraded: submission?.status === "graded",
        isOverdue,
        submission: submission
          ? {
              grade: submission.grade,
              feedback: submission.feedback,
              submittedAt: submission.submittedAt,
              status: submission.status,
            }
          : null,
      };
    });

    return res.status(200).json({
      success: true,
      assignments: formattedAssignments,
    });
  } catch (error) {
    console.error("Get Student Assignments Error:", error.message);
    res.status(500).json({
      message: "Server error while fetching assignments",
    });
  }
});

//
// ─── SUBMIT ASSIGNMENT (STUDENT) ───────────────────────────────────
// @route   POST /api/assignments/:id/submit
// @access  Private (Student)
//
export const submitAssignment = asyncHandler(async (req, res) => {
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

    const { answers } = req.body;
    const assignmentId = req.params.id;

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        message: "Answers array is required",
      });
    }

    // Get assignment
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    // Check if student is enrolled in the course
    const isEnrolled = user.enrolledCourses.some(
      (ec) => ec.courseId.toString() === assignment.course.toString()
    );

    if (!isEnrolled) {
      return res.status(403).json({
        message: "You are not enrolled in this course",
      });
    }

    // Check if due date has passed
    const isOverdue = new Date(assignment.dueDate) < new Date();
    if (isOverdue && !assignment.allowLateSubmission) {
      return res.status(400).json({
        message: "Assignment due date has passed and late submissions are not allowed",
      });
    }

    // Format answers
    const formattedAnswers = answers.map((ans) => ({
      questionId: ans.questionId,
      answer: ans.answer,
      submittedAt: new Date(),
    }));

    // Add submission
    assignment.addSubmission(user._id, formattedAnswers);
    await assignment.save();

    res.status(200).json({
      success: true,
      message: "Assignment submitted successfully",
      submission: assignment.submissions.find(
        (s) => s.studentId.toString() === user._id.toString()
      ),
    });
  } catch (error) {
    console.error("Submit Assignment Error:", error.message);
    res.status(500).json({
      message: "Server error while submitting assignment",
    });
  }
});

//
// ─── GET ASSIGNMENT SUBMISSIONS FOR GRADING (ADMIN) ─────────────────
// @route   GET /api/assignments/:id/submissions
// @access  Private (Admin)
//
export const getAssignmentSubmissions = asyncHandler(async (req, res) => {
  try {
    if (!req.admin) {
      return res.status(401).json({ message: "Not authorized as admin" });
    }

    const assignmentId = req.params.id;

    const assignment = await Assignment.findById(assignmentId)
      .populate("course", "title")
      .populate("submissions.studentId", "username email")
      .populate("submissions.gradedBy", "username fullName");

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    // Verify admin is the instructor
    const course = await Course.findById(assignment.course);
    if (course.instructor.toString() !== req.admin._id.toString()) {
      return res.status(403).json({
        message: "Not authorized to view submissions for this assignment",
      });
    }

    // Format submissions
    const formattedSubmissions = assignment.submissions.map((submission) => ({
      _id: submission._id,
      student: {
        _id: submission.studentId._id,
        username: submission.studentId.username,
        email: submission.studentId.email,
      },
      answers: submission.answers,
      submittedAt: submission.submittedAt,
      status: submission.status,
      grade: submission.grade,
      totalMarks: submission.totalMarks,
      feedback: submission.feedback,
      gradedBy: submission.gradedBy
        ? {
            username: submission.gradedBy.username,
            fullName: submission.gradedBy.fullName,
          }
        : null,
      gradedAt: submission.gradedAt,
    }));

    res.status(200).json({
      success: true,
      assignment: {
        _id: assignment._id,
        title: assignment.title,
        description: assignment.description,
        course: assignment.course?.title,
        questions: assignment.questions,
        totalMarks: assignment.totalMarks,
        dueDate: assignment.dueDate,
      },
      submissions: formattedSubmissions,
    });
  } catch (error) {
    console.error("Get Assignment Submissions Error:", error.message);
    res.status(500).json({
      message: "Server error while fetching submissions",
    });
  }
});

//
// ─── GRADE ASSIGNMENT SUBMISSION (ADMIN) ────────────────────────────
// @route   PUT /api/assignments/:id/grade/:submissionId
// @access  Private (Admin)
//
export const gradeAssignment = asyncHandler(async (req, res) => {
  try {
    if (!req.admin) {
      return res.status(401).json({ message: "Not authorized as admin" });
    }

    const { assignmentId, submissionId } = req.params;
    const { grade, feedback } = req.body;

    if (grade === undefined || grade < 0) {
      return res.status(400).json({
        message: "Valid grade is required",
      });
    }

    const assignment = await Assignment.findById(assignmentId);

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    // Verify admin is the instructor
    const course = await Course.findById(assignment.course);
    if (course.instructor.toString() !== req.admin._id.toString()) {
      return res.status(403).json({
        message: "Not authorized to grade this assignment",
      });
    }

    // Find and grade the submission
    const submission = assignment.submissions.find(
      (s) => s._id.toString() === submissionId
    );

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    // Update submission
    submission.grade = grade;
    submission.feedback = feedback || "";
    submission.gradedBy = req.admin._id;
    submission.gradedAt = new Date();
    submission.status = "graded";

    await assignment.save();

    // Update user's assignment record
    const user = await User.findById(submission.studentId);
    if (user) {
      const assignmentIndex = user.assignments.findIndex(
        (a) => a.assignmentId && a.assignmentId.toString() === assignmentId
      );

      if (assignmentIndex >= 0) {
        user.assignments[assignmentIndex].grade = grade;
        user.assignments[assignmentIndex].feedback = feedback || "";
      } else {
        user.assignments.push({
          assignmentId: assignment._id,
          grade: grade,
          feedback: feedback || "",
        });
      }
      
      // Award XP based on grade (percentage of max grade)
      const maxGrade = assignment.totalMarks || 100;
      const gradePercentage = (grade / maxGrade) * 100;
      const xpGained = Math.round(gradePercentage * 0.5); // 0.5 XP per percentage point
      
      if (xpGained > 0) {
        user.addXP(xpGained);
        
        // Add to XP history for dashboard charts
        if (!user.xpHistory) user.xpHistory = [];
        user.xpHistory.push({
          date: new Date(),
          reason: `Assignment: ${assignment.title}`,
          amount: xpGained,
        });
      }
      
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: "Assignment graded successfully",
      submission: assignment.submissions.find(
        (s) => s._id.toString() === submissionId
      ),
    });
  } catch (error) {
    console.error("Grade Assignment Error:", error.message);
    res.status(500).json({
      message: "Server error while grading assignment",
    });
  }
});

//
// ─── AI GRADE ASSIGNMENT SUBMISSION (GEMINI) ────────────────────────────
// @route   POST /api/assignments/:assignmentId/ai-grade/:submissionId
// @access  Private (Admin)
//
export const aiGradeAssignment = asyncHandler(async (req, res) => {
  try {
    if (!req.admin) {
      return res.status(401).json({ message: "Not authorized as admin" });
    }

    const { assignmentId, submissionId } = req.params;

    const assignment = await Assignment.findById(assignmentId)
      .populate("course", "title");

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    // Verify admin is the instructor
    const course = await Course.findById(assignment.course);
    if (course.instructor.toString() !== req.admin._id.toString()) {
      return res.status(403).json({
        message: "Not authorized to grade this assignment",
      });
    }

    // Find the submission
    const submission = assignment.submissions.find(
      (s) => s._id.toString() === submissionId
    );

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    // Check if Gemini API key is available
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        message: "Gemini API key not configured. Please contact administrator.",
      });
    }

    // Prepare questions and answers for AI grading
    const questionsWithAnswers = assignment.questions.map((question) => {
      const answer = submission.answers.find(
        (a) => a.questionId && a.questionId.toString() === question._id.toString()
      );
      return {
        questionText: question.questionText,
        questionType: question.questionType,
        maxMarks: question.marks,
        studentAnswer: answer ? answer.answer : "No answer provided",
      };
    });

    // Build prompt for Gemini
    const prompt = `You are an expert educator grading a student's assignment. Please evaluate each question and answer carefully.

ASSIGNMENT: ${assignment.title}
${assignment.description ? `DESCRIPTION: ${assignment.description}` : ''}

QUESTIONS AND ANSWERS:
${questionsWithAnswers
  .map(
    (qa, index) => `
Question ${index + 1} (${qa.maxMarks} marks):
Type: ${qa.questionType}
Question: ${qa.questionText}
Student Answer: ${qa.studentAnswer}
`
  )
  .join("\n")}

TOTAL MARKS: ${assignment.totalMarks}

Please provide a detailed evaluation in the following JSON format:
{
  "totalGrade": <number between 0 and ${assignment.totalMarks}>,
  "questionGrades": [
    {
      "questionNumber": 1,
      "marksAwarded": <number between 0 and maxMarks>,
      "feedback": "<detailed feedback explaining what was correct, incorrect, or could be improved>"
    },
    ...
  ],
  "overallFeedback": "<comprehensive feedback on the entire submission, highlighting strengths and areas for improvement>"
}

Be fair but thorough. Award partial marks when appropriate. Provide constructive feedback that helps the student learn.`;

    try {
      // Initialize Gemini
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      console.log("🤖 Sending assignment to Gemini for grading...");
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const textResponse = response.text();

      // Parse JSON from response
      let gradingResult;
      try {
        // Extract JSON from response (handle markdown code blocks)
        const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          gradingResult = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON found in response");
        }
      } catch (parseError) {
        console.error("Failed to parse Gemini response:", textResponse);
        return res.status(500).json({
          message: "Failed to parse AI grading response. Please try manual grading.",
          rawResponse: textResponse.substring(0, 500), // First 500 chars for debugging
        });
      }

      // Validate grading result
      if (
        !gradingResult.totalGrade ||
        typeof gradingResult.totalGrade !== "number" ||
        gradingResult.totalGrade < 0 ||
        gradingResult.totalGrade > assignment.totalMarks
      ) {
        return res.status(500).json({
          message: "Invalid grade returned by AI. Please try manual grading.",
        });
      }

      // Combine feedback from all questions
      const questionFeedbacks = gradingResult.questionGrades
        ? gradingResult.questionGrades
            .map(
              (qg) =>
                `Question ${qg.questionNumber}: ${qg.marksAwarded}/${questionsWithAnswers[qg.questionNumber - 1]?.maxMarks || 0} marks\n${qg.feedback || ""}`
            )
            .join("\n\n")
        : "";

      const combinedFeedback = `${gradingResult.overallFeedback || ""}\n\n${questionFeedbacks}`.trim();

      // Update submission with AI grade
      submission.grade = Math.round(gradingResult.totalGrade);
      submission.feedback = combinedFeedback;
      submission.gradedBy = req.admin._id;
      submission.gradedAt = new Date();
      submission.status = "graded";

      await assignment.save();

      // Update user's assignment record
      const user = await User.findById(submission.studentId);
      if (user) {
        const assignmentIndex = user.assignments.findIndex(
          (a) => a.assignmentId && a.assignmentId.toString() === assignmentId
        );

        if (assignmentIndex >= 0) {
          user.assignments[assignmentIndex].grade = submission.grade;
          user.assignments[assignmentIndex].feedback = submission.feedback;
        } else {
          user.assignments.push({
            assignmentId: assignment._id,
            grade: submission.grade,
            feedback: submission.feedback,
          });
        }
        
        // Award XP based on grade (percentage of max grade)
        const maxGrade = assignment.totalMarks || 100;
        const gradePercentage = (submission.grade / maxGrade) * 100;
        const xpGained = Math.round(gradePercentage * 0.5); // 0.5 XP per percentage point
        
        if (xpGained > 0) {
          user.addXP(xpGained);
          
          // Add to XP history for dashboard charts
          if (!user.xpHistory) user.xpHistory = [];
          user.xpHistory.push({
            date: new Date(),
            reason: `Assignment: ${assignment.title}`,
            amount: xpGained,
          });
        }
        
        await user.save();
      }

      res.status(200).json({
        success: true,
        message: "Assignment graded successfully by AI",
        submission: submission,
        aiGrading: {
          totalGrade: gradingResult.totalGrade,
          questionGrades: gradingResult.questionGrades,
          overallFeedback: gradingResult.overallFeedback,
        },
      });
    } catch (geminiError) {
      console.error("Gemini AI Grading Error:", geminiError.message);
      res.status(500).json({
        message: "AI grading failed. Please try manual grading.",
        error: geminiError.message,
      });
    }
  } catch (error) {
    console.error("AI Grade Assignment Error:", error.message);
    res.status(500).json({
      message: "Server error while AI grading assignment",
    });
  }
});

