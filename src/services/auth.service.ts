import { Injectable, signal } from '@angular/core';
import { Observable, of, throwError, delay, tap } from 'rxjs';
import { User, LoginCredentials, RegisterData, UserType } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSignal = signal<User | null>(null);
  private isLoadingSignal = signal(false);

  // Mock users database
  private mockUsers: (User & { password: string })[] = [
    {
      id: '1',
      email: 'user@test.com',
      password: 'password',
      name: 'Usuario de Prueba',
      userType: UserType.CLIENT,
      phone: '+1234567890',
      address: 'Calle Principal 123',
      avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
      createdAt: new Date('2024-01-01')
    },
    {
      id: '2',
      email: 'professional@test.com',
      password: 'password',
      name: 'Carlos Rodríguez',
      userType: UserType.PROFESSIONAL,
      phone: '+1234567891',
      address: 'Calle Secundaria 456',
      avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
      createdAt: new Date('2024-01-01'),
      professionalProfile: {
        categoryId: '1',
        hourlyRate: 25,
        description: 'Plomero profesional con más de 10 años de experiencia. Especializado en reparaciones de emergencia y instalaciones nuevas.',
        skills: ['Reparación de tuberías', 'Instalación de grifos', 'Destapado de drenajes', 'Calentadores de agua'],
        experience: 10,
        location: 'Ciudad de México',
        availability: [
          { dayOfWeek: 1, startTime: '08:00', endTime: '18:00', isAvailable: true },
          { dayOfWeek: 2, startTime: '08:00', endTime: '18:00', isAvailable: true },
          { dayOfWeek: 3, startTime: '08:00', endTime: '18:00', isAvailable: true },
          { dayOfWeek: 4, startTime: '08:00', endTime: '18:00', isAvailable: true },
          { dayOfWeek: 5, startTime: '08:00', endTime: '16:00', isAvailable: true },
          { dayOfWeek: 6, startTime: '09:00', endTime: '14:00', isAvailable: true },
          { dayOfWeek: 0, startTime: '09:00', endTime: '14:00', isAvailable: false }
        ],
        isVerified: true,
        rating: 4.8,
        reviewCount: 127,
        completedJobs: 89
      }
    }
  ];

  currentUser = this.currentUserSignal.asReadonly();
  isLoading = this.isLoadingSignal.asReadonly();
  isAuthenticated = signal(false);

  constructor() {
    this.loadUserFromStorage();
  }

  login(credentials: LoginCredentials): Observable<User> {
    this.isLoadingSignal.set(true);
    
    const user = this.mockUsers.find(u => 
      u.email === credentials.email && u.password === credentials.password
    );

    if (user) {
      const { password, ...userWithoutPassword } = user;
      return of(userWithoutPassword).pipe(
        delay(1000),
        tap(user => {
          this.currentUserSignal.set(user);
          this.isAuthenticated.set(true);
          this.saveUserToStorage(user);
          this.isLoadingSignal.set(false);
        })
      );
    } else {
      return throwError(() => new Error('Credenciales inválidas')).pipe(
        delay(1000),
        tap(() => this.isLoadingSignal.set(false))
      );
    }
  }

  register(data: RegisterData): Observable<User> {
    this.isLoadingSignal.set(true);
    
    const existingUser = this.mockUsers.find(u => u.email === data.email);
    if (existingUser) {
      return throwError(() => new Error('El email ya está registrado')).pipe(
        delay(1000),
        tap(() => this.isLoadingSignal.set(false))
      );
    }

    const newUser: User & { password: string } = {
      id: Date.now().toString(),
      email: data.email,
      password: data.password,
      name: data.name,
      phone: data.phone,
      createdAt: new Date(),
      avatar: `https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1`
    };

    this.mockUsers.push(newUser);
    const { password, ...userWithoutPassword } = newUser;

    return of(userWithoutPassword).pipe(
      delay(1000),
      tap(user => {
        this.currentUserSignal.set(user);
        this.isAuthenticated.set(true);
        this.saveUserToStorage(user);
        this.isLoadingSignal.set(false);
      })
    );
  }

  logout(): void {
    this.currentUserSignal.set(null);
    this.isAuthenticated.set(false);
    localStorage.removeItem('servipro_user');
  }

  updateProfile(userData: Partial<User>): Observable<User> {
    this.isLoadingSignal.set(true);
    const currentUser = this.currentUserSignal();
    
    if (!currentUser) {
      return throwError(() => new Error('Usuario no autenticado'));
    }

    const updatedUser = { ...currentUser, ...userData };
    
    return of(updatedUser).pipe(
      delay(500),
      tap(user => {
        this.currentUserSignal.set(user);
        this.saveUserToStorage(user);
        this.isLoadingSignal.set(false);
        
        // Update in mock database
        const userIndex = this.mockUsers.findIndex(u => u.id === user.id);
        if (userIndex !== -1) {
          this.mockUsers[userIndex] = { ...this.mockUsers[userIndex], ...userData };
        }
      })
    );
  }

  private loadUserFromStorage(): void {
    const userData = localStorage.getItem('servipro_user');
    if (userData) {
      const user = JSON.parse(userData);
      this.currentUserSignal.set(user);
      this.isAuthenticated.set(true);
    }
  }

  private saveUserToStorage(user: User): void {
    localStorage.setItem('servipro_user', JSON.stringify(user));
  }
}