const KEY = 'your-brain-is-lying-preferences-v1';
export const DEFAULT_PREFERENCES = Object.freeze({
  reducedMotion: false,
  highContrast: false,
  largeText: false,
  simpleVisuals: false,
});

export function loadPreferences() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || '{}');
    return Object.fromEntries(Object.keys(DEFAULT_PREFERENCES).map((key) => [key, typeof parsed[key] === 'boolean' ? parsed[key] : DEFAULT_PREFERENCES[key]]));
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export function savePreferences(preferences) {
  const safe = Object.fromEntries(Object.keys(DEFAULT_PREFERENCES).map((key) => [key, Boolean(preferences?.[key])]));
  try {
    localStorage.setItem(KEY, JSON.stringify(safe));
    return { saved: true, preferences: safe };
  } catch {
    return { saved: false, preferences: safe };
  }
}

export function applyPreferences(preferences) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.toggle('phase-reduced-motion', Boolean(preferences?.reducedMotion));
  root.classList.toggle('phase-high-contrast', Boolean(preferences?.highContrast));
  root.classList.toggle('phase-large-text', Boolean(preferences?.largeText));
  root.classList.toggle('phase-simple-visuals', Boolean(preferences?.simpleVisuals));
}
