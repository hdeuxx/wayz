const { db } = require('./db');
const { distanceMeters, MAX_RADIUS_M } = require('./geo');

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

async function notifyNearby(incident) {
  const devices = db
    .prepare('SELECT token, user_id, latitude, longitude FROM devices WHERE latitude IS NOT NULL')
    .all();

  const messages = devices
    .filter((d) => d.user_id !== incident.reported_by)
    .filter(
      (d) =>
        distanceMeters(d.latitude, d.longitude, incident.latitude, incident.longitude) <
        MAX_RADIUS_M,
    )
    .map((d) => ({
      to: d.token,
      sound: 'default',
      title: 'Nouvel incident à proximité',
      body: incident.description || incident.type,
      data: { incidentId: incident.id },
    }));

  if (messages.length === 0) return;

  try {
    await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(messages),
    });
  } catch (err) {
    console.error('Push failed:', err.message);
  }
}

module.exports = { notifyNearby };
