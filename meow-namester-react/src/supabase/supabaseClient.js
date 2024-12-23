/**
 * @module supabaseClient
 * @description Configures and exports the Supabase client instance.
 * Sets up the connection to Supabase with proper authentication and headers.
 * 
 * @example
 * // Import and use the client
 * import { supabase } from './supabaseClient';
 * 
 * // Make a query
 * const { data, error } = await supabase
 *   .from('table_name')
 *   .select('*');
 * 
 * @requires REACT_APP_SUPABASE_URL - Environment variable for Supabase project URL
 * @requires REACT_APP_SUPABASE_ANON_KEY - Environment variable for Supabase anonymous key
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Add this function to get names with descriptions
export const getNamesWithDescriptions = async () => {
  try {
    console.log('Fetching names from database...'); // Debug log
    
    // First get hidden name IDs
    const { data: hiddenData, error: hiddenError } = await supabase
      .from('hidden_names')
      .select('name_id');
    
    if (hiddenError) {
      console.error('Error fetching hidden names:', hiddenError);
      throw hiddenError;
    }

    const hiddenIds = hiddenData?.map(item => item.name_id) || [];
    console.log('Hidden IDs:', hiddenIds);

    // Build query
    let query = supabase
      .from('name_options')
      .select(`
        id,
        name,
        description
      `);
    
    // Only apply the not.in filter if we have hidden IDs
    if (hiddenIds.length > 0) {
      query = query.not('id', 'in', `(${hiddenIds.join(',')})`);
    }

    // Execute query with ordering
    const { data, error } = await query.order('name');

    if (error) throw error;
    
    console.log('Received data from database:', data); // Debug log
    return data || [];
  } catch (error) {
    console.error('Error fetching names:', error);
    throw error;
  }
};

// Add this function to track rating history
export const addRatingHistory = async (userName, nameId, oldRating, newRating) => {
  try {
    const { error } = await supabase
      .from('rating_history')
      .insert({
        user_name: userName,
        name_id: nameId,
        old_rating: oldRating,
        new_rating: newRating,
        timestamp: new Date().toISOString()
      });
      
    if (error) throw error;
  } catch (error) {
    console.error('Error saving rating history:', error);
    throw error;
  }
};