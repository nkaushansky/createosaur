# Supabase Storage Setup for Creature Images

## Required Steps

### 1. Create Storage Bucket

Run this SQL in your Supabase SQL Editor (or it will be created automatically when the first image is uploaded):

```sql
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
```

### 2. Alternative: Manual Setup via Dashboard

1. Go to your Supabase project dashboard
2. Navigate to "Storage" in the sidebar
3. Click "Create Bucket"
4. Name: `creature-images`
5. Public: `true` (enabled)
6. Click "Create bucket"

### 3. Configure RLS Policies (via Dashboard)

Go to Storage > creature-images > Policies and add:

**Policy 1: "Users can upload images"**
- Allowed operation: INSERT
- Target roles: authenticated
- USING expression: `bucket_id = 'creature-images' AND auth.uid()::text = (storage.foldername(name))[1]`

**Policy 2: "Users can view own images"** 
- Allowed operation: SELECT
- Target roles: authenticated
- USING expression: `bucket_id = 'creature-images' AND auth.uid()::text = (storage.foldername(name))[1]`

**Policy 3: "Users can delete own images"**
- Allowed operation: DELETE  
- Target roles: authenticated
- USING expression: `bucket_id = 'creature-images' AND auth.uid()::text = (storage.foldername(name))[1]`

**Policy 4: "Anyone can view public images"**
- Allowed operation: SELECT
- Target roles: anon, authenticated  
- USING expression: `bucket_id = 'creature-images'`

## How It Works

1. **Image Generation**: When a creature is generated, the AI provider returns a temporary image URL
2. **Image Upload**: The ImageStorageService downloads the image and uploads it to Supabase Storage
3. **Database Storage**: The permanent Supabase Storage URL is saved to the creatures table
4. **Persistence**: Images persist across sessions and are accessible from any device
5. **Cleanup**: When creatures are deleted, associated images are also removed from storage

## File Structure

Images are organized by user ID:
```
creature-images/
├── [user-id-1]/
│   ├── 1694876123456-abc123.png
│   └── 1694876789012-def456.png
└── [user-id-2]/
    └── 1694877000000-ghi789.png
```

This ensures user data isolation and efficient organization.