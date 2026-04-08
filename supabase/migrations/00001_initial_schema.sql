-- =====================================================
-- Initial Database Schema for Font Generator
-- =====================================================
-- Creates tables, RLS policies, triggers, and helper functions
-- for user profiles, fonts, images, and favorites.
--
-- Migration: 00001_initial_schema.sql
-- Created: 2026-04-08
-- =====================================================

-- =====================================================
-- TABLES
-- =====================================================

-- -----------------------------------------------------
-- Table: user_profiles
-- -----------------------------------------------------
-- Stores user profile settings and preferences (1 row per user)

CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{
    "columns": 4,
    "padding": 24,
    "overlayOpacity": 0.25,
    "grayscale": false
  }'::jsonb,
  text_inputs JSONB NOT NULL DEFAULT '[{
    "id": "input-default-1",
    "text": "de Tribe",
    "fontSize": 56,
    "letterSpacing": 0.02,
    "lineHeight": 1.0,
    "textColor": "#ffffff",
    "textShadow": true,
    "textWrap": true,
    "alignment": "center",
    "verticalAlignment": "center"
  }]'::jsonb,
  toolbar_open BOOLEAN NOT NULL DEFAULT true,
  layer_font_pins JSONB NOT NULL DEFAULT '{}'::jsonb,
  disabled_images JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comments
COMMENT ON TABLE public.user_profiles IS 'User profile settings and preferences';
COMMENT ON COLUMN public.user_profiles.settings IS 'UI settings (columns, padding, overlayOpacity, grayscale)';
COMMENT ON COLUMN public.user_profiles.text_inputs IS 'Array of text input configurations';
COMMENT ON COLUMN public.user_profiles.layer_font_pins IS 'Pinned fonts for specific layers (Record<number, string>)';
COMMENT ON COLUMN public.user_profiles.disabled_images IS 'Array of disabled image URLs';

-- -----------------------------------------------------
-- Table: user_fonts
-- -----------------------------------------------------
-- Stores user font definitions (Google Fonts, local, uploaded)

CREATE TABLE public.user_fonts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  font_def JSONB NOT NULL,
  storage_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT font_def_required CHECK (font_def IS NOT NULL),
  CONSTRAINT font_def_has_id CHECK (font_def ? 'id'),
  CONSTRAINT font_def_has_name CHECK (font_def ? 'name'),
  CONSTRAINT font_def_has_source CHECK (font_def ? 'source')
);

-- Indexes
CREATE INDEX idx_user_fonts_user_id ON public.user_fonts(user_id);
CREATE INDEX idx_user_fonts_created_at ON public.user_fonts(created_at DESC);

-- Comments
COMMENT ON TABLE public.user_fonts IS 'User font definitions (Google, local, uploaded)';
COMMENT ON COLUMN public.user_fonts.font_def IS 'FontDef object: {id, name, family, weight, style?, source, localFile?, uploadUrl?, isActive?}';
COMMENT ON COLUMN public.user_fonts.storage_path IS 'Path in Supabase Storage (for uploaded fonts)';

-- -----------------------------------------------------
-- Table: user_images
-- -----------------------------------------------------
-- Stores user uploaded images

CREATE TABLE public.user_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT storage_path_not_empty CHECK (storage_path <> ''),
  CONSTRAINT url_not_empty CHECK (url <> '')
);

-- Indexes
CREATE INDEX idx_user_images_user_id ON public.user_images(user_id);
CREATE INDEX idx_user_images_created_at ON public.user_images(created_at DESC);

-- Comments
COMMENT ON TABLE public.user_images IS 'User uploaded images';
COMMENT ON COLUMN public.user_images.storage_path IS 'Path in Supabase Storage bucket';
COMMENT ON COLUMN public.user_images.url IS 'Public URL for the image';

-- -----------------------------------------------------
-- Table: user_favorites
-- -----------------------------------------------------
-- Stores user favorite tiles

CREATE TABLE public.user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  favorite_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT favorite_data_required CHECK (favorite_data IS NOT NULL),
  CONSTRAINT favorite_data_has_tile CHECK (favorite_data ? 'tile'),
  CONSTRAINT favorite_data_has_settings CHECK (favorite_data ? 'settings')
);

-- Indexes
CREATE INDEX idx_user_favorites_user_id ON public.user_favorites(user_id);
CREATE INDEX idx_user_favorites_created_at ON public.user_favorites(created_at DESC);

-- Comments
COMMENT ON TABLE public.user_favorites IS 'User favorite tiles';
COMMENT ON COLUMN public.user_favorites.favorite_data IS 'FavoriteItem object: {id, tile, settings, textInputs, savedAt}';

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_fonts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------
-- RLS Policies: user_profiles
-- -----------------------------------------------------

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can delete their own profile
CREATE POLICY "Users can delete own profile"
  ON public.user_profiles
  FOR DELETE
  USING (auth.uid() = id);

-- -----------------------------------------------------
-- RLS Policies: user_fonts
-- -----------------------------------------------------

-- Users can view their own fonts
CREATE POLICY "Users can view own fonts"
  ON public.user_fonts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own fonts
CREATE POLICY "Users can insert own fonts"
  ON public.user_fonts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own fonts
CREATE POLICY "Users can update own fonts"
  ON public.user_fonts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own fonts
CREATE POLICY "Users can delete own fonts"
  ON public.user_fonts
  FOR DELETE
  USING (auth.uid() = user_id);

-- -----------------------------------------------------
-- RLS Policies: user_images
-- -----------------------------------------------------

-- Users can view their own images
CREATE POLICY "Users can view own images"
  ON public.user_images
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own images
CREATE POLICY "Users can insert own images"
  ON public.user_images
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own images
CREATE POLICY "Users can update own images"
  ON public.user_images
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own images
CREATE POLICY "Users can delete own images"
  ON public.user_images
  FOR DELETE
  USING (auth.uid() = user_id);

-- -----------------------------------------------------
-- RLS Policies: user_favorites
-- -----------------------------------------------------

-- Users can view their own favorites
CREATE POLICY "Users can view own favorites"
  ON public.user_favorites
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own favorites
CREATE POLICY "Users can insert own favorites"
  ON public.user_favorites
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own favorites
CREATE POLICY "Users can update own favorites"
  ON public.user_favorites
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own favorites
CREATE POLICY "Users can delete own favorites"
  ON public.user_favorites
  FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- -----------------------------------------------------
-- Function: Auto-update updated_at timestamp
-- -----------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user_profiles
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- -----------------------------------------------------
-- Function: Create user profile on signup
-- -----------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Uncomment to verify schema after migration

-- Check all tables exist
-- SELECT table_name 
-- FROM information_schema.tables 
-- WHERE table_schema = 'public' 
--   AND table_name IN ('user_profiles', 'user_fonts', 'user_images', 'user_favorites');

-- Check RLS enabled
-- SELECT tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public';

-- Check all policies exist (should be 16 total: 4 tables × 4 operations)
-- SELECT tablename, policyname, cmd 
-- FROM pg_policies 
-- WHERE schemaname = 'public'
-- ORDER BY tablename, cmd;

-- =====================================================
-- END OF MIGRATION
-- =====================================================
