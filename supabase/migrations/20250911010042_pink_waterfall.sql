/*
  # Sistema de Servicios - ServiPro

  1. Nuevas Tablas
    - `services` - Servicios que ofrecen los usuarios
    - Actualización de `profiles` para auto-creación
    - Políticas RLS para seguridad

  2. Funcionalidades
    - Los usuarios pueden crear servicios
    - Elegir de categorías predefinidas
    - Gestionar precios y descripciones
    - Ver servicios ofrecidos y contratados

  3. Seguridad
    - RLS habilitado en todas las tablas
    - Políticas para CRUD operations
    - Usuarios solo pueden editar sus propios servicios
*/

-- Función para crear perfil automáticamente cuando se registra un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, user_type, avatar, created_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'client',
    COALESCE(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture',
      'https://ui-avatars.com/api/?name=' || encode(COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), 'escape') || '&background=3b82f6&color=ffffff&size=150&rounded=true&bold=true'
    ),
    now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil automáticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Crear tabla de servicios
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text NOT NULL,
  price_type text CHECK (price_type IN ('fixed', 'hourly', 'negotiable')) DEFAULT 'fixed',
  price numeric(10,2),
  hourly_rate numeric(10,2),
  location text NOT NULL,
  is_active boolean DEFAULT true,
  images text[] DEFAULT '{}',
  tags text[] DEFAULT '{}',
  availability_schedule jsonb DEFAULT '{}',
  rating numeric(3,2) DEFAULT 0,
  review_count integer DEFAULT 0,
  total_orders integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS en services
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Políticas para services
CREATE POLICY "Users can view active services"
  ON services
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Users can view their own services"
  ON services
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own services"
  ON services
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own services"
  ON services
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own services"
  ON services
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Actualizar tabla de bookings para referenciar services
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS service_id uuid REFERENCES services(id) ON DELETE SET NULL;

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at en services
DROP TRIGGER IF EXISTS update_services_updated_at ON services;
CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insertar categorías por defecto si no existen
INSERT INTO categories (name, icon, color) VALUES
  ('Plomería', 'wrench', '#3B82F6'),
  ('Electricidad', 'zap', '#F59E0B'),
  ('Jardinería', 'flower', '#10B981'),
  ('Limpieza', 'sparkles', '#8B5CF6'),
  ('Carpintería', 'hammer', '#EF4444'),
  ('Pintura', 'palette', '#EC4899')
ON CONFLICT (name) DO NOTHING;

-- Crear índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_services_user_id ON services(user_id);
CREATE INDEX IF NOT EXISTS idx_services_category_id ON services(category_id);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(is_active);
CREATE INDEX IF NOT EXISTS idx_services_location ON services(location);
CREATE INDEX IF NOT EXISTS idx_bookings_service_id ON bookings(service_id);