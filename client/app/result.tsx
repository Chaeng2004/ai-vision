import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppStore } from '../store/useAppStore';
import { Colors, CLASSIFICATION_LABELS } from '../constants';
import { VerdictBanner, Badge, SectionHeader } from '../components/UI';
import { IngredientAnalysis, ScanHistoryItem } from '../types';

export default function ResultScreen() {
  const { data, id } = useLocalSearchParams<{ data?: string; id?: string }>();
  const { history } = useAppStore();
  const router = useRouter();

  const slideAnim = useRef(new Animated.Value(40)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 55, friction: 10 }),
    ]).start();
  }, []);

  // Resolve item from params or history
  let item: ScanHistoryItem | null = null;
  if (data) {
    try { item = JSON.parse(data); } catch {}
  } else if (id) {
    item = history.find((h) => h.id === id) ?? null;
  }

  if (!item) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Result not found</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>← Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { result } = item;

  const byClassification = result.analysis.reduce<Record<string, IngredientAnalysis[]>>(
    (acc, ing) => {
      acc[ing.classification] = acc[ing.classification] ?? [];
      acc[ing.classification].push(ing);
      return acc;
    },
    {}
  );

  const report = result.report;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Close bar */}
      <View style={styles.closeBar}>
        <View style={styles.closeHandle} />
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>

          {/* Verdict */}
          <VerdictBanner status={result.status} />

          {/* Reason + recommendation */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>VERDICT</Text>
            <Text style={styles.cardBody}>{result.verdict_reason}</Text>
            <View style={styles.divider} />
            <Text style={styles.cardTitle}>RECOMMENDATION</Text>
            <Text style={styles.cardBody}>{result.recommendation}</Text>
          </View>

          {/* AI safety report (more readable) */}
          {(report?.summary ||
            (report?.highlights && report.highlights.length > 0) ||
            (report?.next_steps && report.next_steps.length > 0) ||
            (report?.limitations && report.limitations.length > 0)) && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>SAFETY REPORT</Text>
              {!!report?.summary && (
                <Text style={styles.cardBody}>{report.summary}</Text>
              )}

              {report?.highlights && report.highlights.length > 0 && (
                <>
                  <View style={styles.divider} />
                  <Text style={styles.cardTitle}>HIGHLIGHTS</Text>
                  <View style={styles.bullets}>
                    {report.highlights.map((t, idx) => (
                      <Text key={idx} style={styles.bulletText}>• {t}</Text>
                    ))}
                  </View>
                </>
              )}

              {report?.next_steps && report.next_steps.length > 0 && (
                <>
                  <View style={styles.divider} />
                  <Text style={styles.cardTitle}>NEXT STEPS</Text>
                  <View style={styles.bullets}>
                    {report.next_steps.map((t, idx) => (
                      <Text key={idx} style={styles.bulletText}>• {t}</Text>
                    ))}
                  </View>
                </>
              )}

              {report?.limitations && report.limitations.length > 0 && (
                <>
                  <View style={styles.divider} />
                  <Text style={styles.cardTitle}>LIMITATIONS</Text>
                  <View style={styles.bullets}>
                    {report.limitations.map((t, idx) => (
                      <Text key={idx} style={styles.bulletText}>• {t}</Text>
                    ))}
                  </View>
                </>
              )}
            </View>
          )}

          {/* Flagged ingredients */}
          {result.flagged_ingredients.length > 0 && (
            <View style={[styles.card, styles.flaggedCard]}>
              <Text style={[styles.cardTitle, { color: Colors.nogo }]}>FLAGGED</Text>
              {result.flagged_ingredients.map((f) => (
                <View key={f} style={styles.flaggedRow}>
                  <View style={styles.flaggedDotView} />
                  <Text style={styles.flaggedText}>{f}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Ingredient breakdown by classification */}
          <SectionHeader
            title="Ingredient Breakdown"
            subtitle={`${result.ingredients_detected.length} ingredients identified`}
          />

          {Object.entries(byClassification).map(([classification, items]) => {
            const meta = CLASSIFICATION_LABELS[classification] ?? { label: classification, color: Colors.textMuted };
            return (
              <View key={classification} style={styles.classGroup}>
                <View style={styles.classGroupHeader}>
                  <View style={[styles.classGroupDot, { backgroundColor: meta.color }]} />
                  <Text style={[styles.classGroupLabel, { color: meta.color }]}>
                    {meta.label.toUpperCase()}
                  </Text>
                  <View style={styles.classGroupCount}>
                    <Text style={styles.classGroupCountText}>{items.length}</Text>
                  </View>
                </View>
                {items.map((ing) => (
                  <IngredientRow key={ing.ingredient} ing={ing} />
                ))}
              </View>
            );
          })}

          {/* Raw extracted text */}
          <SectionHeader title="Raw OCR Text" subtitle="What was extracted from the label" />
          <View style={styles.rawTextBox}>
            <Text style={styles.rawText}>{result.extracted_text.join(' ')}</Text>
          </View>

          {/* Scan metadata */}
          <View style={styles.meta}>
            <Text style={styles.metaText}>
              Scanned {new Date(item.timestamp).toLocaleString('en-PH')}
            </Text>
            <Text style={styles.metaText}>
              Profile: {item.restrictions.length > 0 ? item.restrictions.join(', ') : 'None'}
            </Text>
          </View>

        </Animated.View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

function IngredientRow({ ing }: { ing: IngredientAnalysis }) {
  const expandAnim = useRef(new Animated.Value(0)).current;
  const [expanded, setExpanded] = React.useState(false);

  const toggle = () => {
    const toValue = expanded ? 0 : 1;
    Animated.spring(expandAnim, { toValue, useNativeDriver: false, tension: 80, friction: 12 }).start();
    setExpanded(!expanded);
  };

  const maxHeight = expandAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 120] });
  const meta = CLASSIFICATION_LABELS[ing.classification];
  const isFlagged = ing.is_halal_concern || ing.is_vegan_concern || ing.allergen_flags.length > 0;

  return (
    <TouchableOpacity
      style={[styles.ingRow, isFlagged && styles.ingRowFlagged]}
      onPress={toggle}
      activeOpacity={0.75}
    >
      <View style={styles.ingRowTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.ingName}>{ing.ingredient}</Text>
          {!!ing.normalized && ing.normalized !== ing.ingredient && (
            <Text style={styles.ingSubName}>{ing.normalized}</Text>
          )}
        </View>
        <View style={styles.ingRowRight}>
          {isFlagged && <Text style={styles.ingFlag}>⚠</Text>}
          <Text style={styles.ingExpand}>{expanded ? '↑' : '↓'}</Text>
        </View>
      </View>

      <Animated.View style={[styles.ingDetails, { maxHeight, overflow: 'hidden' }]}>
        <View style={styles.ingDetailsInner}>
          {meta && (
            <Badge label={meta.label} color={meta.color} style={{ marginBottom: 8 }} />
          )}
          {!!ing.confidence && (
            <Text style={styles.ingDetailText}>Confidence: {ing.confidence}</Text>
          )}
          {!!ing.why_flagged && (
            <Text style={styles.ingDetailText}>Why: {ing.why_flagged}</Text>
          )}
          {!!ing.evidence?.matched_text && (
            <Text style={styles.ingEvidence} numberOfLines={2}>
              Matched: “{ing.evidence.matched_text}”
            </Text>
          )}
          {ing.allergen_flags.length > 0 && (
            <Text style={styles.ingDetailText}>
              Allergens: {ing.allergen_flags.join(', ')}
            </Text>
          )}
          {ing.is_halal_concern && (
            <Text style={styles.ingDetailText}>☪ Halal concern</Text>
          )}
          {ing.is_vegan_concern && (
            <Text style={styles.ingDetailText}>🌱 Vegan concern</Text>
          )}
          {ing.notes && (
            <Text style={styles.ingNotes}>{ing.notes}</Text>
          )}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  closeBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    position: 'relative',
  },
  closeHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
  },
  closeBtn: {
    position: 'absolute',
    right: 24,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { color: Colors.textSecondary, fontSize: 14 },
  content: { padding: 24, paddingBottom: 60, gap: 16 },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
    gap: 8,
  },
  flaggedCard: {
    borderColor: Colors.nogo + '44',
    backgroundColor: Colors.nogoDim,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1.2,
  },
  cardBody: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },
  bullets: { gap: 6 },
  bulletText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  flaggedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 2,
  },
  flaggedDotView: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.nogo,
  },
  flaggedText: { fontSize: 14, color: Colors.nogo, fontWeight: '500', flex: 1 },
  classGroup: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: 4,
  },
  classGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  classGroupDot: { width: 8, height: 8, borderRadius: 4 },
  classGroupLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1, flex: 1 },
  classGroupCount: {
    backgroundColor: Colors.bgElevated,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  classGroupCountText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  ingRow: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  ingRowFlagged: { backgroundColor: 'rgba(255,77,106,0.04)' },
  ingRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ingName: { fontSize: 14, color: Colors.text, fontWeight: '500', flex: 1 },
  ingSubName: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  ingRowRight: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  ingFlag: { fontSize: 14, color: Colors.caution },
  ingExpand: { fontSize: 12, color: Colors.textMuted },
  ingDetails: {},
  ingDetailsInner: { paddingTop: 10, gap: 4 },
  ingDetailText: { fontSize: 13, color: Colors.textSecondary },
  ingEvidence: { fontSize: 12, color: Colors.textMuted, fontFamily: 'monospace', marginTop: 2 },
  ingNotes: {
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: 'italic',
    lineHeight: 18,
    marginTop: 4,
  },
  rawTextBox: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
  },
  rawText: { fontSize: 12, color: Colors.textMuted, lineHeight: 20, fontFamily: 'monospace' },
  meta: {
    gap: 4,
    alignItems: 'center',
    paddingTop: 8,
  },
  metaText: { fontSize: 12, color: Colors.textMuted },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  notFoundText: { fontSize: 18, color: Colors.textSecondary },
  backLink: { fontSize: 15, color: Colors.accent },
});