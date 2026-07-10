import React, { Component, ReactNode } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class GenerationErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Generation Error Boundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="glass p-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-destructive" />
            <div>
              <h3 className="text-lg font-semibold text-destructive mb-2">
                Generation Error
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {this.state.error?.message || 'An unexpected error occurred during generation.'}
              </p>
              <details className="text-xs text-muted-foreground/70 mb-4">
                <summary className="cursor-pointer hover:text-muted-foreground">
                  Technical Details
                </summary>
                <pre className="mt-2 text-left whitespace-pre-wrap bg-secondary/20 rounded p-2">
                  {this.state.error?.stack || 'No stack trace available'}
                </pre>
              </details>
            </div>
            <Button onClick={this.handleRetry} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook for handling generation errors in functional components
 */
export function useGenerationErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((error: Error) => {
    console.error('Generation error:', error);
    setError(error);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return { error, handleError, clearError };
}

/**
 * Enhanced generation wrapper with error handling
 */
interface GenerationWrapperProps {
  children: ReactNode;
  isGenerating: boolean;
  error?: Error | null;
  onRetry?: () => void;
  onClearError?: () => void;
}

export function GenerationWrapper({ 
  children, 
  isGenerating, 
  error, 
  onRetry, 
  onClearError 
}: GenerationWrapperProps) {
  if (error) {
    return (
      <Card className="glass p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-destructive" />
          <div>
            <h3 className="text-lg font-semibold text-destructive mb-2">
              Generation Failed
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {error.message}
            </p>
          </div>
          <div className="flex gap-2">
            {onRetry && (
              <Button onClick={onRetry} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            )}
            {onClearError && (
              <Button onClick={onClearError} variant="ghost" size="sm">
                Dismiss
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <GenerationErrorBoundary>
      {children}
    </GenerationErrorBoundary>
  );
}