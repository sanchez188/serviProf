import { Injectable, signal } from '@angular/core';
import { Observable, of, delay, tap, throwError } from 'rxjs';
import { Booking, BookingStatus } from '../models/booking.model';
import { AuthService } from './auth.service';
import { User, UserType } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class ProfessionalService {
  private professionalBookingsSignal = signal<Booking[]>([]);
  private isLoadingSignal = signal(false);

  professionalBookings = this.professionalBookingsSignal.asReadonly();
  isLoading = this.isLoadingSignal.asReadonly();

  // Mock bookings for professionals
  private mockProfessionalBookings: Booking[] = [
    {
      id: '3',
      userId: '3',
      professionalId: '2',
      client: {
        name: 'María González',
        avatar: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
        phone: '+1234567892'
      },
      professional: {
        name: 'Carlos Rodríguez',
        avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
        category: 'Plomería',
      },
      date: new Date('2024-01-28'),
      startTime: '14:00',
      endTime: '16:00',
      hours: 2,
      totalPrice: 50,
      status: BookingStatus.PENDING,
      description: 'Instalación de lavabo nuevo',
      createdAt: new Date('2024-01-26'),
    },
    {
      id: '4',
      userId: '4',
      professionalId: '2',
      client: {
        name: 'Juan Pérez',
        avatar: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
        phone: '+1234567893'
      },
      professional: {
        name: 'Carlos Rodríguez',
        avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
        category: 'Plomería',
      },
      date: new Date('2024-01-30'),
      startTime: '10:00',
      endTime: '13:00',
      hours: 3,
      totalPrice: 75,
      status: BookingStatus.ACCEPTED,
      description: 'Reparación de fuga en baño',
      createdAt: new Date('2024-01-27'),
      acceptedAt: new Date('2024-01-27'),
    },
    {
      id: '5',
      userId: '5',
      professionalId: '2',
      client: {
        name: 'Ana Martínez',
        avatar: 'https://images.pexels.com/photos/1181424/pexels-photo-1181424.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
        phone: '+1234567894'
      },
      professional: {
        name: 'Carlos Rodríguez',
        avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
        category: 'Plomería',
      },
      date: new Date('2024-01-20'),
      startTime: '09:00',
      endTime: '12:00',
      hours: 3,
      totalPrice: 75,
      status: BookingStatus.COMPLETED,
      description: 'Instalación de grifería nueva',
      createdAt: new Date('2024-01-18'),
      acceptedAt: new Date('2024-01-18'),
      completedAt: new Date('2024-01-20'),
      review: {
        rating: 5,
        comment: 'Excelente trabajo, muy profesional y puntual',
        date: new Date('2024-01-20'),
      },
    }
  ];

  constructor(private authService: AuthService) {
    this.loadProfessionalBookings();
  }

  getProfessionalBookings(): Observable<Booking[]> {
    this.isLoadingSignal.set(true);
    const currentUser = this.authService.currentUser();

    if (!currentUser || currentUser.userType !== UserType.PROFESSIONAL) {
      return of([]);
    }

    const professionalBookings = this.mockProfessionalBookings.filter(
      (b) => b.professionalId === currentUser.id
    );

    return of(professionalBookings).pipe(
      delay(500),
      tap((bookings) => {
        this.professionalBookingsSignal.set(bookings);
        this.isLoadingSignal.set(false);
      })
    );
  }

  acceptBooking(bookingId: string): Observable<Booking> {
    this.isLoadingSignal.set(true);
    const booking = this.mockProfessionalBookings.find((b) => b.id === bookingId);

    if (!booking) {
      return throwError(() => new Error('Reserva no encontrada'));
    }

    booking.status = BookingStatus.ACCEPTED;
    booking.acceptedAt = new Date();

    return of(booking).pipe(
      delay(500),
      tap(() => {
        this.loadProfessionalBookings();
        this.isLoadingSignal.set(false);
      })
    );
  }

  rejectBooking(bookingId: string, reason: string): Observable<Booking> {
    this.isLoadingSignal.set(true);
    const booking = this.mockProfessionalBookings.find((b) => b.id === bookingId);

    if (!booking) {
      return throwError(() => new Error('Reserva no encontrada'));
    }

    booking.status = BookingStatus.REJECTED;
    booking.rejectedAt = new Date();
    booking.rejectionReason = reason;

    return of(booking).pipe(
      delay(500),
      tap(() => {
        this.loadProfessionalBookings();
        this.isLoadingSignal.set(false);
      })
    );
  }

  startJob(bookingId: string): Observable<Booking> {
    this.isLoadingSignal.set(true);
    const booking = this.mockProfessionalBookings.find((b) => b.id === bookingId);

    if (!booking) {
      return throwError(() => new Error('Reserva no encontrada'));
    }

    booking.status = BookingStatus.IN_PROGRESS;

    return of(booking).pipe(
      delay(500),
      tap(() => {
        this.loadProfessionalBookings();
        this.isLoadingSignal.set(false);
      })
    );
  }

  completeJob(bookingId: string): Observable<Booking> {
    this.isLoadingSignal.set(true);
    const booking = this.mockProfessionalBookings.find((b) => b.id === bookingId);

    if (!booking) {
      return throwError(() => new Error('Reserva no encontrada'));
    }

    booking.status = BookingStatus.COMPLETED;
    booking.completedAt = new Date();

    return of(booking).pipe(
      delay(500),
      tap(() => {
        this.loadProfessionalBookings();
        this.isLoadingSignal.set(false);
      })
    );
  }

  private loadProfessionalBookings(): void {
    const currentUser = this.authService.currentUser();
    if (currentUser && currentUser.userType === UserType.PROFESSIONAL) {
      const professionalBookings = this.mockProfessionalBookings.filter(
        (b) => b.professionalId === currentUser.id
      );
      this.professionalBookingsSignal.set(professionalBookings);
    }
  }
}