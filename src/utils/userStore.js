// User data management utility with Supabase
import { supabase } from '../config/supabaseClient';

/**
 * User data management utility - replaces localStorage for user-related data
 * All user-related data is stored in Supabase instead of localStorage
 */
export const userStore = {
  /**
   * Get the current session and user
   * @returns {Object|null} The current session and user or null if not authenticated
   */
  async getCurrentSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  /**
   * Get the current user
   * @returns {Object|null} The current user or null if not authenticated
   */
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  /**
   * Get a user's profile data
   * @param {string} userId - The user ID to get data for (optional, defaults to current user)
   * @returns {Object|null} The user's profile data or null if not found
   */
  async getUserProfile(userId = null) {
    if (!userId) {
      const user = await this.getCurrentUser();
      if (!user) return null;
      userId = user.id;
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data;
  },

  /**
   * Set user profile data
   * @param {Object} profileData - The profile data to set
   * @param {string} userId - The user ID to set data for (optional, defaults to current user)
   * @returns {boolean} Whether the operation was successful
   */
  async setUserProfile(profileData, userId = null) {
    if (!userId) {
      const user = await this.getCurrentUser();
      if (!user) return false;
      userId = user.id;
    }

    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    let result;

    if (existingProfile) {
      // Update existing profile
      result = await supabase
        .from('users')
        .update(profileData)
        .eq('id', userId);
    } else {
      // Insert new profile
      result = await supabase
        .from('users')
        .insert([{ id: userId, ...profileData }]);
    }

    if (result.error) {
      console.error('Error setting user profile:', result.error);
      return false;
    }

    return true;
  },

  /**
   * Update user preferences
   * @param {Object} preferences - The preferences to update
   * @returns {boolean} Whether the operation was successful
   */
  async updatePreferences(preferences) {
    const user = await this.getCurrentUser();
    if (!user) return false;

    // Get current preferences
    const { data: userPrefs, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    let result;

    if (userPrefs) {
      // Update existing preferences
      result = await supabase
        .from('user_preferences')
        .update({
          preferences: { ...userPrefs.preferences, ...preferences }
        })
        .eq('user_id', user.id);
    } else {
      // Insert new preferences
      result = await supabase
        .from('user_preferences')
        .insert([{
          user_id: user.id,
          preferences
        }]);
    }

    if (result.error) {
      console.error('Error updating user preferences:', result.error);
      return false;
    }

    return true;
  },

  /**
   * Get user preferences
   * @returns {Object} The user's preferences
   */
  async getPreferences() {
    const user = await this.getCurrentUser();
    if (!user) return {};

    const { data, error } = await supabase
      .from('user_preferences')
      .select('preferences')
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      return {};
    }

    return data.preferences || {};
  },

  /**
   * Update last activity timestamp for the user
   * @returns {boolean} Whether the operation was successful
   */
  async updateLastActivity() {
    const user = await this.getCurrentUser();
    if (!user) return false;

    const { error } = await supabase
      .from('user_sessions')
      .upsert([{
        user_id: user.id,
        last_activity: new Date().toISOString()
      }], { onConflict: 'user_id' });

    return !error;
  },

  /**
   * Check if the session has timed out
   * @param {number} timeoutMinutes - The number of minutes after which the session times out
   * @returns {boolean} Whether the session has timed out
   */
  async hasSessionTimedOut(timeoutMinutes = 30) {
    const user = await this.getCurrentUser();
    if (!user) return true; // No user means timed out

    const { data, error } = await supabase
      .from('user_sessions')
      .select('last_activity')
      .eq('user_id', user.id)
      .single();

    if (error || !data || !data.last_activity) {
      return false; // Assume not timed out if we can't determine
    }

    const lastActivity = new Date(data.last_activity);
    const now = new Date();
    const timeoutMs = timeoutMinutes * 60 * 1000;

    return now - lastActivity > timeoutMs;
  },
  
  /**
   * Get user's dark mode preference
   * @returns {boolean} Whether dark mode is enabled
   */
  async getDarkModePreference() {
    const preferences = await this.getPreferences();
    // Default to true if not set
    return preferences.darkMode === undefined ? true : preferences.darkMode;
  },
  
  /**
   * Set user's dark mode preference
   * @param {boolean} enabled - Whether dark mode should be enabled
   * @returns {boolean} Whether the operation was successful
   */
  async setDarkModePreference(enabled) {
    return await this.updatePreferences({ darkMode: enabled });
  }
};

export default userStore;
