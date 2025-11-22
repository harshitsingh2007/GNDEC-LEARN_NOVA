import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Target,
  Flame,
  BookOpen,
  Clock,
  Zap,
  ChevronRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useStopwatch } from "../../App";
import { palette } from "../../theme/palette";




const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { elapsedTime, formatTime } = useStopwatch();

  /* FETCH DATA */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers: any = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await axios.get("http://localhost:5000/api/auth/dashboard", {
          headers,
          withCredentials: true,
        });

        setUser(res.data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading)
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: palette.bg }}
      >
        <p style={{ color: palette.text2 }}>Loading dashboard…</p>
      </div>
    );

  if (error)
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: palette.bg }}
      >
        <div className="text-center">
          <p className="mb-4" style={{ color: "#F87171" }}>
            {error}
          </p>
          <Button
            onClick={() => window.location.reload()}
            className="text-white font-semibold"
            style={{ background: palette.accent }}
          >
            Retry
          </Button>
        </div>
      </div>
    );

  /* MAP DATA */
  const studyTimeData = (user?.last7DaysStudy || []).map((item: any) => ({
    day: item.day || "Mon",
    hours: item.hours || 0,
  }));

  const xpGrowthData = (user?.xpHistory || []).map((item: any) => ({
    day: item.day || "Mon",
    xp: item.xp || 0,
  }));

  const courses = user?.courses || [];
  const upcomingTasks = user?.upcomingTasks || [];
  const stats = user?.statistics || {};
  const streakStats =
    user?.streakStats || { currentStreak: 0, longestStreak: 0 };

  const masteryScore = Math.round(
    stats?.completionRate || user?.masteryScore || 0
  );

  const xpGoal = Math.max((user?.level || 1) * 100, 100);
  const xpProgress = Math.min(
    100,
    Math.round(((user?.xp || 0) / xpGoal) * 100)
  );

  const weakTopics = user?.weakTopics || [
    "No weak areas identified yet",
  ];

  return (
    <div
      className="flex flex-col h-screen "
      style={{ background: palette.bg }}
    >
      {/* HEADER - Similar to ChatBot */}
      <div className="flex items-center justify-between px-2 sm:px-6 sm:py-2 border-b" style={{ borderColor: palette.border, background: palette.card }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1 }} className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 mb-12" style={{ background: palette.accent }}>
            <Zap className="w-4 h-4 sm:w-6 sm:h-6" style={{ color: palette.card }} />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold truncate " style={{ color: palette.text }}>
              Welcome back,{" "}
              <span style={{ color: palette.accent }}>
                {user?.name || "Student"}
              </span>{" "}
              
            </h1>
            <p className="text-xs sm:text-sm mt-0.5 hidden sm:block mb-12" style={{ color: palette.text2 }}>
              Continue learning with{" "}
              <span style={{ color: palette.accent }}>LearnNova</span>
            </p>
          </div>
        </motion.div>
      </div>

      {/* MAIN CONTENT AREA - Scrollable like ChatBot */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6" style={{ background: palette.bg }}>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total XP"
          icon={Zap}
          value={user?.xp || 0}
          sub={`+${user?.weeklyXP || 0} this week`}
          progress={xpProgress}
        />

        <StatCard
          title="Study Streak"
          icon={Flame}
          value={`${streakStats.currentStreak} days`}
          sub={`Best: ${streakStats.longestStreak}`}
          streak={streakStats.currentStreak}
        />

        <StatCard
          title="Avg. Mastery"
          icon={Target}
          value={`${masteryScore}%`}
          sub={`Tasks: ${stats.totalTasksCompleted || 0}`}
          progress={masteryScore}
        />

        {/* Stopwatch */}
        <Card
          className="border shadow-md"
          style={{ background: palette.card, borderColor: palette.border }}
        >
          <CardHeader className="flex justify-between">
            <CardTitle className="text-sm" style={{ color: palette.text }}>
              App Usage Time
            </CardTitle>
            <Clock className="w-4 h-4" style={{ color: palette.accent }} />
          </CardHeader>
          <CardContent>
            <div
              className="text-3xl font-bold font-mono"
              style={{ color: palette.text }}
            >
              {formatTime(elapsedTime)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CHARTS */}
      <div className="grid lg:grid-cols-2 gap-6">
        <ChartCard
          title="Weekly Study Time"
          icon={Clock}
          type="area"
          data={studyTimeData}
          xKey="day"
          yKey="hours"
        />

        <ChartCard
          title="XP Growth"
          icon={Zap}
          type="line"
          data={xpGrowthData}
          xKey="day"
          yKey="xp"
        />
      </div>

      {/* TASKS / COURSES / FOCUS */}
      <div className="grid lg:grid-cols-3 gap-6">
        <TaskSection upcomingTasks={upcomingTasks} />
        <CoursesSection courses={courses} />
        <FocusSection weakTopics={weakTopics} />
      </div>
      </div>
    </div>
  );
};

export default Dashboard;

/* ---------------------- STAT CARD ---------------------- */
const StatCard = ({ title, icon: Icon, value, sub, progress, streak }: any) => (
  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1 }}>
    <Card
      className="border p-4 transition rounded-xl shadow-sm"
      style={{
        background: palette.card,
        borderColor: palette.border,
      }}
    >
      <CardHeader className="flex justify-between items-center">
        <CardTitle
          className="text-sm flex items-center gap-2"
          style={{ color: palette.text }}
        >
          <Icon className="w-4 h-4" style={{ color: palette.accent }} />{" "}
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <p className="text-3xl font-bold" style={{ color: palette.text }}>
          {value}
        </p>
        <p className="text-xs mt-1" style={{ color: palette.text2 }}>
          {sub}
        </p>

        {progress !== undefined && (
          <Progress
            value={progress}
            className="mt-3 h-2"
            style={{ background: palette.chartGrid }}
          />
        )}

        {streak && (
          <div className="flex gap-1 mt-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 h-2 rounded-full"
                style={{
                  background: i < streak ? palette.accent : palette.chartGrid,
                }}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  </motion.div>
);

/* ---------------------- CHART CARD ---------------------- */
const ChartCard = ({ title, icon: Icon, type, data, xKey, yKey }: any) => (
  <Card
    className="border shadow-sm rounded-xl"
    style={{
      background: palette.card,
      borderColor: palette.border,
    }}
  >
    <CardHeader>
      <CardTitle
        className="flex items-center gap-2 text-lg"
        style={{ color: palette.text }}
      >
        <Icon className="w-5 h-5" style={{ color: palette.accent }} /> {title}
      </CardTitle>
    </CardHeader>

    <CardContent>
      <ResponsiveContainer width="100%" height={220}>
        {type === "area" ? (
          <AreaChart data={data}>
            <CartesianGrid stroke={palette.chartGrid} />
            <XAxis dataKey={xKey} stroke={palette.text2} />
            <YAxis stroke={palette.text2} />
            <Tooltip
              contentStyle={{
                background: palette.card,
                border: `1px solid ${palette.border}`,
                color: palette.text,
              }}
            />
            <Area
              type="monotone"
              dataKey={yKey}
              stroke={palette.accent}
              fill={palette.chartFill}
              strokeWidth={2}
            />
          </AreaChart>
        ) : (
          <LineChart data={data}>
            <CartesianGrid stroke={palette.chartGrid} />
            <XAxis dataKey={xKey} stroke={palette.text2} />
            <YAxis stroke={palette.text2} />
            <Tooltip
              contentStyle={{
                background: palette.card,
                border: `1px solid ${palette.border}`,
                color: palette.text,
              }}
            />
            <Line
              type="monotone"
              dataKey={yKey}
              stroke={palette.accent}
              strokeWidth={3}
              dot={{ fill: palette.accent, r: 4 }}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </CardContent>
  </Card>
);

/* ---------------------- TASK SECTION ---------------------- */
const TaskSection = ({ upcomingTasks }: any) => (
  <Card
    className="border shadow-sm rounded-xl"
    style={{
      background: palette.card,
      borderColor: palette.border,
    }}
  >
    <CardHeader>
      <CardTitle className="text-lg" style={{ color: palette.text }}>
        Upcoming Tasks
      </CardTitle>
    </CardHeader>

    <CardContent className="space-y-3">
      {upcomingTasks?.length > 0 ? (
        upcomingTasks.slice(0, 3).map((task: any, i: number) => (
          <div
            key={i}
            className="p-3 rounded-xl"
            style={{
              background: palette.cardHover,
              border: `1px solid ${palette.border}`,
            }}
          >
            <p
              className="font-medium text-sm"
              style={{ color: palette.text }}
            >
              {task.title || "Untitled Task"}
            </p>
            <p className="text-xs" style={{ color: palette.text2 }}>
              Due:{" "}
              {task.dueDate
                ? new Date(task.dueDate).toLocaleDateString()
                : "TBD"}
            </p>
          </div>
        ))
      ) : (
        <p className="text-sm" style={{ color: palette.text2 }}>
          No upcoming tasks yet.
        </p>
      )}

      <Link to="/student/calendar">
        <Button
          className="w-full mt-2 rounded-xl shadow-lg transition-all duration-200"
          style={{ background: palette.accent, color: palette.card }}
          onMouseEnter={(e) => e.currentTarget.style.background = palette.accentDeep}
          onMouseLeave={(e) => e.currentTarget.style.background = palette.accent}
        >
          View All <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </Link>
    </CardContent>
  </Card>
);

/* ---------------------- COURSES SECTION ---------------------- */
const CoursesSection = ({ courses }: any) => (
  <Card
    className="border shadow-sm rounded-xl"
    style={{
      background: palette.card,
      borderColor: palette.border,
    }}
  >
    <CardHeader>
      <CardTitle className="text-lg" style={{ color: palette.text }}>
        Continue Learning
      </CardTitle>
    </CardHeader>

    <CardContent className="space-y-3">
      {courses?.length > 0 ? (
        courses.slice(0, 2).map((course: any, i: number) => (
          <div
            key={i}
            className="p-3 rounded-xl"
            style={{
              background: palette.cardHover,
              border: `1px solid ${palette.border}`,
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4" style={{ color: palette.accent }} />
              <p
                className="font-medium text-sm"
                style={{ color: palette.text }}
              >
                {course.title}
              </p>
            </div>

            <Progress
              value={course.progress}
              className="h-2"
              style={{ background: palette.chartGrid }}
            />

            <p className="text-xs mt-1" style={{ color: palette.text2 }}>
              {course.progress}% complete
            </p>
          </div>
        ))
      ) : (
        <p className="text-sm" style={{ color: palette.text2 }}>
          No courses enrolled yet.
        </p>
      )}

      <Link to="/student/courses">
        <Button
          className="w-full mt-2 rounded-xl shadow-lg transition-all duration-200"
          style={{ background: palette.accent, color: palette.card }}
          onMouseEnter={(e) => e.currentTarget.style.background = palette.accentDeep}
          onMouseLeave={(e) => e.currentTarget.style.background = palette.accent}
        >
          View All Courses <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </Link>
    </CardContent>
  </Card>
);

/* ---------------------- FOCUS SECTION ---------------------- */
const FocusSection = ({ weakTopics }: any) => (
  <Card
    className="border shadow-sm rounded-xl"
    style={{
      background: palette.card,
      borderColor: palette.border,
    }}
  >
    <CardHeader>
      <CardTitle
        className="flex items-center gap-2 text-lg"
        style={{ color: palette.text }}
      >
        <Target className="w-5 h-5" style={{ color: palette.accent }} /> Focus
        Areas
      </CardTitle>
    </CardHeader>

    <CardContent className="space-y-3">
      {weakTopics?.length > 0 ? (
        weakTopics.map((topic: string, i: number) => (
          <div
            key={i}
            className="p-2 rounded-xl flex items-center gap-2"
            style={{
              background: palette.cardHover,
              border: `1px solid ${palette.border}`,
            }}
          >
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold"
              style={{
                background: palette.chartFill,
                color: palette.text,
              }}
            >
              {i + 1}
            </span>
            <span className="text-sm" style={{ color: palette.text }}>
              {topic}
            </span>
          </div>
        ))
      ) : (
        <p className="text-sm" style={{ color: palette.text2 }}>
          No weak areas identified 🎉
        </p>
      )}

      {weakTopics?.length > 0 && (
        <Button
          className="w-full rounded-xl shadow-lg transition-all duration-200"
          style={{ background: palette.accent, color: palette.card }}
          onMouseEnter={(e) => e.currentTarget.style.background = palette.accentDeep}
          onMouseLeave={(e) => e.currentTarget.style.background = palette.accent}
        >
          Start Review Session
        </Button>
      )}
    </CardContent>
  </Card>
);
