import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../../store/useAppStore';
import { RESTRICTIONS, Colors } from '../../constants';
import { RestrictionChip, PrimaryButton, SectionHeader } from '../../components/UI';

const CATEGORIES = [
  { key: 'religious', label: 'Religious', description: 'Faith-based dietary requirements' },
  { key: 'lifestyle', label: 'Lifestyle', description: 'Plant-based and diet preferences' },
  { key: 'allergen', label: 'Allergens', description: 'Ingredients that cause reactions' },
] as const;

export default function ProfileScreen() {
  const { restrictions, toggleRestriction, completeOnboarding, clearHistory } = useAppStore();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () =>
    Alert.alert(
      'Reset everything?',
      'This will clear your restrictions and all scan history.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            clearHistory();
            useAppStore.getState().setRestrictions([]);
          },
        },
      ]
    );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Your Profile</Text>
          <Text style={styles.subtitle}>
            {restrictions.length === 0
              ? 'No restrictions set'
              : `${restrictions.length} restriction${restrictions.length > 1 ? 's' : ''} active`}
          </Text>
        </View>

        {/* Active count badge */}
        {restrictions.length > 0 && (
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>
              Active: {RESTRICTIONS.filter((r) => restrictions.includes(r.id)).map((r) => r.label).join(', ')}
            </Text>
          </View>
        )}

        {/* Restriction categories */}
        {CATEGORIES.map((cat) => {
          const items = RESTRICTIONS.filter((r) => r.category === cat.key);
          return (
            <View key={cat.key} style={styles.categoryBlock}>
              <SectionHeader title={cat.label} subtitle={cat.description} />
              <View style={styles.chips}>
                {items.map((item) => (
                  <RestrictionChip
                    key={item.id}
                    emoji={item.emoji}
                    label={item.label}
                    selected={restrictions.includes(item.id)}
                    onPress={() => toggleRestriction(item.id)}
                  />
                ))}
              </View>
            </View>
          );
        })}

        {/* Save button */}
        <PrimaryButton
          label={saved ? '✓ Profile Saved' : 'Save Profile'}
          onPress={handleSave}
          style={styles.saveBtn}
        />

        {/* Danger zone */}
        <View style={styles.dangerZone}>
          <Text style={styles.dangerLabel}>DANGER ZONE</Text>
          <TouchableOpacity style={styles.dangerBtn} onPress={handleReset}>
            <Text style={styles.dangerBtnText}>Reset app data</Text>
          </TouchableOpacity>
        </View>

        {/* App info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>IngredientIQ · Hackathon Edition</Text>
          <Text style={styles.appInfoSub}>
            AI-powered supplement safety for Southeast Asia
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 24, paddingBottom: 48, gap: 24 },
  header: { gap: 4 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: Colors.textSecondary },
  activeBadge: {
    backgroundColor: Colors.accentDim,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.accent + '33',
    padding: 14,
  },
  activeBadgeText: { fontSize: 13, color: Colors.accentLight, lineHeight: 20 },
  categoryBlock: { gap: 0 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  saveBtn: { marginTop: 8 },
  dangerZone: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.nogo + '33',
    padding: 18,
    gap: 12,
  },
  dangerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.nogo,
    letterSpacing: 1.5,
  },
  dangerBtn: {
    borderWidth: 1,
    borderColor: Colors.nogo + '55',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  dangerBtnText: { color: Colors.nogo, fontSize: 14, fontWeight: '600' },
  appInfo: { alignItems: 'center', gap: 4, paddingTop: 8 },
  appInfoText: { fontSize: 13, color: Colors.textMuted, fontWeight: '600' },
  appInfoSub: { fontSize: 12, color: Colors.textMuted, textAlign: 'center' },
});