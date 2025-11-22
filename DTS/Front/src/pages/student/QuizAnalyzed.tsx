import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  XCircle,
  Target,
  Clock,
  Award,
  ArrowLeft,
  Activity,
  BarChart3,
  PieChart as PieIcon,
} from "lucide-react";

const COLORS = ["#22c55e", "#ef4444"];

const QuizAnalyzed = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const analysis = state?.analysis || state;
  console.log(analysis)

  if (!analysis)
    return (
      <div className="flex justify-center items-center h-[80vh] text-muted-foreground">
        No analysis data found.
      </div>
    );

  const {
    quizTitle = "Quiz Analysis",
    correctCount = 0,
    wrongCount = 0,
    accuracy = 0,
    totalMarks = 0,
    scoredMarks = 0,
    timeTaken = "0m 0s",
    xpGained = 0,
    questionAnalysis = [],
    charts = { pie: [], bar: [] },
  } = analysis;

  // Safe time parsing
  const timeValue = (() => {
    const t = String(timeTaken).split(" ")[0];
    return isNaN(parseInt(t)) ? 0 : parseInt(t);
  })();

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex justify-between items-center flex-wrap gap-4"
      >
        <div>
          <h1 className="text-4xl font-bold text-primary">{quizTitle}</h1>
          <div className="text-muted-foreground mt-2 text-base flex flex-wrap gap-6">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-primary" /> {timeTaken}
            </span>
            <span className="flex items-center gap-1">
              <Activity className="w-4 h-4 text-green-600" /> {accuracy}% Accuracy
            </span>
            <span className="flex items-center gap-1">
              <Award className="w-4 h-4 text-yellow-500" /> +{xpGained} XP
            </span>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate("/student/quizzes")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card className="border-green-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" /> Correct
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{correctCount}</CardContent>
        </Card>

        <Card className="border-red-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-500">
              <XCircle className="w-5 h-5" /> Wrong
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{wrongCount}</CardContent>
        </Card>

        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Target className="w-5 h-5" /> Score
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">
            {scoredMarks}/{totalMarks}
          </CardContent>
        </Card>

        <Card className="border-yellow-400/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-500">
              <Award className="w-5 h-5" /> XP Gained
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">+{xpGained}</CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Pie Chart */}
        <Card className="border-primary/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-primary" /> Answer Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip />
                <Pie
                  data={charts?.pie || []}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {(charts?.pie || []).map((entry, index) => (
                    <Cell
                      key={index}
                      fill={COLORS[index % COLORS.length]}
                      stroke="#fff"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bar Chart */}
        <Card className="border-primary/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" /> Question-wise Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.bar || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="question" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="result" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Radar Chart */}
      <Card className="border-primary/20 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" /> Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart
              data={[
                { metric: "Accuracy", value: Number(accuracy) || 0 },
                { metric: "Speed", value: Math.max(0, 100 - timeValue * 10) },
                { metric: "XP", value: Math.min(100, xpGained * 10) },
                {
                  metric: "Consistency",
                  value: Math.min(100, correctCount * 25),
                },
              ]}
            >
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis angle={30} domain={[0, 100]} />
              <Radar
                name="Performance"
                dataKey="value"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.5}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Question Breakdown */}
      <Card className="border-primary/20 shadow-lg">
        <CardHeader>
          <CardTitle className="text-primary">
            Detailed Question Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {questionAnalysis.map((q, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className={`p-4 rounded-lg border transition-colors duration-300 ${
                  q.result === "✅"
                    ? "border-green-400/30 bg-green-50/40"
                    : "border-red-400/30 bg-red-50/40"
                }`}
              >
                <div className="flex justify-between items-center">
                  <p className="font-semibold text-lg text-primary">
                    Q{i + 1}. {q.questionText}
                  </p>
                  {q.result === "✅" ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Your Answer:{" "}
                  <span className="font-medium text-primary">
                    {q.selected || "Not answered"}
                  </span>{" "}
                  | Correct:{" "}
                  <span className="font-medium text-green-600">
                    {q.correct}
                  </span>
                </p>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizAnalyzed;
