import { Component, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormArray,
} from "@angular/forms";
import { Router } from "@angular/router";
import { AuthService } from "../../services/auth.service";
import { ProfessionalsService } from "../../services/professionals.service";
import { LoadingSpinnerComponent } from "../../components/loading-spinner/loading-spinner.component";
import { ServiceCategory, Availability } from "../../models/professional.model";
import { UserType } from "../../models/user.model";

@Component({
  selector: "app-professional-profile-setup",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoadingSpinnerComponent],
  template: `
    <div class="profile-setup-page">
      <div class="container">
        <div class="setup-header">
          <h1>Configura tu Perfil Profesional</h1>
          <p>
            Completa tu información para comenzar a recibir solicitudes de
            trabajo
          </p>
        </div>

        <div class="setup-card">
          <form
            [formGroup]="profileForm"
            (ngSubmit)="onSubmit()"
            class="setup-form"
          >
            <!-- Basic Information -->
            <div class="form-section">
              <h3>Información Básica</h3>

              <div class="form-row">
                <div class="form-group">
                  <label for="category">Categoría de Servicio</label>
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
                  @if (profileForm.get('categoryId')?.invalid &&
                  profileForm.get('categoryId')?.touched) {
                  <div class="error-message">Selecciona una categoría</div>
                  }
                </div>

                <div class="form-group">
                  <label for="hourlyRate">Tarifa por Hora ($)</label>
                  <input
                    type="number"
                    id="hourlyRate"
                    formControlName="hourlyRate"
                    class="form-control"
                    min="1"
                    placeholder="25"
                  />
                  @if (profileForm.get('hourlyRate')?.invalid &&
                  profileForm.get('hourlyRate')?.touched) {
                  <div class="error-message">Ingresa una tarifa válida</div>
                  }
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="experience">Años de Experiencia</label>
                  <input
                    type="number"
                    id="experience"
                    formControlName="experience"
                    class="form-control"
                    min="0"
                    placeholder="5"
                  />
                  @if (profileForm.get('experience')?.invalid &&
                  profileForm.get('experience')?.touched) {
                  <div class="error-message">
                    Ingresa los años de experiencia
                  </div>
                  }
                </div>

                <div class="form-group">
                  <label for="location">Ubicación</label>
                  <input
                    type="text"
                    id="location"
                    formControlName="location"
                    class="form-control"
                    placeholder="Ciudad de México"
                  />
                  @if (profileForm.get('location')?.invalid &&
                  profileForm.get('location')?.touched) {
                  <div class="error-message">Ingresa tu ubicación</div>
                  }
                </div>
              </div>

              <div class="form-group">
                <label for="description">Descripción de tus Servicios</label>
                <textarea
                  id="description"
                  formControlName="description"
                  class="form-control"
                  rows="4"
                  placeholder="Describe tu experiencia, especialidades y lo que te hace único como profesional..."
                ></textarea>
                @if (profileForm.get('description')?.invalid &&
                profileForm.get('description')?.touched) {
                <div class="error-message">Describe tus servicios</div>
                }
              </div>
            </div>

            <!-- Skills -->
            <div class="form-section">
              <h3>Habilidades y Especialidades</h3>
              <div class="skills-section">
                <div formArrayName="skills" class="skills-list">
                  @for (skill of skillsArray.controls; track $index; let i =
                  $index) {
                  <div class="skill-input-group">
                    <input
                      type="text"
                      [formControlName]="i"
                      class="form-control"
                      placeholder="Ej: Reparación de tuberías"
                    />
                    <button
                      type="button"
                      class="btn btn-danger btn-sm"
                      (click)="removeSkill(i)"
                      [disabled]="skillsArray.length <= 1"
                    >
                      ×
                    </button>
                  </div>
                  }
                </div>
                <button
                  type="button"
                  class="btn btn-outline"
                  (click)="addSkill()"
                  [disabled]="skillsArray.length >= 10"
                >
                  + Agregar Habilidad
                </button>
              </div>
            </div>

            <!-- Availability -->
            <div class="form-section">
              <h3>Disponibilidad</h3>
              <div class="availability-section">
                <div formArrayName="availability" class="availability-list">
                  @for (day of availabilityArray.controls; track $index; let i =
                  $index) {
                  <div [formGroupName]="i" class="availability-day">
                    <div class="day-header">
                      <label class="day-checkbox">
                        <input type="checkbox" formControlName="isAvailable" />
                        <span>{{ getDayName(i) }}</span>
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
                        />
                      </div>
                      <div class="time-group">
                        <label>Hasta:</label>
                        <input
                          type="time"
                          formControlName="endTime"
                          class="form-control time-input"
                        />
                      </div>
                    </div>
                    }
                  </div>
                  }
                </div>
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
                [disabled]="profileForm.invalid || authService.isLoading()"
              >
                @if (authService.isLoading()) {
                <app-loading-spinner></app-loading-spinner>
                } @else { Guardar Perfil }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .profile-setup-page {
        min-height: 100vh;
        background: #f9fafb;
        padding: 2rem 0;
      }

      .container {
        max-width: 800px;
        margin: 0 auto;
        padding: 0 1rem;
      }

      .setup-header {
        text-align: center;
        margin-bottom: 3rem;
      }

      .setup-header h1 {
        font-size: 2.5rem;
        font-weight: bold;
        color: #1f2937;
        margin-bottom: 0.5rem;
      }

      .setup-header p {
        font-size: 1.2rem;
        color: #6b7280;
      }

      .setup-card {
        background: white;
        border-radius: 1rem;
        padding: 3rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      }

      .setup-form {
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

      .skills-section {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .skills-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .skill-input-group {
        display: flex;
        gap: 0.5rem;
        align-items: center;
      }

      .skill-input-group .form-control {
        flex: 1;
      }

      .availability-section {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .availability-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .availability-day {
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
        font-weight: 600;
        color: #374151;
      }

      .day-checkbox input[type="checkbox"] {
        width: 18px;
        height: 18px;
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
      }

      .time-input {
        padding: 0.5rem;
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
        .setup-card {
          padding: 2rem;
        }

        .form-row {
          grid-template-columns: 1fr;
        }

        .time-inputs {
          grid-template-columns: 1fr;
        }

        .form-actions {
          flex-direction: column;
        }
      }
    `,
  ],
})
export class ProfessionalProfileSetupComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  authService = inject(AuthService);
  private professionalsService = inject(ProfessionalsService);

  profileForm: FormGroup;
  categories: ServiceCategory[] = [];
  errorMessage = "";

  constructor() {
    this.profileForm = this.fb.group({
      categoryId: ["", Validators.required],
      hourlyRate: ["", [Validators.required, Validators.min(1)]],
      experience: ["", [Validators.required, Validators.min(0)]],
      location: ["", Validators.required],
      description: ["", Validators.required],
      skills: this.fb.array([this.fb.control("", Validators.required)]),
      availability: this.fb.array([]),
    });

    this.initializeAvailability();
  }

  ngOnInit(): void {
    // Load categories
    this.professionalsService.getCategories().subscribe((categories) => {
      this.categories = categories;
    });

    const currentUser = this.authService.currentUser();
    // If user already has a professional profile, populate the form
    if (currentUser?.professionalProfile) {
      this.populateForm(currentUser.professionalProfile);
    }
  }

  get skillsArray(): FormArray {
    return this.profileForm.get("skills") as FormArray;
  }

  get availabilityArray(): FormArray {
    return this.profileForm.get("availability") as FormArray;
  }

  initializeAvailability(): void {
    const days = [
      "Domingo",
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
    ];
    const availabilityArray = this.profileForm.get("availability") as FormArray;

    days.forEach((_, index) => {
      availabilityArray.push(
        this.fb.group({
          dayOfWeek: [index],
          startTime: ["08:00"],
          endTime: ["18:00"],
          isAvailable: [index >= 1 && index <= 5], // Monday to Friday by default
        })
      );
    });
  }

  populateForm(profile: any): void {
    this.profileForm.patchValue({
      categoryId: profile.categoryId,
      hourlyRate: profile.hourlyRate,
      experience: profile.experience,
      location: profile.location,
      description: profile.description,
    });

    // Populate skills
    const skillsArray = this.profileForm.get("skills") as FormArray;
    skillsArray.clear();
    profile.skills.forEach((skill: string) => {
      skillsArray.push(this.fb.control(skill, Validators.required));
    });

    // Populate availability
    const availabilityArray = this.profileForm.get("availability") as FormArray;
    profile.availability.forEach((avail: Availability, index: number) => {
      const dayGroup = availabilityArray.at(index);
      if (dayGroup) {
        dayGroup.patchValue({
          startTime: avail.startTime,
          endTime: avail.endTime,
          //   isAvailable: avail.isAvailable
        });
      }
    });
  }

  addSkill(): void {
    if (this.skillsArray.length < 10) {
      this.skillsArray.push(this.fb.control("", Validators.required));
    }
  }

  removeSkill(index: number): void {
    if (this.skillsArray.length > 1) {
      this.skillsArray.removeAt(index);
    }
  }

  getDayName(index: number): string {
    const days = [
      "Domingo",
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
    ];
    return days[index];
  }

  onSubmit(): void {
    if (this.profileForm.valid) {
      this.errorMessage = "";
      const formValue = this.profileForm.value;

      // Filter out empty skills
      const skills = formValue.skills.filter((skill: string) => skill.trim());

      // Filter availability for only available days
      const availability = formValue.availability.filter(
        (day: any) => day.isAvailable
      );

      const professionalProfile = {
        categoryId: formValue.categoryId,
        hourlyRate: formValue.hourlyRate,
        experience: formValue.experience,
        location: formValue.location,
        description: formValue.description,
        skills,
        availability,
        isVerified: false,
        rating: 0,
        reviewCount: 0,
        completedJobs: 0,
      };

      // Update user profile with professional data
      this.authService.updateProfile({ professionalProfile }).subscribe({
        next: () => {
          this.router.navigate(["/professional-dashboard"]);
        },
        error: (error) => {
          this.errorMessage = error.message;
        },
      });
    }
  }

  goBack(): void {
    this.router.navigate(["/"]);
  }
}
