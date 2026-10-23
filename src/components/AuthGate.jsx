import { useRef, useState } from 'react';
import CloudAuthGate from './CloudAuthGate.jsx';
import { isCloudConfigured } from '../lib/supabaseClient.js';
import './AuthGate.css';
import {
  activateLocalProfile,
  clearLocalProfileSession,
  createLocalAccount,
  getLocalAccountById,
  getProfilePlayerStorageKey,
  getSavedProfileSession,
  hasLocalAccounts,
  loginLocalAccount,
} from '../game/accounts';
import { validatePlayerRecord } from '../game/brainFeatures';
import { downloadTextFile } from '../game/downloads.js';

function initialAccount() {
  try {
    const session = getSavedProfileSession();
    if (!session) return null;
    const account = getLocalAccountById(session.profileId);
    if (!account) {
      clearLocalProfileSession();
      return null;
    }
    return activateLocalProfile(account.id, { remember: session.remember });
  } catch {
    clearLocalProfileSession();
    return null;
  }
}

function downloadJson(filename, value) {
  return downloadTextFile(filename, JSON.stringify(value, null, 2), 'application/json;charset=utf-8');
}

function LocalAuthGate({ children }) {
  const [account, setAccount] = useState(initialAccount);
  const [mode, setMode] = useState(() => (hasLocalAccounts() ? 'login' : 'register'));
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [menuError, setMenuError] = useState('');
  const fileInputRef = useRef(null);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setBusy(true);
    try {
      const signedIn = mode === 'register'
        ? await createLocalAccount({ name, email, password })
        : await loginLocalAccount({ email, password });
      const activeAccount = activateLocalProfile(signedIn.id, { remember });
      setAccount(activeAccount);
      setPassword('');
      setNotice(mode === 'register' ? 'Your local profile is ready. Your progress will be saved on this device.' : 'Welcome back. Your saved progress has been restored.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const logout = () => {
    clearLocalProfileSession();
    setAccount(null);
    setAccountMenuOpen(false);
    setMode('login');
    setPassword('');
    setError('');
    setNotice('');
  };

  const exportProgress = () => {
    setMenuError('');
    try {
      const rawPlayer = localStorage.getItem(getProfilePlayerStorageKey(account.id));
      const player = rawPlayer ? JSON.parse(rawPlayer) : null;
      if (!player) {
        setMenuError('No progress has been saved yet. Finish a test first, then export a backup.');
        return;
      }
      downloadJson('your-brain-is-lying-backup.json', {
        app: 'Your Brain Is Lying',
        schemaVersion: 1,
        exportedAt: new Date().toISOString(),
        profile: { name: account.name, email: account.email },
        player,
      });
      setMenuError('Backup download started.');
    } catch {
      setMenuError('Could not create the backup. Please try again.');
    }
  };

  const importProgress = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const backup = JSON.parse(String(reader.result || ''));
        if (
          backup?.app !== 'Your Brain Is Lying' ||
          backup?.schemaVersion !== 1 ||
          !validatePlayerRecord(backup.player)
        ) {
          throw new Error('This file is not a valid Your Brain Is Lying backup.');
        }
        localStorage.setItem(getProfilePlayerStorageKey(account.id), JSON.stringify(backup.player));
        window.location.reload();
      } catch (cause) {
        setMenuError(cause instanceof Error ? cause.message : 'Could not restore this backup.');
      }
    };
    reader.onerror = () => setMenuError('Could not read that file.');
    reader.readAsText(file);
  };

  if (!account) {
    return (
      <main className="auth-page">
        <div className="auth-grain" aria-hidden="true" />
        <section className="auth-card" aria-labelledby="auth-title">
          <div className="auth-brand-mark" aria-hidden="true">🧠</div>
          <p className="auth-eyebrow">YOUR MIND. YOUR PROGRESS.</p>
          <h1 id="auth-title">{mode === 'register' ? 'Create your profile' : 'Welcome back'}</h1>
          <p className="auth-subtitle">
            {mode === 'register'
              ? 'Create a local profile to keep your brain-training progress together.'
              : 'Sign in to pick up where you left off.'}
          </p>

          <div className="auth-mode-tabs" role="tablist" aria-label="Account action">
            <button type="button" role="tab" aria-selected={mode === 'login'} className={mode === 'login' ? 'is-active' : ''} onClick={() => { setMode('login'); setError(''); }}>Sign in</button>
            <button type="button" role="tab" aria-selected={mode === 'register'} className={mode === 'register' ? 'is-active' : ''} onClick={() => { setMode('register'); setError(''); }}>Create account</button>
          </div>

          <form className="auth-form" onSubmit={submit}>
            {mode === 'register' && (
              <label>
                Display name
                <input autoComplete="name" maxLength={40} value={name} onChange={(event) => setName(event.target.value)} placeholder="What should we call you?" required />
              </label>
            )}
            <label>
              Email
              <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required />
            </label>
            <label>
              Password
              <input type="password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} minLength={mode === 'register' ? 8 : 1} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={mode === 'register' ? 'At least 8 characters' : 'Your password'} required />
            </label>
            <label className="auth-remember">
              <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
              <span>Keep me signed in on this device</span>
            </label>
            {error && <p className="auth-message is-error" role="alert">{error}</p>}
            {notice && <p className="auth-message is-notice" role="status">{notice}</p>}
            <button className="auth-submit" type="submit" disabled={busy}>
              {busy ? 'Please wait…' : mode === 'register' ? 'Create my profile' : 'Sign in and continue'}
              {!busy && <span aria-hidden="true">→</span>}
            </button>
          </form>

          <p className="auth-privacy-note">
            <span aria-hidden="true">▣</span> Offline-friendly local profile. Scores stay on this device and are not synced to an online server.
          </p>
          <p className="auth-security-note">
            This is device-level sign-in, not a cloud account. Keep a backup if you clear app data or change devices.
          </p>
          <p className="auth-security-note"><a href="/privacy.html">Read the privacy and data notice</a></p>
        </section>
      </main>
    );
  }

  return (
    <>
      {children}
      <div className="account-dock">
        <button className="account-dock-trigger" type="button" aria-expanded={accountMenuOpen} onClick={() => { setAccountMenuOpen((open) => !open); setMenuError(''); }}>
          <span className="account-avatar" aria-hidden="true">{(account.name || account.email).charAt(0).toUpperCase()}</span>
          <span className="account-dock-name">{account.name}</span>
          <span className="account-dock-chevron" aria-hidden="true">{accountMenuOpen ? '×' : '⌄'}</span>
        </button>
        {accountMenuOpen && (
          <div className="account-menu">
            <p className="account-menu-label">SIGNED IN AS</p>
            <strong>{account.name}</strong>
            <small>{account.email}</small>
            <button type="button" onClick={exportProgress}>Download progress backup</button>
            <button type="button" onClick={() => fileInputRef.current?.click()}>Restore from backup</button>
            <input ref={fileInputRef} className="auth-file-input" type="file" accept="application/json,.json" onChange={importProgress} />
            {menuError && <p className="account-menu-message" role="status">{menuError}</p>}
            <button type="button" className="account-signout" onClick={logout}>Sign out</button>
            <p className="account-menu-footnote">Local profile · this device only</p>
          </div>
        )}
      </div>
    </>
  );
}

export default function AuthGate(props) {
  return isCloudConfigured ? <CloudAuthGate {...props} /> : <LocalAuthGate {...props} />;
}
