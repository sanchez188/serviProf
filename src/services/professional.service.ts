import { Injectable, signal } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';
import { supabase } from '../lib/supabase';
import { Booking, BookingStatus } from '../models/booking.model';
import { AuthService } from './auth.service';
import { UserType } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class ProfessionalService {
  private professionalBookingsSignal = signal<Booking[]>([]);
  private isLoadingSignal = signal(false);

  professionalBookings = this.professionalBookingsSignal.asReadonly();
  isLoading = this.isLoadingSignal.asReadonly();

  constructor(private authService: AuthService) {
  }

  getProfessionalBookings(): Observable<Booking[]> {
    this.isLoadingSignal.set(true);
    const currentUser = this.authService.currentUser();

    if (!currentUser || currentUser.userType !== UserType.PROFESSIONAL) {
      return from([]);
    }

    return from(
      supabase
        .from('bookings')
        .select(`
          *,
          client:profiles!bookings_user_id_fkey (
            name,
            avatar,
            phone
          ),
          professional:profiles!bookings_professional_id_fkey (
            name,
            avatar
          ),
          services!bookings_service_id_fkey (
            title,
            categories (
              name
            )
          ),
          reviews (
            rating,
            comment,
            created_at
          )
        `)
        .eq('professional_id', currentUser.id)
        .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw error;
        }
        return (data || []).map(booking => this.mapToBooking(booking));
      }),
      tap((bookings) => {
        this.professionalBookingsSignal.set(bookings);
        this.isLoadingSignal.set(false);
      }),
      catchError((error) => {
        this.isLoadingSignal.set(false);
        return throwError(() => new Error(error.message || 'Error loading bookings'));
      })
    );
  }

  acceptBooking(bookingId: string): Observable<Booking> {
    this.isLoadingSignal.set(true);
    
    return from(
      supabase
        .from('bookings')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', bookingId)
        .select(`
          *,
          client:profiles!bookings_user_id_fkey (
            name,
            avatar,
            phone
          ),
          professional:profiles!bookings_professional_id_fkey (
            name,
            avatar
          ),
          services!bookings_service_id_fkey (
            categories (
              name
            )
          )
        `)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw error;
        }
        return this.mapToBooking(data);
      }),
      tap(() => {
        this.getProfessionalBookings().subscribe();
        this.isLoadingSignal.set(false);
      }),
      catchError((error) => {
        this.isLoadingSignal.set(false);
        return throwError(() => new Error(error.message || 'Error accepting booking'));
      })
    );
  }

  rejectBooking(bookingId: string, reason: string): Observable<Booking> {
    this.isLoadingSignal.set(true);
    
    return from(
      supabase
        .from('bookings')
        .update({
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          rejection_reason: reason
        })
        .eq('id', bookingId)
        .select(`
          *,
          client:profiles!bookings_user_id_fkey (
            name,
            avatar,
            phone
          ),
          professional:profiles!bookings_professional_id_fkey (
            name,
            avatar
          ),
          services!bookings_service_id_fkey (
            categories (
              name
            )
          )
        `)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw error;
        }
        return this.mapToBooking(data);
      }),
      tap(() => {
        this.getProfessionalBookings().subscribe();
        this.isLoadingSignal.set(false);
      }),
      catchError((error) => {
        this.isLoadingSignal.set(false);
        return throwError(() => new Error(error.message || 'Error rejecting booking'));
      })
    );
  }

  startJob(bookingId: string): Observable<Booking> {
    this.isLoadingSignal.set(true);
    
    return from(
      supabase
        .from('bookings')
        .update({ status: 'in_progress' })
        .eq('id', bookingId)
        .select(`
          *,
          client:profiles!bookings_user_id_fkey (
            name,
            avatar,
            phone
          ),
          professional:profiles!bookings_professional_id_fkey (
            name,
            avatar
          ),
          services!bookings_service_id_fkey (
            categories (
              name
            )
          )
        `)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw error;
        }
        return this.mapToBooking(data);
      }),
      tap(() => {
        this.getProfessionalBookings().subscribe();
        this.isLoadingSignal.set(false);
      }),
      catchError((error) => {
        this.isLoadingSignal.set(false);
        return throwError(() => new Error(error.message || 'Error starting job'));
      })
    );
  }

  completeJob(bookingId: string): Observable<Booking> {
    this.isLoadingSignal.set(true);
    
    return from(
      supabase
        .from('bookings')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', bookingId)
        .select(`
          *,
          client:profiles!bookings_user_id_fkey (
            name,
            avatar,
            phone
          ),
          professional:profiles!bookings_professional_id_fkey (
            name,
            avatar
          ),
          services!bookings_service_id_fkey (
            categories (
              name
            )
          )
        `)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw error;
        }
        return this.mapToBooking(data);
      }),
      tap(() => {
        this.isLoadingSignal.set(false);
      }),
      catchError((error) => {
        this.isLoadingSignal.set(false);
        return throwError(() => new Error(error.message || 'Error completing job'));
      })
    );
  }


  private mapToBooking(data: any): Booking {
    return {
      id: data.id,
      userId: data.user_id,
      professionalId: data.professional_id,
      serviceId: data.service_id,
      client: {
        name: data.client?.name || 'Cliente',
        avatar: data.client?.avatar || '',
        phone: data.client?.phone
      },
      professional: {
        name: data.professional?.name || 'Profesional',
        avatar: data.professional?.avatar || '',
        category: data.services?.categories?.name || 'Servicio',
        serviceTitle: data.services?.title || 'Servicio'
      },
      date: new Date(data.date),
      startTime: data.start_time,
      endTime: data.end_time,
      hours: data.hours,
      totalPrice: data.total_price,
      status: data.status as BookingStatus,
      description: data.description,
      createdAt: new Date(data.created_at),
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      acceptedAt: data.accepted_at ? new Date(data.accepted_at) : undefined,
      rejectedAt: data.rejected_at ? new Date(data.rejected_at) : undefined,
      rejectionReason: data.rejection_reason,
      review: data.reviews ? {
        rating: data.reviews.rating,
        comment: data.reviews.comment,
        date: new Date(data.reviews.created_at)
      } : undefined
    };
  }
}