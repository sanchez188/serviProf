import { Injectable, signal } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { supabase } from '../lib/supabase';
import { ServiceCategory } from '../models/professional.model';
import { Service } from '../models/service.model';

@Injectable({
  providedIn: 'root'
})
export class ProfessionalsService {
  private professionalsSignal = signal<Service[]>([]);
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

  getProfessionals(categoryId?: string): Observable<Service[]> {
    this.isLoadingSignal.set(true);
    
    let query = supabase
      .from('services')
      .select(`
        *,
        user:profiles!services_user_id_fkey (
          id,
          name,
          email,
          avatar
        ),
        category:categories!services_category_id_fkey (
          id,
          name,
          icon,
          color
        )
      `)
      .eq('is_active', true);

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    return from(query).pipe(
      map(({ data, error }) => {
        if (error) {
          throw error;
        }
        
        return (data || []).map(service => this.mapToService(service));
      }),
      tap((professionals) => {
        this.professionalsSignal.set(professionals);
        this.isLoadingSignal.set(false);
      }),
      catchError((error) => {
        this.isLoadingSignal.set(false);
        return throwError(() => new Error(error.message || 'Error loading services'));
      })
    );
  }

  getProfessionalById(id: string): Observable<Service | undefined> {
    this.isLoadingSignal.set(true);
    
    return from(
      supabase
        .from('services')
        .select(`
          *,
          user:profiles!services_user_id_fkey (
            id,
            name,
            email,
            avatar
          ),
          category:categories!services_category_id_fkey (
            id,
            name,
            icon,
            color
          ),
          reviews!reviews_service_id_fkey (
            id,
            rating,
            comment,
            created_at,
            user:profiles!reviews_user_id_fkey (
              name,
              avatar
            )
          )
        `)
        .eq('id', id)
        .eq('is_active', true)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          if (error.code === 'PGRST116') {
            return undefined;
          }
          throw error;
        }
        
        return data ? this.mapToService(data) : undefined;
      }),
      tap(() => this.isLoadingSignal.set(false)),
      catchError((error) => {
        this.isLoadingSignal.set(false);
        return throwError(() => new Error(error.message || 'Error loading service'));
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

  searchProfessionals(query: string): Observable<Service[]> {
    this.isLoadingSignal.set(true);
    
    return from(
      supabase
        .from('services')
        .select(`
          *,
          user:profiles!services_user_id_fkey (
            id,
            name,
            email,
            avatar
          ),
          category:categories!services_category_id_fkey (
            id,
            name,
            icon,
            color
          )
        `)
        .eq('is_active', true)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%,location.ilike.%${query}%`)
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw error;
        }
        
        return (data || []).map(service => this.mapToService(service));
      }),
      tap((professionals) => {
        this.professionalsSignal.set(professionals);
        this.isLoadingSignal.set(false);
      }),
      catchError((error) => {
        this.isLoadingSignal.set(false);
        return throwError(() => new Error(error.message || 'Error searching services'));
      })
    );
  }

  private mapToService(data: any): Service {
    const service: Service = {
      id: data.id,
      userId: data.user_id,
      categoryId: data.category_id,
      title: data.title,
      description: data.description,
      priceType: data.price_type,
      price: data.price,
      hourlyRate: data.hourly_rate,
      location: data.location,
      isActive: data.is_active,
      images: data.images || [],
      tags: data.tags || [],
      availabilitySchedule: data.availability_schedule || {},
      rating: data.rating || 0,
      reviewCount: data.review_count || 0,
      review_count: data.review_count || 0,
      totalOrders: data.total_orders || 0,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      user: data.user ? {
        id: data.user.id,
        name: data.user.name,
        avatar: data.user.avatar || 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
        email: data.user.email
      } : undefined,
      category: data.category ? {
        id: data.category.id,
        name: data.category.name,
        icon: data.category.icon || 'wrench',
        color: data.category.color || '#3B82F6'
      } : undefined
    };

    if (data.reviews) {
      service.reviews = data.reviews.map((review: any) => ({
        id: review.id,
        userId: review.user_id,
        serviceId: review.service_id,
        bookingId: review.booking_id,
        rating: review.rating,
        comment: review.comment,
        date: new Date(review.created_at),
        user: {
          name: review.user?.name || 'Usuario',
          avatar: review.user?.avatar || ''
        }
      }));
    }

    return service;
  }
}