import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { palette } from "@/theme/palette";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen overflow-hidden relative flex items-center justify-center" style={{ background: palette.bg }}>
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-48 w-96 h-96 rounded-full blur-3xl animate-float" style={{ background: palette.accentSoft, opacity: 0.5 }} />
        <div className="absolute bottom-1/4 -right-48 w-96 h-96 rounded-full blur-3xl animate-float" style={{ background: palette.accentSoft, opacity: 0.3, animationDelay: '2s' }} />
        <div className="absolute inset-0" style={{ background: `linear-gradient(${palette.border}1px,transparent 1px),linear-gradient(90deg,${palette.border}1px,transparent 1px)`, backgroundSize: '64px 64px' }} />
      </div>

      <div className="text-center relative z-10">
        <h1 className="mb-4 text-6xl md:text-8xl font-bold" style={{ color: palette.text }}>404</h1>
        <p className="mb-8 text-xl md:text-2xl" style={{ color: palette.text2 }}>Oops! Page not found</p>
        <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg shadow-lg transition-all duration-300" style={{ background: palette.accent, color: palette.card }} onMouseEnter={(e) => e.currentTarget.style.background = palette.accentDeep} onMouseLeave={(e) => e.currentTarget.style.background = palette.accent}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
