/*
  # Migración Completa del Sistema ServiPro

  1. Tablas Principales
    - `profiles` - Perfiles de usuarios
    - `categories` - Categorías de servicios
    - `services` - Servicios ofrecidos por usuarios
    - `bookings` - Reservas/contrataciones de servicios
    - `reviews` - Reseñas y calificaciones

  2. Seguridad
    - Habilitar RLS en todas las tablas
    - Políticas de acceso apropiadas para cada tabla
    - Trigger automático para crear perfiles

  3. Datos Iniciales
    - Categorías predefinidas de servicios
    - Configuración inicial del sistema
*/

-- Crear tabla de perfiles de usuarios
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  name text,
  user_type text DEFAULT 'client',
  phone text,
  address text,
  avatar text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Crear tabla de categorías de servicios
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icon text DEFAULT 'wrench',
  color text DEFAULT '#3B82F6',
  description text,
  created_at timestamptz DEFAULT now()
);

-- Crear tabla de servicios
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  title text NOT NULL,
  description text NOT NULL,
  price_type text NOT NULL CHECK (price_type IN ('fixed', 'hourly', 'negotiable')),
  price decimal(10,2),
  hourly_rate decimal(10,2),
  location text NOT NULL,
  images text[] DEFAULT '{}',
  tags text[] DEFAULT '{}',
  availability_schedule jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  rating decimal(3,2) DEFAULT 0,
  review_count integer DEFAULT 0,
  total_orders integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Crear tabla de reservas/bookings
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  professional_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  hours integer NOT NULL,
  total_price decimal(10,2) NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  description text,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  accepted_at timestamptz,
  rejected_at timestamptz,
  rejection_reason text,
  review_id uuid
);

-- Crear tabla de reseñas
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  professional_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  service_type text,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can read other profiles" ON profiles
  FOR SELECT USING (true);

-- Políticas para categories (lectura pública)
CREATE POLICY "Anyone can read categories" ON categories
  FOR SELECT USING (true);

-- Políticas para services
CREATE POLICY "Anyone can read active services" ON services
  FOR SELECT USING (is_active = true OR auth.uid() = user_id);

CREATE POLICY "Users can create their own services" ON services
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own services" ON services
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own services" ON services
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para bookings
CREATE POLICY "Users can read their own bookings" ON bookings
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = professional_id);

CREATE POLICY "Users can create bookings" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Professionals can update bookings" ON bookings
  FOR UPDATE USING (auth.uid() = professional_id OR auth.uid() = user_id);

-- Políticas para reviews
CREATE POLICY "Anyone can read reviews" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create reviews for their bookings" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON reviews
  FOR UPDATE USING (auth.uid() = user_id);

-- Función para crear perfil automáticamente
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil automáticamente
DROP TRIGGER IF EXISTS create_profile_trigger ON auth.users;
CREATE TRIGGER create_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_profile_for_user();

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para actualizar estadísticas de servicios
CREATE OR REPLACE FUNCTION update_service_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar rating y review_count del servicio
  UPDATE services 
  SET 
    rating = (
      SELECT COALESCE(AVG(rating::decimal), 0)
      FROM reviews 
      WHERE service_id = NEW.service_id
    ),
    review_count = (
      SELECT COUNT(*)
      FROM reviews 
      WHERE service_id = NEW.service_id
    )
  WHERE id = NEW.service_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para actualizar estadísticas cuando se crea una reseña
CREATE TRIGGER update_service_stats_trigger
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_service_stats();

-- Función para actualizar total_orders cuando se completa un booking
CREATE OR REPLACE FUNCTION update_service_orders()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo actualizar si el status cambió a 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE services 
    SET total_orders = total_orders + 1
    WHERE id = NEW.service_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para actualizar órdenes completadas
CREATE TRIGGER update_service_orders_trigger
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_service_orders();

-- Insertar categorías predefinidas
INSERT INTO categories (name, icon, color, description) VALUES
  ('Plomería', 'wrench', '#3B82F6', 'Reparación e instalación de tuberías, grifos y sistemas de agua'),
  ('Electricidad', 'zap', '#F59E0B', 'Instalaciones eléctricas, reparaciones y mantenimiento'),
  ('Jardinería', 'flower', '#10B981', 'Cuidado de jardines, poda y paisajismo'),
  ('Limpieza', 'sparkles', '#8B5CF6', 'Servicios de limpieza para hogar y oficina'),
  ('Carpintería', 'hammer', '#EF4444', 'Trabajos en madera, muebles y reparaciones'),
  ('Pintura', 'palette', '#F97316', 'Pintura interior y exterior, decoración')
ON CONFLICT DO NOTHING;

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_services_user_id ON services(user_id);
CREATE INDEX IF NOT EXISTS idx_services_category_id ON services(category_id);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON services(is_active);
CREATE INDEX IF NOT EXISTS idx_services_location ON services USING gin(to_tsvector('spanish', location));
CREATE INDEX IF NOT EXISTS idx_services_title_description ON services USING gin(to_tsvector('spanish', title || ' ' || description));

CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_professional_id ON bookings(professional_id);
CREATE INDEX IF NOT EXISTS idx_bookings_service_id ON bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);

CREATE INDEX IF NOT EXISTS idx_reviews_service_id ON reviews(service_id);
CREATE INDEX IF NOT EXISTS idx_reviews_professional_id ON reviews(professional_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);