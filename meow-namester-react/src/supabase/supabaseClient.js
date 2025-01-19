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

    // Build query with updated_at field
    let query = supabase
      .from('name_options')
      .select(`
        id,
        name,
        description,
        cat_name_ratings (
          rating,
          wins,
          losses,
          updated_at
        )
      `);
    
    // Only apply the not.in filter if we have hidden IDs
    if (hiddenIds.length > 0) {
      query = query.not('id', 'in', `(${hiddenIds.join(',')})`);
    }

    // Execute query with ordering
    const { data, error } = await query.order('name');

    if (error) throw error;
    
    // Process the data to include the latest updated_at
    const processedData = data.map(item => ({
      ...item,
      updated_at: item.cat_name_ratings?.[0]?.updated_at || null
    }));
    
    console.log('Received data from database:', processedData); // Debug log
    return processedData || [];
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

// Add this function to update ratings with proper timestamps
export const updateRating = async (userName, nameId, newRating, wins = 0, losses = 0) => {
  const now = new Date().toISOString();
  
  try {
    const { error } = await supabase
      .from('cat_name_ratings')
      .upsert({
        user_name: userName,
        name_id: nameId,
        rating: newRating,
        wins: wins,
        losses: losses,
        updated_at: now
      }, {
        onConflict: 'user_name,name_id'
      });

    if (error) throw error;
    
    // Also update the rating history
    await addRatingHistory(userName, nameId, null, newRating);
    
    return { error: null };
  } catch (error) {
    console.error('Error updating rating:', error);
    return { error };
  }
};

// Add this function to delete a name (only if it's hidden)
export const deleteName = async (nameId) => {
  try {
    console.log('Starting deletion process for name ID:', nameId);
    
    // First check if the name exists in name_options
    const { data: nameData, error: nameError } = await supabase
      .from('name_options')
      .select('*')
      .eq('id', nameId)
      .single();
    
    if (nameError) {
      console.error('Error checking name existence:', nameError);
      throw nameError;
    }
    
    if (!nameData) {
      throw new Error('Name does not exist in database');
    }

    // Check if name is hidden
    const { data: hiddenData, error: hiddenError } = await supabase
      .from('hidden_names')
      .select('*')
      .eq('name_id', nameId);
    
    console.log('Hidden name check:', { hiddenData, hiddenError });
    
    if (hiddenError) {
      console.error('Error checking hidden status:', hiddenError);
      throw hiddenError;
    }
    
    if (!hiddenData || hiddenData.length === 0) {
      throw new Error('Cannot delete name that is not hidden');
    }

    console.log('Starting cascading delete process...');

    // 1. Delete from tournament_progress (update arrays)
    console.log('Updating tournament_progress...');
    const { data: tournamentData, error: error1 } = await supabase
      .from('tournament_progress')
      .select('id, names');
    
    if (error1) {
      console.error('Error fetching tournament progress:', error1);
      throw error1;
    }

    const updatePromises = tournamentData
      .filter(progress => progress.names && progress.names.includes(nameId))
      .map(progress => {
        const updatedNames = progress.names.filter(id => id !== nameId);
        return supabase
          .from('tournament_progress')
          .update({ names: updatedNames })
          .eq('id', progress.id);
      });

    if (updatePromises.length > 0) {
      console.log(`Updating ${updatePromises.length} tournament progress records...`);
      const results = await Promise.all(updatePromises);
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        console.error('Errors updating tournament progress:', errors);
        throw errors[0].error;
      }
    }

    // 2. Delete from cat_name_ratings
    console.log('Deleting from cat_name_ratings...');
    const { error: error2 } = await supabase
      .from('cat_name_ratings')
      .delete()
      .eq('name_id', nameId);
    
    if (error2) {
      console.error('Error deleting ratings:', error2);
      throw error2;
    }

    // 3. Delete from hidden_names
    console.log('Deleting from hidden_names...');
    const { error: error3 } = await supabase
      .from('hidden_names')
      .delete()
      .eq('name_id', nameId);
    
    if (error3) {
      console.error('Error deleting from hidden_names:', error3);
      throw error3;
    }

    // 4. Finally delete from name_options
    console.log('Deleting from name_options...');
    const { error: error4 } = await supabase
      .from('name_options')
      .delete()
      .eq('id', nameId);
    
    if (error4) {
      console.error('Error deleting from name_options:', error4);
      throw error4;
    }

    console.log('Successfully completed deletion process');
    return { error: null, success: true };
  } catch (error) {
    console.error('Error in deleteName function:', error);
    return { error, success: false };
  }
};