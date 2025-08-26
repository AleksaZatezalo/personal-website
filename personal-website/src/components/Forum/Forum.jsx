import React, { useState, useEffect } from 'react';
import MatrixNavbar from '../MatrixNavbar';

const Forum = () => {
  const [currentView, setCurrentView] = useState('categories'); // 'categories', 'topics', 'thread'
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedThread, setSelectedThread] = useState(null);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicContent, setNewTopicContent] = useState('');
  const [newReplyContent, setNewReplyContent] = useState('');
  const [showNewTopicForm, setShowNewTopicForm] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // API data state
  const [categories, setCategories] = useState([]);
  const [topics, setTopics] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check authentication status on component mount
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          setCurrentUser(user);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Error parsing user data:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setAuthLoading(false);
    };

    checkAuth();
  }, []);

  // Fetch categories on component mount
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchCategories();
    }
  }, [authLoading, isAuthenticated]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/forum/categories');
      const data = await response.json();
      
      if (response.ok) {
        setCategories(data.categories);
      } else {
        setError('Failed to load categories');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Network error loading categories');
    }
    setLoading(false);
  };

  const fetchTopics = async (categoryId) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/forum/categories/${categoryId}/topics`);
      const data = await response.json();
      
      if (response.ok) {
        setTopics(data.topics);
      } else {
        setError('Failed to load topics');
      }
    } catch (error) {
      console.error('Error fetching topics:', error);
      setError('Network error loading topics');
    }
    setLoading(false);
  };

  const fetchPosts = async (topicId) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/forum/topics/${topicId}/posts`);
      const data = await response.json();
      
      if (response.ok) {
        setSelectedThread({
          id: data.topic.id,
          title: data.topic.title,
          author: data.topic.author,
          views: data.topic.views
        });
        setPosts(data.posts);
      } else {
        setError('Failed to load posts');
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError('Network error loading posts');
    }
    setLoading(false);
  };

  const handleCreateTopic = async () => {
    if (!newTopicTitle.trim() || !newTopicContent.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/forum/categories/${selectedCategory.id}/topics`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: newTopicTitle.trim(),
          content: newTopicContent.trim()
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setNewTopicTitle('');
        setNewTopicContent('');
        setShowNewTopicForm(false);
        // Refresh topics
        fetchTopics(selectedCategory.id);
      } else {
        setError(data.message || 'Failed to create topic');
      }
    } catch (error) {
      console.error('Error creating topic:', error);
      setError('Network error creating topic');
    }
    setLoading(false);
  };

  const handleReply = async () => {
    if (!newReplyContent.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/forum/topics/${selectedThread.id}/posts`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          content: newReplyContent.trim()
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setNewReplyContent('');
        // Refresh posts
        fetchPosts(selectedThread.id);
      } else {
        setError(data.message || 'Failed to post reply');
      }
    } catch (error) {
      console.error('Error posting reply:', error);
      setError('Network error posting reply');
    }
    setLoading(false);
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffMs = now - postTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div>
        <MatrixNavbar />
        <div className="forum-container">
          <div className="loading">Checking authentication...</div>
        </div>
      </div>
    );
  }

  // Show not available message if not authenticated
  if (!isAuthenticated) {
    return (
      <div>
        <MatrixNavbar />
        <div className="forum-container">
          <div className="auth-required">
            <div className="auth-required-content">
              <h2>Forum Access Restricted</h2>
              <p>Not available to public</p>
              <p>Please <a href="/login">login</a> to access the forum.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderError = () => {
    if (!error) return null;
    return (
      <div className="error-banner" style={{ 
        background: 'rgba(255, 68, 68, 0.2)', 
        border: '1px solid #ff4444', 
        color: '#ff4444', 
        padding: '1rem', 
        marginBottom: '1rem', 
        borderRadius: '4px' 
      }}>
        {error}
        <button 
          onClick={() => setError('')} 
          style={{ float: 'right', background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer' }}
        >
          ×
        </button>
      </div>
    );
  };

  const renderCategories = () => (
    <div className="forum-categories">
      <div className="forum-header">
        <h1 className="forum-title">DefCon Belgrade Forum</h1>
        <p className="forum-subtitle">Welcome {currentUser.username}!</p>
      </div>

      {renderError()}

      {loading ? (
        <div className="loading">Loading categories...</div>
      ) : (
        <div className="categories-list">
          {categories.map(category => (
            <div
              key={category.id}
              className="category-card"
              onClick={() => {
                setSelectedCategory(category);
                setCurrentView('topics');
                fetchTopics(category.id);
              }}
            >
              <div className="category-icon">{category.icon}</div>
              <div className="category-info">
                <h3 className="category-name">{category.name}</h3>
                <p className="category-description">{category.description}</p>
              </div>
              <div className="category-stats">
                <div className="stat">
                  <span className="stat-number">{category.topicCount}</span>
                  <span className="stat-label">Topics</span>
                </div>
                <div className="stat">
                  <span className="stat-number">{category.postCount}</span>
                  <span className="stat-label">Posts</span>
                </div>
              </div>
              <div className="category-last-activity">
                {category.lastActivity && (
                  <>
                    <div className="last-activity-time">{formatTimestamp(category.lastActivity)}</div>
                    <div className="last-activity-user">by {category.lastUser}</div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderTopics = () => (
    <div className="forum-topics">
      <div className="topics-header">
        <h2 className="topics-title">{selectedCategory.name}</h2>
        <button
          className="new-topic-button"
          onClick={() => setShowNewTopicForm(true)}
        >
          + New Topic
        </button>
      </div>
      <button
          className="back-button"
          onClick={() => setCurrentView('categories')}
        >
          ← Back
        </button>

      {renderError()}

      {showNewTopicForm && (
        <div className="new-topic-form">
          <input
            type="text"
            placeholder="Topic title..."
            value={newTopicTitle}
            onChange={(e) => setNewTopicTitle(e.target.value)}
            className="topic-title-input"
          />
          <textarea
            placeholder="Write your post..."
            value={newTopicContent}
            onChange={(e) => setNewTopicContent(e.target.value)}
            className="topic-content-input"
            rows="4"
          />
          <div className="form-buttons">
            <button onClick={handleCreateTopic} className="create-button" disabled={loading}>
              {loading ? 'Creating...' : 'Create Topic'}
            </button>
            <button onClick={() => setShowNewTopicForm(false)} className="cancel-button">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading">Loading topics...</div>
      ) : (
        <div className="topics-list">
          {topics.map(topic => (
            <div
              key={topic.id}
              className={`topic-row ${topic.isPinned ? 'pinned' : ''}`}
              onClick={() => {
                setCurrentView('thread');
                fetchPosts(topic.id);
              }}
            >
              <div className="topic-status">
                {topic.isPinned && <span className="pin-icon">📌</span>}
                {topic.isLocked && <span className="lock-icon">🔒</span>}
              </div>
              <div className="topic-info">
                <h4 className="topic-title">{topic.title}</h4>
                <span className="topic-author">by {topic.author}</span>
              </div>
              <div className="topic-stats">
                <span className="replies">{topic.replies} replies</span>
                <span className="views">{topic.views} views</span>
              </div>
              <div className="topic-last-activity">
                <div className="last-reply-time">{formatTimestamp(topic.lastReply)}</div>
                <div className="last-reply-user">by {topic.lastUser}</div>
              </div>
            </div>
          ))}
          {topics.length === 0 && !loading && (
            <div className="no-topics">
              <p>No topics in this category yet. Be the first to start a discussion!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderThread = () => (
    <div className="forum-thread">
      <div className="thread-header">
        <h2 className="thread-title">{selectedThread.title}</h2>
      </div>

        <button
          className="back-button"
          onClick={() => setCurrentView('topics')}
        >
          ← Back
        </button>

      {renderError()}

      {loading ? (
        <div className="loading">Loading posts...</div>
      ) : (
        <>
          <div className="posts-list">
            {posts.map(post => (
              <div key={post.id} className="post">
                <div className="post-author">
                  <div className="author-avatar">👤</div>
                  <div className="author-name">{post.author}</div>
                  {post.authorTag && <div className="author-tag">{post.authorTag}</div>}
                  <div className="post-timestamp">{formatTimestamp(post.createdAt)}</div>
                  {post.isEdited && <div className="edited-indicator">(edited)</div>}
                </div>
                <div className="post-content">
                  {post.content}
                </div>
              </div>
            ))}
          </div>

          <div className="reply-form">
            <textarea
              placeholder="Write your reply..."
              value={newReplyContent}
              onChange={(e) => setNewReplyContent(e.target.value)}
              className="reply-input"
              rows="3"
            />
            <button onClick={handleReply} className="reply-button" disabled={loading}>
              {loading ? 'Posting...' : 'Post Reply'}
            </button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div>
      <MatrixNavbar />
      <div className="forum-container">
        {currentView === 'categories' && renderCategories()}
        {currentView === 'topics' && renderTopics()}
        {currentView === 'thread' && renderThread()}
      </div>
    </div>
  );
};

export default Forum;