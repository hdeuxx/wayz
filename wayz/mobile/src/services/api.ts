import { API_URL } from '../config';
import { Coords, Incident, IncidentType } from '../types';

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = { 'bypass-tunnel-reminder': '1', ...(init.headers as Record<string, string>) };
  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Erreur ${res.status}`);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

const json = (body: unknown): RequestInit => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

const userPos = (c: Coords) => ({ user_latitude: c.latitude, user_longitude: c.longitude });

export const photoUrl = (path: string | null) => (path ? `${API_URL}${path}` : null);

export const getIncidents = () => request<Incident[]>('/incidents');

export function createIncident(params: {
  type: IncidentType;
  position: Coords;
  description?: string;
  photoBase64?: string | null;
  userId: string;
}) {
  return request<Incident>('/incidents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: params.type,
      latitude: params.position.latitude,
      longitude: params.position.longitude,
      ...userPos(params.position),
      reported_by: params.userId,
      description: params.description || undefined,
      photo_base64: params.photoBase64 || undefined,
    }),
  });
}

export const confirmIncident = (id: string, position: Coords) =>
  request<Incident>(`/incidents/${id}/confirm`, json(userPos(position)));

export const dismissIncident = (id: string, position: Coords) =>
  request<Incident>(`/incidents/${id}/dismiss`, json(userPos(position)));

export const registerDevice = (token: string, userId: string, position: Coords | null) =>
  request<void>('/devices', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, user_id: userId, ...position }),
  });
