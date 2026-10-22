const ACCOUNTS_KEY = 'your-brain-is-lying-accounts-v1';
const ACTIVE_PROFILE_KEY = 'your-brain-is-lying-active-profile';
const REMEMBERED_PROFILE_KEY = 'your-brain-is-lying-remembered-profile';
const SESSION_PROFILE_KEY = 'your-brain-is-lying-session-profile';
const LEGACY_PLAYER_KEY = 'your-brain-is-lying-player';
const MIGRATION_KEY = 'your-brain-is-lying-player-migrated-to-profile-v1';
const PLAYER_KEY_PREFIX = LEGACY_PLAYER_KEY + ':';

function readAccounts() {
  try {
    const parsed = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter((entry) => (
      entry && typeof entry.id === 'string' &&
      typeof entry.email === 'string' &&
      typeof entry.salt === 'string' &&
      typeof entry.passwordHash === 'string'
    )) : [];
  } catch {
    return [];
  }
}

function publicAccount(account) {
  if (!account) return null;
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    createdAt: account.createdAt,
  };
}

function randomId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
}

function toHex(bytes) {
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function derivePasswordHash(password, saltHex) {
  if (!globalThis.crypto?.subtle || !globalThis.crypto?.getRandomValues) {
    throw new Error('Secure password hashing is unavailable in this browser. Please update your browser or use the app over HTTPS.');
  }

  const salt = new Uint8Array(saltHex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));
  const key = await globalThis.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await globalThis.crypto.subtle.deriveBits({
    name: 'PBKDF2',
    salt,
    iterations: 120000,
    hash: 'SHA-256',
  }, key, 256);

  return toHex(bits);
}

function safeCompare(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string' || left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

export function getSavedProfileSession() {
  try {
    const rememberedId = localStorage.getItem(REMEMBERED_PROFILE_KEY);
    if (rememberedId) return { profileId: rememberedId, remember: true };
    const sessionId = sessionStorage.getItem(SESSION_PROFILE_KEY);
    if (sessionId) return { profileId: sessionId, remember: false };
  } catch {
    // A restricted storage context will fall back to the sign-in screen.
  }
  return null;
}

export function getLocalAccountById(profileId) {
  if (!profileId) return null;
  const account = readAccounts().find((entry) => entry.id === profileId);
  return publicAccount(account);
}

export function hasLocalAccounts() {
  return readAccounts().length > 0;
}

export function activateLocalProfile(profileId, { remember = true } = {}) {
  if (!profileId) throw new Error('Choose an account before opening your progress.');
  const account = readAccounts().find((entry) => entry.id === profileId);
  if (!account) throw new Error('This local profile could not be found. Please sign in again.');

  const profilePlayerKey = PLAYER_KEY_PREFIX + profileId;
  if (localStorage.getItem(profilePlayerKey) === null) {
    const alreadyMigrated = localStorage.getItem(MIGRATION_KEY) === '1';
    const legacyProgress = localStorage.getItem(LEGACY_PLAYER_KEY);
    if (!alreadyMigrated && legacyProgress !== null) {
      localStorage.setItem(profilePlayerKey, legacyProgress);
    }
    if (!alreadyMigrated) localStorage.setItem(MIGRATION_KEY, '1');
  }

  localStorage.setItem(ACTIVE_PROFILE_KEY, profileId);
  if (remember) {
    localStorage.setItem(REMEMBERED_PROFILE_KEY, profileId);
    sessionStorage.removeItem(SESSION_PROFILE_KEY);
  } else {
    localStorage.removeItem(REMEMBERED_PROFILE_KEY);
    sessionStorage.setItem(SESSION_PROFILE_KEY, profileId);
  }

  return publicAccount(account);
}

export async function createLocalAccount({ name, email, password }) {
  const cleanName = String(name || '').trim().replace(/\s+/g, ' ');
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanPassword = String(password || '');

  if (cleanName.length < 2 || cleanName.length > 40) {
    throw new Error('Name must be between 2 and 40 characters.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    throw new Error('Enter a valid email address.');
  }
  if (cleanPassword.length < 8) {
    throw new Error('Use a password with at least 8 characters.');
  }
  if (readAccounts().some((entry) => entry.email.toLowerCase() === cleanEmail)) {
    throw new Error('An account with this email already exists on this device. Sign in instead.');
  }

  const saltBytes = new Uint8Array(16);
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error('Secure password storage is unavailable in this browser.');
  }
  globalThis.crypto.getRandomValues(saltBytes);
  const salt = toHex(saltBytes);
  const passwordHash = await derivePasswordHash(cleanPassword, salt);
  const account = {
    id: randomId(),
    name: cleanName,
    email: cleanEmail,
    salt,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  const accounts = readAccounts();
  accounts.push(account);
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  return publicAccount(account);
}

export async function loginLocalAccount({ email, password }) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const account = readAccounts().find((entry) => entry.email.toLowerCase() === cleanEmail);
  if (!account) throw new Error('Email or password is incorrect.');

  const candidateHash = await derivePasswordHash(String(password || ''), account.salt);
  if (!safeCompare(candidateHash, account.passwordHash)) {
    throw new Error('Email or password is incorrect.');
  }
  return publicAccount(account);
}

export function clearLocalProfileSession() {
  try {
    localStorage.removeItem(ACTIVE_PROFILE_KEY);
    localStorage.removeItem(REMEMBERED_PROFILE_KEY);
    sessionStorage.removeItem(SESSION_PROFILE_KEY);
  } catch {
    // The UI can still return to the sign-in screen if storage is restricted.
  }
}

export function getProfilePlayerStorageKey(profileId) {
  return PLAYER_KEY_PREFIX + profileId;
}
