import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { BookOpen, Plus, Users, Search, Edit, Trash2, X, Link as LinkIcon, DollarSign } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { palette } from '@/theme/palette';

interface Course {
  _id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  duration: number;
  thumbnail: string;
  price: number;
  link: string;
  instructorName: string;
  language: string;
  requirements: string[];
  whatYouWillLearn: string[];
  enrolledStudents?: any[];
  published?: boolean;
}

const AdminCourses = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Other',
    level: 'Beginner',
    duration: 0,
    thumbnail: '',
    price: 0,
    link: '',
    instructorName: '',
    language: 'English',
    requirements: '',
    whatYouWillLearn: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // ─── Get Admin Token ────────────────────────────────
  const getAdminToken = () => {
    return localStorage.getItem('adminToken');
  };

  // ─── Fetch Courses ────────────────────────────────
  const fetchCourses = async () => {
    try {
      setLoading(true);
      const token = getAdminToken();
      // Fetch only courses created by this admin
      const { data } = await axios.get('http://localhost:5000/api/courses/my-created', {
        withCredentials: true,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setCourses(data);
    } catch (err: any) {
      console.error('Fetch Courses Error:', err);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // ─── Open Create Dialog ────────────────────────────────
  const handleCreateClick = () => {
    setEditingCourse(null);
    setFormData({
      title: '',
      description: '',
      category: 'Other',
      level: 'Beginner',
      duration: 0,
      thumbnail: '',
      price: 0,
      link: '',
      instructorName: '',
      language: 'English',
      requirements: '',
      whatYouWillLearn: '',
    });
    setIsDialogOpen(true);
  };

  // ─── Open Edit Dialog ────────────────────────────────
  const handleEditClick = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      description: course.description,
      category: course.category,
      level: course.level,
      duration: course.duration,
      thumbnail: course.thumbnail,
      price: course.price,
      link: course.link,
      instructorName: course.instructorName,
      language: course.language,
      requirements: course.requirements.join('\n'),
      whatYouWillLearn: course.whatYouWillLearn.join('\n'),
    });
    setIsDialogOpen(true);
  };

  // ─── Submit Form ────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description) {
      toast.error('Title and description are required');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        ...formData,
        duration: Number(formData.duration),
        price: Number(formData.price),
        requirements: formData.requirements
          .split('\n')
          .map((r) => r.trim())
          .filter((r) => r.length > 0),
        whatYouWillLearn: formData.whatYouWillLearn
          .split('\n')
          .map((w) => w.trim())
          .filter((w) => w.length > 0),
      };

      const token = getAdminToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      if (editingCourse) {
        // Update course
        await axios.put(
          `http://localhost:5000/api/courses/${editingCourse._id}`,
          payload,
          { withCredentials: true, headers }
        );
        toast.success('Course updated successfully');
      } else {
        // Create course
        await axios.post(
          'http://localhost:5000/api/courses',
          payload,
          { withCredentials: true, headers }
        );
        toast.success('Course created successfully');
      }

      setIsDialogOpen(false);
      fetchCourses();
    } catch (err: any) {
      console.error('Submit Error:', err);
      toast.error(err.response?.data?.message || 'Failed to save course');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Delete Course ────────────────────────────────
  const handleDelete = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course?')) {
      return;
    }

    try {
      const token = getAdminToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.delete(`http://localhost:5000/api/courses/${courseId}`, {
        withCredentials: true,
        headers,
      });
      toast.success('Course deleted successfully');
      fetchCourses();
    } catch (err: any) {
      console.error('Delete Error:', err);
      toast.error(err.response?.data?.message || 'Failed to delete course');
    }
  };

  // ─── Filtered Courses ────────────────────────────────
  const filteredCourses = courses.filter(
    (course) =>
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8" style={{ background: palette.bg }}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2" style={{ background: `linear-gradient(to right, ${palette.text}, ${palette.text2})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Course Management</h1>
          <p className="text-sm sm:text-base md:text-lg" style={{ color: palette.text2 }}>Create and manage your courses</p>
        </div>
        <Button size="lg" className="w-full sm:w-auto" style={{ background: palette.accentDeep, color: palette.card }} onMouseEnter={(e) => e.currentTarget.style.background = palette.accent} onMouseLeave={(e) => e.currentTarget.style.background = palette.accentDeep} onClick={handleCreateClick}>
          <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          <span className="hidden sm:inline">Create New Course</span>
          <span className="sm:hidden">Create</span>
        </Button>
      </div>

      {/* Search */}
      <div className="relative w-full sm:max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5" style={{ color: palette.text2 }} />
        <Input
          placeholder="Search courses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 sm:pl-10 text-sm"
          style={{ background: palette.card, color: palette.text, borderColor: palette.border }}
        />
      </div>

      {/* Loading State */}
      {loading && (
        <p className="text-center" style={{ color: palette.text2 }}>Loading courses...</p>
      )}

      {/* Courses Grid */}
      {!loading && filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredCourses.map((course, index) => (
            <motion.div
              key={course._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Card className="hover:scale-105 transition-transform cursor-pointer h-full" style={{ background: palette.card, border: `1px solid ${palette.border}` }} onMouseEnter={(e) => e.currentTarget.style.borderColor = palette.accent} onMouseLeave={(e) => e.currentTarget.style.borderColor = palette.border}>
                <CardHeader>
                  <div className="aspect-video rounded-xl overflow-hidden mb-4" style={{ background: palette.cardHover }}>
                    {course.thumbnail ? (
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-12 h-12 sm:w-16 sm:h-16" style={{ color: palette.accent }} />
                      </div>
                    )}
                  </div>
                  <CardTitle className="text-lg sm:text-xl" style={{ color: palette.text }}>{course.title}</CardTitle>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="inline-block px-2 sm:px-3 py-1 rounded-full text-xs font-medium" style={{ background: palette.accentSoft, color: palette.accent }}>
                      {course.category}
                    </span>
                    <span className="inline-block px-2 sm:px-3 py-1 rounded-full text-xs font-medium" style={{ background: palette.cardHover, color: palette.text }}>
                      {course.level}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs sm:text-sm line-clamp-2" style={{ color: palette.text2 }}>
                    {course.description}
                  </p>

                  <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: palette.text2 }} />
                      <span style={{ color: palette.text2 }}>{course.enrolledStudents?.length || 0} students</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: palette.text2 }} />
                      <span style={{ color: palette.text2 }}>{course.duration}h</span>
                    </div>
                    {course.price > 0 && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: palette.text2 }} />
                        <span style={{ color: palette.text2 }}>${course.price}</span>
                      </div>
                    )}
                    {course.link && (
                      <div className="flex items-center gap-2">
                        <LinkIcon className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: palette.text2 }} />
                        <a
                          href={course.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate"
                          style={{ color: palette.accent }}
                          onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                          onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                          onClick={(e) => e.stopPropagation()}
                        >
                          Link
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs sm:text-sm"
                      style={{ borderColor: palette.border, color: palette.text }}
                      onMouseEnter={(e) => e.currentTarget.style.background = palette.accentSoft}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      onClick={() => handleEditClick(course)}
                    >
                      <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs sm:text-sm"
                      style={{ borderColor: palette.border, color: '#EF4444' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#FEE2E2';
                        e.currentTarget.style.borderColor = '#EF4444';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.borderColor = palette.border;
                      }}
                      onClick={() => handleDelete(course._id)}
                    >
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : !loading ? (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4" style={{ color: palette.text2 }} />
          <p style={{ color: palette.text2 }}>
            No courses found. Create your first course!
          </p>
        </div>
      ) : null}

      {/* Create/Edit Course Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" style={{ background: palette.card, border: `1px solid ${palette.border}` }}>
          <DialogHeader>
            <DialogTitle style={{ color: palette.text }}>
              {editingCourse ? 'Edit Course' : 'Create New Course'}
            </DialogTitle>
            <DialogDescription style={{ color: palette.text2 }}>
              {editingCourse
                ? 'Update the course details below.'
                : 'Fill in the details to create a new course.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title" style={{ color: palette.text2 }}>Course Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="e.g., Advanced Machine Learning"
                  required
                  className="text-sm"
                  style={{ background: palette.card, color: palette.text, borderColor: palette.border }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" style={{ color: palette.text2 }}>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger className="text-sm" style={{ background: palette.card, color: palette.text, borderColor: palette.border }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ background: palette.card, borderColor: palette.border }}>
                    <SelectItem value="Programming" style={{ color: palette.text }}>Programming</SelectItem>
                    <SelectItem value="AI/ML" style={{ color: palette.text }}>AI/ML</SelectItem>
                    <SelectItem value="Web Development" style={{ color: palette.text }}>Web Development</SelectItem>
                    <SelectItem value="Data Science" style={{ color: palette.text }}>Data Science</SelectItem>
                    <SelectItem value="Design" style={{ color: palette.text }}>Design</SelectItem>
                    <SelectItem value="Other" style={{ color: palette.text }}>Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" style={{ color: palette.text2 }}>Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe what students will learn in this course..."
                rows={4}
                required
                className="text-sm"
                style={{ background: palette.card, color: palette.text, borderColor: palette.border }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="level" style={{ color: palette.text2 }}>Level</Label>
                <Select
                  value={formData.level}
                  onValueChange={(value) =>
                    setFormData({ ...formData, level: value })
                  }
                >
                  <SelectTrigger className="text-sm" style={{ background: palette.card, color: palette.text, borderColor: palette.border }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ background: palette.card, borderColor: palette.border }}>
                    <SelectItem value="Beginner" style={{ color: palette.text }}>Beginner</SelectItem>
                    <SelectItem value="Intermediate" style={{ color: palette.text }}>Intermediate</SelectItem>
                    <SelectItem value="Advanced" style={{ color: palette.text }}>Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration" style={{ color: palette.text2 }}>Duration (hours)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="0"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({ ...formData, duration: Number(e.target.value) })
                  }
                  placeholder="0"
                  className="text-sm"
                  style={{ background: palette.card, color: palette.text, borderColor: palette.border }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price" style={{ color: palette.text2 }}>Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: Number(e.target.value) })
                  }
                  placeholder="0.00"
                  className="text-sm"
                  style={{ background: palette.card, color: palette.text, borderColor: palette.border }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="link" style={{ color: palette.text2 }}>Course Link</Label>
                <Input
                  id="link"
                  type="url"
                  value={formData.link}
                  onChange={(e) =>
                    setFormData({ ...formData, link: e.target.value })
                  }
                  placeholder="https://example.com/course"
                  className="text-sm"
                  style={{ background: palette.card, color: palette.text, borderColor: palette.border }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="language" style={{ color: palette.text2 }}>Language</Label>
                <Input
                  id="language"
                  value={formData.language}
                  onChange={(e) =>
                    setFormData({ ...formData, language: e.target.value })
                  }
                  placeholder="English"
                  className="text-sm"
                  style={{ background: palette.card, color: palette.text, borderColor: palette.border }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="thumbnail" style={{ color: palette.text2 }}>Thumbnail URL</Label>
              <Input
                id="thumbnail"
                type="url"
                value={formData.thumbnail}
                onChange={(e) =>
                  setFormData({ ...formData, thumbnail: e.target.value })
                }
                placeholder="https://example.com/image.jpg"
                className="text-sm"
                style={{ background: palette.card, color: palette.text, borderColor: palette.border }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructorName" style={{ color: palette.text2 }}>Instructor Name</Label>
              <Input
                id="instructorName"
                value={formData.instructorName}
                onChange={(e) =>
                  setFormData({ ...formData, instructorName: e.target.value })
                }
                placeholder="Instructor's full name"
                className="text-sm"
                style={{ background: palette.card, color: palette.text, borderColor: palette.border }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requirements" style={{ color: palette.text2 }}>Requirements (one per line)</Label>
              <Textarea
                id="requirements"
                value={formData.requirements}
                onChange={(e) =>
                  setFormData({ ...formData, requirements: e.target.value })
                }
                placeholder="Basic programming knowledge&#10;Familiarity with Python"
                rows={3}
                className="text-sm"
                style={{ background: palette.card, color: palette.text, borderColor: palette.border }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatYouWillLearn" style={{ color: palette.text2 }}>What You'll Learn (one per line)</Label>
              <Textarea
                id="whatYouWillLearn"
                value={formData.whatYouWillLearn}
                onChange={(e) =>
                  setFormData({ ...formData, whatYouWillLearn: e.target.value })
                }
                placeholder="Master machine learning fundamentals&#10;Build real-world projects"
                rows={3}
                className="text-sm"
                style={{ background: palette.card, color: palette.text, borderColor: palette.border }}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={submitting}
                style={{ borderColor: palette.border, color: palette.text }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={submitting} 
                style={
                  submitting
                    ? { background: palette.border, color: palette.text2, cursor: 'not-allowed' }
                    : { background: palette.accentDeep, color: palette.card }
                }
                onMouseEnter={(e) => {
                  if (!submitting) e.currentTarget.style.background = palette.accent;
                }}
                onMouseLeave={(e) => {
                  if (!submitting) e.currentTarget.style.background = palette.accentDeep;
                }}
              >
                {submitting
                  ? 'Saving...'
                  : editingCourse
                  ? 'Update Course'
                  : 'Create Course'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCourses;
