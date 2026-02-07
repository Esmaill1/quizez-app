import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getChapters, Chapter } from '../services/api';
import { AlertTriangle, BookOpen, FileQuestion, Loader2 } from 'lucide-react';

export default function HomePage() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadChapters();
  }, []);

  async function loadChapters() {
    try {
      setLoading(true);
      const data = await getChapters();
      setChapters(data);
      setError(null);
    } catch (err) {
      setError('Failed to load chapters. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
        <p className="text-gray-600 dark:text-gray-400 font-medium">Loading chapters...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 max-w-md mx-auto my-12">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Oops!</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
        <button 
          className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors shadow-md shadow-indigo-200 dark:shadow-none" 
          onClick={loadChapters}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (chapters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 max-w-md mx-auto my-12">
        <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mb-6">
          <BookOpen className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold mb-2">No Chapters Yet</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Chapters will appear here once they're added.</p>
        <Link 
          to="/admin" 
          className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors shadow-md shadow-indigo-200 dark:shadow-none"
        >
          Go to Admin Panel
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-12 text-center sm:text-left">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-3">Choose a Chapter</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">Select a chapter to practice ordering questions</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {chapters.map((chapter) => (
          <div
            key={chapter.id}
            className="group relative flex flex-col p-6 bg-white dark:bg-gray-800 rounded-3xl shadow-sm hover:shadow-xl border border-gray-100 dark:border-gray-700 transition-all cursor-pointer hover:-translate-y-1"
            onClick={() => navigate(`/chapter/${chapter.id}`)}
          >
            <div className="mb-4 w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <BookOpen className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{chapter.name}</h2>
            {chapter.description && (
              <p className="text-gray-600 dark:text-gray-400 mb-6 line-clamp-2 text-sm leading-relaxed">
                {chapter.description}
              </p>
            )}
            <div className="mt-auto flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
              <FileQuestion className="w-4 h-4" />
              <span>View Topics</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
