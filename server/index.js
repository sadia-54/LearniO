require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
app.use(cors({ 
  origin: process.env.CLIENT_URL || 'http://localhost:3000', 
  credentials: true 
}));
app.use(express.json());
app.use(cookieParser());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Passport config
require('./passport');
const passport = require('passport');
app.use(passport.initialize());

// Routes
const authRoutes = require('./routes/authRoutes');
const goalsRoutes = require('./routes/goalsRoutes');
const dailyPlanRoutes = require('./routes/dailyPlanRoutes');
const studyRoutes = require('./routes/studyRoutes');
const progressRoutes = require('./routes/progressRoutes');
const quizRoutes = require('./routes/quizRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api', dailyPlanRoutes);
app.use('/api/study', studyRoutes);
app.use('/api', progressRoutes);
app.use('/api', quizRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 CORS origin: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
  console.log(`🤖 Gemini AI: ${process.env.GEMINI_API_KEY ? 'Configured' : 'Not configured'}`);
});
