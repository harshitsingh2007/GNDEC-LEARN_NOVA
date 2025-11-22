import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Eye, EyeOff, User, Mail, Lock, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { palette } from '@/theme/palette';

const Signup = () => {
  const [username, setUsername] = useState('');
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
        'http://localhost:5000/api/auth/register',
        { username, email, password },
        { withCredentials: true }
      );

      if (response.data) {
        localStorage.setItem('userInfo', JSON.stringify(response.data));
        navigate('/student');
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      // Extract error message from response
      const errorMessage = err.response?.data?.message || 
                          err.message || 
                          'Failed to create account. Please try again.';
      setError(errorMessage);
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
                Nova Learn
              </CardTitle>
              <CardDescription className="text-base" style={{ color: palette.text2 }}>
                Join thousands of learners worldwide
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Field */}
              <div className="space-y-2">
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4" style={{ color: palette.text2 }} />
                  <Input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
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

              {/* Email Field */}
              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4" style={{ color: palette.text2 }} />
                  <Input
                    type="email"
                    placeholder="Email address"
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
                    placeholder="Password (min 6 characters)"
                    minLength={6}
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

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg"
                >
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
                    Creating account...
                  </div>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" style={{ borderColor: palette.border }} />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2" style={{ background: palette.card, color: palette.text2 }}>Already have an account?</span>
              </div>
            </div>

            {/* Login Link */}
            <div className="text-center">
              <Link
                to="/login"
                className="font-medium text-sm transition-colors inline-flex items-center gap-1"
                style={{ color: palette.text2 }}
                onMouseEnter={(e) => e.currentTarget.style.color = palette.text}
                onMouseLeave={(e) => e.currentTarget.style.color = palette.text2}
              >
                Sign in to your account
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Features List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-center"
        >
          <div className="rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow" style={{ background: palette.card, borderColor: palette.border, borderWidth: '1px' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2" style={{ background: palette.accentSoft }}>
              <svg className="w-4 h-4" style={{ color: palette.accent }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="text-sm font-medium" style={{ color: palette.text }}>Interactive Learning</p>
          </div>
          <div className="rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow" style={{ background: palette.card, borderColor: palette.border, borderWidth: '1px' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2" style={{ background: palette.accentSoft }}>
              <svg className="w-4 h-4" style={{ color: palette.accent }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <p className="text-sm font-medium" style={{ color: palette.text }}>Progress Tracking</p>
          </div>
          <div className="rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow" style={{ background: palette.card, borderColor: palette.border, borderWidth: '1px' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2" style={{ background: palette.accentSoft }}>
              <svg className="w-4 h-4" style={{ color: palette.accent }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-sm font-medium" style={{ color: palette.text }}>Community Support</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Signup;