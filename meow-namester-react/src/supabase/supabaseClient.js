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
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  auth: {
    persistSession: true
  }
});

// Add this function to get names with descriptions
export const getNamesWithDescriptions = async () => {
  try {
    const { data, error } = await supabase
      .from('name_options')
      .select('name, description')
      .order('name');
      
    if (error) throw error;
    
    // Log the data to see what we're getting
    console.log('Fetched names with descriptions:', data);
    
    // Ensure each item has both name and description
    return data.map(item => ({
      name: item.name,
      description: item.description || 'No description available'
    }));
  } catch (error) {
    console.error('Error fetching names:', error);
    throw error;
  }
}; 