import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { Coords } from '../types';

export function useLocation() {
  const [position, setPosition] = useState<Coords | null>(null);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    let sub: Location.LocationSubscription | undefined;
    let cancelled = false;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setDenied(true);
        return;
      }
      const s = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 5, timeInterval: 2000 },
        (loc) => setPosition({ latitude: loc.coords.latitude, longitude: loc.coords.longitude }),
      );
      if (cancelled) s.remove();
      else sub = s;
    })();

    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, []);

  return { position, denied };
}
