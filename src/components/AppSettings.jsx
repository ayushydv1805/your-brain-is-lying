import '../phase-ab.css';

export default function AppSettings({ preferences, onChange, onHome, storageStatus }) {
  const options = [
    { key: 'reducedMotion', title: 'Reduce motion', description: 'Turn off most decorative transitions and scrolling animations.' },
    { key: 'highContrast', title: 'Higher contrast', description: 'Strengthen outlines, borders and text contrast.' },
    { key: 'largeText', title: 'Larger text', description: 'Increase interface text size for easier reading.' },
    { key: 'simpleVisuals', title: 'Simplify decoration', description: 'Hide background noise and glows where practical.' },
  ];
  return (
    <div className="phase-page">
      <header className="phase-topbar">
        <button className="ghost-button" onClick={onHome}>← Home</button>
        <span className="phase-brand">🧠 YOUR BRAIN IS LYING</span>
        <span className="phase-status">PHASE A · PREFERENCES</span>
      </header>
      <main className="phase-main phase-settings-main">
        <section className="phase-hero">
          <span className="phase-kicker">MAKE THE APP FIT YOU</span>
          <h1>Comfort first. <span>Then the challenge.</span></h1>
          <p>These preferences are saved on this device and apply across the app. They can be changed at any time.</p>
        </section>
        <section className="phase-section">
          <div className="phase-settings-list">
            {options.map((option) => (
              <label className="phase-setting-row" key={option.key}>
                <span><strong>{option.title}</strong><small>{option.description}</small></span>
                <input type="checkbox" checked={Boolean(preferences[option.key])} onChange={(event) => onChange({ ...preferences, [option.key]: event.target.checked })} aria-label={option.title} />
              </label>
            ))}
          </div>
          <div className="phase-note"><strong>Saved progress status</strong><p>{storageStatus?.available ? (storageStatus.hasSavedData ? 'Progress storage is available. Current saved profile data is approximately ' + Math.max(1, Math.round(storageStatus.bytes / 1024)) + ' KB.' : 'Progress storage is available; a saved player record will appear after you complete a test.') : 'Browser storage is unavailable. Progress may not persist in this browser context.'}</p><p>For an additional safety net, open the account menu and download a JSON progress backup.</p></div>
          <div className="phase-note"><strong>Keyboard and motion support</strong><p>Interactive controls keep visible keyboard focus, and the app respects the system's reduced-motion preference. These additional settings are stored locally. They don't affect game scores.</p></div>
          <div className="phase-inline-actions"><button className="ghost-button" onClick={() => onChange({ reducedMotion: false, highContrast: false, largeText: false, simpleVisuals: false })}>Reset preferences</button><button className="primary-button" onClick={onHome}><span>Save and return</span><span className="button-arrow">→</span></button></div>
        </section>
      </main>
    </div>
  );
}
