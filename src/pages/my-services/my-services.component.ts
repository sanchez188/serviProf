import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookingsService } from '../../services/bookings.service';
import { Booking, BookingStatus } from '../../models/booking.model';
import { StarRatingComponent } from '../../components/star-rating/star-rating.component';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-my-services',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    StarRatingComponent,
    LoadingSpinnerComponent,
  ],
  template: `
    <div class="my-services-page">
      <div class="container">
        <div class="page-header">
          <h1>Mis Servicios</h1>
          <p>Gestiona y da seguimiento a tus servicios contratados</p>
        </div>

        @if (bookingsService.isLoading()) {
          <app-loading-spinner></app-loading-spinner>
        } @else {
          <div class="services-tabs">
            <button 
              class="tab-btn"
              [class.active]="activeTab === 'active'"
              (click)="setActiveTab('active')"
            >
              Servicios Activos ({{ getActiveBookings().length }})
            </button>
            <button 
              class="tab-btn"
              [class.active]="activeTab === 'completed'"
              (click)="setActiveTab('completed')"
            >
              Completados ({{ getCompletedBookings().length }})
            </button>
          </div>

          <div class="services-content">
            @if (activeTab === 'active') {
              <div class="services-grid">
                @for (booking of getActiveBookings(); track booking.id) {
                  <div class="service-card">
                    <div class="service-header">
                      <img 
                        [src]="booking.professional.avatar" 
                        [alt]="booking.professional.name"
                        class="professional-avatar"
                      >
                      <div class="service-info">
                        <h3>{{ booking.professional.name }}</h3>
                        <div class="service-category">{{ booking.professional.category }}</div>
                        <div class="service-status" [class]="'status-' + booking.status">
                          {{ getStatusText(booking.status) }}
                        </div>
                      </div>
                    </div>

                    <div class="service-details">
                      <div class="detail-row">
                        <span class="detail-label">📅 Fecha:</span>
                        <span>{{ formatDate(booking.date) }}</span>
                      </div>
                      <div class="detail-row">
                        <span class="detail-label">🕐 Horario:</span>
                        <span>{{ booking.startTime }} - {{ booking.endTime }}</span>
                      </div>
                      <div class="detail-row">
                        <span class="detail-label">⏱️ Duración:</span>
                        <span>{{ booking.hours }} {{ booking.hours === 1 ? 'hora' : 'horas' }}</span>
                      </div>
                      <div class="detail-row">
                        <span class="detail-label">💰 Total:</span>
                        <span class="price">\${{ booking.totalPrice }}</span>
                      </div>
                      @if (booking.description) {
                        <div class="service-description">
                          <strong>Descripción:</strong> {{ booking.description }}
                        </div>
                      }
                    </div>

                    <div class="service-actions">
                      @if (booking.status === BookingStatus.IN_PROGRESS) {
                        <button 
                          class="btn btn-success"
                          (click)="completeService(booking)"
                          [disabled]="bookingsService.isLoading()"
                        >
                          Marcar como Completado
                        </button>
                      }
                    </div>
                  </div>
                } @empty {
                  <div class="empty-state">
                    <div class="empty-icon">📋</div>
                    <h3>No tienes servicios activos</h3>
                    <p>Cuando contrates un servicio, aparecerá aquí para que puedas darle seguimiento.</p>
                    <a href="/professionals" class="btn btn-primary">
                      Explorar Profesionales
                    </a>
                  </div>
                }
              </div>
            }

            @if (activeTab === 'completed') {
              <div class="services-grid">
                @for (booking of getCompletedBookings(); track booking.id) {
                  <div class="service-card completed">
                    <div class="service-header">
                      <img 
                        [src]="booking.professional.avatar" 
                        [alt]="booking.professional.name"
                        class="professional-avatar"
                      >
                      <div class="service-info">
                        <h3>{{ booking.professional.name }}</h3>
                        <div class="service-category">{{ booking.professional.category }}</div>
                        <div class="completion-date">
                          Completado el {{ formatDate(booking.completedAt!) }}
                        </div>
                      </div>
                    </div>

                    <div class="service-details">
                      <div class="detail-row">
                        <span class="detail-label">📅 Fecha:</span>
                        <span>{{ formatDate(booking.date) }}</span>
                      </div>
                      <div class="detail-row">
                        <span class="detail-label">⏱️ Duración:</span>
                        <span>{{ booking.hours }} {{ booking.hours === 1 ? 'hora' : 'horas' }}</span>
                      </div>
                      <div class="detail-row">
                        <span class="detail-label">💰 Total:</span>
                        <span class="price">\${{ booking.totalPrice }}</span>
                      </div>
                    </div>

                    @if (booking.review) {
                      <div class="review-section">
                        <h4>Tu reseña:</h4>
                        <app-star-rating [rating]="booking.review.rating" [showCount]="false"></app-star-rating>
                        <p class="review-comment">{{ booking.review.comment }}</p>
                      </div>
                    } @else {
                      <div class="service-actions">
                        <button 
                          class="btn btn-outline"
                          (click)="openReviewModal(booking)"
                        >
                          Dejar Reseña
                        </button>
                      </div>
                    }
                  </div>
                } @empty {
                  <div class="empty-state">
                    <div class="empty-icon">✅</div>
                    <h3>No tienes servicios completados</h3>
                    <p>Los servicios que hayas completado aparecerán aquí.</p>
                  </div>
                }
              </div>
            }
          </div>
        }
      </div>
    </div>

    <!-- Review Modal -->
    @if (showReviewModal && selectedBooking) {
      <div class="modal-overlay" (click)="closeReviewModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Calificar Servicio</h3>
            <button class="modal-close" (click)="closeReviewModal()">×</button>
          </div>
          
          <div class="modal-body">
            <div class="service-summary">
              <img 
                [src]="selectedBooking.professional.avatar" 
                [alt]="selectedBooking.professional.name"
                class="professional-avatar-small"
              >
              <div>
                <h4>{{ selectedBooking.professional.name }}</h4>
                <p>{{ selectedBooking.professional.category }}</p>
              </div>
            </div>

            <div class="rating-section">
              <label>Calificación:</label>
              <app-star-rating 
                [rating]="reviewRating" 
                [interactive]="true"
                [showCount]="false"
                (ratingChange)="onRatingChange($event)"
              ></app-star-rating>
            </div>

            <div class="comment-section">
              <label for="reviewComment">Comentario:</label>
              <textarea
                id="reviewComment"
                [(ngModel)]="reviewComment"
                placeholder="Comparte tu experiencia con este profesional..."
                rows="4"
                class="form-control"
              ></textarea>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeReviewModal()">
              Cancelar
            </button>
            <button 
              class="btn btn-primary"
              (click)="submitReview()"
              [disabled]="reviewRating === 0 || bookingsService.isLoading()"
            >
              @if (bookingsService.isLoading()) {
                <app-loading-spinner></app-loading-spinner>
              } @else {
                Enviar Reseña
              }
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
    .my-services-page {
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

    .services-tabs {
      display: flex;
      gap: 1rem;
      margin-bottom: 2rem;
      justify-content: center;
    }

    .tab-btn {
      padding: 0.75rem 1.5rem;
      background: white;
      border: 2px solid #e5e7eb;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s ease;
    }

    .tab-btn:hover {
      border-color: #3b82f6;
    }

    .tab-btn.active {
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;
    }

    .services-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 2rem;
    }

    .service-card {
      background: white;
      border-radius: 1rem;
      padding: 2rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;
    }

    .service-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    }

    .service-card.completed {
      border-left: 4px solid #10b981;
    }

    .service-header {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .professional-avatar {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      object-fit: cover;
    }

    .professional-avatar-small {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      object-fit: cover;
    }

    .service-info h3 {
      font-size: 1.25rem;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 0.25rem;
    }

    .service-category {
      color: #6b7280;
      font-size: 0.875rem;
      margin-bottom: 0.5rem;
    }

    .service-status {
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .status-pending {
      background: #fef3c7;
      color: #92400e;
    }

    .status-confirmed {
      background: #dbeafe;
      color: #1e40af;
    }

    .status-in_progress {
      background: #fde68a;
      color: #92400e;
    }

    .completion-date {
      color: #10b981;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .service-details {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }

    .detail-row {
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

    .service-description {
      padding: 1rem;
      background: #f9fafb;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      color: #374151;
      line-height: 1.5;
    }

    .service-actions {
      display: flex;
      gap: 1rem;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      text-decoration: none;
      border: none;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #2563eb;
    }

    .btn-success {
      background: #10b981;
      color: white;
    }

    .btn-success:hover:not(:disabled) {
      background: #059669;
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

    .btn-secondary {
      background: #6b7280;
      color: white;
    }

    .btn-secondary:hover {
      background: #4b5563;
    }

    .btn:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }

    .review-section {
      padding: 1rem;
      background: #f0fdf4;
      border-radius: 0.5rem;
      border: 1px solid #bbf7d0;
    }

    .review-section h4 {
      color: #166534;
      margin-bottom: 0.5rem;
    }

    .review-comment {
      color: #374151;
      font-style: italic;
      margin-top: 0.5rem;
      margin-bottom: 0;
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
      margin-bottom: 2rem;
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }

    .modal-content {
      background: white;
      border-radius: 1rem;
      width: 100%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .modal-header h3 {
      font-size: 1.5rem;
      font-weight: bold;
      color: #1f2937;
      margin: 0;
    }

    .modal-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #6b7280;
      padding: 0.5rem;
    }

    .modal-close:hover {
      color: #374151;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .service-summary {
      display: flex;
      gap: 1rem;
      align-items: center;
      margin-bottom: 2rem;
      padding: 1rem;
      background: #f9fafb;
      border-radius: 0.5rem;
    }

    .service-summary h4 {
      margin: 0 0 0.25rem 0;
      color: #1f2937;
    }

    .service-summary p {
      margin: 0;
      color: #6b7280;
      font-size: 0.875rem;
    }

    .rating-section,
    .comment-section {
      margin-bottom: 1.5rem;
    }

    .rating-section label,
    .comment-section label {
      display: block;
      font-weight: 600;
      color: #374151;
      margin-bottom: 0.5rem;
    }

    .form-control {
      width: 100%;
      padding: 0.75rem;
      border: 2px solid #e5e7eb;
      border-radius: 0.5rem;
      font-size: 1rem;
      transition: border-color 0.2s ease;
      resize: vertical;
    }

    .form-control:focus {
      outline: none;
      border-color: #3b82f6;
    }

    .modal-footer {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      padding: 1.5rem;
      border-top: 1px solid #e5e7eb;
    }

    @media (max-width: 768px) {
      .services-grid {
        grid-template-columns: 1fr;
      }

      .services-tabs {
        flex-direction: column;
        align-items: center;
      }

      .tab-btn {
        width: 100%;
        max-width: 300px;
      }

      .modal-content {
        margin: 1rem;
      }

      .modal-footer {
        flex-direction: column;
      }
    }
  `,
  ],
})
export class MyServicesComponent implements OnInit {
  bookingsService = inject(BookingsService);

  activeTab: 'active' | 'completed' = 'active';
  bookings = signal<Booking[]>([]);

  // Review modal
  showReviewModal = false;
  selectedBooking: Booking | null = null;
  reviewRating = 0;
  reviewComment = '';

  // Enum reference for template
  BookingStatus = BookingStatus;

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    this.bookingsService.getUserBookings().subscribe((bookings) => {
      this.bookings.set(bookings);
    });
  }

  setActiveTab(tab: 'active' | 'completed'): void {
    this.activeTab = tab;
  }

  getActiveBookings(): Booking[] {
    return this.bookings().filter(
      (booking) => booking.status !== BookingStatus.COMPLETED
    );
  }

  getCompletedBookings(): Booking[] {
    return this.bookings().filter(
      (booking) => booking.status === BookingStatus.COMPLETED
    );
  }

  getStatusText(status: BookingStatus): string {
    const statusMap = {
      [BookingStatus.PENDING]: 'Pendiente',
      [BookingStatus.CONFIRMED]: 'Confirmado',
      [BookingStatus.IN_PROGRESS]: 'En Progreso',
      [BookingStatus.COMPLETED]: 'Completado',
      [BookingStatus.CANCELLED]: 'Cancelado',
    };
    return statusMap[status];
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date));
  }

  completeService(booking: Booking): void {
    this.bookingsService.completeBooking(booking.id).subscribe({
      next: () => {
        this.loadBookings();
        // Auto-open review modal after completion
        setTimeout(() => {
          this.openReviewModal(booking);
        }, 500);
      },
      error: (error) => {
        console.error('Error completing service:', error);
      },
    });
  }

  openReviewModal(booking: Booking): void {
    this.selectedBooking = booking;
    this.reviewRating = 0;
    this.reviewComment = '';
    this.showReviewModal = true;
  }

  closeReviewModal(): void {
    this.showReviewModal = false;
    this.selectedBooking = null;
    this.reviewRating = 0;
    this.reviewComment = '';
  }

  onRatingChange(rating: number): void {
    this.reviewRating = rating;
  }

  submitReview(): void {
    if (this.selectedBooking && this.reviewRating > 0) {
      this.bookingsService
        .addReview(
          this.selectedBooking.id,
          this.reviewRating,
          this.reviewComment
        )
        .subscribe({
          next: () => {
            this.loadBookings();
            this.closeReviewModal();
          },
          error: (error) => {
            console.error('Error submitting review:', error);
          },
        });
    }
  }
}
