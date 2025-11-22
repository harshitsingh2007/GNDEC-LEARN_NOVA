import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Legend,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Trophy, BarChart3, Target, Percent } from "lucide-react";

const COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444"];

const Summary = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  console.log(state)
  // -----------------------------
  // SAFETY CHECK
  // -----------------------------
  if (!state || !state.userPerformance || !state.analytics)
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-lg mb-4 text-muted-foreground">
          ⚠️ No analytics data found.
        </p>
        <Button onClick={() => navigate("/student/battleground")}>
          Go Back
        </Button>
      </div>
    );

  // FINAL DATA
  const { analytics, userPerformance, players } = state;

  // -----------------------------
  // Pie Chart: Correct vs Incorrect
  // -----------------------------
  const accuracyData = [
    { name: "Correct", value: userPerformance.correctCount ?? 0 },
    { name: "Incorrect", value: userPerformance.incorrectCount ?? 0 },
  ];

  // -----------------------------
  // Leaderboard Bar Chart
  // -----------------------------
  const leaderboardData = (players || []).map((p) => ({
    name: p.username,
    score: p.score,
    accuracy: Number(p.accuracy),
  }));

  // -----------------------------
  // Radar Chart - Performance Traits
  // -----------------------------
  const radarData = [
    { metric: "Accuracy", value: userPerformance.accuracy ?? 0 },
    {
      metric: "Completion",
      value:
        userPerformance.completedQuestions > 0
          ? (userPerformance.completedQuestions /
              (analytics.totalQuestions || userPerformance.completedQuestions)) *
            100
          : 0,
    },
    {
      metric: "Consistency",
      value:
        analytics.highestScore > 0
          ? (userPerformance.totalScore / analytics.highestScore) * 100
          : 0,
    },
  ];

  // -----------------------------
  // Timeline Line Chart
  // -----------------------------
  const timelineData = (userPerformance.timeline || []).map((t) => ({
    name: `Q${t.questionNumber}`,
    correct: t.correct ? 1 : 0,
  }));

  // -----------------------------
  // Tag-wise Performance Chart
  // -----------------------------
  const tagData = (analytics.tagWisePerformance || []).map((t) => ({
    tag: t.tag,
    accuracy: t.accuracy,
  }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8 flex flex-col space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Trophy className="text-primary w-7 h-7" />
            Battle Summary
          </h1>
          <p className="text-muted-foreground">
            Comprehensive performance analysis
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate("/student/battle-setup")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Battles
        </Button>
      </div>

      {/* Score Overview */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid gap-4 sm:gap-6 md:grid-cols-3"
      >
        {/* Score */}
        <Card className="bg-background/70 border-primary/30 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              <BarChart3 className="inline w-5 h-5 mr-2" />
              Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-primary">
              {userPerformance.totalScore}
            </p>
            <p className="text-sm text-muted-foreground">
              Rank: #{analytics.rank} out of {analytics.totalPlayers}
            </p>
          </CardContent>
        </Card>

        {/* Accuracy */}
        <Card className="bg-background/70 border-green-400/30 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              <Target className="inline w-5 h-5 mr-2 text-green-500" />
              Accuracy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-green-500">
              {userPerformance.accuracy}%
            </p>
            <p className="text-sm text-muted-foreground">
              Correct: {userPerformance.correctCount} /{" "}
              {userPerformance.completedQuestions}
            </p>
          </CardContent>
        </Card>

        {/* Average Score */}
        <Card className="bg-background/70 border-yellow-400/30 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              <Percent className="inline w-5 h-5 mr-2 text-yellow-500" />
              Avg Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-yellow-500">
              {(analytics.averageScore ?? 0).toFixed(1)}
            </p>
            <p className="text-sm text-muted-foreground">
              Across {analytics.totalPlayers} players
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pie Chart */}
        <Card className="bg-background/60 shadow-md">
          <CardHeader>
            <CardTitle>Answer Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={accuracyData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {accuracyData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Leaderboard */}
        <Card className="bg-background/60 shadow-md">
          <CardHeader>
            <CardTitle>Leaderboard</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer>
              <BarChart data={leaderboardData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="score" fill="#4f46e5" />
                <Bar dataKey="accuracy" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Radar */}
        <Card className="bg-background/60 shadow-md">
          <CardHeader>
            <CardTitle>Performance Traits</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer>
              <RadarChart outerRadius="70%" data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" />
                <Radar
                  name="Performance"
                  dataKey="value"
                  stroke="#4f46e5"
                  fill="#4f46e5"
                  fillOpacity={0.6}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card className="bg-background/60 shadow-md">
          <CardHeader>
            <CardTitle>Correctness Timeline</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 1]} ticks={[0, 1]} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="correct"
                  stroke="#4f46e5"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tag-based */}
        <Card className="bg-background/60 shadow-md">
          <CardHeader>
            <CardTitle>Topic-wise Accuracy</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer>
              <BarChart data={tagData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="tag" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="accuracy" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Paragraph Feedback */}
      {userPerformance.paragraphFeedback?.length > 0 && (
        <Card className="bg-background/70 border-primary/20 shadow-lg mt-6">
          <CardHeader>
            <CardTitle>Paragraph Question Feedback</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {userPerformance.paragraphFeedback.map((fb, idx) => (
              <div key={idx} className="p-4 border rounded-lg">
                <p className="font-semibold">Question ID: {fb.questionId}</p>
                <p className="text-sm text-muted-foreground">{fb.feedback}</p>
                <p className="mt-2 font-bold text-primary">
                  Points: {fb.points}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
};

export default Summary;
