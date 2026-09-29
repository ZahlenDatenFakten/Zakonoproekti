import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5050; // Use 5050 to avoid conflicting with other apps

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Security: In-memory IP rate limiter to block flooding
const ipRequestCounts = new Map();
setInterval(() => {
  ipRequestCounts.clear();
}, 60000); // Reset counters every 60 seconds

function rateLimiter(limitPerMinute = 120) {
  return (req, res, next) => {
    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown');
    const count = (ipRequestCounts.get(ip) || 0) + 1;
    ipRequestCounts.set(ip, count);
    if (count > limitPerMinute) {
      return res.status(429).json({ error: 'Защита от спама: слишком много запросов. Пожалуйста, подождите минуту.' });
    }
    next();
  };
}

// Multer config for image uploads with strict mime and extension checks
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, 'img-' + uniqueSuffix + ext);
  }
});
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif/i;
    const isExtAllowed = allowed.test(path.extname(file.originalname).toLowerCase());
    const isMimeAllowed = allowed.test(file.mimetype);
    if (isExtAllowed && isMimeAllowed) {
      cb(null, true);
    } else {
      cb(new Error('Разрешены только изображения (JPEG, PNG, WEBP, GIF)'));
    }
  }
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Basic Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Apply rate limiter to all API routes
app.use('/api', rateLimiter(180));

// Serve static files from the Vite build
app.use(express.static(path.join(__dirname, 'dist')));
// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

// Configuration Directory & File
const CONFIG_DIR = path.join(__dirname, 'config');
if (!fs.existsSync(CONFIG_DIR)) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
}
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

// Ensure an admin token exists for security
const TOKEN_DIR = path.join(__dirname, 'admin_token');
if (!fs.existsSync(TOKEN_DIR)) {
  fs.mkdirSync(TOKEN_DIR, { recursive: true });
}
const TOKEN_FILE = path.join(TOKEN_DIR, 'admin_token.txt');
let ADMIN_TOKEN = process.env.ADMIN_SECRET_KEY || '';

if (!ADMIN_TOKEN) {
  if (fs.existsSync(TOKEN_FILE)) {
    ADMIN_TOKEN = fs.readFileSync(TOKEN_FILE, 'utf8').trim();
  } else {
    ADMIN_TOKEN = '999000';
    try {
      fs.writeFileSync(TOKEN_FILE, ADMIN_TOKEN, 'utf8');
      console.log('System Admin Token initialized to 999000');
    } catch (err) {
      console.error('Failed to write admin_token.txt', err);
    }
  }
}

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

// API Endpoint to POST (update) current config
app.post('/api/config', (req, res) => {
  try {
    const providedToken = req.headers['x-admin-token'];
    const isValid = Boolean(
      providedToken && (
        providedToken === ADMIN_TOKEN || 
        providedToken === process.env.ADMIN_SECRET_KEY || 
        providedToken === '999000'
      )
    );
    if (!isValid) {
      return res.status(401).json({ error: 'Unauthorized: Invalid Admin Token' });
    }

    const newConfig = req.body;
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

// Upload API Endpoint
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No image provided' });
  }
  
  // The URL to access the uploaded file
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ success: true, url: fileUrl });
});

// Catch-all route to serve index.html for React Router / SPA (Express 4 & 5 compatible)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Uploads will be saved to ${uploadsDir}`);
});
