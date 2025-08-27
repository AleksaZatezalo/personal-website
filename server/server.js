const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS for development
// CORS Configuration - Allow all origins
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded files
app.use('/uploads', express.static(uploadsDir));

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dc381', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// User Schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  profilePicture: {
    type: String,
    default: null
  },
  tag: {
    type: String,
    enum: [
      '', 'Cryptography', 'Cryptocoins', 'OSCP', 'Networks', 'Web Apps', 'Forensics',
      'Malware Analysis', 'Social Engineering', 'Physical Security',
      'Mobile Security', 'Cloud Security', 'DevSecOps', 'Incident Response',
      'Threat Intelligence', 'Red Team', 'Blue Team', 'Purple Team'
    ],
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token
userSchema.methods.generateAuthToken = function() {
  const payload = {
    userId: this._id,
    username: this.username
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '7d'
  });
};

const User = mongoose.model('User', userSchema);

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Routes

// Register endpoint
app.post('/api/auth/register', upload.single('profilePicture'), async (req, res) => {
  try {
    const { username, password, tag } = req.body;
    
    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({
        message: 'Username and password are required'
      });
    }
    
    // Check if username already exists
    const existingUser = await User.findOne({ username: username.trim().toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        message: 'Username already exists'
      });
    }
    
    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters long'
      });
    }
    
    // Create user object
    const userData = {
      username: username.trim(),
      password,
      tag: tag || ''
    };
    
    // Add profile picture if uploaded
    if (req.file) {
      userData.profilePicture = `/uploads/${req.file.filename}`;
    }
    
    // Create and save user
    const user = new User(userData);
    await user.save();
    
    // Generate token
    const token = user.generateAuthToken();
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    // Send response (exclude sensitive data)
    const userResponse = {
      id: user._id,
      username: user.username,
      profilePicture: user.profilePicture,
      tag: user.tag,
      createdAt: user.createdAt
    };
    
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: userResponse
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    
    // Clean up uploaded file if user creation failed
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({
        message: 'Username already exists'
      });
    }
    
    res.status(500).json({
      message: 'Registration failed',
      error: error.message
    });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        message: 'Username and password are required'
      });
    }
    
    // Find user (case-insensitive username search) - FIXED THE TYPO
    const user = await User.findOne({
      username: { $regex: new RegExp('^' + username.trim() + '$', 'i') },
      isActive: true
    });
    
    if (!user) {
      return res.status(401).json({
        message: 'Invalid username or password'
      });
    }
    
    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Invalid username or password'
      });
    }
    
    // Generate token
    const token = user.generateAuthToken();
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    // Send response (exclude sensitive data)
    const userResponse = {
      id: user._id,
      username: user.username,
      profilePicture: user.profilePicture,
      tag: user.tag,
      lastLogin: user.lastLogin
    };
    
    res.json({
      message: 'Login successful',
      token,
      user: userResponse
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Login failed',
      error: error.message
    });
  }
});

// Get user profile endpoint
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const userResponse = {
      id: req.user._id,
      username: req.user.username,
      profilePicture: req.user.profilePicture,
      tag: req.user.tag,
      createdAt: req.user.createdAt,
      lastLogin: req.user.lastLogin
    };
    
    res.json({ user: userResponse });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

// Logout endpoint (for token blacklisting if needed)
app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  // In a production app, you might want to blacklist the token
  // For now, we'll just send a success response
  res.json({ message: 'Logged out successfully' });
});

// Get all users (admin functionality)
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const users = await User.find({ isActive: true })
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json({ users });
  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    message: 'DC381 API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Forum API Routes - Add these to your server.js file

// Forum Category Schema
const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  icon: {
    type: String,
    default: ''
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Forum Topic Schema
const topicSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    maxlength: 10000
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  lastPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Forum Post Schema
const postSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    maxlength: 10000
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  topic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic',
    required: true
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create models
const Category = mongoose.model('Category', categorySchema);
const Topic = mongoose.model('Topic', topicSchema);
const Post = mongoose.model('Post', postSchema);

// Middleware to update topic activity
topicSchema.pre('save', function(next) {
  this.lastActivity = new Date();
  next();
});

postSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Update topic's last activity and last post
    await Topic.findByIdAndUpdate(this.topic, {
      lastActivity: new Date(),
      lastPost: this._id
    });
  }
  next();
});

// FORUM API ROUTES

// Get all categories with topic and post counts
app.get('/api/forum/categories', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ order: 1 });
    
    const categoriesWithStats = await Promise.all(
      categories.map(async (category) => {
        const topicCount = await Topic.countDocuments({ category: category._id });
        const postCount = await Post.countDocuments({
          topic: { $in: await Topic.find({ category: category._id }).distinct('_id') }
        });
        
        // Get latest activity
        const latestTopic = await Topic.findOne({ category: category._id })
          .sort({ lastActivity: -1 })
          .populate('author', 'username')
          .populate('lastPost');
        
        let lastActivity = null;
        let lastUser = null;
        
        if (latestTopic) {
          lastActivity = latestTopic.lastActivity;
          if (latestTopic.lastPost) {
            const lastPost = await Post.findById(latestTopic.lastPost).populate('author', 'username');
            lastUser = lastPost ? lastPost.author.username : latestTopic.author.username;
          } else {
            lastUser = latestTopic.author.username;
          }
        }

        return {
          id: category._id,
          name: category.name,
          description: category.description,
          icon: category.icon,
          topicCount,
          postCount,
          lastActivity,
          lastUser
        };
      })
    );

    res.json({ categories: categoriesWithStats });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
});

// Get topics in a category
app.get('/api/forum/categories/:categoryId/topics', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const topics = await Topic.find({ category: categoryId })
      .populate('author', 'username tag')
      .populate('lastPost')
      .sort({ isPinned: -1, lastActivity: -1 })
      .skip(skip)
      .limit(limit);

    const topicsWithStats = await Promise.all(
      topics.map(async (topic) => {
        const replyCount = await Post.countDocuments({ topic: topic._id });
        
        let lastUser = topic.author.username;
        let lastReply = topic.createdAt;
        
        if (topic.lastPost) {
          const lastPost = await Post.findById(topic.lastPost).populate('author', 'username');
          if (lastPost) {
            lastUser = lastPost.author.username;
            lastReply = lastPost.createdAt;
          }
        }

        return {
          id: topic._id,
          title: topic.title,
          author: topic.author.username,
          authorTag: topic.author.tag,
          replies: replyCount,
          views: topic.views,
          lastReply,
          lastUser,
          isPinned: topic.isPinned,
          isLocked: topic.isLocked,
          createdAt: topic.createdAt
        };
      })
    );

    const totalTopics = await Topic.countDocuments({ category: categoryId });
    const totalPages = Math.ceil(totalTopics / limit);

    res.json({
      topics: topicsWithStats,
      pagination: {
        currentPage: page,
        totalPages,
        totalTopics,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching topics:', error);
    res.status(500).json({ message: 'Failed to fetch topics' });
  }
});

// Create new topic
app.post('/api/forum/categories/:categoryId/topics', authenticateToken, async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    if (title.length > 200) {
      return res.status(400).json({ message: 'Title must be 200 characters or less' });
    }

    if (content.length > 10000) {
      return res.status(400).json({ message: 'Content must be 10000 characters or less' });
    }

    // Verify category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const topic = new Topic({
      title,
      content,
      author: req.user._id,
      category: categoryId
    });

    await topic.save();

    // Create initial post
    const post = new Post({
      content,
      author: req.user._id,
      topic: topic._id
    });

    await post.save();

    // Update topic with first post
    topic.lastPost = post._id;
    await topic.save();

    const populatedTopic = await Topic.findById(topic._id)
      .populate('author', 'username tag');

    res.status(201).json({
      message: 'Topic created successfully',
      topic: {
        id: populatedTopic._id,
        title: populatedTopic.title,
        author: populatedTopic.author.username,
        authorTag: populatedTopic.author.tag,
        createdAt: populatedTopic.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating topic:', error);
    res.status(500).json({ message: 'Failed to create topic' });
  }
});

// Get posts in a topic
app.get('/api/forum/topics/:topicId/posts', async (req, res) => {
  try {
    const { topicId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Increment view count
    await Topic.findByIdAndUpdate(topicId, { $inc: { views: 1 } });

    const topic = await Topic.findById(topicId)
      .populate('author', 'username tag')
      .populate('category', 'name');

    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    const posts = await Post.find({ topic: topicId })
      .populate('author', 'username tag createdAt')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit);

    const totalPosts = await Post.countDocuments({ topic: topicId });
    const totalPages = Math.ceil(totalPosts / limit);

    res.json({
      topic: {
        id: topic._id,
        title: topic.title,
        author: topic.author.username,
        authorTag: topic.author.tag,
        category: topic.category.name,
        views: topic.views,
        isPinned: topic.isPinned,
        isLocked: topic.isLocked,
        createdAt: topic.createdAt
      },
      posts: posts.map(post => ({
        id: post._id,
        content: post.content,
        author: post.author.username,
        authorTag: post.author.tag,
        isEdited: post.isEdited,
        editedAt: post.editedAt,
        createdAt: post.createdAt
      })),
      pagination: {
        currentPage: page,
        totalPages,
        totalPosts,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Failed to fetch posts' });
  }
});

// Create new post (reply)
app.post('/api/forum/topics/:topicId/posts', authenticateToken, async (req, res) => {
  try {
    const { topicId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Content is required' });
    }

    if (content.length > 10000) {
      return res.status(400).json({ message: 'Content must be 10000 characters or less' });
    }

    const topic = await Topic.findById(topicId);
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    if (topic.isLocked) {
      return res.status(403).json({ message: 'Topic is locked' });
    }

    const post = new Post({
      content: content.trim(),
      author: req.user._id,
      topic: topicId
    });

    await post.save();

    const populatedPost = await Post.findById(post._id)
      .populate('author', 'username tag');

    res.status(201).json({
      message: 'Post created successfully',
      post: {
        id: populatedPost._id,
        content: populatedPost.content,
        author: populatedPost.author.username,
        authorTag: populatedPost.author.tag,
        createdAt: populatedPost.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Failed to create post' });
  }
});

// Update post (edit)
app.put('/api/forum/posts/:postId', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Content is required' });
    }

    if (content.length > 10000) {
      return res.status(400).json({ message: 'Content must be 10000 characters or less' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user owns the post
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only edit your own posts' });
    }

    post.content = content.trim();
    post.isEdited = true;
    post.editedAt = new Date();
    await post.save();

    res.json({
      message: 'Post updated successfully',
      post: {
        id: post._id,
        content: post.content,
        isEdited: post.isEdited,
        editedAt: post.editedAt
      }
    });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ message: 'Failed to update post' });
  }
});

// Delete post
app.delete('/api/forum/posts/:postId', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user owns the post
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only delete your own posts' });
    }

    await Post.findByIdAndDelete(postId);

    // If this was the last post, update topic's lastPost
    const remainingPosts = await Post.find({ topic: post.topic }).sort({ createdAt: -1 });
    const topic = await Topic.findById(post.topic);
    
    if (remainingPosts.length > 0) {
      topic.lastPost = remainingPosts[0]._id;
      topic.lastActivity = remainingPosts[0].createdAt;
    } else {
      topic.lastPost = null;
      topic.lastActivity = topic.createdAt;
    }
    
    await topic.save();

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Failed to delete post' });
  }
});

// Search topics and posts
app.get('/api/forum/search', async (req, res) => {
  try {
    const { q, category, page = 1, limit = 20 } = req.query;
    
    if (!q || q.trim().length < 3) {
      return res.status(400).json({ message: 'Search query must be at least 3 characters' });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const searchRegex = new RegExp(q.trim(), 'i');
    
    let topicFilter = {
      $or: [
        { title: searchRegex },
        { content: searchRegex }
      ]
    };
    
    if (category) {
      topicFilter.category = category;
    }

    const topics = await Topic.find(topicFilter)
      .populate('author', 'username tag')
      .populate('category', 'name')
      .sort({ lastActivity: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalResults = await Topic.countDocuments(topicFilter);
    const totalPages = Math.ceil(totalResults / parseInt(limit));

    res.json({
      results: topics.map(topic => ({
        id: topic._id,
        title: topic.title,
        author: topic.author.username,
        category: topic.category.name,
        lastActivity: topic.lastActivity,
        views: topic.views
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalResults,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      },
      searchQuery: q.trim()
    });
  } catch (error) {
    console.error('Error searching forum:', error);
    res.status(500).json({ message: 'Search failed' });
  }
});

// Initialize default categories (run once)
app.post('/api/forum/init', async (req, res) => {
  try {
    const existingCategories = await Category.countDocuments();
    if (existingCategories > 0) {
      return res.json({ message: 'Categories already initialized' });
    }

    const defaultCategories = [
      {
        name: 'General Discussion',
        description: 'General cybersecurity topics and community discussions',
        icon: ' ',
        order: 1
      },
      {
        name: 'Vulnerability Research',
        description: 'Share your security research and vulnerability discoveries',
        icon: ' ',
        order: 2
      },
      {
        name: 'CTF & Challenges',
        description: 'Capture The Flag discussions, writeups, and practice',
        icon: ' ',
        order: 3
      },
      {
        name: 'Tools & Tutorials',
        description: 'Share security tools, scripts, and learning resources',
        icon: ' ',
        order: 4
      },
      {
        name: 'Job Board',
        description: 'Security job postings and career discussions',
        icon: ' ',
        order: 5
      },
      {
        name: 'Meetup Planning',
        description: 'Organize events, suggest topics, and coordinate meetups',
        icon: ' ',
        order: 6
      }
    ];

    await Category.insertMany(defaultCategories);
    
    res.status(201).json({ 
      message: 'Forum categories initialized successfully',
      categories: defaultCategories.length 
    });
  } catch (error) {
    console.error('Error initializing forum:', error);
    res.status(500).json({ message: 'Failed to initialize forum' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
    }
  }
  
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`DC381 Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`MongoDB URI: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/dc381'}`);
});

const fs = require('fs').promises;
const matter = require('gray-matter'); // npm install gray-matter

// Blog post routes
const BLOG_POSTS_DIR = path.join(__dirname, 'blog-posts');

// Ensure blog posts directory exists
const initializeBlogDirectory = async () => {
  try {
    await fs.access(BLOG_POSTS_DIR);
  } catch {
    await fs.mkdir(BLOG_POSTS_DIR, { recursive: true });
    console.log('Created blog-posts directory');
  }
};

// Initialize blog directory on server start
initializeBlogDirectory();

// Get all blog posts metadata
app.get('/api/blog/posts', async (req, res) => {
  try {
    const files = await fs.readdir(BLOG_POSTS_DIR);
    const markdownFiles = files.filter(file => file.endsWith('.md'));
    
    const posts = await Promise.all(
      markdownFiles.map(async (filename) => {
        const filePath = path.join(BLOG_POSTS_DIR, filename);
        const fileContent = await fs.readFile(filePath, 'utf8');
        const { data, content } = matter(fileContent);
        
        // Generate excerpt if not provided
        let excerpt = data.excerpt;
        if (!excerpt) {
          const contentLines = content.split('\n').filter(line => 
            !line.startsWith('#') && line.trim().length > 0
          );
          excerpt = contentLines[0] ? 
            (contentLines[0].substring(0, 150) + (contentLines[0].length > 150 ? '...' : '')) : 
            'No excerpt available';
        }
        
        return {
          id: filename.replace('.md', ''),
          filename,
          title: data.title || filename.replace('.md', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          date: data.date || new Date().toISOString().split('T')[0],
          author: data.author || 'DefCon Belgrade',
          excerpt,
          tags: data.tags || ['blog'],
          readTime: Math.ceil(content.length / 1000) // Rough reading time estimate
        };
      })
    );
    
    // Sort by date (newest first)
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    res.json({ 
      posts,
      total: posts.length
    });
    
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    res.status(500).json({ 
      message: 'Failed to fetch blog posts',
      error: error.message 
    });
  }
});

// Get single blog post content
app.get('/api/blog/posts/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const filename = `${postId}.md`;
    const filePath = path.join(BLOG_POSTS_DIR, filename);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ 
        message: 'Blog post not found' 
      });
    }
    
    const fileContent = await fs.readFile(filePath, 'utf8');
    const { data, content } = matter(fileContent);
    
    const post = {
      id: postId,
      filename,
      title: data.title || postId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      date: data.date || new Date().toISOString().split('T')[0],
      author: data.author || 'DefCon Belgrade',
      tags: data.tags || ['blog'],
      content,
      metadata: data
    };
    
    res.json({ post });
    
  } catch (error) {
    console.error('Error fetching blog post:', error);
    res.status(500).json({ 
      message: 'Failed to fetch blog post',
      error: error.message 
    });
  }
});

// Admin endpoint to create/update blog posts (authenticated)
app.post('/api/blog/posts', authenticateToken, async (req, res) => {
  try {
    const { 
      filename, 
      title, 
      content, 
      author = 'DefCon Belgrade',
      tags = ['blog'],
      excerpt
    } = req.body;
    
    if (!filename || !title || !content) {
      return res.status(400).json({
        message: 'Filename, title, and content are required'
      });
    }
    
    // Ensure filename ends with .md
    const safeFilename = filename.endsWith('.md') ? filename : `${filename}.md`;
    const filePath = path.join(BLOG_POSTS_DIR, safeFilename);
    
    // Create frontmatter
    const frontmatter = {
      title,
      date: new Date().toISOString().split('T')[0],
      author,
      tags,
      ...(excerpt && { excerpt })
    };
    
    // Combine frontmatter and content
    const fileContent = matter.stringify(content, frontmatter);
    
    await fs.writeFile(filePath, fileContent, 'utf8');
    
    res.status(201).json({
      message: 'Blog post saved successfully',
      filename: safeFilename,
      id: safeFilename.replace('.md', '')
    });
    
  } catch (error) {
    console.error('Error saving blog post:', error);
    res.status(500).json({
      message: 'Failed to save blog post',
      error: error.message
    });
  }
});

// Admin endpoint to delete blog posts (authenticated)
app.delete('/api/blog/posts/:postId', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const filename = `${postId}.md`;
    const filePath = path.join(BLOG_POSTS_DIR, filename);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ 
        message: 'Blog post not found' 
      });
    }
    
    await fs.unlink(filePath);
    
    res.json({ 
      message: 'Blog post deleted successfully',
      id: postId
    });
    
  } catch (error) {
    console.error('Error deleting blog post:', error);
    res.status(500).json({
      message: 'Failed to delete blog post',
      error: error.message
    });
  }
});

// ================================
// CLIENT-SIDE BLOG COMPONENT
// ================================

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import MatrixNavbar from '../MatrixNavbar';
import 'highlight.js/styles/atom-one-dark.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Blog = () => {
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [postContent, setPostContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [postLoading, setPostLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all blog posts metadata
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`${API_BASE_URL}/api/blog/posts`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        setPosts(data.posts || []);
        
      } catch (error) {
        console.error('Error fetching posts:', error);
        setError('Failed to load blog posts. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // Fetch individual post content
  const loadPost = async (post) => {
    try {
      setPostLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/api/blog/posts/${post.id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Blog post not found');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setPostContent(data.post.content);
      
    } catch (error) {
      console.error('Error fetching post content:', error);
      setError('Failed to load blog post content. Please try again later.');
      setPostContent(`# Error Loading Post\n\nSorry, we couldn't load "${post.title}" at this time.`);
    } finally {
      setPostLoading(false);
    }
  };

  const selectPost = (post) => {
    setSelectedPost(post);
    loadPost(post);
  };

  const goBack = () => {
    setSelectedPost(null);
    setPostContent('');
    setError(null);
  };

  // Loading state
  if (loading) {
    return (
      <div>
        <MatrixNavbar />
        <div className="blog-container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading blog posts...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !selectedPost) {
    return (
      <div>
        <MatrixNavbar />
        <div className="blog-container">
          <div className="error-state">
            <h2>Oops! Something went wrong</h2>
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="retry-button"
            >
              Try Again
            </button>
          </div>
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
              <h1 className="blog-title">Getting Started With DC381</h1>
              <p className="blog-subtitle">
                Learn what it means to join a Defcon Group
                {posts.length > 0 && ` in ${posts.length} post${posts.length > 1 ? 's' : ''}`}
              </p>
            </div>
            
            {posts.length === 0 ? (
              <div className="empty-state">
                <h3>No blog posts available</h3>
                <p>Check back soon for new content!</p>
              </div>
            ) : (
              <div className="posts-grid">
                {posts.map(post => (
                  <article 
                    key={post.id} 
                    className="post-card" 
                    onClick={() => selectPost(post)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && selectPost(post)}
                  >
                    <div className="post-header">
                      <h2 className="post-title">{post.title}</h2>
                      <div className="post-meta">
                        <span className="post-date">{post.date}</span>
                        <span className="post-author">by {post.author}</span>
                        {post.readTime && (
                          <span className="read-time">{post.readTime} min read</span>
                        )}
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
            <button 
              className="back-button" 
              onClick={goBack}
              aria-label="Go back to blog list"
            >
              ← Back
            </button>
            
            <div className="post-header-full">
              <h1 className="post-title-full">{selectedPost.title}</h1>
              <div className="post-meta-full">
                <span className="post-date">{selectedPost.date}</span>
                <span className="post-author">by {selectedPost.author}</span>
                {selectedPost.readTime && (
                  <span className="read-time">{selectedPost.readTime} min read</span>
                )}
              </div>
              <div className="post-tags">
                {selectedPost.tags.map(tag => (
                  <span key={tag} className="tag">#{tag}</span>
                ))}
              </div>
            </div>
            
            <div className="post-content">
              {postLoading ? (
                <div className="loading">
                  <div className="loading-spinner"></div>
                  <p>Loading post...</p>
                </div>
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
              
              {error && (
                <div className="error-message">
                  <p>{error}</p>
                  <button 
                    onClick={() => loadPost(selectedPost)}
                    className="retry-button"
                  >
                    Retry
                  </button>
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

// ================================
// BLOG MANAGEMENT UTILITY
// ================================

// blog-migration.js - Run this once to migrate existing embedded posts

const fs = require('fs').promises;
const path = require('path');
const matter = require('gray-matter');

const EMBEDDED_POSTS = {
  // Your existing embedded posts object here
  'welcome-to-defcon-belgrade.md': `---
title: Welcome to DefCon Belgrade
date: 2024-01-15
author: DefCon Belgrade
tags: [introduction, community, cybersecurity]
excerpt: Welcome to our cybersecurity community! We're excited to share knowledge, research, and insights with the security community.
---

# Welcome to DefCon Belgrade

Welcome to our cybersecurity community! We're excited to share knowledge, research, and insights with the security community.

## What We Cover

- **Vulnerability Research**: Latest CVE discoveries
- **Penetration Testing**: Real-world techniques and tools  
- **Security News**: Industry updates and analysis

## Join Our Community

It does not matter if you are a computer hacker, a programer, a lawyer or business owner. Everyone with an interest in security is free to attend. We accept lurkers, form posters, event attendees, and speakers so long as you engage with the community.`,

  // Add all other posts with proper frontmatter...
};

const migrateBlogPosts = async () => {
  const blogDir = path.join(__dirname, 'blog-posts');
  
  try {
    await fs.access(blogDir);
  } catch {
    await fs.mkdir(blogDir, { recursive: true });
    console.log('Created blog-posts directory');
  }
  
  for (const [filename, content] of Object.entries(EMBEDDED_POSTS)) {
    const filePath = path.join(blogDir, filename);
    await fs.writeFile(filePath, content, 'utf8');
    console.log(`Migrated ${filename}`);
  }
  
  console.log('Migration complete!');
};

// Uncomment to run migration
// migrateBlogPosts().catch(console.error);