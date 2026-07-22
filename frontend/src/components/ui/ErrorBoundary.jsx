import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '50vh', padding: 48, textAlign: 'center',
          gap: 16
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
            Something went wrong
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 360 }}>
            An unexpected error occurred. Try refreshing the page.
          </p>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
            className="btn-pub btn-pub-secondary btn-pub-sm"
          >
            Refresh page
          </button>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <pre style={{ fontSize: 11, color: 'var(--accent-red)', background: 'var(--bg-tertiary)', padding: 16, borderRadius: 6, maxWidth: '100%', overflow: 'auto', textAlign: 'left', marginTop: 8 }}>
              {this.state.error.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
