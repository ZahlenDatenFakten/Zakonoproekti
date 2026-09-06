import { useState } from 'react';

export function useSessionState<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // Pass initial state function to useState so logic is only executed once
  const [state, setState] = useState<T>(() => {
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading sessionStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to sessionStorage
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(state) : value;
      setState(valueToStore);
      window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`Error setting sessionStorage key "${key}":`, error);
    }
  };

  return [state, setValue];
}
