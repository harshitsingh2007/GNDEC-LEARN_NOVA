import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Brain, Sparkles, Trophy, Target, Zap, Users } from 'lucide-react';
import { palette } from '@/theme/palette';

const Landing = () => {
  const features = [
    {
      icon: Brain,
      title: 'Adaptive Learning',
      description: 'AI adjusts to your pace and learning style',
    },
    {
      icon: Sparkles,
      title: 'AI Quizzes',
      description: 'Smart assessments that target your weak points',
    },
    {
      icon: Trophy,
      title: 'Gamified XP & Streaks',
      description: 'Stay motivated with rewards and achievements',
    },
    {
      icon: Target,
      title: 'AI Course Builder',
      description: 'Educators can create adaptive courses with AI',
    },
  ];

  return (
    <div className="min-h-screen overflow-hidden" style={{ background: palette.bg }}>
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-48 w-96 h-96 rounded-full blur-3xl animate-float" style={{ background: palette.accentSoft, opacity: 0.5 }} />
        <div className="absolute bottom-1/4 -right-48 w-96 h-96 rounded-full blur-3xl animate-float" style={{ background: palette.accentSoft, opacity: 0.3, animationDelay: '2s' }} />
        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0" style={{ background: `linear-gradient(${palette.border}1px,transparent 1px),linear-gradient(90deg,${palette.border}1px,transparent 1px)`, backgroundSize: '64px 64px' }} />
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4">
        <div className="container max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <h1 className="text-6xl md:text-8xl font-bold mb-6 leading-tight" style={{ color: palette.text }}>
              Your Smartest{' '}
              <span style={{ background: `linear-gradient(to right, ${palette.text}, ${palette.text2})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Study Companion
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl max-w-3xl mx-auto mb-12" style={{ color: palette.text2 }}>
              Experience adaptive learning that evolves with you. Master any subject with AI-powered insights, gamification, and personalized study paths.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/login">
                <Button size="lg" className="text-lg px-8 py-6 shadow-lg hover:scale-105 transition-all duration-300 border-0" style={{ background: palette.accent, color: palette.card }} onMouseEnter={(e) => e.currentTarget.style.background = palette.accentDeep} onMouseLeave={(e) => e.currentTarget.style.background = palette.accent}>
                  <Users className="mr-2 w-5 h-5" />
                  Start Learning
                </Button>
              </Link>
              <Link to="/admin/login">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 hover:scale-105 transition-all duration-300" style={{ background: 'transparent', color: palette.text, borderColor: palette.accent }} onMouseEnter={(e) => { e.currentTarget.style.background = palette.accentSoft; e.currentTarget.style.borderColor = palette.accent; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = palette.accent; }}>
                  <Brain className="mr-2 w-5 h-5" />
                  I'm an Educator
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Animated Avatar/Mascot Placeholder */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="mt-16 relative"
          >
            <div className="w-64 h-64 mx-auto rounded-full flex items-center justify-center shadow-lg animate-float" style={{ background: `linear-gradient(to bottom right, ${palette.accentSoft}, ${palette.accentSoft}dd)` }}>
              <Brain className="w-32 h-32" style={{ color: palette.accent }} />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-24 px-4">
        <div className="container max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: palette.text }}>
              Why Choose{' '}
              <span style={{ background: `linear-gradient(to right, ${palette.text}, ${palette.text2})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Nova Learn
              </span>
            </h2>
            <p className="text-xl" style={{ color: palette.text2 }}>
              The smartest and most adaptive learning platform: Nova Learn.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="rounded-3xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl shadow-sm"
                style={{ background: palette.card, borderColor: palette.border, borderWidth: '1px' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = palette.accent; e.currentTarget.style.background = palette.cardHover; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = palette.border; e.currentTarget.style.background = palette.card; }}
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: palette.accentSoft }}>
                  <feature.icon className="w-6 h-6" style={{ color: palette.accent }} />
                </div>
                <h3 className="text-xl font-semibold mb-2" style={{ color: palette.text }}>{feature.title}</h3>
                <p style={{ color: palette.text2 }}>{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 px-4">
        <div className="container max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl p-12 shadow-2xl"
            style={{ background: `linear-gradient(to bottom right, ${palette.accentSoft}80, ${palette.accentSoft}40)`, borderColor: palette.border, borderWidth: '1px' }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: palette.text }}>
              Ready to Transform Your Learning?
            </h2>
            <p className="text-xl mb-8" style={{ color: palette.text2 }}>
              Join thousands of students already learning smarter
            </p>
            <Link to="/student">
              <Button size="lg" className="text-lg px-10 py-6 shadow-lg hover:scale-105 transition-all duration-300 border-0" style={{ background: palette.accent, color: palette.card }} onMouseEnter={(e) => e.currentTarget.style.background = palette.accentDeep} onMouseLeave={(e) => e.currentTarget.style.background = palette.accent}>
                Get Started Free
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Landing;