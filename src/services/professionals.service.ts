import { Injectable, signal } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { supabase } from '../lib/supabase';
import { Professional, ServiceCategory } from '../models/professional.model';

@Injectable({
  providedIn: 'root'
})
export class ProfessionalsService {
  private professionalsSignal = signal<Professional[]>([]);
  private categoriesSignal = signal<ServiceCategory[]>([]);
  private isLoadingSignal = signal(false);

  professionals = this.professionalsSignal.asReadonly();
  categories = this.categoriesSignal.asReadonly();
  isLoading = this.isLoadingSignal.asReadonly();

  constructor() {
    this.loadCategories();
  }

  private loadCategories(): void {
    from(supabase.from('categories').select('*')).subscribe({
      next: ({ data, error }) => {
        if (!error && data) {
          const categories: ServiceCategory[] = data.map(cat => ({
            id: cat.id,
            name: cat.name,
            icon: cat.icon || 'wrench',
            color: cat.color || '#3B82F6'
          }));
          this.categoriesSignal.set(categories);
        }
      }
    });
  }

  getProfessionals(categoryId?: string): Observable<Professional[]> {
    this.isLoadingSignal.set(true);
    
    let query = supabase
      .from('professionals')
      .select(`
        *,
        profiles!inner (
          id,
          name,
          email,
          avatar
        ),
        categories (
          id,
          name,
          icon,
          color
        )
      `);

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    return from(query).pipe(
      map(({ data, error }) => {
        if (error) {
          throw error;
        }
        
        return (data || []).map(prof => this.mapToProfessional(prof));
      }),
      tap((professionals) => {
        this.professionalsSignal.set(professionals);
        this.isLoadingSignal.set(false);
      }),
      catchError((error) => {
        this.isLoadingSignal.set(false);
        return throwError(() => new Error(error.message || 'Error loading professionals'));
      })
    );
  }

  getProfessionalById(id: string): Observable<Professional | undefined> {
    this.isLoadingSignal.set(true);
    
    return from(
      supabase
        .from('professionals')
        .select(`
          *,
          profiles!inner (
            id,
            name,
            email,
            avatar
          ),
          categories (
            id,
            name,
            icon,
            color
          ),
          reviews (
            id,
            rating,
            comment,
            service_type,
            created_at,
            profiles!reviews_user_id_fkey (
              name,
              avatar
            )
          )
        `)
        .eq('id', id)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          if (error.code === 'PGRST116') {
            return undefined;
          }
          throw error;
        }
        
        return data ? this.mapToProfessional(data) : undefined;
      }),
      tap(() => this.isLoadingSignal.set(false)),
      catchError((error) => {
        this.isLoadingSignal.set(false);
        return throwError(() => new Error(error.message || 'Error loading professional'));
      })
    );
  }

  getCategories(): Observable<ServiceCategory[]> {
    return from(
      supabase.from('categories').select('*')
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw error;
        }
        
        return (data || []).map(cat => ({
          id: cat.id,
          name: cat.name,
          icon: cat.icon || 'wrench',
          color: cat.color || '#3B82F6'
        }));
      }),
      catchError((error) => {
        return throwError(() => new Error(error.message || 'Error loading categories'));
      })
    );
  }

  searchProfessionals(query: string): Observable<Professional[]> {
    this.isLoadingSignal.set(true);
    
    return from(
      supabase
        .from('professionals')
        .select(`
          *,
          profiles!inner (
            id,
            name,
            email,
            avatar
          ),
          categories (
            id,
            name,
            icon,
            color
          )
        `)
        .or(`profiles.name.ilike.%${query}%,description.ilike.%${query}%,categories.name.ilike.%${query}%`)
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw error;
        }
        
        return (data || []).map(prof => this.mapToProfessional(prof));
      }),
      tap((professionals) => {
        this.professionalsSignal.set(professionals);
        this.isLoadingSignal.set(false);
      }),
      catchError((error) => {
        this.isLoadingSignal.set(false);
        return throwError(() => new Error(error.message || 'Error searching professionals'));
      })
    );
  }

  private mapToProfessional(data: any): Professional {
    return {
      id: data.id,
      name: data.profiles?.name || 'Professional',
      category: {
        id: data.categories?.id || '',
        name: data.categories?.name || 'General',
        icon: data.categories?.icon || 'wrench',
        color: data.categories?.color || '#3B82F6'
      },
      avatar: data.profiles?.avatar || 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
      rating: data.rating || 0,
      reviewCount: data.review_count || 0,
      hourlyRate: data.hourly_rate,
      description: data.description || '',
      skills: data.skills || [],
      availability: [], // This would need to be implemented based on your availability structure
      location: data.location || '',
      experience: data.experience || 0,
      reviews: (data.reviews || []).map((review: any) => ({
        id: review.id,
        userId: review.user_id,
        userName: review.profiles?.name || 'Usuario',
        userAvatar: review.profiles?.avatar,
        rating: review.rating,
        comment: review.comment,
        date: new Date(review.created_at),
        serviceType: review.service_type || 'Servicio'
      })),
      isVerified: data.is_verified || false
    };
  }
}