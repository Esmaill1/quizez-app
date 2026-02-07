import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { BookOpen, Moon, Sun, LogOut } from 'lucide-react';
import { isAuthenticated, logout } from '../services/api';

export default function Layout() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const navigate = useNavigate();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 shadow-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            <BookOpen className="w-8 h-8" />
            <span className="hidden sm:inline">Quiz App</span>
          </Link>
          <nav className="flex items-center gap-4">
            <button 
              onClick={toggleTheme} 
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" 
              title="Toggle Theme"
            >
              {theme === 'light' ? (
                <Moon className="w-6 h-6 text-gray-600" />
              ) : (
                <Sun className="w-6 h-6 text-amber-400" />
              )}
            </button>
            
            {isAuthenticated() ? (
              <div className="flex items-center gap-2">
                <Link 
                  to="/admin" 
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Admin Panel
                </Link>
                <button 
                  onClick={handleLogout}
                  className="p-2 rounded-full text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link 
                to="/admin" 
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Admin Panel
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}