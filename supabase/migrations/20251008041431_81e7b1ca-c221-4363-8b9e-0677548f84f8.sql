-- Rename description column to item in company_expenses table
ALTER TABLE company_expenses 
RENAME COLUMN description TO item;