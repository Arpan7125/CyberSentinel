import React, { useState, useEffect } from 'react';
import saasService from '../../services/api';
import { Plus, X } from 'lucide-react';

export default function ContentPage() {
  const [activeSection, setActiveSection] = useState('blogs');
  const [blogs, setBlogs] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit / Create States
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formState, setFormState] = useState({ title: '', category: '', excerpt: '', content: '' });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [blogRes, faqRes] = await Promise.all([
          saasService.getBlogPosts(),
          saasService.getFaqs()
        ]);
        setBlogs(Array.isArray(blogRes?.results) ? blogRes.results : (Array.isArray(blogRes) ? blogRes : []));
        setFaqs(Array.isArray(faqRes?.results) ? faqRes.results : (Array.isArray(faqRes) ? faqRes : []));
      } catch (error) {
        console.error("Failed to load CMS data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleEditClick = (item) => {
    setEditItem(item);
    setFormState({
      title: item.title || item.question || '',
      category: item.category || '',
      excerpt: item.excerpt || item.answer || '',
      content: item.content || ''
    });
    setShowModal(true);
  };

  const handleCreateClick = () => {
    setEditItem(null);
    setFormState({ title: '', category: '', excerpt: '', content: '' });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (activeSection === 'blogs') {
        const payload = {
          title: formState.title,
          category: formState.category,
          excerpt: formState.excerpt,
          content: formState.content,
          slug: formState.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          author: 'System Admin',
          read_time: '5 min read'
        };
        if (editItem) {
          const res = await saasService.updateBlogPost(editItem.id, payload);
          setBlogs(prev => prev.map(b => b.id === editItem.id ? res : b));
        } else {
          const res = await saasService.createBlogPost(payload);
          setBlogs([res, ...blogs]);
        }
      } else if (activeSection === 'faqs') {
        const payload = {
          question: formState.title,
          category: formState.category,
          answer: formState.excerpt
        };
        if (editItem) {
          const res = await saasService.updateFaq(editItem.id, payload);
          setFaqs(prev => prev.map(f => f.id === editItem.id ? res : f));
        } else {
          const res = await saasService.createFaq(payload);
          setFaqs([res, ...faqs]);
        }
      }
      setShowModal(false);
    } catch (err) {
      alert("Failed to save content. Check console for details.");
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      if (activeSection === 'blogs') {
        await saasService.deleteBlogPost(id);
        setBlogs(prev => prev.filter(b => b.id !== id));
      } else if (activeSection === 'faqs') {
        await saasService.deleteFaq(id);
        setFaqs(prev => prev.filter(f => f.id !== id));
      }
    } catch (err) {
      alert("Failed to delete content.");
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">CMS Content Manager</h1>
          <p className="page-subtitle">Publish and edit blog posts and FAQ knowledge items</p>
        </div>
        <button className="btn-pub btn-pub-primary btn-pub-sm" onClick={handleCreateClick} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={16} /> Create New Item
        </button>
      </div>

      {/* Section tab switches */}
      <div className="tab-list">
        <button className={`tab-item ${activeSection === 'blogs' ? 'active' : ''}`} onClick={() => setActiveSection('blogs')}>Blog Articles</button>
        <button className={`tab-item ${activeSection === 'faqs' ? 'active' : ''}`} onClick={() => setActiveSection('faqs')}>FAQ Entries</button>
      </div>

      {/* Lists display */}
      <div className="glass-card" style={{ padding: 24 }}>
        {loading ? (
          <p>Loading content...</p>
        ) : (
          <>
            {activeSection === 'blogs' && (
              <div className="data-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Published Date</th>
                      <th>Author</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blogs.map(b => (
                      <tr key={b.id}>
                        <td style={{ fontWeight: 650 }}>{b.title}</td>
                        <td><span className="badge badge-admin" style={{ padding: '3px 8px' }}>{b.category}</span></td>
                        <td>{new Date(b.created_at).toLocaleDateString()}</td>
                        <td>{b.author}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn-pub btn-pub-secondary btn-pub-sm" onClick={() => handleEditClick(b)}>Edit</button>
                            <button className="btn-pub btn-pub-ghost btn-pub-sm" style={{ color: 'var(--accent-red)' }} onClick={() => handleDelete(b.id)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeSection === 'faqs' && (
              <div className="data-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Question</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {faqs.map((f) => (
                      <tr key={f.id}>
                        <td><span className="badge badge-admin" style={{ padding: '3px 8px' }}>{f.category}</span></td>
                        <td style={{ fontWeight: 650 }}>{f.question}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn-pub btn-pub-secondary btn-pub-sm" onClick={() => handleEditClick(f)}>Edit</button>
                            <button className="btn-pub btn-pub-ghost btn-pub-sm" style={{ color: 'var(--accent-red)' }} onClick={() => handleDelete(f.id)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create / Edit modal */}
      {showModal && (
        <div className="modal-overlay" style={{ display: 'flex' }}>
          <div className="modal-content modal-lg">
            <div className="modal-header">
              <h2 className="modal-title">{editItem ? 'Edit Item Details' : 'Create New CMS Item'}</h2>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label-pub">Title / Question</label>
                  <input
                    type="text"
                    className="form-input-pub"
                    value={formState.title}
                    onChange={e => setFormState(p => ({ ...p, title: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label-pub">Category</label>
                  <input
                    type="text"
                    className="form-input-pub"
                    value={formState.category}
                    onChange={e => setFormState(p => ({ ...p, category: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label-pub">Excerpt / Answer Summary</label>
                  <textarea
                    className="form-textarea-pub"
                    value={formState.excerpt}
                    onChange={e => setFormState(p => ({ ...p, excerpt: e.target.value }))}
                    required
                  />
                </div>

                {activeSection === 'blogs' && (
                  <div className="form-group">
                    <label className="form-label-pub">Full Article Content (Markdown supported)</label>
                    <textarea
                      className="form-textarea-pub"
                      value={formState.content}
                      onChange={e => setFormState(p => ({ ...p, content: e.target.value }))}
                      style={{ minHeight: 200 }}
                    />
                  </div>
                )}

                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                  <button type="submit" className="btn-pub btn-pub-primary btn-pub-sm">Save Content</button>
                  <button type="button" className="btn-pub btn-pub-secondary btn-pub-sm" onClick={() => setShowModal(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
