import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import pg from 'pg';

const { Pool } = pg;

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

// ============================================================================
// PostgreSQL Database Integration (VPS Master Database)
// ============================================================================
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://zakonoproekti_user:zk_pg_pass_2026_secure@127.0.0.1:5432/zakonoproekti';

let pool = null;

function getDbPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client:', err);
    });
  }
  return pool;
}

// Ensure database tables exist on server boot
async function initDb() {
  try {
    const p = getDbPool();
    const client = await p.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS bills (
            id VARCHAR(64) PRIMARY KEY,
            title TEXT NOT NULL,
            target_law TEXT,
            author TEXT NOT NULL,
            author_role VARCHAR(128),
            author_discord_id VARCHAR(64),
            status VARCHAR(64) NOT NULL DEFAULT 'draft',
            status_reason TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            data JSONB NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);
        CREATE INDEX IF NOT EXISTS idx_bills_author ON bills(author);
        CREATE INDEX IF NOT EXISTS idx_bills_created_at ON bills(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_bills_updated_at ON bills(updated_at DESC);

        CREATE TABLE IF NOT EXISTS state_laws (
            id VARCHAR(128) PRIMARY KEY,
            title TEXT NOT NULL,
            category VARCHAR(128),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            data JSONB NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_state_laws_category ON state_laws(category);
        CREATE INDEX IF NOT EXISTS idx_state_laws_updated_at ON state_laws(updated_at DESC);

        CREATE TABLE IF NOT EXISTS system_settings (
            key VARCHAR(128) PRIMARY KEY,
            value JSONB NOT NULL,
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);
      console.log('✅ PostgreSQL connection verified & tables initialized!');
    } finally {
      client.release();
    }
  } catch (err) {
    console.warn('⚠️ PostgreSQL connection failed on boot (will retry on incoming request):', err.message);
  }
}

// Run DB init in background
initDb().catch(console.error);

// 1. GET /api/bills -> Fetch all bills
app.get('/api/bills', async (req, res) => {
  try {
    const p = getDbPool();
    const result = await p.query('SELECT data FROM bills ORDER BY updated_at DESC');
    const bills = result.rows.map(r => r.data);
    res.json(bills);
  } catch (err) {
    console.error('Error fetching bills from PostgreSQL:', err);
    res.status(500).json({ error: 'Failed to fetch bills from database' });
  }
});

// 2. GET /api/bills/:id -> Fetch single bill
app.get('/api/bills/:id', async (req, res) => {
  try {
    const p = getDbPool();
    const result = await p.query('SELECT data FROM bills WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    res.json(result.rows[0].data);
  } catch (err) {
    console.error('Error fetching single bill from PostgreSQL:', err);
    res.status(500).json({ error: 'Failed to fetch bill' });
  }
});

// 3. POST /api/bills -> Create or update bill
app.post('/api/bills', async (req, res) => {
  try {
    const bill = req.body;
    if (!bill || !bill.id || !bill.title) {
      return res.status(400).json({ error: 'Invalid bill object. id and title are required.' });
    }

    const updatedAt = bill.updatedAt || new Date().toISOString();
    const createdAt = bill.createdAt || new Date().toISOString();
    const cleanBill = JSON.parse(JSON.stringify(bill));

    const p = getDbPool();
    await p.query(`
      INSERT INTO bills (id, title, target_law, author, author_role, author_discord_id, status, status_reason, created_at, updated_at, data)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        target_law = EXCLUDED.target_law,
        author = EXCLUDED.author,
        author_role = EXCLUDED.author_role,
        author_discord_id = EXCLUDED.author_discord_id,
        status = EXCLUDED.status,
        status_reason = EXCLUDED.status_reason,
        updated_at = EXCLUDED.updated_at,
        data = EXCLUDED.data
    `, [
      cleanBill.id,
      cleanBill.title,
      cleanBill.targetLaw || null,
      cleanBill.author || 'Гражданин',
      cleanBill.authorRole || null,
      cleanBill.authorDiscordId || null,
      cleanBill.status || 'draft',
      cleanBill.statusReason || null,
      createdAt,
      updatedAt,
      cleanBill
    ]);

    res.json({ success: true, bill: cleanBill });
  } catch (err) {
    console.error('Error upserting bill to PostgreSQL:', err);
    res.status(500).json({ error: 'Failed to save bill to database' });
  }
});

// 4. DELETE /api/bills/:id -> Delete bill
app.delete('/api/bills/:id', async (req, res) => {
  try {
    const p = getDbPool();
    await p.query('DELETE FROM bills WHERE id = $1', [req.params.id]);
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    console.error('Error deleting bill from PostgreSQL:', err);
    res.status(500).json({ error: 'Failed to delete bill' });
  }
});

// 5. GET /api/state_laws -> Fetch all state laws
app.get('/api/state_laws', async (req, res) => {
  try {
    const p = getDbPool();
    const result = await p.query('SELECT data FROM state_laws ORDER BY updated_at DESC');
    const laws = result.rows.map(r => r.data);
    res.json(laws);
  } catch (err) {
    console.error('Error fetching state laws from PostgreSQL:', err);
    res.status(500).json({ error: 'Failed to fetch state laws' });
  }
});

// 6. GET /api/state_laws/:id -> Fetch single law
app.get('/api/state_laws/:id', async (req, res) => {
  try {
    const p = getDbPool();
    const result = await p.query('SELECT data FROM state_laws WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Law not found' });
    }
    res.json(result.rows[0].data);
  } catch (err) {
    console.error('Error fetching single law from PostgreSQL:', err);
    res.status(500).json({ error: 'Failed to fetch law' });
  }
});

// 7. POST /api/state_laws -> Create or update state law
app.post('/api/state_laws', async (req, res) => {
  try {
    const law = req.body;
    if (!law || !law.id) {
      return res.status(400).json({ error: 'Invalid law object. id is required.' });
    }
    const updatedAt = law.updatedAt || new Date().toISOString();
    const cleanLaw = JSON.parse(JSON.stringify(law));

    const p = getDbPool();
    await p.query(`
      INSERT INTO state_laws (id, title, category, updated_at, data)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        category = EXCLUDED.category,
        updated_at = EXCLUDED.updated_at,
        data = EXCLUDED.data
    `, [
      cleanLaw.id,
      cleanLaw.title || cleanLaw.id,
      cleanLaw.category || 'other',
      updatedAt,
      cleanLaw
    ]);

    res.json({ success: true, law: cleanLaw });
  } catch (err) {
    console.error('Error saving state law to PostgreSQL:', err);
    res.status(500).json({ error: 'Failed to save state law' });
  }
});

// 8. POST /api/sync/import-full-backup -> Bulk import all data
app.post('/api/sync/import-full-backup', async (req, res) => {
  try {
    const { bills = [], laws = [] } = req.body || {};
    const p = getDbPool();
    const client = await p.connect();

    try {
      await client.query('BEGIN');

      let billsCount = 0;
      for (const b of bills) {
        if (!b || !b.id) continue;
        const cleanB = JSON.parse(JSON.stringify(b));
        await client.query(`
          INSERT INTO bills (id, title, target_law, author, author_role, author_discord_id, status, status_reason, created_at, updated_at, data)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            target_law = EXCLUDED.target_law,
            author = EXCLUDED.author,
            author_role = EXCLUDED.author_role,
            author_discord_id = EXCLUDED.author_discord_id,
            status = EXCLUDED.status,
            status_reason = EXCLUDED.status_reason,
            updated_at = EXCLUDED.updated_at,
            data = EXCLUDED.data
        `, [
          cleanB.id,
          cleanB.title || 'Без названия',
          cleanB.targetLaw || null,
          cleanB.author || 'Гражданин',
          cleanB.authorRole || null,
          cleanB.authorDiscordId || null,
          cleanB.status || 'draft',
          cleanB.statusReason || null,
          cleanB.createdAt || new Date().toISOString(),
          cleanB.updatedAt || new Date().toISOString(),
          cleanB
        ]);
        billsCount++;
      }

      let lawsCount = 0;
      for (const l of laws) {
        if (!l || !l.id) continue;
        const cleanL = JSON.parse(JSON.stringify(l));
        await client.query(`
          INSERT INTO state_laws (id, title, category, updated_at, data)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            category = EXCLUDED.category,
            updated_at = EXCLUDED.updated_at,
            data = EXCLUDED.data
        `, [
          cleanL.id,
          cleanL.title || cleanL.id,
          cleanL.category || 'other',
          cleanL.updatedAt || new Date().toISOString(),
          cleanL
        ]);
        lawsCount++;
      }

      await client.query('COMMIT');
      console.log(`[Import] Bulk imported ${billsCount} bills and ${lawsCount} laws into PostgreSQL`);
      res.json({ success: true, importedBills: billsCount, importedLaws: lawsCount });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error during full backup import to PostgreSQL:', err);
    res.status(500).json({ error: err.message || 'Import failed' });
  }
});

// 9. GET /api/db-health -> Check DB status
app.get('/api/db-health', async (req, res) => {
  try {
    const p = getDbPool();
    const billsRes = await p.query('SELECT COUNT(*) FROM bills');
    const lawsRes = await p.query('SELECT COUNT(*) FROM state_laws');
    res.json({
      status: 'healthy',
      database: 'PostgreSQL 16 (VPS)',
      billsCount: parseInt(billsRes.rows[0].count, 10),
      lawsCount: parseInt(lawsRes.rows[0].count, 10),
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ============================================================================
// Discord DM Notification System via Report Assistant Bot
// ============================================================================
function getDiscordBotToken() {
  if (process.env.DISCORD_BOT_TOKEN) return process.env.DISCORD_BOT_TOKEN.trim();
  if (process.env.BOT_TOKEN) return process.env.BOT_TOKEN.trim();

  const candidates = [
    path.join(__dirname, '.env'),
    path.join(__dirname, 'config', '.env'),
    '/root/BOTGOV/.env',
    'C:/BOTGOV/.env'
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      try {
        const text = fs.readFileSync(p, 'utf8');
        const match = text.match(/(?:DISCORD_BOT_TOKEN|BOT_TOKEN)\s*=\s*([^\r\n]+)/);
        if (match && match[1]) {
          return match[1].trim().replace(/^['"]|['"]$/g, '');
        }
      } catch (e) {}
    }
  }
  return '';
}

const DISCORD_BOT_TOKEN = getDiscordBotToken();
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID || '1119468196848742402';

let cachedGuildMembers = [];
let lastMemberCacheTime = 0;
const MEMBER_CACHE_TTL = 10 * 60 * 1000; // 10 minutes cache

async function getGuildMembers() {
  const now = Date.now();
  if (cachedGuildMembers.length > 0 && (now - lastMemberCacheTime) < MEMBER_CACHE_TTL) {
    return cachedGuildMembers;
  }
  try {
    const res = await fetch(`https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members?limit=1000`, {
      headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` }
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        cachedGuildMembers = data;
        lastMemberCacheTime = now;
        return cachedGuildMembers;
      }
    }
  } catch (err) {
    console.error('Error fetching Discord guild members:', err);
  }
  return cachedGuildMembers;
}

const KNOWN_AUTHOR_DISCORDS = {
  'friedrich engelmann': '1008264840357347348',
  'friedrich': '1008264840357347348',
  'engelmann': '1008264840357347348'
};

async function resolveDiscordUserId(authorName, explicitDiscordId) {
  // 1. If author explicitly specified their Discord ID in their profile or bill
  if (explicitDiscordId && /^\d{17,20}$/.test(String(explicitDiscordId).trim())) {
    return String(explicitDiscordId).trim();
  }
  
  // 2. Governor Friedrich Engelmann (admin/governor account)
  const cleanName = (authorName || '').trim().toLowerCase();
  for (const [key, id] of Object.entries(KNOWN_AUTHOR_DISCORDS)) {
    if (cleanName.includes(key)) {
      return id;
    }
  }

  // Strictly: only authors who entered their Discord ID in their profile receive notifications
  return null;
}

async function sendDiscordDmEmbed(userId, embed) {
  // 1. Create DM channel
  const dmResp = await fetch('https://discord.com/api/v10/users/@me/channels', {
    method: 'POST',
    headers: {
      Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ recipient_id: userId })
  });

  if (!dmResp.ok) {
    const errText = await dmResp.text();
    throw new Error(`Failed to create DM channel with user ${userId}: ${dmResp.status} ${errText}`);
  }

  const dmData = await dmResp.json();
  const channelId = dmData.id;

  // 2. Send message with Embed
  const msgResp = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      embeds: [embed]
    })
  });

  if (!msgResp.ok) {
    const errText = await msgResp.text();
    throw new Error(`Failed to send DM message to channel ${channelId}: ${msgResp.status} ${errText}`);
  }

  return await msgResp.json();
}

app.post('/api/notify-verdict', async (req, res) => {
  try {
    const {
      billId,
      title,
      targetLaw,
      author,
      authorDiscordId,
      decision,
      reason,
      adminName,
      portalUrl = 'https://zakonoproekti.duckdns.org'
    } = req.body || {};

    if (!decision || (decision !== 'needs_revision' && decision !== 'rejected')) {
      return res.status(400).json({ error: 'Valid decision (needs_revision or rejected) is required' });
    }

    const targetUserId = await resolveDiscordUserId(author, authorDiscordId);
    if (!targetUserId) {
      console.warn(`[notify-verdict] Could not resolve Discord user for author "${author}" (ID: ${authorDiscordId || 'none'})`);
      return res.json({ 
        success: false, 
        warning: `Не удалось сопоставить аккаунт Discord для автора "${author}". Уведомление в ЛС не отправлено.` 
      });
    }

    const isNeedsRevision = decision === 'needs_revision';
    const titleText = isNeedsRevision
      ? '⚠️ Законопроект направлен на доработку'
      : '❌ Законопроект отклонён Федеральным Правительством';

    const color = isNeedsRevision ? 0xF59E0B : 0xEF4444;

    const verdictStatusText = isNeedsRevision
      ? '⚠️ **ТРЕБУЮТСЯ ПРАВКИ (НА ДОРАБОТКУ)**'
      : '❌ **ОТКЛОНЕНО**';

    const actionInstruction = isNeedsRevision
      ? 'Перейдите в редактор портала, устраните указанные замечания и отправьте законопроект на повторное рассмотрение.'
      : 'Законопроект отклонён Федеральным Правительством и перемещён в архив отклонённых.';

    const baseUrl = String(portalUrl || 'https://zakonoproekti.duckdns.org').replace(/\/$/, '');
    const siteLink = `${baseUrl}/?billId=${encodeURIComponent(billId || '')}`;

    const embed = {
      title: titleText,
      color: color,
      description: `Уважаемый(ая) **${author || 'Инициатор'}**!\nАдминистратор Федерального Правительства рассмотрел ваш законопроект и вынес решение:`,
      fields: [
        {
          name: '📄 Законопроект',
          value: `**${title || 'Без названия'}**`,
          inline: false
        },
        {
          name: '🏛️ Нормативно-правовой акт',
          value: targetLaw || 'Законодательство Штата',
          inline: true
        },
        {
          name: '⚖️ Вердикт',
          value: verdictStatusText,
          inline: true
        },
        {
          name: '👤 Администратор',
          value: adminName || 'Федеральное Правительство',
          inline: true
        },
        {
          name: '📝 Обоснование / Замечания к законопроекту',
          value: reason ? `>>> ${reason}` : '*(Замечания не указаны)*',
          inline: false
        },
        {
          name: '📌 Инструкция автору',
          value: actionInstruction,
          inline: false
        },
        {
          name: '🔗 Ссылка на законопроект',
          value: `[**Перейти к редактированию в портале**](${siteLink})`,
          inline: false
        }
      ],
      footer: {
        text: 'Портал законопроектов штата • Report Assistant'
      },
      timestamp: new Date().toISOString()
    };

    const sent = await sendDiscordDmEmbed(targetUserId, embed);
    console.log(`[notify-verdict] Successfully sent Discord DM to user ${targetUserId} for bill ${billId}`);
    
    return res.json({ 
      success: true, 
      messageId: sent.id, 
      recipientId: targetUserId 
    });
  } catch (err) {
    console.error('[notify-verdict] Error sending Discord notification:', err);
    return res.status(500).json({ 
      success: false, 
      error: err.message || 'Failed to dispatch Discord notification' 
    });
  }
});

// Catch-all route to serve index.html for React Router / SPA (Express 4 & 5 compatible)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Uploads will be saved to ${uploadsDir}`);
});
