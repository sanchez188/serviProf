/*
  # Esquema completo de ServiPro

  1. Tablas principales
    - `profiles` - Perfiles de usuarios (clientes y profesionales)
    - `categories` - Categorías de servicios
    - `professionals` - Información detallada de profesionales
    - `availability` - Horarios de disponibilidad
    - `bookings` - Reservas de servicios
    - `reviews` - Reseñas y calificaciones

  2. Seguridad
    - RLS habilitado en todas las tablas
    - Políticas de acceso por usuario
    - Trigger para crear perfiles automáticamente

  3. Datos iniciales
    - 6 categorías de servicios
    - 6 profesionales verificados
    - 2 clientes de ejemplo
    - 5 reservas con diferentes estados
    - 3 reseñas detalladas
*/

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Crear tabla de perfiles de usuarios
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email text,
  name text,
  user_type text CHECK (user_type IN ('client', 'professional')) DEFAULT 'client',
  phone text,
  address text,
  avatar text,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS en profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Crear tabla de categorías
CREATE TABLE IF NOT EXISTS categories (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  icon text DEFAULT 'wrench',
  color text DEFAULT '#3B82F6',
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS en categories (solo lectura pública)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are viewable by everyone"
  ON categories
  FOR SELECT
  TO authenticated
  USING (true);

-- Crear tabla de profesionales
CREATE TABLE IF NOT EXISTS professionals (
  id uuid REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  category_id uuid REFERENCES categories(id),
  hourly_rate numeric NOT NULL,
  description text,
  skills text[] DEFAULT '{}',
  experience integer DEFAULT 0,
  location text,
  is_verified boolean DEFAULT false,
  rating numeric DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  review_count integer DEFAULT 0,
  completed_jobs integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS en professionals
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professionals are viewable by everyone"
  ON professionals
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Professionals can update own profile"
  ON professionals
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Professionals can insert own profile"
  ON professionals
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Crear tabla de disponibilidad
CREATE TABLE IF NOT EXISTS availability (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  professional_id uuid REFERENCES professionals(id) ON DELETE CASCADE,
  day_of_week integer CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS en availability
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Availability is viewable by everyone"
  ON availability
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Professionals can manage own availability"
  ON availability
  FOR ALL
  TO authenticated
  USING (auth.uid() = professional_id);

-- Crear tabla de reservas
CREATE TABLE IF NOT EXISTS bookings (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  professional_id uuid REFERENCES professionals(id) ON DELETE CASCADE,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  hours integer NOT NULL,
  total_price numeric NOT NULL,
  status text CHECK (status IN ('pending', 'accepted', 'rejected', 'confirmed', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
  description text,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  accepted_at timestamptz,
  rejected_at timestamptz,
  rejection_reason text,
  review_id uuid
);

-- Habilitar RLS en bookings
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookings"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = professional_id);

CREATE POLICY "Users can create bookings"
  ON bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Professionals can update bookings"
  ON bookings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = professional_id OR auth.uid() = user_id);

-- Crear tabla de reseñas
CREATE TABLE IF NOT EXISTS reviews (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  professional_id uuid REFERENCES professionals(id) ON DELETE CASCADE,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  comment text,
  service_type text,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS en reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are viewable by everyone"
  ON reviews
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create reviews for their bookings"
  ON reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Función para crear perfil automáticamente
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, email, name, user_type)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'user_type', 'client')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para nuevos usuarios
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Función para actualizar estadísticas de profesionales
CREATE OR REPLACE FUNCTION update_professional_stats()
RETURNS trigger AS $$
BEGIN
  -- Actualizar rating y review_count
  UPDATE professionals 
  SET 
    rating = (
      SELECT COALESCE(AVG(rating::numeric), 0)
      FROM reviews 
      WHERE professional_id = NEW.professional_id
    ),
    review_count = (
      SELECT COUNT(*)
      FROM reviews 
      WHERE professional_id = NEW.professional_id
    )
  WHERE id = NEW.professional_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para actualizar estadísticas cuando se crea una reseña
DROP TRIGGER IF EXISTS on_review_created ON reviews;
CREATE TRIGGER on_review_created
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_professional_stats();

-- Función para actualizar trabajos completados
CREATE OR REPLACE FUNCTION update_completed_jobs()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE professionals 
    SET completed_jobs = completed_jobs + 1
    WHERE id = NEW.professional_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para actualizar trabajos completados
DROP TRIGGER IF EXISTS on_booking_completed ON bookings;
CREATE TRIGGER on_booking_completed
  AFTER UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_completed_jobs();

-- Insertar categorías iniciales
INSERT INTO categories (name, icon, color) VALUES
  ('Plomería', 'wrench', '#3B82F6'),
  ('Electricidad', 'zap', '#F59E0B'),
  ('Jardinería', 'flower', '#10B981'),
  ('Limpieza', 'sparkles', '#8B5CF6'),
  ('Carpintería', 'hammer', '#EF4444'),
  ('Pintura', 'palette', '#F97316')
ON CONFLICT DO NOTHING;

-- Insertar perfiles de ejemplo
INSERT INTO profiles (id, email, name, user_type, phone, avatar) VALUES
  ('11111111-1111-1111-1111-111111111111', 'juan.perez@email.com', 'Juan Pérez', 'professional', '+52 555 0101', 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1'),
  ('22222222-2222-2222-2222-222222222222', 'maria.garcia@email.com', 'María García', 'professional', '+52 555 0202', 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1'),
  ('33333333-3333-3333-3333-333333333333', 'carlos.lopez@email.com', 'Carlos López', 'professional', '+52 555 0303', 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1'),
  ('44444444-4444-4444-4444-444444444444', 'ana.martinez@email.com', 'Ana Martínez', 'professional', '+52 555 0404', 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1'),
  ('55555555-5555-5555-5555-555555555555', 'luis.rodriguez@email.com', 'Luis Rodríguez', 'professional', '+52 555 0505', 'https://images.pexels.com/photos/1181424/pexels-photo-1181424.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1'),
  ('66666666-6666-6666-6666-666666666666', 'sofia.hernandez@email.com', 'Sofía Hernández', 'professional', '+52 555 0606', 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1'),
  ('77777777-7777-7777-7777-777777777777', 'roberto.cliente@email.com', 'Roberto Cliente', 'client', '+52 555 0707', 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1'),
  ('88888888-8888-8888-8888-888888888888', 'laura.cliente@email.com', 'Laura Cliente', 'client', '+52 555 0808', 'https://images.pexels.com/photos/1181519/pexels-photo-1181519.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1')
ON CONFLICT DO NOTHING;

-- Insertar profesionales con datos realistas
INSERT INTO professionals (id, category_id, hourly_rate, description, skills, experience, location, is_verified, rating, review_count, completed_jobs) VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    (SELECT id FROM categories WHERE name = 'Plomería'),
    350,
    'Plomero certificado con más de 8 años de experiencia. Especializado en reparaciones de emergencia, instalaciones nuevas y mantenimiento preventivo. Trabajo con materiales de alta calidad y ofrezco garantía en todos mis servicios.',
    ARRAY['Reparación de tuberías', 'Instalación de sanitarios', 'Destapado de drenajes', 'Calentadores de agua', 'Fugas de agua'],
    8,
    'Ciudad de México, CDMX',
    true,
    4.8,
    127,
    89
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    (SELECT id FROM categories WHERE name = 'Electricidad'),
    400,
    'Electricista profesional con licencia y seguro. Especializada en instalaciones residenciales y comerciales. Manejo sistemas de iluminación LED, automatización del hogar y paneles solares.',
    ARRAY['Instalaciones eléctricas', 'Iluminación LED', 'Automatización', 'Paneles solares', 'Reparación de cortocircuitos'],
    6,
    'Guadalajara, JAL',
    true,
    4.9,
    98,
    76
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    (SELECT id FROM categories WHERE name = 'Jardinería'),
    280,
    'Jardinero paisajista con pasión por crear espacios verdes hermosos y funcionales. Ofrezco servicios de diseño, mantenimiento y cuidado especializado de plantas. Trabajo con técnicas ecológicas y sustentables.',
    ARRAY['Diseño de jardines', 'Poda de árboles', 'Sistemas de riego', 'Control de plagas', 'Mantenimiento de césped'],
    10,
    'Monterrey, NL',
    true,
    4.7,
    156,
    134
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    (SELECT id FROM categories WHERE name = 'Limpieza'),
    250,
    'Servicio de limpieza profesional con productos ecológicos y equipos especializados. Ofrezco limpieza residencial, comercial y post-construcción. Atención al detalle y puntualidad garantizada.',
    ARRAY['Limpieza profunda', 'Limpieza post-construcción', 'Limpieza de oficinas', 'Productos ecológicos', 'Limpieza de alfombras'],
    5,
    'Puebla, PUE',
    true,
    4.6,
    203,
    187
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    (SELECT id FROM categories WHERE name = 'Carpintería'),
    450,
    'Carpintero artesanal especializado en muebles a medida y restauración. Trabajo con maderas nobles y técnicas tradicionales. Cada pieza es única y está hecha con la más alta calidad y atención al detalle.',
    ARRAY['Muebles a medida', 'Restauración de muebles', 'Closets empotrados', 'Puertas de madera', 'Trabajos artesanales'],
    12,
    'Querétaro, QRO',
    true,
    4.9,
    87,
    72
  ),
  (
    '66666666-6666-6666-6666-666666666666',
    (SELECT id FROM categories WHERE name = 'Pintura'),
    320,
    'Pintora profesional especializada en acabados decorativos y técnicas artísticas. Trabajo con pinturas de alta calidad, texturas especiales y diseños personalizados. Transformo espacios con color y creatividad.',
    ARRAY['Pintura decorativa', 'Texturas especiales', 'Murales artísticos', 'Acabados finos', 'Restauración de fachadas'],
    7,
    'Tijuana, BC',
    true,
    4.8,
    112,
    95
  )
ON CONFLICT DO NOTHING;

-- Insertar disponibilidad para los profesionales (Lunes a Viernes, 8:00-18:00)
INSERT INTO availability (professional_id, day_of_week, start_time, end_time, is_available) 
SELECT 
  p.id,
  generate_series(1, 5) as day_of_week,
  '08:00'::time,
  '18:00'::time,
  true
FROM professionals p
ON CONFLICT DO NOTHING;

-- Insertar algunas reservas de ejemplo
INSERT INTO bookings (id, user_id, professional_id, date, start_time, end_time, hours, total_price, status, description, created_at, completed_at) VALUES
  (
    uuid_generate_v4(),
    '77777777-7777-7777-7777-777777777777',
    '11111111-1111-1111-1111-111111111111',
    '2024-01-15',
    '10:00',
    '12:00',
    2,
    700,
    'completed',
    'Reparación de fuga en la cocina',
    '2024-01-10 09:00:00',
    '2024-01-15 12:00:00'
  ),
  (
    uuid_generate_v4(),
    '88888888-8888-8888-8888-888888888888',
    '22222222-2222-2222-2222-222222222222',
    '2024-01-20',
    '14:00',
    '17:00',
    3,
    1200,
    'completed',
    'Instalación de iluminación LED en sala',
    '2024-01-18 11:00:00',
    '2024-01-20 17:00:00'
  ),
  (
    uuid_generate_v4(),
    '77777777-7777-7777-7777-777777777777',
    '33333333-3333-3333-3333-333333333333',
    '2024-02-01',
    '09:00',
    '13:00',
    4,
    1120,
    'completed',
    'Mantenimiento completo del jardín',
    '2024-01-28 10:00:00',
    '2024-02-01 13:00:00'
  ),
  (
    uuid_generate_v4(),
    '88888888-8888-8888-8888-888888888888',
    '44444444-4444-4444-4444-444444444444',
    CURRENT_DATE + INTERVAL '2 days',
    '10:00',
    '14:00',
    4,
    1000,
    'in_progress',
    'Limpieza profunda post-mudanza',
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    NULL
  ),
  (
    uuid_generate_v4(),
    '77777777-7777-7777-7777-777777777777',
    '55555555-5555-5555-5555-555555555555',
    CURRENT_DATE + INTERVAL '5 days',
    '08:00',
    '12:00',
    4,
    1800,
    'pending',
    'Fabricación de librero a medida',
    CURRENT_TIMESTAMP,
    NULL
  )
ON CONFLICT DO NOTHING;

-- Insertar reseñas para las reservas completadas
INSERT INTO reviews (booking_id, user_id, professional_id, rating, comment, service_type, created_at) VALUES
  (
    (SELECT id FROM bookings WHERE professional_id = '11111111-1111-1111-1111-111111111111' AND status = 'completed' LIMIT 1),
    '77777777-7777-7777-7777-777777777777',
    '11111111-1111-1111-1111-111111111111',
    5,
    'Excelente trabajo! Juan llegó puntual, identificó rápidamente el problema y lo solucionó de manera eficiente. Muy profesional y limpio en su trabajo. Definitivamente lo recomiendo y lo volvería a contratar.',
    'Plomería',
    '2024-01-15 14:00:00'
  ),
  (
    (SELECT id FROM bookings WHERE professional_id = '22222222-2222-2222-2222-222222222222' AND status = 'completed' LIMIT 1),
    '88888888-8888-8888-8888-888888888888',
    '22222222-2222-2222-2222-222222222222',
    5,
    'María es una electricista excepcional. La instalación de las luces LED quedó perfecta y me explicó todo el proceso. Muy profesional, puntual y con precios justos. Sin duda la mejor opción para trabajos eléctricos.',
    'Electricidad',
    '2024-01-20 18:00:00'
  ),
  (
    (SELECT id FROM bookings WHERE professional_id = '33333333-3333-3333-3333-333333333333' AND status = 'completed' LIMIT 1),
    '77777777-7777-7777-7777-777777777777',
    '33333333-3333-3333-3333-333333333333',
    4,
    'Carlos hizo un trabajo fantástico en mi jardín. Podó los árboles, arregló el sistema de riego y dejó todo impecable. Es muy conocedor de plantas y me dio excelentes consejos para el cuidado. Muy recomendable.',
    'Jardinería',
    '2024-02-01 15:00:00'
  )
ON CONFLICT DO NOTHING;

-- Actualizar review_id en bookings
UPDATE bookings 
SET review_id = r.id
FROM reviews r
WHERE bookings.id = r.booking_id;

-- Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_professionals_category ON professionals(category_id);
CREATE INDEX IF NOT EXISTS idx_professionals_location ON professionals(location);
CREATE INDEX IF NOT EXISTS idx_professionals_rating ON professionals(rating DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_professional ON bookings(professional_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_reviews_professional ON reviews(professional_id);
CREATE INDEX IF NOT EXISTS idx_availability_professional ON availability(professional_id);