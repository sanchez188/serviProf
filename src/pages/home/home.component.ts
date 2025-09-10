import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProfessionalsService } from '../../services/professionals.service';
import { ServiceCategory } from '../../models/professional.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="home">
      <!-- Hero Section -->
      <section class="hero">
        <div class="container">
          <div class="hero-content">
            <h1 class="hero-title">
              Encuentra el <span class="highlight">profesional perfecto</span> para tu hogar
            </h1>
            <p class="hero-subtitle">
              Conectamos a miles de usuarios con profesionales verificados en plomería, 
              electricidad, jardinería, limpieza y más.
            </p>
            <div class="hero-actions">
              <a routerLink="/professionals" class="btn btn-primary">
                Explorar Servicios
              </a>
              <a routerLink="/auth/register" class="btn btn-secondary">
                Registrarse Gratis
              </a>
            </div>
          </div>
          <div class="hero-image">
            <img 
              src="https://images.pexels.com/photos/5691659/pexels-photo-5691659.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" 
              alt="Profesionales trabajando"
            >
          </div>
        </div>
      </section>

      <!-- Categories Section -->
      <section class="categories">
        <div class="container">
          <h2 class="section-title">Nuestros Servicios</h2>
          <div class="categories-grid">
            @for (category of categories; track category.id) {
              <a 
                [routerLink]="['/professionals']" 
                [queryParams]="{category: category.id}"
                class="category-card"
                [style.--category-color]="category.color"
              >
                <div class="category-icon">
                  <i [class]="'icon-' + category.icon"></i>
                </div>
                <h3>{{ category.name }}</h3>
                <p>Profesionales verificados</p>
              </a>
            }
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section class="features">
        <div class="container">
          <h2 class="section-title">¿Por qué elegir ServiPro?</h2>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">✅</div>
              <h3>Profesionales Verificados</h3>
              <p>Todos nuestros profesionales pasan por un riguroso proceso de verificación</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">⭐</div>
              <h3>Sistema de Calificaciones</h3>
              <p>Lee reseñas reales de otros usuarios para tomar la mejor decisión</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">📅</div>
              <h3>Reservas Fáciles</h3>
              <p>Agenda servicios de manera rápida y sencilla desde cualquier dispositivo</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">💰</div>
              <h3>Precios Transparentes</h3>
              <p>Conoce el costo exacto antes de contratar, sin sorpresas</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Stats Section -->
      <section class="stats">
        <div class="container">
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-number">1,500+</div>
              <div class="stat-label">Profesionales</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">25,000+</div>
              <div class="stat-label">Servicios Completados</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">4.8</div>
              <div class="stat-label">Calificación Promedio</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">50+</div>
              <div class="stat-label">Ciudades</div>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="cta">
        <div class="container">
          <div class="cta-content">
            <h2>¿Listo para encontrar tu profesional ideal?</h2>
            <p>Únete a miles de usuarios satisfechos que ya confían en ServiPro</p>
            <a routerLink="/professionals" class="btn btn-primary btn-large">
              Comenzar Ahora
            </a>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .home {
      min-height: 100vh;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
    }

    /* Hero Section */
    .hero {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 4rem 0;
      min-height: 80vh;
      display: flex;
      align-items: center;
    }

    .hero .container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 3rem;
      align-items: center;
    }

    .hero-title {
      font-size: 3rem;
      font-weight: bold;
      margin-bottom: 1rem;
      line-height: 1.2;
    }

    .highlight {
      color: #fbbf24;
    }

    .hero-subtitle {
      font-size: 1.2rem;
      margin-bottom: 2rem;
      opacity: 0.9;
      line-height: 1.6;
    }

    .hero-actions {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .hero-image img {
      width: 100%;
      height: 400px;
      object-fit: cover;
      border-radius: 1rem;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    }

    /* Buttons */
    .btn {
      display: inline-block;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      text-decoration: none;
      font-weight: 600;
      transition: all 0.2s ease;
      text-align: center;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover {
      background: #2563eb;
      transform: translateY(-2px);
    }

    .btn-secondary {
      background: transparent;
      color: white;
      border: 2px solid white;
    }

    .btn-secondary:hover {
      background: white;
      color: #667eea;
    }

    .btn-large {
      padding: 1rem 2rem;
      font-size: 1.1rem;
    }

    /* Sections */
    .section-title {
      text-align: center;
      font-size: 2.5rem;
      font-weight: bold;
      margin-bottom: 3rem;
      color: #1f2937;
    }

    /* Categories */
    .categories {
      padding: 4rem 0;
      background: #f9fafb;
    }

    .categories-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
    }

    .category-card {
      background: white;
      padding: 2rem;
      border-radius: 1rem;
      text-align: center;
      text-decoration: none;
      color: inherit;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;
      border: 2px solid transparent;
    }

    .category-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
      border-color: var(--category-color);
    }

    .category-icon {
      width: 80px;
      height: 80px;
      background: var(--category-color);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1rem;
      font-size: 2rem;
      color: white;
    }

    .category-card h3 {
      font-size: 1.5rem;
      font-weight: bold;
      margin-bottom: 0.5rem;
      color: #1f2937;
    }

    .category-card p {
      color: #6b7280;
    }

    /* Features */
    .features {
      padding: 4rem 0;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
    }

    .feature-card {
      text-align: center;
      padding: 2rem;
    }

    .feature-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .feature-card h3 {
      font-size: 1.5rem;
      font-weight: bold;
      margin-bottom: 1rem;
      color: #1f2937;
    }

    .feature-card p {
      color: #6b7280;
      line-height: 1.6;
    }

    /* Stats */
    .stats {
      padding: 4rem 0;
      background: #1f2937;
      color: white;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 2rem;
    }

    .stat-item {
      text-align: center;
    }

    .stat-number {
      font-size: 3rem;
      font-weight: bold;
      color: #fbbf24;
      margin-bottom: 0.5rem;
    }

    .stat-label {
      font-size: 1.1rem;
      opacity: 0.9;
    }

    /* CTA */
    .cta {
      padding: 4rem 0;
      background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
      color: white;
    }

    .cta-content {
      text-align: center;
    }

    .cta h2 {
      font-size: 2.5rem;
      font-weight: bold;
      margin-bottom: 1rem;
    }

    .cta p {
      font-size: 1.2rem;
      margin-bottom: 2rem;
      opacity: 0.9;
    }

    /* Icons */
    .icon-wrench::before { content: '🔧'; }
    .icon-zap::before { content: '⚡'; }
    .icon-flower::before { content: '🌸'; }
    .icon-sparkles::before { content: '✨'; }
    .icon-hammer::before { content: '🔨'; }
    .icon-palette::before { content: '🎨'; }

    /* Responsive */
    @media (max-width: 768px) {
      .hero .container {
        grid-template-columns: 1fr;
        text-align: center;
      }

      .hero-title {
        font-size: 2rem;
      }

      .hero-actions {
        justify-content: center;
      }

      .section-title {
        font-size: 2rem;
      }

      .categories-grid,
      .features-grid {
        grid-template-columns: 1fr;
      }

      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class HomeComponent implements OnInit {
  private professionalsService = inject(ProfessionalsService);
  
  categories: ServiceCategory[] = [];

  ngOnInit(): void {
    this.professionalsService.getCategories().subscribe(categories => {
      this.categories = categories;
    });
  }
}