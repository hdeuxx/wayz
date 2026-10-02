import { useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

interface Props {
  onCapture: (uri: string, base64: string) => void;
  onCancel: () => void;
}

export function CameraCapture({ onCapture, onCancel }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const ref = useRef<CameraView>(null);
  const [busy, setBusy] = useState(false);

  if (!permission) return <View style={styles.center} />;

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>L'accès à la caméra est nécessaire pour ajouter une photo.</Text>
        <Pressable style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Autoriser</Text>
        </Pressable>
        <Pressable onPress={onCancel}>
          <Text style={styles.link}>Annuler</Text>
        </Pressable>
      </View>
    );
  }

  const take = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const photo = await ref.current?.takePictureAsync({ quality: 0.5, base64: true });
      if (photo?.uri && photo.base64) onCapture(photo.uri, photo.base64);
    } catch {
      Alert.alert('Erreur', "Impossible de prendre la photo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.full}>
      <CameraView ref={ref} style={styles.full} facing="back" />
      <View style={styles.controls}>
        <Pressable onPress={onCancel}>
          <Text style={styles.link}>Annuler</Text>
        </Pressable>
        <Pressable style={styles.shutter} onPress={take} />
        <View style={{ width: 60 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  full: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  text: { textAlign: 'center', fontSize: 16 },
  btn: { backgroundColor: '#1e88e5', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10 },
  btnText: { color: '#fff', fontWeight: '600' },
  link: { color: '#1e88e5', fontSize: 16, width: 60, textAlign: 'center' },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  shutter: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#fff', borderWidth: 4, borderColor: '#ccc' },
});
