import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { Database } from './db.js';
import { publishMessage } from './queuePublisher.js';
console.log("AMQP_URL:", process.env.AMQP_URL);
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const db = new Database(process.env.SQLITE_FILE || './data.db');

// Ensure tables on boot
await db.init();

// Health
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// --------------------------
// List endpoints (read from DB — processed state)
// --------------------------
app.get('/api/authors', async (_req, res) => {
  try {
    const rows = await db.all('SELECT id, name, country FROM authors ORDER BY id DESC');
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'DB error' });
  }
});

app.get('/api/publishers', async (_req, res) => {
  try {
    const rows = await db.all('SELECT id, name, city FROM publishers ORDER BY id DESC');
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'DB error' });
  }
});

// --------------------------
// Deferred ops: enqueue messages
// --------------------------
async function enqueue(type, action, payload) {
  const msg = { type, action, payload, ts: Date.now() };
  await publishMessage('bookstore', msg);
  return { enqueued: true, message: msg };
}

app.post('/api/authors', async (req, res) => {
  const { action, payload } = req.body || {};
  if (!action) return res.status(400).json({ error: 'action is required' });
  try {
    const result = await enqueue('author', action, payload || {});
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'enqueue failed' });
  }
});

app.post('/api/publishers', async (req, res) => {
  const { action, payload } = req.body || {};
  if (!action) return res.status(400).json({ error: 'action is required' });
  try {
    const result = await enqueue('publisher', action, payload || {});
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'enqueue failed' });
  }
});

// "Rutina de actualización de datos" (el front la usa para forzar un refetch)
app.post('/api/refresh', async (_req, res) => {
  // En una app real podría disparar reindexaciones, etc.
  res.json({ ok: true, refreshedAt: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
