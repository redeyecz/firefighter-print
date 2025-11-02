/**
 * Error Display Component
 * Shows user-friendly error messages with optional technical details
 */

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ErrorMessage } from "@/lib/errors";

interface ErrorDisplayProps {
  error: ErrorMessage | string;
  title?: string;
  showCode?: boolean;
}

export function ErrorDisplay({ error, title = "Error", showCode = false }: ErrorDisplayProps) {
  const errorMessage = typeof error === "string" ? error : error.userMessage;
  const errorCode = typeof error === "string" ? undefined : error.errorCode;

  return (
    <Alert variant="destructive">
      <AlertTitle className="flex items-center justify-between">
        <span>{title}</span>
        {showCode && errorCode && (
          <span className="text-xs font-mono opacity-70">Code: {errorCode}</span>
        )}
      </AlertTitle>
      <AlertDescription>{errorMessage}</AlertDescription>
    </Alert>
  );
}

/**
 * Error fallback component for error boundaries
 */
interface ErrorFallbackProps {
  error: Error;
  resetError?: () => void;
}

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="flex items-center justify-center min-h-screen p-6">
      <div className="max-w-md w-full space-y-4">
        <Alert variant="destructive">
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>{error.message || "An unexpected error occurred"}</AlertDescription>
        </Alert>
        {resetError && (
          <button
            onClick={resetError}
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
