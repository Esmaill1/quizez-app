import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getChapter, getTopics, Chapter, Topic } from '../services/api';
import { AlertTriangle, FolderOpen, ArrowLeft, ChevronRight, Loader2, BookOpen } from 'lucide-react';

export default function ChapterPage() {
  const { chapterId } = useParams<{ chapterId: string }>();
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (chapterId) {
      loadChapter();
    }
  }, [chapterId]);

  async function loadChapter() {
    try {
      setLoading(true);
      const [chapterData, topicsData] = await Promise.all([
        getChapter(chapterId!),
        getTopics(chapterId!)
      ]);
      setChapter(chapterData);
      setTopics(topicsData);
      setError(null);
    } catch (err) {
      setError('Failed to load chapter.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
        <p className="text-gray-600 dark:text-gray-400 font-medium">Loading topics...</p>
      </div>
    );
  }

  if (error || !chapter) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 max-w-md mx-auto my-12">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Chapter Not Found</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{error || 'This chapter does not exist.'}</p>
        <Link 
          to="/" 
          className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors shadow-md shadow-indigo-200 dark:shadow-none"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Chapters
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Link 
        to="/" 
        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Chapters
      </Link>

      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center">
          <BookOpen className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white leading-tight">{chapter.name}</h1>
          {chapter.description && (
            <p className="text-lg text-gray-600 dark:text-gray-400">{chapter.description}</p>
          )}
        </div>
      </div>

      <div className="border-t border-gray-100 dark:border-gray-800 pt-8 mt-8">
        {topics.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-12 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 text-gray-400 rounded-full flex items-center justify-center mb-6">
              <FolderOpen className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">No Topics Yet</h2>
            <p className="text-gray-600 dark:text-gray-400">Topics for this chapter will appear here.</p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Available Topics</h2>
              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full text-xs font-bold uppercase tracking-wider">
                {topics.length} topic{topics.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            <div className="space-y-4">
              {topics.map((topic, index) => (
                <div
                  key={topic.id}
                  className="flex items-center gap-4 p-5 bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md border border-gray-100 dark:border-gray-700 transition-all cursor-pointer group"
                  onClick={() => navigate(`/topic/${topic.id}`)}
                >
                  <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 font-bold rounded-xl group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:group-hover:bg-indigo-900/30 dark:group-hover:text-indigo-400 transition-colors">
                    {index + 1}
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {topic.name}
                    </h3>
                    {topic.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">{topic.description}</p>
                    )}
                    <div className="flex items-center gap-1 mt-2">
                      <span className="text-xs font-semibold text-gray-400 dark:text-gray-500">
                        {topic.question_count || 0} question{(topic.question_count || 0) !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transform group-hover:translate-x-1 transition-all">
                    <ChevronRight className="w-6 h-6" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
