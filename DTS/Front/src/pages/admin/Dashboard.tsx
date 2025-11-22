import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, BookOpen, FileCheck, TrendingUp, Plus, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { palette } from '@/theme/palette';

interface DashboardStats {
  educatorName: string;
  activeCourses: number;
  enrolledStudents: number;
  pendingAssignments: number;
  avgPerformance: number;
  performanceImprovement: number;
  coursePerformanceData: Array<{ course: string; avg: number }>;
  engagementData: Array<{ week: string; students: number }>;
  admin: {
    _id: string;
    username: string;
    email: string;
    fullName: string;
    department: string;
  };
}

interface Activity {
  student: string;
  action: string;
  item: string;
  time: string;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);

  // ─── Get Admin Token ────────────────────────────────
  const getAdminToken = () => {
    return localStorage.getItem('adminToken');
  };

  // ─── Fetch Dashboard Stats ────────────────────────────────
  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const token = getAdminToken();
      const { data } = await axios.get('http://localhost:5000/api/admin/auth/dashboard/stats', {
        withCredentials: true,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (data.success) {
        setStats(data.stats);
      }
    } catch (err: any) {
      console.error('Fetch Dashboard Stats Error:', err);
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  // ─── Fetch Recent Activity ────────────────────────────────
  const fetchRecentActivity = async () => {
    try {
      setActivityLoading(true);
      const token = getAdminToken();
      const { data } = await axios.get('http://localhost:5000/api/admin/auth/dashboard/activity', {
        withCredentials: true,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (data.success) {
        setActivities(data.activities);
      }
    } catch (err: any) {
      console.error('Fetch Activity Error:', err);
      // Don't show error toast for activity, just log it
    } finally {
      setActivityLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
    fetchRecentActivity();
    
    // Refresh stats every 30 seconds for real-time updates
    const interval = setInterval(() => {
      fetchDashboardStats();
      fetchRecentActivity();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="px-4 sm:px-6 md:px-8 pt-2 sm:pt-4 md:pt-6 pb-6 space-y-6 sm:space-y-8"
      style={{ background: palette.bg }}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2" style={{ color: palette.text }}>
            {stats?.educatorName ? `${stats.educatorName}'s Dashboard` : 'Instructor Dashboard'}
          </h1>
          <p className="text-lg" style={{ color: palette.text2 }}>
            Manage your courses and track student progress
          </p>
        </div>
        <Link to="/admin/courses">
          <Button size="lg" className="shadow-lg" style={{ background: palette.accent, color: palette.card }} onMouseEnter={(e) => e.currentTarget.style.background = palette.accentDeep} onMouseLeave={(e) => e.currentTarget.style.background = palette.accent}>
            <Plus className="w-5 h-5 mr-2" />
            Create Course
          </Button>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="hover:scale-105 transition-transform cursor-pointer shadow-sm hover:shadow-md" style={{ background: palette.card, borderColor: palette.border, borderWidth: '1px' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium" style={{ color: palette.text }}>Total Students</CardTitle>
              <Users className="w-4 h-4" style={{ color: palette.accent }} />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-3xl font-bold" style={{ color: palette.text }}>...</div>
              ) : (
                <>
                  <div className="text-3xl font-bold" style={{ color: palette.text }}>
                    {stats?.enrolledStudents ?? 0}
                  </div>
                  <p className="text-xs mt-1" style={{ color: palette.text2 }}>
                    Students enrolled in your courses
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="hover:scale-105 transition-transform cursor-pointer shadow-sm hover:shadow-md" style={{ background: palette.card, borderColor: palette.border, borderWidth: '1px' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium" style={{ color: palette.text }}>Active Courses</CardTitle>
              <BookOpen className="w-4 h-4" style={{ color: palette.accent }} />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-3xl font-bold" style={{ color: palette.text }}>...</div>
              ) : (
                <>
                  <div className="text-3xl font-bold" style={{ color: palette.text }}>
                    {stats?.activeCourses ?? 0}
                  </div>
                  <p className="text-xs mt-1" style={{ color: palette.text2 }}>
                    Published courses available to students
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className="hover:scale-105 transition-transform cursor-pointer shadow-sm hover:shadow-md" style={{ background: palette.card, borderColor: palette.border, borderWidth: '1px' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium" style={{ color: palette.text }}>Assignments Pending</CardTitle>
              <FileCheck className="w-4 h-4" style={{ color: palette.accent }} />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-3xl font-bold" style={{ color: palette.text }}>...</div>
              ) : (
                <>
                  <div className="text-3xl font-bold" style={{ color: palette.text }}>
                    {stats?.pendingAssignments ?? 0}
                  </div>
                  <p className="text-xs mt-1" style={{ color: palette.text2 }}>Needs grading</p>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Card className="hover:scale-105 transition-transform cursor-pointer shadow-sm hover:shadow-md" style={{ background: palette.card, borderColor: palette.border, borderWidth: '1px' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium" style={{ color: palette.text }}>Avg Performance</CardTitle>
              <TrendingUp className="w-4 h-4" style={{ color: palette.accent }} />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-3xl font-bold" style={{ color: palette.text }}>...</div>
              ) : (
                <>
                  <div className="text-3xl font-bold" style={{ color: palette.text }}>
                    {stats?.avgPerformance ?? 0}%
                  </div>
                  <p className="text-xs mt-1 flex items-center gap-1" style={{ color: palette.text2 }}>
                    <TrendingUp className="w-3 h-3" />
                    +{stats?.performanceImprovement ?? 0}% improvement
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="shadow-sm" style={{ background: palette.card, borderColor: palette.border, borderWidth: '1px' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: palette.text }}>
                <BarChart className="w-5 h-5" style={{ color: palette.accent }} />
                Course Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  Loading chart data...
                </div>
              ) : stats?.coursePerformanceData && stats.coursePerformanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={stats.coursePerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="course" 
                      stroke="hsl(var(--muted-foreground))"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="avg" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  No performance data available yet
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card className="shadow-sm" style={{ background: palette.card, borderColor: palette.border, borderWidth: '1px' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: palette.text }}>
                <TrendingUp className="w-5 h-5" style={{ color: palette.accent }} />
                Student Engagement
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[250px] flex items-center justify-center" style={{ color: palette.text2 }}>
                  Loading chart data...
                </div>
              ) : stats?.engagementData && stats.engagementData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={stats.engagementData}>
                    <CartesianGrid strokeDasharray="3 3" style={{ stroke: palette.chartGrid }} />
                    <XAxis dataKey="week" style={{ stroke: palette.text2 }} tick={{ fill: palette.text2, fontSize: 12 }} />
                    <YAxis style={{ stroke: palette.text2 }} tick={{ fill: palette.text2, fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: palette.card,
                        border: `1px solid ${palette.border}`,
                        borderRadius: '8px',
                        color: palette.text,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="students"
                      style={{ stroke: palette.chartLine }}
                      strokeWidth={3}
                      dot={{ fill: palette.chartLine, r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center" style={{ color: palette.text2 }}>
                  No engagement data available yet
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        <Card className="shadow-sm" style={{ background: palette.card, borderColor: palette.border, borderWidth: '1px' }}>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <CardTitle className="text-base sm:text-lg" style={{ color: palette.text }}>Recent Activity</CardTitle>
              <Link to="/admin/students">
                <Button variant="ghost" size="sm" className="text-xs sm:text-sm" style={{ color: palette.text2 }}>
                  View All <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {activityLoading ? (
              <div className="text-center py-4">
                <p className="text-xs sm:text-sm" style={{ color: palette.text2 }}>Loading activity...</p>
              </div>
            ) : activities.length > 0 ? (
              activities.map((activity, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-xl transition-colors"
                  style={{ background: palette.cardHover, border: `1px solid ${palette.border}` }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = palette.accentSoft}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = palette.cardHover}
                >
                  <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ background: palette.accent }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm" style={{ color: palette.text }}>
                      <span className="font-medium">{activity.student}</span> {activity.action}{' '}
                      <span className="font-medium">{activity.item}</span>
                    </p>
                    <p className="text-xs mt-1" style={{ color: palette.text2 }}>{activity.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-xs sm:text-sm" style={{ color: palette.text2 }}>No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AdminDashboard;
