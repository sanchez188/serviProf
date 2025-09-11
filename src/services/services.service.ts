import { Injectable, signal } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';
import { supabase } from '../lib/supabase';
import { Service, CreateServiceRequest, UpdateServiceRequest, PriceType } from '../models/service.model';
import { ServiceCategory } from '../models/professional.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ServicesService {
  private userServicesSignal = signal<Service[]>([]);
  private allServicesSignal = signal<Service[]>([]);
  private isLoadingSignal = signal(false);

  userServices = this.userServicesSignal.asReadonly();
  allServices = this.allServicesSignal.asReadonly();
  isLoading = this.isLoadingSignal.asReadonly();

  constructor(private authService: AuthService) {}

  // Obtener todos los servicios activos
  getAllServices(categoryId?: string, location?: string): Observable<Service[]> {
    this.isLoadingSignal.set(true);
    
    let query = supabase
      .from('services')
      .select(`
        *,
        user:profiles!services_user_id_fkey (
          id,
          name,
          avatar,
          email
        ),
        category:categories!services_category_id_fkey (
          id,
          name,
          icon,
          color
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    if (location) {
      query = query.ilike('location', `%${location}%`);
    }

    return from(query).pipe(
      map(({ data, error }) => {
        if (error) {
          throw error;
        }
        return (data || []).map(service => this.mapToService(service));
      }),
      tap((services) => {
        this.allServicesSignal.set(services);
        this.isLoadingSignal.set(false);
      }),
      catchError((error) => {
        this.isLoadingSignal.set(false);
        return throwError(() => new Error(error.message || 'Error loading services'));
      })
    );
  }

  // Obtener servicios del usuario actual
  getUserServices(): Observable<Service[]> {
    this.isLoadingSignal.set(true);
    const currentUser = this.authService.currentUser();

    if (!currentUser) {
      return from([]);
    }

    return from(
      supabase
        .from('services')
        .select(`
          *,
          user:profiles!services_user_id_fkey (
            id,
            name,
            avatar,
            email
          ),
          category:categories!services_category_id_fkey (
            id,
            name,
            icon,
            color
          )
        `)
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw error;
        }
        return (data || []).map(service => this.mapToService(service));
      }),
      tap((services) => {
        this.userServicesSignal.set(services);
        this.isLoadingSignal.set(false);
      }),
      catchError((error) => {
        this.isLoadingSignal.set(false);
        return throwError(() => new Error(error.message || 'Error loading user services'));
      })
    );
  }

  // Obtener un servicio por ID
  getServiceById(id: string): Observable<Service | null> {
    this.isLoadingSignal.set(true);
    
    return from(
      supabase
        .from('services')
        .select(`
          *,
          user:profiles!services_user_id_fkey (
            id,
            name,
            avatar,
            email
          ),
          category:categories!services_category_id_fkey (
            id,
            name,
            icon,
            color
          )
        `)
        .eq('id', id)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          if (error.code === 'PGRST116') {
            return null;
          }
          throw error;
        }
        return data ? this.mapToService(data) : null;
      }),
      tap(() => this.isLoadingSignal.set(false)),
      catchError((error) => {
        this.isLoadingSignal.set(false);
        return throwError(() => new Error(error.message || 'Error loading service'));
      })
    );
  }

  // Crear un nuevo servicio
  createService(serviceData: CreateServiceRequest): Observable<Service> {
    this.isLoadingSignal.set(true);
    const currentUser = this.authService.currentUser();

    if (!currentUser) {
      return throwError(() => new Error('Usuario no autenticado'));
    }

    const newService = {
      user_id: currentUser.id,
      category_id: serviceData.categoryId,
      title: serviceData.title,
      description: serviceData.description,
      price_type: serviceData.priceType,
      price: serviceData.price,
      hourly_rate: serviceData.hourlyRate,
      location: serviceData.location,
      images: serviceData.images || [],
      tags: serviceData.tags || [],
      availability_schedule: serviceData.availabilitySchedule || {},
      is_active: true
    };

    return from(
      supabase
        .from('services')
        .insert(newService)
        .select(`
          *,
          user:profiles!services_user_id_fkey (
            id,
            name,
            avatar,
            email
          ),
          category:categories!services_category_id_fkey (
            id,
            name,
            icon,
            color
          )
        `)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw error;
        }
        return this.mapToService(data);
      }),
      tap(() => {
        this.getUserServices().subscribe(); // Recargar servicios del usuario
        this.isLoadingSignal.set(false);
      }),
      catchError((error) => {
        this.isLoadingSignal.set(false);
        return throwError(() => new Error(error.message || 'Error creating service'));
      })
    );
  }

  // Actualizar un servicio
  updateService(serviceId: string, updateData: UpdateServiceRequest): Observable<Service> {
    this.isLoadingSignal.set(true);

    const updatePayload: any = {};
    
    if (updateData.categoryId !== undefined) updatePayload.category_id = updateData.categoryId;
    if (updateData.title !== undefined) updatePayload.title = updateData.title;
    if (updateData.description !== undefined) updatePayload.description = updateData.description;
    if (updateData.priceType !== undefined) updatePayload.price_type = updateData.priceType;
    if (updateData.price !== undefined) updatePayload.price = updateData.price;
    if (updateData.hourlyRate !== undefined) updatePayload.hourly_rate = updateData.hourlyRate;
    if (updateData.location !== undefined) updatePayload.location = updateData.location;
    if (updateData.images !== undefined) updatePayload.images = updateData.images;
    if (updateData.tags !== undefined) updatePayload.tags = updateData.tags;
    if (updateData.availabilitySchedule !== undefined) updatePayload.availability_schedule = updateData.availabilitySchedule;
    if (updateData.isActive !== undefined) updatePayload.is_active = updateData.isActive;

    return from(
      supabase
        .from('services')
        .update(updatePayload)
        .eq('id', serviceId)
        .select(`
          *,
          user:profiles!services_user_id_fkey (
            id,
            name,
            avatar,
            email
          ),
          category:categories!services_category_id_fkey (
            id,
            name,
            icon,
            color
          )
        `)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw error;
        }
        return this.mapToService(data);
      }),
      tap(() => {
        this.getUserServices().subscribe(); // Recargar servicios del usuario
        this.isLoadingSignal.set(false);
      }),
      catchError((error) => {
        this.isLoadingSignal.set(false);
        return throwError(() => new Error(error.message || 'Error updating service'));
      })
    );
  }

  // Eliminar un servicio
  deleteService(serviceId: string): Observable<void> {
    this.isLoadingSignal.set(true);

    return from(
      supabase
        .from('services')
        .delete()
        .eq('id', serviceId)
    ).pipe(
      map(({ error }) => {
        if (error) {
          throw error;
        }
      }),
      tap(() => {
        this.getUserServices().subscribe(); // Recargar servicios del usuario
        this.isLoadingSignal.set(false);
      }),
      catchError((error) => {
        this.isLoadingSignal.set(false);
        return throwError(() => new Error(error.message || 'Error deleting service'));
      })
    );
  }

  // Buscar servicios
  searchServices(query: string): Observable<Service[]> {
    this.isLoadingSignal.set(true);
    
    return from(
      supabase
        .from('services')
        .select(`
          *,
          user:profiles!services_user_id_fkey (
            id,
            name,
            avatar,
            email
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
        .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw error;
        }
        return (data || []).map(service => this.mapToService(service));
      }),
      tap((services) => {
        this.allServicesSignal.set(services);
        this.isLoadingSignal.set(false);
      }),
      catchError((error) => {
        this.isLoadingSignal.set(false);
        return throwError(() => new Error(error.message || 'Error searching services'));
      })
    );
  }

  private mapToService(data: any): Service {
    return {
      id: data.id,
      userId: data.user_id,
      categoryId: data.category_id,
      title: data.title,
      description: data.description,
      priceType: data.price_type as PriceType,
      price: data.price,
      hourlyRate: data.hourly_rate,
      location: data.location,
      isActive: data.is_active,
      images: data.images || [],
      tags: data.tags || [],
      availabilitySchedule: data.availability_schedule || {},
      rating: data.rating || 0,
      reviewCount: data.review_count || 0,
      totalOrders: data.total_orders || 0,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      user: data.user ? {
        id: data.user.id,
        name: data.user.name,
        avatar: data.user.avatar,
        email: data.user.email
      } : undefined,
      category: data.category ? {
        id: data.category.id,
        name: data.category.name,
        icon: data.category.icon,
        color: data.category.color
      } : undefined
    };
  }
}