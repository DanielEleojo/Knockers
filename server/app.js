import express from 'express';
import cors from 'cors';
import geoRouter from './routes/geo.js';
import censusRouter from './routes/census.js';

const app = express();

// CORS only matters in local dev (Vite :5173 → Express :8787). In production the
// app and API are same-origin on Netlify, so this is effectively a no-op there.
const allowed = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
app.use(cors({ origin: allowed }));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));
app.use('/api/geo', geoRouter);
app.use('/api/census', censusRouter);

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

export default app;
