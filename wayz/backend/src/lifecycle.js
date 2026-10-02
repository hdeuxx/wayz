const INCIDENT_TYPES = [
  'accident',
  'traffic_jam',
  'roadworks',
  'road_hazard',
  'police',
  'obstacle',
  'dangerous_weather',
  'broken_down_vehicle',
];

const TTL_MS = 30 * 60 * 1000; // durée de vie initiale et après "toujours présent"
const DISMISS_PENALTY_MS = 10 * 60 * 1000; // retiré à chaque "plus présent"
const DISMISS_MARGIN = 3; // expiration anticipée si dismissed >= confirmed + marge

function initialExpiry(now = Date.now()) {
  return now + TTL_MS;
}

function applyConfirm(incident, now = Date.now()) {
  return {
    confirmed_count: incident.confirmed_count + 1,
    expires_at: now + TTL_MS,
  };
}

function applyDismiss(incident, now = Date.now()) {
  const dismissed = incident.dismissed_count + 1;
  const earlyExpiry = dismissed >= incident.confirmed_count + DISMISS_MARGIN;
  return {
    dismissed_count: dismissed,
    expires_at: earlyExpiry ? now : incident.expires_at - DISMISS_PENALTY_MS,
  };
}

module.exports = {
  INCIDENT_TYPES,
  TTL_MS,
  initialExpiry,
  applyConfirm,
  applyDismiss,
};
