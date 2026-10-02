const EARTH_RADIUS_M = 6371000;
const MAX_RADIUS_M = 200;

const toRad = (d) => (d * Math.PI) / 180;

function distanceMeters(lat1, lng1, lat2, lng2) {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a));
}

module.exports = { distanceMeters, MAX_RADIUS_M };
