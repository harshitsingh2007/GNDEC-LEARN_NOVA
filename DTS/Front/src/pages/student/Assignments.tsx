import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import VideoPlayer from '@/components/VideoPlayer';
import { palette } from '@/theme/palette';

// Extended palette with status colors
const extendedPalette = {
  ...palette,
  success: "#10B981", // Tailwind green-500
  warning: "#F59E0B", // Tailwind amber-500
  destructive: "#EF4444", // Tailwind red-500
};

// Types
interface Assignment {
  _id: string;
  title: string;
  description: string;
  course: string;
  courseId?: string;
  dueDate: string;
  totalMarks: number;
  questionsCount: number;
  questions: Array<{
    _id: string;
    questionText: string;
    questionType: string;
    marks: number;
    required: boolean;
    order: number;
  }>;
  allowLateSubmission: boolean;
  latePenalty: number;
  isSubmitted: boolean;
  isGraded: boolean;
  isOverdue: boolean;
  videoUrl?: string;
  submission: {
    grade: number;
    feedback: string;
    submittedAt: string;
    status: string;
  } | null;
}

const Assignments = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  // ─── Fetch Assignments ────────────────────────────────
  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers: any = {};

      // Add Authorization header if token exists
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const { data } = await axios.get('http://localhost:5000/api/assignments/student', {
        withCredentials: true,
        headers,
      });

      if (data.success) {
        setAssignments(data.assignments || []);
      } else {
        console.error('API returned success: false', data);
        setAssignments([]);
      }
    } catch (err: any) {
      console.error('Fetch Assignments Error:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load assignments';
      toast.error(errorMessage);
      setAssignments([]);

      // Log more details for debugging
      if (err.response) {
        console.error('Error response:', err.response.data);
        console.error('Error status:', err.response.status);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  // ─── Open Assignment Dialog ────────────────────────────────
  const handleOpenAssignment = (assignment: Assignment) => {
    setSelectedAssignment(assignment);

    // Pre-fill answers if already submitted
    if (assignment.submission && assignment.submission.status === 'submitted') {
      // Note: We'd need to fetch the full submission to get answers
      // For now, we'll just show the submission status
    }

    setAnswers({});
    setIsDialogOpen(true);
  };

  // ─── Submit Assignment ────────────────────────────────
  const handleSubmit = async () => {
    if (!selectedAssignment) return;

    // Validate required questions
    const requiredQuestions = selectedAssignment.questions.filter((q) => q.required);
    const missingAnswers = requiredQuestions.filter(
      (q) => !answers[q._id] || !answers[q._id].trim()
    );

    if (missingAnswers.length > 0) {
      toast.error('Please answer all required questions');
      return;
    }

    try {
      setSubmitting(true);

      // Format answers
      const formattedAnswers = selectedAssignment.questions
        .filter((q) => answers[q._id])
        .map((q) => ({
          questionId: q._id,
          answer: answers[q._id],
        }));

      const { data } = await axios.post(
        `http://localhost:5000/api/assignments/${selectedAssignment._id}/submit`,
        { answers: formattedAnswers },
        { withCredentials: true }
      );

      if (data.success) {
        toast.success('Assignment submitted successfully!');
        setIsDialogOpen(false);
        fetchAssignments();
      }
    } catch (err: any) {
      console.error('Submit Assignment Error:', err);
      toast.error(err.response?.data?.message || 'Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // ─── Status Badge Component (Themed) ────────────────────────────────
  const getStatusBadge = (assignment: Assignment) => {
    let color, bgColor, text;

    if (assignment.isGraded) {
      color = extendedPalette.success;
      bgColor = extendedPalette.success + '1A'; // 10% opacity
      text = 'Graded';
    } else if (assignment.isSubmitted) {
      color = extendedPalette.accentDeep;
      bgColor = extendedPalette.accentDeep + '1A';
      text = 'Submitted';
    } else if (assignment.isOverdue) {
      color = extendedPalette.destructive;
      bgColor = extendedPalette.destructive + '1A';
      text = 'Overdue';
    } else {
      color = extendedPalette.warning;
      bgColor = extendedPalette.warning + '1A';
      text = 'Pending';
    }

    return (
      <span
        className="px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap"
        style={{ backgroundColor: bgColor, color: color }}
      >
        {text}
      </span>
    );
  };

  // ─── Assignment Item ────────────────────────────────
  const AssignmentItem = ({ assignment, index }: { assignment: Assignment, index: number }) => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.1 }}
      >
        <Card
          className="transition-all"
          style={{ backgroundColor: extendedPalette.card, border: `1px solid ${extendedPalette.border}` }}
          onMouseOver={(e) => e.currentTarget.style.borderColor = extendedPalette.accent}
          onMouseOut={(e) => e.currentTarget.style.borderColor = extendedPalette.border}
        >
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

              {/* Icon and Main Info */}
              <div className="flex flex-1 items-start gap-4 w-full sm:w-auto">
                <div
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `linear-gradient(45deg, ${extendedPalette.accentSoft}, ${extendedPalette.accent})` }}
                >
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: extendedPalette.accentDeep }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between w-full">
                    <div>
                      <h3 className="text-lg sm:text-xl font-semibold truncate" style={{ color: extendedPalette.text }}>{assignment.title}</h3>
                      <p className="text-xs sm:text-sm mt-0.5" style={{ color: extendedPalette.text2 }}>
                        {assignment.course}
                      </p>
                    </div>
                    <div className="sm:hidden ml-4">
                        {getStatusBadge(assignment)}
                    </div>
                  </div>

                  {/* Details Row (Visible on small screens as well) */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs" style={{ color: extendedPalette.text2 }}>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Due: {formatDate(assignment.dueDate)}</span>
                    </div>
                    <div>
                      <span>Marks: <strong style={{ color: extendedPalette.text }}>{assignment.totalMarks}</strong></span>
                    </div>
                    <div>
                      <span>Questions: <strong style={{ color: extendedPalette.text }}>{assignment.questionsCount}</strong></span>
                    </div>
                    {assignment.isGraded && assignment.submission && (
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" style={{ color: extendedPalette.success }} />
                        <span style={{ color: extendedPalette.success }}>
                          Grade: {assignment.submission.grade}/{assignment.totalMarks}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Description (Optional) */}
                  {assignment.description && (
                    <p className="text-xs mt-2 italic hidden md:block" style={{ color: extendedPalette.text2 }}>
                      {assignment.description.substring(0, 100)}{assignment.description.length > 100 ? '...' : ''}
                    </p>
                  )}

                  {/* Feedback (If Graded) */}
                  {assignment.isGraded && assignment.submission?.feedback && (
                    <div className="mt-4 p-3 rounded-lg text-xs" style={{ backgroundColor: extendedPalette.bg, border: `1px solid ${extendedPalette.border}`, color: extendedPalette.text2 }}>
                      <p className="font-medium mb-1" style={{ color: extendedPalette.text }}>Feedback:</p>
                      <p>
                        {assignment.submission.feedback.substring(0, 80)}{assignment.submission.feedback.length > 80 ? '...' : ''}
                      </p>
                    </div>
                  )}

                </div>
              </div>

              {/* Status Badge and Button */}
              <div className="flex flex-col items-end gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                <div className="hidden sm:block">
                    {getStatusBadge(assignment)}
                </div>
                {!assignment.isSubmitted ? (
                  <Button
                    onClick={() => handleOpenAssignment(assignment)}
                    disabled={assignment.isOverdue && !assignment.allowLateSubmission}
                    className="w-full sm:w-auto text-sm"
                    style={{ backgroundColor: extendedPalette.accentDeep, color: extendedPalette.card, boxShadow: `0 4px 6px -1px ${extendedPalette.accentDeep}33` }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = extendedPalette.accent}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = extendedPalette.accentDeep}
                  >
                    {assignment.isOverdue ? (
                      <>
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Submit (Late)
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Start Assignment
                      </>
                    )}
                  </Button>
                ) : assignment.isGraded ? (
                  <Button variant="outline" disabled className="w-full sm:w-auto text-sm" style={{ borderColor: extendedPalette.success, color: extendedPalette.success, backgroundColor: extendedPalette.card }}>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Graded
                  </Button>
                ) : (
                  <Button variant="outline" disabled className="w-full sm:w-auto text-sm" style={{ borderColor: extendedPalette.border, color: extendedPalette.text2, backgroundColor: extendedPalette.card }}>
                    Submitted
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // ─── Render ────────────────────────────────
  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8" style={{ backgroundColor: extendedPalette.bg, minHeight: '100vh' }}>
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2" style={{ color: extendedPalette.text }}>
            My Assignments 
        </h1>
        <p className="text-xs sm:text-sm md:text-lg" style={{ color: extendedPalette.text2 }}>
          View and submit your assigned tasks.
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: extendedPalette.text }}></div>
          <p style={{ color: extendedPalette.text2 }}>Loading assignments...</p>
        </div>
      )}

      {/* Assignments List */}
      {!loading && assignments.length > 0 ? (
        <div className="grid gap-4">
          {assignments.map((assignment, index) => (
            <AssignmentItem key={assignment._id} assignment={assignment} index={index} />
          ))}
        </div>
      ) : !loading ? (
        <div className="text-center py-12" style={{ color: extendedPalette.text2 }}>
          <FileText className="w-16 h-16 mx-auto mb-4" style={{ color: extendedPalette.text2 }} />
          <p className="mb-2">No assignments found.</p>
          <p className="text-sm">
            Make sure you are enrolled in courses that have published assignments.
          </p>
        </div>
      ) : null}

      {/* Assignment Submission Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md sm:max-w-3xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: extendedPalette.card, border: `1px solid ${extendedPalette.border}`, color: extendedPalette.text }}>
          <DialogHeader>
            <DialogTitle style={{ color: extendedPalette.text }}>{selectedAssignment?.title}</DialogTitle>
            <DialogDescription style={{ color: extendedPalette.text2 }}>
              {selectedAssignment?.description || 'Complete all questions to submit'}
            </DialogDescription>
          </DialogHeader>

          {selectedAssignment && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-4 text-sm" style={{ color: extendedPalette.text2 }}>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Due: {formatDate(selectedAssignment.dueDate)}</span>
                </div>
                <div>
                  <span>Total Marks: <strong style={{ color: extendedPalette.text }}>{selectedAssignment.totalMarks}</strong></span>
                </div>
                {selectedAssignment.isOverdue && (
                  <span style={{ color: extendedPalette.warning }}>
                    ⚠️ This assignment is overdue
                  </span>
                )}
              </div>

              {/* Video Player */}
              {selectedAssignment.videoUrl && (
                <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${extendedPalette.border}` }}>
                  <VideoPlayer
                    url={selectedAssignment.videoUrl}
                    title={selectedAssignment.title}
                    className="w-full"
                  />
                </div>
              )}

              <div className="space-y-6">
                {selectedAssignment.questions.map((question, index) => (
                  <div key={question._id} className="space-y-3 p-4 border rounded-lg" style={{ borderColor: extendedPalette.border }}>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <Label className="text-base font-semibold" style={{ color: extendedPalette.text }}>
                        Question {index + 1} {question.required && <span style={{ color: extendedPalette.destructive }}>*</span>}
                        <span className="text-sm font-normal ml-2" style={{ color: extendedPalette.text2 }}>
                          ({question.marks} marks)
                        </span>
                      </Label>
                      <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: extendedPalette.bg, color: extendedPalette.text2 }}>
                        {question.questionType}
                      </span>
                    </div>
                    <p className="text-sm" style={{ color: extendedPalette.text }}>{question.questionText}</p>
                    <Textarea
                      placeholder={
                        question.questionType === 'code'
                          ? 'Write your code here...'
                          : question.questionType === 'file'
                            ? 'Paste file URL or description here...'
                            : 'Type your answer here...'
                      }
                      value={answers[question._id] || ''}
                      onChange={(e) =>
                        setAnswers({ ...answers, [question._id]: e.target.value })
                      }
                      rows={question.questionType === 'code' ? 10 : 5}
                      className="font-mono"
                      required={question.required}
                      style={{ backgroundColor: extendedPalette.card, borderColor: extendedPalette.border, color: extendedPalette.text }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={submitting}
              className="w-full sm:w-auto"
              style={{ borderColor: extendedPalette.border, color: extendedPalette.text2, backgroundColor: extendedPalette.card }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = extendedPalette.cardHover}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = extendedPalette.card}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full sm:w-auto"
              style={{ backgroundColor: extendedPalette.accentDeep, color: extendedPalette.card, boxShadow: `0 4px 6px -1px ${extendedPalette.accentDeep}33` }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = extendedPalette.accent}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = extendedPalette.accentDeep}
            >
              {submitting ? (
                'Submitting...'
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Assignment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Assignments;