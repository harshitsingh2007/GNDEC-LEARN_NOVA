import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  Clock,
  User,
  Search,
  Play,
  CheckCircle2,
  DollarSign,
  Link as LinkIcon,
  PlusCircle,
  Brain,
  Youtube,
  BookAudioIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { palette } from "../../theme/palette";

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
  instructorName?: string;
  instructor?: {
    username: string;
    email: string;
  };
  progress?: number;
  isEnrolled?: boolean;
}

const Courses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [enrolling, setEnrolling] = useState<string | null>(null);

  // ─── Fetch all courses ────────────────────────────────
  const fetchCourses = async () => {
    try {
      setLoading(true);
      
      // Fetch enrolled courses first to check enrollment status
      const enrolledResponse = await axios.get('http://localhost:5000/api/courses/my', {
        withCredentials: true,
      }).catch(() => ({ data: [] }));
      
      const enrolledIds = new Set(enrolledResponse.data.map((course: Course) => course._id));
      setEnrolledCourseIds(enrolledIds);
      
      // Fetch all courses
      const { data } = await axios.get("http://localhost:5000/api/courses", {
        withCredentials: true,
      });
      
      // Mark courses as enrolled
      const coursesWithEnrollment = data.map((course: Course) => ({
        ...course,
        isEnrolled: enrolledIds.has(course._id),
      }));
      
      setCourses(coursesWithEnrollment);
    } catch (err: any) {
      console.error("Fetch Courses Error:", err);
      setError("Failed to load courses.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // ─── Enroll in a Course ────────────────────────────────
  const handleEnroll = async (courseId: string) => {
    // Check if already enrolled
    if (enrolledCourseIds.has(courseId)) {
      return;
    }

    try {
      setEnrolling(courseId);

      const { data } = await axios.post(
        "http://localhost:5000/api/courses/enroll",
        { courseId },
        { withCredentials: true }
      );

      console.log('Enrollment Success:', data);

      // Add to enrolled courses set
      setEnrolledCourseIds(prev => new Set([...prev, courseId]));
      
      // Update course enrollment status
      setCourses(prevCourses => 
        prevCourses.map(course => 
          course._id === courseId 
            ? { ...course, isEnrolled: true }
            : course
        )
      );

      // Show success message
      alert(`✅ ${data.message}`);
    } catch (err: any) {
      console.error('Enrollment Error:', err);
      const errorMessage = err.response?.data?.message || '❌ Enrollment failed. Please try again.';
      
      // Check if already enrolled error
      if (errorMessage.includes('Already enrolled')) {
        setEnrolledCourseIds(prev => new Set([...prev, courseId]));
        setCourses(prevCourses => 
          prevCourses.map(course => 
            course._id === courseId 
              ? { ...course, isEnrolled: true }
              : course
          )
        );
      }
      
      alert(errorMessage);
    } finally {
      setEnrolling(null);
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
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2" style={{ background: `linear-gradient(to right, ${palette.text}, ${palette.text2})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          My Courses
        </h1>
        <p className="text-sm sm:text-base md:text-lg" style={{ color: palette.text2 }}>
          Continue your learning journey
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative w-full sm:max-w-md mb-4 sm:mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
        <Input
          placeholder="Search courses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 sm:pl-10 text-sm"
        />
      </div>

      {/* ✨ New Creation Options Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-wrap gap-3 sm:gap-4 mb-6 sm:mb-8"
      >
        <Link to="/student/createcourse" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto gap-2 shadow-lg" style={{ background: palette.accent, color: palette.card }} onMouseEnter={(e) => e.currentTarget.style.background = palette.accentDeep} onMouseLeave={(e) => e.currentTarget.style.background = palette.accent}>
            <PlusCircle className="w-4 h-4" />
            Create Your Own Course
          </Button>
        </Link>

        <Link to="/student/generatecourse" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto gap-2 shadow-lg" style={{ background: palette.accent, color: palette.card }} onMouseEnter={(e) => e.currentTarget.style.background = palette.accentDeep} onMouseLeave={(e) => e.currentTarget.style.background = palette.accent}>
            <Brain className="w-4 h-4" />
            Build With Nova
          </Button>
        </Link>

        <Link to="/student/viaplaylist" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto gap-2 shadow-lg" style={{ background: palette.accent, color: palette.card }} onMouseEnter={(e) => e.currentTarget.style.background = palette.accentDeep} onMouseLeave={(e) => e.currentTarget.style.background = palette.accent}>
            <Youtube className="w-4 h-4" />
            Build With Playlist
          </Button>
        </Link>
        <Link to="/student/roadmap" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto gap-2 shadow-lg" style={{ background: palette.accent, color: palette.card }} onMouseEnter={(e) => e.currentTarget.style.background = palette.accentDeep} onMouseLeave={(e) => e.currentTarget.style.background = palette.accent}>
            <BookAudioIcon className="w-4 h-4" />
            RoadMaps
          </Button>
        </Link>
      </motion.div>

      {/* Loading / Error */}
      {loading && (
        <p className="text-center" style={{ color: palette.text2 }}>
          Loading courses...
        </p>
      )}
      {error && <p className="text-center" style={{ color: '#F87171' }}>{error}</p>}

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
              <Card className="h-full hover:scale-105 transition-transform cursor-pointer hover:shadow-xl shadow-sm" style={{ background: palette.card, borderColor: palette.border, borderWidth: '1px' }}>
                <CardHeader className="pb-4">
                  <div className="aspect-video rounded-xl overflow-hidden mb-4" style={{ background: palette.cardHover }}>
                    <img
                      src={
                        course.thumbnail ||
                        "https://via.placeholder.com/400x250?text=Course+Image"
                      }
                      alt={course.title}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <CardTitle className="text-lg sm:text-xl mb-2" style={{ color: palette.text }}>
                    {course.title}
                  </CardTitle>
                  <p className="text-xs sm:text-sm line-clamp-2" style={{ color: palette.text2 }}>
                    {course.description}
                  </p>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 text-sm flex-wrap" style={{ color: palette.text2 }}>
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>
                        {course.instructorName || course.instructor?.username || 'Instructor'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{course.duration || 0}h</span>
                    </div>
                    {course.price !== undefined && course.price > 0 && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-semibold" style={{ color: palette.accent }}>${course.price}</span>
                      </div>
                    )}
                    {course.link && (
                      <div className="flex items-center gap-1">
                        <LinkIcon className="w-4 h-4" />
                        <a
                          href={course.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                          style={{ color: palette.accent }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          Course Link
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span style={{ color: palette.text2 }}>Progress</span>
                      <span className="font-medium" style={{ color: palette.accent }}>
                        {course.progress || 0}%
                      </span>
                    </div>
                    <Progress value={course.progress || 0} className="h-2" style={{ background: palette.progressTrack }} />
                  </div>

                  {/* Enroll / Complete Buttons */}
                  <div className="flex gap-2">
                    {course.isEnrolled ? (
                      <Button className="flex-1" disabled variant="outline" style={{ borderColor: palette.border, color: palette.text2 }}>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        You have already enrolled
                      </Button>
                    ) : course.progress === 100 ? (
                      <Button className="flex-1" disabled style={{ background: palette.accent, color: palette.card }}>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Completed
                      </Button>
                    ) : (
                      <Button
                        className="flex-1 shadow-lg"
                        style={{ background: palette.accent, color: palette.card }}
                        onMouseEnter={(e) => e.currentTarget.style.background = palette.accentDeep}
                        onMouseLeave={(e) => e.currentTarget.style.background = palette.accent}
                        disabled={enrolling === course._id}
                        onClick={() => handleEnroll(course._id)}
                      >
                        {enrolling === course._id ? (
                          "Enrolling..."
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            Enroll
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  {/* Category Tag */}
                  <div className="pt-2 border-t" style={{ borderColor: palette.border }}>
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-medium" style={{ background: palette.accentSoft, color: palette.accent }}>
                      {course.category || "General"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        !loading && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 mx-auto mb-4" style={{ color: palette.text2 }} />
            <p style={{ color: palette.text2 }}>
              No courses found matching your search.
            </p>
          </div>
        )
      )}
    </div>
  );
};

export default Courses;
