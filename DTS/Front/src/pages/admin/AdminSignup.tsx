import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Eye, EyeOff, User, Mail, Lock, Shield, BookOpen, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

/* 🎨 Centralized Theme Palette */
export const palette = {
  bg: "#F7F5FF",
  card: "#FFFFFF",
  cardHover: "#F1ECFF",

  text: "#3B2F5D",
  text2: "#6B5E85",

  accent: "#A78BFA",
  accentSoft: "#DDD5FF",
  accentDeep: "#7C5BDA",

  border: "#E5E1F7",

  chartLine: "#A78BFA",
  chartFill: "rgba(167,139,250,0.18)",
  chartGrid: "#E5E1F7",

  progressTrack: "#EDE8FF",
  progressFill: "#A78BFA"
};

const AdminSignup = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    department: '',
    role: 'admin'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // Redirect if already logged in as admin
  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    const adminData = localStorage.getItem('adminData');
    if (adminToken && adminData) {
      navigate('/admin');
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
  };

  const handleSelectChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await axios.post(
        'http://localhost:5000/api/admin/auth/register',
        formData,
        { 
          withCredentials: true
        }
      );

      if (response.data.success) {
        setSuccess('Admin account created successfully!');
        setFormData({
          username: '',
          email: '',
          password: '',
          fullName: '',
          department: '',
          role: 'admin'
        });
        
        // Redirect to admin login after 2 seconds
        setTimeout(() => {
          navigate('/admin/login');
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create admin account');
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
        <Link 
          to="/" 
          className="absolute -top-16 left-0 flex items-center gap-2 transition-colors" 
          style={{ color: palette.text2 }}
          onMouseEnter={(e) => e.currentTarget.style.color = palette.text}
          onMouseLeave={(e) => e.currentTarget.style.color = palette.text2}
        >
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
              <Shield className="w-8 h-8" style={{ color: palette.accent }} />
            </motion.div>
            <div>
              <CardTitle className="text-2xl font-bold" style={{ color: palette.text }}>
                Admin Registration
              </CardTitle>
              <CardDescription style={{ color: palette.text2, fontSize: '1rem' }}>
                Create administrator account
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium" style={{ color: palette.text }}>Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4" style={{ color: palette.text2 }} />
                  <Input
                    name="fullName"
                    type="text"
                    placeholder="Enter full name"
                    value={formData.fullName}
                    onChange={handleChange}
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

              {/* Username Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium" style={{ color: palette.text }}>Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4" style={{ color: palette.text2 }} />
                  <Input
                    name="username"
                    type="text"
                    placeholder="Choose username"
                    value={formData.username}
                    onChange={handleChange}
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
                <label className="text-sm font-medium" style={{ color: palette.text }}>Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4" style={{ color: palette.text2 }} />
                  <Input
                    name="email"
                    type="email"
                    placeholder="admin@institution.com"
                    value={formData.email}
                    onChange={handleChange}
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

              {/* Department Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium" style={{ color: palette.text }}>Department</label>
                <div className="relative">
                  <Building className="absolute left-3 top-3 h-4 w-4" style={{ color: palette.text2 }} />
                  <Select 
                    value={formData.department} 
                    onValueChange={(value) => handleSelectChange('department', value)}
                  >
                    <SelectTrigger 
                      className="pl-10 h-12"
                      style={{ 
                        color: palette.text, 
                        borderColor: palette.border, 
                        backgroundColor: palette.card,
                      }}
                    >
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent 
                      style={{ 
                        backgroundColor: palette.card, 
                        borderColor: palette.border,
                        color: palette.text
                      }}
                    >
                      <SelectItem value="Computer Science">Computer Science</SelectItem>
                      <SelectItem value="Mathematics">Mathematics</SelectItem>
                      <SelectItem value="Engineering">Engineering</SelectItem>
                      <SelectItem value="Business">Business</SelectItem>
                      <SelectItem value="General">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Role Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium" style={{ color: palette.text }}>Role</label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value) => handleSelectChange('role', value)}
                >
                  <SelectTrigger 
                    className="h-12"
                    style={{ 
                      color: palette.text, 
                      borderColor: palette.border, 
                      backgroundColor: palette.card,
                    }}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent 
                    style={{ 
                      backgroundColor: palette.card, 
                      borderColor: palette.border,
                      color: palette.text
                    }}
                  >
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="super_admin">Super Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium" style={{ color: palette.text }}>Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4" style={{ color: palette.text2 }} />
                  <Input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password (min 8 characters)"
                    minLength={8}
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="pl-10 pr-10 h-12"
                    style={{ 
                      color: palette.text, 
                      borderColor: palette.border, 
                      backgroundColor: palette.card,
                      '--tw-ring-color': palette.accent + '33'
                    } as React.CSSProperties & { '--tw-ring-color': string }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2"
                    style={{ backgroundColor: 'transparent' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = palette.cardHover}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" style={{ color: palette.text2 }} />
                    ) : (
                      <Eye className="h-4 w-4" style={{ color: palette.text2 }} />
                    )}
                  </Button>
                </div>
                <p className="text-xs" style={{ color: palette.text2 }}>
                  Must be at least 8 characters long
                </p>
              </div>

              {/* Success Message */}
              {success && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-3 text-sm rounded-lg border"
                  style={{ 
                    color: '#059669', 
                    backgroundColor: '#ECFDF5', 
                    borderColor: '#A7F3D0' 
                  }}
                >
                  {success}
                </motion.div>
              )}

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-3 text-sm rounded-lg border"
                  style={{ 
                    color: '#DC2626', 
                    backgroundColor: '#FEF2F2', 
                    borderColor: '#FECACA' 
                  }}
                >
                  {error}
                </motion.div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 font-semibold text-base py-3 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
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
                    Creating admin account...
                  </div>
                ) : (
                  'Create Admin Account'
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" style={{ borderColor: palette.border }} />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2" style={{ background: palette.card, color: palette.text2 }}>
                  Already have an account?
                </span>
              </div>
            </div>

            {/* Login Link */}
            <div className="text-center">
              <Link
                to="/admin/login"
                className="font-medium text-sm transition-colors inline-flex items-center gap-1"
                style={{ color: palette.text2 }}
                onMouseEnter={(e) => e.currentTarget.style.color = palette.text}
                onMouseLeave={(e) => e.currentTarget.style.color = palette.text2}
              >
                Sign in to admin portal
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Security Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-center"
        >
          <div 
            className="rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border"
            style={{ 
              background: palette.card, 
              borderColor: palette.border 
            }}
          >
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2"
              style={{ background: palette.accentSoft }}
            >
              <Shield className="w-4 h-4" style={{ color: palette.accent }} />
            </div>
            <p className="text-sm font-medium" style={{ color: palette.text }}>Role-Based Access</p>
          </div>
          <div 
            className="rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border"
            style={{ 
              background: palette.card, 
              borderColor: palette.border 
            }}
          >
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2"
              style={{ background: palette.accentSoft }}
            >
              <Lock className="w-4 h-4" style={{ color: palette.accent }} />
            </div>
            <p className="text-sm font-medium" style={{ color: palette.text }}>Secure Authentication</p>
          </div>
          <div 
            className="rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border"
            style={{ 
              background: palette.card, 
              borderColor: palette.border 
            }}
          >
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2"
              style={{ background: palette.accentSoft }}
            >
              <BookOpen className="w-4 h-4" style={{ color: palette.accent }} />
            </div>
            <p className="text-sm font-medium" style={{ color: palette.text }}>Course Management</p>
          </div>
        </motion.div>

        {/* Back to Main Site */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center mt-6"
        >
          <Link
            to="/"
            className="text-sm transition-colors inline-flex items-center gap-1"
            style={{ color: palette.text2 }}
            onMouseEnter={(e) => e.currentTarget.style.color = palette.text}
            onMouseLeave={(e) => e.currentTarget.style.color = palette.text2}
          >
            ← Back to main site
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AdminSignup;