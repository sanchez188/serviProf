import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AvailabilityService } from '../../services/availability.service';
import { AuthService } from '../../services/auth.service';
import { ProfessionalAvailability, BlockedTimeSlot, DAYS_OF_WEEK } from '../../models/availability.model';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-availability-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoadingSpinnerComponent],
  template: `
    <div class="availability-page">
      <div class="container">
        <div class="page-header">
          <h1>Gestionar Disponibilidad</h1>
          <p>Configura tus horarios de trabajo y bloquea tiempo personal</p>
        </div>

        @if (availabilityService.isLoading()) {
          <app-loading-spinner></app-loading-spinner>
        } @else {
          <div class="availability-content">
            <!-- Horarios Generales -->
            <div class="availability-card">
              <h2>Horarios de Trabajo</h2>
              <p>Define tus horarios disponibles por día de la semana</p>

              <form [formGroup]="availabilityForm" (ngSubmit)="saveAvailability()" class="availability-form">
                <div formArrayName="days" class="days-list">
                  @for (day of daysArray.controls; track $index; let i = $index) {
                    <div [formGroupName]="i" class="day-card">
                      <div class="day-header">
                        <label class="day-checkbox">
                          <input type="checkbox" formControlName="isAvailable">
                          <span class="day-name">{{ DAYS_OF_WEEK[i] }}</span>
                        </label>
                      </div>

                      @if (day.get('isAvailable')?.value) {
                        <div class="time-inputs">
                          <div class="time-group">
                            <label>Desde:</label>
                            <input
                              type="time"
                              formControlName="startTime"
                              class="form-control time-input"
                            >
                          </div>
                          <div class="time-group">
                            <label>Hasta:</label>
                            <input
                              type="time"
                              formControlName="endTime"
                              class="form-control time-input"
                            >
                          </div>
                        </div>
                      }
                    </div>
                  }
                </div>

                @if (availabilityError) {
                  <div class="alert alert-error">
                    {{ availabilityError }}
                  </div>
                }

                @if (availabilitySuccess) {
                  <div class="alert alert-success">
                    Horarios actualizados exitosamente
                  </div>
                }

                <div class="form-actions">
                  <button 
                    type="submit" 
                    class="btn btn-primary"
                    [disabled]="availabilityForm.invalid || availabilityService.isLoading()"
                  >
                    @if (availabilityService.isLoading()) {
                      <app-loading-spinner></app-loading-spinner>
                    } @else {
                      Guardar Horarios
                    }
                  </button>
                </div>
              </form>
            </div>

            <!-- Bloqueos Manuales -->
            <div class="blocked-slots-card">
              <h2>Tiempo Bloqueado</h2>
              <p>Bloquea tiempo específico para asuntos personales o mantenimiento</p>

              <!-- Formulario para nuevo bloqueo -->
              <form [formGroup]="blockForm" (ngSubmit)="blockTimeSlot()" class="block-form">
                <div class="form-row">
                  <div class="form-group">
                    <label for="blockDate">Fecha</label>
                    <input
                      type="date"
                      id="blockDate"
                      formControlName="date"
                      class="form-control"
                      [min]="minDate"
                    >
                  </div>
                  <div class="form-group">
                    <label for="blockStartTime">Hora Inicio</label>
                    <input
                      type="time"
                      id="blockStartTime"
                      formControlName="startTime"
                      class="form-control"
                    >
                  </div>
                  <div class="form-group">
                    <label for="blockEndTime">Hora Fin</label>
                    <input
                      type="time"
                      id="blockEndTime"
                      formControlName="endTime"
                      class="form-control"
                    >
                  </div>
                  <div class="form-group">
                    <label for="blockReason">Motivo</label>
                    <select id="blockReason" formControlName="reason" class="form-control">
                      <option value="personal">Personal</option>
                      <option value="maintenance">Mantenimiento</option>
                    </select>
                  </div>
                </div>

                <button 
                  type="submit" 
                  class="btn btn-outline"
                  [disabled]="blockForm.invalid || availabilityService.isLoading()"
                >
                  + Bloquear Tiempo
                </button>
              </form>

              @if (blockError) {
                <div class="alert alert-error">
                  {{ blockError }}
                </div>
              }

              <!-- Lista de bloqueos existentes -->
              <div class="blocked-slots-list">
                @for (slot of blockedSlots(); track slot.id) {
                  <div class="blocked-slot-item" [class]="'reason-' + slot.reason">
                    <div class="slot-info">
                      <div class="slot-date">{{ formatDate(slot.date) }}</div>
                      <div class="slot-time">{{ slot.startTime }} - {{ slot.endTime }}</div>
                      <div class="slot-reason">{{ getReasonText(slot.reason) }}</div>
                    </div>
                    @if (slot.reason !== 'booking') {
                      <button 
                        class="btn btn-danger btn-sm"
                        (click)="unblockSlot(slot.id)"
                        [disabled]="availabilityService.isLoading()"
                      >
                        Desbloquear
                      </button>
                    }
                  </div>
                } @empty {
                  <div class="empty-state">
                    <p>No tienes tiempo bloqueado</p>
                  </div>
                }
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .availability-page {
      min-height: 100vh;
      background: #f9fafb;
      padding: 2rem 0;
    }

    .container {
      max-width: 1000px;
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

    .availability-content {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 2rem;
    }

    .availability-card,
    .blocked-slots-card {
      background: white;
      border-radius: 1rem;
      padding: 2rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      height: fit-content;
    }

    .availability-card h2,
    .blocked-slots-card h2 {
      font-size: 1.5rem;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 0.5rem;
    }

    .availability-card p,
    .blocked-slots-card p {
      color: #6b7280;
      margin-bottom: 2rem;
    }

    .days-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .day-card {
      padding: 1rem;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      background: #f9fafb;
    }

    .day-header {
      margin-bottom: 0.75rem;
    }

    .day-checkbox {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
    }

    .day-checkbox input[type="checkbox"] {
      width: 18px;
      height: 18px;
    }

    .day-name {
      font-weight: 600;
      color: #374151;
    }

    .time-inputs {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .time-group {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .time-group label {
      font-size: 0.875rem;
      color: #6b7280;
      font-weight: 500;
    }

    .time-input {
      padding: 0.5rem;
    }

    .block-form {
      margin-bottom: 2rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr 1fr;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-group label {
      font-weight: 600;
      color: #374151;
      font-size: 0.875rem;
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

    .blocked-slots-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .blocked-slot-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      border-radius: 0.5rem;
      border: 1px solid #e5e7eb;
    }

    .blocked-slot-item.reason-booking {
      background: #fef3c7;
      border-color: #f59e0b;
    }

    .blocked-slot-item.reason-personal {
      background: #dbeafe;
      border-color: #3b82f6;
    }

    .blocked-slot-item.reason-maintenance {
      background: #fee2e2;
      border-color: #ef4444;
    }

    .slot-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .slot-date {
      font-weight: 600;
      color: #1f2937;
    }

    .slot-time {
      color: #6b7280;
      font-size: 0.875rem;
    }

    .slot-reason {
      color: #3b82f6;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .alert {
      padding: 0.75rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      margin-bottom: 1rem;
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

    .form-actions {
      display: flex;
      justify-content: flex-end;
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
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #2563eb;
    }

    .btn-outline {
      background: transparent;
      color: #3b82f6;
      border: 2px solid #3b82f6;
    }

    .btn-outline:hover:not(:disabled) {
      background: #3b82f6;
      color: white;
    }

    .btn-danger {
      background: #ef4444;
      color: white;
    }

    .btn-danger:hover:not(:disabled) {
      background: #dc2626;
    }

    .btn-sm {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
    }

    .btn:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }

    .empty-state {
      text-align: center;
      padding: 2rem;
      color: #6b7280;
    }

    @media (max-width: 768px) {
      .availability-content {
        grid-template-columns: 1fr;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .time-inputs {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AvailabilityManagementComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  availabilityService = inject(AvailabilityService);
  authService = inject(AuthService);

  availabilityForm: FormGroup;
  blockForm: FormGroup;
  blockedSlots = this.availabilityService.blockedSlots;
  
  availabilityError = '';
  availabilitySuccess = false;
  blockError = '';
  minDate = '';
  
  DAYS_OF_WEEK = DAYS_OF_WEEK;

  constructor() {
    // Formulario de disponibilidad general
    this.availabilityForm = this.fb.group({
      days: this.fb.array([])
    });

    // Formulario de bloqueo manual
    this.blockForm = this.fb.group({
      date: ['', Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      reason: ['personal', Validators.required]
    });

    this.initializeDays();
    
    // Set minimum date to today
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.loadAvailability();
    this.loadBlockedSlots();
  }

  get daysArray(): FormArray {
    return this.availabilityForm.get('days') as FormArray;
  }

  initializeDays(): void {
    const daysArray = this.availabilityForm.get('days') as FormArray;
    
    DAYS_OF_WEEK.forEach((_, index) => {
      daysArray.push(this.fb.group({
        dayOfWeek: [index],
        startTime: ['08:00'],
        endTime: ['18:00'],
        isAvailable: [index >= 1 && index <= 5] // Lunes a Viernes por defecto
      }));
    });
  }

  loadAvailability(): void {
    this.availabilityService.getProfessionalAvailability().subscribe({
      next: (availability) => {
        this.populateAvailabilityForm(availability);
      },
      error: (error) => {
        this.availabilityError = error.message;
      }
    });
  }

  loadBlockedSlots(): void {
    this.availabilityService.getBlockedSlots().subscribe({
      error: (error) => {
        console.error('Error loading blocked slots:', error);
      }
    });
  }

  populateAvailabilityForm(availability: ProfessionalAvailability[]): void {
    const daysArray = this.daysArray;
    
    availability.forEach(avail => {
      const dayControl = daysArray.at(avail.dayOfWeek);
      if (dayControl) {
        dayControl.patchValue({
          startTime: avail.startTime,
          endTime: avail.endTime,
          isAvailable: avail.isAvailable
        });
      }
    });
  }

  saveAvailability(): void {
    if (this.availabilityForm.valid) {
      this.availabilityError = '';
      this.availabilitySuccess = false;

      const formValue = this.availabilityForm.value;
      const availabilityData = formValue.days
        .filter((day: any) => day.isAvailable)
        .map((day: any) => ({
          dayOfWeek: day.dayOfWeek,
          startTime: day.startTime,
          endTime: day.endTime,
          isAvailable: day.isAvailable
        }));

      this.availabilityService.updateAvailability(availabilityData).subscribe({
        next: () => {
          this.availabilitySuccess = true;
          setTimeout(() => {
            this.availabilitySuccess = false;
          }, 3000);
        },
        error: (error) => {
          this.availabilityError = error.message;
        }
      });
    }
  }

  blockTimeSlot(): void {
    if (this.blockForm.valid) {
      this.blockError = '';
      const formValue = this.blockForm.value;

      const blockRequest = {
        date: new Date(formValue.date),
        startTime: formValue.startTime,
        endTime: formValue.endTime,
        reason: formValue.reason
      };

      this.availabilityService.blockTimeSlot(blockRequest).subscribe({
        next: () => {
          this.blockForm.reset({
            reason: 'personal'
          });
        },
        error: (error) => {
          this.blockError = error.message;
        }
      });
    }
  }

  unblockSlot(slotId: string): void {
    this.availabilityService.unblockTimeSlot(slotId).subscribe({
      error: (error) => {
        this.blockError = error.message;
      }
    });
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(date));
  }

  getReasonText(reason: string): string {
    const reasonMap: Record<string, string> = {
      'booking': 'Reserva',
      'personal': 'Personal',
      'maintenance': 'Mantenimiento'
    };
    return reasonMap[reason] || reason;
  }
}