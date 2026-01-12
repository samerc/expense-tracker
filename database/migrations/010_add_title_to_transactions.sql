-- Migration: Add title column to transactions
-- Title is mandatory, description is optional

-- Add title column
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS title VARCHAR(255);

-- Set existing transactions' title from description (or default)
UPDATE transactions
SET title = COALESCE(
  NULLIF(TRIM(LEFT(description, 255)), ''),
  'Transaction'
)
WHERE title IS NULL;

-- Make title NOT NULL after populating
ALTER TABLE transactions
ALTER COLUMN title SET NOT NULL;

-- Add comment
COMMENT ON COLUMN transactions.title IS 'Short transaction title (required)';
COMMENT ON COLUMN transactions.description IS 'Optional detailed description or notes';
