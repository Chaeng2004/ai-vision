import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppStore } from '../../store/useAppStore';
import { Colors, RESTRICTIONS } from '../../constants';
import { Badge } from '../../components/UI';

export default function HomeScreen() {
  const router = useRouter();
  const { restrictions, history } = useAppStore();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 60, friction: 10 }),
    ]).start();
  }, []);

  const lastScan = history[0];
  const goCount = history.filter((h) => h.result.status === 'GO').length;
  const nogoCount = history.filter((h) => h.result.status === 'NO_GO').length;
  const cautionCount = history.filter((h) => h.result.status === 'CAUTION').length;

  const activeRestrictions = RESTRICTIONS.filter((r) => restrictions.includes(r.id));

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Good day</Text>
              <Text style={styles.appName}>IngredientIQ</Text>
            </View>
            <View style={styles.headerDot}>
              <Text style={styles.headerDotText}>⬡</Text>
            </View>
          </View>

          {/* Quick scan CTA */}
          <TouchableOpacity
            style={styles.scanCta}
            activeOpacity={0.85}
            onPress={() => router.push('/(tabs)/scan')}
          >
            <View style={styles.scanCtaLeft}>
              <Text style={styles.scanCtaTitle}>Scan a label</Text>
              <Text style={styles.scanCtaSub}>Point your camera at any supplement</Text>
            </View>
            <View style={styles.scanCtaIcon}>
              <Text style={styles.scanCtaIconText}>⊕</Text>
            </View>
          </TouchableOpacity>

          {/* Stats row */}
          {history.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>YOUR SCANS</Text>
              <View style={styles.statsRow}>
                <View style={[styles.statCard, { borderColor: Colors.go + '44' }]}>
                  <Text style={[styles.statNum, { color: Colors.go }]}>{goCount}</Text>
                  <Text style={styles.statLabel}>Safe</Text>
                </View>
                <View style={[styles.statCard, { borderColor: Colors.nogo + '44' }]}>
                  <Text style={[styles.statNum, { color: Colors.nogo }]}>{nogoCount}</Text>
                  <Text style={styles.statLabel}>Blocked</Text>
                </View>
                <View style={[styles.statCard, { borderColor: Colors.caution + '44' }]}>
                  <Text style={[styles.statNum, { color: Colors.caution }]}>{cautionCount}</Text>
                  <Text style={styles.statLabel}>Caution</Text>
                </View>
              </View>
            </>
          )}

          {/* Last scan */}
          {lastScan && (
            <>
              <Text style={styles.sectionLabel}>LAST SCAN</Text>
              <TouchableOpacity
                style={styles.lastScanCard}
                activeOpacity={0.8}
                onPress={() =>
                  router.push({ pathname: '/result', params: { id: lastScan.id } })
                }
              >
                <View style={styles.lastScanTop}>
                  <Badge
                    label={lastScan.result.status.replace('_', ' ')}
                    color={
                      lastScan.result.status === 'GO'
                        ? Colors.go
                        : lastScan.result.status === 'NO_GO'
                        ? Colors.nogo
                        : Colors.caution
                    }
                  />
                  <Text style={styles.lastScanTime}>
                    {new Date(lastScan.timestamp).toLocaleDateString('en-PH', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
                <Text style={styles.lastScanIngredients} numberOfLines={2}>
                  {lastScan.result.ingredients_detected.slice(0, 5).join(', ')}
                  {lastScan.result.ingredients_detected.length > 5 ? '...' : ''}
                </Text>
                {lastScan.result.flagged_ingredients.length > 0 && (
                  <Text style={styles.lastScanFlagged}>
                    ⚠ {lastScan.result.flagged_ingredients.join(', ')}
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {/* Active restrictions */}
          <Text style={styles.sectionLabel}>YOUR PROFILE</Text>
          {activeRestrictions.length === 0 ? (
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={styles.emptyProfile}>
              <Text style={styles.emptyProfileText}>No restrictions set — tap to edit profile</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.restrictionsList}>
              {activeRestrictions.map((r) => (
                <View key={r.id} style={styles.restrictionRow}>
                  <Text style={styles.restrictionEmoji}>{r.emoji}</Text>
                  <View>
                    <Text style={styles.restrictionLabel}>{r.label}</Text>
                    <Text style={styles.restrictionDesc}>{r.description}</Text>
                  </View>
                </View>
              ))}
              <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
                <Text style={styles.editProfile}>Edit profile →</Text>
              </TouchableOpacity>
            </View>
          )}

        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  content: { padding: 24, paddingBottom: 40, gap: 0 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  greeting: { fontSize: 13, color: Colors.textMuted, letterSpacing: 0.5 },
  appName: { fontSize: 26, fontWeight: '800', color: Colors.text, letterSpacing: -0.5 },
  headerDot: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.accentDim,
    borderWidth: 1,
    borderColor: Colors.accent + '44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerDotText: { fontSize: 22, color: Colors.accent },
  scanCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent,
    borderRadius: 20,
    padding: 22,
    marginBottom: 32,
    gap: 16,
  },
  scanCtaLeft: { flex: 1 },
  scanCtaTitle: { fontSize: 20, fontWeight: '800', color: Colors.white, letterSpacing: -0.3 },
  scanCtaSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 3 },
  scanCtaIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanCtaIconText: { fontSize: 24, color: Colors.white },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 12,
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  statNum: { fontSize: 28, fontWeight: '800' },
  statLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  lastScanCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
    gap: 10,
    marginBottom: 28,
  },
  lastScanTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastScanTime: { fontSize: 12, color: Colors.textMuted },
  lastScanIngredients: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  lastScanFlagged: { fontSize: 13, color: Colors.nogo, fontWeight: '500' },
  restrictionsList: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
    gap: 14,
    marginBottom: 20,
  },
  restrictionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  restrictionEmoji: { fontSize: 20 },
  restrictionLabel: { fontSize: 15, fontWeight: '600', color: Colors.text },
  restrictionDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  editProfile: { fontSize: 13, color: Colors.accent, fontWeight: '600', marginTop: 4 },
  emptyProfile: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 20,
    alignItems: 'center',
  },
  emptyProfileText: { color: Colors.textMuted, fontSize: 14 },
});