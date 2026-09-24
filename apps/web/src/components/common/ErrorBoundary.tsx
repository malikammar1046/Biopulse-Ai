import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw01, Home01 } from '@untitledui/icons';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('BioPulse ErrorBoundary caught an unhandled exception:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/app/dashboard';
  };

  public render() {
    if (this.state.hasError) {
      const isDev = import.meta.env.DEV;
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4 sm:p-6 select-none">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-[#BAE6FD] p-6 sm:p-8 shadow-sm space-y-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600 shadow-sm">
              <AlertTriangle className="w-8 h-8" aria-hidden="true" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold font-display text-[#0F172A]">
                Something went wrong while loading BioPulse.
              </h2>
              <p className="text-sm text-[#475569] max-w-md mx-auto leading-relaxed">
                An unexpected interface issue occurred. Your clinical data and saved settings remain safe in the database.
              </p>
            </div>

            {isDev && this.state.error && (
              <div className="p-4 rounded-xl bg-slate-900 text-left overflow-x-auto text-xs font-mono text-rose-300 max-h-40 border border-slate-800">
                <div className="font-bold text-rose-400 mb-1">{this.state.error.name}: {this.state.error.message}</div>
                <div className="text-slate-400 whitespace-pre-wrap">{this.state.error.stack?.split('\n').slice(0, 5).join('\n')}</div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#0288D1] hover:bg-[#0277BD] text-white font-medium text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <RefreshCw01 className="w-4 h-4" aria-hidden="true" />
                Reload Page
              </button>
              <button
                onClick={this.handleGoHome}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#F0F9FF] hover:bg-[#E0F2FE] text-[#0288D1] font-medium text-sm transition-colors flex items-center justify-center gap-2 border border-[#BAE6FD]"
              >
                <Home01 className="w-4 h-4" aria-hidden="true" />
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
