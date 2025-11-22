import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {palette} from '../../theme/palette'
import {
  BookOpen,
  Clock,
  Play,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import VideoPlayer from '@/components/VideoPlayer';
import LessonNotes from '@/components/LessonNotes';

const StudyGround = () => {
  const { state: courseId } = useLocation();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<any>(null);
  const [expandedModule, setExpandedModule] = useState<number | null>(0);
  const [transcript, setTranscript] = useState<string>('');
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [videoWatchTime, setVideoWatchTime] = useState<{ [key: string]: number }>({});

  // ─── Track Course Access ────────────────────────────────
  const trackAccess = async () => {
    if (!courseId) return;
    try {
      await axios.post(
        `http://localhost:5000/api/courses/${courseId}/access`,
        {},
        { withCredentials: true }
      );
    } catch (err) {
      console.error('Track access error:', err);
    }
  };

  // ─── Fetch Course ────────────────────────────────
  const fetchCourse = async () => {
    try {
      setLoading(true);
      const { data } = await axios.post(
        'http://localhost:5000/api/courses/getsingle',
        { courseId },
        { withCredentials: true }
      );
      setCourse(data);

      // Track course access
      await trackAccess();

      // Get completed lessons from course data
      if (data.completedLessons) {
        const completed = new Set(
          data.completedLessons.map((l: any) => l.lessonId?.toString())
        );
        setCompletedLessons(completed);
      }

      const firstLesson = data.modules[0]?.lessons[0];
      if (firstLesson) {
        setActiveVideo(firstLesson);
        fetchTranscript(firstLesson.videoUrl);
      }
    } catch (err) {
      console.error('❌ Fetch Course Error:', err);
      toast.error('Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  // ─── Fetch Transcript ────────────────────────────────
  const isYouTubeUrl = (url: string) =>
    /youtube\.com|youtu\.be/.test(url || '');

  const fetchTranscript = async (videoUrl: string) => {
    try {
      if (!videoUrl) {
        setTranscript('Transcript unavailable for this video.');
        return;
      }

      if (!isYouTubeUrl(videoUrl)) {
        setTranscript('Transcript is currently available only for YouTube lessons.');
        return;
      }

      setTranscript('Loading transcript...');
      const { data } = await axios.post('http://localhost:5000/trans', {
        videoUrl,
      });
      setTranscript(data.transcript || 'Transcript not available.');
    } catch (err) {
      console.error('⚠️ Transcript Fetch Error:', err);
      setTranscript('Transcript unavailable for this video.');
    }
  };

  useEffect(() => {
    if (courseId) {
      fetchCourse();
    } else {
      toast.error('No course selected');
      navigate('/student/learning');
    }
  }, [courseId]);

  // ─── Handle Lesson Select ────────────────────────────────
  const handleLessonSelect = (lesson: any) => {
    if (!lesson) return;
    if (activeVideo?.videoUrl === lesson.videoUrl) return;
    setActiveVideo(lesson);
  };


  // ─── Mark Lesson as Completed ────────────────────────────────
  const markLessonComplete = async (lesson: any) => {
    if (!courseId || !lesson) return;

    try {
      const { data } = await axios.post(
        `http://localhost:5000/api/courses/${courseId}/complete-lesson`,
        {
          lessonId: lesson._id,
          videoUrl: lesson.videoUrl,
        },
        { withCredentials: true }
      );

      if (data.success) {
        // Update completed lessons
        if (lesson._id) {
          setCompletedLessons(new Set([...completedLessons, lesson._id.toString()]));
        }

        // Update course progress
        if (course) {
          setCourse({
            ...course,
            userProgress: {
              ...course.userProgress,
              progress: data.progress,
              completed: data.completed,
            },
          });
        }

        if (data.xpGained > 0) {
          toast.success(`Lesson completed! +${data.xpGained} XP`);
        }
      }
    } catch (err: any) {
      console.error('Complete lesson error:', err);
      toast.error(err.response?.data?.message || 'Failed to mark lesson as complete');
    }
  };

  // ─── Handle Video End ────────────────────────────────
  const handleVideoEnd = () => {
    if (activeVideo && !completedLessons.has(activeVideo._id?.toString() || '')) {
      // Auto-mark as completed when video ends (if watched for reasonable time)
      const views = videoWatchTime[activeVideo.videoUrl] || 0;
      if (views >= 1) {
        markLessonComplete(activeVideo);
      }
    }
  };

  // ─── Handle Next Lesson ────────────────────────────────
  const handleNextLesson = () => {
    if (!course) return;
    let foundNext = false;
    for (let i = 0; i < course.modules.length; i++) {
      const lessons = course.modules[i].lessons;
      for (let j = 0; j < lessons.length; j++) {
        if (lessons[j].videoUrl === activeVideo.videoUrl) {
          if (lessons[j + 1]) {
            handleLessonSelect(lessons[j + 1]);
          } else if (course.modules[i + 1]) {
            const nextMod = course.modules[i + 1];
            if (nextMod.lessons[0]) {
              handleLessonSelect(nextMod.lessons[0]);
            }
          }
          foundNext = true;
          break;
        }
      }
      if (foundNext) break;
    }
  };

  // ─── Get Lesson Status ────────────────────────────────
  const isLessonCompleted = (lesson: any) => {
    if (!lesson._id) return false;
    return completedLessons.has(lesson._id.toString());
  };

  // ─── Format Video URL for iframe ────────────────────────────────
  useEffect(() => {
    if (!activeVideo?.videoUrl) return;

    fetchTranscript(activeVideo.videoUrl);

    setVideoWatchTime((prev) => {
      const previousViews = prev[activeVideo.videoUrl] || 0;
      return {
        ...prev,
        [activeVideo.videoUrl]: previousViews + 1,
      };
    });
  }, [activeVideo?.videoUrl]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-[80vh] text-muted-foreground">
        Loading course...
      </div>
    );

  if (!course)
    return (
      <div className="flex justify-center items-center h-[80vh] text-destructive">
        Course not found.
      </div>
    );

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-10" style={{ background: palette.bg, color: palette.text }}>
      {/* ─── Top Section ───────────────────────────── */}
      <div className="flex flex-col gap-3 mb-6 pb-4" style={{ borderBottom: `1px solid ${palette.border}` }}>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/student/learning')}
            style={{ color: palette.text }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Courses
          </Button>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: palette.text }}>{course.title}</h1>
        <p style={{ color: palette.text2 }}>{course.description}</p>

        <div className="flex flex-wrap gap-4 text-sm" style={{ color: palette.text2 }}>
          <span className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" style={{ color: palette.text }} /> {course.category}
          </span>
          <span className="flex items-center gap-2">
            <Clock className="w-4 h-4" style={{ color: palette.text }} /> {course.duration} hrs
          </span>
          <span className="font-medium" style={{ color: palette.text }}>{course.level}</span>
        </div>

        <div className="mt-3">
          <Progress value={course.userProgress?.progress || 0} className="h-2" style={{ background: palette.progressTrack }} />
          <div className="flex justify-between text-xs mt-1" style={{ color: palette.text2 }}>
            <span>Your Progress</span>
            <span className="font-medium" style={{ color: palette.text }}>
              {course.userProgress?.progress || 0}%
            </span>
          </div>
        </div>
      </div>

      {/* ─── Course Layout: Video + Sidebar ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
        {/* Video + Transcript Section */}
        <div className="space-y-6">
          {/* Video Player */}
          <Card className="shadow-lg" style={{ background: palette.card, border: `1px solid ${palette.border}` }}>
            <CardContent className="p-0">
              {activeVideo ? (
                <div className="space-y-4">
                  <div className="rounded-xl overflow-hidden">
                    <VideoPlayer
                      url={activeVideo.videoUrl}
                      title={activeVideo.title}
                      onEnded={handleVideoEnd}
                    />
                  </div>
                  
                  <div className="px-4 pb-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base sm:text-lg font-semibold" style={{ color: palette.text }}>{activeVideo.title}</h3>
                      {isLessonCompleted(activeVideo) && (
                        <span className="px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2" style={{ background: '#10B9811A', color: '#10B981' }}>
                          <CheckCircle2 className="w-4 h-4" />
                          Completed
                        </span>
                      )}
                    </div>
                    <p className="text-sm mt-2" style={{ color: palette.text2 }}>
                      Duration: {activeVideo.duration || 0} minutes
                    </p>
                    {!isLessonCompleted(activeVideo) && (
                      <Button
                        onClick={() => markLessonComplete(activeVideo)}
                        className="mt-4 shadow-lg"
                        style={{ background: palette.accentDeep, color: palette.card }}
                        onMouseEnter={(e) => e.currentTarget.style.background = palette.accent}
                        onMouseLeave={(e) => e.currentTarget.style.background = palette.accentDeep}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Mark as Completed
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-[450px] flex justify-center items-center" style={{ color: palette.text2 }}>
                  Select a lesson to begin
                </div>
              )}
            </CardContent>
          </Card>

          {/* Transcript Section */}
          {activeVideo && (
            <>
              <Card className="shadow-sm" style={{ background: palette.card, border: `1px solid ${palette.border}` }}>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg font-semibold" style={{ color: palette.text }}>
                    Transcript
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm leading-relaxed max-h-[300px] overflow-y-auto whitespace-pre-line scrollbar-thin" style={{ color: palette.text2 }}>
                    {transcript}
                  </div>
                </CardContent>
              </Card>
              <LessonNotes 
                lessonId={activeVideo?._id} 
                courseId={course?._id} 
                moduleId={course?.modules?.find((mod: any) => 
                  mod.lessons?.some((l: any) => l._id?.toString() === activeVideo?._id?.toString())
                )?._id} 
              />
            </>
          )}
        </div>

        {/* ─── Sidebar (Scrollable Modules List) ───────────────────────────── */}
        <div className="lg:h-[calc(100vh-180px)] overflow-y-auto pr-2 space-y-4 scrollbar-thin" style={{ scrollbarColor: `${palette.border} ${palette.bg}` }}>
          {course.modules?.map((mod: any, modIndex: number) => (
            <motion.div
              key={modIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: modIndex * 0.05 }}
            >
              <Card className="transition-all duration-200 shadow-sm" style={{ background: palette.card, border: `1px solid ${palette.border}` }} onMouseEnter={(e) => e.currentTarget.style.borderColor = palette.accent} onMouseLeave={(e) => e.currentTarget.style.borderColor = palette.border}>
                <CardHeader
                  className="cursor-pointer flex flex-row justify-between items-center p-4"
                  onClick={() =>
                    setExpandedModule(
                      expandedModule === modIndex ? null : modIndex
                    )
                  }
                >
                  <CardTitle className="text-base font-semibold flex items-center gap-2" style={{ color: palette.text }}>
                    {expandedModule === modIndex ? (
                      <ChevronDown className="w-4 h-4" style={{ color: palette.text }} />
                    ) : (
                      <ChevronRight className="w-4 h-4" style={{ color: palette.text2 }} />
                    )}
                    {mod.title}
                  </CardTitle>
                </CardHeader>

                {expandedModule === modIndex && (
                  <CardContent className="space-y-2 pt-2">
                    {mod.lessons?.map((lesson: any, index: number) => {
                      const isCompleted = isLessonCompleted(lesson);
                      const isActive = activeVideo?.videoUrl === lesson.videoUrl;
                      
                      return (
                        <Button
                          key={index}
                          variant={isActive ? 'default' : 'outline'}
                          className={`w-full justify-between text-left text-sm ${isCompleted ? '' : ''}`}
                          style={
                            isActive
                              ? { background: palette.accentDeep, color: palette.card, border: isCompleted ? `2px solid #10B981` : 'none' }
                              : { background: palette.card, color: palette.text, border: `1px solid ${isCompleted ? '#10B981' : palette.border}` }
                          }
                          onMouseEnter={(e) => {
                            if (!isActive) {
                              e.currentTarget.style.background = palette.cardHover;
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isActive) {
                              e.currentTarget.style.background = palette.card;
                            }
                          }}
                          onClick={() => handleLessonSelect(lesson)}
                        >
                          <div className="flex items-center gap-2 truncate">
                            {isCompleted ? (
                              <CheckCircle2 className="w-4 h-4" style={{ color: '#10B981' }} />
                            ) : (
                              <Play className="w-4 h-4" style={{ color: palette.text }} />
                            )}
                            <span className="truncate">{lesson.title}</span>
                          </div>
                          <span className="text-xs" style={{ color: palette.text2 }}>
                            {lesson.duration || 0} mins
                          </span>
                        </Button>
                      );
                    })}
                  </CardContent>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ─── Navigation Buttons ───────────────────────────── */}
      {activeVideo && (
        <div className="flex justify-end gap-4 mt-6">
          <Button variant="outline" onClick={handleNextLesson} style={{ borderColor: palette.border, color: palette.text }}>
            Next Lesson
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}

      {/* ─── Completion Banner ───────────────────────────── */}
      {course.userProgress?.completed && (
        <div className="text-center mt-8 sm:mt-10 p-4 sm:p-6 rounded-xl" style={{ background: '#10B9811A', border: `1px solid #10B981` }}>
          <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2" style={{ color: '#10B981' }} />
          <p className="font-semibold text-base sm:text-lg" style={{ color: '#10B981' }}>
            Congratulations! You've completed this course!
          </p>
        </div>
      )}
    </div>
  );
};

export default StudyGround;
