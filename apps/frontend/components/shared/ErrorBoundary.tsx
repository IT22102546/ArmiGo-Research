"use client";

import React, { Component, ReactNode } from "react";
import { logger } from "@/lib/utils/logger";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { AlertTriangle, Home, RefreshCw, Copy, Check } from "lucide-react";

// Note: Class components cannot use hooks, so translations are passed via props or context
// For this component, we use static English text as fallback since it's an error boundary

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** Component name for better error tracking */
  componentName?: string;
  /** Whether to show a minimal error UI */
  minimal?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, copied: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error to console and error reporting service
    logger.error(
      `Error caught by ErrorBoundary${this.props.componentName ? ` in ${this.props.componentName}` : ""}`,
      error,
      {
        componentStack: errorInfo.componentStack,
      }
    );

    // Store error info in state
    this.setState({ errorInfo });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      copied: false,
    });
  };

  handleCopyError = async () => {
    if (!this.state.error) return;

    const errorDetails = `
Error: ${this.state.error.message}
${this.state.error.stack || ""}
${this.state.errorInfo?.componentStack ? `\nComponent Stack:${this.state.errorInfo.componentStack}` : ""}
    `.trim();

    try {
      await navigator.clipboard.writeText(errorDetails);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch (err) {
      logger.error("Failed to copy error details", err);
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Minimal fallback UI for inline components
      if (this.props.minimal) {
        return (
          <div className="flex items-center gap-2 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
            <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-destructive">
                Something went wrong
              </p>
              {process.env.NODE_ENV === "development" && this.state.error && (
                <p className="text-xs text-destructive/80 truncate mt-0.5">
                  {this.state.error.message}
                </p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={this.handleReset}
              className="flex-shrink-0"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </div>
        );
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30 px-4">
          <Card className="max-w-md w-full shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center w-14 h-14 mx-auto bg-destructive/10 rounded-full mb-4">
                <AlertTriangle className="h-7 w-7 text-destructive" />
              </div>
              <h2 className="text-xl font-semibold text-foreground text-center mb-2">
                Something went wrong
              </h2>
              <p className="text-muted-foreground text-center mb-6">
                We apologize for the inconvenience. The error has been logged
                and we'll look into it.
              </p>

              {process.env.NODE_ENV === "development" && this.state.error && (
                <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-destructive">
                      Error Details
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={this.handleCopyError}
                    >
                      {this.state.copied ? (
                        <>
                          <Check className="h-3 w-3 mr-1" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-destructive/90 font-mono break-all">
                    {this.state.error.message}
                  </p>
                  {this.state.error.stack && (
                    <details className="mt-2">
                      <summary className="text-xs text-destructive/70 cursor-pointer hover:text-destructive">
                        View stack trace
                      </summary>
                      <pre className="mt-2 text-xs text-destructive/80 overflow-x-auto max-h-40 whitespace-pre-wrap">
                        {this.state.error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex gap-3 pb-6">
              <Button
                variant="default"
                className="flex-1"
                onClick={this.handleReset}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try again
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => (window.location.href = "/")}
              >
                <Home className="h-4 w-4 mr-2" />
                Go home
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
    componentName?: string;
    minimal?: boolean;
  }
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary
        fallback={options?.fallback}
        onError={options?.onError}
        componentName={options?.componentName}
        minimal={options?.minimal}
      >
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
