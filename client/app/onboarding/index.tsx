import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppStore } from '../../store/useAppStore';
import { RESTRICTIONS, Colors } from '../../constants';
import { DietaryRestriction, RestrictionMeta } from '../../types';
import { RestrictionChip, PrimaryButton } from '../../components/UI';

const { width } = Dimensions.get('window');

const STEPS = [
  {
    key: 'welcome',
    heading: 'Know what\nyou take.',
    sub: 'Scan any supplement label and get an instant safety verdict based on your dietary needs.',
  },
  {
    key: 'religious',
    heading: 'Your faith,\nyour rules.',
    sub: 'Select any religious or lifestyle dietary requirements.',
    category: 'religious' as const,
  },
  {
    key: 'lifestyle',
    heading: 'How do\nyou eat?',
    sub: 'Choose your lifestyle preferences.',
    category: 'lifestyle' as const,
  },
  {
    key: 'allergen',
    heading: 'Any\nallergies?',
    sub: "We'll flag any ingredients that could affect you.",
    category: 'allergen' as const,
  },
];

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const { restrictions, toggleRestriction, completeOnboarding } = useAppStore();
  const router = useRouter();

  const goNext = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      if (step < STEPS.length - 1) {
        setStep((s) => s + 1);
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
      } else {
        completeOnboarding();
        router.replace('/(tabs)');
      }
    });
  };

  const currentStep = STEPS[step];
  const isWelcome = currentStep.key === 'welcome';
  const categoryItems = currentStep.category
    ? RESTRICTIONS.filter((r) => r.category === currentStep.category)
    : [];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Progress dots */}
        <View style={styles.dots}>
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === step && styles.dotActive,
                i < step && styles.dotDone,
              ]}
            />
          ))}
        </View>

        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Step heading */}
          <View style={styles.headingBlock}>
            {isWelcome && (
              <View style={styles.logoMark}>
                <Text style={styles.logoMarkText}>⬡</Text>
              </View>
            )}
            <Text style={styles.heading}>{currentStep.heading}</Text>
            <Text style={styles.sub}>{currentStep.sub}</Text>
          </View>

          {/* Restriction chips */}
          {!isWelcome && (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.chipsContainer}
            >
              {categoryItems.map((item) => (
                <RestrictionChip
                  key={item.id}
                  emoji={item.emoji}
                  label={item.label}
                  selected={restrictions.includes(item.id)}
                  onPress={() => toggleRestriction(item.id)}
                />
              ))}
              {step !== 0 && step !== STEPS.length - 1 && (
                <TouchableOpacity onPress={goNext} style={styles.skipBtn}>
                  <Text style={styles.skipText}>Skip this step</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          )}
        </Animated.View>

        {/* CTA */}
        <View style={styles.footer}>
          {!isWelcome && step === STEPS.length - 1 && restrictions.length === 0 && (
            <Text style={styles.noneNote}>No allergies? That's fine — tap Continue.</Text>
          )}
          <PrimaryButton
            label={step === STEPS.length - 1 ? "I'm ready to scan" : isWelcome ? 'Get started' : 'Continue'}
            onPress={goNext}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 },
  dots: { flexDirection: 'row', gap: 6, marginBottom: 40 },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.border,
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.accent,
  },
  dotDone: { backgroundColor: Colors.accentDim },
  content: { flex: 1 },
  headingBlock: { marginBottom: 32, gap: 12 },
  logoMark: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.accentDim,
    borderWidth: 1,
    borderColor: Colors.accent + '44',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoMarkText: { fontSize: 28, color: Colors.accent },
  heading: {
    fontSize: 42,
    fontWeight: '800',
    color: Colors.text,
    lineHeight: 48,
    letterSpacing: -1,
  },
  sub: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
    maxWidth: 300,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingBottom: 20,
  },
  skipBtn: { paddingVertical: 10 },
  skipText: { color: Colors.textMuted, fontSize: 14 },
  footer: { gap: 12, paddingTop: 12 },
  noneNote: {
    textAlign: 'center',
    color: Colors.textMuted,
    fontSize: 13,
  },
});