-- DELETE all users except target emails/names
DELETE FROM users
WHERE NOT (
    email = 'scalerxlab@gmail.com' 
    OR name ILIKE '%Kusum%'
);

-- Update roles
UPDATE users
SET role = 'SUPER_ADMIN'
WHERE email = 'scalerxlab@gmail.com';

UPDATE users
SET role = 'FIELD_SALES'
WHERE name ILIKE '%Kusum%';
