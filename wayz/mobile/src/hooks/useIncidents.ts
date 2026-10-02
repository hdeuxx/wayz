import { useCallback, useEffect, useState } from 'react';
import { POLL_INTERVAL_MS } from '../config';
import { getIncidents } from '../services/api';
import { Incident } from '../types';

export function useIncidents() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setIncidents(await getIncidents());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur réseau');
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  // Le serveur filtre déjà, mais on retire aussi localement entre deux polls.
  const active = incidents.filter((i) => i.expires_at > Date.now());

  return { incidents: active, error, refresh };
}
