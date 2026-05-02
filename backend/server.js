require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app = express();

// Allow requests from the frontend URL
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));

// Parse JSON request bodies
app.use(express.json());

// Mount all route groups
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/projects',  require('./routes/projects'));
app.use('/api/tasks',     require('./routes/tasks'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/comments',  require('./routes/comments'));
app.use('/api/subtasks',  require('./routes/subtasks'));
app.use('/api/activity',  require('./routes/activity'));

// Health check
app.get('/health', (req, res) => res.send('OK'));

// --- Production: serve the React frontend ---
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the frontend build
  app.use(express.static(path.join(__dirname, '..', 'frontend', 'dist')));

  // For any route that doesn't match an API route, serve index.html (React SPA)
  app.get('{*path}', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'dist', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
