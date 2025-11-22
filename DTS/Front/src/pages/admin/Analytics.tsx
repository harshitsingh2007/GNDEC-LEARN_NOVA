import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Users, BookOpen, Target, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { palette } from '@/theme/palette';

const Analytics = () => {
  const completionData = [
    { course: 'ML', rate: 68 },
    { course: 'Web Dev', rate: 75 },
    { course: 'DSA', rate: 82 },
    { course: 'Mobile', rate: 61 },
  ];

  const weakTopicsData = [
    { topic: 'Neural Networks', students: 23 },
    { topic: 'Dynamic Programming', students: 18 },
    { topic: 'Graph Theory', students: 15 },
    { topic: 'Recursion', students: 12 },
  ];

  const engagementData = [
    { month: 'Aug', active: 120, total: 150 },
    { month: 'Sep', active: 145, total: 180 },
    { month: 'Oct', active: 168, total: 200 },
    { month: 'Nov', active: 185, total: 210 },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8" style={{ background: palette.bg }}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2" style={{ background: `linear-gradient(to right, ${palette.text}, ${palette.text2})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Analytics & Insights</h1>
          <p className="text-sm sm:text-base md:text-lg" style={{ color: palette.text2 }}>Deep dive into your teaching performance</p>
        </div>
        <Button variant="outline" className="w-full sm:w-auto" style={{ borderColor: palette.border, color: palette.text }}>
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
          <Card style={{ background: palette.cardHover, border: `1px solid ${palette.border}` }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs sm:text-sm flex items-center gap-2" style={{ color: palette.text }}>
                <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                Active Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold" style={{ color: palette.accent }}>185</div>
              <p className="text-xs mt-1" style={{ color: palette.text2 }}>88% engagement rate</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card style={{ background: palette.cardHover, border: `1px solid ${palette.border}` }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs sm:text-sm flex items-center gap-2" style={{ color: palette.text }}>
                <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
                Course Completion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold" style={{ color: palette.accent }}>71%</div>
              <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#10B981' }}>
                <TrendingUp className="w-3 h-3" />
                +5% this month
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card style={{ background: palette.cardHover, border: `1px solid ${palette.border}` }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs sm:text-sm flex items-center gap-2" style={{ color: palette.text }}>
                <Target className="w-3 h-3 sm:w-4 sm:h-4" />
                Avg Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold" style={{ color: '#10B981' }}>79%</div>
              <p className="text-xs mt-1" style={{ color: palette.text2 }}>Above target</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card style={{ background: palette.cardHover, border: `1px solid ${palette.border}` }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs sm:text-sm flex items-center gap-2" style={{ color: palette.text }}>
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                Satisfaction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold" style={{ color: '#F59E0B' }}>4.7/5</div>
              <p className="text-xs mt-1" style={{ color: palette.text2 }}>Student rating</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card style={{ background: palette.card, border: `1px solid ${palette.border}` }}>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg" style={{ color: palette.text }}>Course Completion Rates</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={completionData}>
                  <CartesianGrid strokeDasharray="3 3" style={{ stroke: palette.chartGrid }} />
                  <XAxis dataKey="course" style={{ stroke: palette.text2 }} tick={{ fill: palette.text2, fontSize: 12 }} />
                  <YAxis style={{ stroke: palette.text2 }} tick={{ fill: palette.text2, fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: palette.card,
                      border: `1px solid ${palette.border}`,
                      borderRadius: '8px',
                      color: palette.text,
                    }}
                  />
                  <Bar dataKey="rate" style={{ fill: palette.chartLine }} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card style={{ background: palette.card, border: `1px solid ${palette.border}` }}>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg" style={{ color: palette.text }}>Common Weak Topics</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={weakTopicsData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" style={{ stroke: palette.chartGrid }} />
                  <XAxis type="number" style={{ stroke: palette.text2 }} tick={{ fill: palette.text2, fontSize: 12 }} />
                  <YAxis dataKey="topic" type="category" style={{ stroke: palette.text2 }} width={120} tick={{ fill: palette.text2, fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: palette.card,
                      border: `1px solid ${palette.border}`,
                      borderRadius: '8px',
                      color: palette.text,
                    }}
                  />
                  <Bar dataKey="students" style={{ fill: '#F59E0B' }} radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Engagement Trend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Card style={{ background: palette.card, border: `1px solid ${palette.border}` }}>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg" style={{ color: palette.text }}>Student Engagement Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={engagementData}>
                <CartesianGrid strokeDasharray="3 3" style={{ stroke: palette.chartGrid }} />
                <XAxis dataKey="month" style={{ stroke: palette.text2 }} tick={{ fill: palette.text2, fontSize: 12 }} />
                <YAxis style={{ stroke: palette.text2 }} tick={{ fill: palette.text2, fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: palette.card,
                    border: `1px solid ${palette.border}`,
                    borderRadius: '8px',
                    color: palette.text,
                  }}
                />
                <Legend wrapperStyle={{ color: palette.text }} />
                <Line
                  type="monotone"
                  dataKey="active"
                  style={{ stroke: '#10B981' }}
                  strokeWidth={3}
                  dot={{ fill: '#10B981', r: 5 }}
                  name="Active Students"
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  style={{ stroke: palette.chartLine }}
                  strokeWidth={3}
                  dot={{ fill: palette.chartLine, r: 5 }}
                  name="Total Enrolled"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Analytics;
