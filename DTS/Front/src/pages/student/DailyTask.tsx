import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Target,
  BookOpen,
  ArrowLeft,
  ArrowRight,
  Send,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { palette } from '@/theme/palette';

interface Question {
  questionNumber: number;
  type: 'mcq' | 'qa' | 'truefalse' | 'fillblank';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

interface Task {
  taskId: string;
  title: string;
  description: string;
  type: string;
  category: string;
  difficulty: string;
  estimatedDuration: number;
  content: {
    questions: Question[];
    learningObjectives?: string[];
  };
}

const DailyTask = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<{ [key: number]: boolean }>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTask();
  }, [taskId]);

  const fetchTask = async () => {
    if (!taskId) {
      toast.error('No task selected');
      navigate('/student/calendar');
      return;
    }

    try {
      const { data } = await axios.get(`http://localhost:5000/api/calendar/task/${taskId}`, {
        withCredentials: true
      });

      if (!data?.task) {
        toast.error('Task not found');
        navigate('/student/calendar');
        return;
      }

      const identifier =
        data.task.taskId ||
        (data.task._id ? data.task._id.toString() : undefined);

      if (!identifier) {
        toast.error('Task is missing an identifier');
        navigate('/student/calendar');
        return;
      }

      const normalizedTask: Task = {
        ...data.task,
        taskId: identifier,
        content: {
          ...data.task.content,
          questions: (data.task.content?.questions || []).slice(0, 10).map((question: any, index: number) => ({
            ...question,
            questionNumber: question?.questionNumber ?? index + 1,
          })),
        },
      };

      if (!normalizedTask.content?.questions || normalizedTask.content.questions.length !== 10) {
        toast.warning('Adjusting questions to ensure you have 10 to complete today.');
      }

      setTask(normalizedTask);
    } catch (error: any) {
      console.error('Error fetching task:', error);
      const message = error.response?.data?.message || 'Failed to load task';
      toast.error(message);
      navigate('/student/calendar');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionNumber: number, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionNumber]: answer
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < (task?.content.questions.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!task) return;

    const allAnswered = task.content.questions.every(
      q => answers[q.questionNumber] && answers[q.questionNumber].trim() !== ''
    );

    if (!allAnswered) {
      toast.error('Please answer all questions before submitting');
      return;
    }

    setSubmitting(true);

    // Check answers
    const newResults: { [key: number]: boolean } = {};
    task.content.questions.forEach(q => {
      const userAnswer = answers[q.questionNumber]?.trim().toLowerCase();
      const correctAnswer = q.correctAnswer?.trim().toLowerCase();
      
      if (q.type === 'mcq') {
        // For MCQ, check if answer matches option or index
        const optionIndex = q.options?.findIndex(opt => opt.toLowerCase() === userAnswer);
        newResults[q.questionNumber] = 
          userAnswer === correctAnswer || 
          (optionIndex !== undefined && optionIndex >= 0 && q.options?.[optionIndex]?.toLowerCase() === correctAnswer);
      } else if (q.type === 'truefalse') {
        newResults[q.questionNumber] = userAnswer === correctAnswer;
      } else {
        // For Q/A and fillblank, use fuzzy matching (contains check)
        newResults[q.questionNumber] = userAnswer.includes(correctAnswer) || correctAnswer.includes(userAnswer);
      }
    });

    setResults(newResults);
    setSubmitted(true);

    // Complete the task
    try {
      await axios.patch(
        `http://localhost:5000/api/calendar/complete/${task.taskId}`,
        {},
        { withCredentials: true }
      );
      
      const correctCount = Object.values(newResults).filter(r => r).length;
      const score = Math.round((correctCount / task.content.questions.length) * 100);
      
      toast.success(`Task completed! Score: ${score}% (${correctCount}/${task.content.questions.length})`);
      
      // Navigate back to calendar after showing results
      setTimeout(() => {
        navigate('/student/calendar', { replace: true });
      }, 2000);
    } catch (error: any) {
      console.error('Error completing task:', error);
      toast.error(error.response?.data?.message || 'Failed to complete task');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: palette.bg }}>
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: `${palette.accent} ${palette.accent} ${palette.accent} transparent` }}></div>
          <p style={{ color: palette.text2 }}>Loading task...</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return null;
  }

  const currentQuestion = task.content.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / task.content.questions.length) * 100;
  const answeredCount = Object.keys(answers).length;
  const allAnswered = task.content.questions.every(q => answers[q.questionNumber]);

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8" style={{ background: palette.bg }}>
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/student/calendar')}
            className="text-xs sm:text-sm"
            style={{ color: palette.text2 }}
            onMouseEnter={(e) => e.currentTarget.style.color = palette.text}
            onMouseLeave={(e) => e.currentTarget.style.color = palette.text2}
          >
            <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
            Back to Calendar
          </Button>
          <Badge variant="outline" style={{ background: palette.accentSoft, color: palette.accent, borderColor: palette.accent }}>
            <Sparkles className="w-3 h-3 mr-1" />
            AI Generated
          </Badge>
        </div>

        {/* Task Info */}
        <Card style={{ background: palette.card, border: `1px solid ${palette.border}` }}>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-xl sm:text-2xl mb-2" style={{ color: palette.accent }}>{task.title}</CardTitle>
                <p className="text-xs sm:text-sm" style={{ color: palette.text2 }}>{task.description}</p>
              </div>
              <div className="text-left sm:text-right flex-shrink-0">
                <Badge variant="outline" className="capitalize mb-2 text-xs sm:text-sm" style={{ borderColor: palette.border, color: palette.text }}>
                  {task.difficulty}
                </Badge>
                <div className="flex items-center gap-2 text-xs sm:text-sm" style={{ color: palette.text2 }}>
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                  {task.estimatedDuration} min
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-xs sm:text-sm">
                <span style={{ color: palette.text2 }}>Progress</span>
                <span style={{ color: palette.accent }}>
                  {currentQuestionIndex + 1} / {task.content.questions.length}
                </span>
              </div>
              <Progress value={progress} className="h-2" style={{ background: palette.progressTrack }} />
              <div className="flex justify-between text-xs" style={{ color: palette.text2 }}>
                <span>Answered: {answeredCount}/{task.content.questions.length}</span>
                <span>{task.category}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Question Card */}
        <Card style={{ background: palette.card, border: `1px solid ${palette.border}` }}>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2 text-base sm:text-lg" style={{ color: palette.text }}>
              <Target className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: palette.accent }} />
              Question {currentQuestion.questionNumber}
              <Badge variant="outline" className="ml-2 capitalize text-xs" style={{ borderColor: palette.border, color: palette.text }}>
                {currentQuestion.type}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            {/* Question */}
            <div>
              <p className="text-base sm:text-lg mb-4" style={{ color: palette.text }}>{currentQuestion.question}</p>
            </div>

            {/* Answer Input */}
            {!submitted ? (
              <div className="space-y-4">
                {currentQuestion.type === 'mcq' && currentQuestion.options && (
                  <RadioGroup
                    value={answers[currentQuestion.questionNumber] || ''}
                    onValueChange={(value) => handleAnswerChange(currentQuestion.questionNumber, value)}
                  >
                    {currentQuestion.options.map((option, index) => (
                      <div 
                        key={index} 
                        className="flex items-center space-x-2 p-3 rounded-lg border transition-colors"
                        style={{ borderColor: palette.border }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = palette.accent}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = palette.border}
                      >
                        <RadioGroupItem value={option} id={`option-${index}`} />
                        <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer text-xs sm:text-sm" style={{ color: palette.text }}>
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {currentQuestion.type === 'truefalse' && (
                  <RadioGroup
                    value={answers[currentQuestion.questionNumber] || ''}
                    onValueChange={(value) => handleAnswerChange(currentQuestion.questionNumber, value)}
                  >
                    <div 
                      className="flex items-center space-x-2 p-3 rounded-lg border transition-colors"
                      style={{ borderColor: palette.border }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = palette.accent}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = palette.border}
                    >
                      <RadioGroupItem value="True" id="true" />
                      <Label htmlFor="true" className="flex-1 cursor-pointer text-xs sm:text-sm" style={{ color: palette.text }}>True</Label>
                    </div>
                    <div 
                      className="flex items-center space-x-2 p-3 rounded-lg border transition-colors"
                      style={{ borderColor: palette.border }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = palette.accent}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = palette.border}
                    >
                      <RadioGroupItem value="False" id="false" />
                      <Label htmlFor="false" className="flex-1 cursor-pointer text-xs sm:text-sm" style={{ color: palette.text }}>False</Label>
                    </div>
                  </RadioGroup>
                )}

                {(currentQuestion.type === 'qa' || currentQuestion.type === 'fillblank') && (
                  <Textarea
                    placeholder={currentQuestion.type === 'fillblank' ? 'Enter your answer...' : 'Type your answer here...'}
                    value={answers[currentQuestion.questionNumber] || ''}
                    onChange={(e) => handleAnswerChange(currentQuestion.questionNumber, e.target.value)}
                    className="min-h-[120px] text-sm"
                    style={{ background: palette.card, borderColor: palette.border, color: palette.text }}
                  />
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div 
                  className="p-4 rounded-lg border-2"
                  style={{
                    background: results[currentQuestion.questionNumber] ? '#10B9811A' : '#EF44441A',
                    borderColor: results[currentQuestion.questionNumber] ? '#10B98180' : '#EF444480'
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {results[currentQuestion.questionNumber] ? (
                      <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#10B981' }} />
                    ) : (
                      <XCircle className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#EF4444' }} />
                    )}
                    <span className="font-semibold text-xs sm:text-sm" style={{ color: results[currentQuestion.questionNumber] ? '#10B981' : '#EF4444' }}>
                      {results[currentQuestion.questionNumber] ? 'Correct!' : 'Incorrect'}
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm space-y-2" style={{ color: palette.text }}>
                    <p><strong>Your answer:</strong> {answers[currentQuestion.questionNumber] || 'No answer'}</p>
                    <p><strong>Correct answer:</strong> {currentQuestion.correctAnswer}</p>
                    <p className="mt-2" style={{ color: palette.text2 }}>{currentQuestion.explanation}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0 pt-4" style={{ borderTop: `1px solid ${palette.border}` }}>
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className="w-full sm:w-auto text-xs sm:text-sm"
                style={{ borderColor: palette.border, color: palette.text }}
                onMouseEnter={(e) => {
                  if (currentQuestionIndex > 0) e.currentTarget.style.background = palette.accentSoft;
                }}
                onMouseLeave={(e) => {
                  if (currentQuestionIndex > 0) e.currentTarget.style.background = 'transparent';
                }}
              >
                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                Previous
              </Button>

              {currentQuestionIndex < task.content.questions.length - 1 ? (
                <Button
                  onClick={handleNext}
                  className="w-full sm:w-auto text-xs sm:text-sm"
                  style={{ background: palette.accentDeep, color: palette.card }}
                  onMouseEnter={(e) => e.currentTarget.style.background = palette.accent}
                  onMouseLeave={(e) => e.currentTarget.style.background = palette.accentDeep}
                >
                  Next
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!allAnswered || submitting}
                  className="w-full sm:w-auto text-xs sm:text-sm"
                  style={
                    !allAnswered || submitting
                      ? { background: palette.border, color: palette.text2, cursor: 'not-allowed' }
                      : { background: '#10B981', color: palette.card }
                  }
                  onMouseEnter={(e) => {
                    if (!submitting && allAnswered) e.currentTarget.style.background = '#059669';
                  }}
                  onMouseLeave={(e) => {
                    if (!submitting && allAnswered) e.currentTarget.style.background = '#10B981';
                  }}
                >
                  {submitting ? (
                    <>
                      <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-t-transparent rounded-full animate-spin mr-2" style={{ borderColor: `${palette.card} ${palette.card} ${palette.card} transparent` }} />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                      Submit Task
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Question Navigation Dots */}
        <div className="flex flex-wrap gap-2 justify-center">
          {task.content.questions.map((q, index) => (
            <button
              key={q.questionNumber}
              onClick={() => setCurrentQuestionIndex(index)}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg border-2 transition-all text-xs sm:text-sm font-medium"
              style={{
                background: index === currentQuestionIndex
                  ? palette.accentDeep
                  : answers[q.questionNumber]
                  ? '#10B9811A'
                  : palette.cardHover,
                borderColor: index === currentQuestionIndex
                  ? palette.accent
                  : answers[q.questionNumber]
                  ? '#10B98180'
                  : palette.border,
                color: index === currentQuestionIndex
                  ? palette.card
                  : palette.text
              }}
              onMouseEnter={(e) => {
                if (index !== currentQuestionIndex) {
                  e.currentTarget.style.borderColor = palette.accent;
                }
              }}
              onMouseLeave={(e) => {
                if (index !== currentQuestionIndex) {
                  e.currentTarget.style.borderColor = answers[q.questionNumber] ? '#10B98180' : palette.border;
                }
              }}
            >
              {q.questionNumber}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DailyTask;

