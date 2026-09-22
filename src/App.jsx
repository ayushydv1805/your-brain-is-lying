import { useState } from 'react';
import './App.css';

const tests = [
  {
    icon: '⚡',
    title: 'Reaction',
    text: 'How quickly can you react when your brain is not ready?',
  },
  {
    icon: '🧠',
    title: 'Memory',
    text: 'Remember more, faster, while the sequences keep changing.',
  },
  {
    icon: '👁️',
    title: 'Attention',
    text: 'Spot what matters while everything around you tries to distract you.',
  },
  {
    icon: '🧩',
    title: 'Logic',
    text: 'Solve patterns and traps before your first instinct takes over.',
  },
  {
    icon: '🎯',
    title: 'Impulse',
    text: 'Know when to act — and, more importantly, when not to.',
  },
];

const levels = [
  ['01', 'Warm Up', 'Learn the rules'],
  ['05', 'Pressure', 'Faster decisions'],
  ['10', 'Brain Breaker', 'Multiple rules at once'],
];

function App() {
  const [showRoadmap, setShowRoadmap] = useState(false);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="app-shell">
      <div className="noise" aria-hidden="true" />
      <div className="orb orb-one" aria-hidden="true" />
      <div className="orb orb-two" aria-hidden="true" />

      <header className="topbar">
        <button className="brand" onClick={() => scrollTo('home')} aria-label="Go home">
          <span className="brand-mark">🧠</span>
          <span>
            <strong>Your Brain</strong>
            <small>is lying.</small>
          </span>
        </button>

        <nav className="nav-links" aria-label="Primary navigation">
          <button onClick={() => scrollTo('tests')}>Tests</button>
          <button onClick={() => scrollTo('levels')}>Levels</button>
          <button onClick={() => scrollTo('about')}>How it works</button>
        </nav>

        <button className="nav-cta" onClick={() => scrollTo('about')}>
          Explore
          <span>↗</span>
        </button>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="pulse-dot" />
              <span>YOUR MIND. UNDER PRESSURE.</span>
            </div>

            <h1>
              Don&apos;t trust
              <span> your first thought.</span>
            </h1>

            <p className="hero-text">
              A fast-paced brain challenge built to test how you react, remember,
              focus, reason, and control your impulses.
            </p>

            <div className="hero-actions">
              <button className="primary-button" onClick={() => scrollTo('tests')}>
                <span>Explore the tests</span>
                <span className="button-arrow">→</span>
              </button>
              <button className="ghost-button" onClick={() => setShowRoadmap((v) => !v)}>
                {showRoadmap ? 'Hide roadmap' : 'See the roadmap'}
              </button>
            </div>

            <div className="trust-row">
              <span><b>05</b> brain skills</span>
              <i />
              <span><b>10+</b> difficulty levels</span>
              <i />
              <span><b>∞</b> combinations</span>
            </div>
          </div>

          <div className="brain-stage" aria-label="Game preview">
            <div className="stage-glow" />
            <div className="scan-line" />
            <div className="preview-card preview-main">
              <div className="preview-top">
                <span>LEVEL 04</span>
                <span className="live-pill"><i /> LIVE</span>
              </div>
              <div className="preview-title">What color do you see?</div>
              <div className="stroop-word">BLUE</div>
              <div className="preview-options">
                <span className="option option-a">RED</span>
                <span className="option option-b">BLUE</span>
                <span className="option option-c">GREEN</span>
              </div>
              <div className="preview-timer">
                <span>00:07.42</span>
                <div><b /></div>
              </div>
            </div>

            <div className="floating-card score-card">
              <span className="floating-label">BRAIN SCORE</span>
              <strong>847</strong>
              <small>+42 this run</small>
            </div>

            <div className="floating-card reaction-card">
              <span className="mini-icon">⚡</span>
              <div>
                <small>REACTION</small>
                <strong>287 ms</strong>
              </div>
            </div>

            <div className="floating-card streak-card">
              <span>🔥</span>
              <strong>7</strong>
              <small>streak</small>
            </div>
          </div>
        </section>

        {showRoadmap && (
          <section className="roadmap-banner">
            <div>
              <span className="section-kicker">BUILD ROADMAP</span>
              <h2>Start simple. Get brutally difficult.</h2>
            </div>
            <div className="roadmap-steps">
              <span><b>01</b> Landing &amp; game shell</span>
              <span><b>02</b> Test engine</span>
              <span><b>03</b> Random questions</span>
              <span><b>04</b> Levels + XP</span>
            </div>
          </section>
        )}

        <section className="section tests-section" id="tests">
          <div className="section-heading">
            <div>
              <span className="section-kicker">FIVE WAYS TO BREAK YOUR FOCUS</span>
              <h2>Your brain has <span>blind spots.</span></h2>
            </div>
            <p>
              Every test measures a different kind of decision-making. The game
              gets harder as you prove you can handle it.
            </p>
          </div>

          <div className="test-grid">
            {tests.map((test, index) => (
              <article className="test-card" key={test.title}>
                <div className="card-number">0{index + 1}</div>
                <div className="test-icon">{test.icon}</div>
                <h3>{test.title}</h3>
                <p>{test.text}</p>
                <span className="card-arrow">↗</span>
              </article>
            ))}
          </div>
        </section>

        <section className="section levels-section" id="levels">
          <div className="section-heading compact">
            <div>
              <span className="section-kicker">PROGRESSION SYSTEM</span>
              <h2>Same brain. <span>Harder rules.</span></h2>
            </div>
            <p>
              Questions are generated from changing patterns, timings, sequences,
              and traps — so memorising the answers will not save you.
            </p>
          </div>

          <div className="level-grid">
            {levels.map(([number, title, text], index) => (
              <article className="level-card" key={number}>
                <span className="level-number">{number}</span>
                <div className="level-line"><span style={{ width: `${35 + index * 28}%` }} /></div>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>

          <div className="difficulty-strip">
            <span>LEVEL 01</span>
            <div className="difficulty-track">
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
            <span>LEVEL 10+</span>
            <strong>Can you keep up?</strong>
          </div>
        </section>

        <section className="section about-section" id="about">
          <div className="about-panel">
            <div className="about-copy">
              <span className="section-kicker">THE IDEA</span>
              <h2>Fast answers aren&apos;t always <span>smart answers.</span></h2>
              <p>
                Your Brain Is Lying turns classic cognitive challenges into a
                progression game. React. Remember. Focus. Think. Control the urge
                to click.
              </p>
              <button className="primary-button" onClick={() => scrollTo('home')}>
                <span>Back to top</span>
                <span className="button-arrow">↑</span>
              </button>
            </div>

            <div className="stats-panel">
              <div>
                <strong>∞</strong>
                <span>question combinations</span>
              </div>
              <div>
                <strong>10+</strong>
                <span>planned difficulty levels</span>
              </div>
              <div>
                <strong>05</strong>
                <span>core brain skills</span>
              </div>
              <div>
                <strong>01</strong>
                <span>rule: don&apos;t trust yourself</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <span>YOUR BRAIN IS LYING © 2026</span>
        <span>Phase 1 · Foundation</span>
      </footer>
    </div>
  );
}

export default App;
