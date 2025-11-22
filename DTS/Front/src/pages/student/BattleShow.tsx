import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";

import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import {
    Trophy,
    ArrowLeft,
    Users,
    BarChart3,
    Target,
    List,
    Loader2,
    CheckCircle,
    XCircle,
    Layers,
} from "lucide-react";

import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    XAxis,
    YAxis,
    CartesianGrid,
} from "recharts";
import { palette } from "@/theme/palette";

// Extended palette with chart colors
const extendedPalette = {
    ...palette,
    // Chart Colors based on theme
    CHART_PRIMARY: "#7C5BDA", // accentDeep (Bar 1, Pie 1)
    CHART_SECONDARY: "#A78BFA", // accent (Bar 2, Pie 2)
    CHART_TERTIARY: "#3B2F5D", // text (Pie 3)
    CHART_QUATERNARY: "#F59E0B", // warning/amber (Pie 4)
    CHART_INFO: "#34D399", // Green for positive/easy
    CHART_DANGER: "#EF4444", // Red for negative/hard
    destructive: "#EF4444", // Red for errors
};

// Colors array for Pie Chart cells
const COLORS = [extendedPalette.CHART_PRIMARY, extendedPalette.CHART_SECONDARY, extendedPalette.CHART_TERTIARY, extendedPalette.CHART_QUATERNARY];

// ─────────────────────────────────────────────
// Component Logic
// ─────────────────────────────────────────────

// Helper function to process data for charts
const processQuestionBreakdown = (questions) => {
    if (!questions || questions.length === 0) return { typeData: [], difficultyData: [] };

    const typeCounts = questions.reduce((acc, q) => {
        const type = q.questionType || 'Other';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {});

    const difficultyCounts = questions.reduce((acc, q) => {
        const difficulty = q.difficulty || 'Medium';
        acc[difficulty] = (acc[difficulty] || 0) + 1;
        return acc;
    }, {});

    const typeData = Object.keys(typeCounts).map(key => ({
        name: key.toUpperCase(),
        count: typeCounts[key],
    }));

    const difficultyData = Object.keys(difficultyCounts).map(key => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        count: difficultyCounts[key],
    }));

    return { typeData, difficultyData };
};


const BattleShow = () => {
    const { state } = useLocation();
    const navigate = useNavigate();

    const battleId = state?.battleId;

    const [loading, setLoading] = useState(true);
    const [battle, setBattle] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [performance, setPerformance] = useState(null);
    const [questionBreakdown, setQuestionBreakdown] = useState({ typeData: [], difficultyData: [] });

    // ─────────────────────────────────────────────
    // Fetch battle analysis
    // ─────────────────────────────────────────────
    useEffect(() => {
        if (!battleId) return;

        const fetchAnalysis = async () => {
            try {
                const res = await axios.post(
                    `http://localhost:5000/api/battle/analysis`,
                    { battleId },
                    { withCredentials: true }
                );

                setBattle(res.data.battle);
                setLeaderboard(res.data.leaderboard);
                setPerformance(res.data.performance);
                setQuestionBreakdown(processQuestionBreakdown(res.data.battle?.questions));
            } catch (err) {
                console.error("❌ Battle Analysis Error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalysis();
    }, [battleId]);

    if (!battleId) {
        return (
            <div className="p-10 text-center" style={{ backgroundColor: extendedPalette.bg }}>
                <p className="text-lg" style={{ color: extendedPalette.destructive }}>❌ No Battle ID Provided.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen" style={{ backgroundColor: extendedPalette.bg }}>
                <Loader2 className="animate-spin w-8 h-8" style={{ color: extendedPalette.text2 }} />
                <p className="text-lg ml-3" style={{ color: extendedPalette.text2 }}>Loading battle analysis...</p>
            </div>
        );
    }

    if (!battle || !performance) {
        return (
            <div className="p-10 text-center" style={{ backgroundColor: extendedPalette.bg }}>
                <p className="text-lg" style={{ color: extendedPalette.destructive }}>Failed to load battle data.</p>
            </div>
        );
    }

    // Pie chart data preparation (from leaderboard accuracy, same as before)
    const accuracyPie = leaderboard.map((p, i) => ({
        name: p.username,
        value: Number(p.accuracy),
    }));

    // Rechart utility for styling axis/text
    const ChartTheme = {
        fill: extendedPalette.text,
        stroke: extendedPalette.text,
        fontSize: '12px',
        tick: { fill: extendedPalette.text2 },
        label: { fill: extendedPalette.text2 },
        axisLine: { stroke: extendedPalette.border },
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen p-4 sm:p-6 lg:p-8 space-y-8"
            style={{ backgroundColor: extendedPalette.bg }}
        >
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-bold flex items-center gap-3" style={{ color: extendedPalette.text }}>
                        <Trophy className="w-6 h-6 sm:w-8 sm:h-8" style={{ color: extendedPalette.accentDeep }} />
                        {battle.battleName}
                    </h1>
                    <p className="text-sm sm:text-base" style={{ color: extendedPalette.text2 }}>
                        Battle Code: <b style={{ color: extendedPalette.text }}>{battle.battleCode}</b>
                    </p>
                </div>

                <Button
                    variant="outline"
                    onClick={() => navigate(-1)}
                    className="w-full sm:w-auto text-sm"
                    style={{ 
                        borderColor: extendedPalette.border, 
                        color: extendedPalette.text2, 
                        backgroundColor: extendedPalette.card 
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = extendedPalette.cardHover}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = extendedPalette.card}
                >
                    <ArrowLeft className="mr-2 w-4 h-4" /> Back to Setup
                </Button>
            </div>

            {/* TAGS */}
            <Card className="shadow-lg" style={{ backgroundColor: extendedPalette.card, border: `1px solid ${extendedPalette.border}` }}>
                <CardHeader>
                    <CardTitle className="text-lg sm:text-xl" style={{ color: extendedPalette.text }}>Tags</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-3">
                    {battle.tags.map((t, i) => (
                        <span
                            key={i}
                            className="px-3 py-1 rounded-full text-sm"
                            style={{ 
                                backgroundColor: extendedPalette.accentSoft, 
                                color: extendedPalette.accentDeep,
                                border: `1px solid ${extendedPalette.accent}`
                            }}
                        >
                            #{t}
                        </span>
                    ))}
                </CardContent>
            </Card>

            {/* STATS ROW */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <Card className="shadow-sm" style={{ backgroundColor: extendedPalette.card, border: `1px solid ${extendedPalette.border}` }}>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base" style={{ color: extendedPalette.text }}>
                            <Users className="w-5 h-5" style={{ color: extendedPalette.accentDeep }} /> Players
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-3xl font-bold pt-0" style={{ color: extendedPalette.text }}>
                        {performance.totalPlayers}
                    </CardContent>
                </Card>

                <Card className="shadow-sm" style={{ backgroundColor: extendedPalette.card, border: `1px solid ${extendedPalette.border}` }}>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base" style={{ color: extendedPalette.text }}>
                            <BarChart3 className="w-5 h-5" style={{ color: extendedPalette.accent }} /> Highest Score
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-3xl font-bold pt-0" style={{ color: extendedPalette.accentDeep }}>
                        {performance.highestScore}
                    </CardContent>
                </Card>

                <Card className="shadow-sm" style={{ backgroundColor: extendedPalette.card, border: `1px solid ${extendedPalette.border}` }}>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base" style={{ color: extendedPalette.text }}>
                            <Target className="w-5 h-5" style={{ color: extendedPalette.CHART_SECONDARY }} /> Avg. Score
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-3xl font-bold pt-0" style={{ color: extendedPalette.CHART_SECONDARY }}>
                        {performance.averageScore.toFixed(1)}
                    </CardContent>
                </Card>
                
                 <Card className="shadow-sm" style={{ backgroundColor: extendedPalette.card, border: `1px solid ${extendedPalette.border}` }}>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base" style={{ color: extendedPalette.text }}>
                            <Layers className="w-5 h-5" style={{ color: extendedPalette.CHART_TERTIARY }} /> Total Questions
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-3xl font-bold pt-0" style={{ color: extendedPalette.text }}>
                        {battle.questions?.length || 0}
                    </CardContent>
                </Card>
            </div>

            {/* LEADERBOARD & QUESTION BREAKDOWN */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* LEADERBOARD TABLE (Non-Top Users/All Users Included) */}
                <Card className="shadow-sm lg:col-span-1" style={{ backgroundColor: extendedPalette.card, border: `1px solid ${extendedPalette.border}` }}>
                    <CardHeader>
                        <CardTitle className="text-lg sm:text-xl" style={{ color: extendedPalette.text }}>Leaderboard</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {leaderboard.length === 0 ? (
                            <p className="text-sm" style={{ color: extendedPalette.text2 }}>No submissions yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {leaderboard.sort((a, b) => b.score - a.score).map((p, idx) => {
                                    const isTop = idx < 3;
                                    return (
                                        <div
                                            key={p.username}
                                            className={`flex justify-between items-center p-3 rounded-lg border ${isTop ? 'font-bold' : 'text-sm'}`}
                                            style={{
                                                backgroundColor: isTop ? extendedPalette.accentSoft : extendedPalette.bg,
                                                borderColor: isTop ? extendedPalette.accent : extendedPalette.border,
                                                color: isTop ? extendedPalette.text : extendedPalette.text2,
                                            }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${isTop ? 'bg-white' : 'bg-transparent'}`} style={{ color: isTop ? extendedPalette.accentDeep : extendedPalette.text }}>
                                                    {idx + 1}
                                                </span>
                                                <span>{p.username}</span>
                                            </div>
                                            <div className="text-right">
                                                <span style={{ color: isTop ? extendedPalette.accentDeep : extendedPalette.text }}>{p.score} pts</span>
                                                <p className="text-xs" style={{ color: extendedPalette.text2 }}>{p.accuracy.toFixed(1)}% Acc.</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Question Breakdown Charts */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* ACCURACY PIE (Original Chart) */}
                    <Card className="shadow-sm" style={{ backgroundColor: extendedPalette.card, border: `1px solid ${extendedPalette.border}` }}>
                        <CardHeader>
                            <CardTitle className="text-lg" style={{ color: extendedPalette.text }}>Player Accuracy Distribution</CardTitle>
                        </CardHeader>
                        <CardContent className="h-64 flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={accuracyPie}
                                        outerRadius={90}
                                        dataKey="value"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                        style={{ color: extendedPalette.text }}
                                    >
                                        {accuracyPie.map((_, i) => (
                                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        formatter={(value, name) => [`${typeof value === 'number' ? value.toFixed(1) : value}%`, name]}
                                        contentStyle={{ backgroundColor: extendedPalette.card, border: `1px solid ${extendedPalette.border}`, color: extendedPalette.text }} 
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* NEW CHART 1: Question Type Doughnut */}
                    <Card className="shadow-sm" style={{ backgroundColor: extendedPalette.card, border: `1px solid ${extendedPalette.border}` }}>
                        <CardHeader>
                            <CardTitle className="text-lg" style={{ color: extendedPalette.text }}>Question Type Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent className="h-64 flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={questionBreakdown.typeData}
                                        innerRadius={60}
                                        outerRadius={90}
                                        dataKey="count"
                                        nameKey="name"
                                        paddingAngle={5}
                                        labelLine={false}
                                        label
                                    >
                                        {questionBreakdown.typeData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        formatter={(value, name) => [`${value} Qs`, name]}
                                        contentStyle={{ backgroundColor: extendedPalette.card, border: `1px solid ${extendedPalette.border}`, color: extendedPalette.text }} 
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* NEW CHART 2: Difficulty Level Bar Chart */}
                    <Card className="shadow-sm md:col-span-2" style={{ backgroundColor: extendedPalette.card, border: `1px solid ${extendedPalette.border}` }}>
                        <CardHeader>
                            <CardTitle className="text-lg" style={{ color: extendedPalette.text }}>Questions by Difficulty</CardTitle>
                        </CardHeader>
                        <CardContent className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={questionBreakdown.difficultyData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={extendedPalette.border} />
                                    <XAxis dataKey="name" {...ChartTheme} />
                                    <YAxis {...ChartTheme} allowDecimals={false} />
                                    <Tooltip 
                                        formatter={(value) => [`${value} Qs`, 'Count']}
                                        contentStyle={{ backgroundColor: extendedPalette.card, border: `1px solid ${extendedPalette.border}`, color: extendedPalette.text }}
                                    />
                                    <Bar dataKey="count" name="Count" fill={extendedPalette.accent} radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* QUESTIONS USED */}
            <Card className="shadow-lg" style={{ backgroundColor: extendedPalette.card, border: `1px solid ${extendedPalette.border}` }}>
                <CardHeader>
                    <CardTitle className="text-lg sm:text-xl flex items-center gap-2" style={{ color: extendedPalette.text }}>
                        <List className="w-5 h-5" style={{ color: extendedPalette.text }} /> Questions Used
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {battle.questions.map((q, idx) => (
                        <div
                            key={idx}
                            className="p-4 rounded-lg border"
                            style={{ backgroundColor: extendedPalette.bg, borderColor: extendedPalette.border }}
                        >
                            <p className="font-semibold" style={{ color: extendedPalette.text }}>
                                <span className="mr-2" style={{ color: extendedPalette.accentDeep }}>Q{idx + 1} ({q.difficulty.toUpperCase()}):</span>
                                {q.question}
                            </p>

                            {q.questionType === "mcq" && q.options && (
                                <ul className="mt-2 space-y-1 ml-5 list-disc" style={{ color: extendedPalette.text2 }}>
                                    {q.options.map((op, i) => (
                                        <li key={i} className="text-sm">{op}</li>
                                    ))}
                                </ul>
                            )}

                            {q.questionType === "paragraph" && (
                                <p className="mt-2 italic text-sm" style={{ color: extendedPalette.text2 }}>
                                    (Paragraph Response)
                                </p>
                            )}
                        </div>
                    ))}
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default BattleShow;