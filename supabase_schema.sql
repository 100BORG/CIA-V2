-- Supabase SQL schema for Invoice App

-- Users table
CREATE TABLE IF NOT EXISTS users (
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

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
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

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
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

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
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
