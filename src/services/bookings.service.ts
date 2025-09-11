import { Injectable, signal } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';
import { supabase } from '../lib/supabase';
import { Booking, BookingRequest, BookingStatus } from '../models/booking.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class BookingsService {
  private bookingsSignal = signal<Booking[]>([]);
  private isLoadingSignal = signal(false);

  bookings = this.bookingsSignal.asReadonly();
  isLoading = this.isLoadingSignal.asReadonly();

  constructor(private authService: AuthService) {
    this.loadUserBookings();
  }

  createBooking(request: BookingRequest): Observable<Booking> {
    this.isLoadingSignal.set(true);
    const currentUser = this.authService.currentUser();

    if (!currentUser) {
      return throwError(() => new Error('Usuario no autenticado'));
    }

    const endTime = this.calculateEndTime(request.startTime, request.hours);

    return from(
      supabase
        .from('services')
        .select('hourly_rate, price, price_type')
        .eq('id', request.professionalId)
        .single()
    ).pipe(
      switchMap(({ data: service, error }) => {
        if (error || !service) {
          throw new Error('Servicio no encontrado');
        }

        let totalPrice = 0;
        if (service.price_type === 'hourly' && service.hourly_rate) {
          totalPrice = service.hourly_rate * request.hours;
        } else if (service.price_type === 'fixed' && service.price) {
          totalPrice = service.price;
        }

        return from(
          supabase
            .from('bookings')
            .insert({
              user_id: currentUser.id,
              service_id: request.professionalId,
              date: request.date.toISOString().split('T')[0],
              start_time: request.startTime,
              end_time: endTime,
              hours: request.hours,
              total_price: totalPrice,
              status: 'pending',
              description: request.description
            })
            .select(`
              *,
              profiles!bookings_user_id_fkey (
                name,
                avatar,
                phone
              ),
              services (
                title,
                user_id,
                profiles!services_user_id_fkey (
                  name,
                  avatar
                ),
                categories (
                  name
                )
              )
            `)
            .single()
        );
      }),
      map(({ data, error }) => {
        if (error) {
          throw error;
        }
        return this.mapToBooking(data);
      }),
      tap(() => {
        this.loadUserBookings();
        this.isLoadingSignal.set(false);
      }),
      catchError((error) => {
        this.isLoadingSignal.set(false);
        return throwError(() => new Error(error.message || 'Error creating booking'));
      })
    );
  }

  getUserBookings(): Observable<Booking[]> {
    this.isLoadingSignal.set(true);
    const currentUser = this.authService.currentUser();

    if (!currentUser) {
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
          professionals (
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
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw error;
        }
        return (data || []).map(booking => this.mapToBooking(booking));
      }),
      tap((bookings) => {
        this.bookingsSignal.set(bookings);
        this.isLoadingSignal.set(false);
      }),
      catchError((error) => {
        this.isLoadingSignal.set(false);
        return throwError(() => new Error(error.message || 'Error loading bookings'));
      })
    );
  }

  completeBooking(bookingId: string): Observable<Booking> {
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
          professionals (
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
        this.loadUserBookings();
        this.isLoadingSignal.set(false);
      }),
      catchError((error) => {
        this.isLoadingSignal.set(false);
        return throwError(() => new Error(error.message || 'Error completing booking'));
      })
    );
  }

  addReview(bookingId: string, rating: number, comment: string): Observable<Booking> {
    this.isLoadingSignal.set(true);
    const currentUser = this.authService.currentUser();

    if (!currentUser) {
      return throwError(() => new Error('Usuario no autenticado'));
    }

    return from(
      supabase
        .from('bookings')
        .select('professional_id')
        .eq('id', bookingId)
        .single()
    ).pipe(
      switchMap(({ data: booking, error }) => {
        if (error || !booking) {
          throw new Error('Booking not found');
        }

        return from(
          supabase
            .from('reviews')
            .insert({
              booking_id: bookingId,
              user_id: currentUser.id,
              professional_id: booking.professional_id,
              rating,
              comment,
              service_type: 'Servicio'
            })
            .select()
            .single()
        );
      }),
      switchMap(({ data: review, error }) => {
        if (error) {
          throw error;
        }

        return from(
          supabase
            .from('bookings')
            .update({ review_id: review.id })
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
              professionals (
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
            .single()
        );
      }),
      map(({ data, error }) => {
        if (error) {
          throw error;
        }
        return this.mapToBooking(data);
      }),
      tap(() => {
        this.loadUserBookings();
        this.isLoadingSignal.set(false);
      }),
      catchError((error) => {
        this.isLoadingSignal.set(false);
        return throwError(() => new Error(error.message || 'Error adding review'));
      })
    );
  }

  private loadUserBookings(): void {
    const currentUser = this.authService.currentUser();
    if (currentUser) {
      this.getUserBookings().subscribe();
    }
  }

  private calculateEndTime(startTime: string, hours: number): string {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(startHour, startMinute, 0, 0);

    const endDate = new Date(startDate.getTime() + hours * 60 * 60 * 1000);

    return `${endDate.getHours().toString().padStart(2, '0')}:${endDate
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
  }

  private mapToBooking(data: any): Booking {
    return {
      id: data.id,
      userId: data.user_id,
      professionalId: data.professional_id,
      client: {
        name: data.client?.name || 'Cliente',
        avatar: data.client?.avatar || '',
        phone: data.client?.phone
      },
      professional: {
        name: data.professional?.name || 'Profesional',
        avatar: data.professional?.avatar || '',
        category: data.professionals?.categories?.name || 'Servicio'
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