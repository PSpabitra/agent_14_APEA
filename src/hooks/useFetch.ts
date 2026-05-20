import { useCallback, useEffect, useRef, useState } from "react";

interface FetchState<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
}

/**
 * Lightweight fetch hook for ad-hoc requests where TanStack Query is overkill.
 */
export function useFetch<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [state, setState] = useState<FetchState<T>>({ data: null, error: null, isLoading: true });
  const isMounted = useRef(true);

  const run = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const result = await fn();
      if (isMounted.current) setState({ data: result, error: null, isLoading: false });
    } catch (err) {
      if (isMounted.current) setState({ data: null, error: err as Error, isLoading: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    isMounted.current = true;
    run();
    return () => {
      isMounted.current = false;
    };
  }, [run]);

  return { ...state, refetch: run };
}
