import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, CheckCircle2, RefreshCw, XCircle, ArrowLeft } from "lucide-react";
import { palette } from "@/theme/palette";

const TakeQuiz = () => {
  const { state: quizId } = useLocation();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [startTime, setStartTime] = useState(null);
  const [submissionData, setSubmissionData] = useState(null);

  // ─── Fetch Quiz Data ───────────────────────────────
  async function fetchQuiz() {
    try {
      setLoading(true);
      const { data } = await axios.post(
        "http://localhost:5000/api/quiz/single",
        { id: quizId },
        { withCredentials: true }
      );
      setQuiz(data);
      setTimeLeft(data.timeLimit * 60);
      setStartTime(Date.now());
    } catch (err) {
      console.error("❌ Fetch Quiz Error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchQuiz();
  }, []);

  // ─── Timer Logic ───────────────────────────────
  useEffect(() => {
    if (!timeLeft || submitted) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, submitted]);

  // ─── Handle Option Select ─────────────────────
  const handleOptionSelect = (qId, optionIndex) => {
    if (submitted) return;
    setError("");
    setAnswers((prev) => ({
      ...prev,
      [qId]: optionIndex + 1, // store as 1-based index
    }));
  };

  // ─── Submit Quiz ──────────────────────────────
  const handleSubmit = async(auto = false) => {
    if (!quiz || submitted) return;

    const totalQuestions = quiz.questions.length;
    const answeredCount = Object.keys(answers).length;

    if (answeredCount < totalQuestions && !auto) {
      setError(`⚠️ Please answer all ${totalQuestions} questions before submitting.`);
      return;
    }

    // ─── Calculate Time Taken ─────────────────────
    const endTime = Date.now();
    const diffSec = Math.round((endTime - startTime) / 1000);
    const formattedTime = `${Math.floor(diffSec / 60)}m ${diffSec % 60}s`;

    // ─── Prepare Submission Data ─────────────────
    const selectedArray = quiz.questions.map((q) =>
      answers[q.id] ? answers[q.id] : null
    );

    const submission = {
      selected: selectedArray,
      timeTaken: formattedTime,
      quizId :quizId,
    };

    console.log("🧾 Final Submission Object:", submission);

    //  Final submmision 
    try{
        let some=await axios.post("http://localhost:5000/api/quiz/evaluate",submission,{withCredentials:true})
        // console.log(some)
        navigate("/student/quizresult",{state:some.data})
    }catch(err){
        console.log(err)
    }

    setSubmissionData(submission);
    setSubmitted(true);
  };

  // ─── Retake Quiz ──────────────────────────────
  const handleRetake = () => {
    setAnswers({});
    setCurrentQuestion(0);
    setSubmitted(false);
    setError("");
    setTimeLeft(quiz.timeLimit * 60);
    setStartTime(Date.now());
    setSubmissionData(null);
  };

  // ─── Format Timer ─────────────────────────────
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // ─── Handle Back Navigation ───────────────────
  const handleBack = () => {
    if (!submitted) {
      const confirmLeave = window.confirm("Are you sure you want to leave? Your progress will be lost.");
      if (!confirmLeave) return;
    }
    navigate(-1);
  };

  // ─── Loading ───────────────────────────
  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen" style={{ background: palette.bg, color: palette.text2 }}>
        Loading quiz...
      </div>
    );

  if (!quiz)
    return (
      <div className="flex flex-col justify-center items-center min-h-screen text-center p-4" style={{ background: palette.bg, color: '#EF4444' }}>
        <XCircle className="w-16 h-16 mb-4" />
        <h2 className="text-xl font-bold mb-2">Quiz not found</h2>
        <p className="mb-4" style={{ color: palette.text2 }}>The requested quiz could not be loaded.</p>
        <Button
          onClick={handleBack}
          style={{ background: palette.accentDeep, color: palette.card }}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      </div>
    );

  // ─── After Submission ────────────────────────
  if (submitted)
    return (
      <div className="flex flex-col justify-center items-center min-h-screen text-center space-y-6 p-4 sm:p-6" style={{ background: palette.bg }}>
        <CheckCircle2 className="w-12 h-12 sm:w-16 sm:h-16" style={{ color: '#10B981' }} />
        <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: palette.text }}>Quiz Submitted!</h2>
        <p style={{ color: palette.text2 }}>
          Time taken: <strong style={{ color: palette.text }}>{submissionData?.timeTaken}</strong>
        </p>

        <div className="p-4 rounded-lg w-full max-w-md text-left" style={{ background: palette.accentSoft }}>
          <h3 className="font-semibold mb-2 text-sm sm:text-base" style={{ color: palette.accent }}>Submitted Answers:</h3>
          <pre className="text-xs sm:text-sm p-3 rounded-md overflow-x-auto" style={{ background: palette.card, color: palette.text, border: `1px solid ${palette.border}` }}>
            {JSON.stringify(submissionData, null, 2)}
          </pre>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
          <Button 
            onClick={handleRetake} 
            className="flex items-center gap-2 w-full sm:w-auto"
            style={{ background: palette.accentDeep, color: palette.card }}
            onMouseEnter={(e) => e.currentTarget.style.background = palette.accent}
            onMouseLeave={(e) => e.currentTarget.style.background = palette.accentDeep}
          >
            <RefreshCw className="w-4 h-4" /> Retake Quiz
          </Button>
          <Button
            variant="outline"
            onClick={handleBack}
            className="w-full sm:w-auto"
            style={{ borderColor: palette.border, color: palette.text }}
            onMouseEnter={(e) => e.currentTarget.style.background = palette.accentSoft}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Quizzes
          </Button>
        </div>
      </div>
    );

  // ─── Active Quiz ─────────────────────────────
  const q = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto space-y-4 sm:space-y-6 min-h-screen" style={{ background: palette.bg }}>
      {/* Header with Back Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-4">
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
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: palette.text }}>{quiz.title}</h1>
        </div>
        <div className="flex items-center gap-2 font-semibold text-sm sm:text-base" style={{ color: palette.accent }}>
          <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <Progress value={progress} className="h-2" style={{ background: palette.progressTrack }} />

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-sm mt-2 p-3 rounded-lg" style={{ background: '#EF44441A', color: '#EF4444', border: `1px solid #EF444480` }}>
          <XCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Question */}
      <motion.div
        key={q.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex-1"
      >
        <Card style={{ background: palette.card, border: `1px solid ${palette.border}` }} className="h-full">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl" style={{ color: palette.text }}>
              Question {currentQuestion + 1} of {quiz.questions.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base sm:text-lg mb-4 sm:mb-6" style={{ color: palette.text }}>{q.questionText}</p>
            <div className="space-y-2 sm:space-y-3">
              {q.options.map((opt, i) => (
                <Button
                  key={i}
                  variant={answers[q.id] === i + 1 ? "default" : "outline"}
                  className="w-full justify-start text-sm sm:text-base py-3 h-auto min-h-[3rem]"
                  style={
                    answers[q.id] === i + 1
                      ? { background: palette.accentDeep, color: palette.card }
                      : { borderColor: palette.border, color: palette.text }
                  }
                  onMouseEnter={(e) => {
                    if (answers[q.id] !== i + 1) {
                      e.currentTarget.style.background = palette.accentSoft;
                      e.currentTarget.style.borderColor = palette.accent;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (answers[q.id] !== i + 1) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.borderColor = palette.border;
                    }
                  }}
                  onClick={() => handleOptionSelect(q.id, i)}
                >
                  <span className="text-left">{opt}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0 pt-4">
        <Button
          variant="outline"
          onClick={() => setCurrentQuestion((prev) => prev - 1)}
          disabled={currentQuestion === 0}
          className="w-full sm:w-auto text-sm sm:text-base"
          style={{ borderColor: palette.border, color: palette.text }}
          onMouseEnter={(e) => {
            if (currentQuestion > 0) {
              e.currentTarget.style.background = palette.accentSoft;
            }
          }}
          onMouseLeave={(e) => {
            if (currentQuestion > 0) {
              e.currentTarget.style.background = 'transparent';
            }
          }}
        >
          Previous
        </Button>

        <div className="text-sm text-center" style={{ color: palette.text2 }}>
          Answered: {Object.keys(answers).length} / {quiz.questions.length}
        </div>

        {currentQuestion === quiz.questions.length - 1 ? (
          <Button 
            onClick={() => handleSubmit(false)} 
            className="w-full sm:w-auto text-sm sm:text-base"
            style={{ background: '#10B981', color: palette.card }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#059669'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#10B981'}
          >
            Submit Quiz
          </Button>
        ) : (
          <Button
            onClick={() => setCurrentQuestion((prev) => prev + 1)}
            className="w-full sm:w-auto text-sm sm:text-base"
            style={{ background: palette.accentDeep, color: palette.card }}
            onMouseEnter={(e) => e.currentTarget.style.background = palette.accent}
            onMouseLeave={(e) => e.currentTarget.style.background = palette.accentDeep}
          >
            Next
          </Button>
        )}
      </div>
    </div>
  );
};

export default TakeQuiz;