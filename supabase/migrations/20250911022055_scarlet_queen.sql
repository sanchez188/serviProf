/*
  # Agregar columna client_id a tabla bookings

  1. Cambios en Tabla
    - Agregar columna `client_id` a la tabla `bookings`
    - Actualizar datos existentes para mantener consistencia
    - Agregar índice para optimizar consultas

  2. Notas
    - La columna `client_id` será igual a `user_id` para mantener compatibilidad
    - Se mantiene `user_id` para no romper código existente
*/

-- Agregar la columna client_id a la tabla bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES profiles(id);

-- Actualizar registros existentes para que client_id sea igual a user_id
UPDATE bookings SET client_id = user_id WHERE client_id IS NULL;

-- Crear índice para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON bookings(client_id);

-- Comentario para documentar la columna
COMMENT ON COLUMN bookings.client_id IS 'ID del cliente que realiza la reserva (igual a user_id para compatibilidad)';