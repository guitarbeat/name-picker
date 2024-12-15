/**
 * @module useNameOptions
 * @description A custom React hook that manages cat name options in Supabase.
 */

import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

function useNameOptions() {
  const [nameOptions, setNameOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNameOptions();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('name_options_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'name_options' 
        }, 
        () => {
          fetchNameOptions();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function fetchNameOptions() {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('name_options')
        .select('name, description')
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      setNameOptions(data);
    } catch (err) {
      console.error('Error fetching name options:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  async function addNameOption(newName, description = '') {
    if (!newName?.trim()) return;
    
    try {
      setLoading(true);
      const { error: insertError } = await supabase
        .from('name_options')
        .insert([{ 
          name: newName.trim(),
          description: description.trim()
        }])
        .select();  // Add select() to ensure proper error handling

      if (insertError) {
        console.error('Insert error details:', insertError);
        throw insertError;
      }
      
      // Fetch updated data after successful insert
      await fetchNameOptions();
      
    } catch (err) {
      console.error('Error adding name option:', err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function removeNameOption(name) {
    try {
      setLoading(true);
      const { error: deleteError } = await supabase
        .from('name_options')
        .delete()
        .eq('name', name);

      if (deleteError) throw deleteError;
    } catch (err) {
      console.error('Error removing name option:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  return {
    nameOptions,
    loading,
    error,
    addNameOption,
    removeNameOption
  };
}

export default useNameOptions;