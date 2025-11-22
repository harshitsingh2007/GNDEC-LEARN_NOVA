import { useEffect, useState, createContext, useContext } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

import AdminLogin from "./pages/admin/AdminLogin";
import AdminRoutes from "./pages/AdminRoutes";

// Student Pages
import StudentLayout from "./components/StudentLayout";
import StudentDashboard from "./pages/student/Dashboard";
import Calendar from "./pages/student/Calendar";
import Courses from "./pages/student/Courses";
import Quizzes from "./pages/student/Quizzes";
import Arena from "./pages/student/Arena";
import Settings from "./pages/student/Settings";

// Admin Pages
import AdminLayout from "./components/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminCourses from "./pages/admin/Courses";
import Students from "./pages/admin/Students";
import Assessments from "./pages/admin/Assessments";
import AdminSettings from "./pages/admin/Settings";
import AssignmentSubmissions from "./pages/admin/AssignmentSubmissions";
import MyLearning from "./pages/student/MyLearning";
import StudyGroud from "./pages/student/StudyGroud";
import TakeQuiz from "./pages/student/TakeQuiz";
import QuizAnalyzed from "./pages/student/QuizAnalyzed";
import History from "./pages/student/History";
import ChatBot from "./pages/student/ChatBot";
import AdminSignup from "./pages/admin/AdminSignup";
import DailyTask from "./pages/student/DailyTask";
import Assignments from "./pages/student/Assignments";
import BattleLive from "./pages/student/BattleLive";
import Summary from "./pages/student/Summary";
import CreateCourse from "./pages/student/CreateCourse";
import AutoGenerateCourse from "./pages/student/AutoCourseGeneration";
import PlaylistExtractor from "./pages/student/PlaylistExtracter";
import Store from "./pages/student/Store";
import BattleShow from "./pages/student/BattleShow";
import CreateRoadmap from "./pages/student/RoadMap";
import RoadMapDisplay from "./pages/student/RoadMapDisplay";
import RoadMapInt from "./pages/student/RoadMapInt";
import Notion from "./pages/student/Notion";
import Forum from "./pages/student/Forum";

// ✅ Create a context for the stopwatch
interface StopwatchContextType {
  elapsedTime: number;
  formatTime: (ms: number) => string;
}

const StopwatchContext = createContext<StopwatchContextType | undefined>(undefined);

export const useStopwatch = () => {
  const context = useContext(StopwatchContext);
  if (!context) {
    throw new Error("useStopwatch must be used within a StopwatchProvider");
  }
  return context;
};

const queryClient = new QueryClient();

// ✅ Simple and Reliable Stopwatch Provider
const StopwatchProvider = ({ children }: { children: React.ReactNode }) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(seconds).padStart(2, "0")}`;
  };

  useEffect(() => {
    // ✅ Initialize from localStorage
    const today = new Date().toDateString();
    const saved = localStorage.getItem("stopwatchData");
    
    let elapsed = 0;
    if (saved) {
      const data = JSON.parse(saved);
      if (data.date === today) {
        elapsed = data.elapsedTime || 0;
      }
    }

    setElapsedTime(elapsed);
    setIsInitialized(true);

    // ✅ Start new session with current timestamp
    const sessionStartTime = Date.now();
    localStorage.setItem(
      "stopwatchData",
      JSON.stringify({
        date: today,
        elapsedTime: elapsed,
        sessionStartTime: sessionStartTime,
      })
    );

    // ✅ Update every second
    const timer = setInterval(() => {
      const now = Date.now();
      const sessionElapsed = now - sessionStartTime;
      const totalElapsed = elapsed + sessionElapsed;
      
      setElapsedTime(totalElapsed);
      
      // ✅ Update localStorage with accumulated time
      localStorage.setItem(
        "stopwatchData",
        JSON.stringify({
          date: today,
          elapsedTime: totalElapsed,
          sessionStartTime: sessionStartTime, // Keep original session start
        })
      );
    }, 1000);

    // ✅ Handle page close/refresh
    const handleBeforeUnload = () => {
      const now = Date.now();
      const sessionElapsed = now - sessionStartTime;
      const totalElapsed = elapsed + sessionElapsed;
      
      localStorage.setItem(
        "stopwatchData",
        JSON.stringify({
          date: today,
          elapsedTime: totalElapsed,
          sessionStartTime: null, // End session
        })
      );
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    // ✅ Cleanup
    return () => {
      clearInterval(timer);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  return (
    <StopwatchContext.Provider value={{ elapsedTime, formatTime }}>
      {children}
    </StopwatchContext.Provider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <StopwatchProvider> {/* ✅ Wrap everything with stopwatch provider */}
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Student routes */}
            <Route
              path="/student"
              element={
                <StudentLayout>
                  <StudentDashboard />
                </StudentLayout>
              }
            />
            <Route
              path="/student/chatbot"
              element={
                <StudentLayout>
                  <ChatBot />
                </StudentLayout>
              }
            />
            <Route
              path="/student/calendar"
              element={
                <StudentLayout>
                  <Calendar />
                </StudentLayout>
              }
            />
            <Route
              path="/task/:taskId"
              element={
                // <StudentLayout>
                  <DailyTask />
                // </StudentLayout>
              }
            />
            <Route
              path="/student/hist"
              element={
                <StudentLayout>
                  <History />
                </StudentLayout>
              }
            />
            <Route
              path="/student/quizresult"
              element={
                <StudentLayout>
                  <QuizAnalyzed/>
                </StudentLayout>
              }
            />
            <Route
              path="/student/takequiz"
              element={
                <StudentLayout>
                  <TakeQuiz />
                </StudentLayout>
              }
            />
            <Route
              path="/student/courses"
              element={
                <StudentLayout>
                  <Courses />
                </StudentLayout>
              }
            />
            <Route
              path="/student/assignments"
              element={
                <StudentLayout>
                  <Assignments />
                </StudentLayout>
              }
            />
            <Route
              path="/student/learning"
              element={
                <StudentLayout>
                  <MyLearning />
                </StudentLayout>
              }
            />
            <Route
              path="/student/ground"
              element={
                // <StudentLayout>
                  <StudyGroud />
                // </StudentLayout>
              }
            />
            <Route
              path="/student/generatecourse"
              element={
                <StudentLayout>
                  <AutoGenerateCourse />
                </StudentLayout>
              }
            />
            <Route
              path="/student/store"
              element={
                <StudentLayout>
                  <Store />
                </StudentLayout>
              }
            />
            <Route
              path="/student/viaplaylist"
              element={
                <StudentLayout>
                  <PlaylistExtractor />
                </StudentLayout>
              }
            />
            <Route
              path="/student/createroadmap"
              element={
                <StudentLayout>
                  <CreateRoadmap />
                </StudentLayout>
              }
            />
            <Route
              path="/student/viewroadmap"
              element={
                <StudentLayout>
                  <RoadMapDisplay />
                </StudentLayout>
              }
            />
            <Route
              path="/student/roadmap"
              element={
                <StudentLayout>
                  <RoadMapInt />
                </StudentLayout>
              }
            />
            <Route
              path="/student/battleanalysis"
              element={
                <StudentLayout>
                  <BattleShow />
                </StudentLayout>
              }
            />
            <Route
              path="/student/battleground"
              element={
                <StudentLayout>
                  <BattleLive />
                </StudentLayout>
              }
            />
            <Route
              path="/student/summary"
              element={
                <StudentLayout>
                  <Summary />
                </StudentLayout>
              }
            />
            <Route
              path="/student/createcourse"
              element={
                <StudentLayout>
                  <CreateCourse/>
                </StudentLayout>
              }
            />
            <Route
              path="/student/quizzes"
              element={
                <StudentLayout>
                  <Quizzes />
                </StudentLayout>
              }
            />
            <Route
              path="/student/arena"
              element={
                <StudentLayout>
                  <Arena />
                </StudentLayout>
              }
            />
            <Route
              path="/student/settings"
              element={
                <StudentLayout>
                  <Settings />
                </StudentLayout>
              }
            />
            <Route
              path="/student/notion"
              element={
                <StudentLayout>
                  <Notion />
                </StudentLayout>
              }
            />
            <Route
              path="/student/forum"
              element={
                <StudentLayout>
                  <Forum />
                </StudentLayout>
              }
            />

            {/* Admin routes - Public */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/signup" element={<AdminSignup />} />

            {/* Admin routes - Protected */}
            <Route
              path="/admin"
              element={
                <AdminRoutes>
                  <AdminLayout>
                    <AdminDashboard />
                  </AdminLayout>
                </AdminRoutes>
              }
            />
            <Route
              path="/admin/courses"
              element={
                <AdminRoutes>
                  <AdminLayout>
                    <AdminCourses />
                  </AdminLayout>
                </AdminRoutes>
              }
            />
            <Route
              path="/admin/students"
              element={
                <AdminRoutes>
                  <AdminLayout>
                    <Students />
                  </AdminLayout>
                </AdminRoutes>
              }
            />
            <Route
              path="/admin/assessments"
              element={
                <AdminRoutes>
                  <AdminLayout>
                    <Assessments />
                  </AdminLayout>
                </AdminRoutes>
              }
            />
            <Route
              path="/admin/assignments/:id/submissions"
              element={
                <AdminRoutes>
                  <AdminLayout>
                    <AssignmentSubmissions />
                  </AdminLayout>
                </AdminRoutes>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <AdminRoutes>
                  <AdminLayout>
                    <AdminSettings />
                  </AdminLayout>
                </AdminRoutes>
              }
            />


            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </StopwatchProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;