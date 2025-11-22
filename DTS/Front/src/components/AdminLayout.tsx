import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NavLink } from '@/components/NavLink';
import { cn } from '@/lib/utils';
import { Home, BookOpen, Users, FileText, Settings, Sparkles, Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import axios from 'axios';
import { palette } from '@/theme/palette';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();
  const [admin, setAdmin] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Fetch admin profile
  useEffect(() => {
    const fetchAdminProfile = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const { data } = await axios.get('http://localhost:5000/api/admin/auth/profile', {
          withCredentials: true,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (data.success && data.admin) {
          setAdmin(data.admin);
        }
      } catch (err) {
        console.error('Failed to fetch admin profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminProfile();
  }, []);

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: Home },
    { name: 'Courses', href: '/admin/courses', icon: BookOpen },
    { name: 'Students', href: '/admin/students', icon: Users },
    { name: 'Assessments', href: '/admin/assessments', icon: FileText },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen" style={{ background: palette.bg }}>
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 border-b" style={{ background: palette.card, borderColor: palette.border }}>
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: palette.accent }}>
            <Sparkles className="w-4 h-4" style={{ color: palette.card }} />
          </div>
          <span className="text-lg font-bold" style={{ color: palette.text }}>learnNova</span>
        </Link>

        <button onClick={() => setOpen(!open)}>
          {open ? <X className="w-6 h-6" style={{ color: palette.text }} /> : <Menu className="w-6 h-6" style={{ color: palette.text }} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={cn(
        'fixed md:relative top-0 left-0 h-full transition-all duration-300 z-40 border-r flex flex-col',
        collapsed ? 'w-16' : 'w-64',
        open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      )} style={{ background: palette.card, borderColor: palette.border }}>
        
        {/* Logo Section */}
        <div className={cn(
          "p-4 border-b flex items-center",
          collapsed ? "justify-center flex-col gap-2 py-4" : "justify-between"
        )} style={{ borderColor: palette.border }}>
          {!collapsed ? (
            <>
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-lg" style={{ background: palette.accent }}>
                  <Sparkles className="w-4 h-4" style={{ color: palette.card }} />
                </div>
                <div>
                  <span className="text-lg font-bold block" style={{ color: palette.text }}>learnNova</span>
                  <span className="text-xs" style={{ color: palette.text2 }}>Educator Portal</span>
                </div>
              </Link>
              <button 
                onClick={() => setCollapsed(!collapsed)}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                style={{ color: palette.text2 }}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <Link to="/" className="flex items-center justify-center">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-lg" style={{ background: palette.accent }}>
                  <Sparkles className="w-4 h-4" style={{ color: palette.card }} />
                </div>
              </Link>
              <button 
                onClick={() => setCollapsed(!collapsed)}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors mt-2"
                style={{ color: palette.text2 }}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === '/admin'}
              className={({ isActive }) =>
                cn(
                  'flex items-center transition-all group relative font-medium',
                  collapsed ? 'justify-center p-3 rounded-lg' : 'gap-3 px-3 py-2.5 rounded-xl'
                )
              }
              style={({ isActive }) => ({
                color: isActive ? palette.text : palette.text2,
                background: isActive ? palette.accentSoft : 'transparent',
              })}
              onClick={() => setOpen(false)}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.name}</span>}
              
              {/* Tooltip for collapsed state */}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                  {item.name}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Profile */}
        <div className={cn("p-3 border-t", collapsed && "px-2")} style={{ borderColor: palette.border }}>
          <div className={cn("rounded-xl p-3", collapsed && "p-2 flex justify-center")} style={{ background: palette.cardHover }}>
            {loading ? (
              <div className={cn("flex items-center", collapsed ? "justify-center" : "gap-3")}>
                <div className={cn("rounded-full animate-pulse", collapsed ? "w-8 h-8" : "w-10 h-10")} style={{ background: palette.border }} />
                {!collapsed && (
                  <div className="flex-1 space-y-2">
                    <div className="h-4 rounded animate-pulse w-24" style={{ background: palette.border }} />
                    <div className="h-3 rounded animate-pulse w-16" style={{ background: palette.border }} />
                  </div>
                )}
              </div>
            ) : (
              <div className={cn("flex items-center", collapsed ? "justify-center" : "gap-3")}>
                <Avatar className={cn("border-2", collapsed ? "w-8 h-8" : "w-10 h-10")} style={{ borderColor: palette.border }}>
                  <AvatarFallback 
                    className={cn("font-medium", collapsed ? "text-xs" : "text-sm")}
                    style={{ background: palette.accent, color: palette.card }}
                  >
                    {admin?.fullName
                      ? admin.fullName
                          .split(' ')
                          .map((n: string) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)
                      : admin?.username
                      ? admin.username.slice(0, 2).toUpperCase()
                      : 'AD'}
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-sm" style={{ color: palette.text }}>
                      {admin?.fullName || admin?.username || 'Admin'}
                    </p>
                    <p className="text-xs" style={{ color: palette.text2 }}>
                      {admin?.department || admin?.role || 'Instructor'}
                    </p>
                  </div>
                )}
                
                {/* Tooltip for collapsed user profile */}
                {collapsed && admin && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                    <div style={{ color: palette.card }}>
                      {admin?.fullName || admin?.username || 'Admin'}
                    </div>
                    <div className="text-xs opacity-80">
                      {admin?.department || admin?.role || 'Instructor'}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Overlay for Mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 md:hidden z-30"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Top Bar */}
        <header className={cn(
          "h-14 border-b flex items-center justify-between px-4 transition-all duration-300",
          collapsed ? "md:px-6" : "md:px-6"
        )} style={{ background: palette.card, borderColor: palette.border }}>
          <div>
            <h1 className="text-lg font-semibold" style={{ color: palette.text }}>
              {navigation.find(item => isActive(item.href))?.name || 'Dashboard'}
            </h1>
          </div>
          
          {/* Desktop Collapse Button */}
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex p-2 rounded-lg hover:bg-gray-100 transition-colors"
            style={{ color: palette.text2 }}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </header>

        {/* Main Content */}
        <main className={cn(
          "flex-1 overflow-auto transition-all duration-300",
          collapsed ? "md:ml-0" : "md:ml-0"
        )} style={{ background: palette.bg }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;