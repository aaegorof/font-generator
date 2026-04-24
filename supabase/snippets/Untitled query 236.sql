-- Cleanup duplicate images in user_images table
-- Keep only the oldest record for each user_id + url combination

WITH duplicates AS (
  SELECT 
    id,
    user_id,
    url,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, url 
      ORDER BY created_at ASC
    ) as row_num
  FROM user_images
)
DELETE FROM user_images
WHERE id IN (
  SELECT id FROM duplicates WHERE row_num > 1
);

-- Cleanup duplicate fonts in user_fonts table
-- Keep only the oldest record for each user_id + font_def->id combination

WITH font_duplicates AS (
  SELECT 
    id,
    user_id,
    font_def->>'id' as font_id,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, font_def->>'id'
      ORDER BY created_at ASC
    ) as row_num
  FROM user_fonts
)
DELETE FROM user_fonts
WHERE id IN (
  SELECT id FROM font_duplicates WHERE row_num > 1
);

-- Display cleanup results
DO $$
DECLARE
  image_dupes_removed INTEGER;
  font_dupes_removed INTEGER;
BEGIN
  -- This is just for logging, actual delete happens above
  RAISE NOTICE 'Duplicate cleanup completed';
END $$;
