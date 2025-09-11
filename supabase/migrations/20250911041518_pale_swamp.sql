/*
  # Create missing availability system tables

  1. New Tables
    - `professional_availability`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `day_of_week` (integer, 0-6 for Sunday-Saturday)
      - `start_time` (text, HH:MM format)
      - `end_time` (text, HH:MM format)
      - `is_available` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `blocked_time_slots`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `booking_id` (uuid, foreign key to bookings, nullable)
      - `date` (date)
      - `start_time` (text, HH:MM format)
      - `end_time` (text, HH:MM format)
      - `reason` (text, default 'personal')
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own data
    - Allow read access for availability checking

  3. Functions
    - `get_available_slots`: Get available time slots for a professional on a specific date
    - `check_availability`: Check if a specific time slot is available
    - `block_slot_on_booking_accept`: Automatically block slots when bookings are accepted
*/

-- Create professional_availability table
CREATE TABLE IF NOT EXISTS professional_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time text NOT NULL,
  end_time text NOT NULL,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create blocked_time_slots table
CREATE TABLE IF NOT EXISTS blocked_time_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  date date NOT NULL,
  start_time text NOT NULL,
  end_time text NOT NULL,
  reason text NOT NULL DEFAULT 'personal',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE professional_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_time_slots ENABLE ROW LEVEL SECURITY;

-- RLS Policies for professional_availability
CREATE POLICY "Users can read all professional availability"
  ON professional_availability
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can manage their own availability"
  ON professional_availability
  FOR ALL
  TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for blocked_time_slots
CREATE POLICY "Users can read relevant blocked slots"
  ON blocked_time_slots
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can manage their own blocked slots"
  ON blocked_time_slots
  FOR ALL
  TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_professional_availability_user_id ON professional_availability(user_id);
CREATE INDEX IF NOT EXISTS idx_professional_availability_day_of_week ON professional_availability(day_of_week);
CREATE INDEX IF NOT EXISTS idx_blocked_time_slots_user_id ON blocked_time_slots(user_id);
CREATE INDEX IF NOT EXISTS idx_blocked_time_slots_date ON blocked_time_slots(date);
CREATE INDEX IF NOT EXISTS idx_blocked_time_slots_booking_id ON blocked_time_slots(booking_id);

-- Function to get available slots for a professional on a specific date
CREATE OR REPLACE FUNCTION get_available_slots(
  professional_id uuid,
  booking_date date,
  slot_duration_hours integer DEFAULT 1
)
RETURNS TABLE(start_time text, end_time text) AS $$
DECLARE
  day_of_week_num integer;
  availability_record RECORD;
  slot_start time;
  slot_end time;
  current_slot_start time;
  current_slot_end time;
BEGIN
  -- Get day of week (0 = Sunday, 1 = Monday, etc.)
  day_of_week_num := EXTRACT(DOW FROM booking_date);
  
  -- Get availability for this day
  FOR availability_record IN 
    SELECT pa.start_time::time, pa.end_time::time
    FROM professional_availability pa
    WHERE pa.user_id = professional_id 
      AND pa.day_of_week = day_of_week_num 
      AND pa.is_available = true
  LOOP
    slot_start := availability_record.start_time;
    slot_end := availability_record.end_time;
    
    -- Generate slots within this availability window
    current_slot_start := slot_start;
    
    WHILE current_slot_start + (slot_duration_hours || ' hours')::interval <= slot_end LOOP
      current_slot_end := current_slot_start + (slot_duration_hours || ' hours')::interval;
      
      -- Check if this slot is not blocked
      IF NOT EXISTS (
        SELECT 1 FROM blocked_time_slots bts
        WHERE bts.user_id = professional_id
          AND bts.date = booking_date
          AND (
            (current_slot_start::text >= bts.start_time AND current_slot_start::text < bts.end_time)
            OR (current_slot_end::text > bts.start_time AND current_slot_end::text <= bts.end_time)
            OR (current_slot_start::text <= bts.start_time AND current_slot_end::text >= bts.end_time)
          )
      ) THEN
        start_time := current_slot_start::text;
        end_time := current_slot_end::text;
        RETURN NEXT;
      END IF;
      
      -- Move to next slot (30 minute intervals)
      current_slot_start := current_slot_start + interval '30 minutes';
    END LOOP;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Function to check if a specific time slot is available
CREATE OR REPLACE FUNCTION check_availability(
  professional_id uuid,
  booking_date date,
  booking_start_time text,
  booking_end_time text
)
RETURNS boolean AS $$
DECLARE
  day_of_week_num integer;
  is_in_availability boolean := false;
  is_blocked boolean := false;
BEGIN
  -- Get day of week
  day_of_week_num := EXTRACT(DOW FROM booking_date);
  
  -- Check if the time slot is within professional's availability
  SELECT EXISTS (
    SELECT 1 FROM professional_availability pa
    WHERE pa.user_id = professional_id
      AND pa.day_of_week = day_of_week_num
      AND pa.is_available = true
      AND booking_start_time::time >= pa.start_time::time
      AND booking_end_time::time <= pa.end_time::time
  ) INTO is_in_availability;
  
  -- Check if the time slot is blocked
  SELECT EXISTS (
    SELECT 1 FROM blocked_time_slots bts
    WHERE bts.user_id = professional_id
      AND bts.date = booking_date
      AND (
        (booking_start_time >= bts.start_time AND booking_start_time < bts.end_time)
        OR (booking_end_time > bts.start_time AND booking_end_time <= bts.end_time)
        OR (booking_start_time <= bts.start_time AND booking_end_time >= bts.end_time)
      )
  ) INTO is_blocked;
  
  RETURN is_in_availability AND NOT is_blocked;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically block slots when bookings are accepted
CREATE OR REPLACE FUNCTION block_slot_on_booking_accept()
RETURNS TRIGGER AS $$
BEGIN
  -- If booking status changed to 'accepted', block the time slot
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    INSERT INTO blocked_time_slots (user_id, booking_id, date, start_time, end_time, reason)
    VALUES (NEW.professional_id, NEW.id, NEW.date, NEW.start_time::text, NEW.end_time::text, 'booking')
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- If booking status changed from 'accepted' to something else, unblock the slot
  IF OLD.status = 'accepted' AND NEW.status != 'accepted' THEN
    DELETE FROM blocked_time_slots 
    WHERE booking_id = NEW.id AND user_id = NEW.professional_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic slot blocking
DROP TRIGGER IF EXISTS trigger_block_slot_on_booking_accept ON bookings;
CREATE TRIGGER trigger_block_slot_on_booking_accept
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION block_slot_on_booking_accept();

-- Update function for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for professional_availability updated_at
DROP TRIGGER IF EXISTS update_professional_availability_updated_at ON professional_availability;
CREATE TRIGGER update_professional_availability_updated_at
  BEFORE UPDATE ON professional_availability
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();