import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  getChapters,
  getQuestions,
  createChapter,
  createQuestion,
  deleteChapter,
  deleteQuestion,
  Chapter,
  Question,
} from '../services/api';

type Tab = 'chapters' | 'questions';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('chapters');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Chapter form
  const [chapterName, setChapterName] = useState('');
  const [chapterDesc, setChapterDesc] = useState('');

  // Question form
  const [selectedChapter, setSelectedChapter] = useState('');
  const [questionTitle, setQuestionTitle] = useState('');
  const [questionDesc, setQuestionDesc] = useState('');
  const [questionItems, setQuestionItems] = useState<string[]>(['', '']);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [chaptersData, questionsData] = await Promise.all([
        getChapters(),
        getQuestions(),
      ]);
      setChapters(chaptersData);
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
    if (!chapterName.trim()) {
      showMessage('error', 'Chapter name is required');
      return;
    }

    try {
      await createChapter({ name: chapterName, description: chapterDesc || undefined });
      showMessage('success', 'Chapter created successfully!');
      setChapterName('');
      setChapterDesc('');
      loadData();
    } catch (err) {
      showMessage('error', 'Failed to create chapter');
    }
  }

  async function handleDeleteChapter(id: string, name: string) {
    if (!confirm(`Delete chapter "${name}"? This will also delete all its questions.`)) return;

    try {
      await deleteChapter(id);
      showMessage('success', 'Chapter deleted');
      loadData();
    } catch (err) {
      showMessage('error', 'Failed to delete chapter');
    }
  }

  async function handleCreateQuestion(e: React.FormEvent) {
    e.preventDefault();
    
    if (!selectedChapter) {
      showMessage('error', 'Please select a chapter');
      return;
    }
    
    if (!questionTitle.trim()) {
      showMessage('error', 'Question title is required');
      return;
    }

    const validItems = questionItems.filter(item => item.trim() !== '');
    if (validItems.length < 2) {
      showMessage('error', 'At least 2 items are required');
      return;
    }

    try {
      await createQuestion({
        chapter_id: selectedChapter,
        title: questionTitle,
        description: questionDesc || undefined,
        items: validItems,
      });
      showMessage('success', 'Question created successfully!');
      setQuestionTitle('');
      setQuestionDesc('');
      setQuestionItems(['', '']);
      loadData();
    } catch (err: any) {
      showMessage('error', err.message || 'Failed to create question');
    }
  }

  async function handleDeleteQuestion(id: string, title: string) {
    if (!confirm(`Delete question "${title}"?`)) return;

    try {
      await deleteQuestion(id);
      showMessage('success', 'Question deleted');
      loadData();
    } catch (err) {
      showMessage('error', 'Failed to delete question');
    }
  }

  function addItemField() {
    setQuestionItems([...questionItems, '']);
  }

  function removeItemField(index: number) {
    if (questionItems.length <= 2) return;
    setQuestionItems(questionItems.filter((_, i) => i !== index));
  }

  function updateItem(index: number, value: string) {
    const updated = [...questionItems];
    updated[index] = value;
    setQuestionItems(updated);
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading admin panel...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">Admin Panel</h1>
          <p className="page-subtitle">Manage chapters and questions</p>
        </div>
        <Link to="/" className="btn btn-outline">
          ← Back to App
        </Link>
      </div>

      {message && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'chapters' ? 'active' : ''}`}
          onClick={() => setActiveTab('chapters')}
        >
          📖 Chapters ({chapters.length})
        </button>
        <button
          className={`tab ${activeTab === 'questions' ? 'active' : ''}`}
          onClick={() => setActiveTab('questions')}
        >
          📝 Questions ({questions.length})
        </button>
      </div>

      {activeTab === 'chapters' && (
        <>
          <div className="admin-section">
            <h2 className="admin-section-title">Create New Chapter</h2>
            <form onSubmit={handleCreateChapter}>
              <div className="form-group">
                <label className="form-label">Chapter Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={chapterName}
                  onChange={(e) => setChapterName(e.target.value)}
                  placeholder="e.g., Chapter 1: Introduction"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description (optional)</label>
                <textarea
                  className="form-textarea"
                  value={chapterDesc}
                  onChange={(e) => setChapterDesc(e.target.value)}
                  placeholder="Brief description of the chapter..."
                  style={{ minHeight: '80px' }}
                />
              </div>
              <button type="submit" className="btn btn-primary">
                + Create Chapter
              </button>
            </form>
          </div>

          <div className="admin-section">
            <h2 className="admin-section-title">Existing Chapters</h2>
            {chapters.length === 0 ? (
              <p style={{ color: 'var(--gray-500)' }}>No chapters yet. Create one above!</p>
            ) : (
              chapters.map((chapter) => (
                <div
                  key={chapter.id}
                  className="card"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div>
                    <h3 className="card-title">{chapter.name}</h3>
                    {chapter.description && (
                      <p className="card-description">{chapter.description}</p>
                    )}
                  </div>
                  <button
                    className="remove-btn"
                    onClick={() => handleDeleteChapter(chapter.id, chapter.name)}
                    title="Delete chapter"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {activeTab === 'questions' && (
        <>
          <div className="admin-section">
            <h2 className="admin-section-title">Create New Question</h2>
            <form onSubmit={handleCreateQuestion}>
              <div className="form-group">
                <label className="form-label">Select Chapter *</label>
                <select
                  className="form-input"
                  value={selectedChapter}
                  onChange={(e) => setSelectedChapter(e.target.value)}
                >
                  <option value="">Choose a chapter...</option>
                  {chapters.map((chapter) => (
                    <option key={chapter.id} value={chapter.id}>
                      {chapter.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Question Title *</label>
                <input
                  type="text"
                  className="form-input"
                  value={questionTitle}
                  onChange={(e) => setQuestionTitle(e.target.value)}
                  placeholder="e.g., Arrange these steps in order of importance"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description (optional)</label>
                <textarea
                  className="form-textarea"
                  value={questionDesc}
                  onChange={(e) => setQuestionDesc(e.target.value)}
                  placeholder="Additional instructions for the student..."
                  style={{ minHeight: '60px' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  Items (in CORRECT order) *
                  <span style={{ fontWeight: 'normal', color: 'var(--gray-500)', marginLeft: '8px' }}>
                    Enter items in the order they should be arranged
                  </span>
                </label>
                {questionItems.map((item, index) => (
                  <div key={index} className="item-input-row">
                    <div className="item-number">{index + 1}</div>
                    <input
                      type="text"
                      className="form-input"
                      value={item}
                      onChange={(e) => updateItem(index, e.target.value)}
                      placeholder={`Item ${index + 1}...`}
                    />
                    {questionItems.length > 2 && (
                      <button
                        type="button"
                        className="remove-btn"
                        onClick={() => removeItemField(index)}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="add-item-btn"
                  onClick={addItemField}
                >
                  + Add Another Item
                </button>
              </div>
              <button type="submit" className="btn btn-primary">
                + Create Question
              </button>
            </form>
          </div>

          <div className="admin-section">
            <h2 className="admin-section-title">Existing Questions</h2>
            {questions.length === 0 ? (
              <p style={{ color: 'var(--gray-500)' }}>No questions yet. Create one above!</p>
            ) : (
              questions.map((question) => (
                <div
                  key={question.id}
                  className="card"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div>
                    <h3 className="card-title">{question.title}</h3>
                    <p className="card-description">
                      {question.chapter_name} • {question.description || 'No description'}
                    </p>
                  </div>
                  <button
                    className="remove-btn"
                    onClick={() => handleDeleteQuestion(question.id, question.title)}
                    title="Delete question"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
