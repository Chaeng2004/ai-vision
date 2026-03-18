import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Image,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useAppStore } from '../../store/useAppStore';
import { useScan } from '../../hooks/useScan';
import { Colors, RESTRICTIONS } from '../../constants';
import { PrimaryButton, LoadingPulse, VerdictBanner } from '../../components/UI';
import { ScanHistoryItem } from '../../types';

type ScanPhase = 'idle' | 'preview' | 'scanning' | 'done';

const SCAN_MESSAGES = [
  'Extracting text from label...',
  'Identifying ingredients...',
  'Cross-referencing with dietary profile...',
  'Generating safety verdict...',
];

export default function ScanScreen() {
  const router = useRouter();
  const { restrictions, addScan } = useAppStore();
  const { scan, isLoading, result, reset } = useScan();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [phase, setPhase] = useState<ScanPhase>('idle');
  const [scanMsgIndex, setScanMsgIndex] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const imageScaleAnim = useRef(new Animated.Value(0.9)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  // Scan line animation
  useEffect(() => {
    if (phase === 'scanning') {
      const msgInterval = setInterval(() => {
        setScanMsgIndex((i) => (i + 1) % SCAN_MESSAGES.length);
      }, 1200);

      Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
          Animated.timing(scanLineAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
        ])
      ).start();

      return () => clearInterval(msgInterval);
    }
  }, [phase]);

  const pickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Camera permission required', 'Please allow camera access in settings.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
    });
    if (!res.canceled && res.assets[0]) {
      setImageUri(res.assets[0].uri);
      setPhase('preview');
      Animated.spring(imageScaleAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 10 }).start();
    }
  };

  const pickFromGallery = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
    });
    if (!res.canceled && res.assets[0]) {
      setImageUri(res.assets[0].uri);
      setPhase('preview');
      Animated.spring(imageScaleAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 10 }).start();
    }
  };

  const handleScan = async () => {
    if (!imageUri) return;
    setPhase('scanning');

    const scanResult = await scan(imageUri, restrictions);

    if (scanResult) {
      const item: ScanHistoryItem = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        imageUri,
        result: scanResult,
        restrictions: [...restrictions],
      };
      addScan(item);
      setPhase('done');
    } else {
      setPhase('preview');
    }
  };

  const handleReset = () => {
    reset();
    setImageUri(null);
    setPhase('idle');
    setScanMsgIndex(0);
    imageScaleAnim.setValue(0.9);
  };

  const handleViewFull = () => {
    if (result) {
      const item: ScanHistoryItem = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        imageUri,
        result,
        restrictions: [...restrictions],
      };
      router.push({ pathname: '/result', params: { data: JSON.stringify(item) } });
    }
  };

  const scanLineTranslate = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-2, 200],
  });

  return (
    <SafeAreaView style={styles.safe}>
      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Scan Label</Text>
          <Text style={styles.subtitle}>
            {restrictions.length > 0
              ? `Checking for ${restrictions.length} restriction${restrictions.length > 1 ? 's' : ''}`
              : 'No restrictions set'}
          </Text>
        </View>

        {/* Active restrictions mini-bar */}
        {restrictions.length > 0 && (
          <View style={styles.restrictionBar}>
            {restrictions.slice(0, 4).map((r) => {
              const meta = RESTRICTIONS.find((x) => x.id === r);
              return (
                <View key={r} style={styles.restrictionPill}>
                  <Text style={styles.restrictionPillText}>{meta?.emoji} {meta?.label}</Text>
                </View>
              );
            })}
            {restrictions.length > 4 && (
              <View style={styles.restrictionPill}>
                <Text style={styles.restrictionPillText}>+{restrictions.length - 4}</Text>
              </View>
            )}
          </View>
        )}

        {/* ─── Idle state ─────────────────────────────────────── */}
        {phase === 'idle' && (
          <View style={styles.idleContainer}>
            <View style={styles.cameraFrame}>
              <View style={styles.cornerTL} />
              <View style={styles.cornerTR} />
              <View style={styles.cornerBL} />
              <View style={styles.cornerBR} />
              <Text style={styles.cameraFrameIcon}>⊕</Text>
              <Text style={styles.cameraFrameHint}>Point at the ingredients list</Text>
            </View>
            <View style={styles.pickButtons}>
              <PrimaryButton label="Open Camera" onPress={pickFromCamera} style={{ flex: 1 }} />
              <PrimaryButton
                label="From Gallery"
                onPress={pickFromGallery}
                style={{ flex: 1 }}
                variant="ghost"
              />
            </View>
          </View>
        )}

        {/* ─── Preview state ───────────────────────────────────── */}
        {(phase === 'preview' || phase === 'scanning') && imageUri && (
          <View style={styles.previewContainer}>
            <View style={styles.imageWrapper}>
              <Animated.Image
                source={{ uri: imageUri }}
                style={[styles.previewImage, { transform: [{ scale: imageScaleAnim }] }]}
                resizeMode="cover"
              />
              {phase === 'scanning' && (
                <Animated.View
                  style={[
                    styles.scanLine,
                    { transform: [{ translateY: scanLineTranslate }] },
                  ]}
                />
              )}
              {phase === 'scanning' && (
                <View style={styles.scanOverlay}>
                  <View style={styles.scanOverlayInner}>
                    <Text style={styles.scanOverlayText}>{SCAN_MESSAGES[scanMsgIndex]}</Text>
                  </View>
                </View>
              )}
            </View>

            {phase === 'preview' && (
              <View style={styles.previewActions}>
                <PrimaryButton label="Scan This Label" onPress={handleScan} />
                <PrimaryButton label="Choose Different" onPress={handleReset} variant="ghost" />
              </View>
            )}

            {phase === 'scanning' && (
              <LoadingPulse label="Analyzing ingredients..." />
            )}
          </View>
        )}

        {/* ─── Done state ──────────────────────────────────────── */}
        {phase === 'done' && result && (
          <View style={styles.doneContainer}>
            <VerdictBanner status={result.status} />

            <View style={styles.verdictDetails}>
              <Text style={styles.verdictReason}>{result.verdict_reason}</Text>
              <Text style={styles.recommendation}>{result.recommendation}</Text>
            </View>

            {result.flagged_ingredients.length > 0 && (
              <View style={styles.flaggedBox}>
                <Text style={styles.flaggedTitle}>FLAGGED INGREDIENTS</Text>
                {result.flagged_ingredients.map((f) => (
                  <View key={f} style={styles.flaggedRow}>
                    <Text style={styles.flaggedDot}>•</Text>
                    <Text style={styles.flaggedText}>{f}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.doneActions}>
              <PrimaryButton label="View Full Report" onPress={handleViewFull} />
              <PrimaryButton label="Scan Another" onPress={handleReset} variant="ghost" />
            </View>
          </View>
        )}
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 24, paddingBottom: 40, gap: 20 },
  header: { gap: 4 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: Colors.textSecondary },
  restrictionBar: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  restrictionPill: {
    backgroundColor: Colors.accentDim,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.accent + '33',
  },
  restrictionPillText: { fontSize: 12, color: Colors.accentLight, fontWeight: '500' },

  // Idle
  idleContainer: { gap: 24 },
  cameraFrame: {
    height: 260,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: Colors.bgCard,
    position: 'relative',
  },
  cornerTL: { position: 'absolute', top: 16, left: 16, width: 24, height: 24, borderTopWidth: 2, borderLeftWidth: 2, borderColor: Colors.accent, borderTopLeftRadius: 6 },
  cornerTR: { position: 'absolute', top: 16, right: 16, width: 24, height: 24, borderTopWidth: 2, borderRightWidth: 2, borderColor: Colors.accent, borderTopRightRadius: 6 },
  cornerBL: { position: 'absolute', bottom: 16, left: 16, width: 24, height: 24, borderBottomWidth: 2, borderLeftWidth: 2, borderColor: Colors.accent, borderBottomLeftRadius: 6 },
  cornerBR: { position: 'absolute', bottom: 16, right: 16, width: 24, height: 24, borderBottomWidth: 2, borderRightWidth: 2, borderColor: Colors.accent, borderBottomRightRadius: 6 },
  cameraFrameIcon: { fontSize: 36, color: Colors.textMuted },
  cameraFrameHint: { fontSize: 14, color: Colors.textMuted },
  pickButtons: { flexDirection: 'row', gap: 12 },

  // Preview
  previewContainer: { gap: 16 },
  imageWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    height: 260,
    position: 'relative',
  },
  previewImage: { width: '100%', height: '100%' },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: Colors.accent,
    opacity: 0.8,
  },
  scanOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  scanOverlayInner: {
    backgroundColor: 'rgba(10,10,15,0.85)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  scanOverlayText: { color: Colors.accentLight, fontSize: 13, fontWeight: '500' },
  previewActions: { gap: 10 },

  // Done
  doneContainer: { gap: 16 },
  verdictDetails: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
    gap: 8,
  },
  verdictReason: { fontSize: 15, color: Colors.text, fontWeight: '500', lineHeight: 22 },
  recommendation: { fontSize: 14, color: Colors.textSecondary, lineHeight: 21 },
  flaggedBox: {
    backgroundColor: Colors.nogoDim,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.nogo + '44',
    padding: 18,
    gap: 8,
  },
  flaggedTitle: { fontSize: 11, fontWeight: '700', color: Colors.nogo, letterSpacing: 1.2 },
  flaggedRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  flaggedDot: { color: Colors.nogo, fontSize: 16, lineHeight: 22 },
  flaggedText: { color: Colors.nogo, fontSize: 14, lineHeight: 22, flex: 1 },
  doneActions: { gap: 10 },
});