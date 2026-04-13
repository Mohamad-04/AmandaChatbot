// Hook for the personalisation onboarding flow.
// Manages all step state, selection toggles, skip, and save logic.
//
// Used by both the onboarding screen (app/personalisation.tsx) and
// the profile panel edit flow (components/profile-panel.tsx).
//
// Storage: AsyncStorage as a placeholder until the backend profile
// endpoint is ready. When ready: swap saveAnswers() for a PATCH /api/users/profile call.

import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PERSONALISATION_KEY, PERSONALISED_FLAG, PERSONALISATION_STEPS } from '../constants/personalisation';

// Shape of the answers stored in AsyncStorage
export interface PersonalisationAnswers {
  reasons:           string[];
  mood:              string;
  goals:             string[];
  therapyExperience: string;
  tonePreference:    string;
}

export function usePersonalisation(onComplete: () => void, onSkip: () => void) {
  const totalSteps = PERSONALISATION_STEPS.length;

  const [step,              setStep]              = useState(0);
  const [reasons,           setReasons]           = useState<string[]>([]);
  const [mood,              setMood]              = useState('');
  const [goals,             setGoals]             = useState<string[]>([]);
  const [therapyExperience, setTherapyExperience] = useState('');
  const [tonePreference,    setTonePreference]    = useState('');

  // Toggles a reason chip on or off
  const toggleReason = (r: string) =>
    setReasons(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);

  // Toggles a goal chip on or off
  const toggleGoal = (g: string) =>
    setGoals(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);

  // Returns true if the current step has a valid selection to proceed
  const canProceed = (): boolean => {
    if (step === 0) return reasons.length > 0;
    if (step === 1) return mood !== '';
    if (step === 2) return goals.length > 0;
    if (step === 3) return therapyExperience !== '';
    if (step === 4) return tonePreference !== '';
    return false;
  };

  // Advances to the next step, or saves and completes the flow on the last step
  const handleNext = () => {
    if (step < totalSteps - 1) setStep(s => s + 1);
    else saveAnswers();
  };

  // Goes back one step
  const handleBack = () => setStep(s => s - 1);

  // Skips the entire flow — marks it as seen without saving any answers
  const handleSkip = async () => {
    await AsyncStorage.setItem(PERSONALISED_FLAG, 'true').catch(() => {});
    onSkip();
  };

  // Saves all answers then completes the flow
  // TODO: replace AsyncStorage with PATCH /api/users/profile when backend is ready
  const saveAnswers = async () => {
    const answers: PersonalisationAnswers = {
      reasons, mood, goals, therapyExperience, tonePreference,
    };
    await AsyncStorage.setItem(PERSONALISED_FLAG, 'true').catch(() => {});
    await AsyncStorage.setItem(PERSONALISATION_KEY, JSON.stringify(answers)).catch(() => {});
    onComplete();
  };

  // Loads previously saved answers into state — used when editing from profile panel
  const loadSavedAnswers = async () => {
    const val = await AsyncStorage.getItem(PERSONALISATION_KEY).catch(() => null);
    if (!val) return;
    const saved = JSON.parse(val) as PersonalisationAnswers;
    setReasons(saved.reasons           || []);
    setMood(saved.mood                 || '');
    setGoals(saved.goals               || []);
    setTherapyExperience(saved.therapyExperience || '');
    setTonePreference(saved.tonePreference       || '');
  };

  return {
    step,
    totalSteps,
    reasons,
    mood,
    goals,
    therapyExperience,
    tonePreference,
    setMood,
    setTherapyExperience,
    setTonePreference,
    toggleReason,
    toggleGoal,
    canProceed,
    handleNext,
    handleBack,
    handleSkip,
    loadSavedAnswers,
  };
}
