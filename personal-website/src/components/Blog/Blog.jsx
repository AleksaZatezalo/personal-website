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
  const [loadingPosts, setLoadingPosts] = useState(true);

  // LIST ALL YOUR MARKDOWN FILES HERE
  // Add any new .md files to this array and they will appear in your blog
  const markdownFiles = [
    'welcome-to-defcon-belgrade.md',
    'what-are-defcon-groups.md',
    'computer-hacking-101.md',
    'getting-connected.md',
    'attending-your-first-meetup.md',
    'giving-a-talk.md'
  ];

  // Auto-discover all markdown files
  useEffect(() => {
    const loadAllPosts = async () => {
      setLoadingPosts(true);
      const discoveredPosts = [];
      let postId = 1;
      
      for (const filename of markdownFiles) {
        try {
          const response = await fetch(`/content/blog/${filename}`);
          if (response.ok) {
            const content = await response.text();
            const metadata = extractMetadataFromMarkdown(content, filename, postId);
            discoveredPosts.push(metadata);
            postId++;
          }
        } catch (error) {
          console.log(`Could not load ${filename}:`, error);
        }
      }
      
      if (discoveredPosts.length === 0) {
        // No files found, show instructions
        setPosts([]);
      } else {
        // Sort posts by date (newest first)
        discoveredPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
        setPosts(discoveredPosts);
      }
      
      setLoadingPosts(false);
    };

    loadAllPosts();
  }, []);

  // Extract metadata from markdown frontmatter or content
  const extractMetadataFromMarkdown = (content, filename, id) => {
    const lines = content.split('\n');
    let metadata = {
      id: id,
      filename: filename,
      title: filename.replace('.md', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      date: new Date().toISOString().split('T')[0],
      author: 'DefCon Belgrade',
      excerpt: '',
      tags: ['blog']
    };

    // Check for frontmatter (YAML between --- lines)
    if (lines[0] === '---') {
      const frontmatterEnd = lines.findIndex((line, index) => index > 0 && line === '---');
      if (frontmatterEnd > 0) {
        const frontmatterLines = lines.slice(1, frontmatterEnd);
        frontmatterLines.forEach(line => {
          const [key, ...valueParts] = line.split(':');
          if (key && valueParts.length > 0) {
            const value = valueParts.join(':').trim().replace(/['"]/g, '');
            switch (key.toLowerCase()) {
              case 'title':
                metadata.title = value;
                break;
              case 'date':
                metadata.date = value;
                break;
              case 'author':
                metadata.author = value;
                break;
              case 'excerpt':
                metadata.excerpt = value;
                break;
              case 'tags':
                metadata.tags = value.split(',').map(tag => tag.trim());
                break;
            }
          }
        });
      }
    }

    // If no excerpt in frontmatter, extract from content
    if (!metadata.excerpt) {
      const contentWithoutFrontmatter = lines.slice(lines[0] === '---' ? 
        lines.findIndex((line, index) => index > 0 && line === '---') + 1 : 0);
      
      const contentLines = contentWithoutFrontmatter.filter(line => 
        !line.startsWith('#') && 
        line.trim().length > 0
      );
      
      if (contentLines.length > 0) {
        metadata.excerpt = contentLines[0].substring(0, 150) + (contentLines[0].length > 150 ? '...' : '');
      }
    }

    return metadata;
  };

  const loadPost = async (post) => {
    setLoading(true);
    try {
      console.log(`Attempting to load: /content/blog/${post.filename}`);
      const response = await fetch(`/content/blog/${post.filename}`);
      console.log(`Response status: ${response.status}, OK: ${response.ok}`);
      
      if (response.ok) {
        const content = await response.text();
        console.log(`Content loaded, length: ${content.length}`);
        setPostContent(content);
      } else {
        console.error(`Failed to load post: ${response.status} ${response.statusText}`);
        setPostContent(`# Post Loading Error\n\nFailed to load ${post.filename}.\n\n**Status:** ${response.status} ${response.statusText}\n\n**Possible solutions:**\n- Check if the file exists at \`public/content/blog/${post.filename}\`\n- Make sure the file has the correct extension (.md)\n- Try refreshing the page\n- Check browser console for more details`);
      }
    } catch (error) {
      console.error('Error loading post:', error);
      setPostContent(`# Network Error\n\nCould not load ${post.filename}.\n\n**Error:** ${error.message}\n\n**Troubleshooting:**\n1. Verify the file exists in \`public/content/blog/${post.filename}\`\n2. Check your network connection\n3. Try refreshing the page\n4. Check browser developer console for details`);
    }
    setLoading(false);
  };

  const selectPost = (post) => {
    setSelectedPost(post);
    loadPost(post);
  };

  const goBack = () => {
    setSelectedPost(null);
    setPostContent('');
  };

  if (loadingPosts) {
    return (
      <div>
        <MatrixNavbar />
        <div className="blog-container">
          <div className="loading">Loading blog posts...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <MatrixNavbar />
      <div className="blog-container">
        {!selectedPost ? (
          // Blog post list
          <div className="blog-list">
            <div className="blog-header">
              <h1 className="blog-title">DefCon Belgrade Blog</h1>
              <p className="blog-subtitle">
                Security research, tutorials, and insights
                {posts.length > 0 && ` • ${posts.length} post${posts.length > 1 ? 's' : ''}`}
              </p>
            </div>
            
            {posts.length === 0 ? (
              <div className="no-posts">
                <h2>No blog posts found</h2>
                <p>To add blog posts:</p>
                <ol style={{textAlign: 'left', maxWidth: '600px', margin: '0 auto'}}>
                  <li>Add your <code>.md</code> files to <code>/public/content/blog/</code></li>
                  <li>Add the filename to the <code>markdownFiles</code> array in <code>Blog.jsx</code></li>
                  <li>Refresh the page to see your posts!</li>
                </ol>
                <br />
                <p>Current files being checked: <code>{markdownFiles.join(', ')}</code></p>
              </div>
            ) : (
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
            )}
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