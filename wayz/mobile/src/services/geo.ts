import { Coords } from '../types';

const R = 6371000;
const rad = (d: number) => (d * Math.PI) / 180;

export function distanceMeters(a: Coords, b: Coords): number {
  const dLat = rad(b.latitude - a.latitude);
  const dLng = rad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
