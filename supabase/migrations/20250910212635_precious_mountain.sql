/*
  # Setup Authentication and Initial Data

  1. Authentication
    - Enable Google OAuth provider
    - Create profiles table with RLS
    - Set up trigger for new user profiles

  2. Categories
    - Insert initial service categories

  3. Sample Data
    - Add sample professionals and reviews
    - Set up proper relationships

  4. Security
    - Enable RLS on all tables
    - Add appropriate policies
*/

-- Enable Google OAuth (this needs to be done in Supabase dashboard)
-- Go to Authentication > Providers > Google and enable it

-- Create profiles table if not exists
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE,
  name text,
  user_type text CHECK (user_type IN ('client', 'professional')),
  phone text,
  address text,
  avatar text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, email, name, user_type, avatar)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'user_type', 'client'),
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Insert categories if they don't exist
INSERT INTO categories (name, icon, color) VALUES
  ('Plomería', 'wrench', '#3B82F6'),
  ('Electricidad', 'zap', '#F59E0B'),
  ('Jardinería', 'flower', '#10B981'),
  ('Limpieza', 'sparkles', '#8B5CF6'),
  ('Carpintería', 'hammer', '#EF4444'),
  ('Pintura', 'palette', '#F97316')
ON CONFLICT (name) DO NOTHING;

-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Categories policies (public read)
CREATE POLICY "Categories are viewable by everyone" ON categories
  FOR SELECT USING (true);

-- Professionals policies
CREATE POLICY "Professionals are viewable by everyone" ON professionals
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own professional profile" ON professionals
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own professional profile" ON professionals
  FOR UPDATE USING (auth.uid() = id);

-- Bookings policies
CREATE POLICY "Users can view their own bookings" ON bookings
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = professional_id);

CREATE POLICY "Users can insert their own bookings" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings" ON bookings
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = professional_id);

-- Reviews policies
CREATE POLICY "Reviews are viewable by everyone" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON reviews
  FOR UPDATE USING (auth.uid() = user_id);