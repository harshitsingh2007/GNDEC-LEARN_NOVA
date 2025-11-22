import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { palette } from '@/theme/palette';
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
  User,
  ArrowLeft,
  Save,
  Brain,
} from 'lucide-react';
import { toast } from 'sonner';
import { canNotify, iconUrl, sendNotification } from '@/lib/notifications';
import { useAdminNotificationPrefs } from '@/store/notificationPrefs';

interface Question {
  _id: string;
  questionText: string;
  questionType: string;
  marks: number;
  required: boolean;
  order: number;
}

interface Submission {
  _id: string;
  student: {
    _id: string;
    username: string;
    email: string;
  };
  answers: Array<{
    questionId: string;
    answer: string;
    submittedAt: string;
  }>;
  submittedAt: string;
  status: string;
  grade: number;
  totalMarks: number;
  feedback: string;
  gradedBy: {
    username: string;
    fullName: string;
  } | null;
  gradedAt: string | null;
}

interface Assignment {
  _id: string;
  title: string;
  description: string;
  course: string;
  questions: Question[];
  totalMarks: number;
  dueDate: string;
}

const AssignmentSubmissions = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [grade, setGrade] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [grading, setGrading] = useState(false);
  const [aiGrading, setAiGrading] = useState(false);
  const {
    newSubmissions,
    lastSubmissionCountByAssignment,
    setAssignmentSubmissionCount,
  } = useAdminNotificationPrefs();

  const previousCount = useMemo(() => {
    if (!id) return 0;
    return lastSubmissionCountByAssignment[id] ?? 0;
  }, [id, lastSubmissionCountByAssignment]);

  // ─── Get Admin Token ────────────────────────────────
  const getAdminToken = () => {
    return localStorage.getItem('adminToken');
  };

  // ─── Fetch Assignment Submissions ────────────────────────────────
  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const token = getAdminToken();
      const { data } = await axios.get(
        `http://localhost:5000/api/assignments/${id}/submissions`,
        {
          withCredentials: true,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (data.success) {
        setAssignment(data.assignment);
        setSubmissions(data.submissions);

        // Detect new submissions and notify (browser notification, not toast)
        const currentCount: number = Array.isArray(data.submissions) ? data.submissions.length : 0;
        if (id) {
          if (currentCount > previousCount && newSubmissions && canNotify()) {
            const diff = currentCount - previousCount;
            sendNotification('New assignment submission', {
              body: diff === 1
                ? `You have 1 new submission for "${data.assignment?.title || 'Assignment'}".`
                : `You have ${diff} new submissions for "${data.assignment?.title || 'Assignment'}".`,
              icon: iconUrl(),
              badge: iconUrl(),
            });
          }
          // Store the latest count
          setAssignmentSubmissionCount(id, currentCount);
        }
      }
    } catch (err: any) {
      console.error('Fetch Submissions Error:', err);
      toast.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchSubmissions();
    }
  }, [id]);

  // ─── Open Grade Dialog ────────────────────────────────
  const handleGradeClick = (submission: Submission) => {
    setSelectedSubmission(submission);
    setGrade(submission.grade || 0);
    setFeedback(submission.feedback || '');
    setIsDialogOpen(true);
  };

  // ─── Submit Grade ────────────────────────────────
  const handleSubmitGrade = async () => {
    if (!selectedSubmission || !id) return;

    if (grade < 0 || grade > (assignment?.totalMarks || 100)) {
      toast.error(`Grade must be between 0 and ${assignment?.totalMarks || 100}`);
      return;
    }

    try {
      setGrading(true);
      const token = getAdminToken();

      const { data } = await axios.put(
        `http://localhost:5000/api/assignments/${id}/grade/${selectedSubmission._id}`,
        { grade, feedback },
        {
          withCredentials: true,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (data.success) {
        toast.success('Assignment graded successfully');
        setIsDialogOpen(false);
        fetchSubmissions();
      }
    } catch (err: any) {
      console.error('Grade Assignment Error:', err);
      toast.error(err.response?.data?.message || 'Failed to grade assignment');
    } finally {
      setGrading(false);
    }
  };

  // ─── AI Grade Assignment ────────────────────────────────
  const handleAiGrade = async (submission: Submission) => {
    if (!id) return;

    try {
      setAiGrading(true);
      const token = getAdminToken();

      toast.info('AI is grading the assignment... This may take a moment.');

      const { data } = await axios.post(
        `http://localhost:5000/api/assignments/${id}/ai-grade/${submission._id}`,
        {},
        {
          withCredentials: true,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (data.success) {
        toast.success('Assignment graded successfully by AI!');
        fetchSubmissions();
      }
    } catch (err: any) {
      console.error('AI Grade Assignment Error:', err);
      toast.error(err.response?.data?.message || 'Failed to grade assignment with AI');
    } finally {
      setAiGrading(false);
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

  // Get answer for a question
  const getAnswerForQuestion = (submission: Submission, questionId: string) => {
    const answer = submission.answers.find((a) => a.questionId === questionId);
    return answer?.answer || 'No answer provided';
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8" style={{ background: palette.bg }}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Button variant="ghost" size="sm" className="w-full sm:w-auto" style={{ color: palette.text }} onClick={() => navigate('/admin/assessments')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2" style={{ background: `linear-gradient(to right, ${palette.text}, ${palette.text2})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            {assignment?.title || 'Assignment Submissions'}
          </h1>
          <p className="text-sm sm:text-base md:text-lg" style={{ color: palette.text2 }}>
            Grade student submissions ({submissions.length} total)
          </p>
        </div>
      </div>

      {assignment && (
        <Card style={{ background: palette.card, border: `1px solid ${palette.border}` }}>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg" style={{ color: palette.text }}>Assignment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs sm:text-sm" style={{ color: palette.text2 }}>{assignment.description}</p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm">
              <span style={{ color: palette.text }}>Course: <strong>{assignment.course}</strong></span>
              <span style={{ color: palette.text }}>Total Marks: <strong>{assignment.totalMarks}</strong></span>
              <span style={{ color: palette.text }}>Due Date: <strong>{formatDate(assignment.dueDate)}</strong></span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <p style={{ color: palette.text2 }}>Loading submissions...</p>
        </div>
      )}

      {/* Submissions List */}
      {!loading && submissions.length > 0 ? (
        <div className="space-y-4">
          {submissions.map((submission, index) => (
            <motion.div
              key={submission._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="transition-all" style={{ background: palette.card, border: `1px solid ${palette.border}` }} onMouseEnter={(e) => e.currentTarget.style.borderColor = palette.accent} onMouseLeave={(e) => e.currentTarget.style.borderColor = palette.border}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col lg:flex-row items-start justify-between gap-4">
                    <div className="flex-1 space-y-4 min-w-0">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: palette.accentSoft }}>
                          <User className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: palette.accent }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg font-semibold" style={{ color: palette.text }}>{submission.student.username}</h3>
                          <p className="text-xs sm:text-sm truncate" style={{ color: palette.text2 }}>{submission.student.email}</p>
                          <p className="text-xs mt-1" style={{ color: palette.text2 }}>
                            Submitted: {formatDate(submission.submittedAt)}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          {submission.status === 'graded' ? (
                            <span className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium" style={{ background: '#10B9811A', color: '#10B981' }}>
                              Graded: {submission.grade}/{submission.totalMarks}
                            </span>
                          ) : (
                            <span className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium" style={{ background: '#F59E0B1A', color: '#F59E0B' }}>
                              Pending
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Answers */}
                      <div className="space-y-3 mt-4">
                        {assignment?.questions.map((question, qIndex) => (
                          <div key={question._id} className="p-3 rounded-lg" style={{ border: `1px solid ${palette.border}` }}>
                            <div className="flex items-start justify-between mb-2">
                              <Label className="text-xs sm:text-sm font-semibold" style={{ color: palette.text }}>
                                Question {qIndex + 1} ({question.marks} marks)
                              </Label>
                            </div>
                            <p className="text-xs sm:text-sm mb-2" style={{ color: palette.text2 }}>
                              {question.questionText}
                            </p>
                            <div className="p-3 rounded-lg" style={{ background: palette.cardHover }}>
                              <p className="text-xs sm:text-sm whitespace-pre-wrap" style={{ color: palette.text }}>
                                {getAnswerForQuestion(submission, question._id)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {submission.status === 'graded' && submission.feedback && (
                        <div className="mt-4 p-3 rounded-lg" style={{ background: palette.cardHover }}>
                          <p className="text-xs sm:text-sm font-medium mb-1" style={{ color: palette.text }}>Feedback:</p>
                          <p className="text-xs sm:text-sm" style={{ color: palette.text2 }}>{submission.feedback}</p>
                          {submission.gradedBy && (
                            <p className="text-xs mt-2" style={{ color: palette.text2 }}>
                              Graded by {submission.gradedBy.fullName || submission.gradedBy.username} on{' '}
                              {submission.gradedAt ? formatDate(submission.gradedAt) : 'N/A'}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row lg:flex-col gap-2 w-full lg:w-auto">
                      {submission.status !== 'graded' && (
                        <Button
                          onClick={() => handleAiGrade(submission)}
                          className="text-xs sm:text-sm"
                          style={{ background: palette.accentDeep, color: palette.card }}
                          onMouseEnter={(e) => e.currentTarget.style.background = palette.accent}
                          onMouseLeave={(e) => e.currentTarget.style.background = palette.accentDeep}
                          disabled={aiGrading}
                        >
                          <Brain className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                          {aiGrading ? 'AI Grading...' : 'AI Grade'}
                        </Button>
                      )}
                      <Button
                        onClick={() => handleGradeClick(submission)}
                        className="text-xs sm:text-sm"
                        style={
                          submission.status === 'graded'
                            ? { borderColor: palette.border, color: palette.text }
                            : { background: palette.accentDeep, color: palette.card }
                        }
                        onMouseEnter={(e) => {
                          if (submission.status !== 'graded') {
                            e.currentTarget.style.background = palette.accent;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (submission.status !== 'graded') {
                            e.currentTarget.style.background = palette.accentDeep;
                          }
                        }}
                        variant={submission.status === 'graded' ? 'outline' : 'default'}
                        disabled={grading}
                      >
                        {submission.status === 'graded' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                            Update Grade
                          </>
                        ) : (
                          <>
                            <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                            Manual Grade
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : !loading ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4" style={{ color: palette.text2 }} />
          <p style={{ color: palette.text2 }}>No submissions found.</p>
        </div>
      ) : null}

      {/* Grade Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" style={{ background: palette.card, border: `1px solid ${palette.border}` }}>
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg" style={{ color: palette.text }}>
              Grade Assignment - {selectedSubmission?.student.username}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm" style={{ color: palette.text2 }}>
              Review the submission and provide a grade and feedback.
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission && assignment && (
            <div className="space-y-4">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {assignment.questions.map((question, qIndex) => (
                  <div key={question._id} className="p-3 rounded-lg" style={{ border: `1px solid ${palette.border}` }}>
                    <Label className="text-xs sm:text-sm font-semibold" style={{ color: palette.text }}>
                      Question {qIndex + 1} ({question.marks} marks)
                    </Label>
                    <p className="text-xs sm:text-sm mb-2" style={{ color: palette.text2 }}>{question.questionText}</p>
                    <div className="p-3 rounded-lg" style={{ background: palette.cardHover }}>
                      <p className="text-xs sm:text-sm whitespace-pre-wrap" style={{ color: palette.text }}>
                        {getAnswerForQuestion(selectedSubmission, question._id)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4 pt-4" style={{ borderTop: `1px solid ${palette.border}` }}>
                <div className="space-y-2">
                  <Label htmlFor="grade" style={{ color: palette.text2 }}>
                    Grade (out of {assignment.totalMarks})
                  </Label>
                  <Input
                    id="grade"
                    type="number"
                    min="0"
                    max={assignment.totalMarks}
                    value={grade}
                    onChange={(e) => setGrade(Number(e.target.value))}
                    required
                    className="text-sm"
                    style={{ background: palette.card, color: palette.text, borderColor: palette.border }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="feedback" style={{ color: palette.text2 }}>Feedback</Label>
                  <Textarea
                    id="feedback"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Provide feedback for the student..."
                    rows={4}
                    className="text-sm"
                    style={{ background: palette.card, color: palette.text, borderColor: palette.border }}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={grading}
              className="text-xs sm:text-sm"
              style={{ borderColor: palette.border, color: palette.text }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitGrade} 
              disabled={grading} 
              className="text-xs sm:text-sm"
              style={
                grading
                  ? { background: palette.border, color: palette.text2, cursor: 'not-allowed' }
                  : { background: palette.accentDeep, color: palette.card }
              }
              onMouseEnter={(e) => {
                if (!grading) e.currentTarget.style.background = palette.accent;
              }}
              onMouseLeave={(e) => {
                if (!grading) e.currentTarget.style.background = palette.accentDeep;
              }}
            >
              {grading ? 'Grading...' : 'Submit Grade'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AssignmentSubmissions;

