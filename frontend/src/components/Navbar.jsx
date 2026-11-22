import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  GraduationCap, PlusCircle, User, Bookmark, LogOut, ShieldAlert,
  Menu, X, ChevronDown, Compass, Users, TrendingUp, BookOpen, Calendar
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import NotificationBell from './NotificationBell';
import VerifiedBadge from './VerifiedBadge';

export default function Navbar() {
  const { user, logout, isAuthenticated, isAdmin, isSenior } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const userMenuRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { label: 'Q&A Feed', path: '/', icon: Compass },
    { label: 'Communities', path: '/communities', icon: Users },
    { label: 'Job Trends', path: '/job-trends', icon: TrendingUp },
    { label: 'Interviews', path: '/interview-experiences', icon: BookOpen },
    { label: 'Mentorship', path: '/mentorship', icon: Calendar },
    { label: 'Seniors', path: '/seniors', icon: GraduationCap },
  ];

  return (
    <nav className="sticky top-0 z-40 bg-cobalt border-b-2 border-cobalt-dark dark:border-butter shadow-hard-cobalt dark:shadow-hard-butter transition-colors">
      <div className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Logo & College Badge Block - with generous right spacing */}
          <div className="flex items-center gap-4 shrink-0 mr-4 xl:mr-8">
            <Link to="/" className="flex items-center gap-3 group shrink-0">
              <div className="w-11 h-11 rounded-xl bg-butter text-cobalt border-2 border-cobalt-dark flex items-center justify-center shadow-[3px_3px_0px_#121F5C] group-hover:translate-x-[1px] group-hover:translate-y-[1px] group-hover:shadow-[2px_2px_0px_#121F5C] transition-all shrink-0">
                <GraduationCap size={26} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col shrink-0">
                <span className="font-serif font-black text-xl sm:text-2xl tracking-tight text-butter leading-none whitespace-nowrap">
                  Seniors<span className="text-crimson">4</span>Juniors
                </span>
                <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-butter/85 mt-1 whitespace-nowrap">
                  College Q&amp;A &amp; Mentorship
                </span>
              </div>
            </Link>

            {/* User's College Badge */}
            {user?.college_name && (
              <span
                className="hidden 2xl:inline-flex items-center px-3 py-1 rounded-lg text-xs font-sans font-bold uppercase tracking-wider bg-butter text-cobalt border-2 border-cobalt-dark shadow-[2px_2px_0px_#121F5C] max-w-[220px] truncate shrink-0"
                title={user.college_name}
              >
                🏛️ {user.college_name}
              </span>
            )}
          </div>

          {/* Desktop Navigation Links - never wrap, generous spacing */}
          <div className="hidden xl:flex items-center space-x-1 shrink-0 whitespace-nowrap">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-sans font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-butter text-cobalt border-2 border-cobalt-dark shadow-[3px_3px_0px_#121F5C]'
                      : 'text-butter hover:bg-cobalt-light hover:text-butter border-2 border-transparent'
                  }`}
                >
                  <Icon size={15} strokeWidth={2.5} className="shrink-0" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right Actions & Auth Controls - strictly one line, never wraps */}
          <div className="hidden xl:flex items-center gap-3 shrink-0 whitespace-nowrap">
            <ThemeToggle />

            {isAuthenticated ? (
              <>
                {/* Main Call to Action: Ask Question */}
                <Link
                  to="/ask"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-sans font-bold uppercase tracking-wider text-butter bg-crimson border-2 border-butter shadow-[3px_3px_0px_#FBF0A8] btn-press whitespace-nowrap shrink-0"
                >
                  <PlusCircle size={16} strokeWidth={2.5} className="shrink-0" />
                  <span>Ask a Question</span>
                </Link>

                <NotificationBell />

                {/* User Dropdown */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-xl border-2 border-butter bg-cobalt-dark text-butter shadow-[2px_2px_0px_#FBF0A8] btn-press whitespace-nowrap"
                  >
                    <div className="w-8 h-8 rounded-lg bg-butter text-cobalt font-serif font-black text-sm flex items-center justify-center border-2 border-cobalt shrink-0">
                      {user.full_name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="text-left hidden 2xl:block pr-1">
                      <p className="text-xs font-serif font-bold text-butter leading-tight whitespace-nowrap">
                        {user.full_name?.split(' ')[0]}
                      </p>
                      <p className="text-[10px] font-sans font-bold uppercase tracking-wider text-butter/85">
                        {user.role}
                      </p>
                    </div>
                    <ChevronDown size={14} strokeWidth={2.5} className="text-butter shrink-0" />
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-3 w-64 bg-[#FFFDE8] dark:bg-cobalt-dark border-2 border-cobalt dark:border-butter rounded-xl shadow-[6px_6px_0px_#1B2E85] dark:shadow-[6px_6px_0px_#FBF0A8] py-2 z-50">
                      <div className="px-4 py-2.5 border-b-2 border-cobalt/20 dark:border-butter/20 bg-butter/50 dark:bg-cobalt">
                        <p className="text-sm font-serif font-black text-cobalt dark:text-butter truncate">
                          {user.full_name}
                        </p>
                        <p className="text-xs font-sans text-cobalt/80 dark:text-butter/80 truncate">
                          {user.email}
                        </p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className="text-[10px] uppercase font-sans font-bold px-2 py-0.5 rounded-md bg-cobalt text-butter dark:bg-butter dark:text-cobalt">
                            {user.role}
                          </span>
                          {user.role === 'senior' && user.is_verified && <VerifiedBadge size="sm" />}
                        </div>
                      </div>

                      <div className="py-1">
                        <Link
                          to={`/profile/${user.id}`}
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-sans font-bold uppercase tracking-wider text-cobalt dark:text-butter hover:bg-butter dark:hover:bg-cobalt transition-colors"
                        >
                          <User size={15} strokeWidth={2.5} /> My Profile
                        </Link>

                        <Link
                          to="/bookmarks"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-sans font-bold uppercase tracking-wider text-cobalt dark:text-butter hover:bg-butter dark:hover:bg-cobalt transition-colors"
                        >
                          <Bookmark size={15} strokeWidth={2.5} /> Bookmarked Questions
                        </Link>

                        {isAdmin && (
                          <Link
                            to="/admin"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-xs font-sans font-bold uppercase tracking-wider text-crimson hover:bg-crimson/10 transition-colors border-t-2 border-cobalt/15 dark:border-butter/15"
                          >
                            <ShieldAlert size={15} strokeWidth={2.5} /> Admin Dashboard
                          </Link>
                        )}
                      </div>

                      <div className="border-t-2 border-cobalt/20 dark:border-butter/20 pt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-sans font-bold uppercase tracking-wider text-crimson hover:bg-crimson hover:text-butter transition-colors"
                        >
                          <LogOut size={15} strokeWidth={2.5} /> Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2.5 shrink-0 whitespace-nowrap">
                <Link
                  to="/login"
                  className="px-3.5 py-2 text-xs font-sans font-bold uppercase tracking-wider text-butter hover:text-butter-dark transition-colors whitespace-nowrap"
                >
                  Log In
                </Link>
                <Link
                  to="/signup/junior"
                  className="px-3.5 py-2 text-xs font-sans font-bold uppercase tracking-wider rounded-xl bg-crimson text-butter border-2 border-butter shadow-[2px_2px_0px_#FBF0A8] btn-press whitespace-nowrap"
                >
                  Junior Signup
                </Link>
                <Link
                  to="/signup/senior"
                  className="px-3.5 py-2 text-xs font-sans font-bold uppercase tracking-wider rounded-xl bg-butter text-cobalt border-2 border-cobalt-dark shadow-[2px_2px_0px_#121F5C] btn-press whitespace-nowrap"
                >
                  Senior Signup
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button - shows on screen width < 1280px (xl) */}
          <div className="flex xl:hidden items-center gap-2.5 shrink-0">
            <ThemeToggle />
            {isAuthenticated && <NotificationBell />}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl border-2 border-butter bg-cobalt-dark text-butter shadow-[2px_2px_0px_#FBF0A8] flex items-center justify-center shrink-0"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={22} strokeWidth={2.5} /> : <Menu size={22} strokeWidth={2.5} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t-2 border-cobalt-dark dark:border-butter px-4 sm:px-6 pt-4 pb-6 bg-cobalt space-y-3">
          {isAuthenticated && (
            <div className="p-3.5 bg-cobalt-dark rounded-xl border-2 border-butter flex items-center justify-between">
              <div>
                <p className="text-sm font-serif font-bold text-butter">{user.full_name}</p>
                <p className="text-xs font-sans text-butter/85 capitalize">{user.role} • {user.college_name}</p>
              </div>
              {user.role === 'senior' && user.is_verified && <VerifiedBadge size="sm" />}
            </div>
          )}

          {isAuthenticated && (
            <Link
              to="/ask"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-crimson text-butter font-sans font-bold text-xs uppercase tracking-wider border-2 border-butter shadow-[3px_3px_0px_#FBF0A8]"
            >
              <PlusCircle size={18} strokeWidth={2.5} /> Ask a Question
            </Link>
          )}

          <div className="space-y-1.5 pt-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-sans font-bold uppercase tracking-wider border-2 transition-all ${
                    isActive
                      ? 'bg-butter text-cobalt border-butter shadow-[2px_2px_0px_#121F5C]'
                      : 'text-butter border-transparent hover:bg-cobalt-light'
                  }`}
                >
                  <Icon size={18} strokeWidth={2.5} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="border-t-2 border-butter/30 pt-3 space-y-2">
            {isAuthenticated ? (
              <>
                <Link
                  to={`/profile/${user.id}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3.5 py-2 text-xs font-sans font-bold uppercase tracking-wider text-butter"
                >
                  <User size={18} strokeWidth={2.5} /> My Profile
                </Link>
                <Link
                  to="/bookmarks"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3.5 py-2 text-xs font-sans font-bold uppercase tracking-wider text-butter"
                >
                  <Bookmark size={18} strokeWidth={2.5} /> Bookmarked Questions
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3.5 py-2 text-xs font-sans font-bold uppercase tracking-wider text-crimson"
                  >
                    <ShieldAlert size={18} strokeWidth={2.5} /> Admin Dashboard
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3.5 py-2 text-xs font-sans font-bold uppercase tracking-wider text-crimson text-left"
                >
                  <LogOut size={18} strokeWidth={2.5} /> Sign Out
                </button>
              </>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center py-2.5 text-xs font-sans font-bold uppercase tracking-wider border-2 border-butter rounded-xl text-butter bg-cobalt-dark"
                >
                  Log In
                </Link>
                <Link
                  to="/signup/junior"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center py-2.5 text-xs font-sans font-bold uppercase tracking-wider bg-crimson text-butter border-2 border-butter rounded-xl"
                >
                  Junior Signup
                </Link>
                <Link
                  to="/signup/senior"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center py-2.5 text-xs font-sans font-bold uppercase tracking-wider bg-butter text-cobalt border-2 border-cobalt-dark rounded-xl"
                >
                  Senior Signup
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
