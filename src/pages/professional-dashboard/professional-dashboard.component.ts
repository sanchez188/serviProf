import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProfessionalService } from '../../services/professional.service';
import { AuthService } from '../../services/auth.service';
import { Booking, BookingStatus } from '../../models/booking.model';
import { StarRatingComponent } from '../../components/star-rating/star-rating.component';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { FormsModule } from '@angular/forms';
import { UserType } from '../../models/user.model';

@Component({
  selector: 'app-professional-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    StarRatingComponent,
    LoadingSpinnerComponent,
  ],
  template: `
    <div class="professional-dashboard">
      <div class="container">
        <div class="dashboard-header">
          <h1>Panel Profesional</h1>
          <p>Gestiona tus servicios y solicitudes</p>
        </div>

        @if (professionalService.isLoading()) {
          <app-loading-spinner></app-loading-spinner>
        } @else {
          <!-- Stats Cards -->
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon">📋</div>
              <div class="stat-info">
                <div class="stat-number">{{ getPendingBookings().length }}</div>
                <div class="stat-label">Solicitudes Pendientes</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">⏳</div>
              <div class="stat-info">
                <div class="stat-number">{{ getActiveBookings().length }}</div>
                <div class="stat-label">Trabajos Activos</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">✅</div>
              <div class="stat-info">
                <div class="stat-number">{{ getCompletedBookings().length }}</div>
                <div class="stat-label">Trabajos Completados</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">⭐</div>
              <div class="stat-info">
                <div class="stat-number">{{ currentUser?.professionalProfile?.rating || 0 }}</div>
                <div class="stat-label">Calificación Promedio</div>
              </div>
            </div>
          </div>

          <!-- Tabs -->
          <div class="dashboard-tabs">
            <button 
              class="tab-btn"
              [class.active]="activeTab === 'pending'"
              (click)="setActiveTab('pending')"
            >
              Solicitudes Pendientes ({{ getPendingBookings().length }})
            </button>
            <button 
              class="tab-btn"
              [class.active]="activeTab === 'active'"
              (click)="setActiveTab('active')"
            >
              Trabajos Activos ({{ getActiveBookings().length }})
            </button>
            <button 
              class="tab-btn"
              [class.active]="activeTab === 'completed'"
              (click)="setActiveTab('completed')"
            >
              Completados ({{ getCompletedBookings().length }})
            </button>
          </div>

          <!-- Content -->
          <div class="dashboard-content">
            @if (activeTab === 'pending') {
              <div class="bookings-grid">
                @for (booking of getPendingBookings(); track booking.id) {
                  <div class="booking-card pending">
                    <div class="booking-header">
                      <img 
                        [src]="booking.client.avatar" 
                        [alt]="booking.client.name"
                        class="client-avatar"
                      >
                      <div class="booking-info">
                        <h3>{{ booking.client.name }}</h3>
                        <div class="service-title">{{ booking.professional.serviceTitle }}</div>
                        <div class="booking-date">{{ formatDate(booking.date) }}</div>
                        <div class="booking-time">{{ booking.startTime }} - {{ booking.endTime }}</div>
                      </div>
                      <div class="booking-price">\${{ booking.totalPrice }}</div>
                    </div>

                    <div class="booking-details">
                      <div class="detail-row">
                        <span class="detail-label">⏱️ Duración:</span>
                        <span>{{ booking.hours }} {{ booking.hours === 1 ? 'hora' : 'horas' }}</span>
                      </div>
                      @if (booking.client.phone) {
                        <div class="detail-row">
                          <span class="detail-label">📞 Teléfono:</span>
                          <span>{{ booking.client.phone }}</span>
                        </div>
                      }
                      @if (booking.description) {
                        <div class="booking-description">
                          <strong>Descripción:</strong> {{ booking.description }}
                        </div>
                      }
                    </div>

                    <div class="booking-actions">
                      <button 
                        class="btn btn-success"
                        (click)="acceptBooking(booking)"
                        [disabled]="professionalService.isLoading()"
                      >
                        Aceptar
                      </button>
                      <button 
                        class="btn btn-danger"
                        (click)="openRejectModal(booking)"
                        [disabled]="professionalService.isLoading()"
                      >
                        Rechazar
                      </button>
                    </div>
                  </div>
                } @empty {
                  <div class="empty-state">
                    <div class="empty-icon">📋</div>
                    <h3>No hay solicitudes pendientes</h3>
                    <p>Las nuevas solicitudes de trabajo aparecerán aquí.</p>
                  </div>
                }
              </div>
            }

            @if (activeTab === 'active') {
              <div class="bookings-grid">
                @for (booking of getActiveBookings(); track booking.id) {
                  <div class="booking-card active">
                    <div class="booking-header">
                      <img 
                        [src]="booking.client.avatar" 
                        [alt]="booking.client.name"
                        class="client-avatar"
                      >
                      <div class="booking-info">
                        <h3>{{ booking.client.name }}</h3>
                        <div class="service-title">{{ booking.professional.serviceTitle }}</div>
                        <div class="booking-date">{{ formatDate(booking.date) }}</div>
                        <div class="booking-time">{{ booking.startTime }} - {{ booking.endTime }}</div>
                        <div class="booking-status" [class]="'status-' + booking.status">
                          {{ getStatusText(booking.status) }}
                        </div>
                      </div>
                      <div class="booking-price">\${{ booking.totalPrice }}</div>
                    </div>

                    <div class="booking-details">
                      <div class="detail-row">
                        <span class="detail-label">⏱️ Duración:</span>
                        <span>{{ booking.hours }} {{ booking.hours === 1 ? 'hora' : 'horas' }}</span>
                      </div>
                      @if (booking.client.phone) {
                        <div class="detail-row">
                          <span class="detail-label">📞 Teléfono:</span>
                          <span>{{ booking.client.phone }}</span>
                        </div>
                      }
                      @if (booking.description) {
                        <div class="booking-description">
                          <strong>Descripción:</strong> {{ booking.description }}
                        </div>
                      }
                    </div>

                    <div class="booking-actions">
                      @if (booking.status === BookingStatus.ACCEPTED) {
                        <button 
                          class="btn btn-primary"
                          (click)="startJob(booking)"
                          [disabled]="professionalService.isLoading()"
                        >
                          Iniciar Trabajo
                        </button>
                      }
                      @if (booking.status === BookingStatus.IN_PROGRESS) {
                        <button 
                          class="btn btn-success"
                          (click)="completeJob(booking)"
                          [disabled]="professionalService.isLoading()"
                        >
                          Marcar como Completado
                        </button>
                      }
                    </div>
                  </div>
                } @empty {
                  <div class="empty-state">
                    <div class="empty-icon">⏳</div>
                    <h3>No hay trabajos activos</h3>
                    <p>Los trabajos aceptados y en progreso aparecerán aquí.</p>
                  </div>
                }
              </div>
            }

            @if (activeTab === 'completed') {
              <div class="bookings-grid">
                @for (booking of getCompletedBookings(); track booking.id) {
                  <div class="booking-card completed">
                    <div class="booking-header">
                      <img 
                        [src]="booking.client.avatar" 
                        [alt]="booking.client.name"
                        class="client-avatar"
                      >
                      <div class="booking-info">
                        <h3>{{ booking.client.name }}</h3>
                        <div class="service-title">{{ booking.professional.serviceTitle }}</div>
                        <div class="booking-date">{{ formatDate(booking.date) }}</div>
                        <div class="completion-date">
                          Completado el {{ formatDate(booking.completedAt!) }}
                        </div>
                      </div>
                      <div class="booking-price">\${{ booking.totalPrice }}</div>
                    </div>

                    @if (booking.review) {
                      <div class="review-section">
                        <h4>Reseña del cliente:</h4>
                        <app-star-rating [rating]="booking.review.rating" [showCount]="false"></app-star-rating>
                        <p class="review-comment">{{ booking.review.comment }}</p>
                      </div>
                    }
                  </div>
                } @empty {
                  <div class="empty-state">
                    <div class="empty-icon">✅</div>
                    <h3>No hay trabajos completados</h3>
                    <p>Los trabajos completados aparecerán aquí.</p>
                  </div>
                }
              </div>
            }
          </div>
        }
      </div>
    </div>

    <!-- Reject Modal -->
    @if (showRejectModal && selectedBooking) {
      <div class="modal-overlay" (click)="closeRejectModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Rechazar Solicitud</h3>
            <button class="modal-close" (click)="closeRejectModal()">×</button>
          </div>
          
          <div class="modal-body">
            <div class="booking-summary">
              <img 
                [src]="selectedBooking.client.avatar" 
                [alt]="selectedBooking.client.name"
                class="client-avatar-small"
              >
              <div>
                <h4>{{ selectedBooking.client.name }}</h4>
                <p>{{ formatDate(selectedBooking.date) }} - {{ selectedBooking.startTime }}</p>
              </div>
            </div>

            <div class="reason-section">
              <label for="rejectionReason">Motivo del rechazo:</label>
              <textarea
                id="rejectionReason"
                [(ngModel)]="rejectionReason"
                placeholder="Explica brevemente por qué no puedes realizar este trabajo..."
                rows="4"
                class="form-control"
              ></textarea>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeRejectModal()">
              Cancelar
            </button>
            <button 
              class="btn btn-danger"
              (click)="confirmReject()"
              [disabled]="!rejectionReason.trim() || professionalService.isLoading()"
            >
              @if (professionalService.isLoading()) {
                <app-loading-spinner></app-loading-spinner>
              } @else {
                Rechazar Solicitud
              }
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .professional-dashboard {
      min-height: 100vh;
      background: #f9fafb;
      padding: 2rem 0;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
    }

    .dashboard-header {
      text-align: center;
      margin-bottom: 3rem;
    }

    .dashboard-header h1 {
      font-size: 2.5rem;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 0.5rem;
    }

    .dashboard-header p {
      font-size: 1.2rem;
      color: #6b7280;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
      margin-bottom: 3rem;
    }

    .stat-card {
      background: white;
      padding: 2rem;
      border-radius: 1rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .stat-icon {
      font-size: 2.5rem;
      width: 60px;
      text-align: center;
    }

    .stat-number {
      font-size: 2rem;
      font-weight: bold;
      color: #1f2937;
    }

    .stat-label {
      color: #6b7280;
      font-size: 0.875rem;
    }

    .dashboard-tabs {
      display: flex;
      gap: 1rem;
      margin-bottom: 2rem;
      justify-content: center;
      flex-wrap: wrap;
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

    .bookings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 2rem;
    }

    .booking-card {
      background: white;
      border-radius: 1rem;
      padding: 2rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;
    }

    .booking-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    }

    .booking-card.pending {
      border-left: 4px solid #f59e0b;
    }

    .booking-card.active {
      border-left: 4px solid #3b82f6;
    }

    .booking-card.completed {
      border-left: 4px solid #10b981;
    }

    .booking-header {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
      align-items: flex-start;
    }

    .client-avatar {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      object-fit: cover;
    }

    .client-avatar-small {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      object-fit: cover;
    }

    .booking-info {
      flex: 1;
    }

    .booking-info h3 {
      font-size: 1.25rem;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 0.25rem;
    }

    .service-title {
      color: #3b82f6;
      font-size: 0.875rem;
      font-weight: 500;
      margin-bottom: 0.25rem;
    }

    .booking-date {
      color: #6b7280;
      font-size: 0.875rem;
      margin-bottom: 0.25rem;
    }

    .booking-time {
      color: #3b82f6;
      font-weight: 500;
      font-size: 0.875rem;
    }

    .booking-status {
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.875rem;
      font-weight: 500;
      margin-top: 0.5rem;
      display: inline-block;
    }

    .status-accepted {
      background: #dbeafe;
      color: #1e40af;
    }

    .status-in_progress {
      background: #fde68a;
      color: #92400e;
    }

    .booking-price {
      font-size: 1.5rem;
      font-weight: bold;
      color: #059669;
    }

    .booking-details {
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

    .booking-description {
      padding: 1rem;
      background: #f9fafb;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      color: #374151;
      line-height: 1.5;
    }

    .completion-date {
      color: #10b981;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .booking-actions {
      display: flex;
      gap: 1rem;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 0.5rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      flex: 1;
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

    .btn-danger {
      background: #ef4444;
      color: white;
    }

    .btn-danger:hover:not(:disabled) {
      background: #dc2626;
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

    .booking-summary {
      display: flex;
      gap: 1rem;
      align-items: center;
      margin-bottom: 2rem;
      padding: 1rem;
      background: #f9fafb;
      border-radius: 0.5rem;
    }

    .booking-summary h4 {
      margin: 0 0 0.25rem 0;
      color: #1f2937;
    }

    .booking-summary p {
      margin: 0;
      color: #6b7280;
      font-size: 0.875rem;
    }

    .reason-section label {
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
      .bookings-grid {
        grid-template-columns: 1fr;
      }

      .dashboard-tabs {
        flex-direction: column;
        align-items: center;
      }

      .tab-btn {
        width: 100%;
        max-width: 300px;
      }

      .booking-actions {
        flex-direction: column;
      }

      .modal-footer {
        flex-direction: column;
      }
    }
  `]
})
export class ProfessionalDashboardComponent implements OnInit {
  professionalService = inject(ProfessionalService);
  authService = inject(AuthService);
  private router = inject(Router);

  activeTab: 'pending' | 'active' | 'completed' = 'pending';
  bookings = signal<Booking[]>([]);
  currentUser = this.authService.currentUser();

  // Reject modal
  showRejectModal = false;
  selectedBooking: Booking | null = null;
  rejectionReason = '';

  // Enum reference for template
  BookingStatus = BookingStatus;

  ngOnInit(): void {
    // Cualquier usuario autenticado puede ver su dashboard profesional
    if (!this.currentUser) {
      this.router.navigate(['/auth/login']);
      return;
    }

    // Cargar bookings del usuario actual
    this.professionalService.getProfessionalBookings().subscribe((bookings) => {
      this.bookings.set(bookings);
    });
  }


  setActiveTab(tab: 'pending' | 'active' | 'completed'): void {
    this.activeTab = tab;
  }

  getPendingBookings(): Booking[] {
    return this.bookings().filter(
      (booking) => booking.status === BookingStatus.PENDING
    );
  }

  getActiveBookings(): Booking[] {
    return this.bookings().filter(
      (booking) => booking.status === BookingStatus.ACCEPTED || 
                   booking.status === BookingStatus.IN_PROGRESS
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
      [BookingStatus.ACCEPTED]: 'Aceptado',
      [BookingStatus.REJECTED]: 'Rechazado',
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

  acceptBooking(booking: Booking): void {
    this.professionalService.acceptBooking(booking.id).subscribe({
      next: () => {
        // Reload bookings after accepting
        this.professionalService.getProfessionalBookings().subscribe((bookings) => {
          this.bookings.set(bookings);
        });
      },
      error: (error) => {
        console.error('Error accepting booking:', error);
      },
    });
  }

  openRejectModal(booking: Booking): void {
    this.selectedBooking = booking;
    this.rejectionReason = '';
    this.showRejectModal = true;
  }

  closeRejectModal(): void {
    this.showRejectModal = false;
    this.selectedBooking = null;
    this.rejectionReason = '';
  }

  confirmReject(): void {
    if (this.selectedBooking && this.rejectionReason.trim()) {
      this.professionalService.rejectBooking(this.selectedBooking.id, this.rejectionReason).subscribe({
        next: () => {
          // Reload bookings after rejecting
          this.professionalService.getProfessionalBookings().subscribe((bookings) => {
            this.bookings.set(bookings);
          });
          this.closeRejectModal();
        },
        error: (error) => {
          console.error('Error rejecting booking:', error);
        },
      });
    }
  }

  startJob(booking: Booking): void {
    this.professionalService.startJob(booking.id).subscribe({
      next: () => {
        this.loadBookings();
      },
      error: (error) => {
        console.error('Error starting job:', error);
      },
    });
  }

  completeJob(booking: Booking): void {
    this.professionalService.completeJob(booking.id).subscribe({
      next: () => {
        this.loadBookings();
      },
      error: (error) => {
        console.error('Error completing job:', error);
      },
    });
  }

  private loadBookings(): void {
    this.professionalService.getProfessionalBookings().subscribe((bookings) => {
      this.bookings.set(bookings);
    });
  }
}