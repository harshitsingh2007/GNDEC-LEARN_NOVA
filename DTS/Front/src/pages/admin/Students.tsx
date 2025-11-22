import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Search, Filter, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { palette } from '@/theme/palette';

interface Student {
  _id: string;
  name: string;
  email: string;
  progress: number;
  xp: number;
  level: number;
  streakDays: number;
  totalStudyTime: number;
  masteryScore: number;
  focusScore: number;
  accuracyScore: number;
  enrolledCoursesCount: number;
  avatarUrl?: string;
  trend: 'up' | 'down';
  lastActive: string;
}

const Students = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // ─── Get Admin Token ────────────────────────────────
  const getAdminToken = () => {
    return localStorage.getItem('adminToken');
  };

  // ─── Fetch Students ────────────────────────────────
  const fetchStudents = async () => {
    try {
      setLoading(true);
      const token = getAdminToken();
      const { data } = await axios.get('http://localhost:5000/api/admin/auth/students', {
        withCredentials: true,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (data.success) {
        setStudents(data.students);
      }
    } catch (err: any) {
      console.error('Fetch Students Error:', err);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format study time
  const formatStudyTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8" style={{ background: palette.bg }}>
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2" style={{ background: `linear-gradient(to right, ${palette.text}, ${palette.text2})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Students</h1>
        <p className="text-sm sm:text-base md:text-lg" style={{ color: palette.text2 }}>
          Monitor and manage student progress ({students.length} enrolled)
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5" style={{ color: palette.text2 }} />
          <Input
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 sm:pl-10 text-sm"
            style={{ background: palette.card, color: palette.text, borderColor: palette.border }}
          />
        </div>
        <Button variant="outline" className="gap-2 w-full sm:w-auto" style={{ borderColor: palette.border, color: palette.text }}>
          <Filter className="w-4 h-4" />
          Filters
        </Button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <p style={{ color: palette.text2 }}>Loading students...</p>
        </div>
      )}

      {/* Students Grid */}
      {!loading && filteredStudents.length > 0 ? (
        <div className="grid gap-4">
          {filteredStudents.map((student, index) => (
            <motion.div
              key={student._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="transition-all cursor-pointer" style={{ background: palette.card, border: `1px solid ${palette.border}` }} onMouseEnter={(e) => e.currentTarget.style.borderColor = palette.accent} onMouseLeave={(e) => e.currentTarget.style.borderColor = palette.border}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                    {/* Avatar and Basic Info */}
                    <Avatar className="w-12 h-12 sm:w-16 sm:h-16 border-2 flex-shrink-0" style={{ borderColor: palette.accent }}>
                      {student.avatarUrl ? (
                        <img src={student.avatarUrl} alt={student.name} />
                      ) : (
                        <AvatarFallback className="text-base sm:text-lg" style={{ background: palette.accent, color: palette.card }}>
                          {student.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>

                    <div className="flex-1 space-y-3 sm:space-y-4 min-w-0">
                      <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg sm:text-xl font-semibold flex items-center gap-2" style={{ color: palette.text }}>
                            <span className="truncate">{student.name}</span>
                            {student.trend === 'up' ? (
                              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" style={{ color: '#10B981' }} />
                            ) : (
                              <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" style={{ color: '#EF4444' }} />
                            )}
                          </h3>
                          <p className="text-xs sm:text-sm truncate" style={{ color: palette.text2 }}>{student.email}</p>
                          <p className="text-xs mt-1" style={{ color: palette.text2 }}>
                            Level {student.level} • {student.streakDays} day streak • {formatStudyTime(student.totalStudyTime)} studied
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-xl sm:text-2xl font-bold" style={{ color: palette.accent }}>{student.xp}</div>
                          <p className="text-xs" style={{ color: palette.text2 }}>Total XP</p>
                        </div>
                      </div>

                      {/* Progress */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span style={{ color: palette.text2 }}>Overall Progress</span>
                          <span className="font-medium" style={{ color: palette.accent }}>{student.progress}%</span>
                        </div>
                        <Progress value={student.progress} className="h-2" style={{ background: palette.progressTrack }} />
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
                        <div>
                          <p style={{ color: palette.text2 }}>Courses</p>
                          <p className="font-semibold text-base sm:text-lg" style={{ color: palette.text }}>{student.enrolledCoursesCount}</p>
                        </div>
                        <div>
                          <p style={{ color: palette.text2 }}>Mastery</p>
                          <p className="font-semibold text-base sm:text-lg" style={{ color: palette.text }}>{student.masteryScore}%</p>
                        </div>
                        <div>
                          <p style={{ color: palette.text2 }}>Focus</p>
                          <p className="font-semibold text-base sm:text-lg" style={{ color: palette.text }}>{student.focusScore}%</p>
                        </div>
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
          <p style={{ color: palette.text2 }}>
            {searchQuery ? 'No students found matching your search.' : 'No students enrolled yet.'}
          </p>
        </div>
      ) : null}
    </div>
  );
};

export default Students;