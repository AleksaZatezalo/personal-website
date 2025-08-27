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

app.post('/api/auth/verify-access', (req, res) => {
  try {
    const { accessCode } = req.body;
    
    if (!accessCode) {
      return res.status(400).json({
        message: 'Access code is required'
      });
    }
    
    // Check if access code is valid
    if (accessCode === '1337') {
      res.json({
        message: 'Access code verified',
        valid: true
      });
    } else {
      res.status(401).json({
        message: 'Invalid access code. Have you read phile on the getting started page?',
        valid: false
      });
    }
  } catch (error) {
    console.error('Access code verification error:', error);
    res.status(500).json({
      message: 'Verification failed',
      error: error.message
    });
  }
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

// Move these route definitions to be at the top level, after your other forum routes
// and BEFORE the /api/forum/init endpoint

// Delete topic (only topic creator can delete)
app.delete('/api/forum/topics/:topicId', authenticateToken, async (req, res) => {
  try {
    const { topicId } = req.params;

    const topic = await Topic.findById(topicId).populate('author');
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    // Check if user owns the topic
    if (topic.author._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only delete your own topics' });
    }

    // Delete all posts in this topic first
    await Post.deleteMany({ topic: topicId });

    // Delete the topic
    await Topic.findByIdAndDelete(topicId);

    res.json({ 
      message: 'Topic and all its posts deleted successfully',
      topicId 
    });
  } catch (error) {
    console.error('Error deleting topic:', error);
    res.status(500).json({ message: 'Failed to delete topic' });
  }
});

// Enhanced delete post endpoint with better topic cleanup
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

    const topicId = post.topic;

    // Check if this is the original post (first post in topic)
    const firstPost = await Post.findOne({ topic: topicId }).sort({ createdAt: 1 });
    const isOriginalPost = firstPost && firstPost._id.toString() === postId;

    if (isOriginalPost) {
      // If deleting the original post, delete the entire topic
      await Post.deleteMany({ topic: topicId });
      await Topic.findByIdAndDelete(topicId);
      
      return res.json({ 
        message: 'Original post deleted - entire topic removed',
        postId,
        topicDeleted: true,
        topicId
      });
    }

    // Delete just this post
    await Post.findByIdAndDelete(postId);

    // Update topic's last post if necessary
    const remainingPosts = await Post.find({ topic: topicId }).sort({ createdAt: -1 });
    const topic = await Topic.findById(topicId);
    
    if (remainingPosts.length > 0) {
      topic.lastPost = remainingPosts[0]._id;
      topic.lastActivity = remainingPosts[0].createdAt;
    } else {
      // This shouldn't happen since we check for original post above
      topic.lastPost = null;
      topic.lastActivity = topic.createdAt;
    }
    
    await topic.save();

    res.json({ 
      message: 'Post deleted successfully',
      postId,
      topicDeleted: false
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Failed to delete post' });
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