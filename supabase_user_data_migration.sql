-- SQL script to set up additional tables for user data that was previously in localStorage
-- This extends the existing schema to support user preferences, sessions, and other data

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    preferences jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- User sessions table for tracking activity and session management
CREATE TABLE IF NOT EXISTS user_sessions (
    user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    last_activity timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Invoice serial numbers table (replacing localStorage counter)
CREATE TABLE IF NOT EXISTS invoice_serials (
    id serial PRIMARY KEY,
    customer_prefix text NOT NULL,
    date_key text NOT NULL,
    last_serial integer NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    -- Unique constraint on customer+date combination
    UNIQUE(customer_prefix, date_key)
);

-- Add trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables
DROP TRIGGER IF EXISTS update_user_preferences_timestamp ON user_preferences;
CREATE TRIGGER update_user_preferences_timestamp
BEFORE UPDATE ON user_preferences
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_user_sessions_timestamp ON user_sessions;
CREATE TRIGGER update_user_sessions_timestamp
BEFORE UPDATE ON user_sessions
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_invoice_serials_timestamp ON invoice_serials;
CREATE TRIGGER update_invoice_serials_timestamp
BEFORE UPDATE ON invoice_serials
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Create or update RLS (Row Level Security) policies
-- This ensures users can only access their own data

-- User preferences policies
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own preferences" ON user_preferences;
CREATE POLICY "Users can view their own preferences" 
    ON user_preferences FOR SELECT 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own preferences" ON user_preferences;
CREATE POLICY "Users can update their own preferences" 
    ON user_preferences FOR UPDATE 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own preferences" ON user_preferences;
CREATE POLICY "Users can insert their own preferences" 
    ON user_preferences FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- User sessions policies
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own sessions" ON user_sessions;
CREATE POLICY "Users can view their own sessions" 
    ON user_sessions FOR SELECT 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own sessions" ON user_sessions;
CREATE POLICY "Users can update their own sessions" 
    ON user_sessions FOR UPDATE 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own sessions" ON user_sessions;
CREATE POLICY "Users can insert their own sessions" 
    ON user_sessions FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Invoice serials policies (allow all authenticated users to read)
ALTER TABLE invoice_serials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "All users can view invoice serials" ON invoice_serials;
CREATE POLICY "All users can view invoice serials" 
    ON invoice_serials FOR SELECT 
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "All users can update invoice serials" ON invoice_serials;
CREATE POLICY "All users can update invoice serials" 
    ON invoice_serials FOR UPDATE 
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "All users can insert invoice serials" ON invoice_serials;
CREATE POLICY "All users can insert invoice serials" 
    ON invoice_serials FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

-- Create function to get and increment invoice serial
CREATE OR REPLACE FUNCTION get_next_invoice_serial(prefix text, date_key text)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
    serial_number integer;
BEGIN
    -- Try to update the existing record and return the new value
    UPDATE invoice_serials
    SET last_serial = last_serial + 1,
        updated_at = now()
    WHERE customer_prefix = prefix AND date_key = date_key
    RETURNING last_serial INTO serial_number;
    
    -- If no record was updated, insert a new one starting at 1
    IF serial_number IS NULL THEN
        INSERT INTO invoice_serials (customer_prefix, date_key, last_serial)
        VALUES (prefix, date_key, 1)
        RETURNING last_serial INTO serial_number;
    END IF;
    
    RETURN serial_number;
END;
$$;
