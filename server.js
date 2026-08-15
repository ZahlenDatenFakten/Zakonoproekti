import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 80;

app.use(cors());
app.use(express.json());

const CONFIG_FILE = path.join(__dirname, 'config.json');

// Helper to seed config from .env if it doesn't exist
function seedConfig() {
  if (!fs.existsSync(CONFIG_FILE)) {
    const initialConfig = {
      apiKey: process.env.VITE_FIREBASE_API_KEY || '',
      authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || '',
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || '',
      databaseURL: process.env.VITE_FIREBASE_DATABASE_URL || '',
      storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: process.env.VITE_FIREBASE_APP_ID || '',
      isConnected: Boolean(process.env.VITE_FIREBASE_API_KEY && process.env.VITE_FIREBASE_PROJECT_ID)
    };
    try {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(initialConfig, null, 2), 'utf8');
      console.log('Seeded initial config.json from environment variables.');
    } catch (err) {
      console.error('Failed to seed config.json', err);
    }
  }
}

// Seed on startup
seedConfig();

// API Endpoint to GET current config
app.get('/api/config', (req, res) => {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf8');
      res.json(JSON.parse(data));
    } else {
      res.json({ isConnected: false });
    }
  } catch (err) {
    console.error('Error reading config.json:', err);
    res.status(500).json({ error: 'Failed to read config' });
  }
});

// Ensure an admin token exists for security
const TOKEN_FILE = path.join(__dirname, 'admin_token.txt');
let ADMIN_TOKEN = process.env.ADMIN_SECRET_KEY || '';

if (!ADMIN_TOKEN) {
  if (fs.existsSync(TOKEN_FILE)) {
    ADMIN_TOKEN = fs.readFileSync(TOKEN_FILE, 'utf8').trim();
  } else {
    // Generate a random token on first start
    ADMIN_TOKEN = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
    try {
      fs.writeFileSync(TOKEN_FILE, ADMIN_TOKEN, 'utf8');
      console.log('====================================================');
      console.log('SECURITY NOTICE: Generated new admin token for API!');
      console.log(`Your Admin Token is: ${ADMIN_TOKEN}`);
      console.log('You will need this token to change DB settings from the UI.');
      console.log('====================================================');
    } catch (err) {
      console.error('Failed to write admin_token.txt', err);
    }
  }
}

// API Endpoint to POST (update) current config
app.post('/api/config', (req, res) => {
  try {
    const providedToken = req.headers['x-admin-token'];
    if (!providedToken || providedToken !== ADMIN_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized: Invalid Admin Token' });
    }

    const newConfig = req.body;
    // ensure basic shape
    if (typeof newConfig !== 'object') {
      return res.status(400).json({ error: 'Invalid config payload' });
    }
    
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(newConfig, null, 2), 'utf8');
    res.json({ success: true, message: 'Config updated successfully' });
  } catch (err) {
    console.error('Error writing config.json:', err);
    res.status(500).json({ error: 'Failed to save config' });
  }
});

// Serve static files from the React dist folder
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  // Catch-all route for SPA navigation
  app.get('*', (req, res, next) => {
    // Exclude /api routes from catch-all
    if (req.path.startsWith('/api/')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  console.warn(`Warning: Static dist folder not found at ${distPath}`);
  app.get('/', (req, res) => res.send('Frontend build not found. Run npm run build first.'));
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
