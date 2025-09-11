import { Injectable, signal } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { supabase } from '../lib/supabase';
import { 
  ProfessionalAvailability, 
  BlockedTimeSlot, 
  AvailableSlot, 
  AvailabilityRequest,
  BlockSlotRequest 
} from '../models/availability.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AvailabilityService {
  private availabilitySignal = signal<ProfessionalAvailability[]>([]);
  private blockedSlotsSignal = signal<BlockedTimeSlot[]>([]);
  private isLoadingSignal = signal(false);

  availability = this.availabilitySignal.asReadonly();
  blockedSlots = this.blockedSlotsSignal.asReadonly();
  isLoading = this.isLoadingSignal.asReadonly();

  constructor(private authService: AuthService) {}

  // Obtener disponibilidad general del profesional
  getProfessionalAvailability(userId?: string): Observable<ProfessionalAvailability[]> {
    this.isLoadingSignal.set(true);
    const targetUserId = userId || this.authService.currentUser()?.id;

    if (!targetUserId) {
      return from([]);
    }

    return from(
      supabase
        .from('professional_availability')
        .select('*')
        .eq('user_id', targetUserId)
        .order('day_of_week', { ascending: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw error;
        }
        return (data || []).map(item => this.mapToAvailability(item));
      }),
      tap((availability) => {
        if (!userId) { // Solo actualizar signal si es para el usuario actual
          this.availabilitySignal.set(availability);
        }
        this.isLoadingSignal.set(false);
      }),
      catchError((error) => {
        this.isLoadingSignal.set(false);
        return throwError(() => new Error(error.message || 'Error loading availability'));
      })
    );
  }

  // Actualizar disponibilidad general
  updateAvailability(availability: AvailabilityRequest[]): Observable<ProfessionalAvailability[]> {
    this.isLoadingSignal.set(true);
    const currentUser = this.authService.currentUser();

    if (!currentUser) {
      return throwError(() => new Error('Usuario no autenticado'));
    }

    // Primero eliminar disponibilidad existente
    return from(
      supabase
        .from('professional_availability')
        .delete()
        .eq('user_id', currentUser.id)
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
        return true;
      }),
      // Luego insertar nueva disponibilidad
      map(() => {
        const newAvailability = availability.map(avail => ({
          user_id: currentUser.id,
          day_of_week: avail.dayOfWeek,
          start_time: avail.startTime,
          end_time: avail.endTime,
          is_available: avail.isAvailable
        }));

        return from(
          supabase
            .from('professional_availability')
            .insert(newAvailability)
            .select('*')
        );
      }),
      map(({ data, error }) => {
        if (error) {
          throw error;
        }
        return (data || []).map(item => this.mapToAvailability(item));
      }),
      tap((availability) => {
        this.availabilitySignal.set(availability);
        this.isLoadingSignal.set(false);
      }),
      catchError((error) => {
        this.isLoadingSignal.set(false);
        return throwError(() => new Error(error.message || 'Error updating availability'));
      })
    );
  }

  // Obtener slots disponibles para una fecha específica
  getAvailableSlots(professionalId: string, date: Date, duration: number = 1): Observable<AvailableSlot[]> {
    this.isLoadingSignal.set(true);
    const dateStr = date.toISOString().split('T')[0];

    return from(
      supabase.rpc('get_available_slots', {
        professional_id: professionalId,
        booking_date: dateStr,
        slot_duration_hours: duration
      })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw error;
        }
        return (data || []).map((slot: any) => ({
          startTime: slot.start_time,
          endTime: slot.end_time,
          duration
        }));
      }),
      tap(() => this.isLoadingSignal.set(false)),
      catchError((error) => {
        this.isLoadingSignal.set(false);
        return throwError(() => new Error(error.message || 'Error loading available slots'));
      })
    );
  }

  // Verificar disponibilidad específica
  checkAvailability(
    professionalId: string, 
    date: Date, 
    startTime: string, 
    endTime: string
  ): Observable<boolean> {
    const dateStr = date.toISOString().split('T')[0];

    return from(
      supabase.rpc('check_availability', {
        professional_id: professionalId,
        booking_date: dateStr,
        booking_start_time: startTime,
        booking_end_time: endTime
      })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw error;
        }
        return data === true;
      }),
      catchError((error) => {
        return throwError(() => new Error(error.message || 'Error checking availability'));
      })
    );
  }

  // Obtener slots bloqueados del usuario actual
  getBlockedSlots(): Observable<BlockedTimeSlot[]> {
    this.isLoadingSignal.set(true);
    const currentUser = this.authService.currentUser();

    if (!currentUser) {
      return from([]);
    }

    return from(
      supabase
        .from('blocked_time_slots')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('date', { ascending: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw error;
        }
        return (data || []).map(item => this.mapToBlockedSlot(item));
      }),
      tap((slots) => {
        this.blockedSlotsSignal.set(slots);
        this.isLoadingSignal.set(false);
      }),
      catchError((error) => {
        this.isLoadingSignal.set(false);
        return throwError(() => new Error(error.message || 'Error loading blocked slots'));
      })
    );
  }

  // Bloquear slot manualmente (para tiempo personal, mantenimiento, etc.)
  blockTimeSlot(request: BlockSlotRequest): Observable<BlockedTimeSlot> {
    this.isLoadingSignal.set(true);
    const currentUser = this.authService.currentUser();

    if (!currentUser) {
      return throwError(() => new Error('Usuario no autenticado'));
    }

    const dateStr = request.date.toISOString().split('T')[0];

    return from(
      supabase
        .from('blocked_time_slots')
        .insert({
          user_id: currentUser.id,
          date: dateStr,
          start_time: request.startTime,
          end_time: request.endTime,
          reason: request.reason || 'personal'
        })
        .select('*')
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw error;
        }
        return this.mapToBlockedSlot(data);
      }),
      tap(() => {
        this.getBlockedSlots().subscribe(); // Recargar slots
        this.isLoadingSignal.set(false);
      }),
      catchError((error) => {
        this.isLoadingSignal.set(false);
        return throwError(() => new Error(error.message || 'Error blocking time slot'));
      })
    );
  }

  // Desbloquear slot manual
  unblockTimeSlot(slotId: string): Observable<void> {
    this.isLoadingSignal.set(true);

    return from(
      supabase
        .from('blocked_time_slots')
        .delete()
        .eq('id', slotId)
        .neq('reason', 'booking') // No permitir desbloquear slots de reservas
    ).pipe(
      map(({ error }) => {
        if (error) {
          throw error;
        }
      }),
      tap(() => {
        this.getBlockedSlots().subscribe(); // Recargar slots
        this.isLoadingSignal.set(false);
      }),
      catchError((error) => {
        this.isLoadingSignal.set(false);
        return throwError(() => new Error(error.message || 'Error unblocking time slot'));
      })
    );
  }

  private mapToAvailability(data: any): ProfessionalAvailability {
    return {
      id: data.id,
      userId: data.user_id,
      dayOfWeek: data.day_of_week,
      startTime: data.start_time,
      endTime: data.end_time,
      isAvailable: data.is_available,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  private mapToBlockedSlot(data: any): BlockedTimeSlot {
    return {
      id: data.id,
      userId: data.user_id,
      bookingId: data.booking_id,
      date: new Date(data.date),
      startTime: data.start_time,
      endTime: data.end_time,
      reason: data.reason,
      createdAt: new Date(data.created_at)
    };
  }
}