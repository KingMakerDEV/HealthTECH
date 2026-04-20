import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Sun, Moon, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getUser, clearAuth, isAuthenticated, getDashboardPath } from '@/lib/auth';

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(document.documentElement.classList.contains('dark'));
  const navigate = useNavigate();
  const user = getUser();
  const authed = isAuthenticated();

  const toggleDark = () => {
    document.documentElement.classList.toggle('dark');
    setDark(!dark);
  };

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center">
          <img 
            src="/CareNetra.png" 
            alt="CARENETRA Logo" 
            className="h-10 w-auto sm:h-12 md:h-14"
          />
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {!authed ? (
            <>
              <Link to="/#features" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">Features</Link>
              <Link to="/#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">How it works</Link>
              <Link to="/login" className="text-sm font-medium text-foreground">Sign in</Link>
              <Link to="/register" className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">Get Started</Link>
            </>
          ) : (
            <>
              <Link to={getDashboardPath(user?.role || 'PATIENT')} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link>
              <Link to={`/${user?.role?.toLowerCase()}/profile`} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Profile</Link>
              <span className="text-sm text-muted-foreground">{user?.name}</span>
              <button onClick={handleLogout} className="text-muted-foreground hover:text-destructive transition-colors"><LogOut size={18} /></button>
            </>
          )}
          <button onClick={toggleDark} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        <div className="flex md:hidden items-center gap-2">
          <button onClick={toggleDark} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 text-foreground">
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
            className="md:hidden border-t border-border bg-background overflow-hidden"
          >
            <div className="p-4 flex flex-col gap-3">
              {!authed ? (
                <>
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="text-sm font-medium py-2">Sign in</Link>
                  <Link to="/register" onClick={() => setMobileOpen(false)} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium text-center">Get Started</Link>
                </>
              ) : (
                <>
                  <Link to={getDashboardPath(user?.role || 'PATIENT')} onClick={() => setMobileOpen(false)} className="text-sm font-medium py-2">Dashboard</Link>
                  <Link to={`/${user?.role?.toLowerCase()}/profile`} onClick={() => setMobileOpen(false)} className="text-sm font-medium py-2">Profile</Link>
                  <button onClick={() => { handleLogout(); setMobileOpen(false); }} className="text-sm font-medium py-2 text-destructive text-left">Log out</button>
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