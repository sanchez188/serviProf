import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ProfessionalsService } from '../../services/professionals.service';
import { BookingsService } from '../../services/bookings.service';
import { AuthService } from '../../services/auth.service';
import { Service } from '../../models/service.model';
import { StarRatingComponent } from '../../components/star-rating/star-rating.component';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-professional-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, StarRatingComponent, LoadingSpinnerComponent],
  template: `
    <div class="professional-detail">
      @if (professionalsService.isLoading()) {
        <app-loading-spinner></app-loading-spinner>
      } @else if (professional()) {
        <div class="container">
          <!-- Header -->
          <div class="professional-header">
            <div class="professional-main-info">
              <img 
                [src]="professional()!.user?.avatar" 
                [alt]="professional()!.user?.name"
                class="professional-avatar"
              >
              <div class="professional-info">
                <h1>{{ professional()!.user?.name }}</h1>
                <div class="category-badge" [style.background-color]="professional()!.category.color">
                  {{ professional()!.category.name }}
                </div>
                <div class="professional-meta">
                  <span class="verified-badge">✅ Verificado</span>
                  <span class="experience">💼 Profesional verificado</span>
                  <span class="location">📍 {{ professional()!.location }}</span>
                </div>
                <div class="rating-section">
                  <app-star-rating 
                    [rating]="professional()!.rating" 
                    [count]="professional()!.reviewCount"
                  ></app-star-rating>
                </div>
              </div>
            </div>
            <div class="price-section">
              <div class="price">
                <span class="price-amount">\${{ professional()!.hourly_rate || professional()!.price }}</span>
                <span class="price-unit">/hora</span>
              </div>
            </div>
          </div>

          <div class="content-grid">
            <!-- Left Column -->
            <div class="left-column">
              <!-- Description -->
              <div class="section">
                <h2>Acerca de {{ professional()!.user?.name }}</h2>
                <p>{{ professional()!.description }}</p>
              </div>

              <!-- Skills -->
              <div class="section">
                <h2>Habilidades y Servicios</h2>
                <div class="skills-grid">
                  @for (tag of professional()!.tags; track tag) {
                    <div class="skill-item">
                      <span class="skill-icon">✓</span>
                      <span>{{ tag }}</span>
                    </div>
                  }
                </div>
              </div>

              <!-- Availability -->
              <div class="section">
                <h2>Disponibilidad</h2>
                <p>Disponible para reservas. Contacta para coordinar horarios.</p>
              </div>

              <!-- Reviews -->
              <div class="section">
                <h2>Reseñas ({{ professional()!.review_count }})</h2>
                <div class="reviews-list">
                  <div class="no-reviews">
                    <p>Las reseñas se mostrarán aquí una vez que haya reservas completadas.</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Column - Booking Form -->
            <div class="right-column">
              <div class="booking-card">
                <h3>Reservar Servicio</h3>
                
                @if (!authService.isAuthenticated()) {
                  <div class="auth-required">
                    <p>Inicia sesión para reservar este servicio</p>
                    <button class="btn btn-primary" (click)="goToLogin()">
                      Iniciar Sesión
                    </button>
                  </div>
                } @else {
                  <form [formGroup]="bookingForm" (ngSubmit)="onBookingSubmit()" class="booking-form">
                    <div class="form-group">
                      <label for="date">Fecha</label>
                      <input
                        type="date"
                        id="date"
                        formControlName="date"
                        class="form-control"
                        [min]="minDate"
                      >
                    </div>

                    <div class="form-group">
                      <label for="startTime">Hora de inicio</label>
                      <select id="startTime" formControlName="startTime" class="form-control">
                        <option value="">Seleccionar hora</option>
                        @for (time of availableTimes; track time) {
                          <option [value]="time">{{ time }}</option>
                        }
                      </select>
                    </div>

                    <div class="form-group">
                      <label for="hours">Duración (horas)</label>
                      <select id="hours" formControlName="hours" class="form-control">
                        <option value="">Seleccionar duración</option>
                        @for (hour of [1, 2, 3, 4, 5, 6, 7, 8]; track hour) {
                          <option [value]="hour">{{ hour }} {{ hour === 1 ? 'hora' : 'horas' }}</option>
                        }
                      </select>
                    </div>

                    <div class="form-group">
                      <label for="description">Descripción del trabajo (opcional)</label>
                      <textarea
                        id="description"
                        formControlName="description"
                        class="form-control"
                        rows="3"
                        placeholder="Describe brevemente el trabajo que necesitas..."
                      ></textarea>
                    </div>

                    @if (bookingForm.get('hours')?.value) {
                      <div class="price-summary">
                        <div class="price-breakdown">
                          <span>{{ bookingForm.get('hours')?.value }} horas × \${{ professional()!.hourly_rate || professional()!.price }}</span>
                          <span class="total-price">\${{ calculateTotal() }}</span>
                        </div>
                      </div>
                    }

                    @if (bookingError) {
                      <div class="alert alert-error">
                        {{ bookingError }}
                      </div>
                    }

                    @if (bookingSuccess) {
                      <div class="alert alert-success">
                        ¡Reserva creada exitosamente! Puedes ver tus servicios en "Mis Servicios".
                      </div>
                    }

                    <button 
                      type="submit" 
                      class="btn btn-primary btn-full"
                      [disabled]="bookingForm.invalid || bookingsService.isLoading()"
                    >
                      @if (bookingsService.isLoading()) {
                        <app-loading-spinner></app-loading-spinner>
                      } @else {
                        Reservar Servicio
                      }
                    </button>
                  </form>
                }
              </div>
            </div>
          </div>
        </div>
      } @else {
        <div class="not-found">
          <h2>Profesional no encontrado</h2>
          <p>El profesional que buscas no existe o ha sido eliminado.</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .professional-detail {
      min-height: 100vh;
      background: #f9fafb;
      padding: 2rem 0;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
    }

    .professional-header {
      background: white;
      padding: 2rem;
      border-radius: 1rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      margin-bottom: 2rem;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 2rem;
    }

    .professional-main-info {
      display: flex;
      gap: 2rem;
      flex: 1;
    }

    .professional-avatar {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      object-fit: cover;
    }

    .professional-info h1 {
      font-size: 2rem;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 0.5rem;
    }

    .category-badge {
      display: inline-block;
      padding: 0.5rem 1rem;
      border-radius: 1rem;
      color: white;
      font-weight: 500;
      margin-bottom: 1rem;
    }

    .professional-meta {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .professional-meta span {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .verified-badge {
      color: #059669 !important;
      font-weight: 600 !important;
    }

    .price-section {
      text-align: right;
    }

    .price {
      display: flex;
      align-items: baseline;
      gap: 0.25rem;
    }

    .price-amount {
      font-size: 2.5rem;
      font-weight: bold;
      color: #059669;
    }

    .price-unit {
      font-size: 1rem;
      color: #6b7280;
    }

    .content-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 2rem;
    }

    .left-column,
    .right-column {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .section {
      background: white;
      padding: 2rem;
      border-radius: 1rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }

    .section h2 {
      font-size: 1.5rem;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 1rem;
    }

    .section p {
      color: #6b7280;
      line-height: 1.6;
    }

    .skills-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .skill-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem;
      background: #f3f4f6;
      border-radius: 0.5rem;
    }

    .skill-icon {
      color: #059669;
      font-weight: bold;
    }

    .availability-grid {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .availability-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      background: #f3f4f6;
      border-radius: 0.5rem;
    }

    .day {
      font-weight: 600;
      color: #374151;
    }

    .time {
      color: #6b7280;
    }

    .reviews-list {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .review-item {
      padding: 1.5rem;
      background: #f9fafb;
      border-radius: 0.5rem;
      border: 1px solid #e5e7eb;
    }

    .review-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.5rem;
    }

    .reviewer-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .reviewer-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
    }

    .reviewer-avatar-placeholder {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #3b82f6;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
    }

    .reviewer-name {
      font-weight: 600;
      color: #1f2937;
    }

    .review-date {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .review-service {
      font-size: 0.875rem;
      color: #3b82f6;
      font-weight: 500;
      margin-bottom: 0.5rem;
    }

    .review-comment {
      color: #374151;
      line-height: 1.6;
      margin: 0;
    }

    .no-reviews {
      text-align: center;
      padding: 2rem;
      color: #6b7280;
    }

    .booking-card {
      background: white;
      padding: 2rem;
      border-radius: 1rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      position: sticky;
      top: 2rem;
    }

    .booking-card h3 {
      font-size: 1.5rem;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 1.5rem;
    }

    .auth-required {
      text-align: center;
      padding: 2rem 0;
    }

    .auth-required p {
      color: #6b7280;
      margin-bottom: 1rem;
    }

    .booking-form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-group label {
      font-weight: 600;
      color: #374151;
    }

    .form-control {
      padding: 0.75rem;
      border: 2px solid #e5e7eb;
      border-radius: 0.5rem;
      font-size: 1rem;
      transition: border-color 0.2s ease;
    }

    .form-control:focus {
      outline: none;
      border-color: #3b82f6;
    }

    .price-summary {
      padding: 1rem;
      background: #f0f9ff;
      border-radius: 0.5rem;
      border: 1px solid #bae6fd;
    }

    .price-breakdown {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .total-price {
      font-size: 1.25rem;
      font-weight: bold;
      color: #059669;
    }

    .alert {
      padding: 0.75rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
    }

    .alert-error {
      background: #fef2f2;
      color: #dc2626;
      border: 1px solid #fecaca;
    }

    .alert-success {
      background: #f0fdf4;
      color: #166534;
      border: 1px solid #bbf7d0;
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
      text-decoration: none;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #2563eb;
    }

    .btn-primary:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }

    .btn-full {
      width: 100%;
    }

    .not-found {
      text-align: center;
      padding: 4rem 2rem;
    }

    .not-found h2 {
      font-size: 2rem;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 1rem;
    }

    .not-found p {
      color: #6b7280;
    }

    @media (max-width: 768px) {
      .professional-header {
        flex-direction: column;
        align-items: stretch;
      }

      .professional-main-info {
        flex-direction: column;
        align-items: center;
        text-align: center;
      }

      .content-grid {
        grid-template-columns: 1fr;
      }

      .booking-card {
        position: static;
      }
    }
  `]
})
export class ProfessionalDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  
  professionalsService = inject(ProfessionalsService);
  bookingsService = inject(BookingsService);
  authService = inject(AuthService);

  professional = signal<Service | null>(null);
  bookingForm: FormGroup;
  bookingError = '';
  bookingSuccess = false;
  minDate = '';
  availableTimes = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

  constructor() {
    this.bookingForm = this.fb.group({
      date: ['', Validators.required],
      startTime: ['', Validators.required],
      hours: ['', Validators.required],
      description: ['']
    });

    // Set minimum date to today
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.loadProfessional(id);
      }
    });
  }

  loadProfessional(id: string): void {
    this.professionalsService.getProfessionalById(id).subscribe(service => {
      if (service) {
        this.professional.set(service);
      }
    });
  }

  getDayName(dayOfWeek: number): string {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[dayOfWeek];
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(date));
  }

  calculateTotal(): number {
    const hours = this.bookingForm.get('hours')?.value;
    const professional = this.professional();
    if (hours && professional) {
      return hours * (professional.hourlyRate || professional.price || 0);
    }
    return 0;
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  onBookingSubmit(): void {
    if (this.bookingForm.valid && this.professional()) {
      this.bookingError = '';
      this.bookingSuccess = false;

      const formValue = this.bookingForm.value;
      const bookingRequest = {
        professionalId: this.professional()!.id,
        date: new Date(formValue.date),
        startTime: formValue.startTime,
        hours: formValue.hours,
        description: formValue.description
      };

      this.bookingsService.createBooking(bookingRequest).subscribe({
        next: () => {
          this.bookingSuccess = true;
          this.bookingForm.reset();
          setTimeout(() => {
            this.router.navigate(['/my-services']);
          }, 2000);
        },
        error: (error) => {
          this.bookingError = error.message;
        }
      });
    }
  }
}