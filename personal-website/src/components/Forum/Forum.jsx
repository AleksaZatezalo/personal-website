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

  // Forum data structure - moved before early returns
  const [forumData, setForumData] = useState({
    categories: [
      {
        id: 1,
        name: 'General',
        description: 'General cybersecurity topics and community discussions',
        icon: '💬',
        topicCount: 15,
        postCount: 127,
        lastActivity: '2024-01-15 14:30',
        lastUser: 'SecurityMike'
      },
      {
        id: 2,
        name: 'Research',
        description: 'Share your security research and vulnerability discoveries',
        icon: '🔍',
        topicCount: 8,
        postCount: 43,
        lastActivity: '2024-01-14 09:15',
        lastUser: 'ResearcherAnna'
      },
      {
        id: 3,
        name: 'CTF Challenges',
        description: 'Capture The Flag discussions, writeups, and practice',
        icon: '🚩',
        topicCount: 12,
        postCount: 89,
        lastActivity: '2024-01-15 11:22',
        lastUser: 'CTFMaster'
      },
      {
        id: 4,
        name: 'Tools & Tutorials',
        description: 'Share security tools, scripts, and learning resources',
        icon: '🛠️',
        topicCount: 20,
        postCount: 156,
        lastActivity: '2024-01-15 16:45',
        lastUser: 'ToolBuilder'
      },
      {
        id: 5,
        name: 'Job Board',
        description: 'Security job postings and career discussions',
        icon: '💼',
        topicCount: 6,
        postCount: 24,
        lastActivity: '2024-01-13 13:10',
        lastUser: 'HRRecruiter'
      },
      {
        id: 6,
        name: 'Meetup',
        description: 'Organize events, suggest topics, and coordinate meetups',
        icon: '📅',
        topicCount: 4,
        postCount: 18,
        lastActivity: '2024-01-15 10:30',
        lastUser: 'Organizer'
      }
    ],
    topics: {
      1: [
        {
          id: 101,
          title: 'Welcome to DefCon Belgrade Forum!',
          author: 'Admin',
          replies: 8,
          views: 234,
          lastReply: '2024-01-15 14:30',
          lastUser: 'SecurityMike',
          pinned: true,
          content: 'Welcome to our community forum! Please introduce yourself and let us know what interests you in cybersecurity.'
        },
        {
          id: 102,
          title: 'Best practices for secure coding?',
          author: 'DevSecOps',
          replies: 12,
          views: 89,
          lastReply: '2024-01-15 12:15',
          lastUser: 'CodeReviewer'
        },
        {
          id: 103,
          title: 'Thoughts on the latest security trends?',
          author: 'TrendWatcher',
          replies: 5,
          views: 67,
          lastReply: '2024-01-14 18:22',
          lastUser: 'AnalystPro'
        }
      ],
      2: [
        {
          id: 201,
          title: 'CVE-2024-12345 Analysis and PoC',
          author: 'ResearcherAnna',
          replies: 6,
          views: 156,
          lastReply: '2024-01-14 09:15',
          lastUser: 'VulnHunter'
        },
        {
          id: 202,
          title: 'Responsible disclosure process',
          author: 'EthicalHacker',
          replies: 9,
          views: 123,
          lastReply: '2024-01-13 16:30',
          lastUser: 'ComplianceOfficer'
        }
      ],
      3: [
        {
          id: 301,
          title: 'HackTheBox - Retired Machine Writeup',
          author: 'CTFMaster',
          replies: 15,
          views: 298,
          lastReply: '2024-01-15 11:22',
          lastUser: 'PwnLearner'
        },
        {
          id: 302,
          title: 'Local CTF competition - Team formation',
          author: 'TeamCaptain',
          replies: 7,
          views: 89,
          lastReply: '2024-01-14 20:45',
          lastUser: 'NewbieCTF'
        }
      ]
    },
    posts: {
      101: [
        {
          id: 1001,
          author: 'Admin',
          content: 'Welcome to our community forum! Please introduce yourself and let us know what interests you in cybersecurity.',
          timestamp: '2024-01-10 10:00',
          avatar: '👑'
        },
        {
          id: 1002,
          author: 'SecurityMike',
          content: 'Thanks for setting this up! I\'m a pentester with 5 years experience. Looking forward to sharing knowledge with everyone.',
          timestamp: '2024-01-15 14:30',
          avatar: '🔒'
        }
      ]
    }
  });

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

  const getCurrentTopics = () => {
    if (!selectedCategory) return [];
    return forumData.topics[selectedCategory.id] || [];
  };

  const getCurrentPosts = () => {
    if (!selectedThread) return [];
    return forumData.posts[selectedThread.id] || [];
  };

  const handleCreateTopic = () => {
    if (!newTopicTitle.trim() || !newTopicContent.trim()) return;

    const newTopic = {
      id: Date.now(),
      title: newTopicTitle,
      author: currentUser.username,
      replies: 0,
      views: 1,
      lastReply: new Date().toISOString().slice(0, 16).replace('T', ' '),
      lastUser: currentUser.username,
      content: newTopicContent
    };

    const newPost = {
      id: Date.now(),
      author: currentUser.username,
      content: newTopicContent,
      timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
      avatar: '👤'
    };

    setForumData(prev => ({
      ...prev,
      topics: {
        ...prev.topics,
        [selectedCategory.id]: [...(prev.topics[selectedCategory.id] || []), newTopic]
      },
      posts: {
        ...prev.posts,
        [newTopic.id]: [newPost]
      }
    }));

    setNewTopicTitle('');
    setNewTopicContent('');
    setShowNewTopicForm(false);
  };

  const handleReply = () => {
    if (!newReplyContent.trim()) return;

    const newPost = {
      id: Date.now(),
      author: currentUser.username,
      content: newReplyContent,
      timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
      avatar: '👤'
    };

    setForumData(prev => ({
      ...prev,
      posts: {
        ...prev.posts,
        [selectedThread.id]: [...(prev.posts[selectedThread.id] || []), newPost]
      }
    }));

    setNewReplyContent('');
  };

  const formatTimestamp = (timestamp) => {
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

  const renderCategories = () => (
    <div className="forum-categories">
      <div className="forum-header">
        <h1 className="forum-title">DefCon Belgrade Forum</h1>
        <p className="forum-subtitle">Welcome {currentUser.username}!</p>
      </div>

      <div className="categories-list">
        {forumData.categories.map(category => (
          <div
            key={category.id}
            className="category-card"
            onClick={() => {
              setSelectedCategory(category);
              setCurrentView('topics');
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
              <div className="last-activity-time">{formatTimestamp(category.lastActivity)}</div>
              <div className="last-activity-user">by {category.lastUser}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTopics = () => (
    <div className="forum-topics">
      <div className="topics-header">
        <button
          className="back-button"
          onClick={() => setCurrentView('categories')}
        >
          ← Back to Categories
        </button>
        <h2 className="topics-title">{selectedCategory.name}</h2>
        <button
          className="new-topic-button"
          onClick={() => setShowNewTopicForm(true)}
        >
          + New Topic
        </button>
      </div>

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
            <button onClick={handleCreateTopic} className="create-button">Create Topic</button>
            <button onClick={() => setShowNewTopicForm(false)} className="cancel-button">Cancel</button>
          </div>
        </div>
      )}

      <div className="topics-list">
        {getCurrentTopics().map(topic => (
          <div
            key={topic.id}
            className={`topic-row ${topic.pinned ? 'pinned' : ''}`}
            onClick={() => {
              setSelectedThread(topic);
              setCurrentView('thread');
            }}
          >
            <div className="topic-status">
              {topic.pinned && <span className="pin-icon">📌</span>}
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
      </div>
    </div>
  );

  const renderThread = () => (
    <div className="forum-thread">
      <div className="thread-header">
        <button
          className="back-button"
          onClick={() => setCurrentView('topics')}
        >
          ← Back to {selectedCategory.name}
        </button>
        <h2 className="thread-title">{selectedThread.title}</h2>
      </div>

      <div className="posts-list">
        {getCurrentPosts().map(post => (
          <div key={post.id} className="post">
            <div className="post-author">
              <div className="author-avatar">{post.avatar}</div>
              <div className="author-name">{post.author}</div>
              <div className="post-timestamp">{formatTimestamp(post.timestamp)}</div>
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
        <button onClick={handleReply} className="reply-button">Post Reply</button>
      </div>
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