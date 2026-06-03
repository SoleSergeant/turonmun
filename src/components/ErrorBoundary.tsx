import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  /** Custom fallback UI. If omitted, a generic error card is shown. */
  fallback?: ReactNode;
  /** Optional label shown in the error card (e.g. "Committees section") */
  label?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log to console in development; swap for a real error-tracking service later
    console.error('[ErrorBoundary]', this.props.label ?? 'section', error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <p className="text-sm font-medium text-neutral-700 mb-1">
            {this.props.label ? `${this.props.label} failed to load` : 'Something went wrong'}
          </p>
          <p className="text-xs text-neutral-400 mb-4 max-w-xs">
            {import.meta.env.DEV ? this.state.error?.message : 'Please refresh the page or try again later.'}
          </p>
          <button
            onClick={this.handleRetry}
            className="text-xs px-4 py-1.5 rounded-full border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
