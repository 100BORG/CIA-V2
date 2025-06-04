-- Database Troubleshooting and Schema Validation Script
-- This script validates and fixes common database schema issues for the CIA-V2 application

-- 1. Check if tables exist and create them if they don't
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        RAISE NOTICE 'Creating users table...';
        CREATE TABLE users (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            email text UNIQUE NOT NULL,
            name text NOT NULL,
            phone text,
            position text,
            role text DEFAULT 'user',
            avatar text,
            created_at timestamptz DEFAULT now(),
            updated_at timestamptz
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies') THEN
        RAISE NOTICE 'Creating companies table...';
        CREATE TABLE companies (
            id serial PRIMARY KEY,
            name text NOT NULL,
            logo text,
            address text,
            gstin text,
            bankDetails jsonb,
            created_by uuid REFERENCES users(id),
            created_at timestamptz DEFAULT now(),
            updated_at timestamptz
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients') THEN
        RAISE NOTICE 'Creating clients table...';
        CREATE TABLE clients (
            id serial PRIMARY KEY,
            name text NOT NULL,
            address text,
            phone text,
            email text,
            website text,
            gstin text,
            pan text,
            created_by uuid REFERENCES users(id),
            created_at timestamptz DEFAULT now(),
            updated_at timestamptz
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices') THEN
        RAISE NOTICE 'Creating invoices table...';
        CREATE TABLE invoices (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            invoiceNumber text NOT NULL,
            invoiceDate date NOT NULL,
            senderName text,
            senderAddress text,
            senderGSTIN text,
            recipientName text,
            recipientAddress text,
            recipientGSTIN text,
            recipientPAN text,
            recipientEmail text,
            recipientPhone text,
            recipientWebsite text,
            taxRate numeric,
            subtotalUSD numeric,
            subtotalINR numeric,
            taxAmountUSD numeric,
            taxAmountINR numeric,
            totalUSD numeric,
            totalINR numeric,
            currency text,
            exchangeRate numeric,
            logoUrl text,
            notes text,
            items jsonb,
            accountName text,
            bankName text,
            accountNumber text,
            ifscCode text,
            assigneeId uuid REFERENCES users(id),
            assigneeName text,
            assigneeRole text,
            assigneePosition text,
            companyId integer REFERENCES companies(id),
            status text,
            timestamp bigint,
            created_by uuid REFERENCES users(id),
            created_at timestamptz DEFAULT now(),
            updated_at timestamptz,
            deletedAt timestamptz,
            deletedBy uuid REFERENCES users(id)
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'descriptions') THEN
        RAISE NOTICE 'Creating descriptions table...';
        CREATE TABLE descriptions (
            id serial PRIMARY KEY,
            text text NOT NULL
        );
        
        -- Insert default descriptions
        INSERT INTO descriptions (text) VALUES
        ('US Federal Corporation Income Tax Return (Form 1120)'),
        ('Foreign related party disclosure form with respect to a foreign subsidiary (Form 5417)'),
        ('Foreign related party disclosure form with respect to a foreign shareholders (Form 5472)'),
        ('Application for Automatic Extension of Time To File Business Income Tax (Form 7004)');
    END IF;
END
$$;

-- 2. Fix common schema issues

-- Check and fix column naming/casing issues
DO $$
DECLARE
    col_exists boolean;
BEGIN
    -- Check for accountName column with different casing
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'invoices'
        AND column_name = 'accountname'
    ) INTO col_exists;
    
    IF col_exists THEN
        RAISE NOTICE 'Found column with name accountname, renaming to accountName for consistency';
        BEGIN
            EXECUTE 'ALTER TABLE invoices RENAME COLUMN accountname TO accountName';
        EXCEPTION WHEN duplicate_column THEN
            RAISE NOTICE 'Column accountName already exists with correct casing';
        END;
    END IF;
    
    -- Add more column checks here if needed
END
$$;

-- 3. Force schema cache refresh
-- Add comments to tables to trigger schema cache updates
COMMENT ON TABLE users IS 'Updated: June 4, 2025 - User accounts and profiles';
COMMENT ON TABLE companies IS 'Updated: June 4, 2025 - Company information';
COMMENT ON TABLE clients IS 'Updated: June 4, 2025 - Client information';
COMMENT ON TABLE invoices IS 'Updated: June 4, 2025 - Invoice data with banking details';
COMMENT ON TABLE descriptions IS 'Updated: June 4, 2025 - Service descriptions';

-- 4. Force Supabase to refresh its schema cache
SELECT pg_notify('pgrst', 'reload schema');

-- 5. Report success
DO $$
BEGIN
    RAISE NOTICE 'Database schema validation and fix completed successfully';
    RAISE NOTICE 'Tables checked: users, companies, clients, invoices, descriptions';
    RAISE NOTICE 'Schema cache refresh attempted';
END
$$;
