export interface ProfessionalAvailability {
  id: string;
  userId: string;
  dayOfWeek: number; // 0 = Domingo, 1 = Lunes, etc.
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BlockedTimeSlot {
  id: string;
  userId: string;
  bookingId?: string;
  date: Date;
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  reason: 'booking' | 'personal' | 'maintenance';
  createdAt: Date;
}

export interface AvailableSlot {
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  duration: number; // hours
}

export interface AvailabilityRequest {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface BlockSlotRequest {
  date: Date;
  startTime: string;
  endTime: string;
  reason?: 'personal' | 'maintenance';
}

export const DAYS_OF_WEEK = [
  'Domingo',
  'Lunes', 
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado'
];