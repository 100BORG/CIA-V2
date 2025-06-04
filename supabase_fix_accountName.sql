-- Fix for accountName column in invoices table
-- This script refreshes the schema cache for the accountName column

-- Note: We're skipping the column creation since it already exists
-- The error "column accountname already exists" confirms this

-- 1. Just make sure the column has the right type and is properly named
-- PostgreSQL column names are case-insensitive by default, so accountName and accountname are treated the same
-- Let's update any potential column metadata to ensure consistency
-- We'll add a comment to the column to force Supabase to refresh its schema cache
COMMENT ON COLUMN invoices.accountName IS 'Account name for banking details';

-- 2. Force Supabase to refresh its schema cache
-- This notifies Supabase to reload the schema
SELECT pg_notify('pgrst', 'reload schema');

-- 3. Alternative approach to ensure proper column casing if needed
-- Sometimes Supabase might be case-sensitive about column names
-- We can make sure the column has the exact case we want
DO $$
BEGIN
    -- Try to update the column name to ensure consistent casing
    -- This is safe since it only attempts to rename if the casing is different
    BEGIN
        EXECUTE 'ALTER TABLE invoices RENAME COLUMN accountname TO accountName';
        RAISE NOTICE 'Column renamed from accountname to accountName';
    EXCEPTION
        WHEN duplicate_column OR undefined_column THEN
            RAISE NOTICE 'Column already has correct name';
    END;
END
$$;
