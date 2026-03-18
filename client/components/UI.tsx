import React, { useEffect, useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

import { Colors } from '../constants';
import type { ScanVerdict } from '../types';

type ButtonVariant = 'solid' | 'ghost';

export function PrimaryButton({
  label,
  onPress,
  style,
  variant = 'solid',
  disabled,
}: {
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  variant?: ButtonVariant;
  disabled?: boolean;
}) {
  const isGhost = variant === 'ghost';
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.btn,
        isGhost ? styles.btnGhost : styles.btnSolid,
        disabled && styles.btnDisabled,
        style,
      ]}
    >
      <Text style={[styles.btnText, isGhost ? styles.btnTextGhost : styles.btnTextSolid]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function LoadingPulse({ label }: { label?: string }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });

  return (
    <View style={styles.loadingRow}>
      <ActivityIndicator color={Colors.accent} />
      <Animated.Text style={[styles.loadingText, { opacity }]}>
        {label ?? 'Loading...'}
      </Animated.Text>
    </View>
  );
}

export function VerdictBanner({ status }: { status: ScanVerdict }) {
  const meta = useMemo(() => {
    if (status === 'GO') return { title: 'GO', sub: 'No issues detected for your profile', color: Colors.go };
    if (status === 'NO_GO') return { title: 'NO GO', sub: 'Not suitable for your profile', color: Colors.nogo };
    return { title: 'CAUTION', sub: 'Proceed carefully', color: Colors.caution };
  }, [status]);

  return (
    <View style={[styles.verdict, { borderColor: meta.color + '66', backgroundColor: meta.color + '12' }]}>
      <Text style={[styles.verdictTitle, { color: meta.color }]}>{meta.title}</Text>
      <Text style={styles.verdictSub}>{meta.sub}</Text>
    </View>
  );
}

export function Badge({
  label,
  color,
  style,
}: {
  label: string;
  color: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.badge, { borderColor: color + '66', backgroundColor: color + '12' }, style]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

export function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {!!subtitle && <Text style={styles.sectionSub}>{subtitle}</Text>}
    </View>
  );
}

export function RestrictionChip({
  emoji,
  label,
  selected,
  onPress,
}: {
  emoji: string;
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        styles.chip,
        selected ? styles.chipSelected : styles.chipUnselected,
      ]}
    >
      <Text style={styles.chipEmoji}>{emoji}</Text>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  btnSolid: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  btnGhost: {
    backgroundColor: 'transparent',
    borderColor: Colors.border,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { fontSize: 15, fontWeight: '700' },
  btnTextSolid: { color: '#0B0B10' },
  btnTextGhost: { color: Colors.textSecondary },

  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  loadingText: { color: Colors.textSecondary, fontSize: 14, fontWeight: '600' },

  verdict: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  verdictTitle: { fontSize: 24, fontWeight: '900', letterSpacing: 1 },
  verdictSub: { fontSize: 13, color: Colors.textSecondary },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.6 },

  sectionHeader: { gap: 4, paddingTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  sectionSub: { fontSize: 13, color: Colors.textSecondary },

  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipSelected: {
    backgroundColor: Colors.accentDim,
    borderColor: Colors.accent + '55',
  },
  chipUnselected: {
    backgroundColor: Colors.bgCard,
    borderColor: Colors.border,
  },
  chipEmoji: { fontSize: 16 },
  chipText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  chipTextSelected: { color: Colors.accentLight },
});

