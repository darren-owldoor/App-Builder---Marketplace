// Automatic retry logic with exponential backoff for edge function calls
import { supabase } from "@/integrations/supabase/client";

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableStatuses?: number[];
  onRetry?: (attempt: number, error: any) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
  onRetry: () => {},
};

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function calculateDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  backoffMultiplier: number
): number {
  const delay = initialDelay * Math.pow(backoffMultiplier, attempt);
  // Add jitter to prevent thundering herd
  const jitter = Math.random() * 0.3 * delay;
  return Math.min(delay + jitter, maxDelay);
}

function isRetryableError(error: any, retryableStatuses: number[]): boolean {
  // Network errors
  if (error.message?.includes('fetch') || error.message?.includes('network')) {
    return true;
  }

  // Check status code if available
  if (error.status && retryableStatuses.includes(error.status)) {
    return true;
  }

  // Rate limit errors
  if (error.message?.includes('rate limit') || error.message?.includes('too many')) {
    return true;
  }

  return false;
}

export async function invokeWithRetry<T = any>(
  functionName: string,
  options?: {
    body?: any;
    headers?: Record<string, string>;
  },
  retryOptions?: RetryOptions
): Promise<{ data: T | null; error: any }> {
  const opts = { ...DEFAULT_OPTIONS, ...retryOptions };
  let lastError: any;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      console.log(`[EdgeFunction] Invoking ${functionName}, attempt ${attempt + 1}`);

      const { data, error } = await supabase.functions.invoke<T>(functionName, options);

      if (error) {
        // Check if error is retryable
        if (attempt < opts.maxRetries && isRetryableError(error, opts.retryableStatuses)) {
          lastError = error;
          const delay = calculateDelay(
            attempt,
            opts.initialDelay,
            opts.maxDelay,
            opts.backoffMultiplier
          );

          console.warn(
            `[EdgeFunction] ${functionName} failed (attempt ${attempt + 1}), retrying in ${delay}ms`,
            error
          );

          opts.onRetry(attempt + 1, error);
          await sleep(delay);
          continue;
        }

        // Non-retryable error or max retries reached
        return { data: null, error };
      }

      // Success
      console.log(`[EdgeFunction] ${functionName} succeeded on attempt ${attempt + 1}`);
      return { data, error: null };
    } catch (err) {
      lastError = err;

      if (attempt < opts.maxRetries && isRetryableError(err, opts.retryableStatuses)) {
        const delay = calculateDelay(
          attempt,
          opts.initialDelay,
          opts.maxDelay,
          opts.backoffMultiplier
        );

        console.warn(
          `[EdgeFunction] ${functionName} threw error (attempt ${attempt + 1}), retrying in ${delay}ms`,
          err
        );

        opts.onRetry(attempt + 1, err);
        await sleep(delay);
        continue;
      }

      // Non-retryable error or max retries reached
      return { data: null, error: err };
    }
  }

  console.error(`[EdgeFunction] ${functionName} failed after ${opts.maxRetries + 1} attempts`);
  return { data: null, error: lastError };
}

// Hook for React components
import { toast } from "sonner";

export function useEdgeFunctionWithRetry() {
  const invoke = async <T = any>(
    functionName: string,
    options?: {
      body?: any;
      headers?: Record<string, string>;
    },
    retryOptions?: RetryOptions
  ) => {
    const result = await invokeWithRetry<T>(functionName, options, {
      ...retryOptions,
      onRetry: (attempt, error) => {
        toast.info(`Retrying... (attempt ${attempt})`);
        retryOptions?.onRetry?.(attempt, error);
      },
    });

    if (result.error) {
      toast.error(`Failed to execute ${functionName}: ${result.error.message}`);
    }

    return result;
  };

  return { invoke };
}
