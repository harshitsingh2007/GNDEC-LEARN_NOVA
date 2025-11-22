import mongoose from "mongoose";
import { GoogleGenerativeAI } from "@google/generative-ai";

const { Schema } = mongoose;

const taskSchema = new Schema({
  taskId: {
    type: String,
    required: true,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "in-progress", "completed"],
    default: "pending"
  },
  type: {
    type: String,
    enum: ["study", "quiz", "reading", "practice", "assignment", "review"],
    required: true
  },
  category: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium"
  },
  estimatedDuration: {
    type: Number,
    default: 30
  },
  difficulty: {
    type: String,
    enum: ["beginner", "intermediate", "advanced"],
    default: "beginner"
  },
  aiGenerated: {
    type: Boolean,
    default: true
  },
  completedAt: {
    type: Date
  },
  content: {
    type: Schema.Types.Mixed
  }
});

const calendarSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },
  tasks: [taskSchema],
  studyPreferences: {
    subjects: {
      type: [String],
      default: ["General Learning"]
    },
    difficultyLevel: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner"
    },
    dailyStudyTime: {
      type: Number,
      default: 60
    },
    learningGoals: {
      type: [String],
      default: ["Improve knowledge", "Build consistent study habits"]
    },
    preferredLearningStyles: {
      type: [String],
      default: ["visual", "practical"]
    }
  },
  streak: {
    currentStreak: {
      type: Number,
      default: 0
    },
    longestStreak: {
      type: Number,
      default: 0
    },
    lastCompletedDate: {
      type: Date
    }
  },
  statistics: {
    totalTasksCompleted: {
      type: Number,
      default: 0
    },
    completionRate: {
      type: Number,
      default: 0
    },
    totalStudyTime: {
      type: Number,
      default: 0
    },
    averageDailyTasks: {
      type: Number,
      default: 0
    }
  },
  lastTaskGeneration: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

class CalendarClass {
  // Check if we need to generate new tasks
  needsTaskGeneration() {
    const lastGen = this.lastTaskGeneration;
    const now = new Date();
    
    if (!lastGen) return true;
    
    const lastGenDate = new Date(lastGen);
    const lastGenDay = lastGenDate.getDate();
    const lastGenMonth = lastGenDate.getMonth();
    const lastGenYear = lastGenDate.getFullYear();
    
    const nowDay = now.getDate();
    const nowMonth = now.getMonth();
    const nowYear = now.getFullYear();
    
    return lastGenDay !== nowDay || lastGenMonth !== nowMonth || lastGenYear !== nowYear;
  }

  // Generate daily task using Gemini AI
  async generateDailyTask(user) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const applyTask = (taskData, isAi = false) => {
      const task = {
        taskId: new mongoose.Types.ObjectId().toString(),
        title: taskData.title,
        description: taskData.description,
        date: today,
        type: this.validateTaskType(taskData.type),
        category: taskData.category,
        priority: this.validatePriority(taskData.priority),
        estimatedDuration: taskData.duration || 30,
        difficulty: this.validateDifficulty(taskData.difficulty),
        aiGenerated: isAi,
        content: taskData.content || {},
      };

      this.tasks = this.tasks.filter((t) => {
        const taskDate = new Date(t.date);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate.getTime() !== today.getTime();
      });

      this.tasks.push(task);
      this.lastTaskGeneration = new Date();

      return task;
    };

    try {
      if (!process.env.GEMINI_API_KEY) {
        console.warn("⚠️ GEMINI_API_KEY not set, using fallback task generation");
        const fallbackTask = this.generateFallbackTask(user);
        return applyTask(fallbackTask, false);
      }

      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const prompt = this.buildTaskPrompt(user);
      console.log("🤖 Generating daily task with Gemini AI...");
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const textResponse = response.text();
      console.log("✅ Gemini response received, parsing...");
      const taskData = this.parseAIResponse(textResponse);

      const task = applyTask(taskData, true);

      console.log("✅ Daily task generated successfully:", task.title);
      console.log("📅 Task date:", task.date);
      console.log("📅 Task date ISO:", new Date(task.date).toISOString());
      console.log("📅 Total tasks after adding:", this.tasks.length);

      return task;
    } catch (error) {
      console.error("❌ Error generating AI task:", error.message);
      console.error("Full error:", error);
      console.log("🔄 Using fallback task generation...");
      const fallbackTask = this.generateFallbackTask(user);
      return applyTask(fallbackTask, false);
    }
  }

  // Validate and normalize task type
  validateTaskType(type) {
    const validTypes = ["study", "quiz", "reading", "practice", "assignment", "review"];
    const normalizedType = type?.toLowerCase().trim();
    
    if (validTypes.includes(normalizedType)) {
      return normalizedType;
    }
    
    // Map common AI-generated types to valid types
    const typeMapping = {
      "revision": "review",
      "exercise": "practice",
      "homework": "assignment",
      "lesson": "study",
      "test": "quiz",
      "article": "reading",
      "book": "reading",
      "project": "assignment"
    };
    
    return typeMapping[normalizedType] || "study";
  }

  // Validate priority
  validatePriority(priority) {
    const validPriorities = ["low", "medium", "high"];
    const normalizedPriority = priority?.toLowerCase().trim();
    return validPriorities.includes(normalizedPriority) ? normalizedPriority : "medium";
  }

  // Validate difficulty
  validateDifficulty(difficulty) {
    const validDifficulties = ["beginner", "intermediate", "advanced"];
    const normalizedDifficulty = difficulty?.toLowerCase().trim();
    return validDifficulties.includes(normalizedDifficulty) ? normalizedDifficulty : "beginner";
  }

  buildTaskPrompt(user) {
    const preferences = this.studyPreferences;
    const userLevel = user.level || 1;
    const userStreak = this.streak.currentStreak || 0;
    
    return `
    Create a personalized daily learning task with 10 questions for a student based on their profile.
    
    STUDENT PROFILE:
    - Level: ${userLevel}
    - Current Streak: ${userStreak} days
    - Preferred Subjects: ${preferences.subjects.join(", ")}
    - Difficulty Level: ${preferences.difficultyLevel}
    - Daily Study Time: ${preferences.dailyStudyTime} minutes
    - Learning Goals: ${preferences.learningGoals.join(", ")}
    - Learning Styles: ${preferences.preferredLearningStyles.join(", ")}
    
    TASK REQUIREMENTS:
    - Create ONE engaging daily task with EXACTLY 10 questions
    - Duration: ${Math.min(60, preferences.dailyStudyTime)} minutes max
    - Appropriate for ${preferences.difficultyLevel} level
    - Related to their preferred subjects: ${preferences.subjects.join(", ")}
    - Use ONLY these task types: study, quiz, reading, practice, assignment, or review
    - Make it achievable in one session
    
    QUESTION REQUIREMENTS:
    - Generate EXACTLY 10 questions
    - Mix question types: Multiple Choice (MCQ), Short Answer (Q/A), True/False, Fill in the Blank
    - Questions should be relevant to the task topic and difficulty level
    - For MCQ: provide 4 options with one correct answer
    - For Q/A: provide clear, concise questions that can be answered in 1-3 sentences
    - For True/False: provide statements that test understanding
    - For Fill in the Blank: provide sentences with one key word missing
    
    RESPONSE FORMAT (JSON only):
    {
      "title": "Engaging task title",
      "description": "Detailed description of what to learn and do",
      "type": "study|quiz|reading|practice|assignment|review",
      "category": "Subject category",
      "priority": "low|medium|high",
      "duration": 30,
      "difficulty": "beginner|intermediate|advanced",
      "content": {
        "learningObjectives": ["objective1", "objective2"],
        "resources": ["suggested resource 1", "suggested resource 2"],
        "successCriteria": "How to know when task is completed",
        "questions": [
          {
            "questionNumber": 1,
            "type": "mcq|qa|truefalse|fillblank",
            "question": "Question text here",
            "options": ["option1", "option2", "option3", "option4"], // Only for MCQ
            "correctAnswer": "correct answer or option index for MCQ",
            "explanation": "Brief explanation of the answer"
          }
          // ... 9 more questions
        ]
      }
    }
    
    IMPORTANT: Generate EXACTLY 10 questions. Mix the question types. Make it engaging, achievable, and educational! Consider their ${userStreak}-day streak and make it rewarding.
    `;
  }

  parseAIResponse(response) {
    try {
      // Clean the response and extract JSON
      let cleanedResponse = response.replace(/```json|```/g, '').trim();
      
      // Try to find JSON object
      let jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      
      // If no match, try to find JSON array
      if (!jsonMatch) {
        jsonMatch = cleanedResponse.match(/\[[\s\S]*\]/);
      }
      
      if (jsonMatch) {
        try {
          const parsedData = JSON.parse(jsonMatch[0]);
          
          // Validate required fields
          if (parsedData.title && parsedData.description && parsedData.type) {
            // Ensure questions array exists and has 10 questions
            if (!parsedData.content) {
              parsedData.content = {};
            }
            if (!parsedData.content.questions || parsedData.content.questions.length !== 10) {
              console.warn("⚠️ AI response missing or incomplete questions, generating fallback questions");
              parsedData.content.questions = this.generateFallbackQuestions(
                parsedData.category || "General Learning", 
                parsedData.difficulty || "beginner"
              );
            }
            console.log("✅ Successfully parsed AI response");
            return parsedData;
          } else {
            console.warn("⚠️ AI response missing required fields (title, description, type)");
          }
        } catch (parseError) {
          console.error("❌ JSON parse error:", parseError.message);
        }
      } else {
        console.warn("⚠️ No JSON found in AI response");
      }
    } catch (error) {
      console.error("❌ Error parsing AI response:", error.message);
    }
    
    // Fallback if JSON parsing fails
    console.log("🔄 Using fallback data structure");
    return this.generateFallbackData();
  }

  generateFallbackQuestions(category, difficulty) {
    const questions = [];
    const questionTypes = ['mcq', 'qa', 'truefalse', 'fillblank'];
    
    for (let i = 1; i <= 10; i++) {
      const type = questionTypes[(i - 1) % questionTypes.length];
      
      if (type === 'mcq') {
        questions.push({
          questionNumber: i,
          type: 'mcq',
          question: `What is a key concept in ${category}?`,
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswer: 'Option A',
          explanation: 'This is the correct answer because...'
        });
      } else if (type === 'qa') {
        questions.push({
          questionNumber: i,
          type: 'qa',
          question: `Explain a fundamental principle of ${category} in your own words.`,
          correctAnswer: 'A clear explanation demonstrating understanding',
          explanation: 'This question tests your understanding of core concepts.'
        });
      } else if (type === 'truefalse') {
        questions.push({
          questionNumber: i,
          type: 'truefalse',
          question: `${category} is an important subject to study.`,
          correctAnswer: 'True',
          explanation: 'This statement is true because...'
        });
      } else if (type === 'fillblank') {
        questions.push({
          questionNumber: i,
          type: 'fillblank',
          question: `The main topic in ${category} is _______.`,
          correctAnswer: 'key concept',
          explanation: 'Fill in the blank with the appropriate term.'
        });
      }
    }
    
    return questions;
  }

  generateFallbackTask(user) {
    const subjects = this.studyPreferences?.subjects || [];
    const subject = (subjects.length > 0 
      ? subjects[Math.floor(Math.random() * subjects.length)] 
      : "General Learning");
    const taskTypes = ["study", "practice", "reading", "review"];
    const type = taskTypes[Math.floor(Math.random() * taskTypes.length)];
    
    const fallbackTasks = {
      study: {
        title: `Study ${subject} Fundamentals`,
        description: `Review key concepts and principles in ${subject}. Focus on understanding the core ideas.`,
        duration: 30
      },
      practice: {
        title: `${subject} Practice Exercises`,
        description: `Complete practical exercises to reinforce your ${subject} knowledge. Apply what you've learned.`,
        duration: 45
      },
      reading: {
        title: `Read about ${subject}`,
        description: `Read educational content about ${subject} and take notes on key insights.`,
        duration: 25
      },
      review: {
        title: `${subject} Knowledge Review`,
        description: `Review and consolidate your understanding of ${subject} concepts from previous lessons.`,
        duration: 35
      }
    };
    
    const task = fallbackTasks[type];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return {
      taskId: new mongoose.Types.ObjectId().toString(),
      title: task.title,
      description: task.description,
      date: today,
      type: type,
      category: subject,
      priority: "medium",
      estimatedDuration: task.duration,
      difficulty: this.studyPreferences.difficultyLevel || "beginner",
      aiGenerated: false, // Mark as fallback
      content: {
        learningObjectives: [
          `Understand ${subject} concepts`,
          "Apply knowledge practically"
        ],
        resources: ["Course materials", "Online resources"],
        successCriteria: "Complete the main learning objectives and understand the key concepts",
        questions: this.generateFallbackQuestions(subject, this.studyPreferences.difficultyLevel || "beginner")
      }
    };
  }

  generateFallbackData() {
    return {
      title: "Interactive Learning Session",
      description: "Engage with educational content and complete related activities to strengthen your knowledge",
      type: "study",
      category: "General Learning",
      priority: "medium",
      duration: 30,
      difficulty: "beginner",
      content: {
        learningObjectives: [
          "Learn new concepts",
          "Apply knowledge practically"
        ],
        resources: ["Platform resources", "Educational materials"],
        successCriteria: "Complete all activities and demonstrate understanding",
        questions: this.generateFallbackQuestions("General Learning", "beginner")
      }
    };
  }

  // Get today's task
  getTodaysTask() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    console.log("🔍 Looking for today's task. Today:", today.toISOString());
    console.log("🔍 Total tasks:", this.tasks.length);
    
    const foundTask = this.tasks.find(task => {
      if (!task || !task.date) {
        console.log("⚠️ Task missing date:", task);
        return false;
      }
      
      const taskDate = new Date(task.date);
      taskDate.setHours(0, 0, 0, 0);
      
      const todayTime = today.getTime();
      const taskTime = taskDate.getTime();
      
      console.log(`  - Task "${task.title}": ${taskDate.toISOString()} (${taskTime}) vs Today: ${today.toISOString()} (${todayTime})`);
      
      return taskTime === todayTime;
    });
    
    if (foundTask) {
      console.log("✅ Found today's task:", foundTask.title);
    } else {
      console.log("❌ No task found for today");
      // Log all task dates for debugging
      this.tasks.forEach((task, index) => {
        if (task && task.date) {
          const taskDate = new Date(task.date);
          taskDate.setHours(0, 0, 0, 0);
          console.log(`  Task ${index}: "${task.title}" - Date: ${taskDate.toISOString()}`);
        }
      });
    }
    
    return foundTask || null;
  }

  // Get completed tasks
  getCompletedTasks() {
    return this.tasks.filter(task => task.status === "completed");
  }

  // Update streak when task is completed
  updateStreak() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastCompleted = this.streak.lastCompletedDate 
      ? new Date(this.streak.lastCompletedDate)
      : null;
    
    if (lastCompleted) {
      lastCompleted.setHours(0, 0, 0, 0);
      const diffTime = today.getTime() - lastCompleted.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        // Consecutive day
        this.streak.currentStreak += 1;
      } else if (diffDays > 1) {
        // Streak broken
        this.streak.currentStreak = 1;
      }
    } else {
      // First completion
      this.streak.currentStreak = 1;
    }
    
    // Update longest streak
    if (this.streak.currentStreak > this.streak.longestStreak) {
      this.streak.longestStreak = this.streak.currentStreak;
    }
    
    this.streak.lastCompletedDate = today;
  }

  // Calculate statistics
  calculateStatistics() {
    const completedTasks = this.getCompletedTasks();
    const totalTasks = this.tasks.length;
    
    this.statistics.totalTasksCompleted = completedTasks.length;
    this.statistics.completionRate = totalTasks > 0 ? 
      Math.round((completedTasks.length / totalTasks) * 100) : 0;
    this.statistics.totalStudyTime = completedTasks.reduce((total, task) => 
      total + (task.estimatedDuration || 30), 0);
    this.statistics.averageDailyTasks = totalTasks > 0 ? 
      (completedTasks.length / totalTasks) : 0;
  }

  // Clean up invalid tasks (for existing data)
  cleanupInvalidTasks() {
    const validTypes = ["study", "quiz", "reading", "practice", "assignment", "review"];
    this.tasks = this.tasks.filter(task => validTypes.includes(task.type));
  }
}

// Pre-save hook to ensure all tasks have taskId
calendarSchema.pre('save', function(next) {
  if (this.tasks && Array.isArray(this.tasks)) {
    this.tasks.forEach((task) => {
      if (!task.taskId) {
        task.taskId = new mongoose.Types.ObjectId().toString();
      }
    });
  }
  next();
});

calendarSchema.loadClass(CalendarClass);

const Calendar = mongoose.model("Calendar", calendarSchema);

// Drop the problematic unique index if it exists (run once on connection)
// This is done asynchronously to avoid blocking
if (mongoose.connection.readyState === 1) {
  // Already connected, drop index now
  Calendar.collection.dropIndex('tasks.taskId_1').catch(() => {
    // Index doesn't exist, that's fine
  });
} else {
  // Wait for connection
  mongoose.connection.once('open', () => {
    Calendar.collection.dropIndex('tasks.taskId_1').catch(() => {
      // Index doesn't exist, that's fine
    });
  });
}

export default Calendar;