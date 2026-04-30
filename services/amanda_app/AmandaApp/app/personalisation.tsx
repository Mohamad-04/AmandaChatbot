// Personalisation onboarding — shown once after profile setup, before entering chat.
// 5 steps, one question per screen, fully skippable in one tap.
// Design follows the "How it works" page: centered, warm, progress dots.
//
// All logic lives in hooks/use-personalisation.ts
// All styles live in styles/personalisation.styles.ts
// All data/constants live in constants/personalisation.ts

import React from 'react';
import {
  View, Text, TouchableOpacity, SafeAreaView,
  StatusBar, ScrollView, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import Background from '../components/background';
import { usePersonalisation } from '../hooks/use-personalisation';
import { styles as s } from '../styles/personalisation.styles';
import { colors } from '../constants/tokens';
import {
  PERSONALISATION_STEPS,
  REASONS, MOODS, GOALS,
  THERAPY_OPTIONS, TONE_PREFERENCES,
} from '../constants/personalisation';

const { width } = Dimensions.get('window');

export default function PersonalisationScreen() {
  const router = useRouter();

  const {
    step, totalSteps,
    reasons, mood, goals, therapyExperience, tonePreference,
    setMood, setTherapyExperience, setTonePreference,
    toggleReason, toggleGoal,
    canProceed, handleNext, handleBack, handleSkip,
  } = usePersonalisation(
    () => router.replace('/chat'),  // onComplete
    () => router.replace('/chat'),  // onSkip
  );

  // ── Chip — pill button for multi-select steps ────────────────────────────

  const Chip = ({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[s.chip, selected ? s.chipSelected : s.chipUnselected]}
    >
      <Text style={selected ? s.chipTextSelected : s.chipTextUnselected}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  // ── Step content — one block per step ────────────────────────────────────

  const renderOptions = () => {
    switch (step) {

      // Step 1 — reasons for coming to Amanda (multi-select chips)
      case 0:
        return (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 8, paddingHorizontal: 8 }}>
            {REASONS.map(r => (
              <Chip key={r} label={r} selected={reasons.includes(r)} onPress={() => toggleReason(r)} />
            ))}
          </View>
        );

      // Step 2 — current mood (single-select emoji grid)
      case 1:
        return (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 8 }}>
            {MOODS.map(m => {
              const active = mood === m.label;
              return (
                <TouchableOpacity
                  key={m.label}
                  onPress={() => setMood(m.label)}
                  activeOpacity={0.75}
                  style={[s.moodCard, active ? s.moodCardSelected : s.moodCardUnselected]}
                >
                  <Text style={s.moodEmoji}>{m.emoji}</Text>
                  <Text style={active ? s.moodLabelSelected : s.moodLabelUnselected}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        );

      // Step 3 — goals to work on (multi-select chips)
      case 2:
        return (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 8, paddingHorizontal: 8 }}>
            {GOALS.map(g => (
              <Chip key={g} label={g} selected={goals.includes(g)} onPress={() => toggleGoal(g)} />
            ))}
          </View>
        );

      // Step 4 — therapy experience (single-select full-width cards)
      case 3:
        return (
          <View style={{ width: '100%', marginTop: 8 }}>
            {THERAPY_OPTIONS.map(opt => {
              const active = therapyExperience === opt.label;
              return (
                <TouchableOpacity
                  key={opt.label}
                  onPress={() => setTherapyExperience(opt.label)}
                  activeOpacity={0.75}
                  style={[s.optionCard, active ? s.optionCardSelected : s.optionCardUnselected]}
                >
                  <View style={[s.optionIconCircle, active ? s.optionIconCircleSelected : s.optionIconCircleUnselected]}>
                    <Text style={active ? s.optionSymbolSelected : s.optionSymbolUnselected}>
                      {opt.symbol}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.optionLabel}>{opt.label}</Text>
                    <Text style={s.optionDesc}>{opt.desc}</Text>
                  </View>
                  <View style={[s.checkCircle, active ? s.checkCircleSelected : s.checkCircleUnselected]}>
                    <Text style={[s.checkIcon, { color: active ? 'white' : 'transparent' }]}>✓</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        );

      // Step 5 — tone preference (single-select full-width cards)
      case 4:
        return (
          <View style={{ width: '100%', marginTop: 8 }}>
            {TONE_PREFERENCES.map(t => {
              const active = tonePreference === t.label;
              return (
                <TouchableOpacity
                  key={t.label}
                  onPress={() => setTonePreference(t.label)}
                  activeOpacity={0.75}
                  style={[s.optionCard, active ? s.optionCardSelected : s.optionCardUnselected]}
                >
                  <View style={[s.optionIconCircle, active ? s.optionIconCircleSelected : s.optionIconCircleUnselected]}>
                    <Text style={{ fontSize: 22 }}>{t.symbol}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.optionLabel}>{t.label}</Text>
                    <Text style={s.optionDesc}>{t.desc}</Text>
                  </View>
                  <View style={[s.checkCircle, active ? s.checkCircleSelected : s.checkCircleUnselected]}>
                    <Text style={[s.checkIcon, { color: active ? 'white' : 'transparent' }]}>✓</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        );
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  const currentStep = PERSONALISATION_STEPS[step];

  return (
    <Background>
      <SafeAreaView style={s.container}>
        <StatusBar barStyle="dark-content" />

        {/* Skip button — always visible, signals this flow is optional */}
        <TouchableOpacity onPress={handleSkip} activeOpacity={0.7} style={s.skipBtn}>
          <Text style={s.skipBtnText}>Skip for now →</Text>
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Progress dots — pill style, active dot widens */}
          <View style={s.dotsRow}>
            {PERSONALISATION_STEPS.map((_, i) => (
              <View key={i} style={{
                height: 8, borderRadius: 4,
                width: i === step ? 24 : 8,
                backgroundColor: i === step ? colors.primary : 'rgba(168,122,116,0.25)',
              }} />
            ))}
          </View>

          {/* Heading — tag, title, subtitle */}
          <View style={s.headingContainer}>
            <Text style={s.tag}>{currentStep.tag}</Text>
            <Text style={s.title}>{currentStep.title}</Text>
            <Text style={s.subtitle}>{currentStep.subtitle}</Text>
          </View>

          {/* Options — chips or full-width cards depending on step */}
          <View style={{ paddingHorizontal: step >= 3 ? 28 : 20, alignItems: step < 3 ? 'center' : 'stretch' }}>
            {renderOptions()}
          </View>
        </ScrollView>

        {/* Bottom controls — continue button, back link, disclaimer */}
        <View style={s.bottomBar}>

          <TouchableOpacity
            style={[s.continueBtn, canProceed() ? s.continueBtnActive : s.continueBtnDisabled]}
            onPress={handleNext}
            disabled={!canProceed()}
            activeOpacity={0.85}
          >
            <Text style={canProceed() ? s.continueBtnTextActive : s.continueBtnTextDisabled}>
              {step === totalSteps - 1 ? '✦  Get started' : 'Continue →'}
            </Text>
          </TouchableOpacity>

          {step > 0 ? (
            <TouchableOpacity onPress={handleBack} activeOpacity={0.7} style={s.backBtn}>
              <Text style={s.backBtnText}>← Back</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ height: 34 }} />
          )}

          <Text style={s.disclaimer}>Not a replacement for professional mental health support</Text>

        </View>

      </SafeAreaView>
    </Background>
  );
}
