/**
 * @module useUserSession
 * @description A custom React hook that manages user session state and authentication.
 * Handles user login/logout and persists user data in both localStorage and Supabase.
 * 
 * @example
 * // Using the hook in a component
 * const { userName, isLoggedIn, error, login, logout } = useUserSession();
 * 
 * // Login a user
 * await login('JohnDoe');
 * 
 * // Logout
 * await logout();
 * 
 * @returns {Object} Session management object
 * @property {string} userName - Current user's username
 * @property {boolean} isLoggedIn - Whether a user is currently logged in
 * @property {string|null} error - Any error message from login/logout operations
 * @property {Function} login - Async function to log in a user
 * @property {Function} logout - Async function to log out the current user
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase/supabaseClient';

function useUserSession() {
  // Initialize state with localStorage value immediately
  const [userName, setUserName] = useState(() => {
    try {
      return localStorage.getItem('catNamesUser') || '';
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return '';
    }
  });
  const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(userName));
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize session state
  useEffect(() => {
    const initializeSession = async () => {
      try {
        const storedUser = localStorage.getItem('catNamesUser');
        if (storedUser) {
          console.log('Found stored user:', storedUser);
          // Verify user exists in database
          const { data, error: dbError } = await supabase
            .from('app_users')
            .select('user_name')
            .eq('user_name', storedUser)
            .single();

          if (dbError || !data) {
            console.warn('Stored user not found in database, clearing session');
            localStorage.removeItem('catNamesUser');
            setUserName('');
            setIsLoggedIn(false);
          } else {
            setUserName(storedUser);
            setIsLoggedIn(true);
          }
        }
      } catch (error) {
        console.error('Session initialization error:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeSession();
  }, []);

  /**
   * Logs in a user with the given name
   * @param {string} name - The username to login with
   * @throws {Error} If the name is invalid or if there's a database error
   */
  const login = useCallback(async (name) => {
    try {
      console.log('Attempting to login with name:', name);
      
      if (!name || typeof name !== 'string' || name.trim() === '') {
        throw new Error('Please enter a valid name');
      }
      
      const trimmedName = name.trim();

      // Create/update user in app_users table
      const { error: upsertError } = await supabase
        .from('app_users')
        .upsert({ 
          user_name: trimmedName,
          created_at: new Date().toISOString()
        }, {
          onConflict: 'user_name',
          returning: 'minimal'
        });

      if (upsertError) {
        throw upsertError;
      }

      localStorage.setItem('catNamesUser', trimmedName);
      setUserName(trimmedName);
      setIsLoggedIn(true);
      setError(null);
      
      console.log('Login successful. Current user:', trimmedName);
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  /**
   * Logs out the current user
   * Clears local storage and resets session state
   */
  const logout = useCallback(async () => {
    console.log('Logging out user:', userName);
    localStorage.removeItem('catNamesUser');
    setUserName('');
    setIsLoggedIn(false);
    setError(null);
    console.log('Logout complete');
  }, [userName]);

  // Add a debug log whenever userName changes
  useEffect(() => {
    console.log('Current user session state:', {
      userName,
      isLoggedIn,
      error
    });
  }, [userName, isLoggedIn, error]);

  return {
    userName,
    isLoggedIn,
    error,
    login,
    logout,
    isInitialized
  };
}

export default useUserSession; 