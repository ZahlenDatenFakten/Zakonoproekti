import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', background: '#090b10', color: 'red', fontFamily: 'monospace', height: '100vh', overflow: 'auto' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Application Crashed</h1>
          <pre style={{ marginTop: '1rem', whiteSpace: 'pre-wrap' }}>
            {this.state.error?.toString()}
          </pre>
          <pre style={{ marginTop: '1rem', whiteSpace: 'pre-wrap', color: 'gray' }}>
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}
