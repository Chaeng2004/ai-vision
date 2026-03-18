import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppStore } from '../../store/useAppStore';
import { Colors, RESTRICTIONS } from '../../constants';
import { ScanHistoryItem } from '../../types';
import { Badge } from '../../components/UI';

function HistoryCard({ item, onPress, onDelete }: {
  item: ScanHistoryItem;
  onPress: () => void;
  onDelete: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(30)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 60, friction: 10 }),
    ]).start();
  }, []);

  const statusColor =
    item.result.status === 'GO' ? Colors.go :
    item.result.status === 'NO_GO' ? Colors.nogo :
    Colors.caution;

  const activeRestrictions = RESTRICTIONS.filter((r) => item.restrictions.includes(r.id));

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity
        style={[styles.card, { borderLeftColor: statusColor, borderLeftWidth: 3 }]}
        activeOpacity={0.8}
        onPress={onPress}
        onLongPress={() =>
          Alert.alert('Remove this scan?', '', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Remove', style: 'destructive', onPress: onDelete },
          ])
        }
      >
        <View style={styles.cardTop}>
          <Badge
            label={item.result.status.replace('_', ' ')}
            color={statusColor}
          />
          <Text style={styles.cardDate}>
            {new Date(item.timestamp).toLocaleDateString('en-PH', {
              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </Text>
        </View>

        <Text style={styles.cardIngredients} numberOfLines={2}>
          {item.result.ingredients_detected.slice(0, 6).join(' · ')}
        </Text>

        {item.result.flagged_ingredients.length > 0 && (
          <View style={styles.cardFlagged}>
            <Text style={styles.cardFlaggedText}>
              ⚠ {item.result.flagged_ingredients.join(', ')}
            </Text>
          </View>
        )}

        {activeRestrictions.length > 0 && (
          <View style={styles.cardRestrictions}>
            {activeRestrictions.slice(0, 3).map((r) => (
              <Text key={r.id} style={styles.cardRestrictionEmoji}>{r.emoji}</Text>
            ))}
            {activeRestrictions.length > 3 && (
              <Text style={styles.cardRestrictionsMore}>+{activeRestrictions.length - 3}</Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function HistoryScreen() {
  const { history, clearHistory, removeScan } = useAppStore();
  const router = useRouter();

  const goCount = history.filter((h) => h.result.status === 'GO').length;
  const nogoCount = history.filter((h) => h.result.status === 'NO_GO').length;

  const handleClear = () =>
    Alert.alert('Clear all history?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear All', style: 'destructive', onPress: clearHistory },
    ]);

  if (history.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>◷</Text>
          <Text style={styles.emptyTitle}>No scans yet</Text>
          <Text style={styles.emptyText}>Your scan history will appear here</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>History</Text>
          <Text style={styles.subtitle}>{history.length} scans · {goCount} safe · {nogoCount} blocked</Text>
        </View>
        <TouchableOpacity onPress={handleClear}>
          <Text style={styles.clearBtn}>Clear all</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <HistoryCard
            item={item}
            onPress={() =>
              router.push({ pathname: '/result', params: { data: JSON.stringify(item) } })
            }
            onDelete={() => removeScan(item.id)}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: { fontSize: 28, fontWeight: '800', color: Colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  clearBtn: { fontSize: 14, color: Colors.nogo, fontWeight: '600' },
  list: { paddingHorizontal: 24, paddingBottom: 40 },
  separator: { height: 10 },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
    gap: 10,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardDate: { fontSize: 12, color: Colors.textMuted },
  cardIngredients: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  cardFlagged: {
    backgroundColor: Colors.nogoDim,
    borderRadius: 8,
    padding: 8,
  },
  cardFlaggedText: { fontSize: 13, color: Colors.nogo, fontWeight: '500' },
  cardRestrictions: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  cardRestrictionEmoji: { fontSize: 16 },
  cardRestrictionsMore: { fontSize: 12, color: Colors.textMuted, marginLeft: 2 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 40,
  },
  emptyIcon: { fontSize: 48, color: Colors.textMuted },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  emptyText: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center' },
});