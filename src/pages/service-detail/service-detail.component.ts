import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ServicesService } from '../../services/services.service';
import { Service } from '../../models/service.model';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { StarRatingComponent } from '../../components/star-rating/star-rating.component';

@Component({
  selector: 'app-service-detail',
  standalone: true,
  imports: [
    CommonModule,
    LoadingSpinnerComponent,
    StarRatingComponent
  ],
  template: `
    <div class="service-detail-page">
      <div class="container">
        @if (servicesService.isLoading()) {
          <app-loading-spinner></app-loading-spinner>
        } @else if (service) {
          <div class="service-detail">
            <div class="service-header">
              <div class="service-images">
                @if (service.images && service.images.length > 0) {
                  <img 
                    [src]="service.images[0]" 
                    [alt]="service.title"
                    class="main-image"
                  >
                } @else {
                  <div class="image-placeholder">
                    <span class="service-icon">🔧</span>
                  </div>
                }
              </div>

              <div class="service-info">
                <h1>{{ service.title }}</h1>
                <div class="service-meta">
                  <span class="category">{{ service.category?.name }}</span>
                  <span class="location">📍 {{ service.location }}</span>
                </div>
                
                <div class="rating-section">
                  <app-star-rating [rating]="service.rating" [showCount]="true" [count]="service.reviewCount"></app-star-rating>
                </div>

                <div class="price-section">
                  <span class="price">{{ getFormattedPrice(service) }}</span>
                </div>

                <div class="provider-info">
                  <img 
                    [src]="service.provider.avatar" 
                    [alt]="service.provider.name"
                    class="provider-avatar"
                  >
                  <div>
                    <h3>{{ service.provider.name }}</h3>
                    <p>{{ service.totalOrders }} servicios completados</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="service-content">
              <div class="description-section">
                <h2>Descripción del Servicio</h2>
                <p>{{ service.description }}</p>
              </div>

              @if (service.tags && service.tags.length > 0) {
                <div class="tags-section">
                  <h3>Etiquetas</h3>
                  <div class="tags">
                    @for (tag of service.tags; track tag) {
                      <span class="tag">{{ tag }}</span>
                    }
                  </div>
                </div>
              }

              <div class="actions-section">
                <button class="btn btn-primary" (click)="contactProvider()">
                  Contactar Proveedor
                </button>
                <button class="btn btn-outline" (click)="goBack()">
                  Volver
                </button>
              </div>
            </div>
          </div>
        } @else {
          <div class="not-found">
            <h2>Servicio no encontrado</h2>
            <p>El servicio que buscas no existe o ha sido eliminado.</p>
            <button class="btn btn-primary" (click)="goBack()">
              Volver a Servicios
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .service-detail-page {
      min-height: 100vh;
      background: #f9fafb;
      padding: 2rem 0;
    }

    .container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 0 1rem;
    }

    .service-detail {
      background: white;
      border-radius: 1rem;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }

    .service-header {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      padding: 2rem;
    }

    .service-images {
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .main-image {
      width: 100%;
      max-width: 400px;
      height: 300px;
      object-fit: cover;
      border-radius: 0.5rem;
    }

    .image-placeholder {
      width: 100%;
      max-width: 400px;
      height: 300px;
      background: #f3f4f6;
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .service-icon {
      font-size: 4rem;
    }

    .service-info h1 {
      font-size: 2rem;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 1rem;
    }

    .service-meta {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .category {
      background: #dbeafe;
      color: #1e40af;
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .location {
      color: #6b7280;
      font-size: 0.875rem;
    }

    .rating-section {
      margin-bottom: 1.5rem;
    }

    .price-section {
      margin-bottom: 2rem;
    }

    .price {
      font-size: 2rem;
      font-weight: bold;
      color: #059669;
    }

    .provider-info {
      display: flex;
      gap: 1rem;
      align-items: center;
      padding: 1rem;
      background: #f9fafb;
      border-radius: 0.5rem;
    }

    .provider-avatar {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      object-fit: cover;
    }

    .provider-info h3 {
      margin: 0 0 0.25rem 0;
      color: #1f2937;
    }

    .provider-info p {
      margin: 0;
      color: #6b7280;
      font-size: 0.875rem;
    }

    .service-content {
      padding: 2rem;
      border-top: 1px solid #e5e7eb;
    }

    .description-section h2 {
      color: #1f2937;
      margin-bottom: 1rem;
    }

    .description-section p {
      color: #374151;
      line-height: 1.6;
      margin-bottom: 2rem;
    }

    .tags-section h3 {
      color: #1f2937;
      margin-bottom: 1rem;
    }

    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 2rem;
    }

    .tag {
      background: #f3f4f6;
      color: #374151;
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.875rem;
    }

    .actions-section {
      display: flex;
      gap: 1rem;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover {
      background: #2563eb;
    }

    .btn-outline {
      background: transparent;
      color: #3b82f6;
      border: 2px solid #3b82f6;
    }

    .btn-outline:hover {
      background: #3b82f6;
      color: white;
    }

    .not-found {
      text-align: center;
      padding: 4rem 2rem;
    }

    .not-found h2 {
      color: #1f2937;
      margin-bottom: 1rem;
    }

    .not-found p {
      color: #6b7280;
      margin-bottom: 2rem;
    }

    @media (max-width: 768px) {
      .service-header {
        grid-template-columns: 1fr;
      }

      .actions-section {
        flex-direction: column;
      }
    }
  `]
})
export class ServiceDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  servicesService = inject(ServicesService);

  service: Service | null = null;

  ngOnInit(): void {
    const serviceId = this.route.snapshot.paramMap.get('id');
    if (serviceId) {
      this.loadService(serviceId);
    }
  }

  private loadService(id: string): void {
    this.servicesService.getServiceById(id).subscribe({
      next: (service) => {
        this.service = service;
      },
      error: (error) => {
        console.error('Error loading service:', error);
      }
    });
  }

  getFormattedPrice(service: Service): string {
    if (service.priceType === 'fixed') {
      return `$${service.price}`;
    } else if (service.priceType === 'hourly') {
      return `$${service.hourlyRate}/hora`;
    } else {
      return 'Negociable';
    }
  }

  contactProvider(): void {
    // TODO: Implement contact functionality
    console.log('Contact provider:', this.service?.provider);
  }

  goBack(): void {
    this.router.navigate(['/services']);
  }
}