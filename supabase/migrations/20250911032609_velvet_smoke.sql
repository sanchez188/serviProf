/*
  # Eliminar restricciones de user_type

  1. Cambios en la base de datos
    - Actualizar todos los usuarios a tipo 'client' por defecto
    - Mantener la columna user_type pero sin restricciones funcionales
  
  2. Cambios funcionales
    - Cualquier usuario puede crear servicios
    - Cualquier usuario puede solicitar servicios
    - Solo restricción: no puede contratarse a sí mismo
*/

-- Actualizar todos los usuarios existentes a 'client' (ya no importa el tipo)
UPDATE profiles SET user_type = 'client' WHERE user_type IS NULL OR user_type = '';

-- La columna user_type se mantiene por compatibilidad pero ya no se usa funcionalmente