import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, Plus, Clock, Users, CheckCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

/* 🎨 Centralized Theme Palette */
export const palette = {
  bg: "#F7F5FF",
  card: "#FFFFFF",
  cardHover: "#F1ECFF",

  text: "#3B2F5D",
  text2: "#6B5E85",

  accent: "#A78BFA",
  accentSoft: "#DDD5FF",
  accentDeep: "#7C5BDA",

  border: "#E5E1F7",

  chartLine: "#A78BFA",
  chartFill: "rgba(167,139,250,0.18)",
  chartGrid: "#E5E1F7",

  progressTrack: "#EDE8FF",
  progressFill: "#A78BFA"
};

// Extended palette with status colors
const extendedPalette = {
  ...palette,
  success: "#10B981",
  successSoft: "#D1FAE5",
  warning: "#F59E0B",
  warningSoft: "#FEF3C7",
  destructive: "#EF4444",
  danger: "#EF4444",
  dangerSoft: "#FEE2E2",
};

interface Assignment {
  _id: string;
  title: string;
  description: string;
  course: string;
  courseId?: string;
  dueDate: string;
  totalMarks: number;
  questionsCount?: number;
  totalStudents: number;
  graded: number;
  pending: number;
  published: boolean;
  createdAt: string;
}

interface Course {
  _id: string;
  title: string;
}

const Assessments = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    courseId: '',
    module: '',
    videoUrl: '',
    dueDate: '',
    allowLateSubmission: false,
    latePenalty: 0,
    published: true,
  });
  const [questions, setQuestions] = useState([
    { questionText: '', questionType: 'text', marks: 1, required: true },
    { questionText: '', questionType: 'text', marks: 1, required: true },
  ]);

  const navigate = useNavigate();

  // ─── Get Admin Token ────────────────────────────────
  const getAdminToken = () => {
    return localStorage.getItem('adminToken');
  };

  // ─── Fetch Courses ────────────────────────────────
  const fetchCourses = async () => {
    try {
      const token = getAdminToken();
      const { data } = await axios.get('http://localhost:5000/api/courses', {
        withCredentials: true,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setCourses(data);
    } catch (err: any) {
      console.error('Fetch Courses Error:', err);
    }
  };

  // ─── Fetch Assignments ────────────────────────────────
  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const token = getAdminToken();
      
      // Fetch both quizzes and assignments
      const [quizzesRes, assignmentsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/auth/assessments', {
          withCredentials: true,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }).catch(() => ({ data: { success: false, assessments: [] } })),
        axios.get('http://localhost:5000/api/assignments/admin', {
          withCredentials: true,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }).catch(() => ({ data: { success: false, assignments: [] } })),
      ]);

      const allAssessments: Assignment[] = [];
      
      // Add quizzes
      if (quizzesRes.data.success && quizzesRes.data.assessments) {
        quizzesRes.data.assessments.forEach((quiz: any) => {
          allAssessments.push({
            _id: quiz._id,
            title: quiz.title,
            description: quiz.description,
            course: quiz.course,
            courseId: quiz.courseId,
            dueDate: quiz.dueDate || '',
            totalMarks: quiz.totalMarks,
            questionsCount: 0,
            totalStudents: quiz.students,
            graded: quiz.submitted,
            pending: quiz.pending,
            published: quiz.published,
            createdAt: quiz.createdAt,
          });
        });
      }
      
      // Add assignments
      if (assignmentsRes.data.success && assignmentsRes.data.assignments) {
        assignmentsRes.data.assignments.forEach((assignment: any) => {
          allAssessments.push({
            _id: assignment._id,
            title: assignment.title,
            description: assignment.description || '',
            course: assignment.course,
            courseId: assignment.courseId,
            dueDate: assignment.dueDate,
            totalMarks: assignment.totalMarks,
            questionsCount: assignment.questionsCount,
            totalStudents: assignment.totalStudents,
            graded: assignment.graded,
            pending: assignment.pending,
            published: assignment.published,
            createdAt: assignment.createdAt,
          });
        });
      }

      setAssignments(allAssessments);
    } catch (err: any) {
      console.error('Fetch Assignments Error:', err);
      toast.error('Failed to load assessments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
    fetchAssignments();
  }, []);

  // ─── Open Create Dialog ────────────────────────────────
  const handleCreateClick = () => {
    setEditingAssignmentId(null);
    setFormData({
      title: '',
      description: '',
      courseId: '',
      module: '',
      videoUrl: '',
      dueDate: '',
      allowLateSubmission: false,
      latePenalty: 0,
      published: true,
    });
    setQuestions([
      { questionText: '', questionType: 'text', marks: 1, required: true },
      { questionText: '', questionType: 'text', marks: 1, required: true },
    ]);
    setIsDialogOpen(true);
  };

  // ─── Open Edit Dialog ────────────────────────────────
  const handleEditClick = async (assignmentId: string) => {
    try {
      const token = getAdminToken();
      const { data } = await axios.get(
        `http://localhost:5000/api/assignments/${assignmentId}`,
        {
          withCredentials: true,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (data.success && data.assignment) {
        const assignment = data.assignment;
        setEditingAssignmentId(assignmentId);
        setFormData({
          title: assignment.title || '',
          description: assignment.description || '',
          courseId: assignment.courseId || '',
          module: assignment.module || '',
          videoUrl: assignment.videoUrl || '',
          dueDate: assignment.dueDate
            ? new Date(assignment.dueDate).toISOString().slice(0, 16)
            : '',
          allowLateSubmission: assignment.allowLateSubmission || false,
          latePenalty: assignment.latePenalty || 0,
          published: assignment.published !== false,
        });
        setQuestions(
          assignment.questions && assignment.questions.length > 0
            ? assignment.questions.map((q: any) => ({
                questionText: q.questionText || '',
                questionType: q.questionType || 'text',
                marks: q.marks || 1,
                required: q.required !== false,
              }))
            : [
                { questionText: '', questionType: 'text', marks: 1, required: true },
                { questionText: '', questionType: 'text', marks: 1, required: true },
              ]
        );
        setIsDialogOpen(true);
      }
    } catch (err: any) {
      console.error('Fetch Assignment Error:', err);
      toast.error(err.response?.data?.message || 'Failed to load assignment');
    }
  };

  // ─── Add Question ────────────────────────────────
  const addQuestion = () => {
    setQuestions([
      ...questions,
      { questionText: '', questionType: 'text', marks: 1, required: true },
    ]);
  };

  // ─── Remove Question ────────────────────────────────
  const removeQuestion = (index: number) => {
    if (questions.length > 2) {
      setQuestions(questions.filter((_, i) => i !== index));
    } else {
      toast.error('At least 2 questions are required');
    }
  };

  // ─── Update Question ────────────────────────────────
  const updateQuestion = (index: number, field: string, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  // ─── Submit Assignment ────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.courseId || !formData.dueDate) {
      toast.error('Title, course, and due date are required');
      return;
    }

    if (questions.length < 2) {
      toast.error('At least 2 questions are required');
      return;
    }

    const invalidQuestions = questions.filter((q) => !q.questionText.trim());
    if (invalidQuestions.length > 0) {
      toast.error('All questions must have text');
      return;
    }

    try {
      setSubmitting(true);
      const token = getAdminToken();

      const payload = {
        ...formData,
        questions: questions.map((q) => ({
          questionText: q.questionText,
          questionType: q.questionType,
          marks: Number(q.marks),
          required: q.required,
        })),
      };

      if (editingAssignmentId) {
        // Update existing assignment
        const { data } = await axios.put(
          `http://localhost:5000/api/assignments/${editingAssignmentId}`,
          payload,
          {
            withCredentials: true,
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );

        if (data.success) {
          toast.success('Assignment updated successfully');
          setIsDialogOpen(false);
          setEditingAssignmentId(null);
          fetchAssignments();
        }
      } else {
        // Create new assignment
      const { data } = await axios.post(
        'http://localhost:5000/api/assignments',
        payload,
        {
          withCredentials: true,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (data.success) {
        toast.success('Assignment created successfully');
        setIsDialogOpen(false);
        fetchAssignments();
        }
      }
    } catch (err: any) {
      console.error(editingAssignmentId ? 'Update Assignment Error:' : 'Create Assignment Error:', err);
      toast.error(err.response?.data?.message || `Failed to ${editingAssignmentId ? 'update' : 'create'} assignment`);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── View Submissions ────────────────────────────────
  const handleViewSubmissions = (assignmentId: string, assignment: Assignment) => {
    // Only navigate for assignments (those with questionsCount)
    if (assignment.questionsCount !== undefined) {
      navigate(`/admin/assignments/${assignmentId}/submissions`);
    } else {
      toast.info('Quiz submissions are managed differently');
    }
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8" style={{ backgroundColor: palette.bg }}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2" style={{ color: palette.text }}>
            Assignments
          </h1>
          <p className="text-sm sm:text-base md:text-lg" style={{ color: palette.text2 }}>
            Create and grade student assignments ({assignments.length} total)
          </p>
        </div>
        <Button 
          size="lg" 
          className="w-full sm:w-auto transition-all duration-300 hover:shadow-lg"
          style={{ 
            background: palette.accent,
            color: palette.card
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = palette.accentDeep}
          onMouseLeave={(e) => e.currentTarget.style.background = palette.accent}
          onClick={handleCreateClick}
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          <span className="hidden sm:inline">Create Assignment</span>
          <span className="sm:hidden">Create</span>
        </Button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <p style={{ color: palette.text2 }}>Loading assignments...</p>
        </div>
      )}

      {/* Assignments List */}
      {!loading && assignments.length > 0 ? (
        <div className="space-y-4">
          {assignments.map((assignment, index) => (
            <motion.div
              key={assignment._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Card 
                className="transition-all cursor-pointer hover:shadow-lg border"
                style={{ 
                  backgroundColor: palette.card,
                  borderColor: palette.border,
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = palette.cardHover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = palette.card}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-6">
                    <div 
                      className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ 
                        background: `linear-gradient(135deg, ${palette.accentSoft}, ${palette.accent})` 
                      }}
                    >
                      <FileText className="w-8 h-8" style={{ color: palette.accentDeep }} />
                    </div>

                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-semibold" style={{ color: palette.text }}>
                            {assignment.title}
                          </h3>
                          <p className="text-sm" style={{ color: palette.text2 }}>
                            {assignment.course}
                          </p>
                          {assignment.description && (
                            <p className="text-sm mt-1" style={{ color: palette.text2 }}>
                              {assignment.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4" style={{ color: extendedPalette.warning }} />
                          <span className="font-medium" style={{ color: extendedPalette.warning }}>
                            Due: {formatDate(assignment.dueDate)}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-3 rounded-xl" style={{ backgroundColor: palette.cardHover }}>
                          <div className="flex items-center gap-2 mb-1">
                            <Users className="w-4 h-4" style={{ color: palette.text2 }} />
                            <span className="text-sm" style={{ color: palette.text2 }}>Total Students</span>
                          </div>
                          <p className="text-2xl font-bold" style={{ color: palette.text }}>
                            {assignment.totalStudents}
                          </p>
                        </div>

                        <div 
                          className="p-3 rounded-xl border"
                          style={{ 
                            backgroundColor: extendedPalette.successSoft,
                            borderColor: extendedPalette.success 
                          }}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle className="w-4 h-4" style={{ color: extendedPalette.success }} />
                            <span className="text-sm" style={{ color: extendedPalette.success }}>Graded</span>
                          </div>
                          <p className="text-2xl font-bold" style={{ color: extendedPalette.success }}>
                            {assignment.graded}
                          </p>
                        </div>

                        <div 
                          className="p-3 rounded-xl border"
                          style={{ 
                            backgroundColor: extendedPalette.warningSoft,
                            borderColor: extendedPalette.warning 
                          }}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="w-4 h-4" style={{ color: extendedPalette.warning }} />
                            <span className="text-sm" style={{ color: extendedPalette.warning }}>Pending</span>
                          </div>
                          <p className="text-2xl font-bold" style={{ color: extendedPalette.warning }}>
                            {assignment.pending}
                          </p>
                        </div>
                      </div>

                      {/* Assignment Details */}
                      <div className="flex items-center gap-4 text-sm" style={{ color: palette.text2 }}>
                        <span>
                          Total Marks: <strong style={{ color: palette.text }}>{assignment.totalMarks}</strong>
                        </span>
                        {assignment.questionsCount !== undefined && (
                          <span>
                            Questions: <strong style={{ color: palette.text }}>{assignment.questionsCount}</strong>
                          </span>
                        )}
                        <span
                          className="px-2 py-1 rounded-full text-xs"
                          style={{
                            backgroundColor: assignment.published ? extendedPalette.successSoft : palette.cardHover,
                            color: assignment.published ? extendedPalette.success : palette.text2
                          }}
                        >
                          {assignment.published ? 'Published' : 'Draft'}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        {assignment.questionsCount !== undefined && (
                          <Button
                            size="sm"
                            style={{ 
                              background: palette.accent,
                              color: palette.card
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = palette.accentDeep}
                            onMouseLeave={(e) => e.currentTarget.style.background = palette.accent}
                            onClick={() => handleViewSubmissions(assignment._id, assignment)}
                          >
                            View Submissions
                          </Button>
                        )}
                        {assignment.questionsCount !== undefined && (
                          <Button
                            size="sm"
                            variant="outline"
                            style={{ 
                              borderColor: palette.border,
                              color: palette.text
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = palette.cardHover;
                              e.currentTarget.style.borderColor = palette.accent;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.borderColor = palette.border;
                            }}
                            onClick={() => handleEditClick(assignment._id)}
                          >
                            Edit Assignment
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : !loading ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 mx-auto mb-4" style={{ color: palette.text2 }} />
          <p style={{ color: palette.text2 }}>
            No assignments found. Create your first assignment!
          </p>
        </div>
      ) : null}

      {/* Create/Edit Assignment Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          setEditingAssignmentId(null);
        }
      }}>
        <DialogContent 
          className="max-w-3xl max-h-[90vh] overflow-y-auto"
          style={{ backgroundColor: palette.card }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: palette.text }}>
              {editingAssignmentId ? 'Edit Assignment' : 'Create New Assignment'}
            </DialogTitle>
            <DialogDescription style={{ color: palette.text2 }}>
              {editingAssignmentId
                ? 'Update the assignment details and questions.'
                : 'Create an assignment with 2 or more questions for your students.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title" style={{ color: palette.text }}>Assignment Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="e.g., Midterm Project"
                  required
                  style={{
                    backgroundColor: palette.card,
                    borderColor: palette.border,
                    color: palette.text
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="courseId" style={{ color: palette.text }}>Course *</Label>
                <Select
                  value={formData.courseId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, courseId: value })
                  }
                  required
                  disabled={!!editingAssignmentId}
                >
                  <SelectTrigger style={{
                    backgroundColor: palette.card,
                    borderColor: palette.border,
                    color: palette.text
                  }}>
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent style={{
                    backgroundColor: palette.card,
                    borderColor: palette.border
                  }}>
                    {courses.map((course) => (
                      <SelectItem 
                        key={course._id} 
                        value={course._id}
                        style={{ color: palette.text }}
                      >
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" style={{ color: palette.text }}>Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Assignment description..."
                rows={3}
                style={{
                  backgroundColor: palette.card,
                  borderColor: palette.border,
                  color: palette.text
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="videoUrl" style={{ color: palette.text }}>Video URL (Optional)</Label>
              <Input
                id="videoUrl"
                type="url"
                value={formData.videoUrl}
                onChange={(e) =>
                  setFormData({ ...formData, videoUrl: e.target.value })
                }
                placeholder="https://youtube.com/watch?v=... or video file URL"
                style={{
                  backgroundColor: palette.card,
                  borderColor: palette.border,
                  color: palette.text
                }}
              />
              <p className="text-xs" style={{ color: palette.text2 }}>
                Supports YouTube, Vimeo, Google Drive, or direct video file URLs
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dueDate" style={{ color: palette.text }}>Due Date *</Label>
                <Input
                  id="dueDate"
                  type="datetime-local"
                  value={formData.dueDate}
                  onChange={(e) =>
                    setFormData({ ...formData, dueDate: e.target.value })
                  }
                  required
                  style={{
                    backgroundColor: palette.card,
                    borderColor: palette.border,
                    color: palette.text
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="module" style={{ color: palette.text }}>Module (Optional)</Label>
                <Input
                  id="module"
                  value={formData.module}
                  onChange={(e) =>
                    setFormData({ ...formData, module: e.target.value })
                  }
                  placeholder="Module name"
                  style={{
                    backgroundColor: palette.card,
                    borderColor: palette.border,
                    color: palette.text
                  }}
                />
              </div>
            </div>

            {/* Questions Section */}
            <div className="space-y-4 border-t pt-4" style={{ borderColor: palette.border }}>
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold" style={{ color: palette.text }}>Questions *</Label>
                <Button 
                  type="button" 
                  size="sm" 
                  variant="outline" 
                  onClick={addQuestion}
                  style={{ 
                    borderColor: palette.border,
                    color: palette.text
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = palette.cardHover;
                    e.currentTarget.style.borderColor = palette.accent;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = palette.border;
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Question
                </Button>
              </div>

              {questions.map((question, index) => (
                <div 
                  key={index} 
                  className="p-4 border rounded-lg space-y-3"
                  style={{ 
                    backgroundColor: palette.cardHover,
                    borderColor: palette.border
                  }}
                >
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium" style={{ color: palette.text }}>
                      Question {index + 1}
                    </Label>
                    {questions.length > 2 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeQuestion(index)}
                        style={{ color: extendedPalette.danger }}
                        onMouseEnter={(e: any) => { e.currentTarget.style.backgroundColor = extendedPalette.dangerSoft; }}
                        onMouseLeave={(e: any) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Textarea
                      placeholder="Enter question text..."
                      value={question.questionText}
                      onChange={(e) =>
                        updateQuestion(index, 'questionText', e.target.value)
                      }
                      rows={3}
                      required
                      style={{
                        backgroundColor: palette.card,
                        borderColor: palette.border,
                        color: palette.text
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs" style={{ color: palette.text }}>Type</Label>
                      <Select
                        value={question.questionType}
                        onValueChange={(value) =>
                          updateQuestion(index, 'questionType', value)
                        }
                      >
                        <SelectTrigger style={{
                          backgroundColor: palette.card,
                          borderColor: palette.border,
                          color: palette.text
                        }}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent style={{
                          backgroundColor: palette.card,
                          borderColor: palette.border
                        }}>
                          <SelectItem value="text" style={{ color: palette.text }}>Text</SelectItem>
                          <SelectItem value="code" style={{ color: palette.text }}>Code</SelectItem>
                          <SelectItem value="file" style={{ color: palette.text }}>File Upload</SelectItem>
                          <SelectItem value="multiple_choice" style={{ color: palette.text }}>Multiple Choice</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs" style={{ color: palette.text }}>Marks</Label>
                      <Input
                        type="number"
                        min="1"
                        value={question.marks}
                        onChange={(e) =>
                          updateQuestion(index, 'marks', Number(e.target.value))
                        }
                        required
                        style={{
                          backgroundColor: palette.card,
                          borderColor: palette.border,
                          color: palette.text
                        }}
                      />
                    </div>

                    <div className="space-y-2 flex items-end">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={question.required}
                          onChange={(e) =>
                            updateQuestion(index, 'required', e.target.checked)
                          }
                          className="rounded"
                          style={{ accentColor: palette.accent }}
                        />
                        <span className="text-xs" style={{ color: palette.text }}>Required</span>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.allowLateSubmission}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        allowLateSubmission: e.target.checked,
                      })
                    }
                    className="rounded"
                    style={{ accentColor: palette.accent }}
                  />
                  <span className="text-sm" style={{ color: palette.text }}>Allow Late Submission</span>
                </label>
              </div>

              {formData.allowLateSubmission && (
                <div className="space-y-2">
                  <Label htmlFor="latePenalty" style={{ color: palette.text }}>Late Penalty (%)</Label>
                  <Input
                    id="latePenalty"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.latePenalty}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        latePenalty: Number(e.target.value),
                      })
                    }
                    style={{
                      backgroundColor: palette.card,
                      borderColor: palette.border,
                      color: palette.text
                    }}
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={submitting}
                style={{ 
                  borderColor: palette.border,
                  color: palette.text
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = palette.cardHover;
                  e.currentTarget.style.borderColor = palette.accent;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = palette.border;
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={submitting}
                className="transition-all duration-300 hover:shadow-lg"
                style={{ 
                  background: palette.accent,
                  color: palette.card
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = palette.accentDeep}
                onMouseLeave={(e) => e.currentTarget.style.background = palette.accent}
              >
                {submitting
                  ? editingAssignmentId
                    ? 'Updating...'
                    : 'Creating...'
                  : editingAssignmentId
                  ? 'Update Assignment'
                  : 'Create Assignment'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Assessments;