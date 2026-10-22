import { useEffect, useState } from 'react';
import { isCloudConfigured } from '../lib/supabaseClient.js';
import { useCloudAuth } from '../lib/CloudAuthContext.jsx';
import {
  cancelFriendRequest,
  createChallenge,
  findProfileByHandle,
  loadChallengeScores,
  loadChallenges,
  loadFriendRequests,
  loadLeaderboard,
  loadPublicProfiles,
  publishLeaderboardResult,
  respondToFriendRequest,
  sendFriendRequest,
  submitChallengeScore,
  updateChallengeStatus,
  updateProfile,
} from '../game/socialApi.js';
import './social.css';

const SKILLS = [
  { id: 'reaction', label: 'Reaction', icon: '⚡' },
  { id: 'memory', label: 'Memory', icon: '🧠' },
  { id: 'attention', label: 'Attention', icon: '👁️' },
  { id: 'logic', label: 'Logic', icon: '🧩' },
  { id: 'impulse', label: 'Impulse', icon: '🎯' },
];

function byId(profileMap, userId) {
  return profileMap.get(userId) || { user_id: userId, handle: 'player', display_name: 'Player', avatar_emoji: '🧠' };
}

function latestRunFor(player, skill, after) {
  const lowerBound = new Date(after || 0).getTime();
  return (Array.isArray(player?.runHistory) ? player.runHistory : [])
    .filter((run) => run?.type === skill && !Number.isNaN(new Date(run.at).getTime()) && new Date(run.at).getTime() >= lowerBound)
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())[0] || null;
}

function scoreLine(entry) {
  return Number(entry.score).toFixed(1) + ' / 100 · ' + entry.raw_metric;
}

export default function SocialHub({ user, profile: passedProfile, player, onHome, onProfileChange }) {
  const cloudAuth = useCloudAuth();
  const currentUser = user || cloudAuth?.user;
  const profile = passedProfile || cloudAuth?.profile;
  const setProfile = onProfileChange || cloudAuth?.setProfile;
  const [tab, setTab] = useState('friends');
  const [handleQuery, setHandleQuery] = useState('');
  const [foundProfile, setFoundProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [challengeScores, setChallengeScores] = useState([]);
  const [profiles, setProfiles] = useState(new Map());
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardSkill, setLeaderboardSkill] = useState('memory');
  const [leaderboardPeriod, setLeaderboardPeriod] = useState('weekly');
  const [challengeSkill, setChallengeSkill] = useState('memory');
  const [loading, setLoading] = useState(false);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const refreshSocial = async () => {
    if (!currentUser?.id) return;
    setLoading(true);
    setError('');
    try {
      const [nextRequests, nextChallenges] = await Promise.all([
        loadFriendRequests(currentUser.id),
        loadChallenges(currentUser.id),
      ]);
      const scores = await loadChallengeScores(nextChallenges.map((challenge) => challenge.id));
      const ids = new Set([currentUser.id]);
      for (const request of nextRequests) {
        ids.add(request.requester_id);
        ids.add(request.receiver_id);
      }
      for (const challenge of nextChallenges) {
        ids.add(challenge.challenger_id);
        ids.add(challenge.opponent_id);
      }
      for (const score of scores) ids.add(score.user_id);
      const publicProfiles = await loadPublicProfiles([...ids]);
      setRequests(nextRequests);
      setChallenges(nextChallenges);
      setChallengeScores(scores);
      setProfiles(new Map(publicProfiles.map((item) => [item.user_id, item])));
      if (tab === 'leaderboard') {
        setLeaderboardLoading(true);
        try { setLeaderboard(await loadLeaderboard(leaderboardSkill, leaderboardPeriod)); }
        finally { setLeaderboardLoading(false); }
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load friends and challenges.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSocial();
    // Re-load when this screen opens for a new signed-in account.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  useEffect(() => {
    if (tab !== 'leaderboard' || !currentUser?.id) return;
    let cancelled = false;
    setLeaderboardLoading(true);
    loadLeaderboard(leaderboardSkill, leaderboardPeriod)
      .then((entries) => { if (!cancelled) setLeaderboard(entries); })
      .catch((cause) => { if (!cancelled) setError(cause instanceof Error ? cause.message : 'Could not load the leaderboard.'); })
      .finally(() => { if (!cancelled) setLeaderboardLoading(false); });
    return () => { cancelled = true; };
  }, [tab, leaderboardSkill, leaderboardPeriod, currentUser?.id]);

  const act = async (action, successMessage) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await action();
      if (successMessage) setNotice(successMessage);
      await refreshSocial();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Action failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const search = (event) => {
    event.preventDefault();
    setFoundProfile(null);
    act(async () => {
      const result = await findProfileByHandle(handleQuery);
      if (!result) throw new Error('No player found with that handle.');
      if (result.user_id === currentUser.id) throw new Error('That is your own handle.');
      setFoundProfile(result);
    }, 'Player found.');
  };

  if (!isCloudConfigured || !currentUser?.id) {
    return (
      <div className="social-page">
        <header className="social-topbar"><button className="ghost-button" onClick={onHome}>← Home</button><span className="social-brand">🧠 YOUR BRAIN IS LYING</span><span className="social-topbar-label">PHASE D · SOCIAL</span></header>
        <main className="social-main">
          <section className="social-hero"><span className="social-kicker">PHASE C + D</span><h1>Play with <span>real people.</span></h1><p>Friends, head-to-head challenges and opt-in leaderboards need authenticated cloud accounts.</p></section>
          <article className="social-empty social-setup-card"><span>☁️</span><h2>Cloud setup is the remaining step</h2><p>Add your Supabase project URL and publishable key to a local <code>.env</code> file, then run <code>supabase/phase-c-d-schema.sql</code> in that project's SQL Editor. See the Phase C/D setup section in the README.</p><p>Your local mode still works. The social features won't use another app's database or send local progress anywhere until you configure your own project.</p></article>
        </main>
      </div>
    );
  }

  const acceptedRequests = requests.filter((item) => item.status === 'accepted');
  const friendIds = [...new Set(acceptedRequests.map((item) => item.requester_id === currentUser.id ? item.receiver_id : item.requester_id))];
  const incomingRequests = requests.filter((item) => item.status === 'pending' && item.receiver_id === currentUser.id);
  const outgoingRequests = requests.filter((item) => item.status === 'pending' && item.requester_id === currentUser.id);
  const incomingChallenges = challenges.filter((item) => item.status === 'pending' && item.opponent_id === currentUser.id);
  const outgoingChallenges = challenges.filter((item) => item.status === 'pending' && item.challenger_id === currentUser.id);
  const activeChallenges = challenges.filter((item) => item.status === 'accepted');
  const visibleChallenges = challenges.filter((item) => !['cancelled', 'declined'].includes(item.status));
  const scoresFor = (challengeId) => challengeScores.filter((item) => item.challenge_id === challengeId);
  const ownScoreFor = (challengeId) => scoresFor(challengeId).find((item) => item.user_id === currentUser.id);
  const recentRun = latestRunFor(player, leaderboardSkill, 0);

  const createFriendChallenge = (friendId) => act(
    () => createChallenge(currentUser.id, friendId, challengeSkill),
    'Challenge sent. Your friend can accept it from their Social Hub.',
  );

  const shareCode = async (code) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
        setNotice('Challenge code copied.');
      } else {
        setNotice('Challenge code: ' + code);
      }
    } catch {
      setNotice('Challenge code: ' + code);
    }
  };

  const optIntoLeaderboard = async (enabled) => {
    setBusy(true); setError(''); setNotice('');
    try {
      const updated = await updateProfile(currentUser.id, { leaderboard_opt_in: enabled });
      setProfile?.(updated);
      setNotice(enabled ? 'Leaderboard sharing enabled. You can publish your best saved results.' : 'Leaderboard sharing disabled. Your old entries will no longer appear.');
      if (tab === 'leaderboard') setLeaderboard(await loadLeaderboard(leaderboardSkill, leaderboardPeriod));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update leaderboard sharing.');
    } finally { setBusy(false); }
  };

  const publishLatestScore = () => act(async () => {
    if (!recentRun) throw new Error('Complete a ' + leaderboardSkill + ' test first.');
    await publishLeaderboardResult(currentUser.id, profile, recentRun, leaderboardSkill);
    setLeaderboard(await loadLeaderboard(leaderboardSkill, leaderboardPeriod));
  }, 'Your latest ' + leaderboardSkill + ' result was published.');

  return (
    <div className="social-page">
      <header className="social-topbar">
        <button className="ghost-button" onClick={onHome}>← Home</button>
        <span className="social-brand">🧠 YOUR BRAIN IS LYING</span>
        <div className="social-top-actions"><span className="social-topbar-label">PHASE C + D</span><button className="ghost-button" onClick={refreshSocial} disabled={loading}>{loading ? 'Refreshing…' : '↻ Refresh'}</button></div>
      </header>
      <main className="social-main">
        <section className="social-hero">
          <span className="social-kicker">YOUR COMMUNITY</span><h1>Progress is better <span>together.</span></h1>
          <p>Find players by handle, practise against a friend, and compare scores on skill-specific boards. Your email and private progress history are never listed publicly.</p>
          <div className="social-stat-row"><div><strong>{friendIds.length}</strong><span>friends</span></div><div><strong>{incomingRequests.length}</strong><span>requests to review</span></div><div><strong>{activeChallenges.length}</strong><span>active challenges</span></div></div>
        </section>

        <nav className="social-tabs" aria-label="Social features">
          <button className={tab === 'friends' ? 'is-active' : ''} aria-pressed={tab === 'friends'} onClick={() => setTab('friends')}>Friends <span>{friendIds.length}</span></button>
          <button className={tab === 'challenges' ? 'is-active' : ''} aria-pressed={tab === 'challenges'} onClick={() => setTab('challenges')}>Challenges <span>{visibleChallenges.length}</span></button>
          <button className={tab === 'leaderboard' ? 'is-active' : ''} aria-pressed={tab === 'leaderboard'} onClick={() => setTab('leaderboard')}>Leaderboard</button>
        </nav>

        {error && <div className="social-message is-error" role="alert">{error}</div>}
        {notice && <div className="social-message is-notice" role="status">{notice}</div>}

        {tab === 'friends' && <>
          <section className="social-section">
            <div className="social-section-heading"><div><span className="social-kicker">ADD A PLAYER</span><h2>Find your <span>people.</span></h2></div><p>Share only the handle you choose. Email addresses stay private.</p></div>
            <form className="social-search-form" onSubmit={search}>
              <label htmlFor="social-handle">Player handle</label><div><span aria-hidden="true">@</span><input id="social-handle" value={handleQuery} onChange={(event) => setHandleQuery(event.target.value)} placeholder="brainrunner_01" maxLength={21} required/><button className="primary-button" disabled={busy}><span>Search</span><span className="button-arrow">→</span></button></div>
            </form>
            {foundProfile && <article className="social-person-card">
              <span className="social-person-avatar">{foundProfile.avatar_emoji || '🧠'}</span><div className="social-person-info"><strong>{foundProfile.display_name}</strong><small>@{foundProfile.handle}</small></div>
              {friendIds.includes(foundProfile.user_id) ? <span className="social-pill">Already friends</span> : requests.some((item) => item.status === 'pending' && ((item.requester_id === currentUser.id && item.receiver_id === foundProfile.user_id) || (item.receiver_id === currentUser.id && item.requester_id === foundProfile.user_id))) ? <span className="social-pill">Request pending</span> : <button className="primary-button" disabled={busy} onClick={() => act(() => sendFriendRequest(currentUser.id, foundProfile.user_id), 'Friend request sent.')}>Add friend <span className="button-arrow">→</span></button>}
            </article>}
          </section>

          <section className="social-section">
            <div className="social-section-heading"><div><span className="social-kicker">YOUR CIRCLE</span><h2>Friends <span>list.</span></h2></div><p>Accepted friends can send each other skill challenges.</p></div>
            {friendIds.length ? <div className="social-person-list">{friendIds.map((friendId) => {
              const friend = byId(profiles, friendId);
              return <article className="social-person-card" key={friendId}><span className="social-person-avatar">{friend.avatar_emoji || '🧠'}</span><div className="social-person-info"><strong>{friend.display_name}</strong><small>@{friend.handle}</small></div><label className="social-skill-select"><span>Challenge skill</span><select value={challengeSkill} onChange={(event) => setChallengeSkill(event.target.value)}>{SKILLS.map((skill) => <option key={skill.id} value={skill.id}>{skill.icon} {skill.label}</option>)}</select></label><button className="primary-button" disabled={busy} onClick={() => createFriendChallenge(friendId)}><span>Challenge</span><span className="button-arrow">→</span></button></article>;
            })}</div> : <div className="social-empty"><span>👋</span><h3>Your circle starts here</h3><p>Search a player's handle above and send a friend request to add your first challenger.</p></div>}
          </section>

          <section className="social-section">
            <div className="social-section-heading"><div><span className="social-kicker">INBOX</span><h2>Friend <span>requests.</span></h2></div><p>Accept people you know; you can challenge them after accepting.</p></div>
            {incomingRequests.length ? <div className="social-person-list">{incomingRequests.map((request) => { const sender = byId(profiles, request.requester_id); return <article className="social-person-card" key={request.id}><span className="social-person-avatar">{sender.avatar_emoji || '🧠'}</span><div className="social-person-info"><strong>{sender.display_name}</strong><small>@{sender.handle}</small></div><div className="social-actions"><button className="primary-button" disabled={busy} onClick={() => act(() => respondToFriendRequest(request.id, currentUser.id, 'accepted'), 'Friend request accepted.')}>Accept</button><button className="ghost-button" disabled={busy} onClick={() => act(() => respondToFriendRequest(request.id, currentUser.id, 'declined'), 'Request declined.')}>Decline</button></div></article>; })}</div> : <div className="social-empty compact"><p>No new friend requests.</p></div>}
            {outgoingRequests.length > 0 && <div className="social-outgoing"><strong>Sent requests</strong>{outgoingRequests.map((request) => {const target=byId(profiles,request.receiver_id);return <div key={request.id}><span>@{target.handle}</span><button className="social-text-button" disabled={busy} onClick={() => act(() => cancelFriendRequest(request.id,currentUser.id),'Request cancelled.')}>Cancel</button></div>;})}</div>}
          </section>
        </>}

        {tab === 'challenges' && <>
          <section className="social-section">
            <div className="social-section-heading"><div><span className="social-kicker">HEAD TO HEAD</span><h2>Friendly <span>competition.</span></h2></div><p>Both players must run the same skill after the challenge is accepted. Results are normalized to a 0–100 practice score.</p></div>
            {incomingChallenges.length > 0 && <div className="social-card-list"><h3>Incoming challenges</h3>{incomingChallenges.map((challenge) => {const challenger=byId(profiles,challenge.challenger_id);return <article className="social-challenge-card" key={challenge.id}><div className="social-challenge-top"><span className="social-person-avatar">{challenger.avatar_emoji || '🧠'}</span><div className="social-person-info"><strong>{challenger.display_name} challenged you</strong><small>@{challenger.handle} · {SKILLS.find((s)=>s.id===challenge.skill)?.label}</small></div><span className="social-pill is-pending">Waiting for you</span></div><p>Invite code: <strong>{challenge.invite_code}</strong> <button className="social-text-button" onClick={() => shareCode(challenge.invite_code)}>Copy</button></p><div className="social-actions"><button className="primary-button" disabled={busy} onClick={() => act(() => updateChallengeStatus(challenge.id,'accepted'),'Challenge accepted. Play a fresh run of '+challenge.skill+'.')}>Accept challenge →</button><button className="ghost-button" disabled={busy} onClick={() => act(() => updateChallengeStatus(challenge.id,'declined'),'Challenge declined.')}>Decline</button></div></article>;})}</div>}
            {outgoingChallenges.length > 0 && <div className="social-card-list"><h3>Waiting for a friend</h3>{outgoingChallenges.map((challenge) => {const opponent=byId(profiles,challenge.opponent_id);return <article className="social-challenge-card" key={challenge.id}><div className="social-challenge-top"><span className="social-person-avatar">{opponent.avatar_emoji || '🧠'}</span><div className="social-person-info"><strong>Challenge for {opponent.display_name}</strong><small>{SKILLS.find((s)=>s.id===challenge.skill)?.label} · pending acceptance</small></div><span className="social-pill is-pending">Pending</span></div><p>Share code <strong>{challenge.invite_code}</strong> with your friend. Expires {new Date(challenge.expires_at).toLocaleDateString()}.</p><div className="social-actions"><button className="ghost-button" onClick={() => shareCode(challenge.invite_code)}>Copy code</button><button className="ghost-button" disabled={busy} onClick={() => act(() => updateChallengeStatus(challenge.id,'cancelled'),'Challenge cancelled.')}>Cancel challenge</button></div></article>;})}</div>}
            {activeChallenges.length > 0 && <div className="social-card-list"><h3>Accepted challenges</h3>{activeChallenges.map((challenge) => {
              const opponentId = challenge.challenger_id === currentUser.id ? challenge.opponent_id : challenge.challenger_id;
              const opponent = byId(profiles, opponentId);
              const entries = scoresFor(challenge.id);
              const own = entries.find((score) => score.user_id === currentUser.id);
              const theirs = entries.find((score) => score.user_id !== currentUser.id);
              const latest = latestRunFor(player, challenge.skill, challenge.accepted_at || challenge.created_at);
              const expired = new Date(challenge.expires_at).getTime() < Date.now();
              let outcome = '';
              if (own && theirs) outcome = Number(own.score) === Number(theirs.score) ? 'Tie game' : Number(own.score) > Number(theirs.score) ? 'You won this round' : 'Your friend won this round';
              return <article className="social-challenge-card" key={challenge.id}>
                <div className="social-challenge-top"><span className="social-person-avatar">{opponent.avatar_emoji || '🧠'}</span><div className="social-person-info"><strong>vs {opponent.display_name}</strong><small>{SKILLS.find((s)=>s.id===challenge.skill)?.icon} {SKILLS.find((s)=>s.id===challenge.skill)?.label} · expires {new Date(challenge.expires_at).toLocaleDateString()}</small></div><span className="social-pill is-active">{entries.length >= 2 ? 'Completed' : 'In progress'}</span></div>
                <div className="social-score-pair"><div><span>YOUR SCORE</span><strong>{own ? Number(own.score).toFixed(1) : '—'}</strong><small>{own ? own.raw_metric : 'Not submitted'}</small></div><div><span>FRIEND SCORE</span><strong>{theirs ? Number(theirs.score).toFixed(1) : '—'}</strong><small>{theirs ? theirs.raw_metric : 'Waiting for result'}</small></div></div>
                {outcome && <p className="social-outcome">{outcome}</p>}
                {!own && entries.length < 2 && !expired && <div className="social-submit-row"><p>{latest ? 'A matching run is ready to submit.' : 'Complete a new ' + challenge.skill + ' test, then come back here.'}</p><button className="primary-button" disabled={busy || !latest} onClick={() => act(() => submitChallengeScore(challenge.id,currentUser.id,latest,challenge.skill),'Challenge result submitted.')}>Submit latest result →</button></div>}
                {expired && !own && <p className="social-note">This challenge has expired. Ask your friend to send a new one.</p>}
                <button className="social-text-button" onClick={() => shareCode(challenge.invite_code)}>Copy challenge code</button>
              </article>;
            })}</div>}
            {visibleChallenges.length === 0 && <div className="social-empty"><span>⚔️</span><h3>No challenges yet</h3><p>Add a friend, then send a skill challenge from the Friends tab.</p><button className="primary-button" onClick={() => setTab('friends')}>Find a friend →</button></div>}
          </section>
        </>}

        {tab === 'leaderboard' && <>
          <section className="social-section">
            <div className="social-section-heading"><div><span className="social-kicker">OPT-IN RANKINGS</span><h2>Compare your <span>best runs.</span></h2></div><p>Only your chosen public handle, avatar, skill score and result metric appear. Email and full practice history stay private.</p></div>
            <article className="social-optin-card"><div><strong>Show my scores on the public leaderboard</strong><p>Off by default. When enabled, you can publish individual saved results. Turn it off any time to hide all your entries.</p></div><label className="social-switch"><input type="checkbox" checked={Boolean(profile?.leaderboard_opt_in)} disabled={busy} onChange={(event) => optIntoLeaderboard(event.target.checked)} /><span></span></label></article>
            <div className="social-leaderboard-toolbar"><label><span>Choose a skill</span><select value={leaderboardSkill} onChange={(event) => setLeaderboardSkill(event.target.value)}>{SKILLS.map((skill) => <option key={skill.id} value={skill.id}>{skill.icon} {skill.label}</option>)}</select></label><div className="social-period-switch" role="group" aria-label="Leaderboard period"><button className={leaderboardPeriod === 'weekly' ? 'is-active' : ''} aria-pressed={leaderboardPeriod === 'weekly'} onClick={() => setLeaderboardPeriod('weekly')}>Weekly tournament</button><button className={leaderboardPeriod === 'all-time' ? 'is-active' : ''} aria-pressed={leaderboardPeriod === 'all-time'} onClick={() => setLeaderboardPeriod('all-time')}>All-time</button></div><button className="ghost-button" onClick={() => loadLeaderboard(leaderboardSkill, leaderboardPeriod).then(setLeaderboard).catch((cause)=>setError(cause.message))} disabled={leaderboardLoading}>{leaderboardLoading ? 'Loading…' : 'Refresh board'}</button><button className="primary-button" disabled={busy || !profile?.leaderboard_opt_in || !recentRun} onClick={publishLatestScore}><span>Publish latest run</span><span className="button-arrow">→</span></button></div>
            {!profile?.leaderboard_opt_in && <p className="social-note">Leaderboard sharing is off. Turn it on to publish scores or appear in rankings.</p>}
            {profile?.leaderboard_opt_in && <div className="social-leaderboard-list">
              {leaderboardLoading ? <div className="social-empty compact"><p>Loading rankings…</p></div> : leaderboard.length ? leaderboard.map((entry,index) => <article className={'social-rank-row ' + (entry.user_id === currentUser.id ? 'is-you' : '')} key={entry.user_id}><span className="social-rank-number">{String(index+1).padStart(2,'0')}</span><span className="social-person-avatar">{entry.profile.avatar_emoji || '🧠'}</span><div className="social-person-info"><strong>{entry.profile.display_name}{entry.user_id === currentUser.id ? ' (you)' : ''}</strong><small>@{entry.profile.handle} · {entry.raw_metric}</small></div><strong className="social-rank-score">{Number(entry.score).toFixed(1)}</strong></article>) : <div className="social-empty compact"><p>No opt-in results for this skill yet. Publish your first saved run to start the board.</p></div>}
            </div>}
            <p className="social-note">Scores are submitted by the client and are suitable for friendly competition, not fraud-proof prizes or high-stakes ranking.</p>
          </section>
        </>}

        <footer className="social-footer"><span>YOUR BRAIN IS LYING · COMMUNITY</span><span>Private by default · progress stays yours</span></footer>
      </main>
    </div>
  );
}
