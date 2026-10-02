import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';
import { IncidentSheet } from '../components/IncidentSheet';
import { useIncidents } from '../hooks/useIncidents';
import { MAX_RADIUS_M } from '../config';
import { confirmIncident, dismissIncident } from '../services/api';
import { distanceMeters } from '../services/geo';
import { Coords, INCIDENT_META, Incident } from '../types';

interface Props {
  position: Coords;
  onReport: () => void;
}

export function MapScreen({ position, onReport }: Props) {
  const { incidents, error, refresh } = useIncidents();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const map = useRef<MapView>(null);
  const centered = useRef(false);

  useEffect(() => {
    if (!centered.current) {
      centered.current = true;
      map.current?.animateToRegion({ ...position, latitudeDelta: 0.005, longitudeDelta: 0.005 });
    }
  }, [position]);

  const selected = incidents.find((i) => i.id === selectedId) ?? null;
  const canVote = selected ? distanceMeters(position, selected) <= MAX_RADIUS_M : false;

  const vote = async (fn: typeof confirmIncident, incident: Incident) => {
    try {
      await fn(incident.id, position);
      await refresh();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Erreur réseau');
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={map}
        style={StyleSheet.absoluteFill}
        showsUserLocation
        showsMyLocationButton
        initialRegion={{ ...position, latitudeDelta: 0.005, longitudeDelta: 0.005 }}
        onPress={() => setSelectedId(null)}
      >
        <Circle
          center={position}
          radius={MAX_RADIUS_M}
          strokeColor="rgba(30,136,229,0.6)"
          fillColor="rgba(30,136,229,0.08)"
        />
        {incidents.map((i) => (
          <Marker
            key={i.id}
            coordinate={{ latitude: i.latitude, longitude: i.longitude }}
            onPress={(e) => {
              e.stopPropagation();
              setSelectedId(i.id);
            }}
          >
            <View style={[styles.pin, { borderColor: INCIDENT_META[i.type].color }]}>
              <Text style={styles.pinText}>{INCIDENT_META[i.type].emoji}</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {error ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>Serveur injoignable : {error}</Text>
        </View>
      ) : null}

      {selected ? (
        <IncidentSheet
          incident={selected}
          canVote={canVote}
          onConfirm={() => vote(confirmIncident, selected)}
          onDismiss={() => vote(dismissIncident, selected)}
          onClose={() => setSelectedId(null)}
        />
      ) : (
        <Pressable style={styles.fab} onPress={onReport}>
          <Text style={styles.fabText}>＋ Signaler</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pin: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinText: { fontSize: 20 },
  banner: { position: 'absolute', top: 50, left: 12, right: 12, backgroundColor: '#c62828', padding: 8, borderRadius: 8 },
  bannerText: { color: '#fff', textAlign: 'center' },
  fab: {
    position: 'absolute',
    bottom: 32,
    alignSelf: 'center',
    backgroundColor: '#1e88e5',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 30,
    elevation: 6,
  },
  fabText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
