import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocation } from './src/hooks/useLocation';
import { registerDevice } from './src/services/api';
import { getPushToken } from './src/services/notifications';
import { MapScreen } from './src/screens/MapScreen';
import { ReportScreen } from './src/screens/ReportScreen';

const USER_ID = `user-${Math.random().toString(36).slice(2, 10)}`;

export default function App() {
  const { position, denied } = useLocation();
  const [screen, setScreen] = useState<'map' | 'report'>('map');
  const [pushToken, setPushToken] = useState<string | null>(null);
  const lastSent = useRef(0);

  useEffect(() => {
    getPushToken().then(setPushToken);
  }, []);

  // Le serveur utilise cette position pour cibler les notifications (< 200 m).
  useEffect(() => {
    if (!pushToken || !position || Date.now() - lastSent.current < 10000) return;
    lastSent.current = Date.now();
    registerDevice(pushToken, USER_ID, position).catch(() => {});
  }, [pushToken, position]);

  if (denied) {
    return (
      <View style={styles.center}>
        <Text>La localisation est nécessaire pour utiliser Wayz.</Text>
      </View>
    );
  }

  if (!position) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 12 }}>Recherche de votre position…</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      {screen === 'map' ? (
        <MapScreen position={position} onReport={() => setScreen('report')} />
      ) : (
        <ReportScreen
          position={position}
          userId={USER_ID}
          onDone={() => setScreen('map')}
          onCancel={() => setScreen('map')}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
});
