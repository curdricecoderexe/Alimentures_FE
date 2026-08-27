import React from 'react';
import { reportClientError } from '../lib/reportError';

/**
 * Top-level error boundary. Catches render/lifecycle errors anywhere below it so
 * a single broken component can't white-screen the whole store. Also used as a
 * router `errorElement`.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Render error:', error, info?.componentStack);
    reportClientError(error, { kind: 'react.render', componentStack: info?.componentStack });
    if (typeof window !== 'undefined' && window.Sentry?.captureException) {
      window.Sentry.captureException(error, { extra: { componentStack: info?.componentStack } });
    }
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.assign('/');
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '18px',
        padding: '24px', textAlign: 'center',
        fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
        background: '#FAF8F5', color: '#1a1a1a',
      }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Something went wrong</h1>
        <p style={{ maxWidth: '420px', color: '#666', margin: 0 }}>
          The page hit an unexpected error. Reloading usually fixes it. If it keeps happening,
          please contact support.
        </p>
        <button
          onClick={this.handleReload}
          style={{
            marginTop: '8px', padding: '12px 28px', borderRadius: '999px', border: 'none',
            background: '#C41E6B', color: '#fff', fontWeight: 700, fontSize: '0.85rem',
            textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer',
          }}
        >
          Back to home
        </button>
      </div>
    );
  }
}
