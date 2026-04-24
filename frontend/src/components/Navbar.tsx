import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Sun, Moon, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getUser, clearAuth, isAuthenticated, getDashboardPath } from '@/lib/auth';
import { LanguageSwitcher } from './LanguageSwitcher';

const Navbar = () => {
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUser();
  const authed = isAuthenticated();

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add('dark');
      setDark(true);
    } else {
      document.documentElement.classList.remove('dark');
      setDark(false);
    }
  }, []);

  const toggleDark = () => {
    const newDark = !dark;
    setDark(newDark);

    if (newDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleAnchorClick = (sectionId: string) => {
    if (location.pathname === '/') {
      // Already on landing page, scroll directly
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // Navigate to landing page with hash
      navigate(`/#${sectionId}`);
    }
  };

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  // Choose logo based on theme
  const logoSrc = dark ? '/CareNetra_black.png' : '/CareNetra_white.png';

  // Smooth scroll to section
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
    // Close mobile menu if open
    setMobileOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#f8fafc] dark:bg-gradient-to-r dark:from-[#0b0f19] dark:to-[#111827] border-b border-gray-200 dark:border-gray-800 backdrop-blur-md transition-all duration-300 ease-in-out">
      <div className="container mx-auto flex items-center justify-between h-14 sm:h-16 md:h-20 px-4 sm:px-6">
        <Link to="/" className="flex items-center">
          <img
            src={logoSrc}
            alt="CARENETRA Logo"
            className="h-11 sm:h-12 md:h-14 w-auto object-contain transition-opacity duration-200"
            style={{ imageRendering: 'crisp-edges' }}
          />
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {!authed ? (
            <>
              {/* Smooth scroll links */}
              <button
                onClick={() => handleAnchorClick('features')}
                className="text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors text-sm font-medium bg-transparent border-none cursor-pointer"
              >
                {t('header.features')}
              </button>
              <button
                onClick={() => handleAnchorClick('how-it-works')}
                className="text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors text-sm font-medium bg-transparent border-none cursor-pointer"
              >
                {t('header.howItWorks')}
              </button>
              <Link to="/login" className="text-sm font-medium text-gray-900 dark:text-white">
                {t('header.signIn')}
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                {t('header.getStarted')}
              </Link>
            </>
          ) : (
            <>
              <Link
                to={getDashboardPath(user?.role || 'PATIENT')}
                className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors"
              >
                {t('nav.dashboard')}
              </Link>
              <Link
                to={`/${user?.role?.toLowerCase()}/profile`}
                className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors"
              >
                {t('nav.profile')}
              </Link>
              <span className="text-sm text-gray-600 dark:text-gray-400">{user?.name}</span>
              <button
                onClick={handleLogout}
                className="text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                <LogOut size={18} />
              </button>
            </>
          )}
          <LanguageSwitcher />
          <button
            onClick={toggleDark}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
            aria-label="Toggle theme"
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={toggleDark}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
            aria-label="Toggle theme"
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 text-gray-900 dark:text-white">
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-[#f8fafc] dark:bg-[#111827] overflow-hidden"
          >
            <div className="p-4 flex flex-col gap-3">
              {!authed ? (
                <>
                  <button
                    onClick={() => { handleAnchorClick('features'); setMobileOpen(false); }}
                    className="text-sm font-medium py-2 text-gray-900 dark:text-white text-left"
                  >
                    {t('header.features')}
                  </button>
                  <button
                    onClick={() => { handleAnchorClick('how-it-works'); setMobileOpen(false); }}
                    className="text-sm font-medium py-2 text-gray-900 dark:text-white text-left"
                  >
                    {t('header.howItWorks')}
                  </button>
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="text-sm font-medium py-2 text-gray-900 dark:text-white"
                  >
                    {t('header.signIn')}
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileOpen(false)}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium text-center hover:bg-blue-700 transition-colors"
                  >
                    {t('header.getStarted')}
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to={getDashboardPath(user?.role || 'PATIENT')}
                    onClick={() => setMobileOpen(false)}
                    className="text-sm font-medium py-2 text-gray-900 dark:text-white"
                  >
                    {t('nav.dashboard')}
                  </Link>
                  <Link
                    to={`/${user?.role?.toLowerCase()}/profile`}
                    onClick={() => setMobileOpen(false)}
                    className="text-sm font-medium py-2 text-gray-900 dark:text-white"
                  >
                    {t('nav.profile')}
                  </Link>
                  <button
                    onClick={() => { handleLogout(); setMobileOpen(false); }}
                    className="text-sm font-medium py-2 text-red-600 dark:text-red-400 text-left"
                  >
                    {t('header.logout')}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;