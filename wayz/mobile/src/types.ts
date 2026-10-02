export type IncidentType =
  | 'accident'
  | 'traffic_jam'
  | 'roadworks'
  | 'road_hazard'
  | 'police'
  | 'obstacle'
  | 'dangerous_weather'
  | 'broken_down_vehicle';

export interface Incident {
  id: string;
  type: IncidentType;
  latitude: number;
  longitude: number;
  description: string | null;
  photo_url: string | null;
  created_at: number;
  reported_by: string;
  expires_at: number;
  confirmed_count: number;
  dismissed_count: number;
}

export interface Coords {
  latitude: number;
  longitude: number;
}

export const INCIDENT_META: Record<IncidentType, { label: string; emoji: string; color: string }> = {
  accident: { label: 'Accident', emoji: '💥', color: '#e53935' },
  traffic_jam: { label: 'Embouteillage', emoji: '🚗', color: '#fb8c00' },
  roadworks: { label: 'Travaux', emoji: '🚧', color: '#fdd835' },
  road_hazard: { label: 'Danger sur la route', emoji: '⚠️', color: '#d81b60' },
  police: { label: 'Contrôle de police', emoji: '👮', color: '#1e88e5' },
  obstacle: { label: 'Obstacle', emoji: '🪨', color: '#6d4c41' },
  dangerous_weather: { label: 'Météo dangereuse', emoji: '🌧️', color: '#546e7a' },
  broken_down_vehicle: { label: 'Véhicule en panne', emoji: '🔧', color: '#8e24aa' },
};
