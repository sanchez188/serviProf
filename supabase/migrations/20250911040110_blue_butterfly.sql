/*
  # Sistema de Disponibilidad y Calendario para Profesionales

  1. Nuevas Tablas
    - `professional_availability` - Horarios disponibles por día de la semana
    - `blocked_time_slots` - Espacios de tiempo bloqueados por reservas
    
  2. Modificaciones
    - Actualizar tabla `bookings` para incluir referencia a slot bloqueado
    
  3. Funciones
    - Función para verificar disponibilidad
    - Función para bloquear/desbloquear slots automáticamente
    
  4. Triggers
    - Auto-bloqueo cuando se acepta una reserva
    - Auto-desbloqueo cuando se cancela/rechaza una reserva
*/

-- Tabla de disponibilidad general del profesional (horarios por día de semana)
CREATE TABLE IF NOT EXISTS professional_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Domingo, 6=Sábado
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, day_of_week)
);

-- Tabla de slots de tiempo bloqueados (reservas específicas)
CREATE TABLE IF NOT EXISTS blocked_time_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  reason text DEFAULT 'booking', -- 'booking', 'personal', 'maintenance'
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date, start_time, end_time)
);

-- Agregar columna a bookings para referenciar el slot bloqueado
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'blocked_slot_id'
  ) THEN
    ALTER TABLE bookings ADD COLUMN blocked_slot_id uuid REFERENCES blocked_time_slots(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_professional_availability_user_day ON professional_availability(user_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_blocked_slots_user_date ON blocked_time_slots(user_id, date);
CREATE INDEX IF NOT EXISTS idx_blocked_slots_booking ON blocked_time_slots(booking_id);

-- Habilitar RLS
ALTER TABLE professional_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_time_slots ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para professional_availability
CREATE POLICY "Users can read all availability"
  ON professional_availability
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can manage own availability"
  ON professional_availability
  FOR ALL
  TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para blocked_time_slots
CREATE POLICY "Users can read all blocked slots"
  ON blocked_time_slots
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can manage own blocked slots"
  ON blocked_time_slots
  FOR ALL
  TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Función para verificar disponibilidad
CREATE OR REPLACE FUNCTION check_availability(
  professional_id uuid,
  booking_date date,
  booking_start_time time,
  booking_end_time time
) RETURNS boolean AS $$
DECLARE
  day_of_week_num integer;
  availability_exists boolean := false;
  slot_blocked boolean := false;
BEGIN
  -- Obtener día de la semana (0=Domingo)
  day_of_week_num := EXTRACT(DOW FROM booking_date);
  
  -- Verificar si el profesional tiene disponibilidad general ese día
  SELECT EXISTS(
    SELECT 1 FROM professional_availability 
    WHERE user_id = professional_id 
    AND day_of_week = day_of_week_num
    AND is_available = true
    AND start_time <= booking_start_time
    AND end_time >= booking_end_time
  ) INTO availability_exists;
  
  -- Si no hay disponibilidad general, retornar false
  IF NOT availability_exists THEN
    RETURN false;
  END IF;
  
  -- Verificar si hay slots bloqueados que se solapen
  SELECT EXISTS(
    SELECT 1 FROM blocked_time_slots
    WHERE user_id = professional_id
    AND date = booking_date
    AND (
      (start_time <= booking_start_time AND end_time > booking_start_time) OR
      (start_time < booking_end_time AND end_time >= booking_end_time) OR
      (start_time >= booking_start_time AND end_time <= booking_end_time)
    )
  ) INTO slot_blocked;
  
  -- Retornar true solo si hay disponibilidad y no hay bloqueos
  RETURN availability_exists AND NOT slot_blocked;
END;
$$ LANGUAGE plpgsql;

-- Función para bloquear slot automáticamente
CREATE OR REPLACE FUNCTION auto_block_time_slot() RETURNS trigger AS $$
DECLARE
  slot_id uuid;
BEGIN
  -- Solo bloquear cuando el booking es aceptado
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    -- Crear slot bloqueado
    INSERT INTO blocked_time_slots (user_id, booking_id, date, start_time, end_time, reason)
    VALUES (NEW.professional_id, NEW.id, NEW.date, NEW.start_time, NEW.end_time, 'booking')
    RETURNING id INTO slot_id;
    
    -- Actualizar booking con referencia al slot
    UPDATE bookings SET blocked_slot_id = slot_id WHERE id = NEW.id;
  END IF;
  
  -- Desbloquear slot si el booking es rechazado o cancelado
  IF NEW.status IN ('rejected', 'cancelled') AND OLD.blocked_slot_id IS NOT NULL THEN
    DELETE FROM blocked_time_slots WHERE id = OLD.blocked_slot_id;
    UPDATE bookings SET blocked_slot_id = NULL WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para auto-bloqueo/desbloqueo
DROP TRIGGER IF EXISTS auto_block_slot_trigger ON bookings;
CREATE TRIGGER auto_block_slot_trigger
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION auto_block_time_slot();

-- Función para obtener slots disponibles de un profesional en una fecha
CREATE OR REPLACE FUNCTION get_available_slots(
  professional_id uuid,
  booking_date date,
  slot_duration_hours integer DEFAULT 1
) RETURNS TABLE(
  start_time time,
  end_time time
) AS $$
DECLARE
  day_of_week_num integer;
  general_start time;
  general_end time;
  current_time time;
  slot_end time;
BEGIN
  -- Obtener día de la semana
  day_of_week_num := EXTRACT(DOW FROM booking_date);
  
  -- Obtener horario general del profesional para ese día
  SELECT pa.start_time, pa.end_time
  INTO general_start, general_end
  FROM professional_availability pa
  WHERE pa.user_id = professional_id 
  AND pa.day_of_week = day_of_week_num
  AND pa.is_available = true;
  
  -- Si no hay disponibilidad general, no retornar nada
  IF general_start IS NULL THEN
    RETURN;
  END IF;
  
  -- Generar slots de tiempo disponibles
  current_time := general_start;
  
  WHILE current_time < general_end LOOP
    slot_end := current_time + (slot_duration_hours || ' hours')::interval;
    
    -- Verificar que el slot no exceda el horario general
    IF slot_end <= general_end THEN
      -- Verificar que no esté bloqueado
      IF check_availability(professional_id, booking_date, current_time, slot_end::time) THEN
        start_time := current_time;
        end_time := slot_end::time;
        RETURN NEXT;
      END IF;
    END IF;
    
    -- Avanzar al siguiente slot (cada hora)
    current_time := current_time + '1 hour'::interval;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;