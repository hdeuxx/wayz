import { API_URL } from '../config';
import { Coords, Incident, IncidentType } from '../types';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, init);
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
  photoUri?: string | null;
  userId: string;
}) {
  const form = new FormData();
  form.append('type', params.type);
  form.append('latitude', String(params.position.latitude));
  form.append('longitude', String(params.position.longitude));
  form.append('user_latitude', String(params.position.latitude));
  form.append('user_longitude', String(params.position.longitude));
  form.append('reported_by', params.userId);
  if (params.description) form.append('description', params.description);
  if (params.photoUri) {
    form.append('photo', { uri: params.photoUri, name: 'photo.jpg', type: 'image/jpeg' } as any);
  }
  return request<Incident>('/incidents', { method: 'POST', body: form });
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
