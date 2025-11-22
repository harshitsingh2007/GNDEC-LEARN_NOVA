import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Save } from 'lucide-react';
import { toast } from 'sonner';
import { palette } from '@/theme/palette';

const AdminSettings = () => {
  const [admin, setAdmin] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    department: '',
  });

  // Get Admin Token
  const getAdminToken = () => {
    return localStorage.getItem('adminToken');
  };

  // Fetch Admin Profile
  const fetchAdminProfile = async () => {
    try {
      setLoading(true);
      const token = getAdminToken();
      const { data } = await axios.get('http://localhost:5000/api/admin/auth/profile', {
        withCredentials: true,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (data.success && data.admin) {
        setAdmin(data.admin);
        setFormData({
          fullName: data.admin.fullName || '',
          email: data.admin.email || '',
          department: data.admin.department || '',
        });
      }
    } catch (err: any) {
      console.error('Fetch Admin Profile Error:', err);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  // Update Admin Profile
  const handleSave = async () => {
    try {
      setSaving(true);
      const token = getAdminToken();
      const { data } = await axios.put(
        'http://localhost:5000/api/admin/auth/profile',
        formData,
        {
          withCredentials: true,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (data.success) {
        setAdmin(data.admin);
        toast.success('Profile updated successfully');
      }
    } catch (err: any) {
      console.error('Update Profile Error:', err);
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchAdminProfile();
  }, []);

  if (loading) {
    return (
      <div className="p-8 space-y-8" style={{ background: palette.bg }}>
        <div className="flex items-center justify-center h-64">
          <p style={{ color: palette.text2 }}>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8" style={{ background: palette.bg }}>
      <div>
        <h1 className="text-4xl font-bold mb-2" style={{ color: palette.text }}>Settings</h1>
        <p className="text-lg" style={{ color: palette.text2 }}>Manage your instructor account and preferences</p>
      </div>

      {/* Profile Settings - Full Width */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        className="max-w-3xl"
        >
        <Card className="shadow-sm" style={{ background: palette.card, borderColor: palette.border, borderWidth: '1px' }}>
            <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: palette.text }}>
                <User className="w-5 h-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="instructor-name" className="font-medium" style={{ color: palette.text }}>Full Name</Label>
                <Input
                  id="instructor-name"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="h-11"
                  style={{ 
                    color: palette.text, 
                    borderColor: palette.border, 
                    backgroundColor: palette.card,
                    '--tw-ring-color': palette.accent + '33'
                  } as React.CSSProperties & { '--tw-ring-color': string }}
                  placeholder="Enter your full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instructor-email" className="font-medium" style={{ color: palette.text }}>Email</Label>
                <Input
                  id="instructor-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-11"
                  style={{ 
                    color: palette.text, 
                    borderColor: palette.border, 
                    backgroundColor: palette.card,
                    '--tw-ring-color': palette.accent + '33'
                  } as React.CSSProperties & { '--tw-ring-color': string }}
                  placeholder="Enter your email"
                />
              </div>
              </div>
              <div className="space-y-2">
              <Label htmlFor="department" className="font-medium" style={{ color: palette.text }}>Department</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="h-11"
                style={{ 
                  color: palette.text, 
                  borderColor: palette.border, 
                  backgroundColor: palette.card,
                  '--tw-ring-color': palette.accent + '33'
                } as React.CSSProperties & { '--tw-ring-color': string }}
                placeholder="Enter your department"
                />
              </div>
            <div className="pt-4 border-t" style={{ borderColor: palette.border }}>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="shadow-lg px-8 h-11"
                style={{ background: palette.accent, color: palette.card }}
                onMouseEnter={(e) => e.currentTarget.style.background = palette.accentDeep}
                onMouseLeave={(e) => e.currentTarget.style.background = palette.accent}
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
    </div>
  );
};

export default AdminSettings;