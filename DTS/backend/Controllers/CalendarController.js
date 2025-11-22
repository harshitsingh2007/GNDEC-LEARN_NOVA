import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Calendar from "../Models/Calendar.js";
import User from "../Models/User.js";

const authenticateUser = async (req) => {
  let token;
  if (req.cookies?.jwt) token = req.cookies.jwt;
  else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer "))
    token = req.headers.authorization.split(" ")[1];
  if (!token) throw new Error("Not authorized, no token");

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.userId).populate('enrolledCourses');
  if (!user) throw new Error("User not found");

  return user;
};

// GET /api/calendar - Get calendar with AI-generated daily task
export const getCalendar = asyncHandler(async (req, res) => {
  const user = await authenticateUser(req);
  
  let calendar = await Calendar.findOne({ userId: user._id });
  
  if (!calendar) {
    // Create new calendar for user with preferences
    calendar = new Calendar({
      userId: user._id,
      studyPreferences: {
        subjects: user.enrolledCourses?.map(course => course.title) || ["General Learning"],
        difficultyLevel: user.level > 2 ? "advanced" : user.level > 1 ? "intermediate" : "beginner",
        dailyStudyTime: 60,
        learningGoals: ["Improve knowledge", "Build consistent study habits"],
        preferredLearningStyles: ["visual", "practical"]
      }
    });
    await calendar.save();
  } else {
    // Clean up any invalid tasks in existing calendar
    calendar.cleanupInvalidTasks();
    await calendar.save();
  }
  
  // Generate today's task if needed using AI
  if (calendar.needsTaskGeneration()) {
    try {
      console.log("📅 Generating new daily task for user:", user._id);
      const newTask = await calendar.generateDailyTask(user);
      await calendar.save();
      console.log("✅ Task saved to calendar:", newTask?.title || "Fallback task");
    } catch (error) {
      console.error("❌ Error generating daily task:", error);
      // Try to generate fallback task
      try {
        const fallbackTask = calendar.generateFallbackTask(user);
        calendar.tasks.push(fallbackTask);
        calendar.lastTaskGeneration = new Date();
        await calendar.save();
        console.log("✅ Fallback task generated and saved");
      } catch (fallbackError) {
        console.error("❌ Error generating fallback task:", fallbackError);
      }
    }
  } else {
    console.log("📅 Task already generated for today (lastGen:", calendar.lastTaskGeneration, ")");
  }
  
  // Check if today's task exists, if not, force regenerate
  let todaysTask = calendar.getTodaysTask();
  
  // If no task found, check if tasks exist but date comparison failed
  if (!todaysTask && calendar.tasks && calendar.tasks.length > 0) {
    console.log("⚠️ getTodaysTask() returned null, but tasks exist. Checking manually...");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Try to find task manually with more flexible date comparison
    const manualTask = calendar.tasks.find(t => {
      if (!t || !t.date) return false;
      const taskDate = new Date(t.date);
      taskDate.setHours(0, 0, 0, 0);
      
      // Compare dates (ignore time)
      const todayStr = today.toDateString();
      const taskStr = taskDate.toDateString();
      
      if (todayStr === taskStr) {
        console.log("✅ Found task manually:", t.title);
        return true;
      }
      return false;
    });
    
    if (manualTask) {
      todaysTask = manualTask;
      console.log("✅ Using manually found task");
    }
  }
  
  if (!todaysTask) {
    console.warn("⚠️ No task found for today, forcing regeneration...");
    try {
      // Remove any incomplete tasks for today (in case of corruption)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const beforeCount = calendar.tasks.length;
      calendar.tasks = calendar.tasks.filter(t => {
        if (!t || !t.date) return true; // Keep tasks without dates for now
        const taskDate = new Date(t.date);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate.getTime() !== today.getTime();
      });
      const afterCount = calendar.tasks.length;
      console.log(`🗑️ Filtered tasks: ${beforeCount} -> ${afterCount}`);
      
      // Force generate new task
      const newTask = await calendar.generateDailyTask(user);
      await calendar.save();
      console.log("✅ Forced task generation successful:", newTask?.title);
      
      // Reload from database to ensure we have the latest
      await calendar.save();
      const reloadedCalendar = await Calendar.findById(calendar._id);
      todaysTask = reloadedCalendar.getTodaysTask();
      
      if (!todaysTask) {
        // Last resort: find by comparing date strings
        const todayStr = new Date().toDateString();
        const found = reloadedCalendar.tasks.find(t => {
          if (!t || !t.date) return false;
          return new Date(t.date).toDateString() === todayStr;
        });
        if (found) {
          console.log("✅ Found task by date string comparison:", found.title);
          todaysTask = found;
        }
      }
    } catch (error) {
      console.error("❌ Error in forced task generation:", error);
      // Last resort: create a simple fallback task
      try {
        const fallbackTask = calendar.generateFallbackTask(user);
        calendar.tasks.push(fallbackTask);
        calendar.lastTaskGeneration = new Date();
        await calendar.save();
        console.log("✅ Emergency fallback task created");
        
        // Try to find it
        const reloadedCalendar = await Calendar.findById(calendar._id);
        todaysTask = reloadedCalendar.getTodaysTask();
      } catch (fallbackError) {
        console.error("❌ Critical: Could not create any task:", fallbackError);
      }
    }
  }
  
  const completedTasks = calendar.getCompletedTasks();
  
  // Calculate and update statistics
  calendar.calculateStatistics();
  await calendar.save();
  
  // Ensure todaysTask is properly formatted
  const todayTasksArray = todaysTask ? [todaysTask] : [];
  
  console.log("📤 Sending calendar response:");
  console.log("  - Total tasks:", calendar.tasks.length);
  console.log("  - Today's task:", todaysTask ? todaysTask.title : "NONE");
  console.log("  - TodayTasks array length:", todayTasksArray.length);
  
  res.status(200).json({
    tasks: calendar.tasks || [],
    todayTasks: todayTasksArray,
    upcomingTasks: [],
    streak: calendar.streak || { currentStreak: 0, longestStreak: 0 },
    statistics: calendar.statistics || {
      totalTasksCompleted: 0,
      completionRate: 0,
      totalStudyTime: 0,
      averageDailyTasks: 0
    },
    studyPreferences: calendar.studyPreferences || {
      subjects: ["General Learning"],
      difficultyLevel: "beginner",
      dailyStudyTime: 60,
      learningGoals: [],
      preferredLearningStyles: []
    }
  });
});

// PATCH /api/calendar/complete/:taskId - Complete today's task
const findTaskById = (calendar, taskId) => {
  if (!calendar?.tasks) return null;
  const directMatch = calendar.tasks.id(taskId);
  if (directMatch) return directMatch;
  return calendar.tasks.find(
    (task) =>
      task?.taskId === taskId ||
      (task?._id && task._id.toString() === taskId)
  ) || null;
};

export const completeTask = asyncHandler(async (req, res) => {
  const user = await authenticateUser(req);
  const { taskId } = req.params;
  
  const calendar = await Calendar.findOne({ userId: user._id });
  if (!calendar) {
    return res.status(404).json({ message: "Calendar not found" });
  }
  
  const task = findTaskById(calendar, taskId);
  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }
  
  // Check if this is today's task
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const taskDate = new Date(task.date);
  taskDate.setHours(0, 0, 0, 0);
  
  if (taskDate.getTime() !== today.getTime()) {
    return res.status(400).json({ 
      message: "You can only complete today's task. Future tasks are locked until their scheduled date." 
    });
  }
  
  if (task.status === "completed") {
    return res.status(400).json({ message: "Task already completed" });
  }
  
  // Mark task as completed
  task.status = "completed";
  task.completedAt = new Date();
  
  // Update statistics
  calendar.statistics.totalTasksCompleted = (calendar.statistics.totalTasksCompleted || 0) + 1;
  calendar.statistics.totalStudyTime = (calendar.statistics.totalStudyTime || 0) + (task.estimatedDuration || 30);
  
  // Update streak
  calendar.updateStreak();
  
  await calendar.save();
  
  // Add XP to user
  const xpGained = 30 + (task.difficulty === "advanced" ? 20 : task.difficulty === "intermediate" ? 10 : 0);
  user.addXP(xpGained);
  await user.save();
  
  res.status(200).json({
    message: "Task completed successfully! 🎉",
    xpGained: xpGained,
    task: {
      taskId: task.taskId,
      title: task.title,
      status: task.status,
      completedAt: task.completedAt
    },
    streak: calendar.streak.currentStreak
  });
});

// GET /api/calendar/task/:taskId - Get a single task with ensured question set
export const getTaskById = asyncHandler(async (req, res) => {
  const user = await authenticateUser(req);
  const { taskId } = req.params;

  const calendar = await Calendar.findOne({ userId: user._id });
  if (!calendar) {
    return res.status(404).json({ message: "Calendar not found" });
  }

  const task = findTaskById(calendar, taskId);
  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }

  if (!task.content) {
    task.content = {};
  }

  if (
    !Array.isArray(task.content.questions) ||
    task.content.questions.length !== 10
  ) {
    const fallbackQuestions = calendar.generateFallbackQuestions(
      task.category || calendar.studyPreferences.subjects?.[0] || "General Learning",
      task.difficulty || calendar.studyPreferences.difficultyLevel || "beginner"
    );
    task.content.questions = fallbackQuestions;
    await calendar.save();
  }

  res.status(200).json({
    task,
  });
});

// GET /api/calendar/summary - Get calendar statistics
export const getCalendarSummary = asyncHandler(async (req, res) => {
  const user = await authenticateUser(req);
  
  const calendar = await Calendar.findOne({ userId: user._id });
  if (!calendar) {
    return res.status(404).json({ message: "Calendar not found" });
  }
  
  const completedTasks = calendar.getCompletedTasks();
  const totalTasks = calendar.tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;
  
  res.status(200).json({
    streak: calendar.streak,
    statistics: {
      ...calendar.statistics.toObject(),
      completionRate: completionRate,
      totalTasks: totalTasks,
      completedTasks: completedTasks.length
    },
    studyPreferences: calendar.studyPreferences
  });
});

// PATCH /api/calendar/preferences - Update study preferences
export const updateStudyPreferences = asyncHandler(async (req, res) => {
  const user = await authenticateUser(req);
  const { subjects, difficultyLevel, dailyStudyTime, learningGoals, preferredLearningStyles } = req.body;
  
  const calendar = await Calendar.findOne({ userId: user._id });
  if (!calendar) {
    return res.status(404).json({ message: "Calendar not found" });
  }
  
  // Update preferences
  calendar.studyPreferences = {
    subjects: subjects || calendar.studyPreferences.subjects,
    difficultyLevel: difficultyLevel || calendar.studyPreferences.difficultyLevel,
    dailyStudyTime: dailyStudyTime || calendar.studyPreferences.dailyStudyTime,
    learningGoals: learningGoals || calendar.studyPreferences.learningGoals,
    preferredLearningStyles: preferredLearningStyles || calendar.studyPreferences.preferredLearningStyles
  };
  
  await calendar.save();
  
  res.status(200).json({
    message: "Study preferences updated successfully",
    studyPreferences: calendar.studyPreferences
  });
});

// POST /api/calendar/regenerate-today - Regenerate today's task
export const regenerateTodaysTask = asyncHandler(async (req, res) => {
  const user = await authenticateUser(req);
  
  const calendar = await Calendar.findOne({ userId: user._id });
  if (!calendar) {
    return res.status(404).json({ message: "Calendar not found" });
  }
  
  // Remove today's task if exists
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const initialTaskCount = calendar.tasks.length;
  calendar.tasks = calendar.tasks.filter(t => {
    const taskDate = new Date(t.date);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate.getTime() !== today.getTime();
  });
  const removedCount = initialTaskCount - calendar.tasks.length;
  console.log(`🗑️ Removed ${removedCount} existing task(s) for today`);
  
  // Reset lastTaskGeneration to force new generation
  calendar.lastTaskGeneration = null;
  
  // Generate new task
  try {
    const newTask = await calendar.generateDailyTask(user);
    await calendar.save();
    console.log("✅ Task regenerated successfully:", newTask?.title);
    
    res.status(200).json({
      message: "Today's task regenerated successfully",
      task: newTask
    });
  } catch (error) {
    console.error("❌ Error regenerating task:", error);
    // Try fallback
    try {
      const fallbackTask = calendar.generateFallbackTask(user);
      calendar.tasks.push(fallbackTask);
      calendar.lastTaskGeneration = new Date();
      await calendar.save();
      console.log("✅ Fallback task created during regeneration");
      
      res.status(200).json({
        message: "Task regenerated successfully (using fallback)",
        task: fallbackTask
      });
    } catch (fallbackError) {
      console.error("❌ Critical error in regeneration:", fallbackError);
      res.status(500).json({
        message: "Failed to regenerate task",
        error: fallbackError.message
      });
    }
  }
});

// PATCH /api/calendar/task/:taskId - Update task status
export const updateTaskStatus = asyncHandler(async (req, res) => {
  const user = await authenticateUser(req);
  const { taskId } = req.params;
  const { status } = req.body;
  
  const calendar = await Calendar.findOne({ userId: user._id });
  if (!calendar) {
    return res.status(404).json({ message: "Calendar not found" });
  }
  
  const task = findTaskById(calendar, taskId);
  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }
  
  // Validate status
  if (!["pending", "in-progress", "completed"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }
  
  task.status = status;
  
  if (status === "completed" && !task.completedAt) {
    task.completedAt = new Date();
    
    // Update streak and statistics for completed tasks
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(task.date);
    taskDate.setHours(0, 0, 0, 0);
    
    if (taskDate.getTime() === today.getTime()) {
      calendar.updateStreak();
      calendar.statistics.totalTasksCompleted += 1;
    }
  }
  
  await calendar.save();
  
  res.status(200).json({
    message: "Task status updated successfully",
    task: {
      taskId: task.taskId,
      title: task.title,
      status: task.status,
      completedAt: task.completedAt
    }
  });
});

// POST /api/calendar/create-task - Create a custom task
export const createCustomTask = asyncHandler(async (req, res) => {
  const user = await authenticateUser(req);
  const { title, description, date, type, category, priority, estimatedDuration, difficulty } = req.body;
  
  // Validate required fields
  if (!title || !description || !date) {
    return res.status(400).json({ 
      message: "Title, description, and date are required" 
    });
  }
  
  let calendar = await Calendar.findOne({ userId: user._id });
  if (!calendar) {
    // Create calendar if it doesn't exist
    calendar = new Calendar({
      userId: user._id,
      studyPreferences: {
        subjects: user.enrolledCourses?.map(course => course.title) || ["General Learning"],
        difficultyLevel: user.level > 2 ? "advanced" : user.level > 1 ? "intermediate" : "beginner",
        dailyStudyTime: 60,
        learningGoals: ["Improve knowledge", "Build consistent study habits"],
        preferredLearningStyles: ["visual", "practical"]
      }
    });
    await calendar.save();
  }
  
  // Validate task date (should not be in the past, except today)
  const taskDate = new Date(date);
  taskDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (taskDate < today) {
    return res.status(400).json({ 
      message: "Cannot create tasks for past dates" 
    });
  }
  
  // Check if task already exists for this date
  const existingTaskIndex = calendar.tasks.findIndex(t => {
    const tDate = new Date(t.date);
    tDate.setHours(0, 0, 0, 0);
    return tDate.getTime() === taskDate.getTime();
  });
  
  const existingTask = existingTaskIndex !== -1 ? calendar.tasks[existingTaskIndex] : null;
  
  // Create new custom task
  const newTask = {
    taskId: existingTask && !existingTask.aiGenerated 
      ? existingTask.taskId // Keep existing taskId if replacing custom task
      : new mongoose.Types.ObjectId().toString(), // New taskId for new tasks
    title: title.trim(),
    description: description.trim(),
    date: taskDate,
    status: existingTask && !existingTask.aiGenerated 
      ? existingTask.status // Preserve status if replacing custom task
      : "pending",
    type: calendar.validateTaskType(type || "study"),
    category: category || "General",
    priority: calendar.validatePriority(priority || "medium"),
    estimatedDuration: estimatedDuration || 30,
    difficulty: calendar.validateDifficulty(difficulty || "beginner"),
    aiGenerated: false, // Mark as custom task
    content: {
      learningObjectives: [],
      successCriteria: "Complete the task as described"
    },
    completedAt: existingTask && !existingTask.aiGenerated 
      ? existingTask.completedAt // Preserve completion time if exists
      : undefined
  };
  
  // Replace existing task (whether AI-generated or custom) or add new one
  if (existingTaskIndex !== -1) {
    calendar.tasks[existingTaskIndex] = newTask;
  } else {
    calendar.tasks.push(newTask);
  }
  
  await calendar.save();
  
  const message = existingTaskIndex !== -1 
    ? existingTask && !existingTask.aiGenerated
      ? "Custom task updated successfully!"
      : "Custom task created and replaced AI task!"
    : "Custom task created successfully!";
  
  res.status(201).json({
    message: message,
    task: newTask
  });
});

// POST /api/calendar/cleanup - Clean up invalid tasks (one-time fix)
export const cleanupCalendar = asyncHandler(async (req, res) => {
  const user = await authenticateUser(req);
  
  const calendar = await Calendar.findOne({ userId: user._id });
  if (!calendar) {
    return res.status(404).json({ message: "Calendar not found" });
  }
  
  const initialCount = calendar.tasks.length;
  calendar.cleanupInvalidTasks();
  const finalCount = calendar.tasks.length;
  const removedCount = initialCount - finalCount;
  
  await calendar.save();
  
  res.status(200).json({
    message: `Calendar cleanup completed. Removed ${removedCount} invalid tasks.`,
    tasksRemoved: removedCount,
    currentTasks: finalCount
  });
});