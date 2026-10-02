import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CameraCapture } from '../components/CameraCapture';
import { createIncident } from '../services/api';
import { Coords, INCIDENT_META, IncidentType } from '../types';

interface Props {
  position: Coords;
  userId: string;
  onDone: () => void;
  onCancel: () => void;
}

export function ReportScreen({ position, userId, onDone, onCancel }: Props) {
  const [type, setType] = useState<IncidentType | null>(null);
  const [description, setDescription] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [sending, setSending] = useState(false);

  if (showCamera) {
    return (
      <CameraCapture
        onCapture={(uri, base64) => {
          setPhotoUri(uri);
          setPhotoBase64(base64);
          setShowCamera(false);
        }}
        onCancel={() => setShowCamera(false)}
      />
    );
  }

  const submit = async () => {
    if (!type) return Alert.alert('Type requis', "Choisissez un type d'incident.");
    setSending(true);
    try {
      await createIncident({ type, position, description: description.trim(), photoBase64, userId });
      onDone();
    } catch (e) {
      Alert.alert('Échec', e instanceof Error ? e.message : 'Erreur réseau');
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.h1}>Signaler un incident</Text>

        <View style={styles.grid}>
          {(Object.keys(INCIDENT_META) as IncidentType[]).map((t) => (
            <Pressable
              key={t}
              onPress={() => setType(t)}
              style={[styles.chip, type === t && { borderColor: INCIDENT_META[t].color, backgroundColor: '#f3f3f3' }]}
            >
              <Text style={styles.emoji}>{INCIDENT_META[t].emoji}</Text>
              <Text style={styles.chipText}>{INCIDENT_META[t].label}</Text>
            </Pressable>
          ))}
        </View>

        <TextInput
          style={styles.input}
          placeholder="Description (optionnel)"
          value={description}
          onChangeText={setDescription}
          multiline
          maxLength={500}
        />

        {photoUri ? <Image source={{ uri: photoUri }} style={styles.photo} /> : null}
        <Pressable style={styles.secondary} onPress={() => setShowCamera(true)}>
          <Text style={styles.secondaryText}>{photoUri ? '📷 Reprendre la photo' : '📷 Ajouter une photo'}</Text>
        </Pressable>

        <Pressable style={[styles.primary, sending && { opacity: 0.6 }]} onPress={submit} disabled={sending}>
          {sending ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Envoyer</Text>}
        </Pressable>
        <Pressable onPress={onCancel}>
          <Text style={styles.cancel}>Annuler</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, paddingTop: 56, gap: 14 },
  h1: { fontSize: 22, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    width: '47%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  emoji: { fontSize: 28 },
  chipText: { marginTop: 4, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, minHeight: 70 },
  photo: { width: '100%', height: 200, borderRadius: 12 },
  secondary: { padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#1e88e5', alignItems: 'center' },
  secondaryText: { color: '#1e88e5', fontWeight: '600' },
  primary: { padding: 14, borderRadius: 10, backgroundColor: '#1e88e5', alignItems: 'center' },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  cancel: { textAlign: 'center', color: '#666', padding: 8 },
});
