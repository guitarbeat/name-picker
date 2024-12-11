/**
 * @module useLocalStorage
 * @description A custom React hook that provides persistent storage using localStorage.
 * It syncs state with localStorage and handles serialization/deserialization of stored values.
 * 
 * @example
 * // Using the hook in a component
 * const [value, setValue] = useLocalStorage('storageKey', defaultValue);
 * 
 * @param {string} key - The localStorage key to store the value under
 * @param {any} initialValue - The initial value if no value exists in localStorage
 * @returns {[any, Function]} A tuple containing the stored value and a setter function
 */

import { useState, useEffect } from 'react';

function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}

export default useLocalStorage;