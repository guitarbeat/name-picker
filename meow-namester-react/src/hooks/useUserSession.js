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

import { useState, useEffect } from 'react';
import { supabase } from '../supabase/supabaseClient';

function useUserSession() {
  const [userName, setUserName] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('catNamesUser');
    if (storedUser) {
      console.log('Found stored user:', storedUser);
      setUserName(storedUser);
      setIsLoggedIn(true);
    } else {
      console.log('No stored user found');
    }
  }, []);

  /**
   * Logs in a user with the given name
   * @param {string} name - The username to login with
   * @throws {Error} If the name is invalid or if there's a database error
   */
  const login = async (name) => {
    try {
      console.log('Attempting to login with name:', name);
      
      if (!name || typeof name !== 'string' || name.trim() === '') {
        console.error('Invalid name provided');
        throw new Error('Please enter a valid name');
      }
      
      const trimmedName = name.trim();
      console.log('Trimmed name:', trimmedName);

      // Create/update user in app_users table
      const { data: userData, error: upsertError } = await supabase
        .from('app_users')
        .insert({ 
          user_name: trimmedName,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (upsertError) {
        // If insert fails due to unique constraint, user already exists
        if (upsertError.code === '23505') {
          console.log('User already exists, proceeding with login');
        } else {
          console.error('Error creating user:', upsertError);
          throw upsertError;
        }
      }

      console.log('User data:', userData);

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
  };

  /**
   * Logs out the current user
   * Clears local storage and resets session state
   */
  const logout = async () => {
    console.log('Logging out user:', userName);
    localStorage.removeItem('catNamesUser');
    setUserName('');
    setIsLoggedIn(false);
    setError(null);
    console.log('Logout complete');
  };

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
    logout
  };
}

export default useUserSession; 