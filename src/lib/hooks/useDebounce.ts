import { useEffect, useState, useRef } from "react";

/**
 * useDebounce - Custom hook to debounce a value
 * Useful for search inputs, resizing, etc.
 * 
 * @param value - The value to debounce
 * @param delay - The debounce delay in milliseconds
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set debouncedValue to value (passed) after the specified delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Return a cleanup function that will be called every time the useEffect
    // dependencies change (i.e., whenever value or delay change)
    // This will cancel the scheduled setTimeout and clear it
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * useDebouncedCallback - Custom hook to debounce a function call
 * Useful for search inputs where you want to debounce API calls
 * 
 * @param callback - The function to debounce
 * @param delay - The debounce delay in milliseconds
 * @returns A debounced version of the callback function
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return (...args: Parameters<T>) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set a new timeout
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  };
}