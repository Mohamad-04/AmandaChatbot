// Static data for the personalisation onboarding flow.
// Shared between the onboarding screen and the profile panel edit flow.
// When the backend is ready, these lists may be driven by the API instead.

// ── Step metadata ──────────────────────────────────────────────────────────────

export const PERSONALISATION_STEPS = [
  {
    tag:      'Getting to know you',
    title:    "What brings you\nto Amanda?",
    subtitle: 'Choose everything that feels relevant. Amanda will use this to understand you better.',
  },
  {
    tag:      'Getting to know you',
    title:    "How are you\nfeeling?",
    subtitle: 'No right or wrong answer - just pick what feels closest right now.',
  },
  {
    tag:      'Your goals',
    title:    "What would you like\nto work on?",
    subtitle: 'Pick at least one goal to help Amanda support you in the right direction.',
  },
  {
    tag:      'Your preferences',
    title:    "Have you tried\ntherapy before?",
    subtitle: 'This helps Amanda understand where you are on your journey.',
  },
  {
    tag:      'Your preferences',
    title:    "How would you like\nAmanda to speak?",
    subtitle: 'These help Amanda match her style to what feels comfortable for you.',
  },
];

// ── Option lists ───────────────────────────────────────────────────────────────

// Reasons a user might be coming to Amanda — multi-select
export const REASONS = [
  'Stress', 'Anxiety', 'Relationships',
  'Grief', 'Self-growth', 'Just exploring',
];

// Current mood — single-select with emoji
export const MOODS: { label: string; emoji: string }[] = [
  { label: 'Good',        emoji: '😊' },
  { label: 'Okay',        emoji: '🙂' },
  { label: 'Anxious',     emoji: '😬' },
  { label: 'Low',         emoji: '😔' },
  { label: 'Overwhelmed', emoji: '🫠' },
  { label: 'Numb',        emoji: '😶' },
];

// Goals the user wants to work on — multi-select
export const GOALS = [
  'Handle my anxiety',
  'Manage my stress',
  'Build self-confidence',
  'Understand my emotions',
  'Overcome loneliness',
  'Build healthier boundaries',
  'Have someone to talk to',
];

// Prior therapy experience — single-select
export const THERAPY_OPTIONS: { label: string; desc: string; symbol: string }[] = [
  { label: 'Yes',               desc: "I've been in therapy before",          symbol: '✓' },
  { label: 'No',                desc: "I haven't worked with a therapist yet", symbol: '✦' },
  { label: 'Prefer not to say', desc: "I'd rather keep this private",          symbol: '·' },
];

// Preferred tone for Amanda's responses — single-select
export const TONE_PREFERENCES: { label: string; desc: string; symbol: string }[] = [
  { label: 'Warm & gentle',       desc: 'Soft, empathetic, nurturing',       symbol: '🌸' },
  { label: 'Calm & professional', desc: 'Balanced, thoughtful, measured',    symbol: '🧘' },
  { label: 'Direct & practical',  desc: 'Clear, honest, solution-focused',   symbol: '🎯' },
];

// ── AsyncStorage keys ──────────────────────────────────────────────────────────

// Stores the user's answers as JSON — swapped for PATCH /api/users/profile when backend is ready
export const PERSONALISATION_KEY  = '@amanda_personalisation';

// Boolean flag — set once the flow has been seen (even if skipped)
export const PERSONALISED_FLAG    = '@amanda_personalised';
