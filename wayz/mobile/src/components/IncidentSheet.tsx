import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { photoUrl } from '../services/api';
import { INCIDENT_META, Incident } from '../types';

interface Props {
  incident: Incident;
  canVote: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
  onClose: () => void;
}

export function IncidentSheet({ incident, canVote, onConfirm, onDismiss, onClose }: Props) {
  const meta = INCIDENT_META[incident.type];
  const minutes = Math.max(0, Math.round((incident.expires_at - Date.now()) / 60000));
  const photo = photoUrl(incident.photo_url);

  return (
    <View style={styles.sheet}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {meta.emoji} {meta.label}
        </Text>
        <Pressable onPress={onClose}>
          <Text style={styles.close}>✕</Text>
        </Pressable>
      </View>

      {incident.description ? <Text style={styles.desc}>{incident.description}</Text> : null}
      {photo ? <Image source={{ uri: photo }} style={styles.photo} /> : null}

      <Text style={styles.meta}>
        👍 {incident.confirmed_count} · 👎 {incident.dismissed_count} · expire dans ~{minutes} min
      </Text>

      <View style={styles.row}>
        <Pressable
          style={[styles.btn, styles.yes, !canVote && styles.disabled]}
          onPress={canVote ? onConfirm : () => Alert.alert('Trop loin', 'Approchez-vous à moins de 200 m pour voter.')}
        >
          <Text style={styles.btnText}>Toujours présent</Text>
        </Pressable>
        <Pressable
          style={[styles.btn, styles.no, !canVote && styles.disabled]}
          onPress={canVote ? onDismiss : () => Alert.alert('Trop loin', 'Approchez-vous à moins de 200 m pour voter.')}
        >
          <Text style={styles.btnText}>Plus présent</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '700' },
  close: { fontSize: 20, padding: 4 },
  desc: { marginTop: 6, color: '#444' },
  photo: { width: '100%', height: 160, borderRadius: 10, marginTop: 10 },
  meta: { marginTop: 10, color: '#666' },
  row: { flexDirection: 'row', gap: 10, marginTop: 12 },
  btn: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center' },
  yes: { backgroundColor: '#2e7d32' },
  no: { backgroundColor: '#c62828' },
  disabled: { opacity: 0.45 },
  btnText: { color: '#fff', fontWeight: '600' },
});
