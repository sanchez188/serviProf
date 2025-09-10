import { Injectable, signal } from '@angular/core';
import { Observable, from, throwError, BehaviorSubject, of } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';
import { supabase } from '../lib/supabase';
import { User, LoginCredentials, RegisterData, UserType } from '../models/user.model';
import { AuthError, User as SupabaseUser, Session } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSignal = signal<User | null>(null);
  private isLoadingSignal = signal(false);
  private sessionSubject = new BehaviorSubject<Session | null>(null);

  currentUser = this.currentUserSignal.asReadonly();
  isLoading = this.isLoadingSignal.asReadonly();
  isAuthenticated = signal(false);
  session$ = this.sessionSubject.asObservable();

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth() {
    // Get initial session
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      this.sessionSubject.next(session);
      await this.loadUserProfile(session.user);
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      this.sessionSubject.next(session);
      
      if (session?.user) {
        await this.loadUserProfile(session.user);
        this.isAuthenticated.set(true);
      } else {
        this.currentUserSignal.set(null);
        this.isAuthenticated.set(false);
      }
    });
  }

  private async loadUserProfile(user: SupabaseUser): Promise<void> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        return;
      }

      if (profile) {
        const userProfile: User = {
          id: profile.id,
          email: profile.email || user.email || '',
          name: profile.name || '',
          userType: (profile.user_type as UserType) || UserType.CLIENT,
          phone: profile.phone || undefined,
          address: profile.address || undefined,
          avatar: profile.avatar || undefined,
          createdAt: new Date(profile.created_at || user.created_at)
        };

        // Load professional profile if user is professional
        if (userProfile.userType === UserType.PROFESSIONAL) {
          const { data: professionalData } = await supabase
            .from('professionals')
            .select(`
              *,
              categories (
                id,
                name,
                icon,
                color
              )
            `)
            .eq('id', user.id)
            .single();

          if (professionalData) {
            userProfile.professionalProfile = {
              categoryId: professionalData.category_id || '',
              hourlyRate: professionalData.hourly_rate,
              description: professionalData.description || '',
              skills: professionalData.skills || [],
              experience: professionalData.experience || 0,
              location: professionalData.location || '',
              availability: [], // This would need to be loaded separately if stored
              isVerified: professionalData.is_verified || false,
              rating: professionalData.rating || 0,
              reviewCount: professionalData.review_count || 0,
              completedJobs: professionalData.completed_jobs || 0
            };
          }
        }

        this.currentUserSignal.set(userProfile);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }

  login(credentials: LoginCredentials): Observable<User> {
    this.isLoadingSignal.set(true);
    
    return from(
      supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      })
    ).pipe(
      switchMap(({ data, error }) => {
        if (error) {
          throw error;
        }
        if (!data.user) {
          throw new Error('No user returned from login');
        }
        return from(this.loadUserProfile(data.user)).pipe(
          map(() => this.currentUserSignal()!)
        );
      }),
      tap(() => this.isLoadingSignal.set(false)),
      catchError((error: AuthError) => {
        this.isLoadingSignal.set(false);
        return throwError(() => new Error(this.getErrorMessage(error)));
      })
    );
  }

  loginWithGoogle(): Observable<void> {
    this.isLoadingSignal.set(true);
    
    return from(
      supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/professionals`
        }
      })
    ).pipe(
      map(({ error }) => {
        if (error) {
          throw error;
        }
      }),
      tap(() => this.isLoadingSignal.set(false)),
      catchError((error: AuthError) => {
        this.isLoadingSignal.set(false);
        return throwError(() => new Error(this.getErrorMessage(error)));
      })
    );
  }

  register(data: RegisterData): Observable<User> {
    this.isLoadingSignal.set(true);
    
    return from(
      supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.name,
            user_type: data.userType,
            phone: data.phone
          }
        }
      })
    ).pipe(
      switchMap(({ data: authData, error }) => {
        if (error) {
          throw error;
        }
        if (!authData.user) {
          throw new Error('No user returned from registration');
        }
        
        // If user is immediately confirmed, load profile
        if (authData.session) {
          return from(this.loadUserProfile(authData.user)).pipe(
            map(() => this.currentUserSignal()!)
          );
        } else {
          // User needs to confirm email
          throw new Error('Por favor verifica tu email antes de continuar');
        }
      }),
      tap(() => this.isLoadingSignal.set(false)),
      catchError((error: AuthError) => {
        this.isLoadingSignal.set(false);
        return throwError(() => new Error(this.getErrorMessage(error)));
      })
    );
  }

  logout(): Observable<void> {
    return from(supabase.auth.signOut()).pipe(
      tap(() => {
        this.currentUserSignal.set(null);
        this.isAuthenticated.set(false);
        this.sessionSubject.next(null);
      }),
      map(() => void 0)
    );
  }

  updateProfile(userData: Partial<User>): Observable<User> {
    this.isLoadingSignal.set(true);
    const currentUser = this.currentUserSignal();
    
    if (!currentUser) {
      return throwError(() => new Error('Usuario no autenticado'));
    }

    return from(
      supabase
        .from('profiles')
        .update({
          name: userData.name,
          phone: userData.phone,
          address: userData.address,
          avatar: userData.avatar,
          user_type: userData.userType
        })
        .eq('id', currentUser.id)
        .select()
        .single()
    ).pipe(
      switchMap(({ data, error }) => {
        if (error) {
          throw error;
        }

        // If updating professional profile
        if (userData.professionalProfile && currentUser.userType === UserType.PROFESSIONAL) {
          return from(
            supabase
              .from('professionals')
              .upsert({
                id: currentUser.id,
                category_id: userData.professionalProfile.categoryId,
                hourly_rate: userData.professionalProfile.hourlyRate,
                description: userData.professionalProfile.description,
                skills: userData.professionalProfile.skills,
                experience: userData.professionalProfile.experience,
                location: userData.professionalProfile.location,
                is_verified: userData.professionalProfile.isVerified,
                rating: userData.professionalProfile.rating,
                review_count: userData.professionalProfile.reviewCount,
                completed_jobs: userData.professionalProfile.completedJobs
              })
          ).pipe(
            map(() => data)
          );
        }

        return of(data);
      }),
      switchMap(() => {
        // Reload user profile to get updated data
        const session = this.sessionSubject.value;
        if (session?.user) {
          return from(this.loadUserProfile(session.user)).pipe(
            map(() => this.currentUserSignal()!)
          );
        }
        throw new Error('No session found');
      }),
      tap(() => this.isLoadingSignal.set(false)),
      catchError((error) => {
        this.isLoadingSignal.set(false);
        return throwError(() => new Error(error.message || 'Error updating profile'));
      })
    );
  }

  private getErrorMessage(error: AuthError): string {
    switch (error.message) {
      case 'Invalid login credentials':
        return 'Credenciales inválidas';
      case 'Email not confirmed':
        return 'Por favor verifica tu email';
      case 'User already registered':
        return 'El email ya está registrado';
      default:
        return error.message || 'Error de autenticación';
    }
  }
}