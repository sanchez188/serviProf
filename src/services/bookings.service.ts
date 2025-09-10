import { Injectable, signal } from '@angular/core';
import { Observable, of, delay, tap, throwError, switchMap } from 'rxjs';
import {
  Booking,
  BookingRequest,
  BookingStatus,
} from '../models/booking.model';
import { AuthService } from './auth.service';
import { ProfessionalsService } from './professionals.service';

@Injectable({
  providedIn: 'root',
})
export class BookingsService {
  private bookingsSignal = signal<Booking[]>([]);
  private isLoadingSignal = signal(false);

  bookings = this.bookingsSignal.asReadonly();
  isLoading = this.isLoadingSignal.asReadonly();

  private mockBookings: Booking[] = [
    {
      id: '1',
      userId: '1',
      professionalId: '1',
      client: {
        name: 'Usuario de Prueba',
        avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
        phone: '+1234567890'
      },
      professional: {
        name: 'Carlos Rodríguez',
        avatar:
          'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
        category: 'Plomería',
      },
      date: new Date('2024-01-25'),
      startTime: '10:00',
      endTime: '12:00',
      hours: 2,
      totalPrice: 50,
      status: BookingStatus.ACCEPTED,
      description: 'Reparación de tubería en cocina',
      createdAt: new Date('2024-01-20'),
      acceptedAt: new Date('2024-01-21'),
    },
    {
      id: '2',
      userId: '1',
      professionalId: '3',
      client: {
        name: 'Usuario de Prueba',
        avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
        phone: '+1234567890'
      },
      professional: {
        name: 'Luis Hernández',
        avatar:
          'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
        category: 'Jardinería',
      },
      date: new Date('2024-01-15'),
      startTime: '08:00',
      endTime: '12:00',
      hours: 4,
      totalPrice: 80,
      status: BookingStatus.COMPLETED,
      description: 'Mantenimiento de jardín trasero',
      createdAt: new Date('2024-01-10'),
      completedAt: new Date('2024-01-15'),
      review: {
        rating: 5,
        comment: 'Excelente trabajo, muy profesional',
        date: new Date('2024-01-15'),
      },
    },
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
  ];

  constructor(
    private authService: AuthService,
    private professionalsService: ProfessionalsService
  ) {
    this.loadUserBookings();
  }

  createBooking(request: BookingRequest): Observable<Booking> {
    this.isLoadingSignal.set(true);
    const currentUser = this.authService.currentUser();

    if (!currentUser) {
      return throwError(() => new Error('Usuario no autenticado'));
    }

    return this.professionalsService
      .getProfessionalById(request.professionalId)
      .pipe(
        delay(1000),
        // Use switchMap to transform the professional into a Booking observable
        switchMap((professional) => {
          if (!professional) {
            return throwError(() => new Error('Profesional no encontrado'));
          }

          const endTime = this.calculateEndTime(
            request.startTime,
            request.hours
          );
          const newBooking: Booking = {
            id: Date.now().toString(),
            userId: currentUser.id,
            professionalId: request.professionalId,
            client: {
              name: currentUser.name,
              avatar: currentUser.avatar ?? '',
              phone: currentUser.phone
            },
            professional: {
              name: professional.name,
              avatar: professional.avatar,
              category: professional.category.name,
            },
            date: request.date,
            startTime: request.startTime,
            endTime,
            hours: request.hours,
            totalPrice: professional.hourlyRate * request.hours,
            status: BookingStatus.CONFIRMED,
            description: request.description,
            createdAt: new Date(),
          };

          this.mockBookings.push(newBooking);
          this.loadUserBookings();
          this.isLoadingSignal.set(false);

          return of(newBooking);
        })
      );
  }

  getUserBookings(): Observable<Booking[]> {
    this.isLoadingSignal.set(true);
    const currentUser = this.authService.currentUser();

    if (!currentUser) {
      return of([]);
    }

    const userBookings = this.mockBookings.filter(
      (b) => b.userId === currentUser.id
    );

    return of(userBookings).pipe(
      delay(500),
      tap((bookings) => {
        this.bookingsSignal.set(bookings);
        this.isLoadingSignal.set(false);
      })
    );
  }

  completeBooking(bookingId: string): Observable<Booking> {
    this.isLoadingSignal.set(true);
    const booking = this.mockBookings.find((b) => b.id === bookingId);

    if (!booking) {
      return throwError(() => new Error('Reserva no encontrada'));
    }

    booking.status = BookingStatus.COMPLETED;
    booking.completedAt = new Date();

    return of(booking).pipe(
      delay(500),
      tap(() => {
        this.loadUserBookings();
        this.isLoadingSignal.set(false);
      })
    );
  }

  addReview(
    bookingId: string,
    rating: number,
    comment: string
  ): Observable<Booking> {
    this.isLoadingSignal.set(true);
    const booking = this.mockBookings.find((b) => b.id === bookingId);

    if (!booking) {
      return throwError(() => new Error('Reserva no encontrada'));
    }

    booking.review = {
      rating,
      comment,
      date: new Date(),
    };

    return of(booking).pipe(
      delay(500),
      tap(() => {
        this.loadUserBookings();
        this.isLoadingSignal.set(false);
      })
    );
  }

  private loadUserBookings(): void {
    const currentUser = this.authService.currentUser();
    if (currentUser) {
      const userBookings = this.mockBookings.filter(
        (b) => b.userId === currentUser.id
      );
      this.bookingsSignal.set(userBookings);
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
}
