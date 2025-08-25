import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import MatrixNavbar from '../MatrixNavbar';
// Import a dark theme that works well with Matrix aesthetic
import 'highlight.js/styles/atom-one-dark.css';

const Blog = () => {
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [postContent, setPostContent] = useState('');
  const [loading, setLoading] = useState(false);

  // Sample blog posts metadata (in real app, fetch from API or build process)
  const blogPosts = [
    {
      id: 1,
      title: 'Welcome to DefCon Belgrade',
      filename: 'welcome-to-defcon-belgrade.md',
      date: '2024-01-15',
      author: 'DefCon Team',
      excerpt: 'Welcome to our cybersecurity community blog!',
      tags: ['announcement', 'community']
    }
  ];

  useEffect(() => {
    setPosts(blogPosts);
  }, []);

  const loadPost = async (filename) => {
    setLoading(true);
    try {
      // In a real app, you'd fetch from your server or use a build process
      // For now, we'll use a placeholder
      const response = await fetch(`/content/blog/${filename}`);
      if (response.ok) {
        const content = await response.text();
        setPostContent(content);
      } else {
        // Fallback content for demo
        setPostContent(generateDemoContent(filename));
      }
    } catch (error) {
      console.log('Using demo content for:', filename);
      setPostContent(generateDemoContent(filename));
    }
    setLoading(false);
  };

  const generateDemoContent = (filename) => {
    const demoContent = {
      'welcome-to-defcon-belgrade.md': `# Welcome to DefCon Belgrade

Welcome to our cybersecurity community! We're excited to share knowledge, research, and insights with the security community.

## What We Cover

- **Vulnerability Research**: Latest CVE discoveries
- **Penetration Testing**: Real-world techniques and tools  
- **CTF Writeups**: Solutions and methodologies
- **Security News**: Industry updates and analysis

## Join Our Community

Come to our biweekly events every other Wednesday at 7 PM!

\`\`\`javascript
// Example exploit code
function exploit() {
  console.log("Always hack ethically!");
}
\`\`\`

Stay tuned for more content!`
    };

    return demoContent[filename] || '# Post not found\n\nThis post is not available yet.';
  };

  const selectPost = (post) => {
    setSelectedPost(post);
    loadPost(post.filename);
  };

  const goBack = () => {
    setSelectedPost(null);
    setPostContent('');
  };

  return (
    <div>
      <MatrixNavbar />
      <div className="blog-container">
        {!selectedPost ? (
          // Blog post list
          <div className="blog-list">
            <div className="blog-header">
              <h1 className="blog-title">DefCon Belgrade Blog</h1>
              <p className="blog-subtitle">Security research, tutorials, and insights</p>
            </div>
            
            <div className="posts-grid">
              {posts.map(post => (
                <article key={post.id} className="post-card" onClick={() => selectPost(post)}>
                  <div className="post-header">
                    <h2 className="post-title">{post.title}</h2>
                    <div className="post-meta">
                      <span className="post-date">{post.date}</span>
                      <span className="post-author">by {post.author}</span>
                    </div>
                  </div>
                  
                  <p className="post-excerpt">{post.excerpt}</p>
                  
                  <div className="post-tags">
                    {post.tags.map(tag => (
                      <span key={tag} className="tag">#{tag}</span>
                    ))}
                  </div>
                  
                  <div className="read-more">
                    <span>Read more →</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : (
          // Selected blog post
          <div className="blog-post">
            <button className="back-button" onClick={goBack}>
              ← Back to Blog
            </button>
            
            <div className="post-content">
              {loading ? (
                <div className="loading">Loading post...</div>
              ) : (
                <div className="markdown-content">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight, rehypeRaw]}
                  >
                    {postContent}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Blog;