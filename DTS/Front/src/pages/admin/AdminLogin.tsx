import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Lock, Mail, Shield, UserPlus } from 'lucide-react';
import { palette } from '@/theme/palette';

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already logged in as admin
    const adminData = localStorage.getItem('adminData');
    if (adminData) {
      navigate('/admin');
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store admin data
        localStorage.setItem('adminData', JSON.stringify(data.admin));
        localStorage.setItem('adminToken', data.token);
        
        navigate('/admin');
      } else {
        setError(data.message || 'Admin login failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
      console.error('Admin login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
          <CardHeader className="text-center space-y-4">
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
                Admin Portal
              </CardTitle>
              <CardDescription className="mt-2" style={{ color: palette.text2 }}>
                Restricted Access - Authorized Personnel Only
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-600">{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-medium" style={{ color: palette.text }}>
                  Admin Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4" style={{ color: palette.text2 }} />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@institution.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="pl-10"
                    style={{ 
                      color: palette.text, 
                      borderColor: palette.border, 
                      backgroundColor: palette.card,
                      '--tw-ring-color': palette.accent + '33'
                    } as React.CSSProperties & { '--tw-ring-color': string }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="font-medium" style={{ color: palette.text }}>
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4" style={{ color: palette.text2 }} />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your admin password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="pl-10 pr-10"
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
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                style={{ 
                  background: palette.accent, 
                  color: palette.card,
                  boxShadow: `0 10px 15px -3px ${palette.accent}33, 0 4px 6px -2px ${palette.accent}33`
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = palette.accentDeep}
                onMouseLeave={(e) => e.currentTarget.style.background = palette.accent}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Authenticating...
                  </div>
                ) : (
                  'Access Admin Dashboard'
                )}
              </Button>
            </form>

            {/* Signup Button Section */}
            <div className="text-center space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" style={{ borderColor: palette.border }} />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="px-2" style={{ background: palette.card, color: palette.text2 }}>
                    New Admin?
                  </span>
                </div>
              </div>

              <Link to="/admin/signup">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full font-medium py-3 rounded-lg transition-all duration-200 transform hover:scale-105 border-2"
                  style={{ 
                    color: palette.accent,
                    borderColor: palette.accent,
                    backgroundColor: 'transparent',
                    boxShadow: `0 4px 6px -1px ${palette.accent}33`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = palette.accent + '11';
                    e.currentTarget.style.borderColor = palette.accentDeep;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = palette.accent;
                  }}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create Admin Account
                </Button>
              </Link>
            </div>

            <div className="text-center">
              <p className="text-xs" style={{ color: palette.text2 }}>
                Secure access • Activity monitored • Unauthorized access prohibited
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AdminLogin;