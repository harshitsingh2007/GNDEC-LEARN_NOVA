import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Flame,
  CheckCircle2,
  Target,
  BookOpen,
  FileText,
  HelpCircle,
  Zap,
  TrendingUp,
  Lock,
  RefreshCw,
  Settings,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as DatePicker } from "@/components/ui/calendar"; 
import { toast } from "sonner";
import { palette } from "@/theme/palette";

// Types
interface Task {
  taskId: string;
  _id?: string;
  title: string;
  description: string;
  date: string;
  status: "pending" | "completed" | "in-progress";
  category: string;
  priority: "low" | "medium" | "high";
  type: "study" | "quiz" | "reading" | "practice" | "assignment" | "review";
  estimatedDuration: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  aiGenerated: boolean;
  completedAt?: string;
  content?: any;
}

interface StudyPreferences {
  subjects: string[];
  difficultyLevel: string;
  dailyStudyTime: number;
  learningGoals: string[];
  preferredLearningStyles: string[];
}

interface CalendarData {
  tasks: Task[];
  todayTasks: Task[];
  upcomingTasks: Task[];
  streak: {
    currentStreak: number;
    longestStreak: number;
  };
  statistics: {
    totalTasksCompleted: number;
    completionRate: number;
    totalStudyTime: number;
    averageDailyTasks: number;
  };
  studyPreferences: StudyPreferences;
}

// Update these in your TaskItem component
const typeIcons = {
  study: BookOpen,
  quiz: HelpCircle,
  reading: FileText,
  practice: TrendingUp,
  assignment: Zap,
  review: RefreshCw 
};

const typeColors = {
  study: "text-blue-600",
  quiz: "text-purple-600",
  reading: "text-green-600",
  practice: "text-yellow-600",
  assignment: "text-orange-600",
  review: "text-pink-600"
};

// Fixed ShapeCell Component with visible numbers
const ShapeCell = ({
  day,
  isToday,
  isCompleted,
  isFuture,
  hasTask,
  onClick
}: {
  day: number;
  isToday: boolean;
  isCompleted: boolean;
  isFuture: boolean;
  hasTask: boolean;
  onClick?: () => void;
}) => {
  
  // FIX: Simple, guaranteed visible colors
  const getStyles = () => {
    if (isCompleted) {
      return {
        backgroundColor: palette.accentDeep, // Dark background
        textColor: '#FFFFFF', // Pure white text
        borderColor: palette.accent
      };
    }
    if (isToday) {
      return {
        backgroundColor: palette.accent, // Bright background
        textColor: '#FFFFFF', // White text
        borderColor: palette.accentDeep
      };
    }
    if (hasTask) {
      return {
        backgroundColor: palette.text, // Dark background
        textColor: '#FFFFFF', // White text
        borderColor: palette.border
      };
    }
    // Empty cell
    return {
      backgroundColor: palette.card, // Light background
      textColor: palette.text, // Dark text
      borderColor: palette.border
    };
  };

  const styles = getStyles();
  const hoverScale = hasTask && !isFuture ? 1.05 : 1;
  const cursorStyle = isFuture ? "cursor-not-allowed opacity-60" : hasTask ? "cursor-pointer hover:scale-105 hover:shadow-md" : "cursor-default";

  return (
    <motion.div
      whileHover={{ scale: hoverScale }}
      onClick={hasTask && !isFuture ? onClick : undefined}
      className={`relative w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-all border ${cursorStyle}`}
      style={{
        backgroundColor: styles.backgroundColor,
        borderColor: styles.borderColor,
        boxShadow: isToday ? `0 2px 8px ${palette.text}40` : isCompleted ? `0 2px 8px ${palette.accent}40` : 'none'
      }}
    >
      {/* FIX: Guaranteed visible text */}
      <span 
        style={{ 
          color: styles.textColor,
          fontSize: '0.875rem',
          fontWeight: isToday ? 'bold' : 'normal',
        }}
      >
        {day}
      </span>

      {/* Completion checkmark */}
      {isCompleted && (
        <div
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center border"
          style={{ backgroundColor: palette.accent, borderColor: palette.card }}
        >
          <CheckCircle2 className="w-2 h-2" style={{ color: palette.card }} />
        </div>
      )}

      {/* Today's indicator */}
      {isToday && !isCompleted && (
        <div
          className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full border animate-pulse"
          style={{ backgroundColor: palette.accentDeep, borderColor: palette.card }}
        />
      )}

      {/* Task indicator dot - only show if not completed and not today */}
      {hasTask && !isCompleted && !isToday && (
        <div
          className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: palette.accent }}
        />
      )}
    </motion.div>
  );
};

// Task Item Component
const TaskItem = ({
  task,
  onComplete,
  onRegenerate
}: {
  task: Task;
  onComplete?: (taskId: string) => void;
  onRegenerate?: () => void;
}) => {
  const navigate = useNavigate();

  const TypeIcon = typeIcons[task.type] || BookOpen;

  const isTaskAvailable = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(task.date);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate.getTime() === today.getTime();
  };

  const handleTaskClick = () => {
    if (isTaskAvailable() && task.status !== "completed") {
      navigate(`/task/${task.taskId}`);
    }
  };

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isTaskAvailable() && task.status !== "completed" && onComplete) {
      onComplete(task.taskId);
    }
  };

  const handleRegenerate = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRegenerate) {
      onRegenerate();
    }
  };

  const isCompleted = task.status === "completed";
  const isLocked = !isTaskAvailable();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-3 p-4 rounded-lg border transition-all`}
      style={{
        backgroundColor: isCompleted ? palette.accentSoft : isLocked ? palette.bg : palette.card,
        borderColor: isCompleted ? palette.accent : isLocked ? palette.border : palette.border,
        cursor: isLocked || isCompleted ? "default" : "pointer"
      }}
      onClick={handleTaskClick}
    >
      {/* Status Icon */}
      <div
        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all mt-0.5`}
        style={{
          backgroundColor: isCompleted ? palette.accent : isLocked ? palette.border : palette.card,
          borderColor: isCompleted ? palette.accent : palette.border,
        }}
      >
        {isCompleted && <CheckCircle2 className="w-3 h-3" style={{ color: palette.card }} />}
        {isLocked && <Lock className="w-3 h-3" style={{ color: palette.text2 }} />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <TypeIcon className={`w-4 h-4 ${typeColors[task.type]}`} />
          <h4
            className={`text-sm font-medium`}
            style={{ color: isCompleted ? palette.accentDeep : isLocked ? palette.text2 : palette.text }}
          >
            {task.title}
          </h4>
          {task.aiGenerated ? (
            <Badge variant="outline" className="text-xs" style={{ backgroundColor: palette.accentSoft, color: palette.accentDeep, borderColor: palette.accent }}>
              AI
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs" style={{ backgroundColor: palette.card, color: palette.text, borderColor: palette.border }}>
              Custom
            </Badge>
          )}
          {isCompleted && (
            <Badge variant="outline" className="text-xs" style={{ backgroundColor: palette.accent, color: palette.card, borderColor: palette.accent }}>
              Done
            </Badge>
          )}
          {isTaskAvailable() && task.status !== "completed" && (
            <Badge variant="outline" className="text-xs" style={{ backgroundColor: palette.bg, color: palette.text2, borderColor: palette.border }}>
              Available
            </Badge>
          )}
        </div>
        <p className={`text-xs mb-2`} style={{ color: isLocked ? palette.text2 : palette.text2 }}>
          {task.description}
        </p>

        {/* Learning Objectives */}
        {task.content?.learningObjectives && (
          <div className="mb-2">
            <p className="text-xs mb-1" style={{ color: palette.text2 }}>Learning Objectives:</p>
            <ul className="text-xs list-disc list-inside" style={{ color: palette.text2 }}>
              {task.content.learningObjectives.slice(0, 2).map((obj, index) => (
                <li key={index}>{obj}</li>
              ))}
            </ul>
          </div>
        )}

        <div className={`flex flex-wrap items-center gap-4 text-xs`} style={{ color: isLocked ? palette.text2 : palette.text2 }}>
          <span>{task.estimatedDuration}min</span>
          <span>•</span>
          <span className="capitalize">{task.difficulty}</span>
          <span>•</span>
          <span>{task.category}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 mt-3">
          {isTaskAvailable() && task.status !== "completed" && (
            <>
              <Button
                size="sm"
                onClick={handleComplete}
                className="text-xs shadow-lg"
                style={{ backgroundColor: palette.accentDeep, color: palette.card, boxShadow: `0 4px 6px -1px ${palette.accentDeep}33` }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = palette.accent}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = palette.accentDeep}
              >
                Mark Complete
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRegenerate}
                className="text-xs"
                style={{ borderColor: palette.border, color: palette.text, backgroundColor: palette.card }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = palette.cardHover}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = palette.card}
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Regenerate
              </Button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Study Preferences Component
const StudyPreferencesCard = ({ preferences }: { preferences: StudyPreferences }) => {
  const getDifficultyColor = (level: string) => {
    switch (level) {
      case "beginner": return "text-green-500";
      case "intermediate": return "text-yellow-500";
      case "advanced": return "text-red-500";
      default: return "text-gray-500";
    }
  };

  return (
    <Card className="shadow-sm" style={{ backgroundColor: palette.card, border: `1px solid ${palette.border}` }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm" style={{ color: palette.text }}>
          <Settings className="w-4 h-4" /> Study Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: palette.text2 }}>Difficulty Level</span>
          <Badge variant="outline" className={`capitalize ${getDifficultyColor(preferences.difficultyLevel)}`} style={{ borderColor: palette.border, backgroundColor: palette.card }}>
            {preferences.difficultyLevel}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: palette.text2 }}>Daily Study Time</span>
          <span className="text-sm font-medium" style={{ color: palette.text }}>
            {preferences.dailyStudyTime} min
          </span>
        </div>

        <div>
          <span className="text-sm" style={{ color: palette.text2 }}>Subjects</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {preferences.subjects.slice(0, 4).map((subject, index) => (
              <Badge key={index} variant="secondary" className="text-xs" style={{ backgroundColor: palette.bg, color: palette.text, borderColor: palette.border }}>
                {subject}
              </Badge>
            ))}
            {preferences.subjects.length > 4 && (
              <Badge variant="secondary" className="text-xs" style={{ backgroundColor: palette.bg, color: palette.text, borderColor: palette.border }}>
                +{preferences.subjects.length - 4} more
              </Badge>
            )}
          </div>
        </div>

        <div>
          <span className="text-sm" style={{ color: palette.text2 }}>Learning Goals</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {preferences.learningGoals.slice(0, 2).map((goal, index) => (
              <Badge key={index} variant="outline" className="text-xs" style={{ backgroundColor: palette.card, color: palette.text, borderColor: palette.border }}>
                {goal}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Main Calendar Component
const Calendar = () => {
  const navigate = useNavigate();
  const [calendarData, setCalendarData] = useState<CalendarData>({
    tasks: [],
    todayTasks: [],
    upcomingTasks: [],
    streak: { currentStreak: 0, longestStreak: 0 },
    statistics: {
      totalTasksCompleted: 0,
      completionRate: 0,
      totalStudyTime: 0,
      averageDailyTasks: 0
    },
    studyPreferences: {
      subjects: [],
      difficultyLevel: "beginner",
      dailyStudyTime: 60,
      learningGoals: [],
      preferredLearningStyles: []
    }
  });
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    date: new Date(),
    type: "study",
    category: "General",
    priority: "medium",
    estimatedDuration: 30,
    difficulty: "beginner",
  });

  const today = new Date();

  useEffect(() => {
    fetchCalendarData();
  }, []);

  // Refresh when navigating back to calendar
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchCalendarData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const normalizeTask = (task: any): Task => {
    if (!task) return task;
    const identifier =
      task.taskId ||
      (task._id ? task._id.toString() : undefined) ||
      new Date().getTime().toString();

    const questions = Array.isArray(task.content?.questions)
      ? task.content.questions.map((question: any, index: number) => ({
        ...question,
        questionNumber:
          question?.questionNumber !== undefined
            ? question.questionNumber
            : index + 1,
      }))
      : undefined;

    return {
      ...task,
      taskId: identifier,
      content: {
        ...task.content,
        questions,
      },
    } as Task;
  };

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/calendar", {
        withCredentials: true,
      });
      
      const todayTasks = Array.isArray(res.data.todayTasks) ? res.data.todayTasks : [];

      if (todayTasks.length === 0 && res.data.tasks && res.data.tasks.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTask = res.data.tasks.find((t: Task) => {
          const taskDate = new Date(t.date);
          taskDate.setHours(0, 0, 0, 0);
          return taskDate.getTime() === today.getTime();
        });
        if (todayTask) {
          res.data.todayTasks = [todayTask];
        }
      }

      setCalendarData({
        ...res.data,
        tasks: Array.isArray(res.data.tasks) ? res.data.tasks.map(normalizeTask) : [],
        todayTasks: Array.isArray(res.data.todayTasks)
          ? res.data.todayTasks.map(normalizeTask)
          : [],
      });

      if (!res.data.todayTasks || res.data.todayTasks.length === 0) {
        setTimeout(async () => {
          try {
            await axios.post(
              "http://localhost:5000/api/calendar/regenerate-today",
              {},
              { withCredentials: true }
            );
            await fetchCalendarData();
          } catch (err) {
            console.error("Auto-generate failed:", err);
          }
        }, 1000);
      }
    } catch (err: any) {
      console.error("❌ Calendar fetch error:", err);
      toast.error(err.response?.data?.message || "Failed to load calendar data");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      setCompleting(taskId);
      const res = await axios.patch(
        `http://localhost:5000/api/calendar/complete/${taskId}`,
        {},
        { withCredentials: true }
      );

      await fetchCalendarData();
      const xpGained = res.data.xpGained || 0;
      toast.success(`${res.data.message} +${xpGained} XP earned! 🎉`);
    } catch (err: any) {
      console.error("Complete task error:", err);
      toast.error(err.response?.data?.message || "Failed to complete task");
    } finally {
      setCompleting(null);
    }
  };

  const handleRegenerateTask = async () => {
    try {
      setRegenerating(true);
      const res = await axios.post(
        "http://localhost:5000/api/calendar/regenerate-today",
        {},
        { withCredentials: true }
      );

      await fetchCalendarData();
      toast.success("Task regenerated with AI!");
    } catch (err: any) {
      console.error("Regenerate task error:", err);
      toast.error(err.response?.data?.message || "Failed to regenerate task");
    } finally {
      setRegenerating(false);
    }
  };

  const handleCreateTask = async () => {
    if (!taskForm.title.trim() || !taskForm.description.trim()) {
      toast.error("Please fill in title and description");
      return;
    }

    try {
      setCreating(true);
      const res = await axios.post(
        "http://localhost:5000/api/calendar/create-task",
        {
          ...taskForm,
          date: taskForm.date.toISOString().split('T')[0],
        },
        { withCredentials: true }
      );

      await fetchCalendarData();
      toast.success(res.data.message || "Custom task created successfully! 🎉");
      setIsCreateDialogOpen(false);
      setTaskForm({
        title: "",
        description: "",
        date: new Date(),
        type: "study",
        category: "General",
        priority: "medium",
        estimatedDuration: 30,
        difficulty: "beginner",
      });
    } catch (err: any) {
      console.error("Create task error:", err);
      toast.error(err.response?.data?.message || "Failed to create task");
    } finally {
      setCreating(false);
    }
  };

  // Calendar navigation functions
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date.getTime() === today.getTime();
  };

  const isCompleted = (date: Date) => {
    const tasks = calendarData.tasks || [];
    return tasks.some((t: Task) => {
      const taskDate = new Date(t.date);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === date.getTime() && t.status === "completed";
    });
  };

  const isFuture = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date > today;
  };

  const hasTaskForDate = (date: Date): boolean => {
    const tasks = calendarData.tasks || [];
    return tasks.some((t: Task) => {
      const taskDate = new Date(t.date);
      taskDate.setHours(0, 0, 0, 0);
      date.setHours(0, 0, 0, 0);
      return taskDate.getTime() === date.getTime();
    });
  };

  const handleDayClick = (date: Date) => {
    const tasks = calendarData.tasks || [];
    const task = tasks.find((t: Task) => {
      const taskDate = new Date(t.date);
      taskDate.setHours(0, 0, 0, 0);
      date.setHours(0, 0, 0, 0);
      return taskDate.getTime() === date.getTime();
    });
    
    if (task && task.status !== "completed") {
      navigate(`/task/${task.taskId}`);
    }
  };

  // Generate calendar grid
  const generateCalendarGrid = () => {
    const totalDays = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8 sm:w-10 sm:h-10" />);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const hasTask = hasTaskForDate(date);

      days.push(
        <ShapeCell
          key={day}
          day={day}
          isToday={isToday(date)}
          isCompleted={isCompleted(date)}
          isFuture={isFuture(date)}
          hasTask={hasTask}
          onClick={() => handleDayClick(date)}
        />
      );
    }

    return days;
  };

  if (loading) {
    return (
      <div className="p-8 min-h-screen flex items-center justify-center" style={{ backgroundColor: palette.bg, color: palette.text }}>
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: palette.text }}></div>
          <p style={{ color: palette.text2 }}>AI is generating your daily task...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 min-h-screen space-y-8" style={{ backgroundColor: palette.bg, color: palette.text }}>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl sm:text-4xl font-bold flex items-center gap-2" style={{ color: palette.text }}>
            <CalendarDays className="w-6 h-6 sm:w-7 sm:h-7" /> Daily Learning
          </h1>
          <p className="text-sm sm:text-base mt-1" style={{ color: palette.text2 }}>
            Complete your AI-generated daily task or create your own to maintain your streak!
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="w-full sm:w-auto shadow-lg text-sm"
            style={{ backgroundColor: palette.accentDeep, color: palette.card, boxShadow: `0 4px 6px -1px ${palette.accentDeep}33` }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = palette.accent}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = palette.accentDeep}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Custom Task
          </Button>
        </div>
      </div>
      
      {/* Streak & Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm" style={{ backgroundColor: palette.card, border: `1px solid ${palette.border}` }}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xs sm:text-sm" style={{ color: palette.text }}>
              <Flame className="w-4 h-4 text-orange-500" /> Current Streak
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl sm:text-2xl font-bold" style={{ color: palette.text }}>
              {calendarData.streak.currentStreak} days
            </div>
            <div className="text-xs" style={{ color: palette.text2 }}>
              Best: {calendarData.streak.longestStreak} days
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm" style={{ backgroundColor: palette.card, border: `1px solid ${palette.border}` }}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xs sm:text-sm" style={{ color: palette.text }}>
              <CheckCircle2 className="w-4 h-4" style={{ color: palette.accentDeep }} /> Completed
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl sm:text-2xl font-bold" style={{ color: palette.text }}>
              {calendarData.statistics.totalTasksCompleted}
            </div>
            <div className="text-xs" style={{ color: palette.text2 }}>
              Total tasks
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm" style={{ backgroundColor: palette.card, border: `1px solid ${palette.border}` }}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xs sm:text-sm" style={{ color: palette.text }}>
              <TrendingUp className="w-4 h-4" /> Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl sm:text-2xl font-bold" style={{ color: palette.accentDeep }}>
              {calendarData.statistics.completionRate}%
            </div>
            <div className="text-xs" style={{ color: palette.text2 }}>
              Overall
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm" style={{ backgroundColor: palette.card, border: `1px solid ${palette.border}` }}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xs sm:text-sm" style={{ color: palette.text }}>
              <Zap className="w-4 h-4" /> Total Study Time
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl sm:text-2xl font-bold" style={{ color: palette.text }}>
              {Math.round(calendarData.statistics.totalStudyTime / 60)}h
            </div>
            <div className="text-xs" style={{ color: palette.text2 }}>
              Lifetime
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Calendar Section */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm" style={{ backgroundColor: palette.card, border: `1px solid ${palette.border}` }}>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg flex items-center gap-2" style={{ color: palette.text }}>
                <CalendarDays className="w-5 h-5" />{" "}
                {currentMonth.toLocaleString("default", {
                  month: "long",
                  year: "numeric",
                })}
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                  style={{ borderColor: palette.border, color: palette.text, backgroundColor: palette.card }}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentMonth(new Date())}
                  style={{ borderColor: palette.border, color: palette.text, backgroundColor: palette.card }}
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('next')}
                  style={{ borderColor: palette.border, color: palette.text, backgroundColor: palette.card }}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Week Headers */}
              <div className="grid grid-cols-7 text-center mb-4 text-sm font-medium" style={{ color: palette.text2 }}>
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="py-2">{day}</div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2 justify-items-center">
                {generateCalendarGrid()}
              </div>

              {/* Updated Legend */}
              <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mt-6 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: palette.accentDeep }}></div>
                  <span style={{ color: palette.text2 }}>Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: palette.accent }}></div>
                  <span style={{ color: palette.text2 }}>Today</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: palette.text }}></div>
                  <span style={{ color: palette.text2 }}>Pending Task</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded border" style={{ backgroundColor: palette.card, borderColor: palette.border }}></div>
                  <span style={{ color: palette.text2 }}>No Task</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tasks Sidebar */}
        <div className="space-y-6">
          {/* Today's Task */}
          <Card className="shadow-sm" style={{ backgroundColor: palette.card, border: `1px solid ${palette.border}` }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm" style={{ color: palette.text }}>
                <Target className="w-4 h-4" /> Today's AI Task
                <Badge variant="secondary" className="ml-2 text-xs" style={{ backgroundColor: palette.bg, color: palette.text, borderColor: palette.border }}>
                  {calendarData.todayTasks?.length || 0}/1
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {calendarData.todayTasks?.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: palette.bg }}>
                    <CalendarDays className="w-6 h-6" style={{ color: palette.text }} />
                  </div>
                  <p className="text-sm mb-4" style={{ color: palette.text2 }}>
                    No task for today. Generating one now...
                  </p>
                  <Button
                    size="sm"
                    onClick={handleRegenerateTask}
                    disabled={regenerating}
                    className="w-full shadow-lg"
                    style={{ backgroundColor: palette.accentDeep, color: palette.card, boxShadow: `0 4px 6px -1px ${palette.accentDeep}33` }}
                  >
                    {regenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Generate Task
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                calendarData.todayTasks.map((task) => (
                  <TaskItem
                    key={task.taskId}
                    task={task}
                    onComplete={handleCompleteTask}
                    onRegenerate={handleRegenerateTask}
                  />
                ))
              )}

              {/* Daily Progress */}
              <div className="pt-4" style={{ borderTop: `1px solid ${palette.border}` }}>
                <div className="flex justify-between text-sm mb-2">
                  <span style={{ color: palette.text2 }}>Daily Progress</span>
                  <span className="font-medium" style={{ color: palette.text }}>
                    {calendarData.todayTasks?.some(t => t.status === "completed") ? "100%" : "0%"}
                  </span>
                </div>
                <Progress
                  value={calendarData.todayTasks?.some(t => t.status === "completed") ? 100 : 0}
                  className="h-2"
                  style={{ backgroundColor: palette.progressTrack }}
                  indicatorStyle={{ backgroundColor: palette.progressFill }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Study Preferences */}
          <StudyPreferencesCard preferences={calendarData.studyPreferences} />
          
          {/* Statistics */}
          <Card className="shadow-sm" style={{ backgroundColor: palette.card, border: `1px solid ${palette.border}` }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm" style={{ color: palette.text }}>
                <TrendingUp className="w-4 h-4" /> Other Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm" style={{ color: palette.text2 }}>Average Daily Tasks</span>
                <span className="font-medium" style={{ color: palette.text }}>
                  {calendarData.statistics.averageDailyTasks.toFixed(1)}
                </span>
              </div>
              <div className="text-xs mt-3 p-3 rounded" style={{ backgroundColor: palette.bg, color: palette.text2, border: `1px solid ${palette.border}` }}>
                 Tip: Consistency is key! Keep your streak alive to maximize your learning.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Task Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md sm:max-w-2xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: palette.card, border: `1px solid ${palette.border}`, color: palette.text }}>
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold" style={{ color: palette.text }}>Create Custom Task</DialogTitle>
            <DialogDescription style={{ color: palette.text2 }}>
              Create your own task and earn XP when you complete it!
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="font-medium" style={{ color: palette.text }}>Task Title *</Label>
              <Input
                id="title"
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                placeholder="e.g., Review JavaScript fundamentals"
                className="focus:border-black"
                style={{ backgroundColor: palette.card, borderColor: palette.border, color: palette.text }}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="font-medium" style={{ color: palette.text }}>Description *</Label>
              <Textarea
                id="description"
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                placeholder="Describe what you want to accomplish..."
                rows={3}
                className="focus:border-black"
                style={{ backgroundColor: palette.card, borderColor: palette.border, color: palette.text }}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="date" className="font-medium" style={{ color: palette.text }}>Date *</Label>
                  <div className="rounded-md p-2" style={{ border: `1px solid ${palette.border}`, backgroundColor: palette.card }}>
                    <DatePicker
                      mode="single"
                      selected={taskForm.date}
                      onSelect={(date) => date && setTaskForm({ ...taskForm, date })}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      style={{ backgroundColor: palette.card }}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="type" className="font-medium" style={{ color: palette.text }}>Task Type</Label>
                  <Select
                    value={taskForm.type}
                    onValueChange={(value) => setTaskForm({ ...taskForm, type: value as Task['type'] })}
                  >
                    <SelectTrigger className="focus:border-black" style={{ backgroundColor: palette.card, borderColor: palette.border, color: palette.text }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent style={{ backgroundColor: palette.card, borderColor: palette.border }}>
                      <SelectItem value="study">Study</SelectItem>
                      <SelectItem value="quiz">Quiz</SelectItem>
                      <SelectItem value="reading">Reading</SelectItem>
                      <SelectItem value="practice">Practice</SelectItem>
                      <SelectItem value="assignment">Assignment</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="duration" className="font-medium" style={{ color: palette.text }}>Duration (min)</Label>
                      <Input
                        id="duration"
                        type="number"
                        min="1"
                        value={taskForm.estimatedDuration}
                        onChange={(e) => setTaskForm({ ...taskForm, estimatedDuration: parseInt(e.target.value) || 30 })}
                        className="focus:border-black"
                        style={{ backgroundColor: palette.card, borderColor: palette.border, color: palette.text }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="priority" className="font-medium" style={{ color: palette.text }}>Priority</Label>
                      <Select
                        value={taskForm.priority}
                        onValueChange={(value) => setTaskForm({ ...taskForm, priority: value as Task['priority'] })}
                      >
                        <SelectTrigger className="focus:border-black" style={{ backgroundColor: palette.card, borderColor: palette.border, color: palette.text }}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent style={{ backgroundColor: palette.card, borderColor: palette.border }}>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="difficulty" className="font-medium" style={{ color: palette.text }}>Difficulty</Label>
                  <Select
                    value={taskForm.difficulty}
                    onValueChange={(value) => setTaskForm({ ...taskForm, difficulty: value as Task['difficulty'] })}
                  >
                    <SelectTrigger className="focus:border-black" style={{ backgroundColor: palette.card, borderColor: palette.border, color: palette.text }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent style={{ backgroundColor: palette.card, borderColor: palette.border }}>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category" className="font-medium" style={{ color: palette.text }}>Category</Label>
                  <Input
                    id="category"
                    value={taskForm.category}
                    onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value })}
                    placeholder="e.g., Programming, Math"
                    className="focus:border-black"
                    style={{ backgroundColor: palette.card, borderColor: palette.border, color: palette.text }}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={creating}
              className="w-full sm:w-auto hover:text-black"
              style={{ borderColor: palette.border, color: palette.text2, backgroundColor: palette.card }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = palette.cardHover}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = palette.card}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateTask}
              disabled={creating}
              className="w-full sm:w-auto"
              style={{ backgroundColor: palette.accentDeep, color: palette.card }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = palette.accent}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = palette.accentDeep}
            >
              {creating ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Calendar;