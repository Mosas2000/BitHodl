import React, { Component, ErrorInfo, ReactNode } from 'react';
import { getErrorMessage, ErrorType } from '@/utils/errors';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorType?: ErrorType;
  userMessage?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Try to categorize the error
    let errorType = ErrorType.UNKNOWN_ERROR;
    let userMessage = getErrorMessage(error);
    
    // Check for common error patterns
    const message = error.message.toLowerCase();
    if (message.includes('network') || message.includes('fetch')) {
      errorType = ErrorType.NETWORK_TIMEOUT;
    } else if (message.includes('wallet') || message.includes('connect')) {
      errorType = ErrorType.WALLET_NOT_CONNECTED;
    } else if (message.includes('contract') || message.includes('transaction')) {
      errorType = ErrorType.CONTRACT_CALL_FAILED;
    }
    
    return {
      hasError: true,
      error,
      errorType,
      userMessage
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by ErrorBoundary:', error, errorInfo);
    }
    
    // In production, you might want to send this to an error reporting service
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorType: undefined,
      userMessage: undefined
    });
  };

  getErrorIcon = () => {
    switch (this.state.errorType) {
      case ErrorType.NETWORK_TIMEOUT:
        return (
          <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case ErrorType.WALLET_NOT_CONNECTED:
        return (
          <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        );
      case ErrorType.CONTRACT_CALL_FAILED:
        return (
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
    }
  };

  getErrorColor = () => {
    switch (this.state.errorType) {
      case ErrorType.NETWORK_TIMEOUT:
        return 'bg-orange-100';
      case ErrorType.WALLET_NOT_CONNECTED:
        return 'bg-yellow-100';
      case ErrorType.CONTRACT_CALL_FAILED:
        return 'bg-red-100';
      default:
        return 'bg-red-100';
    }
  };

  getActionButtons = () => {
    const buttons = [
      <button
        key="try-again"
        onClick={this.handleReset}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label="Try reloading the application"
      >
        Try Again
      </button>
    ];

    // Add specific actions based on error type
    if (this.state.errorType === ErrorType.NETWORK_TIMEOUT) {
      buttons.push(
        <button
          key="check-connection"
          onClick={() => window.location.reload()}
          className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
          aria-label="Check internet connection"
        >
          Check Connection
        </button>
      );
    } else if (this.state.errorType === ErrorType.WALLET_NOT_CONNECTED) {
      buttons.push(
        <button
          key="refresh-page"
          onClick={() => window.location.reload()}
          className="w-full bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
          aria-label="Refresh page to reconnect wallet"
        >
          Reconnect Wallet
        </button>
      );
    } else {
      buttons.push(
        <button
          key="refresh-page"
          onClick={() => window.location.reload()}
          className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          aria-label="Refresh page"
        >
          Refresh Page
        </button>
      );
    }

    return buttons;
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-gray-600 mb-6">
              We're sorry, but something unexpected happened. The error has been logged and we'll look into it.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={this.handleReset}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Try reloading the application"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                aria-label="Refresh the page"
              >
                Refresh Page
              </button>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-1">
                  Error Details (Development Only)
                </summary>
                <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono overflow-auto max-h-40 transition-colors duration-200">
                  <p className="text-red-600 dark:text-red-400 font-bold mb-2">{this.state.error.toString()}</p>
                  {this.state.errorInfo && (
                    <pre className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">{this.state.errorInfo.componentStack}</pre>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for functional components to use error boundaries
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    showDetails?: boolean;
  }
): React.ComponentType<P> {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary
        fallback={options?.fallback}
        onError={options?.onError}
        showDetails={options?.showDetails}
      >
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

// Specialized error boundaries for different parts of the app
export function WalletErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Special handling for wallet-related errors
        console.error('Wallet error:', error, errorInfo);
        // Could send to analytics or error reporting service
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

export function TransactionErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Special handling for transaction-related errors
        console.error('Transaction error:', error, errorInfo);
        // Could send to analytics or error reporting service
      }}
    >
      {children}
    </ErrorBoundary>
  );
}