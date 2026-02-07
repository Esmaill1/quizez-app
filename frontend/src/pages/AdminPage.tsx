import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  getChapters,
  getTopics,
  getQuestions,
  createChapter,
  createTopic,
  createQuestion,
  deleteChapter,
  deleteTopic,
  deleteQuestion,
  Chapter,
  Topic,
  Question,
} from '../services/api';
import { 
  BookOpen, 
  FileText, 
  PenSquare, 
  Plus, 
  Trash2, 
  ArrowLeft, 
  X, 
  CheckCircle, 
  AlertTriangle,
  Loader2
} from 'lucide-react';

type Tab = 'chapters' | 'topics' | 'questions';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('chapters');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Chapter form
  const [chapterName, setChapterName] = useState('');
  const [chapterDesc, setChapterDesc] = useState('');

  // Topic form
  const [selectedChapterForTopic, setSelectedChapterForTopic] = useState('');
  const [topicName, setTopicName] = useState('');
  const [topicDesc, setTopicDesc] = useState('');

  // Question form
  const [selectedTopic, setSelectedTopic] = useState('');
  const [questionTitle, setQuestionTitle] = useState('');
  const [questionDesc, setQuestionDesc] = useState('');
  const [questionExpl, setQuestionExpl] = useState('');
  const [questionTime, setQuestionTime] = useState<number>(0);
  const [questionDiff, setQuestionDiff] = useState('medium');
  const [questionTags, setQuestionTags] = useState('');
  const [questionItems, setQuestionItems] = useState<{ text: string; image_url: string }[]>([
    { text: '', image_url: '' },
    { text: '', image_url: '' }
  ]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [chaptersData, topicsData, questionsData] = await Promise.all([
        getChapters(),
        getTopics(),
        getQuestions(),
      ]);
      setChapters(chaptersData);
      setTopics(topicsData);
      setQuestions(questionsData);
    } catch (err) {
      showMessage('error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  function showMessage(type: 'success' | 'error', text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  }

  async function handleCreateChapter(e: React.FormEvent) {
    e.preventDefault();
    if (!chapterName.trim()) return showMessage('error', 'Chapter name is required');
    try {
      await createChapter({ name: chapterName, description: chapterDesc || undefined });
      showMessage('success', 'Chapter created!');
      setChapterName(''); setChapterDesc('');
      loadData();
    } catch (err) { showMessage('error', 'Failed to create chapter'); }
  }

  async function handleCreateTopic(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedChapterForTopic) return showMessage('error', 'Select a chapter');
    if (!topicName.trim()) return showMessage('error', 'Topic name is required');
    try {
      await createTopic({ chapter_id: selectedChapterForTopic, name: topicName, description: topicDesc || undefined });
      showMessage('success', 'Topic created!');
      setTopicName(''); setTopicDesc('');
      loadData();
    } catch (err) { showMessage('error', 'Failed to create topic'); }
  }

  async function handleCreateQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTopic) return showMessage('error', 'Select a topic');
    if (!questionTitle.trim()) return showMessage('error', 'Title is required');
    const validItems = questionItems.filter(item => item.text.trim() !== '');
    if (validItems.length < 2) return showMessage('error', 'At least 2 items required');

    try {
      await createQuestion({
        topic_id: selectedTopic,
        title: questionTitle,
        description: questionDesc || undefined,
        explanation: questionExpl || undefined,
        time_limit: questionTime > 0 ? questionTime : undefined,
        difficulty: questionDiff,
        tags: questionTags ? questionTags.split(',').map(t => t.trim()) : undefined,
        items: validItems,
      });
      showMessage('success', 'Question created!');
      setQuestionTitle(''); setQuestionDesc(''); setQuestionExpl('');
      setQuestionItems([{ text: '', image_url: '' }, { text: '', image_url: '' }]);
      loadData();
    } catch (err: any) { showMessage('error', err.message || 'Failed to create question'); }
  }

  const updateItem = (index: number, field: 'text' | 'image_url', value: string) => {
    const updated = [...questionItems];
    updated[index][field] = value;
    setQuestionItems(updated);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
        <p className="text-gray-600 dark:text-gray-400 font-medium">Loading admin panel...</p>
      </div>
    );
  }

  const inputClasses = "w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600";
  const labelClasses = "block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5";
  const sectionClasses = "bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-8";

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Admin Panel</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage quiz content and structure</p>
        </div>
        <Link 
          to="/" 
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to App
        </Link>
      </div>

      {message && (
        <div className={`flex items-center gap-3 p-4 rounded-2xl mb-6 animate-in fade-in slide-in-from-top-4 ${
          message.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800' 
            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-800'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      <div className="flex p-1 bg-gray-100 dark:bg-gray-900 rounded-2xl mb-8">
        <button 
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'chapters' 
              ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm' 
              : 'text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`} 
          onClick={() => setActiveTab('chapters')}
        >
          <BookOpen className="w-4 h-4" />
          Chapters
        </button>
        <button 
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'topics' 
              ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm' 
              : 'text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`} 
          onClick={() => setActiveTab('topics')}
        >
          <FileText className="w-4 h-4" />
          Topics
        </button>
        <button 
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'questions' 
              ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm' 
              : 'text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`} 
          onClick={() => setActiveTab('questions')}
        >
          <PenSquare className="w-4 h-4" />
          Questions
        </button>
      </div>

      {activeTab === 'chapters' && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-8">
          <div>
            <div className={sectionClasses}>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Create Chapter</h2>
              <form onSubmit={handleCreateChapter} className="space-y-5">
                <div>
                  <label className={labelClasses}>Name*</label>
                  <input className={inputClasses} value={chapterName} onChange={e => setChapterName(e.target.value)} placeholder="e.g. Physics 101" />
                </div>
                <div>
                  <label className={labelClasses}>Description</label>
                  <textarea className={`${inputClasses} h-24 resize-none`} value={chapterDesc} onChange={e => setChapterDesc(e.target.value)} placeholder="Optional summary..." />
                </div>
                <button type="submit" className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-md shadow-indigo-100 dark:shadow-none">
                  <Plus className="w-5 h-5" />
                  Create Chapter
                </button>
              </form>
            </div>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Existing Chapters</h2>
            <div className="space-y-3">
              {chapters.map(c => (
                <div key={c.id} className="group flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all">
                  <div className="min-w-0 pr-4">
                    <strong className="block text-gray-900 dark:text-white truncate">{c.name}</strong>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{c.description || 'No description'}</p>
                  </div>
                  <button 
                    className="flex-shrink-0 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all" 
                    onClick={() => { if(confirm('Delete chapter?')) deleteChapter(c.id).then(loadData) }}
                    title="Delete Chapter"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
              {chapters.length === 0 && <div className="text-center py-12 text-gray-400">No chapters found</div>}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'topics' && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-8">
          <div>
            <div className={sectionClasses}>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Create Topic</h2>
              <form onSubmit={handleCreateTopic} className="space-y-5">
                <div>
                  <label className={labelClasses}>Chapter*</label>
                  <select className={inputClasses} value={selectedChapterForTopic} onChange={e => setSelectedChapterForTopic(e.target.value)}>
                    <option value="">Select Chapter...</option>
                    {chapters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClasses}>Name*</label>
                  <input className={inputClasses} value={topicName} onChange={e => setTopicName(e.target.value)} placeholder="e.g. Newton's Laws" />
                </div>
                <div>
                  <label className={labelClasses}>Description</label>
                  <textarea className={`${inputClasses} h-24 resize-none`} value={topicDesc} onChange={e => setTopicDesc(e.target.value)} placeholder="Optional summary..." />
                </div>
                <button type="submit" className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-md shadow-indigo-100 dark:shadow-none">
                  <Plus className="w-5 h-5" />
                  Create Topic
                </button>
              </form>
            </div>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Existing Topics</h2>
            <div className="space-y-3">
              {topics.map(t => (
                <div key={t.id} className="group flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all">
                  <div className="min-w-0 pr-4">
                    <strong className="block text-gray-900 dark:text-white truncate">{t.name}</strong>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-md text-[10px] font-black uppercase tracking-wider">
                        {t.chapter_name}
                      </span>
                    </div>
                  </div>
                  <button 
                    className="flex-shrink-0 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all" 
                    onClick={() => { if(confirm('Delete topic?')) deleteTopic(t.id).then(loadData) }}
                    title="Delete Topic"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
              {topics.length === 0 && <div className="text-center py-12 text-gray-400">No topics found</div>}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'questions' && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-8">
          <div>
            <div className={sectionClasses}>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Create Question</h2>
              <form onSubmit={handleCreateQuestion} className="space-y-5">
                <div>
                  <label className={labelClasses}>Topic*</label>
                  <select className={inputClasses} value={selectedTopic} onChange={e => setSelectedTopic(e.target.value)}>
                    <option value="">Select Topic...</option>
                    {topics.map(t => <option key={t.id} value={t.id}>{t.name} ({t.chapter_name})</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClasses}>Title*</label>
                  <input className={inputClasses} value={questionTitle} onChange={e => setQuestionTitle(e.target.value)} placeholder="Question title..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClasses}>Difficulty</label>
                    <select className={inputClasses} value={questionDiff} onChange={e => setQuestionDiff(e.target.value)}>
                      <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClasses}>Time (sec)</label>
                    <input type="number" className={inputClasses} value={questionTime} onChange={e => setQuestionTime(parseInt(e.target.value))} />
                  </div>
                </div>
                <div>
                  <label className={labelClasses}>Tags (comma separated)</label>
                  <input className={inputClasses} placeholder="e.g. physics, mechanics" value={questionTags} onChange={e => setQuestionTags(e.target.value)} />
                </div>
                <div>
                  <label className={labelClasses}>Explanation (Rich Feedback)</label>
                  <textarea className={`${inputClasses} h-24 resize-none`} value={questionExpl} onChange={e => setQuestionExpl(e.target.value)} placeholder="Explain the correct order..." />
                </div>
                
                <div className="space-y-4">
                  <label className={labelClasses}>Items (in CORRECT order)*</label>
                  {questionItems.map((item, i) => (
                    <div key={i} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs font-black">{i+1}</span>
                        <input className={inputClasses} placeholder="Item text content" value={item.text} onChange={e => updateItem(i, 'text', e.target.value)} />
                        {questionItems.length > 2 && (
                          <button type="button" className="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 transition-colors" onClick={() => setQuestionItems(questionItems.filter((_, idx) => idx !== i))}>
                            <X className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                      <input className={`${inputClasses} text-xs py-1.5`} placeholder="Image URL (optional)" value={item.image_url} onChange={e => updateItem(i, 'image_url', e.target.value)} />
                    </div>
                  ))}
                  <button type="button" className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-900/50 rounded-2xl font-bold transition-all" onClick={() => setQuestionItems([...questionItems, { text: '', image_url: '' }])}>
                    <Plus className="w-4 h-4" />
                    Add Item
                  </button>
                </div>
                <button type="submit" className="w-full flex items-center justify-center gap-2 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-100 dark:shadow-none mt-6">
                  <CheckCircle className="w-5 h-5" />
                  Create Question
                </button>
              </form>
            </div>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Existing Questions</h2>
            <div className="space-y-3">
              {questions.map(q => (
                <div key={q.id} className="group flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all">
                  <div className="min-w-0 pr-4">
                    <strong className="block text-gray-900 dark:text-white truncate">{q.title}</strong>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tight">{q.topic_name}</span>
                      <span className="w-1 h-1 bg-gray-300 dark:bg-gray-700 rounded-full"></span>
                      <span className={`text-[10px] font-black uppercase ${
                        q.difficulty === 'easy' ? 'text-emerald-500' : q.difficulty === 'hard' ? 'text-red-500' : 'text-amber-500'
                      }`}>
                        {q.difficulty}
                      </span>
                    </div>
                  </div>
                  <button 
                    className="flex-shrink-0 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all" 
                    onClick={() => { if(confirm('Delete question?')) deleteQuestion(q.id).then(loadData) }}
                    title="Delete Question"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
              {questions.length === 0 && <div className="text-center py-12 text-gray-400">No questions found</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}