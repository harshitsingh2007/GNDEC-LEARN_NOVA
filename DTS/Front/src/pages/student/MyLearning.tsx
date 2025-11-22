import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  Clock,
  Search,
  CheckCircle2,
  Play,
  FileText,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import VideoPlayer from "@/components/VideoPlayer";
import { palette } from "@/theme/palette";

const MyLearning = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCourse, setActiveCourse] = useState<any | null>(null);
  const [activeLesson, setActiveLesson] = useState<any | null>(null);
  const [transcript, setTranscript] = useState<string>("");
  const [courseLoading, setCourseLoading] = useState(false);
  const [lessonNotes, setLessonNotes] = useState<{ [key: string]: any }>({});
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);
  const navigate = useNavigate();
    // ─── Fetch Enrolled Courses ───────────────────────────────
  const fetchMyCourses = async () => {
    try {
      setLoading(true);
      console.log("Fetching Enrolled Courses...");

      const { data } = await axios.get(
        "http://localhost:5000/api/courses/my",
        { withCredentials: true }
      );

      console.log("Received:", data);
      setCourses(data);
      
      // Fetch lesson notes for all courses
      const notesMap: { [key: string]: any } = {};
      for (const course of data) {
        if (course.modules) {
          for (const module of course.modules) {
            if (module.lessons) {
              for (const lesson of module.lessons) {
                try {
                  const noteRes = await axios.get(
                    `http://localhost:5000/api/notes/${lesson._id}`,
                    { withCredentials: true }
                  );
                  if (noteRes.data?.note?.note) {
                    notesMap[lesson._id] = noteRes.data.note.note;
                  }
                } catch (err) {
                  // Note doesn't exist, skip
                }
              }
            }
          }
        }
      }
      setLessonNotes(notesMap);
    } catch (err: any) {
      console.error("My Courses Fetch Error:", err);
      setError("Failed to load your courses.");
    } finally {
      setLoading(false);
    }
  };

  const isYouTubeUrl = (url: string) =>
    /youtube\.com|youtu\.be/.test(url || "");

  const fetchTranscript = async (videoUrl: string) => {
    if (!videoUrl) {
      setTranscript("Transcript unavailable for this video.");
      return;
    }

    if (!isYouTubeUrl(videoUrl)) {
      setTranscript("Transcript is currently available only for YouTube lessons.");
      return;
    }

    try {
      setTranscript("Loading transcript...");
      const { data } = await axios.post("http://localhost:5000/trans", {
        videoUrl,
      });
      setTranscript(data.transcript || "Transcript not available.");
    } catch (error) {
      console.error("Transcript fetch error:", error);
      setTranscript("Transcript unavailable for this video.");
    }
  };

  const handleLessonSelect = (lesson: any) => {
    if (!lesson) return;
    setActiveLesson(lesson);
    fetchTranscript(lesson.videoUrl);
  };

  const handleContinue = async (courseId: string) => {
    try {
      setCourseLoading(true);
      setError("");
      const { data } = await axios.post(
        "http://localhost:5000/api/courses/getsingle",
        { courseId },
        { withCredentials: true }
      );

      setActiveCourse(data);
      const firstModule = data.modules?.[0];
      const firstLesson = firstModule?.lessons?.[0];

      if (firstLesson) {
        setActiveLesson(firstLesson);
        fetchTranscript(firstLesson.videoUrl);
      } else {
        setActiveLesson(null);
        setTranscript("This course does not have any lessons yet.");
      }
    } catch (err: any) {
      console.error("Continue course error:", err);
      setError(err.response?.data?.message || "Failed to open course content.");
    } finally {
      setCourseLoading(false);
    }
  };

  useEffect(() => {
    fetchMyCourses();
  }, []);

  // Refresh courses when window gains focus (user comes back to tab)
  useEffect(() => {
    const handleFocus = () => {
      fetchMyCourses();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

    // ─── Filter Search ────────────────────────────────────────
    const filteredCourses = courses.filter((course) =>
        (course?.title || "").toLowerCase().includes((searchQuery || "").toLowerCase())
    );
    return (
        <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8" style={{ background: palette.bg }}>
            {/* Header */}
            <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2" style={{ background: `linear-gradient(to right, ${palette.text}, ${palette.text2})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                    My Learning
                </h1>
                <p className="text-sm sm:text-base md:text-lg" style={{ color: palette.text2 }}>
                    Continue your enrolled courses
                </p>
            </div>

            {/* Search */}
            <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5" style={{ color: palette.text2 }} />
                <Input
                    placeholder="Search enrolled courses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 sm:pl-10 text-sm"
                    style={{ background: palette.card, color: palette.text, borderColor: palette.border }}
                />
            </div>
            
            {/* Loading & Error States */}
            {loading && (
                <p className="text-center" style={{ color: palette.text2 }}>
                    Loading your courses...
                </p>
            )}
            {error && <p className="text-center" style={{ color: "#EF4444" }}>{error}</p>}

            {/* Course Cards */}
            {!loading && filteredCourses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredCourses.map((course, index) => (
                  <motion.div
                    key={course._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <Card className="h-full hover:scale-105 transition-transform cursor-pointer" style={{ background: palette.card, border: `1px solid ${palette.border}` }} onMouseEnter={(e) => e.currentTarget.style.borderColor = palette.accent} onMouseLeave={(e) => e.currentTarget.style.borderColor = palette.border}>
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
                        <CardTitle className="text-lg sm:text-xl mb-2" style={{ color: palette.text }}>{course.title}</CardTitle>
                        <p className="text-xs sm:text-sm line-clamp-2" style={{ color: palette.text2 }}>
                          {course.description}
                        </p>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        {/* Duration + Progress */}
                        <div className="flex items-center gap-4 text-xs sm:text-sm" style={{ color: palette.text2 }}>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>Duration: {course.duration || 0}h</span>
                          </div>
                        </div>

                        {/* Progress */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs sm:text-sm">
                            <span style={{ color: palette.text2 }}>Progress</span>
                            <span className="font-medium" style={{ color: palette.accent }}>
                              {course.progress || 0}%
                            </span>
                          </div>
                          <Progress value={course.progress || 0} className="h-2" style={{ background: palette.progressTrack }} />
                          {course.progress === 100 && (
                            <div className="flex items-center gap-1 text-xs" style={{ color: '#10B981' }}>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Course Completed!</span>
                            </div>
                          )}
                        </div>

                        {/* Lesson Notes Preview */}
                        {course.modules && course.modules.length > 0 && (
                          <div className="space-y-2">
                            <button
                              onClick={() => setExpandedCourseId(expandedCourseId === course._id ? null : course._id)}
                              className="flex items-center justify-between w-full text-xs sm:text-sm font-medium"
                              style={{ color: palette.text }}
                            >
                              <span className="flex items-center gap-2">
                                <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                                Lesson Notes
                              </span>
                              {expandedCourseId === course._id ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                            {expandedCourseId === course._id && (
                              <div className="space-y-2 pl-4 border-l-2" style={{ borderColor: palette.border }}>
                                {course.modules.map((mod: any) =>
                                  mod.lessons?.map((lesson: any) => {
                                    const note = lessonNotes[lesson._id];
                                    if (!note) return null;
                                    return (
                                      <div
                                        key={lesson._id}
                                        className="p-2 rounded text-xs"
                                        style={{ background: palette.cardHover }}
                                      >
                                        <div className="font-medium mb-1" style={{ color: palette.text }}>
                                          {lesson.title}
                                        </div>
                                        <div className="line-clamp-2" style={{ color: palette.text2 }}>
                                          {note.substring(0, 100)}...
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                                {Object.keys(lessonNotes).filter(id => 
                                  course.modules.some((mod: any) => 
                                    mod.lessons?.some((l: any) => l._id === id)
                                  )
                                ).length === 0 && (
                                  <p className="text-xs" style={{ color: palette.text2 }}>
                                    No notes yet for this course
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Buttons */}
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            className="flex-1"
                            style={{ background: palette.accentDeep, color: palette.card }}
                            onMouseEnter={(e) => e.currentTarget.style.background = palette.accent}
                            onMouseLeave={(e) => e.currentTarget.style.background = palette.accentDeep}
                            onClick={() => handleContinue(course._id)}
                            disabled={courseLoading && activeCourse?._id === course._id}
                          >
                            <Play className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                            {courseLoading && activeCourse?._id === course._id
                              ? "Loading..."
                              : "Continue"}
                          </Button>
                          <Button
                            className="flex-1"
                            variant="outline"
                            style={{ borderColor: palette.border, color: palette.text }}
                            onClick={() => navigate("/student/ground", { state: course._id })}
                          >
                            Open Workspace
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              !loading && (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4" style={{ color: palette.text2 }} />
                  <p style={{ color: palette.text2 }}>
                    You haven't enrolled in any courses yet.
                  </p>
                </div>
              )
            )}

            {(courseLoading || activeCourse) && (
              <div className="space-y-4 sm:space-y-6 pt-4 sm:pt-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold" style={{ color: palette.text }}>Course Player</h2>
                    {activeCourse && (
                      <p style={{ color: palette.text2 }}>{activeCourse.title}</p>
                    )}
                  </div>
                  {activeCourse && (
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto"
                      style={{ borderColor: palette.border, color: palette.text }}
                      onClick={() => navigate("/student/ground", { state: activeCourse._id })}
                    >
                      Open Full Course Workspace
                    </Button>
                  )}
                </div>

                {courseLoading && !activeCourse && (
                  <div className="text-center py-8" style={{ color: palette.text2 }}>
                    Loading course content...
                  </div>
                )}

                {activeCourse && (
                  <div className="grid gap-4 sm:gap-6 lg:grid-cols-[2fr_1fr]">
                    <div className="space-y-4 sm:space-y-6">
                      <Card className="shadow-lg" style={{ background: palette.card, border: `1px solid ${palette.border}` }}>
                        <CardContent className="space-y-4 p-4">
                          {activeLesson ? (
                            <>
                              <div className="rounded-xl overflow-hidden">
                                <VideoPlayer
                                  url={activeLesson.videoUrl}
                                  title={activeLesson.title}
                                />
                              </div>
                              <div>
                                <h3 className="text-base sm:text-lg font-semibold" style={{ color: palette.text }}>
                                  {activeLesson.title}
                                </h3>
                                <p className="text-xs sm:text-sm" style={{ color: palette.text2 }}>
                                  Duration: {activeLesson.duration || 0} minutes
                                </p>
                              </div>
                            </>
                          ) : (
                            <div className="h-[320px] flex items-center justify-center" style={{ color: palette.text2 }}>
                              Select a lesson to begin watching.
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {activeLesson && (
                        <Card style={{ background: palette.card, border: `1px solid ${palette.border}` }}>
                          <CardHeader>
                            <CardTitle className="text-base sm:text-lg font-semibold" style={{ color: palette.accent }}>
                              Transcript
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-xs sm:text-sm leading-relaxed max-h-[260px] overflow-y-auto whitespace-pre-line" style={{ color: palette.text2 }}>
                              {transcript || "Transcript unavailable for this video."}
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </div>

                    <Card style={{ background: palette.card, border: `1px solid ${palette.border}` }}>
                      <CardHeader>
                        <CardTitle className="text-base sm:text-lg font-semibold" style={{ color: palette.text }}>
                          Course Lessons
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {activeCourse.modules?.length ? (
                          activeCourse.modules.map((mod: any, modIndex: number) => (
                            <div key={modIndex} className="space-y-2">
                              <h4 className="text-xs sm:text-sm font-semibold" style={{ color: palette.accent }}>
                                {mod.title || `Module ${modIndex + 1}`}
                              </h4>
                              <div className="space-y-2">
                                {mod.lessons?.length ? (
                                  mod.lessons.map((lesson: any) => {
                                    const isActive = activeLesson?._id === lesson._id;
                                    return (
                                      <Button
                                        key={lesson._id || `${modIndex}-${lesson.title}`}
                                        variant={isActive ? "default" : "outline"}
                                        className="w-full justify-between text-xs sm:text-sm"
                                        style={
                                          isActive
                                            ? { background: palette.accentDeep, color: palette.card }
                                            : { borderColor: palette.border, color: palette.text }
                                        }
                                        onMouseEnter={(e) => {
                                          if (!isActive) e.currentTarget.style.background = palette.cardHover;
                                        }}
                                        onMouseLeave={(e) => {
                                          if (!isActive) e.currentTarget.style.background = 'transparent';
                                        }}
                                        onClick={() => handleLessonSelect(lesson)}
                                      >
                                        <span className="flex items-center gap-2">
                                          {isActive ? (
                                            <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" />
                                          ) : (
                                            <Play className="w-3 h-3 sm:w-4 sm:h-4" />
                                          )}
                                          {lesson.title}
                                        </span>
                                        <span className="text-xs" style={{ color: palette.text2 }}>
                                          {lesson.duration || 0} min
                                        </span>
                                      </Button>
                                    );
                                  })
                                ) : (
                                  <p className="text-xs" style={{ color: palette.text2 }}>
                                    No lessons available in this module yet.
                                  </p>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs sm:text-sm" style={{ color: palette.text2 }}>
                            This course does not contain any modules yet.
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            )}
        </div>
    );
};

export default MyLearning;
