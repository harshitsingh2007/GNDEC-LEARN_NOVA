import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NavLink } from '@/components/NavLink';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import {
  Home,
  Calendar,
  BookOpen,
  FileQuestion,
  Trophy,
  Settings,
  History,
  Bot,
  Store as StoreIcon,
  Blocks,
  Menu,
  X,
  LucideBatteryWarning,
  FileText,
  MessageSquare,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { palette } from '../theme/palette';

interface StudentLayoutProps {
  children: ReactNode;
}

const StudentLayout = ({ children }: StudentLayoutProps) => {
  const location = useLocation();
  const user = useStore((state) => state.user);
  const [open, setOpen] = useState(false); // mobile drawer open
  const [collapsed, setCollapsed] = useState(false); // desktop collapsed

  const navigation = [
    { name: 'Dashboard', href: '/student', icon: Home },
    { name: 'Calendar', href: '/student/calendar', icon: Calendar },
    { name: 'Courses', href: '/student/courses', icon: BookOpen },
    { name: 'Assignments', href: '/student/assignments', icon: FileQuestion },
    { name: 'Quizzes', href: '/student/quizzes', icon: FileQuestion },
    { name: 'Arena', href: '/student/arena', icon: Trophy },
    { name: 'My Learning', href: '/student/learning', icon: LucideBatteryWarning },
    { name: 'Notes', href: '/student/notion', icon: FileText },
    { name: 'Forum', href: '/student/forum', icon: MessageSquare },
    { name: 'ChatBot', href: '/student/chatbot', icon: Bot },
    { name: 'Store', href: '/student/store', icon: StoreIcon },
    { name: 'History', href: '/student/hist', icon: History },
    { name: 'Settings', href: '/student/settings', icon: Settings },
  ];

  const isActive = (path: string) => {
    if (path === '/student') return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 border-b" style={{ background: palette.card }}>
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: palette.accent }}>
            <Blocks className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold" style={{ color: palette.text }}>LearnNova</span>
        </Link>
        <button onClick={() => setOpen(!open)}>
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed md:relative top-0 left-0 h-full transition-all duration-300 z-40 border-r flex flex-col',
          collapsed ? 'w-16' : 'w-64',
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
        style={{ background: palette.card, borderColor: palette.border }}
      >
        {/* Logo Section */}
        <div className={cn(
          "p-4 border-b flex items-center justify-between",
          collapsed && "flex-col gap-2 py-4"
        )} style={{ borderColor: palette.border }}>
          {!collapsed ? (
            <>
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: palette.accent }}>
                  <Blocks className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-bold" style={{ color: palette.text }}>LearnNova</span>
              </Link>
              <button 
                onClick={() => setCollapsed(!collapsed)}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <Link to="/" className="flex items-center justify-center">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: palette.accent }}>
                  <Blocks className="w-4 h-4 text-white" />
                </div>
              </Link>
              <button 
                onClick={() => setCollapsed(!collapsed)}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
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
              end={item.href === '/student'}
              className={cn(
                'flex items-center transition-all group relative',
                collapsed ? 'justify-center p-3 rounded-lg' : 'gap-3 px-3 py-2.5 rounded-xl'
              )}
              activeClassName="font-medium"
              style={{ color: palette.text2 }}
              onClick={() => setOpen(false)}
            >
              <item.icon className={cn("w-5 h-5 flex-shrink-0", collapsed ? '' : '')} />
              {!collapsed && <span className="flex-1">{item.name}</span>}
              
              {/* Tooltip for collapsed state */}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                  {item.name}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Profile (Optional) */}
       
      </aside>

      {/* Overlay for Mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 md:hidden z-30"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className={cn(
        "flex-1 overflow-auto bg-white transition-all duration-300",
        collapsed ? "md:ml-0" : "md:ml-0"
      )}>
        {children}
      </main>
    </div>
  );
};

export default StudentLayout;