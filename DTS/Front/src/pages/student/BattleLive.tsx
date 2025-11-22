import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Timer, Sword, ChevronRight, SendHorizontal, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
// import gsap from "gsap"; // GSAP removed
import axios from "axios";
import { palette } from "@/theme/palette";

const BattleGround = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  const battleData = state?.battleData;
  const username = state?.username || localStorage.getItem("username");

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [answers, setAnswers] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [questionLocked, setQuestionLocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);

  const progressRef = useRef<HTMLDivElement | null>(null);
  const questions = battleData?.questions || [];
  const currentQuestion = questions[currentIndex];

  // ⏱️ Timer per question type
  const getTimeLimit = (type: string) => (type === "mcq" ? 60 : 150);

  // ⏱️ Animate progress bar using simple CSS transition/ref (replacing GSAP)
  const setProgressBarWidth = (duration: number) => {
    if (!progressRef.current) return;
    progressRef.current.style.transition = `width ${duration}s linear`;
    progressRef.current.style.width = "0%";
  };

  // 🕒 Timer countdown and logic
  useEffect(() => {
    if (!currentQuestion) return;

    const duration = getTimeLimit(currentQuestion.questionType);
    setTimeLeft(duration);
    setProgressBarWidth(duration); // Start animation
    setQuestionLocked(false);

    let interval: NodeJS.Timeout;
    let timeout: NodeJS.Timeout;

    // Set countdown interval
    interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Set timeout for auto-next upon time up
    timeout = setTimeout(() => {
      handleNext(true);
    }, duration * 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
      // Reset progress bar on unmount/re-render
      if (progressRef.current) {
        progressRef.current.style.transition = 'none';
        progressRef.current.style.width = "100%";
      }
    };
  }, [currentIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // ⚙️ Initial load setup
  useEffect(() => {
    if (battleData && questions.length > 0) {
      localStorage.setItem("battleData", JSON.stringify(battleData));
      localStorage.setItem("username", username || "");
      setStartTime(Date.now()); // ✅ Start tracking time
      setTimeout(() => setIsLoading(false), 800);
    }
  }, [battleData]); // eslint-disable-line react-hooks/exhaustive-deps

  // 🚀 Move to next question
  const handleNext = (auto = false) => {
    if (questionLocked) return;
    const question = currentQuestion;
    if (!question) return;

    // Kill any remaining animation/timeout to prevent double submission
    // This is crucial since we are manually handling auto-next logic
    // The useEffect cleanup handles the interval/timeout reset for the *next* question
    setQuestionLocked(true); 
    
    // Calculate time taken *before* state update
    const timeTaken = getTimeLimit(question.questionType) - timeLeft;

    const newAnswer = {
      questionId: question._id,
      questionText: question.question,
      questionType: question.questionType,
      answer: auto ? "⏰ Time Up (No Response)" : selectedAnswer || "Skipped",
      timeTaken: timeTaken > 0 ? timeTaken : 0, // Ensure timeTaken is non-negative
      isAuto: auto,
    };

    const nextAnswers = [...answers, newAnswer];
    setAnswers(nextAnswers);
    setSelectedAnswer("");

    if (currentIndex + 1 < questions.length) {
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        setQuestionLocked(false); // Unlock after timeout for next question
      }, 400);
    } else {
      handleSubmit(nextAnswers);
    }
  };

  // 🧾 Submit final answers to backend
  const handleSubmit = async (finalAnswers: any[]) => {
    setIsSubmitting(true);
    toast({ description: "Submitting your battle results..." });

    try {
      const endTime = Date.now();
      const completionTime = Math.floor((endTime - (startTime || endTime)) / 1000); // ⏱️ in seconds

      const payload = {
        battleId: battleData?.battleId, // ✅ send battle id
        username: username,
        answers: finalAnswers, // ✅ send all answers
        completionTime, // ✅ total time spent
      };

      const response = await axios.post("http://localhost:5000/api/battle/evaluate", payload, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true, // ✅ include cookies/session
      });

      toast({ description: "✅ Battle evaluated successfully!" });
      localStorage.removeItem("battleData");

      navigate("/student/summary", {
        state: response.data
      });
    } catch (error: any) {
      console.error("❌ Evaluation error:", error);
      toast({
        description: "Failed to submit answers. Try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🧩 Render current question
  const renderQuestion = () => {
    if (!currentQuestion) return null;

    if (currentQuestion.questionType === "mcq") {
      return (
        <RadioGroup
          value={selectedAnswer}
          onValueChange={setSelectedAnswer}
          className="space-y-3"
        >
          {currentQuestion.options?.map((opt: string, i: number) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }} // Minimal motion
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.2 }}
              className="flex items-center space-x-3 border p-3 rounded-xl transition"
              style={{
                backgroundColor: palette.card,
                borderColor: palette.border,
                cursor: questionLocked ? 'not-allowed' : 'pointer'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = palette.cardHover}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = palette.card}
            >
              <RadioGroupItem 
                value={opt} 
                id={`opt-${i}`} 
                disabled={questionLocked}
                style={{ borderColor: palette.text2 }}
              />
              <Label 
                htmlFor={`opt-${i}`} 
                className="text-base" 
                style={{ color: palette.text }}
              >
                {opt}
              </Label>
            </motion.div>
          ))}
        </RadioGroup>
      );
    } else if (currentQuestion.questionType === "paragraph") {
      return (
        <motion.textarea
          initial={{ opacity: 0, y: 10 }} // Minimal motion
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full p-4 border rounded-2xl focus:ring-2 text-base min-h-[160px] resize-none shadow-sm"
          placeholder="Write your answer here..."
          value={selectedAnswer}
          onChange={(e) => setSelectedAnswer(e.target.value)}
          disabled={questionLocked}
          style={{ 
            backgroundColor: palette.card, 
            borderColor: palette.border, 
            color: palette.text,
            boxShadow: `0 2px 4px -1px ${palette.border}`,
            outlineColor: palette.accentDeep
          }}
        />
      );
    }
  };

  // 🧭 Navbar
  const renderNavbar = () => (
    <div
      // Removed motion.nav wrapper
      className="w-full py-3 px-4 sm:px-6 flex justify-between items-center shadow-md"
      style={{ backgroundColor: palette.accentDeep, color: palette.card }}
    >
      <div className="flex items-center space-x-2">
        <Sword className="w-5 h-5 sm:w-6 sm:h-6" />
        <span className="font-semibold text-base sm:text-lg">{battleData?.battleName}</span>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1">
          <Timer className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-sm sm:text-base font-medium">
            {Math.floor(timeLeft / 60).toString().padStart(2, "0")}:
            {(timeLeft % 60).toString().padStart(2, "0")}
          </span>
        </div>
        <span className="text-sm sm:text-base">
          Q {currentIndex + 1}/{questions.length}
        </span>
      </div>
    </div>
  );

  // 🌀 Loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen flex-col text-center" style={{ backgroundColor: palette.bg }}>
        <Loader2 className="animate-spin w-10 h-10 mb-4" style={{ color: palette.accentDeep }} />
        <p className="text-lg" style={{ color: palette.text2 }}>Preparing your battle arena...</p>
      </div>
    );
  }

  // ⚠️ No Questions
  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center h-screen text-lg" style={{ backgroundColor: palette.bg, color: palette.text2 }}>
        No questions found for this battle.
      </div>
    );
  }

  // 🧠 Main Render
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: palette.bg }}>
      {renderNavbar()}

      {/* Progress Bar */}
      <div className="relative h-2 w-full" style={{ backgroundColor: palette.accentSoft }}>
        <div
          ref={progressRef}
          className="absolute top-0 left-0 h-full rounded-r-full"
          style={{ backgroundColor: palette.accentDeep, width: "100%" }}
        />
      </div>

      {/* Question Section */}
      <main className="flex-grow flex flex-col items-center justify-center p-4 sm:p-6">
        <motion.div
          key={currentQuestion?._id}
          initial={{ opacity: 0, y: 15 }} // Subtle entrance animation
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-3xl"
        >
          <Card 
            className="shadow-xl" 
            style={{ 
              borderColor: palette.accentSoft, 
              backgroundColor: palette.card,
              boxShadow: `0 10px 15px -3px ${palette.text}10, 0 4px 6px -2px ${palette.text}05`
            }}
          >
            <CardHeader>
              <h2 className="text-lg sm:text-xl font-semibold leading-snug" style={{ color: palette.text }}>
                {currentQuestion?.question}
              </h2>
            </CardHeader>

            <CardContent className="space-y-6">
              {renderQuestion()}

              <div className="flex justify-end mt-6">
                <Button
                  onClick={() => handleNext(false)}
                  disabled={questionLocked || isSubmitting}
                  className="flex items-center space-x-2 text-sm sm:text-base shadow-lg"
                  style={{ backgroundColor: palette.accentDeep, color: palette.card, boxShadow: `0 4px 6px -1px ${palette.accentDeep}33` }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = palette.accent}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = palette.accentDeep}
                >
                  {currentIndex + 1 === questions.length ? (
                    <>
                      <SendHorizontal className="w-4 h-4" />
                      <span>{isSubmitting ? "Submitting..." : "Finish"}</span>
                    </>
                  ) : (
                    <>
                      <span>Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default BattleGround;