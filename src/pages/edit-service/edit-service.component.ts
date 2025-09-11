import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ServicesService } from '../../services/services.service';
import { Service, ServiceCategory, PriceType } from '../../models/service.model';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-edit-service',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LoadingSpinnerComponent
  ],
  template: `
    <div class="edit-service-page">
      <div class="container">
        <div class="page-header">
          <h1>Editar Servicio</h1>
          <p>Actualiza la información de tu servicio</p>
        </div>

        @if (servicesService.isLoading()) {
          <app-loading-spinner></app-loading-spinner>
        } @else if (serviceForm) {
          <form [formGroup]="serviceForm" (ngSubmit)="onSubmit()" class="service-form">
            <div class="form-grid">
              <div class="form-group">
                <label for="title">Título del Servicio *</label>
                <input
                  type="text"
                  id="title"
                  formControlName="title"
                  class="form-control"
                  placeholder="Ej: Plomería residencial"
                >
                @if (serviceForm.get('title')?.invalid && serviceForm.get('title')?.touched) {
                  <div class="error-message">El título es requerido</div>
                }
              </div>

              <div class="form-group">
                <label for="category">Categoría *</label>
                <select id="category" formControlName="categoryId" class="form-control">
                  <option value="">Selecciona una categoría</option>
                  @for (category of categories; track category.id) {
                    <option [value]="category.id">{{ category.name }}</option>
                  }
                </select>
                @if (serviceForm.get('categoryId')?.invalid && serviceForm.get('categoryId')?.touched) {
                  <div class="error-message">La categoría es requerida</div>
                }
              </div>

              <div class="form-group">
                <label for="location">Ubicación *</label>
                <input
                  type="text"
                  id="location"
                  formControlName="location"
                  class="form-control"
                  placeholder="Ej: Ciudad de México, CDMX"
                >
                @if (serviceForm.get('location')?.invalid && serviceForm.get('location')?.touched) {
                  <div class="error-message">La ubicación es requerida</div>
                }
              </div>

              <div class="form-group">
                <label for="priceType">Tipo de Precio *</label>
                <select id="priceType" formControlName="priceType" class="form-control">
                  <option value="fixed">Precio Fijo</option>
                  <option value="hourly">Por Hora</option>
                  <option value="negotiable">Negociable</option>
                </select>
              </div>

              @if (serviceForm.get('priceType')?.value === 'fixed') {
                <div class="form-group">
                  <label for="price">Precio Fijo *</label>
                  <input
                    type="number"
                    id="price"
                    formControlName="price"
                    class="form-control"
                    placeholder="0"
                    min="0"
                  >
                </div>
              }

              @if (serviceForm.get('priceType')?.value === 'hourly') {
                <div class="form-group">
                  <label for="hourlyRate">Precio por Hora *</label>
                  <input
                    type="number"
                    id="hourlyRate"
                    formControlName="hourlyRate"
                    class="form-control"
                    placeholder="0"
                    min="0"
                  >
                </div>
              }
            </div>

            <div class="form-group">
              <label for="description">Descripción *</label>
              <textarea
                id="description"
                formControlName="description"
                class="form-control"
                rows="4"
                placeholder="Describe tu servicio, experiencia y lo que incluye..."
              ></textarea>
              @if (serviceForm.get('description')?.invalid && serviceForm.get('description')?.touched) {
                <div class="error-message">La descripción es requerida</div>
              }
            </div>

            <div class="form-group">
              <label for="tags">Etiquetas</label>
              <input
                type="text"
                id="tags"
                formControlName="tagsInput"
                class="form-control"
                placeholder="Ej: reparación, instalación, emergencias (separadas por comas)"
              >
              <small class="form-help">Separa las etiquetas con comas</small>
            </div>

            <div class="form-actions">
              <button type="button" class="btn btn-secondary" (click)="goBack()">
                Cancelar
              </button>
              <button 
                type="submit" 
                class="btn btn-primary"
                [disabled]="serviceForm.invalid || servicesService.isLoading()"
              >
                @if (servicesService.isLoading()) {
                  <app-loading-spinner></app-loading-spinner>
                } @else {
                  Actualizar Servicio
                }
              </button>
            </div>
          </form>
        }
      </div>
    </div>
  `,
  styles: [`
    .edit-service-page {
      min-height: 100vh;
      background: #f9fafb;
      padding: 2rem 0;
    }

    .container {
      max-width: 800px;
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

    .service-form {
      background: white;
      border-radius: 1rem;
      padding: 2rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
    }

    .form-group label {
      font-weight: 600;
      color: #374151;
      margin-bottom: 0.5rem;
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

    .form-control.invalid {
      border-color: #ef4444;
    }

    .form-help {
      color: #6b7280;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }

    .error-message {
      color: #ef4444;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 2rem;
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
      border: none;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #2563eb;
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

    @media (max-width: 768px) {
      .form-grid {
        grid-template-columns: 1fr;
      }

      .form-actions {
        flex-direction: column;
      }
    }
  `]
})
export class EditServiceComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  servicesService = inject(ServicesService);

  serviceForm!: FormGroup;
  serviceId!: string;
  categories: ServiceCategory[] = [
    { id: '1', name: 'Plomería', icon: '🔧', color: '#3b82f6' },
    { id: '2', name: 'Electricidad', icon: '⚡', color: '#f59e0b' },
    { id: '3', name: 'Carpintería', icon: '🔨', color: '#8b5cf6' },
    { id: '4', name: 'Pintura', icon: '🎨', color: '#10b981' },
    { id: '5', name: 'Jardinería', icon: '🌱', color: '#06b6d4' },
    { id: '6', name: 'Limpieza', icon: '🧹', color: '#f97316' },
    { id: '7', name: 'Tecnología', icon: '💻', color: '#6366f1' },
    { id: '8', name: 'Automotriz', icon: '🚗', color: '#ef4444' }
  ];

  ngOnInit(): void {
    this.serviceId = this.route.snapshot.paramMap.get('id')!;
    this.initializeForm();
    this.loadService();
  }

  private initializeForm(): void {
    this.serviceForm = this.fb.group({
      title: ['', [Validators.required]],
      categoryId: ['', [Validators.required]],
      description: ['', [Validators.required]],
      location: ['', [Validators.required]],
      priceType: ['fixed', [Validators.required]],
      price: [0],
      hourlyRate: [0],
      tagsInput: ['']
    });

    // Watch for price type changes
    this.serviceForm.get('priceType')?.valueChanges.subscribe(priceType => {
      const priceControl = this.serviceForm.get('price');
      const hourlyRateControl = this.serviceForm.get('hourlyRate');

      if (priceType === 'fixed') {
        priceControl?.setValidators([Validators.required, Validators.min(1)]);
        hourlyRateControl?.clearValidators();
      } else if (priceType === 'hourly') {
        hourlyRateControl?.setValidators([Validators.required, Validators.min(1)]);
        priceControl?.clearValidators();
      } else {
        priceControl?.clearValidators();
        hourlyRateControl?.clearValidators();
      }

      priceControl?.updateValueAndValidity();
      hourlyRateControl?.updateValueAndValidity();
    });
  }

  private loadService(): void {
    this.servicesService.getServiceById(this.serviceId).subscribe({
      next: (service) => {
        if (service) {
          this.serviceForm.patchValue({
            title: service.title,
            categoryId: service.categoryId,
            description: service.description,
            location: service.location,
            priceType: service.priceType,
            price: service.price || 0,
            hourlyRate: service.hourlyRate || 0,
            tagsInput: service.tags?.join(', ') || ''
          });
        }
      },
      error: (error) => {
        console.error('Error loading service:', error);
        this.router.navigate(['/my-services']);
      }
    });
  }

  onSubmit(): void {
    if (this.serviceForm.valid) {
      const formValue = this.serviceForm.value;
      const tags = formValue.tagsInput 
        ? formValue.tagsInput.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag)
        : [];

      const serviceData: Partial<Service> = {
        title: formValue.title,
        categoryId: formValue.categoryId,
        description: formValue.description,
        location: formValue.location,
        priceType: formValue.priceType as PriceType,
        tags
      };

      if (formValue.priceType === 'fixed') {
        serviceData.price = formValue.price;
      } else if (formValue.priceType === 'hourly') {
        serviceData.hourlyRate = formValue.hourlyRate;
      }

      this.servicesService.updateService(this.serviceId, serviceData).subscribe({
        next: () => {
          this.router.navigate(['/my-services']);
        },
        error: (error) => {
          console.error('Error updating service:', error);
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/my-services']);
  }
}