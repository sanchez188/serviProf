@@ .. @@
 CREATE TABLE IF NOT EXISTS categories (
   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
   name text NOT NULL,
   icon text,
   color text DEFAULT '#3B82F6',
-  description text,
   created_at timestamptz DEFAULT now()
 );

@@ .. @@
 -- Insertar categorías predefinidas
-INSERT INTO categories (name, icon, color, description) VALUES
-  ('Plomería', 'wrench', '#3B82F6', 'Reparación e instalación de tuberías, grifos y sistemas de agua'),
-  ('Electricidad', 'zap', '#F59E0B', 'Instalaciones eléctricas, reparaciones y mantenimiento'),
-  ('Jardinería', 'flower', '#10B981', 'Cuidado de jardines, poda y paisajismo'),
-  ('Limpieza', 'sparkles', '#8B5CF6', 'Servicios de limpieza para hogar y oficina'),
-  ('Carpintería', 'hammer', '#EF4444', 'Trabajos en madera, muebles y reparaciones'),
-  ('Pintura', 'palette', '#06B6D4', 'Pintura interior y exterior, decoración');
+INSERT INTO categories (name, icon, color) VALUES
+  ('Plomería', 'wrench', '#3B82F6'),
+  ('Electricidad', 'zap', '#F59E0B'),
+  ('Jardinería', 'flower', '#10B981'),
+  ('Limpieza', 'sparkles', '#8B5CF6'),
+  ('Carpintería', 'hammer', '#EF4444'),
+  ('Pintura', 'palette', '#06B6D4');