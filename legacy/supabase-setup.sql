-- Createosaur Database Schema Setup
-- Run this script in Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Profiles Table
-- Stores additional user information and API keys
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  api_keys JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Creatures Table  
-- Stores user-generated creatures with full metadata
CREATE TABLE creatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  image_url TEXT,
  generation_params JSONB DEFAULT '{}',
  traits JSONB DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT FALSE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security Policies
-- Enable RLS on tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE creatures ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Creatures Policies
CREATE POLICY "Users can manage their own creatures" ON creatures
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view public creatures" ON creatures
  FOR SELECT USING (is_public = true);

-- Indexes for performance
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_creatures_user_id ON creatures(user_id);
CREATE INDEX idx_creatures_public ON creatures(is_public) WHERE is_public = true;
CREATE INDEX idx_creatures_created_at ON creatures(created_at DESC);
CREATE INDEX idx_creatures_favorites ON creatures(user_id, is_favorite) WHERE is_favorite = true;

-- Updated timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic updated_at
CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_creatures_updated_at 
  BEFORE UPDATE ON creatures 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create user profile automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
-- ========================================
-- STORAGE SETUP
-- ========================================

-- Create storage bucket for creature images
INSERT INTO storage.buckets (id, name, public) VALUES ('creature-images', 'creature-images', true);

-- Set up RLS policies for storage bucket
CREATE POLICY "Users can upload images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'creature-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own images" ON storage.objects
  FOR SELECT USING (bucket_id = 'creature-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own images" ON storage.objects
  FOR DELETE USING (bucket_id = 'creature-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view public images" ON storage.objects
  FOR SELECT USING (bucket_id = 'creature-images');

-- ========================================
-- TEST DATA (OPTIONAL)
-- ========================================

-- Test data insert (optional - remove in production)
-- This will help verify everything is working
-- Uncomment these lines if you want to test with sample data:

/*
INSERT INTO user_profiles (user_id, display_name, api_keys) VALUES 
  ('00000000-0000-0000-0000-000000000000', 'Test User', '{"huggingface": "test_key"}');

INSERT INTO creatures (user_id, name, traits, is_public) VALUES 
  ('00000000-0000-0000-0000-000000000000', 'Test Creature', '{"species": "T-Rex", "color": "green"}', true);
*/