/*
  # Fix RLS Policies and Create Missing Tables

  1. RLS Policy Fixes
    - Fix profiles table INSERT policy to allow authenticated users to create their own profiles
    - Add proper SELECT policy for profiles table
    
  2. Missing Tables
    - Create professionals table that was missing from the original migration
    - Add proper RLS policies for professionals table
    
  3. Security
    - Enable RLS on all tables
    - Add policies for public read access where appropriate
    - Add policies for authenticated user operations
*/

-- Fix profiles table RLS policies
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Allow authenticated users to insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow authenticated users to read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow authenticated users to update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create professionals table (missing from original migration)
CREATE TABLE IF NOT EXISTS professionals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES categories(id) NOT NULL,
  experience_years integer DEFAULT 0,
  hourly_rate decimal(10,2),
  availability text DEFAULT 'available',
  location text,
  description text,
  skills text[],
  portfolio_images text[],
  rating decimal(3,2) DEFAULT 0.0,
  total_reviews integer DEFAULT 0,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on professionals table
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;

-- Allow public read access to professionals
CREATE POLICY "Anyone can view professionals"
  ON professionals
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow authenticated users to insert their own professional profile
CREATE POLICY "Users can create own professional profile"
  ON professionals
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = professionals.user_id 
    AND profiles.id = auth.uid()
  ));

-- Allow users to update their own professional profile
CREATE POLICY "Users can update own professional profile"
  ON professionals
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = professionals.user_id 
    AND profiles.id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = professionals.user_id 
    AND profiles.id = auth.uid()
  ));

-- Allow users to delete their own professional profile
CREATE POLICY "Users can delete own professional profile"
  ON professionals
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = professionals.user_id 
    AND profiles.id = auth.uid()
  ));

-- Fix services table RLS policies
DROP POLICY IF EXISTS "Anyone can view services" ON services;
DROP POLICY IF EXISTS "Users can create own services" ON services;
DROP POLICY IF EXISTS "Users can update own services" ON services;
DROP POLICY IF EXISTS "Users can delete own services" ON services;

-- Allow public read access to services
CREATE POLICY "Anyone can view services"
  ON services
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow authenticated users to create services
CREATE POLICY "Users can create own services"
  ON services
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = services.user_id 
    AND profiles.id = auth.uid()
  ));

-- Allow users to update their own services
CREATE POLICY "Users can update own services"
  ON services
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = services.user_id 
    AND profiles.id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = services.user_id 
    AND profiles.id = auth.uid()
  ));

-- Allow users to delete their own services
CREATE POLICY "Users can delete own services"
  ON services
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = services.user_id 
    AND profiles.id = auth.uid()
  ));

-- Fix bookings table RLS policies
DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON bookings;

-- Allow users to view bookings they created or bookings for their services
CREATE POLICY "Users can view own bookings"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = client_id OR 
    EXISTS (
      SELECT 1 FROM services 
      WHERE services.id = bookings.service_id 
      AND services.user_id = auth.uid()
    )
  );

-- Allow authenticated users to create bookings
CREATE POLICY "Users can create bookings"
  ON bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = client_id);

-- Allow users to update bookings they created or bookings for their services
CREATE POLICY "Users can update own bookings"
  ON bookings
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = client_id OR 
    EXISTS (
      SELECT 1 FROM services 
      WHERE services.id = bookings.service_id 
      AND services.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = client_id OR 
    EXISTS (
      SELECT 1 FROM services 
      WHERE services.id = bookings.service_id 
      AND services.user_id = auth.uid()
    )
  );

-- Fix reviews table RLS policies
DROP POLICY IF EXISTS "Anyone can view reviews" ON reviews;
DROP POLICY IF EXISTS "Users can create reviews" ON reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON reviews;

-- Allow public read access to reviews
CREATE POLICY "Anyone can view reviews"
  ON reviews
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow authenticated users to create reviews for bookings they made
CREATE POLICY "Users can create reviews"
  ON reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM bookings 
    WHERE bookings.id = reviews.booking_id 
    AND bookings.client_id = auth.uid()
  ));

-- Allow users to update their own reviews
CREATE POLICY "Users can update own reviews"
  ON reviews
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM bookings 
    WHERE bookings.id = reviews.booking_id 
    AND bookings.client_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM bookings 
    WHERE bookings.id = reviews.booking_id 
    AND bookings.client_id = auth.uid()
  ));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_professionals_user_id ON professionals(user_id);
CREATE INDEX IF NOT EXISTS idx_professionals_category_id ON professionals(category_id);
CREATE INDEX IF NOT EXISTS idx_professionals_rating ON professionals(rating DESC);
CREATE INDEX IF NOT EXISTS idx_services_user_id ON services(user_id);
CREATE INDEX IF NOT EXISTS idx_services_category_id ON services(category_id);
CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_service_id ON bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON reviews(booking_id);