import { Injectable, signal } from '@angular/core';
import { Observable, from, throwError, BehaviorSubject, of } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
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
    this.checkSupabaseConnection();
  }

  private async checkSupabaseConnection() {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured - authentication disabled');
      return;
    }

    // Test connection
    const { testSupabaseConnection } = await import('../lib/supabase');
    const connectionTest = await testSupabaseConnection();
    
    if (connectionTest.success) {
      console.log('✅ Supabase connection successful');
      this.initializeAuth();
    } else {
      console.error('❌ Supabase connection failed:', connectionTest.error);
      console.error('Please check:');
      console.error('1. Your Supabase project is active');
      console.error('2. The URL and API key are correct');
      console.error('3. CORS is configured for localhost:4200');
    }
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
      this.isLoadingSignal.set(true);
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      let profileData = profile;

      if (error) {
        // If profile doesn't exist, create it
        if (error.code === 'PGRST116') {
          console.log('Profile not found, creating new profile for user:', user.email);
          
          // Default avatar based on user's name or email
          const defaultAvatar = this.generateDefaultAvatar(
            user.user_metadata?.['full_name'] || 
            user.user_metadata?.['name'] || 
            user.email?.split('@')[0] || 
            'Usuario'
          );
          
          const newProfile = {
            id: user.id,
            email: user.email || '',
            name: user.user_metadata?.['full_name'] || user.user_metadata?.['name'] || user.email?.split('@')[0] || 'Usuario',
            user_type: UserType.CLIENT,
            avatar: user.user_metadata?.['avatar_url'] || user.user_metadata?.['picture'] || defaultAvatar,
            phone: user.user_metadata?.['phone']
          };
          
          const { data: createdProfile, error: createError } = await supabase
            .from('profiles')
            .insert(newProfile)
            .select('*')
            .single();
            
          if (createError) {
            console.error('Error creating profile:', createError);
            // Even if profile creation fails, continue with basic user data
            profileData = {
              id: user.id,
              email: user.email || '',
              name: user.user_metadata?.['full_name'] || user.user_metadata?.['name'] || user.email?.split('@')[0] || 'Usuario',
              user_type: UserType.CLIENT,
              avatar: user.user_metadata?.['avatar_url'] || user.user_metadata?.['picture'] || defaultAvatar,
              phone: user.user_metadata?.['phone'],
              created_at: user.created_at
            };
          } else {
            profileData = createdProfile;
          }
        } else {
          console.error('Error loading profile:', error);
          // Create basic profile data from auth user
          const defaultAvatar = this.generateDefaultAvatar(
            user.user_metadata?.['full_name'] || 
            user.user_metadata?.['name'] || 
            user.email?.split('@')[0] || 
            'Usuario'
          );
          
          profileData = {
            id: user.id,
            email: user.email || '',
            name: user.user_metadata?.['full_name'] || user.user_metadata?.['name'] || user.email?.split('@')[0] || 'Usuario',
            user_type: UserType.CLIENT,
            avatar: user.user_metadata?.['avatar_url'] || user.user_metadata?.['picture'] || defaultAvatar,
            phone: user.user_metadata?.['phone'],
            created_at: user.created_at
          };
        }
      }

      if (profileData) {
        // Ensure we have a default avatar if none exists
        const avatarUrl = profileData.avatar || 
          user.user_metadata?.['avatar_url'] || 
          user.user_metadata?.['picture'] || 
          this.generateDefaultAvatar(profileData.name || user.email?.split('@')[0] || 'Usuario');

        const userProfile: User = {
          id: profileData.id,
          email: user.email || profileData.email || '',
          name: profileData.name || '',
          userType: (profileData.user_type as UserType) || UserType.CLIENT,
          phone: profileData.phone || undefined,
          address: profileData.address || undefined,
          avatar: avatarUrl,
          createdAt: new Date(profileData.created_at || user.created_at)
        };

        this.currentUserSignal.set(userProfile);
        this.isAuthenticated.set(true);
        console.log('✅ Perfil cargado:', {
          name: userProfile.name,
          email: userProfile.email,
          avatar: userProfile.avatar,
          userType: userProfile.userType
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      // Create fallback profile to prevent infinite loading
      const defaultAvatar = this.generateDefaultAvatar(
        user.user_metadata?.['full_name'] || 
        user.user_metadata?.['name'] || 
        user.email?.split('@')[0] || 
        'Usuario'
      );
      
      const fallbackProfile: User = {
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.['full_name'] || user.user_metadata?.['name'] || user.email?.split('@')[0] || 'Usuario',
        userType: UserType.CLIENT,
        phone: user.user_metadata?.['phone'],
        address: undefined,
        avatar: user.user_metadata?.['avatar_url'] || user.user_metadata?.['picture'] || defaultAvatar,
        createdAt: new Date(user.created_at)
      };
      
      this.currentUserSignal.set(fallbackProfile);
      this.isAuthenticated.set(true);
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  login(credentials: LoginCredentials): Observable<User> {
    if (!isSupabaseConfigured()) {
      return throwError(() => new Error('Supabase no está configurado. Por favor configura tu proyecto primero.'));
    }
    
    console.log('🔐 Intentando login con:', credentials.email);
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
        console.log('✅ Login exitoso:', data.user.email);
        
        // Wait for profile to load
        return from(this.loadUserProfile(data.user)).pipe(
          map(() => {
            const currentUser = this.currentUserSignal();
            if (!currentUser) {
              throw new Error('Failed to load user profile');
            }
            return currentUser;
          })
        );
      }),
      tap(() => this.isLoadingSignal.set(false)),
      catchError((error: AuthError) => {
        this.isLoadingSignal.set(false);
        console.error('❌ Error en login:', error);
        return throwError(() => new Error(this.getErrorMessage(error)));
      })
    );
  }

  loginWithGoogle(): Observable<void> {
    if (!isSupabaseConfigured()) {
      return throwError(() => new Error('Supabase no está configurado. Por favor configura tu proyecto primero.'));
    }
    
    this.isLoadingSignal.set(true);
    
    return from(
      supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/professionals`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      })
    ).pipe(
      map(({ error }) => {
        if (error) {
          throw error;
        }
        console.log('🔗 Google OAuth iniciado correctamente');
      }),
      tap(() => this.isLoadingSignal.set(false)),
      catchError((error: AuthError) => {
        this.isLoadingSignal.set(false);
        console.error('❌ Error en Google OAuth:', error);
        return throwError(() => new Error(this.getErrorMessage(error)));
      })
    );
  }

  register(data: RegisterData): Observable<User> {
    if (!isSupabaseConfigured()) {
      return throwError(() => new Error('Supabase no está configurado. Por favor configura tu proyecto primero.'));
    }
    
    this.isLoadingSignal.set(true);
    
    return from(
      supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/professionals`,
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
        
        console.log('📝 Usuario registrado:', authData.user.email);
        
        // If user is immediately confirmed, load profile
        if (authData.session) {
          console.log('✅ Usuario confirmado automáticamente');
          return from(this.loadUserProfile(authData.user)).pipe(
            map(() => this.currentUserSignal()!)
          );
        } else {
          // User needs to confirm email
          console.log('📧 Se requiere confirmación de email');
          throw new Error('Por favor verifica tu email antes de continuar');
        }
      }),
      tap(() => this.isLoadingSignal.set(false)),
      catchError((error: AuthError) => {
        this.isLoadingSignal.set(false);
        console.error('❌ Error en registro:', error);
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
          console.log('🔄 Recargando perfil después de actualización...');
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

  private generateDefaultAvatar(name: string): string {
    // Generate a default avatar URL using a service like DiceBear or UI Avatars
    const cleanName = encodeURIComponent(name.trim());
    return `https://ui-avatars.com/api/?name=${cleanName}&background=3b82f6&color=ffffff&size=150&rounded=true&bold=true`;
  }

  private getErrorMessage(error: AuthError): string {
    console.log('🔍 Error details:', error);
    switch (error.message) {
      case 'Invalid login credentials':
        return 'Credenciales inválidas';
      case 'Email not confirmed':
        return 'Por favor verifica tu email';
      case 'User already registered':
        return 'El email ya está registrado';
      case 'Invalid API key':
        return 'Clave de API inválida - verifica tu configuración de Supabase';
      case 'Database connection failed':
        return 'Error de conexión a la base de datos';
      default:
        return error.message || 'Error de autenticación';
    }
  }
}