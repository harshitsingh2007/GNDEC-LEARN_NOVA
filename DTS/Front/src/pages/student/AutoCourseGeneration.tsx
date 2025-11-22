import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Sparkles,
  Loader2,
  Send,
  Layers,
  Lightbulb,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import axios from "axios";
import { toast } from "@/components/ui/use-toast";
import BackButton from "@/components/BackButton";
import { palette } from "@/theme/palette";

const NovaCourseGenerator = () => {
  const [form, setForm] = useState({
    topic: "",
    level: "Beginner",
    category: "General",
    customCategory: "",
  });
  const [showCustom, setShowCustom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [course, setCourse] = useState(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [levelOpen, setLevelOpen] = useState(false);
  
  const categoryRef = useRef(null);
  const levelRef = useRef(null);

  const categories = [
    "General",
    "Technology",
    "Health & Fitness",
    "Business",
    "Music & Art",
    "Science",
    "Psychology",
    "Self-Development",
    "Cooking",
    "History",
    "Finance",
    "Other",
  ];

  const levels = ["Beginner", "Intermediate", "Advanced"];

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target)) {
        setCategoryOpen(false);
      }
      if (levelRef.current && !levelRef.current.contains(event.target)) {
        setLevelOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleChange = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleGenerate = async (e) => {
    e.preventDefault();
    
    // Close all dropdowns before generating
    setCategoryOpen(false);
    setLevelOpen(false);
    
    if (!form.topic.trim()) {
      toast({ description: "⚠️ Please enter a topic first!" });
      return;
    }

    const category =
      form.category === "Other" && form.customCategory
        ? form.customCategory
        : form.category;

    setLoading(true);
    setCourse(null);

    try {
      const { data } = await axios.post(
        "http://localhost:5000/api/courses/aigen",
        { ...form, category },
        { withCredentials: true }
      );
      setCourse(data.course);
      toast({ description: "🎓 Course generated successfully!" });
    } catch (err) {
      console.error(err);
      toast({ description: "❌ Failed to generate course." });
    } finally {
      setLoading(false);
    }
  };

  const handleLevelChange = (l) => {
    handleChange("level", l);
    setLevelOpen(false);
  };

  const handleCategoryChange = (c) => {
    handleChange("category", c);
    setCategoryOpen(false);
    setShowCustom(c === "Other");
  };

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ backgroundColor: palette.bg }}
    >
      {/* ─── Header ───────────────────────────── */}
      <div className="sm:py-8 px-5 space-y-4">
        <div className="mb-6 max-w-7xl mx-auto">
          <BackButton to="/student/courses" label="Back to Courses" />
        </div>
        <div className="text-center">
          <div className="flex justify-center items-center gap-3">
            <Brain className="w-10 h-10 sm:w-12 sm:h-12" style={{ color: palette.text }} />
            <h1
              className="text-4xl sm:text-5xl font-extrabold tracking-tight"
              style={{ color: palette.text }}
            >
              Nova Course Creator
            </h1>
          </div>
          <p
            className="text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mt-4"
            style={{ color: palette.text2 }}
          >
            Create immersive, structured courses on{" "}
            <span style={{ color: palette.text, fontWeight: '600' }}>any topic</span> —
            art, finance, cooking, science, or anything else — powered by Gemini
            AI.
          </p>
        </div>
      </div>

      {/* ─── Input Section ───────────────────────────── */}
      <motion.div
        className="max-w-4xl mx-auto rounded-2xl shadow-xl p-6 sm:p-8 mb-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ backgroundColor: palette.card, border: `1px solid ${palette.border}` }}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl" style={{ color: palette.text }}>
            <Sparkles className="w-5 h-5" style={{ color: palette.accentDeep }} /> Generate a New Course
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <Input
            placeholder="Enter your course topic (e.g., 'Astrophysics for Curious Minds', 'Vegan Cooking Basics')"
            className="focus:ring-0 focus:border-opacity-70"
            style={{ backgroundColor: palette.card, borderColor: palette.border, color: palette.text, outline: 'none' }}
            value={form.topic}
            onChange={(e) => handleChange("topic", e.target.value)}
          />

          {/* ─── Category Dropdown ───────────────── */}
          <div className="relative" ref={categoryRef}>
            <button
              onClick={() => {
                setCategoryOpen(!categoryOpen);
                setLevelOpen(false); // Close level dropdown when opening category
              }}
              className="w-full rounded-lg px-4 py-2 text-left flex justify-between items-center transition-all"
              style={{ 
                backgroundColor: palette.card, 
                border: `1px solid ${categoryOpen ? palette.accent : palette.border}`, 
                color: palette.text 
              }}
            >
              <span className="text-sm sm:text-base">{form.category}</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200`}
                style={{ transform: categoryOpen ? "rotate(180deg)" : "rotate(0deg)", color: palette.text2 }}
              />
            </button>
            {categoryOpen && (
              <div
                className="absolute z-40 mt-1 rounded-lg shadow-lg w-full overflow-hidden max-h-60 overflow-y-auto border"
                style={{ backgroundColor: palette.card, borderColor: palette.border }}
              >
                {categories.map((c, i) => (
                  <div
                    key={i}
                    onClick={() => handleCategoryChange(c)}
                    className={`px-4 py-2 cursor-pointer transition-all text-sm sm:text-base hover:bg-opacity-50 ${
                      c === form.category ? 'font-semibold' : ''
                    }`}
                    style={{ 
                      color: palette.text, 
                      backgroundColor: c === form.category ? palette.accentSoft : 'transparent'
                    }}
                  >
                    {c}
                  </div>
                ))}
              </div>
            )}
          </div>

          {showCustom && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.2 }}
            >
              <Input
                placeholder="Enter custom category name"
                className="focus:ring-0 focus:border-opacity-70"
                style={{ backgroundColor: palette.card, borderColor: palette.border, color: palette.text, outline: 'none' }}
                value={form.customCategory}
                onChange={(e) => handleChange("customCategory", e.target.value)}
              />
            </motion.div>
          )}

          {/* ─── Level Dropdown ───────────────── */}
          <div className="relative" ref={levelRef}>
            <button
              onClick={() => {
                setLevelOpen(!levelOpen);
                setCategoryOpen(false); // Close category dropdown when opening level
              }}
              className="w-full rounded-lg px-4 py-2 text-left flex justify-between items-center transition-all"
              style={{ 
                backgroundColor: palette.card, 
                border: `1px solid ${levelOpen ? palette.accent : palette.border}`, 
                color: palette.text 
              }}
            >
              <span className="text-sm sm:text-base">{form.level}</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200`}
                style={{ transform: levelOpen ? "rotate(180deg)" : "rotate(0deg)", color: palette.text2 }}
              />
            </button>
            {levelOpen && (
              <div
                className="absolute z-30 mt-1 rounded-lg shadow-lg w-full border"
                style={{ backgroundColor: palette.card, borderColor: palette.border }}
              >
                {levels.map((l, i) => (
                  <div
                    key={i}
                    onClick={() => handleLevelChange(l)}
                    className={`px-4 py-2 cursor-pointer transition-all text-sm sm:text-base hover:bg-opacity-50 ${
                      l === form.level ? 'font-semibold' : ''
                    }`}
                    style={{ 
                      color: palette.text, 
                      backgroundColor: l === form.level ? palette.accentSoft : 'transparent'
                    }}
                  >
                    {l}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="flex items-center gap-2 font-semibold px-6 py-2 rounded-lg shadow-lg transition-all duration-200"
              style={{ 
                backgroundColor: palette.accentDeep, 
                color: palette.card, 
                boxShadow: `0 4px 6px -1px ${palette.accentDeep}33`,
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" /> Generate Course
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </motion.div>

      {/* ─── Loading State ───────────────── */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: palette.text }} />
            <p style={{ color: palette.text2 }}>Generating your course... This may take a few seconds.</p>
          </div>
        </div>
      )}

      {/* ─── Generated Course ───────────────── */}
      {course && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-5xl mx-auto rounded-2xl p-6 sm:p-8 shadow-xl mb-12"
          style={{ backgroundColor: palette.card, border: `1px solid ${palette.border}` }}
        >
          <h2 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: palette.text }}>
            {course.title}
          </h2>
          <p style={{ color: palette.text2 }} className="mb-4">
            {course.description}
          </p>
          <div className="flex flex-wrap gap-4 mb-6 text-sm">
            <span style={{ color: palette.text2 }}>
              Category: <span style={{ color: palette.text, fontWeight: '600' }}>{course.category}</span>
            </span>
            <span style={{ color: palette.text2 }}>
              Level: <span style={{ color: palette.text, fontWeight: '600' }}>{course.level}</span>
            </span>
            <span style={{ color: palette.text2 }}>
              Duration: <span style={{ color: palette.text, fontWeight: '600' }}>{course.duration} hrs</span>
            </span>
          </div>

          <div className="space-y-4">
            {course.modules?.map((mod, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.3 }}
                className="rounded-xl p-5"
                style={{ backgroundColor: palette.bg, border: `1px solid ${palette.border}` }}
              >
                <h3 className="text-lg sm:text-xl font-semibold flex items-center gap-2 mb-2" style={{ color: palette.text }}>
                  <Layers className="w-5 h-5" style={{ color: palette.accentDeep }} /> Module {i + 1}: {mod.title}
                </h3>
                <p style={{ color: palette.text2 }} className="mb-3">
                  {mod.description}
                </p>
                <ul className="space-y-2 ml-1">
                  {mod.lessons?.map((lesson, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: palette.accent }} />
                      <span style={{ color: palette.text2 }}>
                        <span style={{ color: palette.text, fontWeight: '500' }}>{lesson.title}</span> — {lesson.duration} min
                      </span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          <div className="flex justify-end mt-6 pt-4 border-t" style={{ borderColor: palette.border }}>
            <Button
              onClick={() => toast({ description: "✨ Course saved successfully!" })}
              className="flex items-center gap-2 px-5 py-2 shadow-lg transition-all duration-200"
              style={{ 
                backgroundColor: palette.accentDeep, 
                color: palette.card, 
                boxShadow: `0 4px 6px -1px ${palette.accentDeep}33` 
              }}
            >
              <Lightbulb className="w-4 h-4" /> Save Course
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default NovaCourseGenerator;