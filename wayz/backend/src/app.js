const path = require('path');
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const multer = require('multer');

const { db, DATA_DIR } = require('./db');
const { distanceMeters, MAX_RADIUS_M } = require('./geo');
const { INCIDENT_TYPES, initialExpiry, applyConfirm, applyDismiss } = require('./lifecycle');
const { notifyNearby } = require('./push');

const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
require('fs').mkdirSync(UPLOAD_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      cb(null, `${crypto.randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, file.mimetype.startsWith('image/')),
});

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(UPLOAD_DIR));

const num = (v) => (v === undefined || v === '' ? NaN : Number(v));
const validCoords = (lat, lng) =>
  Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

const getActive = (id) =>
  db.prepare('SELECT * FROM incidents WHERE id = ? AND expires_at > ?').get(id, Date.now());

// Accepte la photo en base64 (JPEG) pour les clients qui ne savent pas envoyer de multipart.
function saveBase64Photo(b64) {
  if (typeof b64 !== 'string' || b64.length === 0) return null;
  const buffer = Buffer.from(b64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
  if (buffer.length === 0 || buffer.length > 8 * 1024 * 1024) return null;
  const name = `${crypto.randomUUID()}.jpg`;
  require('fs').writeFileSync(path.join(UPLOAD_DIR, name), buffer);
  return `/uploads/${name}`;
}

function withinRange(req, incident) {
  const lat = num(req.body?.user_latitude);
  const lng = num(req.body?.user_longitude);
  if (!validCoords(lat, lng)) return { error: 'user_latitude/user_longitude requis' };
  if (distanceMeters(lat, lng, incident.latitude, incident.longitude) > MAX_RADIUS_M) {
    return { error: `Vous devez être à moins de ${MAX_RADIUS_M} m de l'incident`, status: 403 };
  }
  return {};
}

app.get('/health', (_req, res) => res.json({ ok: true }));

app.get('/incident-types', (_req, res) => res.json(INCIDENT_TYPES));

app.get('/incidents', (_req, res) => {
  const rows = db
    .prepare('SELECT * FROM incidents WHERE expires_at > ? ORDER BY created_at DESC')
    .all(Date.now());
  res.json(rows);
});

app.get('/incidents/:id', (req, res) => {
  const row = getActive(req.params.id);
  if (!row) return res.status(404).json({ error: 'Incident introuvable' });
  res.json(row);
});

app.post('/incidents', upload.single('photo'), async (req, res) => {
  const { type, description, reported_by } = req.body;
  const latitude = num(req.body.latitude);
  const longitude = num(req.body.longitude);

  if (!INCIDENT_TYPES.includes(type)) return res.status(400).json({ error: 'type invalide' });
  if (!validCoords(latitude, longitude)) {
    return res.status(400).json({ error: 'latitude/longitude invalides' });
  }

  const check = withinRange(req, { latitude, longitude });
  if (check.error) return res.status(check.status || 400).json({ error: check.error });

  const now = Date.now();
  const incident = {
    id: crypto.randomUUID(),
    type,
    latitude,
    longitude,
    description: description ? String(description).slice(0, 500) : null,
    photo_url: req.file ? `/uploads/${req.file.filename}` : saveBase64Photo(req.body.photo_base64),
    created_at: now,
    reported_by: reported_by || 'anonymous',
    expires_at: initialExpiry(now),
    confirmed_count: 0,
    dismissed_count: 0,
  };

  db.prepare(
    `INSERT INTO incidents (id, type, latitude, longitude, description, photo_url, created_at,
       reported_by, expires_at, confirmed_count, dismissed_count)
     VALUES (@id, @type, @latitude, @longitude, @description, @photo_url, @created_at,
       @reported_by, @expires_at, @confirmed_count, @dismissed_count)`,
  ).run(incident);

  res.status(201).json(incident);
  notifyNearby(incident);
});

app.put('/incidents/:id', (req, res) => {
  const row = getActive(req.params.id);
  if (!row) return res.status(404).json({ error: 'Incident introuvable' });

  const { type, description } = req.body;
  if (type !== undefined && !INCIDENT_TYPES.includes(type)) {
    return res.status(400).json({ error: 'type invalide' });
  }

  db.prepare('UPDATE incidents SET type = ?, description = ? WHERE id = ?').run(
    type ?? row.type,
    description !== undefined ? String(description).slice(0, 500) : row.description,
    row.id,
  );
  res.json(db.prepare('SELECT * FROM incidents WHERE id = ?').get(row.id));
});

app.delete('/incidents/:id', (req, res) => {
  const result = db.prepare('DELETE FROM incidents WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Incident introuvable' });
  res.status(204).end();
});

function vote(apply) {
  return (req, res) => {
    const row = getActive(req.params.id);
    if (!row) return res.status(404).json({ error: 'Incident introuvable' });

    const check = withinRange(req, row);
    if (check.error) return res.status(check.status || 400).json({ error: check.error });

    const patch = apply(row);
    db.prepare(
      `UPDATE incidents SET confirmed_count = ?, dismissed_count = ?, expires_at = ? WHERE id = ?`,
    ).run(
      patch.confirmed_count ?? row.confirmed_count,
      patch.dismissed_count ?? row.dismissed_count,
      patch.expires_at,
      row.id,
    );
    res.json(db.prepare('SELECT * FROM incidents WHERE id = ?').get(row.id));
  };
}

app.post('/incidents/:id/confirm', vote(applyConfirm));
app.post('/incidents/:id/dismiss', vote(applyDismiss));

app.put('/devices', (req, res) => {
  const { token, user_id } = req.body;
  const latitude = num(req.body.latitude);
  const longitude = num(req.body.longitude);
  if (!token || typeof token !== 'string') return res.status(400).json({ error: 'token requis' });

  db.prepare(
    `INSERT INTO devices (token, user_id, latitude, longitude, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(token) DO UPDATE SET user_id = excluded.user_id,
       latitude = excluded.latitude, longitude = excluded.longitude, updated_at = excluded.updated_at`,
  ).run(
    token,
    user_id || null,
    validCoords(latitude, longitude) ? latitude : null,
    validCoords(latitude, longitude) ? longitude : null,
    Date.now(),
  );
  res.status(204).end();
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Erreur serveur' });
});

module.exports = app;
