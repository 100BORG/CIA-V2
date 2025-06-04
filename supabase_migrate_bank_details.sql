-- Update script to migrate account details to the bankDetails JSON field
-- This helps solve the schema cache issue with the accountName column

-- 1. Make sure the bankDetails column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'invoices'
        AND column_name = 'bankdetails'
    ) THEN
        -- Add the column if it doesn't exist
        ALTER TABLE invoices ADD COLUMN bankDetails jsonb DEFAULT '{}'::jsonb;
        RAISE NOTICE 'Added bankDetails column to invoices table';
    ELSE
        RAISE NOTICE 'bankDetails column already exists';
    END IF;
END
$$;

-- 2. Migrate data from accountName column to bankDetails.accountName
UPDATE invoices
SET bankDetails = jsonb_set(
    COALESCE(bankDetails, '{}'::jsonb),
    '{accountName}',
    to_jsonb(accountName)
)
WHERE accountName IS NOT NULL AND accountName != '';

-- 3. Validate migration
SELECT 
    id,
    accountName,
    bankDetails->>'accountName' as bank_details_account_name
FROM 
    invoices 
WHERE 
    accountName IS NOT NULL
LIMIT 10;

-- 4. Update other bank fields if needed
UPDATE invoices
SET bankDetails = jsonb_set(
    COALESCE(bankDetails, '{}'::jsonb),
    '{bankName}',
    to_jsonb(bankName)
)
WHERE bankName IS NOT NULL AND bankName != '';

UPDATE invoices
SET bankDetails = jsonb_set(
    COALESCE(bankDetails, '{}'::jsonb),
    '{accountNumber}',
    to_jsonb(accountNumber)
)
WHERE accountNumber IS NOT NULL AND accountNumber != '';

UPDATE invoices
SET bankDetails = jsonb_set(
    COALESCE(bankDetails, '{}'::jsonb),
    '{ifscCode}',
    to_jsonb(ifscCode)
)
WHERE ifscCode IS NOT NULL AND ifscCode != '';

-- 5. Tell Supabase to refresh its schema cache
SELECT pg_notify('pgrst', 'reload schema');

-- 6. Report success
DO $$
BEGIN
    RAISE NOTICE 'Migration of account details to bankDetails JSON field completed successfully';
END
$$;
