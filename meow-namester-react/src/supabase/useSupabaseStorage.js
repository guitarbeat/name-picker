/**
 * @module useSupabaseStorage
 * @description A custom React hook that provides persistent storage using Supabase.
 * Manages real-time synchronization of data between the client and Supabase backend.
 * Handles CRUD operations for cat names, ratings, and user data.
 * 
 * @example
 * // Basic usage in a component
 * const [ratings, setRatings, { loading, error }] = useSupabaseStorage('cat_names', [], 'JohnDoe');
 * 
 * // Update ratings
 * await setRatings([
 *   { name: 'Whiskers', elo_rating: 1500, wins: 2, losses: 1 },
 *   { name: 'Mittens', elo_rating: 1600, wins: 3, losses: 0 }
 * ]);
 * 
 * // Clear user data
 * const { clearUserData } = useSupabaseStorage('cat_names', [], 'JohnDoe')[2];
 * await clearUserData();
 * 
 * @param {string} tableName - Name of the Supabase table to interact with
 * @param {Array} initialValue - Initial value to use before data is loaded
 * @param {string} userName - Username to filter data by
 * @returns {[Array, Function, Object]} Tuple containing:
 *   - Current stored value
 *   - Function to update the value
 *   - Object with loading state, error state, and utility functions
 */

import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

function useSupabaseStorage(tableName, initialValue = [], userName = '') {
  const [storedValue, setStoredValue] = useState(initialValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userName) return;
    fetchData();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel(`${tableName}_changes`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: tableName,
          filter: `user_name=eq.${userName}`
        }, 
        (payload) => {
          console.log('Change received!', payload);
          fetchData();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [tableName, userName]);

  /**
   * Fetches the latest data from Supabase
   * @private
   */
  async function fetchData() {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from(tableName)
        .select('name, elo_rating, wins, losses, created_at')
        .eq('user_name', userName)
        .order('elo_rating', { ascending: false });

      if (fetchError) throw fetchError;

      setStoredValue(data?.map(item => ({
        name: item.name,
        rating: item.elo_rating,
        wins: item.wins,
        losses: item.losses
      })) || initialValue);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Updates data in Supabase
   * @param {Array|Object} newValue - New data to store
   * @throws {Error} If there's an error updating the data
   */
  async function setValue(newValue) {
    if (!userName) return;
    
    try {
      setLoading(true);
      
      if (Array.isArray(newValue)) {
        // Handle array updates (e.g., ranked cat names)
        const { error: upsertError } = await supabase
          .from(tableName)
          .upsert(
            newValue.map(item => ({
              name: item.name || item,
              elo_rating: item.rating || 1500,
              wins: item.wins || 0,
              losses: item.losses || 0,
              user_name: userName,
              updated_at: new Date().toISOString()
            }))
          );

        if (upsertError) throw upsertError;
      } else {
        // Handle single record updates
        const { error: upsertError } = await supabase
          .from(tableName)
          .upsert({
            name: newValue.name || newValue,
            elo_rating: newValue.rating || 1500,
            wins: newValue.wins || 0,
            losses: newValue.losses || 0,
            user_name: userName,
            updated_at: new Date().toISOString()
          });

        if (upsertError) throw upsertError;
      }

      await fetchData(); // Refresh data after update
    } catch (err) {
      console.error('Error setting value:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Clears all data for the current user from the specified table
   * @throws {Error} If there's an error clearing the data
   */
  async function clearUserData() {
    if (!userName) return;
    
    try {
      setLoading(true);
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .eq('user_name', userName);

      if (deleteError) throw deleteError;
      setStoredValue(initialValue);
    } catch (err) {
      console.error('Error clearing data:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  return [storedValue, setValue, { loading, error, clearUserData }];
}

export default useSupabaseStorage; 