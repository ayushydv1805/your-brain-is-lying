import { getSkillMastery } from '../game/difficultyEngine';
import { getAchievementStats } from '../game/achievementEngine';
import { getDateKey } from '../game/dailyChallenge';
import '../insights.css';

const SKILLS=[
 {key:'reaction',label:'Reaction',icon:'⚡',best:p=>p.bestReaction?p.bestReaction+' ms':'—',runs:p=>p.totalRuns||0},
 {key:'memory',label:'Memory',icon:'🧠',best:p=>(p.bestMemoryScore??0)+'/5',runs:p=>p.totalMemoryRuns||0},
 {key:'attention',label:'Attention',icon:'👁️',best:p=>(p.bestAttentionScore??0)+'/5',runs:p=>p.totalAttentionRuns||0},
 {key:'logic',label:'Logic',icon:'🧩',best:p=>(p.bestLogicScore??0)+'/5',runs:p=>p.totalLogicRuns||0},
 {key:'impulse',label:'Impulse',icon:'🎯',best:p=>(p.bestImpulseAccuracy??0)+'%',runs:p=>p.totalImpulseRuns||0},
];
const relative=t=>{const d=Date.now()-new Date(t).getTime();const m=Math.floor(Math.max(0,d)/60000);if(m<1)return'Just now';if(m<60)return m+' min ago';const h=Math.floor(m/60);if(h<24)return h+' hr ago';const days=Math.floor(h/24);return days<7?days+' day'+(days===1?'':'s')+' ago':new Date(t).toLocaleDateString([], {day:'numeric',month:'short'})};
const days=(dates,n=14)=>{const set=new Set(dates||[]);return Array.from({length:n},(_,i)=>{const date=new Date();date.setHours(12,0,0,0);date.setDate(date.getDate()-(n-1-i));const key=getDateKey(date);return{date,key,active:set.has(key)}})};
const mix=(history)=>SKILLS.map(s=>({...s,count:history.filter(x=>x.type===s.key).length}));
const bar=e=>{const n=Number((String(e.metric||'').match(/\d+(?:\.\d+)?/)||[0])[0]);if(!n)return 8;if(e.type==='reaction'||e.type==='attention'||e.type==='logic')return Math.max(10,Math.min(100,100-n/80));if(e.type==='impulse')return Math.max(10,Math.min(100,n));return Math.max(10,Math.min(100,n*20))};

export default function Insights({player,onPlay,onHome,onDaily,onReport,onAchievements}){
 const history=Array.isArray(player.runHistory)?player.runHistory:[], runs=[...history].sort((a,b)=>new Date(b.at)-new Date(a.at)), skillMix=mix(history);
 const total=(player.totalRuns||0)+(player.totalMemoryRuns||0)+(player.totalAttentionRuns||0)+(player.totalLogicRuns||0)+(player.totalImpulseRuns||0);
 const active=player.activityDates?.length||0, achievements=getAchievementStats(player), most=history.length?[...skillMix].sort((a,b)=>b.count-a.count)[0]:null, least=history.length?[...skillMix].sort((a,b)=>a.count-b.count)[0]:null;
 const avgMastery=Math.round(SKILLS.reduce((s,k)=>s+getSkillMastery(player,k.key),0)/5);
 return <div className="insights-page"><div className="insights-grid-glow" aria-hidden="true"/>
  <header className="insights-topbar">
   <button className="brand" onClick={onHome}><span className="brand-mark">🧠</span><span><strong>Your Brain</strong><small>is lying.</small></span></button>
   <div className="insights-topbar-center"><span className="insights-live-dot"/><span>PHASE 11 · PERFORMANCE LAB</span></div>
   <div className="insights-topbar-actions"><button className="ghost-button" onClick={onDaily}>Daily</button><button className="ghost-button" onClick={onReport}>Report</button><button className="ghost-button" onClick={onAchievements}>Achievements</button></div>
  </header>
  <main className="insights-main">
   <section className="insights-hero"><div><span className="section-kicker">YOUR SAVED PERFORMANCE</span><h1>See the pattern. <span>Not just the score.</span></h1><p>Review your saved activity across all five challenges. This is a game-progress dashboard, not a clinical assessment.</p></div>
    <div className="insights-level-card"><span>LEVEL</span><strong>{player.level}</strong><small>{player.xp} XP · {avgMastery}% average mastery</small><div className="insights-level-line"><i style={{width:(player.xp%100)+'%'}}/></div></div>
   </section>
   <section className="insights-metrics"><article><span>ALL RUNS</span><strong>{total}</strong><small>completed challenges</small></article><article><span>ACTIVE DAYS</span><strong>{active}</strong><small>saved calendar days</small></article><article><span>CURRENT STREAK</span><strong>{player.currentStreak||0}</strong><small>consecutive days</small></article><article><span>ACHIEVEMENTS</span><strong>{achievements.unlocked}/{achievements.total}</strong><small>{achievements.progress}% collected</small></article></section>
   <section className="insights-section"><div className="insights-heading"><div><span className="section-kicker">FIVE SKILLS</span><h2>Your current <span>shape.</span></h2></div><p>Mastery and best metrics come directly from the existing player profile.</p></div>
    <div className="skill-insight-grid">{SKILLS.map(s=><article className="skill-insight-card" key={s.key}><div className="skill-insight-top"><span className="skill-insight-icon">{s.icon}</span><span>MASTERY</span></div><strong>{s.label}</strong><div className="skill-mastery-row"><span>PROGRESS</span><b>{getSkillMastery(player,s.key)}%</b></div><div className="skill-mastery-bar"><i style={{width:getSkillMastery(player,s.key)+'%'}}/></div><div className="skill-insight-bottom"><div><span>BEST</span><b>{s.best(player)}</b></div><div><span>RUNS</span><b>{s.runs(player)}</b></div></div></article>)}</div>
   </section>
   <section className="insights-section"><div className="insights-heading"><div><span className="section-kicker">14-DAY SIGNAL</span><h2>Your recent <span>consistency.</span></h2></div><p>One active day is counted once, even when you complete several tests.</p></div>
    <div className="insights-activity-grid">{days(player.activityDates).map(d=><article className={d.active?'is-active':''} key={d.key}><span>{d.date.toLocaleDateString([], {weekday:'short'})}</span><strong>{d.date.getDate()}</strong><small>{d.active?'ACTIVE':'QUIET'}</small><i/></article>)}</div>
   </section>
   <section className="insights-split">
    <article className="insights-panel"><span className="section-kicker">RECENT RUN MIX</span><h2>Where your time <span>went.</span></h2><div className="run-mix-list">{skillMix.map(s=>{const p=history.length?Math.round(s.count/history.length*100):0;return <div key={s.key}><div className="run-mix-label"><span>{s.icon} {s.label}</span><b>{s.count}</b></div><div className="run-mix-bar"><i style={{width:p+'%'}}/></div></div>})}</div><div className="insights-callout"><span>MOST TESTED</span><strong>{most?.label||'—'}</strong><small>{most?most.count+' of the last '+history.length+' saved runs':'Complete a test to start the mix.'}</small></div><div className="insights-callout is-secondary"><span>LEAST TESTED</span><strong>{least?.label||'—'}</strong><small>{least?least.count+' of the last '+history.length+' saved runs':'Your recent run mix will appear here.'}</small></div></article>
    <article className="insights-panel"><span className="section-kicker">LAST 7 RUNS</span><h2>Your latest <span>signals.</span></h2>{runs.length===0?<div className="insights-empty"><strong>No runs saved yet.</strong><p>Complete a challenge and it will appear here automatically.</p><button className="primary-button" onClick={()=>onPlay('reaction')}><span>Start first run</span><span className="button-arrow">→</span></button></div>:<div className="run-timeline">{runs.slice(0,7).map((e,i)=><article className="run-row" key={e.id||e.at+e.type}><div className="run-row-index">{String(i+1).padStart(2,'0')}</div><div className="run-row-main"><strong>{e.label||e.type}</strong><small>{relative(e.at)}</small></div><span className="run-row-metric">{e.metric||'—'}</span><i><span style={{width:bar(e)+'%'}}/></i></article>)}</div>}</article>
   </section>
   <section className="insights-final-card"><div><span className="section-kicker">KEEP PLAYING</span><h2>Let the history <span>compound.</span></h2><p>The daily challenge, streaks, achievements, report, and this performance lab all use the same saved profile.</p></div><div className="insights-final-actions"><button className="primary-button" onClick={onDaily}><span>Open daily</span><span className="button-arrow">→</span></button><button className="ghost-button" onClick={()=>onPlay('reaction')}>Run a test</button></div></section>
   <footer className="insights-footer"><span>YOUR BRAIN IS LYING © 2026</span><span>Phase 11 · Performance Lab</span></footer>
  </main>
 </div>;
}
