-- Backfill user_memberships for all existing users
INSERT INTO user_memberships (id, user_id, organization_id, status, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  users.id,
  users.organization_id,
  'active',
  NOW(),
  NOW()
FROM users
WHERE NOT EXISTS (
  SELECT 1 FROM user_memberships
  WHERE user_memberships.user_id = users.id
    AND user_memberships.organization_id = users.organization_id
);
