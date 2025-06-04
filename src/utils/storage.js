import { APP_CONFIG } from '../config/appConfig';
import { supabase } from '../config/supabaseClient';

const { storagePrefix } = APP_CONFIG.auth;

/**
 * Storage utility for handling data persistence with Supabase
 * This replaces all localStorage usage with Supabase database operations
 */
export const storage = {  /**
   * Get an item from user preferences in Supabase
   * @param {string} key - The key to retrieve
   * @param {any} defaultValue - Default value if key doesn't exist
   * @returns {Promise<any>} The value or defaultValue if not found
   */
  get: async (key, defaultValue = null) => {
    try {
      // First get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return defaultValue;
      
      // Get user preferences
      const { data, error } = await supabase
        .from('user_preferences')
        .select('preferences')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      
      // Return the specific preference if it exists
      if (data && data.preferences && data.preferences[key] !== undefined) {
        return data.preferences[key];
      }
      
      return defaultValue;
    } catch (error) {
      console.error(`Error accessing Supabase storage for key ${key}:`, error);
      return defaultValue;
    }
  },
  /**
   * Set an item in user preferences in Supabase
   * @param {string} key - The key to set
   * @param {any} value - The value to store
   * @returns {Promise<boolean>} Whether the operation was successful
   */
  set: async (key, value) => {
    try {
      // First get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      
      // Get current preferences
      const { data, error } = await supabase
        .from('user_preferences')
        .select('preferences')
        .eq('user_id', user.id)
        .single();
      
      let preferences = {};
      if (!error && data) {
        preferences = data.preferences;
      }
      
      // Update the preference
      preferences[key] = value;
      
      // Upsert the preferences
      const { error: upsertError } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          preferences: preferences,
          updated_at: new Date()
        });
      
      if (upsertError) throw upsertError;
      
      return true;
    } catch (error) {
      console.error(`Error setting Supabase storage for key ${key}:`, error);
      return false;
    }
  },  /**
   * Remove an item from user preferences in Supabase
   * @param {string} key - The key to remove
   * @returns {Promise<boolean>} Whether the operation was successful
   */
  remove: async (key) => {
    try {
      // First get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      
      // Get current preferences
      const { data, error } = await supabase
        .from('user_preferences')
        .select('preferences')
        .eq('user_id', user.id)
        .single();
      
      if (error || !data) return false;
      
      // Remove the preference
      const preferences = data.preferences;
      if (preferences && preferences[key] !== undefined) {
        delete preferences[key];
        
        // Update the preferences
        const { error: updateError } = await supabase
          .from('user_preferences')
          .update({
            preferences: preferences,
            updated_at: new Date()
          })
          .eq('user_id', user.id);
        
        if (updateError) throw updateError;
      }
      
      return true;
    } catch (error) {
      console.error(`Error removing Supabase storage for key ${key}:`, error);
      return false;
    }
  },
  /**
   * Clear all user preferences in Supabase
   * @returns {Promise<boolean>} Whether the operation was successful
   */
  clearAll: async () => {
    try {
      // First get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      
      // Update preferences to empty object
      const { error } = await supabase
        .from('user_preferences')
        .update({
          preferences: {},
          updated_at: new Date()
        })
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error(`Error clearing Supabase storage:`, error);
      return false;
    }
  },

  /**
   * Update the last activity timestamp
   */
  updateLastActivity: () => {
    storage.set('lastActivity', new Date().getTime());
  }
};

export default storage;