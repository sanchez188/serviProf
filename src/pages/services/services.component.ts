import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ServicesService } from '../../services/services.service';
import { ProfessionalsService } from '../../services/professionals.service';
import { Service, PriceType } from '../../models/service.model';
import { ServiceCategory } from '../../models/professional.model';
import { StarRatingComponent } from '../../components/star-rating/star-rating.component';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    StarRatingComponent,
    LoadingSpinnerComponent,
  ],
  template: `
    <div class="services-page">
      <div class="container">
        <!-- Header -->
        <div class="page-header">
          <h1>Servicios Disponibles</h1>
          <p>Encuentra el servicio perfecto para tus necesidades</p>
        </div>

        <!-- Filters -->
        <div class="filters-section">
          <div class="search-bar">
            <input
              type="text"
              placeholder="Buscar servicios, ubicación o descripción..."
              [(ngModel)]="searchQuery"
              (input)="onSearch()"
              class="search-input"
            >
            <button class="search-btn" (click)="onSearch()">
              🔍
            </button>
          </div>

          <div class="category-filters">
            <button
              class="category-btn"
              [class.active]="selectedCategory === ''"
              (click)="filterByCategory('')"
            >
              Todos
            </button>
            @for (category of categories; track category.id) {
              <button
                class="category-btn"
                [class.active]="selectedCategory === category.id"
                (click)="filterByCategory(category.id)"
                [style.--category-color]="category.color"
              >
                <span class="category-icon">
                  <i [class]="'icon-' + category.icon"></i>
                </span>
                {{ category.name }}
              </button>
            }
          </div>
        </div>

        <!-- Loading -->
        @if (servicesService.isLoading()) {
          <app-loading-spinner></app-loading-spinner>
        }

        <!-- Results -->
        @if (!servicesService.isLoading()) {
          <div class="results-header">
            <h2>{{ filteredServices().length }} servicios encontrados</h2>
          </div>

          <div class="services-grid">
            @for (service of filteredServices(); track service.id) {
              <div class="service-card">
                <div class="card-header">
                  @if (service.images && service.images.length > 0) {
                    <img 
                      [src]="service.images[0]" 
                      [alt]="service.title"
                      class="service-image"
                    >
                  } @else {
                    <div class="service-image-placeholder">
                      <span class="service-icon">🔧</span>
                    </div>
                  }
                  <div class="service-info">
                    <h3>{{ service.title }}</h3>
                    <div class="category-badge" [style.background-color]="service.category?.color">
                      {{ service.category?.name }}
                    </div>
                    <div class="service-provider">
                      <img 
                        [src]="service.user?.avatar || generateDefaultAvatar(service.user?.name || 'Usuario')" 
                        [alt]="service.user?.name"
                        class="provider-avatar"
                      >
                      <span>{{ service.user?.name }}</span>
                    </div>
                  </div>
                </div>

                <div class="card-body">
                  <div class="rating-section">
                    <app-star-rating 
                      [rating]="service.rating" 
                      [count]="service.reviewCount"
                    ></app-star-rating>
                  </div>

                  <p class="description">{{ service.description }}</p>

                  @if (service.tags && service.tags.length > 0) {
                    <div class="tags">
                      @for (tag of service.tags.slice(0, 3); track tag) {
                        <span class="tag">{{ tag }}</span>
                      }
                      @if (service.tags.length > 3) {
                        <span class="tag more">+{{ service.tags.length - 3 }} más</span>
                      }
                    </div>
                  }

                  <div class="service-details">
                    <div class="detail-item">
                      <span class="detail-label">📍 Ubicación:</span>
                      <span>{{ service.location }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">📋 Órdenes:</span>
                      <span>{{ service.totalOrders }} completadas</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">💰 Precio:</span>
                      <span class="price">
                        @if (service.priceType === PriceType.FIXED) {
                          ${{ service.price }}
                        } @else if (service.priceType === PriceType.HOURLY) {
                          ${{ service.hourlyRate }}/hora
                        } @else {
                          Negociable
                        }
                      </span>
                    </div>
                  </div>
                </div>

                <div class="card-footer">
                  <a 
                    [routerLink]="['/service', service.id]"
                    class="btn btn-primary"
                  >
                    Ver Detalles
                  </a>
                </div>
              </div>
            } @empty {
              <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <h3>No se encontraron servicios</h3>
                <p>Intenta ajustar tus filtros de búsqueda</p>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .services-page {
      min-height: 100vh;
      background: #f9fafb;
      padding: 2rem 0;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
    }

    .page-header {
      text-align: center;
      margin-bottom: 3rem;
    }

    .page-header h1 {
      font-size: 2.5rem;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 0.5rem;
    }

    .page-header p {
      font-size: 1.2rem;
      color: #6b7280;
    }

    .filters-section {
      background: white;
      padding: 2rem;
      border-radius: 1rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      margin-bottom: 2rem;
    }

    .search-bar {
      display: flex;
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .search-input {
      flex: 1;
      padding: 0.75rem 1rem;
      border: 2px solid #e5e7eb;
      border-radius: 0.5rem;
      font-size: 1rem;
      transition: border-color 0.2s ease;
    }

    .search-input:focus {
      outline: none;
      border-color: #3b82f6;
    }

    .search-btn {
      padding: 0.75rem 1.5rem;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 0.5rem;
      cursor: pointer;
      font-size: 1.2rem;
      transition: background 0.2s ease;
    }

    .search-btn:hover {
      background: #2563eb;
    }

    .category-filters {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .category-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: #f3f4f6;
      border: 2px solid transparent;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: all 0.2s ease;
      font-weight: 500;
    }

    .category-btn:hover {
      background: #e5e7eb;
    }

    .category-btn.active {
      background: var(--category-color, #3b82f6);
      color: white;
      border-color: var(--category-color, #3b82f6);
    }

    .category-icon {
      font-size: 1.2rem;
    }

    .results-header {
      margin-bottom: 2rem;
    }

    .results-header h2 {
      font-size: 1.5rem;
      font-weight: bold;
      color: #1f2937;
    }

    .services-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 2rem;
    }

    .service-card {
      background: white;
      border-radius: 1rem;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;
    }

    .service-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    }

    .card-header {
      display: flex;
      gap: 1rem;
      padding: 1.5rem;
      border-bottom: 1px solid #f3f4f6;
    }

    .service-image {
      width: 80px;
      height: 80px;
      border-radius: 0.5rem;
      object-fit: cover;
    }

    .service-image-placeholder {
      width: 80px;
      height: 80px;
      background: #f3f4f6;
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .service-icon {
      font-size: 2rem;
    }

    .service-info {
      flex: 1;
    }

    .service-info h3 {
      font-size: 1.25rem;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 0.5rem;
    }

    .category-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      color: white;
      font-size: 0.875rem;
      font-weight: 500;
      margin-bottom: 0.5rem;
    }

    .service-provider {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .provider-avatar {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      object-fit: cover;
    }

    .service-provider span {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .card-body {
      padding: 1.5rem;
    }

    .rating-section {
      margin-bottom: 1rem;
    }

    .description {
      color: #6b7280;
      line-height: 1.6;
      margin-bottom: 1rem;
    }

    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
    }

    .tag {
      padding: 0.25rem 0.75rem;
      background: #f3f4f6;
      border-radius: 1rem;
      font-size: 0.875rem;
      color: #374151;
    }

    .tag.more {
      background: #e5e7eb;
      font-weight: 500;
    }

    .service-details {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .detail-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .detail-label {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .price {
      font-weight: bold;
      color: #059669;
      font-size: 1.1rem;
    }

    .card-footer {
      padding: 1.5rem;
      border-top: 1px solid #f3f4f6;
    }

    .btn {
      display: inline-block;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      text-decoration: none;
      font-weight: 600;
      text-align: center;
      transition: all 0.2s ease;
      width: 100%;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover {
      background: #2563eb;
    }

    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: 4rem 2rem;
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      font-size: 1.5rem;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 0.5rem;
    }

    .empty-state p {
      color: #6b7280;
    }

    /* Icons */
    .icon-wrench::before { content: '🔧'; }
    .icon-zap::before { content: '⚡'; }
    .icon-flower::before { content: '🌸'; }
    .icon-sparkles::before { content: '✨'; }
    .icon-hammer::before { content: '🔨'; }
    .icon-palette::before { content: '🎨'; }

    @media (max-width: 768px) {
      .services-grid {
        grid-template-columns: 1fr;
      }

      .category-filters {
        justify-content: center;
      }

      .search-bar {
        flex-direction: column;
      }
    }
  `]
})
export class ServicesComponent implements OnInit {
  servicesService = inject(ServicesService);
  private professionalsService = inject(ProfessionalsService);
  private route = inject(ActivatedRoute);

  categories: ServiceCategory[] = [];
  filteredServices = signal<Service[]>([]);
  selectedCategory = '';
  searchQuery = '';
  PriceType = PriceType;

  ngOnInit(): void {
    // Load categories
    this.professionalsService.getCategories().subscribe((categories) => {
      this.categories = categories;
    });

    // Check for category filter from route
    this.route.queryParams.subscribe((params) => {
      if (params['category']) {
        this.selectedCategory = params['category'];
        this.filterByCategory(this.selectedCategory);
      } else {
        this.loadServices();
      }
    });
  }

  loadServices(): void {
    this.servicesService.getAllServices().subscribe((services) => {
      this.filteredServices.set(services);
    });
  }

  filterByCategory(categoryId: string): void {
    this.selectedCategory = categoryId;
    this.searchQuery = '';

    if (categoryId) {
      this.servicesService.getAllServices(categoryId).subscribe((services) => {
        this.filteredServices.set(services);
      });
    } else {
      this.loadServices();
    }
  }

  onSearch(): void {
    if (this.searchQuery.trim()) {
      this.selectedCategory = '';
      this.servicesService.searchServices(this.searchQuery).subscribe((services) => {
        this.filteredServices.set(services);
      });
    } else {
      this.loadServices();
    }
  }

  generateDefaultAvatar(name: string): string {
    const cleanName = encodeURIComponent(name.trim());
    return `https://ui-avatars.com/api/?name=${cleanName}&background=3b82f6&color=ffffff&size=24&rounded=true&bold=true`;
  }
}