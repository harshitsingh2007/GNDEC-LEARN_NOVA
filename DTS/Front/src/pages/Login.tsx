import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, BookOpen, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { palette } from '@/theme/palette';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(
        'http://localhost:5000/api/auth/login',
        { email, password },
        { withCredentials: true }
      );
      
      // Store user info in localStorage
      localStorage.setItem('userInfo', JSON.stringify(response.data));
      navigate('/student');
      console.log('Login success:', response.data);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen overflow-hidden relative flex items-center justify-center p-4" style={{ background: palette.bg }}>
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-48 w-96 h-96 rounded-full blur-3xl animate-float" style={{ background: palette.accentSoft, opacity: 0.5 }} />
        <div className="absolute bottom-1/4 -right-48 w-96 h-96 rounded-full blur-3xl animate-float" style={{ background: palette.accentSoft, opacity: 0.3, animationDelay: '2s' }} />
        <div className="absolute inset-0" style={{ background: `linear-gradient(${palette.border}1px,transparent 1px),linear-gradient(90deg,${palette.border}1px,transparent 1px)`, backgroundSize: '64px 64px' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Back Button */}
        <Link to="/" className="absolute -top-16 left-0 flex items-center gap-2 transition-colors" style={{ color: palette.text2 }} onMouseEnter={(e) => e.currentTarget.style.color = palette.text} onMouseLeave={(e) => e.currentTarget.style.color = palette.text2}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Home</span>
        </Link>

        <Card className="shadow-2xl" style={{ background: palette.card, borderColor: palette.border, borderWidth: '1px' }}>
          <CardHeader className="text-center space-y-4 pb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ background: palette.accentSoft }}
            >
              <BookOpen className="w-8 h-8" style={{ color: palette.accent }} />
            </motion.div>
            <div>
              <CardTitle className="text-3xl font-bold mb-2" style={{ color: palette.text }}>
                Welcome Back
              </CardTitle>
              <CardDescription className="text-base" style={{ color: palette.text2 }}>
                Sign in to continue your learning journey
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4" style={{ color: palette.text2 }} />
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="pl-10 h-12"
                    style={{ 
                      color: palette.text, 
                      borderColor: palette.border, 
                      backgroundColor: palette.card,
                      '--tw-ring-color': palette.accent + '33'
                    } as React.CSSProperties & { '--tw-ring-color': string }}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4" style={{ color: palette.text2 }} />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="pl-10 pr-10 h-12"
                    style={{ 
                      color: palette.text, 
                      borderColor: palette.border, 
                      backgroundColor: palette.card,
                      '--tw-ring-color': palette.accent + '33'
                    } as React.CSSProperties & { '--tw-ring-color': string }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 transition-colors"
                    style={{ color: palette.text2 }}
                    onMouseEnter={(e) => e.currentTarget.style.color = palette.text}
                    onMouseLeave={(e) => e.currentTarget.style.color = palette.text2}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="text-right">
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium transition-colors"
                  style={{ color: palette.text2 }}
                  onMouseEnter={(e) => e.currentTarget.style.color = palette.text}
                  onMouseLeave={(e) => e.currentTarget.style.color = palette.text2}
                >
                  Forgot your password?
                </Link>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </motion.div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 font-semibold text-base shadow-lg transition-all duration-200 disabled:opacity-50"
                style={{ 
                  background: palette.accent, 
                  color: palette.card,
                  boxShadow: `0 10px 15px -3px ${palette.accent}33, 0 4px 6px -2px ${palette.accent}33`
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = palette.accentDeep}
                onMouseLeave={(e) => e.currentTarget.style.background = palette.accent}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Sign In
                  </div>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" style={{ borderColor: palette.border }} />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2" style={{ background: palette.card, color: palette.text2 }}>New to Nova Learn?</span>
              </div>
            </div>

            {/* Sign Up Link */}
            <div className="text-center">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 font-medium text-sm transition-colors rounded-lg px-4 py-2"
                style={{ 
                  color: palette.text2, 
                  borderColor: palette.border, 
                  backgroundColor: palette.card,
                  borderWidth: '1px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = palette.text;
                  e.currentTarget.style.borderColor = palette.accent;
                  e.currentTarget.style.backgroundColor = palette.cardHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = palette.text2;
                  e.currentTarget.style.borderColor = palette.border;
                  e.currentTarget.style.backgroundColor = palette.card;
                }}
              >
                Create new account
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Login;