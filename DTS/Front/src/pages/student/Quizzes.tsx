import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileQuestion,
  Clock,
  Zap,
  Target,
  Brain,
  Sparkles,
  Trophy,
  Loader2,
  Search,
  ArrowLeft,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { palette } from "@/theme/palette";

const Quizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [numQuestions, setNumQuestions] = useState(10);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const QUIZZES_PER_PAGE = 6;

  // ─── Fetch Existing Quizzes ───────────────────────────────
  async function fetchQuizzes() {
    try {
      setLoading(true);
      const { data } = await axios.get("http://localhost:5000/api/quiz/", {
        withCredentials: true,
      });
      if (data?.quizzes) {
        setQuizzes(data.quizzes);
        setFeatured(data.quizzes.slice(0, 3));
        setFiltered(data.quizzes);
      }
    } catch (err) {
      console.error("⚠️ Fetch Quizzes Error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchQuizzes();
  }, []);

  // ─── Handle Navigation ───────────────────────────────
  const handleNavigate = (id) => navigate("/student/takequiz", { state: id });

  // ─── Handle Back Navigation ───────────────────────────────
  const handleBack = () => navigate(-1);

  // ─── Search Filter ───────────────────────────────
  useEffect(() => {
    const results = quizzes.filter((quiz) =>
      quiz.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFiltered(results);
    setPage(1); // reset page when searching
  }, [searchQuery, quizzes]);

  // ─── Random Quiz ───────────────────────────────
  const handleRandomQuiz = () => {
    if (!quizzes.length) return alert("No quizzes available.");
    const randomQuiz = quizzes[Math.floor(Math.random() * quizzes.length)];
    navigate("/student/takequiz", { state: randomQuiz._id });
  };

  // ─── Generate AI Quiz ───────────────────────────────
  async function generateAIQuiz() {
    if (!topic.trim()) return alert("Please enter a topic.");
    setAiLoading(true);

    try {
      const { data } = await axios.post(
        "http://localhost:5000/api/quiz/genai",
        { topic, difficulty, numberOfQuestions: numQuestions },
        { withCredentials: true }
      );

      if (data?.quizId) {
        setShowAIDialog(false);
        navigate("/student/takequiz", { state: data.quizId });
      } else {
        alert("Something went wrong while generating quiz.");
      }
    } catch (err) {
      console.error("⚠️ AI Quiz Generation Error:", err);
      alert("Failed to generate quiz.");
    } finally {
      setAiLoading(false);
    }
  }

  // ─── Paginated Data ───────────────────────────────
  const startIndex = (page - 1) * QUIZZES_PER_PAGE;
  const endIndex = startIndex + QUIZZES_PER_PAGE;
  const displayedQuizzes = filtered.slice(startIndex, endIndex);

  const hasNext = endIndex < filtered.length;
  const hasPrev = page > 1;

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen" style={{ background: palette.bg, color: palette.text2 }}>
        Loading quizzes...
      </div>
    );

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-10" style={{ background: palette.bg }}>
      {/* ─── Header with Back Button ─────────────────────────────── */}
      <div className="flex items-center gap-4 mb-4">
        <Button
          variant="outline"
          size="icon"
          onClick={handleBack}
          className="flex-shrink-0"
          style={{ 
            borderColor: palette.border, 
            color: palette.text,
            background: palette.card 
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = palette.accentSoft;
            e.currentTarget.style.borderColor = palette.accent;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = palette.card;
            e.currentTarget.style.borderColor = palette.border;
          }}
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2" style={{ background: `linear-gradient(to right, ${palette.text}, ${palette.text2})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Quizzes & Assessments
          </h1>
          <p className="text-sm sm:text-base md:text-lg" style={{ color: palette.text2 }}>
            Test your skills and boost your XP
          </p>
        </div>
      </div>

      {/* ─── Search ─────────────────────────────── */}
      <div className="relative w-full sm:max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5" style={{ color: palette.text2 }} />
        <Input
          placeholder="Search quizzes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 sm:pl-10 text-sm"
          style={{ background: palette.card, color: palette.text, borderColor: palette.border }}
        />
      </div>

      {/* ─── Quiz Modes ─────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Random Quiz */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="hover:scale-105 transition-transform cursor-pointer h-full" style={{ background: palette.cardHover, border: `1px solid ${palette.border}` }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: palette.text }}>
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: palette.accent }} />
                Random Quiz
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs sm:text-sm mb-4" style={{ color: palette.text2 }}>
                Start a random quiz instantly from the available ones.
              </p>
              <Button
                variant="outline"
                className="w-full"
                style={{ borderColor: palette.border, color: palette.text }}
                onMouseEnter={(e) => e.currentTarget.style.background = palette.accentSoft}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                onClick={handleRandomQuiz}
              >
                Surprise Me
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* AI Quiz Generator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
            <DialogTrigger asChild>
              <Card className="hover:scale-105 transition-transform cursor-pointer h-full" style={{ background: palette.cardHover, border: `1px solid ${palette.border}` }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2" style={{ color: palette.text }}>
                    <Brain className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: palette.accent }} />
                    AI Quiz Generator
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs sm:text-sm mb-4" style={{ color: palette.text2 }}>
                    Instantly create a new quiz using AI on your chosen topic.
                  </p>
                  <Button className="w-full" style={{ background: palette.accentDeep, color: palette.card }} onMouseEnter={(e) => e.currentTarget.style.background = palette.accent} onMouseLeave={(e) => e.currentTarget.style.background = palette.accentDeep}>
                    Generate Quiz
                  </Button>
                </CardContent>
              </Card>
            </DialogTrigger>

            {/* Dialog */}
            <DialogContent className="sm:max-w-md" style={{ background: palette.card, border: `1px solid ${palette.border}` }}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2" style={{ color: palette.text }}>
                  <Brain className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: palette.accent }} />
                  Generate AI Quiz
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium" style={{ color: palette.text2 }}>Topic</label>
                  <input
                    className="w-full p-2 rounded-md mt-1 text-sm"
                    style={{ background: palette.card, color: palette.text, border: `1px solid ${palette.border}` }}
                    placeholder="e.g., Data Structures"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium" style={{ color: palette.text2 }}>Difficulty</label>
                  <select
                    className="w-full p-2 rounded-md mt-1 text-sm"
                    style={{ background: palette.card, color: palette.text, border: `1px solid ${palette.border}` }}
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium" style={{ color: palette.text2 }}>
                    Number of Questions
                  </label>
                  <input
                    type="number"
                    className="w-full p-2 rounded-md mt-1 text-sm"
                    style={{ background: palette.card, color: palette.text, border: `1px solid ${palette.border}` }}
                    min="5"
                    max="20"
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(Number(e.target.value))}
                  />
                </div>

                <div className="flex gap-4 mt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    style={{ borderColor: palette.border, color: palette.text }}
                    onClick={() => setShowAIDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 flex items-center justify-center gap-2"
                    style={{ background: palette.accentDeep, color: palette.card }}
                    onMouseEnter={(e) => e.currentTarget.style.background = palette.accent}
                    onMouseLeave={(e) => e.currentTarget.style.background = palette.accentDeep}
                    onClick={generateAIQuiz}
                    disabled={aiLoading}
                  >
                    {aiLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Generating...
                      </>
                    ) : (
                      "Generate Quiz"
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>
      </div>

      {/* ─── Featured Quizzes ─────────────────────── */}
      {featured.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-xl sm:text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: palette.text }}>
            <Trophy className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: palette.accent }} /> Featured Quizzes
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {featured.map((quiz, i) => (
              <motion.div
                key={quiz._id || i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <Card
                  className="hover:scale-105 transition-transform cursor-pointer"
                  style={{ background: palette.card, border: `1px solid ${palette.border}` }}
                  onClick={() => handleNavigate(quiz._id)}
                >
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg" style={{ color: palette.text }}>{quiz.title}</CardTitle>
                    <p className="text-xs sm:text-sm" style={{ color: palette.text2 }}>
                      {quiz.category} • {quiz.level}
                    </p>
                  </CardHeader>
                  <CardContent className="flex justify-between text-xs sm:text-sm" style={{ color: palette.text2 }}>
                    <span>{quiz.totalMarks} Marks</span>
                    <span>{quiz.timeLimit} min</span>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ─── Paginated Quizzes ───────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <h2 className="text-xl sm:text-2xl font-bold mb-4" style={{ color: palette.text }}>All Quizzes</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {displayedQuizzes.map((quiz, index) => (
            <motion.div
              key={quiz._id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
            >
              <Card
                className="hover:scale-105 transition-transform cursor-pointer"
                style={{ background: palette.card, border: `1px solid ${palette.border}` }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = palette.accent}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = palette.border}
                onClick={() => handleNavigate(quiz._id)}
              >
                <CardHeader>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-2" style={{ background: palette.accentSoft }}>
                    <FileQuestion className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: palette.accent }} />
                  </div>
                  <CardTitle className="text-base sm:text-lg" style={{ color: palette.text }}>{quiz.title}</CardTitle>
                  <p className="text-xs sm:text-sm" style={{ color: palette.text2 }}>
                    {quiz.course?.title || quiz.category}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                    <div className="flex items-center gap-2" style={{ color: palette.text2 }}>
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{quiz.timeLimit} min</span>
                    </div>
                    <div className="flex items-center gap-2" style={{ color: palette.text2 }}>
                      <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{quiz.totalMarks} Marks</span>
                    </div>
                  </div>
                  <Button className="w-full" style={{ background: palette.accentDeep, color: palette.card }} onMouseEnter={(e) => e.currentTarget.style.background = palette.accent} onMouseLeave={(e) => e.currentTarget.style.background = palette.accentDeep}>
                    Start Quiz
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Pagination */}
        {filtered.length > QUIZZES_PER_PAGE && (
          <div className="flex justify-center items-center gap-4 mt-6 sm:mt-8">
            {hasPrev && (
              <Button variant="outline" onClick={() => setPage(page - 1)} style={{ borderColor: palette.border, color: palette.text }}>
                Previous
              </Button>
            )}
            {hasNext && (
              <Button variant="outline" onClick={() => setPage(page + 1)} style={{ borderColor: palette.border, color: palette.text }}>
                Next
              </Button>
            )}
          </div>
        )}
      </motion.div>

      {/* ─── Empty State ───────────────────────────── */}
      {!loading && filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <FileQuestion className="w-16 h-16 mb-4" style={{ color: palette.text2 }} />
          <h3 className="text-xl font-semibold mb-2" style={{ color: palette.text }}>No quizzes found</h3>
          <p style={{ color: palette.text2 }}>
            {searchQuery ? "Try adjusting your search terms" : "No quizzes available at the moment"}
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default Quizzes;