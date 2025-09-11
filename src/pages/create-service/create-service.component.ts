import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { ServicesService } from '../../services/services.service';
import { ProfessionalsService } from '../../services/professionals.service';
import { ServiceCategory } from '../../models/professional.model';
import { PriceType } from '../../models/service.model';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-create-service',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoadingSpinnerComponent],
  template: `
    <div class="create-service-page">
      <div class="container">
        <div class="page-header">
          <h1>Crear Nuevo Servicio</h1>
          <p>Ofrece tus servicios y comienza a recibir clientes</p>
        </div>

        <div class="create-service-card">
          <form [formGroup]="serviceForm" (ngSubmit)="onSubmit()" class="service-form">
            <!-- Información Básica -->
            <div class="form-section">
              <h3>Información Básica</h3>

              <div class="form-group">
                <label for="title">Título del Servicio</label>
                <input
                  type="text"
                  id="title"
                  formControlName="title"
                  class="form-control"
                  placeholder="Ej: Reparación de tuberías y plomería"
                >
                @if (serviceForm.get('title')?.invalid && serviceForm.get('title')?.touched) {
                  <div class="error-message">El título es requerido</div>
                }
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="category">Categoría</label>
                  <select
                    id="category"
                    formControlName="categoryId"
                    class="form-control"
                  >
                    <option value="">Selecciona una categoría</option>
                    @for (category of categories; track category.id) {
                      <option [value]="category.id">{{ category.name }}</option>
                    }
                  </select>
                  @if (serviceForm.get('categoryId')?.invalid && serviceForm.get('categoryId')?.touched) {
                    <div class="error-message">Selecciona una categoría</div>
                  }
                </div>

                <div class="form-group">
                  <label for="location">Ubicación</label>
                  <input
                    type="text"
                    id="location"
                    formControlName="location"
                    class="form-control"
                    placeholder="Ciudad, Estado"
                  >
                  @if (serviceForm.get('location')?.invalid && serviceForm.get('location')?.touched) {
                    <div class="error-message">La ubicación es requerida</div>
                  }
                </div>
              </div>

              <div class="form-group">
                <label for="description">Descripción del Servicio</label>
                <textarea
                  id="description"
                  formControlName="description"
                  class="form-control"
                  rows="4"
                  placeholder="Describe detalladamente tu servicio, experiencia y lo que incluye..."
                ></textarea>
                @if (serviceForm.get('description')?.invalid && serviceForm.get('description')?.touched) {
                  <div class="error-message">La descripción es requerida</div>
                }
              </div>
            </div>

            <!-- Precios -->
            <div class="form-section">
              <h3>Precios</h3>

              <div class="form-group">
                <label>Tipo de Precio</label>
                <div class="price-type-selector">
                  <label class="price-type-option">
                    <input
                      type="radio"
                      formControlName="priceType"
                      [value]="PriceType.FIXED"
                    >
                    <div class="option-content">
                      <div class="option-icon">💰</div>
                      <div class="option-text">
                        <strong>Precio Fijo</strong>
                        <span>Un precio fijo por el servicio completo</span>
                      </div>
                    </div>
                  </label>
                  <label class="price-type-option">
                    <input
                      type="radio"
                      formControlName="priceType"
                      [value]="PriceType.HOURLY"
                    >
                    <div class="option-content">
                      <div class="option-icon">⏰</div>
                      <div class="option-text">
                        <strong>Por Hora</strong>
                        <span>Cobrar por hora de trabajo</span>
                      </div>
                    </div>
                  </label>
                  <label class="price-type-option">
                    <input
                      type="radio"
                      formControlName="priceType"
                      [value]="PriceType.NEGOTIABLE"
                    >
                    <div class="option-content">
                      <div class="option-icon">🤝</div>
                      <div class="option-text">
                        <strong>Negociable</strong>
                        <span>El precio se acuerda con el cliente</span>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              @if (serviceForm.get('priceType')?.value === PriceType.FIXED) {
                <div class="form-group">
                  <label for="price">Precio Fijo ($)</label>
                  <input
                    type="number"
                    id="price"
                    formControlName="price"
                    class="form-control"
                    min="1"
                    placeholder="150"
                  >
                  @if (serviceForm.get('price')?.invalid && serviceForm.get('price')?.touched) {
                    <div class="error-message">Ingresa un precio válido</div>
                  }
                </div>
              }

              @if (serviceForm.get('priceType')?.value === PriceType.HOURLY) {
                <div class="form-group">
                  <label for="hourlyRate">Tarifa por Hora ($)</label>
                  <input
                    type="number"
                    id="hourlyRate"
                    formControlName="hourlyRate"
                    class="form-control"
                    min="1"
                    placeholder="25"
                  >
                  @if (serviceForm.get('hourlyRate')?.invalid && serviceForm.get('hourlyRate')?.touched) {
                    <div class="error-message">Ingresa una tarifa válida</div>
                  }
                </div>
              }
            </div>

            <!-- Tags -->
            <div class="form-section">
              <h3>Etiquetas y Especialidades</h3>
              <div class="tags-section">
                <div formArrayName="tags" class="tags-list">
                  @for (tag of tagsArray.controls; track $index; let i = $index) {
                    <div class="tag-input-group">
                      <input
                        type="text"
                        [formControlName]="i"
                        class="form-control"
                        placeholder="Ej: Reparaciones urgentes"
                      >
                      <button
                        type="button"
                        class="btn btn-danger btn-sm"
                        (click)="removeTag(i)"
                        [disabled]="tagsArray.length <= 1"
                      >
                        ×
                      </button>
                    </div>
                  }
                </div>
                <button
                  type="button"
                  class="btn btn-outline"
                  (click)="addTag()"
                  [disabled]="tagsArray.length >= 10"
                >
                  + Agregar Etiqueta
                </button>
              </div>
            </div>

            @if (errorMessage) {
              <div class="alert alert-error">
                {{ errorMessage }}
              </div>
            }

            <div class="form-actions">
              <button
                type="button"
                class="btn btn-secondary"
                (click)="goBack()"
              >
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
                  Crear Servicio
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .create-service-page {
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

    .create-service-card {
      background: white;
      border-radius: 1rem;
      padding: 3rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }

    .service-form {
      display: flex;
      flex-direction: column;
      gap: 3rem;
    }

    .form-section {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .form-section h3 {
      font-size: 1.5rem;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 0.5rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #e5e7eb;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
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

    .error-message {
      color: #ef4444;
      font-size: 0.875rem;
    }

    .price-type-selector {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 0.5rem;
    }

    .price-type-option {
      cursor: pointer;
    }

    .price-type-option input[type="radio"] {
      display: none;
    }

    .option-content {
      padding: 1rem;
      border: 2px solid #e5e7eb;
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      transition: all 0.2s ease;
    }

    .price-type-option input[type="radio"]:checked + .option-content {
      border-color: #3b82f6;
      background: #eff6ff;
    }

    .option-content:hover {
      border-color: #3b82f6;
    }

    .option-icon {
      font-size: 1.5rem;
    }

    .option-text {
      display: flex;
      flex-direction: column;
    }

    .option-text strong {
      color: #1f2937;
      margin-bottom: 0.25rem;
    }

    .option-text span {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .tags-section {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .tags-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .tag-input-group {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .tag-input-group .form-control {
      flex: 1;
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

    .form-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      padding-top: 2rem;
      border-top: 1px solid #e5e7eb;
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

    .btn-secondary {
      background: #6b7280;
      color: white;
    }

    .btn-secondary:hover {
      background: #4b5563;
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

    .btn-danger {
      background: #ef4444;
      color: white;
    }

    .btn-danger:hover:not(:disabled) {
      background: #dc2626;
    }

    .btn-sm {
      padding: 0.5rem;
      font-size: 0.875rem;
      min-width: 32px;
    }

    .btn:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }

    @media (max-width: 768px) {
      .create-service-card {
        padding: 2rem;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .form-actions {
        flex-direction: column;
      }
    }
  `]
})
export class CreateServiceComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  servicesService = inject(ServicesService);
  private professionalsService = inject(ProfessionalsService);

  serviceForm: FormGroup;
  categories: ServiceCategory[] = [];
  errorMessage = '';
  PriceType = PriceType;

  constructor() {
    this.serviceForm = this.fb.group({
      title: ['', Validators.required],
      categoryId: ['', Validators.required],
      location: ['', Validators.required],
      description: ['', Validators.required],
      priceType: [PriceType.FIXED, Validators.required],
      price: [''],
      hourlyRate: [''],
      tags: this.fb.array([this.fb.control('')])
    });

    // Add conditional validators based on price type
    this.serviceForm.get('priceType')?.valueChanges.subscribe(priceType => {
      const priceControl = this.serviceForm.get('price');
      const hourlyRateControl = this.serviceForm.get('hourlyRate');

      // Clear previous validators
      priceControl?.clearValidators();
      hourlyRateControl?.clearValidators();

      if (priceType === PriceType.FIXED) {
        priceControl?.setValidators([Validators.required, Validators.min(1)]);
      } else if (priceType === PriceType.HOURLY) {
        hourlyRateControl?.setValidators([Validators.required, Validators.min(1)]);
      }

      priceControl?.updateValueAndValidity();
      hourlyRateControl?.updateValueAndValidity();
    });
  }

  ngOnInit(): void {
    this.professionalsService.getCategories().subscribe(categories => {
      this.categories = categories;
    });
  }

  get tagsArray(): FormArray {
    return this.serviceForm.get('tags') as FormArray;
  }

  addTag(): void {
    if (this.tagsArray.length < 10) {
      this.tagsArray.push(this.fb.control(''));
    }
  }

  removeTag(index: number): void {
    if (this.tagsArray.length > 1) {
      this.tagsArray.removeAt(index);
    }
  }

  onSubmit(): void {
    if (this.serviceForm.valid) {
      this.errorMessage = '';
      const formValue = this.serviceForm.value;

      // Filter out empty tags
      const tags = formValue.tags.filter((tag: string) => tag.trim());

      const serviceData = {
        categoryId: formValue.categoryId,
        title: formValue.title,
        description: formValue.description,
        priceType: formValue.priceType,
        price: formValue.priceType === PriceType.FIXED ? formValue.price : undefined,
        hourlyRate: formValue.priceType === PriceType.HOURLY ? formValue.hourlyRate : undefined,
        location: formValue.location,
        tags
      };

      this.servicesService.createService(serviceData).subscribe({
        next: () => {
          this.router.navigate(['/my-services']);
        },
        error: (error) => {
          this.errorMessage = error.message;
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/my-services']);
  }
}