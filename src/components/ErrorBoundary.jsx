import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Diagnostics stay in this browser; player data is never sent elsewhere.
    console.error('Your Brain Is Lying encountered a rendering error:', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="runtime-recovery">
        <div className="runtime-recovery-mark" aria-hidden="true">🧠</div>
        <p className="runtime-recovery-kicker">QUICK RESET</p>
        <h1>That round hit a snag.</h1>
        <p>The app could not finish rendering this screen. Your already-saved progress has not been intentionally cleared.</p>
        <button type="button" onClick={() => window.location.reload()}>Reload the app <span aria-hidden="true">↻</span></button>
        <small>If this keeps happening, reload once more after checking your connection.</small>
      </main>
    );
  }
}

