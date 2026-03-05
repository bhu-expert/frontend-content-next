'use client';

import { useState, useEffect, useCallback } from 'react';

interface UsePersistedStateOptions<T> {
  serialize?: (value: T) => string;
  deserialize?: (value: string) => T;
  ttl?: number; // Time to live in milliseconds
}

export function usePersistedState<T>(
  key: string,
  initialValue: T,
  options: UsePersistedStateOptions<T> = {},
): [T, (value: T | ((prev: T) => T)) => void, boolean] {
  const {
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    ttl,
  } = options;

  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const item = localStorage.getItem(key);
      if (item) {
        const parsed = deserialize(item);
        
        // Check TTL if specified
        if (ttl && typeof parsed === 'object' && parsed !== null && 'timestamp' in parsed) {
          const { value, timestamp } = parsed as { value: T; timestamp: number };
          const isExpired = Date.now() - timestamp > ttl;
          if (!isExpired) {
            setStoredValue(value);
          } else {
            localStorage.removeItem(key);
          }
        } else {
          setStoredValue(parsed);
        }
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
    } finally {
      setIsHydrated(true);
    }
  }, [key, deserialize, ttl]);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);

        if (typeof window !== 'undefined') {
          const valueToSave = ttl
            ? { value: valueToStore, timestamp: Date.now() }
            : valueToStore;
          localStorage.setItem(key, serialize(valueToSave));
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, serialize, storedValue, ttl],
  );

  const clearValue = useCallback(() => {
    setStoredValue(initialValue);
    localStorage.removeItem(key);
  }, [initialValue, key]);

  // Attach clear method to the function for convenience
  (setValue as any).clear = clearValue;

  return [storedValue, setValue as typeof setValue & { clear: () => void }, isHydrated];
}

// Hook for session-only persistence (clears on tab close)
export function useSessionState<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    const item = sessionStorage.getItem(key);
    return item ? JSON.parse(item) : initialValue;
  });

  const setValue = (value: T | ((prev: T) => T)) => {
    const valueToStore = value instanceof Function ? value(storedValue) : value;
    setStoredValue(valueToStore);
    sessionStorage.setItem(key, JSON.stringify(valueToStore));
  };

  return [storedValue, setValue];
}
