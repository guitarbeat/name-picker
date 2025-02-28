/**
 * @module useSupabaseStorage
 * @description A custom React hook that provides persistent storage using Supabase.
 * Manages real-time synchronization of data between the client and Supabase backend.
 */

import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { DEFAULT_RATING } from '../components/Profile/Profile';

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
          filter: userName ? `user_name=eq.${userName}` : undefined
        }, 
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [tableName, userName]);

  async function fetchData() {
    try {
      setLoading(true);
      
      const { data, error: fetchError } = await supabase
        .from('cat_name_ratings')
        .select(`
          rating,
          wins,
          losses,
          name_id,
          updated_at,
          name_options (
            id,
            name,
            description
          )
        `)
        .eq('user_name', userName)
        .order('rating', { ascending: false });

      if (fetchError) throw fetchError;

      console.log('Raw data from database:', data); // Debug log

      const processedData = data
        ?.filter(item => item.name_options) // Filter out any items without name_options
        .map(item => {
          const wins = parseInt(item.wins || 0, 10);
          const losses = parseInt(item.losses || 0, 10);
          
          return {
            id: item.name_id,
            name: item.name_options.name,
            description: item.name_options.description,
            rating: parseInt(item.rating || DEFAULT_RATING, 10),
            wins,
            losses,
            updated_at: item.updated_at || new Date().toISOString()
          };
        }) || initialValue;

      console.log('Processed data:', processedData); // Debug log
      setStoredValue(processedData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  async function setValue(newValue) {
    if (!userName) return;
    
    try {
      console.log('Setting new value:', newValue); // Debug log
      
      // First, ensure all names exist in name_options
      const names = Array.isArray(newValue) 
        ? newValue.map(v => v.name)
        : [newValue.name];

      const { data: nameOptions, error: nameError } = await supabase
        .from('name_options')
        .select('id, name')
        .in('name', names);

      if (nameError) throw nameError;

      // Create a map of name to name_id
      const nameToIdMap = nameOptions.reduce((acc, { id, name }) => {
        acc[name] = id;
        return acc;
      }, {});

      // Prepare records for upsert
      const records = (Array.isArray(newValue) ? newValue : [newValue])
        .map(item => {
          const wins = parseInt(item.wins || 0, 10);
          const losses = parseInt(item.losses || 0, 10);
          
          return {
            user_name: userName,
            name_id: nameToIdMap[item.name],
            rating: parseInt(item.rating || DEFAULT_RATING, 10),
            wins,
            losses,
            updated_at: new Date().toISOString()
          };
        })
        .filter(record => record.name_id);

      if (records.length === 0) {
        throw new Error('No valid records to update');
      }

      console.log('Upserting records:', records); // Debug log

      const { error: upsertError } = await supabase
        .from('cat_name_ratings')
        .upsert(records, {
          onConflict: 'user_name,name_id',
          returning: 'minimal'
        });

      if (upsertError) throw upsertError;

      // Fetch updated data to verify
      const { data: verifyData, error: verifyError } = await supabase
        .from('cat_name_ratings')
        .select(`
          rating,
          wins,
          losses,
          name_id,
          name_options (
            id,
            name,
            description
          )
        `)
        .in('name_id', records.map(r => r.name_id));

      if (verifyError) {
        console.error('Error verifying update:', verifyError);
      } else {
        console.log('Verified data after update:', verifyData); // Debug log
      }

      // Fetch updated data
      await fetchData();
    } catch (err) {
      console.error('Error updating data:', err);
      setError(err);
      throw err;
    }
  }

  async function clearUserData() {
    if (!userName) return;

    try {
      const { error: deleteError } = await supabase
        .from('cat_name_ratings')
        .delete()
        .eq('user_name', userName);

      if (deleteError) throw deleteError;

      setStoredValue(initialValue);
    } catch (err) {
      console.error('Error clearing user data:', err);
      setError(err);
      throw err;
    }
  }

  return [storedValue, setValue, { loading, error, clearUserData }];
}

export default useSupabaseStorage; 