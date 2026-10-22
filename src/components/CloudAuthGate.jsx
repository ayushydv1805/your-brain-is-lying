import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import { hydrateCloudProgress, mergePlayerSnapshots, pushCloudProgress } from '../game/cloudProgress.js';
import { getPlayerStorageStatus, loadPlayer, savePlayer } from '../game/storage.js';
import { getMyProfile, saveMyProfile } from '../game/socialApi.js';
import { CloudAuthContext } from '../lib/CloudAuthContext.jsx';
import './AuthGate.css';

const ACTIVE_PROFILE_KEY = 'your-brain-is-lying-active-profile';

function safeHandle(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20);
}

function friendlyError(error) {
  const message = String(error?.message || 'Something went wrong. Please try again.');
  if (/invalid login credentials/i.test(message)) return 'Email or password is incorrect.';
  if (/email not confirmed/i.test(message)) return 'Please verify your email from the confirmation link before signing in.';
  if (/failed to fetch|network|fetch/i.test(message)) return 'Could not reach Supabase. Check your internet connection and project URL.';
  if (/relation .* does not exist|could not find the table/i.test(message)) return 'The Phase C/D database schema is not installed yet. Run supabase/phase-c-d-schema.sql in your project SQL Editor.';
  return message;
}

export default function CloudAuthGate({ children }) {
  const [session, setSession] = useState(null);
  const [booting, setBooting] = useState(true);
  const [screen, setScreen] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [handle, setHandle] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);
  const [profileIssue, setProfileIssue] = useState('');
  const [ready, setReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState('Connecting to cloud…');
  const [realtimeStatus, setRealtimeStatus] = useState('starting');
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [pendingImport, setPendingImport] = useState(null);
  const importInput = useRef(null);
  const saveTimer = useRef(null);
  const syncLock = useRef(false);
  const lastCloudPayload = useRef('');
  const loadedUserId = useRef(null);

  useEffect(() => {
    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      if (event === 'PASSWORD_RECOVERY') {
        setScreen('reset');
        setNotice('Choose a new password for your account.');
      }
    });
    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      if (sessionError) setError(friendlyError(sessionError));
      setSession(data?.session || null);
      setBooting(false);
    }).catch((cause) => {
      if (!active) return;
      setError(friendlyError(cause));
      setBooting(false);
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    const user = session?.user;
    if (!user) {
      setProfile(null);
      setReady(false);
      loadedUserId.current = null;
      try { localStorage.removeItem(ACTIVE_PROFILE_KEY); } catch { /* storage may be restricted */ }
      if (!booting) setSyncStatus('Signed out');
      return undefined;
    }

    let cancelled = false;
    setReady(false);
    setProfileIssue('');
    setSyncStatus('Loading your cloud profile…');
    (async () => {
      const remoteProfile = await getMyProfile(user.id);
      if (cancelled) return;
      if (!remoteProfile) {
        const metadata = user.user_metadata || {};
        setDisplayName(String(metadata.display_name || metadata.full_name || ''));
        setHandle(safeHandle(metadata.handle || String(user.email || '').split('@')[0]));
        setScreen('profile');
        setSyncStatus('Profile setup required');
        return;
      }
      setProfile(remoteProfile);
      window.localStorage.setItem(ACTIVE_PROFILE_KEY, user.id);
      await hydrateCloudProgress(user.id);
      if (cancelled) return;
      loadedUserId.current = user.id;
      setReady(true);
      setError('');
      setSyncStatus(navigator.onLine ? 'Cloud synced' : 'Offline · saved on this device');
      setScreen('app');
    })().catch((cause) => {
      if (cancelled) return;
      setProfileIssue(friendlyError(cause));
      setSyncStatus('Cloud setup needs attention');
    });
    return () => { cancelled = true; };
  }, [session?.user?.id, booting]);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!ready || !userId || loadedUserId.current !== userId) return undefined;
    let disposed = false;

    const queueSave = (event) => {
      if (disposed || !event?.detail?.player) return;
      if (!navigator.onLine) {
        setSyncStatus('Offline · saved on this device');
        return;
      }
      window.clearTimeout(saveTimer.current);
      setSyncStatus('Syncing progress…');
      const playerSnapshot = event.detail.player;
      saveTimer.current = window.setTimeout(async () => {
        if (disposed || syncLock.current) return;
        syncLock.current = true;
        try {
          await pushCloudProgress(userId, playerSnapshot);
          lastCloudPayload.current = JSON.stringify(playerSnapshot);
          if (!disposed) setSyncStatus('Cloud synced');
        } catch (cause) {
          if (!disposed) setSyncStatus('Saved here · cloud sync failed');
          console.error('Progress sync failed:', cause);
        } finally {
          syncLock.current = false;
        }
      }, 850);
    };

    const refreshRemote = async (remoteData) => {
      if (disposed || !remoteData || syncLock.current) return;
      const remoteFingerprint = JSON.stringify(remoteData);
      if (remoteFingerprint === lastCloudPayload.current) return;
      syncLock.current = true;
      try {
        const local = loadPlayer();
        const merged = mergePlayerSnapshots(local, remoteData);
        const before = JSON.stringify(local);
        const next = JSON.stringify({ ...merged, savedAt: local.savedAt });
        if (before !== next) {
          savePlayer(merged);
          await pushCloudProgress(userId, loadPlayer());
          lastCloudPayload.current = JSON.stringify(loadPlayer());
        } else {
          lastCloudPayload.current = remoteFingerprint;
        }
        if (!disposed) setSyncStatus('Cloud synced');
      } catch (cause) {
        if (!disposed) setSyncStatus('Saved here · sync needs attention');
        console.error('Remote progress update failed:', cause);
      } finally {
        syncLock.current = false;
      }
    };

    const onOnline = () => {
      setSyncStatus('Reconnecting…');
      pushCloudProgress(userId, loadPlayer())
        .then(() => { lastCloudPayload.current = JSON.stringify(loadPlayer()); setSyncStatus('Cloud synced'); })
        .catch(() => setSyncStatus('Saved here · cloud sync failed'));
    };

    window.addEventListener('brain-player-saved', queueSave);
    window.addEventListener('online', onOnline);
    const channel = supabase.channel('brain-progress-' + userId)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'brain_progress',
        filter: 'user_id=eq.' + userId,
      }, (payload) => {
        if (payload.new?.player_data) refreshRemote(payload.new.player_data);
      })
      .subscribe((status) => {
        if (disposed) return;
        setRealtimeStatus(status);
      });

    return () => {
      disposed = true;
      window.clearTimeout(saveTimer.current);
      window.removeEventListener('brain-player-saved', queueSave);
      window.removeEventListener('online', onOnline);
      supabase.removeChannel(channel);
    };
  }, [ready, session?.user?.id]);

  const runAuthAction = async (action) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await action();
    } catch (cause) {
      setError(friendlyError(cause));
    } finally {
      setBusy(false);
    }
  };

  const signIn = (event) => {
    event.preventDefault();
    runAuthAction(async () => {
      const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (authError) throw authError;
      setPassword('');
      setNotice('Signed in. Restoring your saved progress…');
    });
  };

  const signUp = (event) => {
    event.preventDefault();
    runAuthAction(async () => {
      const cleanName = displayName.trim().replace(/\s+/g, ' ');
      const cleanHandle = safeHandle(handle);
      if (cleanName.length < 2 || cleanName.length > 40) throw new Error('Name must be between 2 and 40 characters.');
      if (!/^[a-z0-9_]{3,20}$/.test(cleanHandle)) throw new Error('Handle must be 3–20 characters using letters, numbers or underscores.');
      if (password.length < 8) throw new Error('Use a password with at least 8 characters.');
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { display_name: cleanName, handle: cleanHandle },
        },
      });
      if (authError) throw authError;
      setPassword('');
      if (!data.session) {
        setNotice('Account created. Check your email for the confirmation link, then sign in here.');
      } else {
        setNotice('Account created. Preparing your profile…');
      }
    });
  };

  const sendRecovery = (event) => {
    event.preventDefault();
    runAuthAction(async () => {
      const { error: recoveryError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin,
      });
      if (recoveryError) throw recoveryError;
      setNotice('If this email belongs to an account, a password-reset link will arrive shortly.');
    });
  };

  const updatePassword = (event) => {
    event.preventDefault();
    runAuthAction(async () => {
      if (password.length < 8) throw new Error('Use a password with at least 8 characters.');
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setPassword('');
      setScreen('app');
      setNotice('Password updated successfully.');
    });
  };

  const saveProfile = (event) => {
    event.preventDefault();
    if (!session?.user?.id) return;
    runAuthAction(async () => {
      const saved = await saveMyProfile(session.user.id, { handle, displayName });
      setProfile(saved);
      setProfileIssue('');
      window.localStorage.setItem(ACTIVE_PROFILE_KEY, session.user.id);
      await hydrateCloudProgress(session.user.id);
      loadedUserId.current = session.user.id;
      setReady(true);
      setScreen('app');
      setSyncStatus('Cloud synced');
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setReady(false);
    setScreen('login');
    setShowAccountMenu(false);
    setPassword('');
  };

  const backupProgress = () => {
    const player = loadPlayer();
    const blob = new Blob([JSON.stringify({
      app: 'Your Brain Is Lying',
      schemaVersion: 2,
      exportedAt: new Date().toISOString(),
      profile: { handle: profile?.handle, displayName: profile?.display_name, email: session?.user?.email },
      player,
    }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'your-brain-is-lying-cloud-backup.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const restoreBackup = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const backup = JSON.parse(String(reader.result || ''));
        const player = backup?.player;
        if (backup?.app !== 'Your Brain Is Lying' || !player || typeof player !== 'object'
          || !Number.isFinite(Number(player.xp)) || Number(player.xp) < 0
          || !Array.isArray(player.runHistory) || !Array.isArray(player.activityDates)
          || !player.runHistory.every((run) => run && typeof run.type === 'string' && !Number.isNaN(new Date(run.at).getTime()))) {
          throw new Error('This file is not a valid progress backup.');
        }
        const merged = mergePlayerSnapshots(loadPlayer(), player);
        if (!savePlayer(merged)) throw new Error('Could not save the restored progress on this device.');
        pushCloudProgress(session.user.id, loadPlayer())
          .then(() => setSyncStatus('Backup restored and synced'))
          .catch(() => setSyncStatus('Backup restored locally · cloud sync failed'));
        setNotice('Progress backup restored.');
      } catch (cause) {
        setError(friendlyError(cause));
      }
    };
    reader.onerror = () => setError('Could not read that backup file.');
    reader.readAsText(file);
  };

  if (booting) {
    return <main className="auth-page"><section className="auth-card"><div className="auth-brand-mark">🧠</div><h1>Connecting your account</h1><p className="auth-subtitle">Restoring your secure sign-in session…</p></section></main>;
  }

  if (screen === 'reset') {
    return (
      <main className="auth-page"><div className="auth-grain" aria-hidden="true" /><section className="auth-card">
        <div className="auth-brand-mark">🔐</div><p className="auth-eyebrow">ACCOUNT RECOVERY</p><h1>Set a new password</h1>
        <form className="auth-form" onSubmit={updatePassword}><label>New password<input type="password" minLength={8} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
          {error && <p className="auth-message is-error" role="alert">{error}</p>}{notice && <p className="auth-message is-notice" role="status">{notice}</p>}
          <button className="auth-submit" disabled={busy}>{busy ? 'Saving…' : 'Update password'}<span>→</span></button>
        </form>
      </section></main>
    );
  }

  if (!session?.user) {
    const register = screen === 'register';
    const recovery = screen === 'forgot';
    return (
      <main className="auth-page"><div className="auth-grain" aria-hidden="true" /><section className="auth-card" aria-labelledby="cloud-auth-title">
        <div className="auth-brand-mark">🧠</div><p className="auth-eyebrow">YOUR MIND. YOUR PROGRESS.</p>
        <h1 id="cloud-auth-title">{register ? 'Create your cloud profile' : recovery ? 'Reset your password' : 'Welcome back'}</h1>
        <p className="auth-subtitle">{recovery ? 'We will email a secure password-reset link if your account exists.' : 'Sign in on any device and bring your saved practice progress with you.'}</p>
        {!recovery && <div className="auth-mode-tabs" role="tablist" aria-label="Account action"><button type="button" role="tab" aria-selected={!register} className={!register ? 'is-active' : ''} onClick={() => { setScreen('login'); setError(''); setNotice(''); }}>Sign in</button><button type="button" role="tab" aria-selected={register} className={register ? 'is-active' : ''} onClick={() => { setScreen('register'); setError(''); setNotice(''); }}>Create account</button></div>}
        <form className="auth-form" onSubmit={recovery ? sendRecovery : register ? signUp : signIn}>
          {register && <><label>Display name<input autoComplete="name" maxLength={40} value={displayName} onChange={(event) => setDisplayName(event.target.value)} required /></label><label>Unique handle<input autoComplete="username" minLength={3} maxLength={20} pattern="[a-zA-Z0-9_]{3,20}" value={handle} onChange={(event) => setHandle(event.target.value)} placeholder="e.g. brainrunner_01" required /><small className="auth-help">3–20 letters, numbers or underscores; used to find friends.</small></label></>}
          <label>Email<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          {!recovery && <label>Password<input type="password" autoComplete={register ? 'new-password' : 'current-password'} minLength={register ? 8 : 1} value={password} onChange={(event) => setPassword(event.target.value)} required /></label>}
          {error && <p className="auth-message is-error" role="alert">{error}</p>}{notice && <p className="auth-message is-notice" role="status">{notice}</p>}
          <button className="auth-submit" disabled={busy}>{busy ? 'Please wait…' : recovery ? 'Send reset link' : register ? 'Create cloud profile' : 'Sign in and sync'}<span>→</span></button>
        </form>
        <button type="button" className="auth-link-button" onClick={() => { setScreen(recovery ? 'login' : 'forgot'); setError(''); setNotice(''); }}>{recovery ? 'Back to sign in' : 'Forgot password?'}</button>
        <p className="auth-privacy-note"><span aria-hidden="true">▣</span> Your account is securely managed by Supabase. Your private game history is only available to your account.</p>
        <p className="auth-security-note">Cloud sync requires the schema in supabase/phase-c-d-schema.sql. The app falls back to device-local profiles until cloud credentials are configured.</p>
      </section></main>
    );
  }

  if (profileIssue) {
    return <main className="auth-page"><section className="auth-card"><div className="auth-brand-mark">⚠️</div><p className="auth-eyebrow">CLOUD SETUP</p><h1>One setup step remains</h1><p className="auth-subtitle">{profileIssue}</p><button className="auth-submit" onClick={() => { setProfileIssue(''); setReady(false); setSession({ ...session }); }}>Retry connection <span>→</span></button><button className="auth-link-button" onClick={signOut}>Sign out</button></section></main>;
  }

  if (screen === 'profile' && !profile) {
    return <main className="auth-page"><div className="auth-grain" aria-hidden="true" /><section className="auth-card">
      <div className="auth-brand-mark">🧠</div><p className="auth-eyebrow">PUBLIC PLAYER PROFILE</p><h1>Choose your handle</h1><p className="auth-subtitle">Your handle lets friends find you. Your email address is never shown on the leaderboard.</p>
      <form className="auth-form" onSubmit={saveProfile}><label>Display name<input value={displayName} maxLength={40} onChange={(event) => setDisplayName(event.target.value)} required /></label><label>Unique handle<input value={handle} minLength={3} maxLength={20} pattern="[a-zA-Z0-9_]{3,20}" onChange={(event) => setHandle(event.target.value)} required /></label>
        {error && <p className="auth-message is-error" role="alert">{error}</p>}<button className="auth-submit" disabled={busy}>{busy ? 'Saving profile…' : 'Save profile and sync'}<span>→</span></button>
      </form><button className="auth-link-button" onClick={signOut}>Sign out</button>
    </section></main>;
  }

  if (!ready || !profile) {
    return <main className="auth-page"><section className="auth-card"><div className="auth-brand-mark">☁️</div><h1>Syncing your progress</h1><p className="auth-subtitle">{syncStatus}</p><p className="auth-security-note">Your local save is preserved while the cloud profile is loading.</p>{error && <p className="auth-message is-error" role="alert">{error}</p>}</section></main>;
  }

  const contextValue = { user: session.user, session, profile, setProfile, syncStatus, realtimeStatus };
  return (
    <CloudAuthContext.Provider value={contextValue}>
      {children}
      <div className="cloud-account-dock">
        <button type="button" className="cloud-account-trigger" aria-expanded={showAccountMenu} onClick={() => setShowAccountMenu((value) => !value)}>
          <span className="account-avatar" aria-hidden="true">{profile.avatar_emoji || (profile.display_name || 'P').charAt(0).toUpperCase()}</span>
          <span className="account-dock-name">{profile.display_name || profile.handle}</span>
          <span className="account-dock-chevron">{showAccountMenu ? '×' : '⌄'}</span>
        </button>
        {showAccountMenu && <div className="account-menu">
          <p className="account-menu-label">CLOUD ACCOUNT</p><strong>@{profile.handle}</strong><small>{session.user.email}</small><small className="cloud-sync-status">{syncStatus}</small>
          <button type="button" onClick={backupProgress}>Download progress backup</button>
          <button type="button" onClick={() => importInput.current?.click()}>Restore progress backup</button>
          <input ref={importInput} className="auth-file-input" type="file" accept="application/json,.json" onChange={restoreBackup} />
          {notice && <p className="account-menu-message" role="status">{notice}</p>}
          <button type="button" className="account-signout" onClick={signOut}>Sign out</button>
          <p className="account-menu-footnote">Cloud profile · {realtimeStatus === 'SUBSCRIBED' ? 'live sync available' : 'sync on saved runs'}</p>
        </div>}
      </div>
    </CloudAuthContext.Provider>
  );
}
