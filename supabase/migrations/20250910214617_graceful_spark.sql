/*
  # Esquema completo de ServiPro

  1. Tablas principales
    - `profiles` - Perfiles de usuarios
    - `categories` - Categorías de servicios
    - `professionals` - Información de profesionales
    - `bookings` - Reservas de servicios
    - `reviews` - Reseñas de servicios
    - `availability` - Disponibilidad de profesionales

  2. Seguridad
    - RLS habilitado en todas las tablas
    - Políticas de acceso por usuario
    - Trigger para crear perfiles automáticamente

  3. Datos iniciales
    - Categorías de servicios
    - Profesionales de ejemplo
    - Reservas de ejemplo
    - Reseñas de ejemplo
*/

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Función para manejar nuevos usuarios
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, user_type, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'client'),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para nuevos usuarios
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Tabla de perfiles de usuarios
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  user_type TEXT CHECK (user_type IN ('client', 'professional')) DEFAULT 'client',
  phone TEXT,
  address TEXT,
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de categorías de servicios
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de profesionales
CREATE TABLE IF NOT EXISTS professionals (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id),
  hourly_rate DECIMAL(10,2) NOT NULL,
  description TEXT,
  skills TEXT[],
  experience INTEGER DEFAULT 0,
  location TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  rating DECIMAL(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  completed_jobs INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de disponibilidad de profesionales
CREATE TABLE IF NOT EXISTS availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de reservas
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  professional_id UUID REFERENCES professionals(id),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  hours INTEGER NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected', 'confirmed', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  review_id UUID
);

-- Tabla de reseñas
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id),
  user_id UUID REFERENCES profiles(id),
  professional_id UUID REFERENCES professionals(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  service_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agregar referencia de review en bookings
ALTER TABLE bookings ADD CONSTRAINT fk_booking_review 
FOREIGN KEY (review_id) REFERENCES reviews(id);

-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can read all profiles" ON profiles
  FOR SELECT USING (true);

-- Políticas para categories (público)
CREATE POLICY "Categories are viewable by everyone" ON categories
  FOR SELECT USING (true);

-- Políticas para professionals
CREATE POLICY "Professionals are viewable by everyone" ON professionals
  FOR SELECT USING (true);

CREATE POLICY "Professionals can update own profile" ON professionals
  FOR ALL USING (auth.uid() = id);

-- Políticas para availability
CREATE POLICY "Availability is viewable by everyone" ON availability
  FOR SELECT USING (true);

CREATE POLICY "Professionals can manage own availability" ON availability
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM professionals WHERE id = availability.professional_id
    )
  );

-- Políticas para bookings
CREATE POLICY "Users can view own bookings" ON bookings
  FOR SELECT USING (
    auth.uid() = user_id OR auth.uid() = professional_id
  );

CREATE POLICY "Users can create bookings" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Professionals can update bookings" ON bookings
  FOR UPDATE USING (auth.uid() = professional_id);

-- Políticas para reviews
CREATE POLICY "Reviews are viewable by everyone" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create reviews for their bookings" ON reviews
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM bookings 
      WHERE id = booking_id AND user_id = auth.uid() AND status = 'completed'
    )
  );

-- Insertar categorías de servicios
INSERT INTO categories (name, icon, color) VALUES
  ('Plomería', 'wrench', '#3B82F6'),
  ('Electricidad', 'zap', '#F59E0B'),
  ('Jardinería', 'flower', '#10B981'),
  ('Limpieza', 'sparkles', '#8B5CF6'),
  ('Carpintería', 'hammer', '#EF4444'),
  ('Pintura', 'palette', '#EC4899')
ON CONFLICT DO NOTHING;

-- Insertar perfiles de usuarios de ejemplo
INSERT INTO profiles (id, email, name, user_type, phone, address, avatar) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'juan.perez@email.com', 'Juan Pérez', 'professional', '+52 555 123 4567', 'Ciudad de México', 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1'),
  ('550e8400-e29b-41d4-a716-446655440002', 'maria.garcia@email.com', 'María García', 'professional', '+52 555 234 5678', 'Guadalajara', 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1'),
  ('550e8400-e29b-41d4-a716-446655440003', 'carlos.lopez@email.com', 'Carlos López', 'professional', '+52 555 345 6789', 'Monterrey', 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1'),
  ('550e8400-e29b-41d4-a716-446655440004', 'ana.martinez@email.com', 'Ana Martínez', 'professional', '+52 555 456 7890', 'Puebla', 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1'),
  ('550e8400-e29b-41d4-a716-446655440005', 'luis.rodriguez@email.com', 'Luis Rodríguez', 'professional', '+52 555 567 8901', 'Tijuana', 'https://images.pexels.com/photos/1181424/pexels-photo-1181424.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1'),
  ('550e8400-e29b-41d4-a716-446655440006', 'sofia.hernandez@email.com', 'Sofía Hernández', 'professional', '+52 555 678 9012', 'León', 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1'),
  ('550e8400-e29b-41d4-a716-446655440007', 'cliente1@email.com', 'Roberto Cliente', 'client', '+52 555 111 2222', 'Ciudad de México', 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1'),
  ('550e8400-e29b-41d4-a716-446655440008', 'cliente2@email.com', 'Laura Cliente', 'client', '+52 555 333 4444', 'Guadalajara', 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1')
ON CONFLICT DO NOTHING;

-- Insertar profesionales con datos realistas
INSERT INTO professionals (id, category_id, hourly_rate, description, skills, experience, location, is_verified, rating, review_count, completed_jobs) VALUES
  (
    '550e8400-e29b-41d4-a716-446655440001',
    (SELECT id FROM categories WHERE name = 'Plomería' LIMIT 1),
    350.00,
    'Plomero certificado con más de 10 años de experiencia. Especializado en reparaciones de emergencia, instalaciones nuevas y mantenimiento preventivo. Trabajo con materiales de alta calidad y ofrezco garantía en todos mis servicios.',
    ARRAY['Reparación de tuberías', 'Instalación de sanitarios', 'Destapado de drenajes', 'Calentadores de agua', 'Fugas de agua'],
    10,
    'Ciudad de México',
    true,
    4.8,
    127,
    89
  ),
  (
    '550e8400-e29b-41d4-a716-446655440002',
    (SELECT id FROM categories WHERE name = 'Electricidad' LIMIT 1),
    400.00,
    'Electricista certificada con especialización en instalaciones residenciales y comerciales. Experta en sistemas de iluminación LED, automatización del hogar y paneles solares. Todos mis trabajos cumplen con las normas de seguridad.',
    ARRAY['Instalaciones eléctricas', 'Iluminación LED', 'Automatización', 'Paneles solares', 'Reparación de cortocircuitos'],
    8,
    'Guadalajara',
    true,
    4.9,
    98,
    76
  ),
  (
    '550e8400-e29b-41d4-a716-446655440003',
    (SELECT id FROM categories WHERE name = 'Jardinería' LIMIT 1),
    280.00,
    'Jardinero profesional especializado en diseño de jardines, mantenimiento de áreas verdes y sistemas de riego. Trabajo con plantas nativas y técnicas sustentables para crear espacios verdes hermosos y funcionales.',
    ARRAY['Diseño de jardines', 'Poda de árboles', 'Sistemas de riego', 'Control de plagas', 'Plantas ornamentales'],
    12,
    'Monterrey',
    true,
    4.7,
    156,
    134
  ),
  (
    '550e8400-e29b-41d4-a716-446655440004',
    (SELECT id FROM categories WHERE name = 'Limpieza' LIMIT 1),
    250.00,
    'Servicio profesional de limpieza residencial y comercial. Utilizamos productos ecológicos y técnicas especializadas para diferentes superficies. Ofrecemos limpieza profunda, mantenimiento regular y servicios post-construcción.',
    ARRAY['Limpieza profunda', 'Limpieza de oficinas', 'Limpieza post-construcción', 'Productos ecológicos', 'Desinfección'],
    6,
    'Puebla',
    true,
    4.6,
    203,
    187
  ),
  (
    '550e8400-e29b-41d4-a716-446655440005',
    (SELECT id FROM categories WHERE name = 'Carpintería' LIMIT 1),
    450.00,
    'Carpintero especializado en muebles a medida, reparaciones y restauración. Trabajo con maderas finas y técnicas tradicionales combinadas con herramientas modernas. Cada proyecto es único y personalizado.',
    ARRAY['Muebles a medida', 'Restauración', 'Closets', 'Cocinas integrales', 'Reparación de muebles'],
    15,
    'Tijuana',
    true,
    4.9,
    87,
    72
  ),
  (
    '550e8400-e29b-41d4-a716-446655440006',
    (SELECT id FROM categories WHERE name = 'Pintura' LIMIT 1),
    320.00,
    'Pintora profesional con experiencia en interiores y exteriores. Especializada en técnicas decorativas, texturas y acabados especiales. Uso pinturas de alta calidad y ofrezco asesoría en selección de colores.',
    ARRAY['Pintura de interiores', 'Pintura de exteriores', 'Texturas decorativas', 'Acabados especiales', 'Asesoría en colores'],
    9,
    'León',
    true,
    4.8,
    112,
    95
  )
ON CONFLICT DO NOTHING;

-- Insertar disponibilidad para los profesionales
INSERT INTO availability (professional_id, day_of_week, start_time, end_time, is_available) VALUES
  -- Juan Pérez (Plomero) - Lunes a Viernes
  ('550e8400-e29b-41d4-a716-446655440001', 1, '08:00', '18:00', true),
  ('550e8400-e29b-41d4-a716-446655440001', 2, '08:00', '18:00', true),
  ('550e8400-e29b-41d4-a716-446655440001', 3, '08:00', '18:00', true),
  ('550e8400-e29b-41d4-a716-446655440001', 4, '08:00', '18:00', true),
  ('550e8400-e29b-41d4-a716-446655440001', 5, '08:00', '18:00', true),
  ('550e8400-e29b-41d4-a716-446655440001', 6, '09:00', '14:00', true),
  
  -- María García (Electricista) - Lunes a Sábado
  ('550e8400-e29b-41d4-a716-446655440002', 1, '07:00', '17:00', true),
  ('550e8400-e29b-41d4-a716-446655440002', 2, '07:00', '17:00', true),
  ('550e8400-e29b-41d4-a716-446655440002', 3, '07:00', '17:00', true),
  ('550e8400-e29b-41d4-a716-446655440002', 4, '07:00', '17:00', true),
  ('550e8400-e29b-41d4-a716-446655440002', 5, '07:00', '17:00', true),
  ('550e8400-e29b-41d4-a716-446655440002', 6, '08:00', '15:00', true),
  
  -- Carlos López (Jardinero) - Martes a Domingo
  ('550e8400-e29b-41d4-a716-446655440003', 2, '06:00', '16:00', true),
  ('550e8400-e29b-41d4-a716-446655440003', 3, '06:00', '16:00', true),
  ('550e8400-e29b-41d4-a716-446655440003', 4, '06:00', '16:00', true),
  ('550e8400-e29b-41d4-a716-446655440003', 5, '06:00', '16:00', true),
  ('550e8400-e29b-41d4-a716-446655440003', 6, '06:00', '16:00', true),
  ('550e8400-e29b-41d4-a716-446655440003', 0, '07:00', '15:00', true),
  
  -- Ana Martínez (Limpieza) - Lunes a Sábado
  ('550e8400-e29b-41d4-a716-446655440004', 1, '08:00', '16:00', true),
  ('550e8400-e29b-41d4-a716-446655440004', 2, '08:00', '16:00', true),
  ('550e8400-e29b-41d4-a716-446655440004', 3, '08:00', '16:00', true),
  ('550e8400-e29b-41d4-a716-446655440004', 4, '08:00', '16:00', true),
  ('550e8400-e29b-41d4-a716-446655440004', 5, '08:00', '16:00', true),
  ('550e8400-e29b-41d4-a716-446655440004', 6, '09:00', '14:00', true),
  
  -- Luis Rodríguez (Carpintero) - Lunes a Viernes
  ('550e8400-e29b-41d4-a716-446655440005', 1, '09:00', '18:00', true),
  ('550e8400-e29b-41d4-a716-446655440005', 2, '09:00', '18:00', true),
  ('550e8400-e29b-41d4-a716-446655440005', 3, '09:00', '18:00', true),
  ('550e8400-e29b-41d4-a716-446655440005', 4, '09:00', '18:00', true),
  ('550e8400-e29b-41d4-a716-446655440005', 5, '09:00', '18:00', true),
  
  -- Sofía Hernández (Pintura) - Lunes a Sábado
  ('550e8400-e29b-41d4-a716-446655440006', 1, '08:00', '17:00', true),
  ('550e8400-e29b-41d4-a716-446655440006', 2, '08:00', '17:00', true),
  ('550e8400-e29b-41d4-a716-446655440006', 3, '08:00', '17:00', true),
  ('550e8400-e29b-41d4-a716-446655440006', 4, '08:00', '17:00', true),
  ('550e8400-e29b-41d4-a716-446655440006', 5, '08:00', '17:00', true),
  ('550e8400-e29b-41d4-a716-446655440006', 6, '09:00', '15:00', true)
ON CONFLICT DO NOTHING;

-- Insertar reservas de ejemplo
INSERT INTO bookings (user_id, professional_id, date, start_time, end_time, hours, total_price, status, description, created_at, completed_at, accepted_at) VALUES
  (
    '550e8400-e29b-41d4-a716-446655440007',
    '550e8400-e29b-41d4-a716-446655440001',
    '2024-01-15',
    '10:00',
    '12:00',
    2,
    700.00,
    'completed',
    'Reparación de fuga en tubería de la cocina',
    '2024-01-10 09:00:00',
    '2024-01-15 12:00:00',
    '2024-01-10 15:30:00'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440008',
    '550e8400-e29b-41d4-a716-446655440002',
    '2024-01-20',
    '14:00',
    '17:00',
    3,
    1200.00,
    'completed',
    'Instalación de iluminación LED en sala y comedor',
    '2024-01-18 11:00:00',
    '2024-01-20 17:00:00',
    '2024-01-18 14:20:00'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440007',
    '550e8400-e29b-41d4-a716-446655440003',
    '2024-02-05',
    '08:00',
    '12:00',
    4,
    1120.00,
    'completed',
    'Mantenimiento completo del jardín y poda de árboles',
    '2024-02-01 16:00:00',
    '2024-02-05 12:00:00',
    '2024-02-01 18:45:00'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440008',
    '550e8400-e29b-41d4-a716-446655440004',
    '2024-02-10',
    '09:00',
    '13:00',
    4,
    1000.00,
    'in_progress',
    'Limpieza profunda de casa completa',
    '2024-02-08 10:00:00',
    NULL,
    '2024-02-08 12:30:00'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440007',
    '550e8400-e29b-41d4-a716-446655440005',
    '2024-02-15',
    '10:00',
    '14:00',
    4,
    1800.00,
    'pending',
    'Construcción de librero a medida para estudio',
    '2024-02-12 14:00:00',
    NULL,
    NULL
  )
ON CONFLICT DO NOTHING;

-- Insertar reseñas de ejemplo
INSERT INTO reviews (booking_id, user_id, professional_id, rating, comment, service_type, created_at) VALUES
  (
    (SELECT id FROM bookings WHERE description = 'Reparación de fuga en tubería de la cocina' LIMIT 1),
    '550e8400-e29b-41d4-a716-446655440007',
    '550e8400-e29b-41d4-a716-446655440001',
    5,
    'Excelente trabajo! Juan llegó puntual, identificó rápidamente el problema y lo solucionó de manera eficiente. Muy profesional y limpio en su trabajo. Definitivamente lo recomiendo.',
    'Plomería',
    '2024-01-15 13:00:00'
  ),
  (
    (SELECT id FROM bookings WHERE description = 'Instalación de iluminación LED en sala y comedor' LIMIT 1),
    '550e8400-e29b-41d4-a716-446655440008',
    '550e8400-e29b-41d4-a716-446655440002',
    5,
    'María es una electricista excepcional. La instalación quedó perfecta y me asesoró muy bien sobre las mejores opciones de iluminación. Trabajo impecable y muy profesional.',
    'Electricidad',
    '2024-01-20 18:00:00'
  ),
  (
    (SELECT id FROM bookings WHERE description = 'Mantenimiento completo del jardín y poda de árboles' LIMIT 1),
    '550e8400-e29b-41d4-a716-446655440007',
    '550e8400-e29b-41d4-a716-446655440003',
    4,
    'Carlos hizo un trabajo muy bueno en el jardín. La poda quedó excelente y el jardín se ve hermoso. Solo le doy 4 estrellas porque llegó un poco tarde, pero el resultado final fue muy satisfactorio.',
    'Jardinería',
    '2024-02-05 14:00:00'
  )
ON CONFLICT DO NOTHING;

-- Actualizar review_id en bookings
UPDATE bookings SET review_id = (
  SELECT id FROM reviews WHERE booking_id = bookings.id LIMIT 1
) WHERE status = 'completed' AND EXISTS (
  SELECT 1 FROM reviews WHERE booking_id = bookings.id
);

-- Función para actualizar estadísticas de profesionales
CREATE OR REPLACE FUNCTION update_professional_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar estadísticas cuando se inserta una nueva reseña
  IF TG_OP = 'INSERT' THEN
    UPDATE professionals SET
      rating = (
        SELECT ROUND(AVG(rating)::numeric, 2)
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
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar estadísticas automáticamente
DROP TRIGGER IF EXISTS update_professional_stats_trigger ON reviews;
CREATE TRIGGER update_professional_stats_trigger
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_professional_stats();

-- Función para actualizar trabajos completados
CREATE OR REPLACE FUNCTION update_completed_jobs()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar trabajos completados cuando se completa una reserva
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE professionals SET
      completed_jobs = completed_jobs + 1
    WHERE id = NEW.professional_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar trabajos completados
DROP TRIGGER IF EXISTS update_completed_jobs_trigger ON bookings;
CREATE TRIGGER update_completed_jobs_trigger
  AFTER UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_completed_jobs();

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_professionals_category ON professionals(category_id);
CREATE INDEX IF NOT EXISTS idx_professionals_location ON professionals(location);
CREATE INDEX IF NOT EXISTS idx_professionals_rating ON professionals(rating DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_professional ON bookings(professional_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_reviews_professional ON reviews(professional_id);
CREATE INDEX IF NOT EXISTS idx_availability_professional ON availability(professional_id);

-- Actualizar estadísticas existentes
UPDATE professionals SET
  rating = COALESCE((
    SELECT ROUND(AVG(rating)::numeric, 2)
    FROM reviews 
    WHERE professional_id = professionals.id
  ), 0),
  review_count = COALESCE((
    SELECT COUNT(*)
    FROM reviews 
    WHERE professional_id = professionals.id
  ), 0),
  completed_jobs = COALESCE((
    SELECT COUNT(*)
    FROM bookings 
    WHERE professional_id = professionals.id AND status = 'completed'
  ), 0);