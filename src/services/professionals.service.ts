import { Injectable, signal } from '@angular/core';
import { Observable, of, delay, tap } from 'rxjs';
import { Professional, ServiceCategory } from '../models/professional.model';

@Injectable({
  providedIn: 'root'
})
export class ProfessionalsService {
  private professionalsSignal = signal<Professional[]>([]);
  private categoriesSignal = signal<ServiceCategory[]>([]);
  private isLoadingSignal = signal(false);

  professionals = this.professionalsSignal.asReadonly();
  categories = this.categoriesSignal.asReadonly();
  isLoading = this.isLoadingSignal.asReadonly();

  private mockCategories: ServiceCategory[] = [
    { id: '1', name: 'Plomería', icon: 'wrench', color: '#3B82F6' },
    { id: '2', name: 'Electricidad', icon: 'zap', color: '#F59E0B' },
    { id: '3', name: 'Jardinería', icon: 'flower', color: '#10B981' },
    { id: '4', name: 'Limpieza', icon: 'sparkles', color: '#8B5CF6' },
    { id: '5', name: 'Carpintería', icon: 'hammer', color: '#EF4444' },
    { id: '6', name: 'Pintura', icon: 'palette', color: '#F97316' }
  ];

  private mockProfessionals: Professional[] = [
    {
      id: '1',
      name: 'Carlos Rodríguez',
      category: this.mockCategories[0],
      avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
      rating: 4.8,
      reviewCount: 127,
      hourlyRate: 25,
      description: 'Plomero profesional con más de 10 años de experiencia. Especializado en reparaciones de emergencia y instalaciones nuevas.',
      skills: ['Reparación de tuberías', 'Instalación de grifos', 'Destapado de drenajes', 'Calentadores de agua'],
      availability: [
        { dayOfWeek: 1, startTime: '08:00', endTime: '18:00' },
        { dayOfWeek: 2, startTime: '08:00', endTime: '18:00' },
        { dayOfWeek: 3, startTime: '08:00', endTime: '18:00' },
        { dayOfWeek: 4, startTime: '08:00', endTime: '18:00' },
        { dayOfWeek: 5, startTime: '08:00', endTime: '16:00' },
        { dayOfWeek: 6, startTime: '09:00', endTime: '14:00' }
      ],
      location: 'Ciudad de México',
      experience: 10,
      isVerified: true,
      reviews: [
        {
          id: '1',
          userId: '1',
          userName: 'María González',
          userAvatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&dpr=1',
          rating: 5,
          comment: 'Excelente trabajo, muy profesional y puntual. Resolvió el problema rápidamente.',
          date: new Date('2024-01-15'),
          serviceType: 'Reparación de tubería'
        },
        {
          id: '2',
          userId: '2',
          userName: 'Juan Pérez',
          rating: 4,
          comment: 'Buen servicio, aunque llegó un poco tarde. El trabajo quedó bien hecho.',
          date: new Date('2024-01-10'),
          serviceType: 'Instalación de grifo'
        }
      ]
    },
    {
      id: '2',
      name: 'Ana Martínez',
      category: this.mockCategories[1],
      avatar: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
      rating: 4.9,
      reviewCount: 89,
      hourlyRate: 30,
      description: 'Electricista certificada con especialización en instalaciones residenciales y comerciales. Trabajo garantizado.',
      skills: ['Instalaciones eléctricas', 'Reparación de cortocircuitos', 'Iluminación LED', 'Tableros eléctricos'],
      availability: [
        { dayOfWeek: 1, startTime: '07:00', endTime: '17:00' },
        { dayOfWeek: 2, startTime: '07:00', endTime: '17:00' },
        { dayOfWeek: 3, startTime: '07:00', endTime: '17:00' },
        { dayOfWeek: 4, startTime: '07:00', endTime: '17:00' },
        { dayOfWeek: 5, startTime: '07:00', endTime: '15:00' }
      ],
      location: 'Guadalajara',
      experience: 8,
      isVerified: true,
      reviews: [
        {
          id: '3',
          userId: '3',
          userName: 'Roberto Silva',
          rating: 5,
          comment: 'Muy profesional y conocedora. Instaló toda la iluminación LED de mi casa perfectamente.',
          date: new Date('2024-01-20'),
          serviceType: 'Instalación eléctrica'
        }
      ]
    },
    {
      id: '3',
      name: 'Luis Hernández',
      category: this.mockCategories[2],
      avatar: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
      rating: 4.7,
      reviewCount: 156,
      hourlyRate: 20,
      description: 'Jardinero experto en diseño de paisajes y mantenimiento de jardines. Transformo espacios verdes.',
      skills: ['Diseño de jardines', 'Poda de árboles', 'Sistemas de riego', 'Control de plagas'],
      availability: [
        { dayOfWeek: 1, startTime: '06:00', endTime: '16:00' },
        { dayOfWeek: 2, startTime: '06:00', endTime: '16:00' },
        { dayOfWeek: 3, startTime: '06:00', endTime: '16:00' },
        { dayOfWeek: 4, startTime: '06:00', endTime: '16:00' },
        { dayOfWeek: 5, startTime: '06:00', endTime: '16:00' },
        { dayOfWeek: 6, startTime: '07:00', endTime: '13:00' }
      ],
      location: 'Monterrey',
      experience: 12,
      isVerified: true,
      reviews: [
        {
          id: '4',
          userId: '4',
          userName: 'Carmen López',
          rating: 5,
          comment: 'Transformó completamente mi jardín. Muy creativo y profesional.',
          date: new Date('2024-01-18'),
          serviceType: 'Diseño de jardín'
        }
      ]
    },
    {
      id: '4',
      name: 'Patricia Morales',
      category: this.mockCategories[3],
      avatar: 'https://images.pexels.com/photos/1181424/pexels-photo-1181424.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
      rating: 4.6,
      reviewCount: 203,
      hourlyRate: 18,
      description: 'Servicio de limpieza profesional para hogares y oficinas. Productos ecológicos y atención al detalle.',
      skills: ['Limpieza profunda', 'Limpieza de oficinas', 'Productos ecológicos', 'Limpieza post-construcción'],
      availability: [
        { dayOfWeek: 1, startTime: '08:00', endTime: '18:00' },
        { dayOfWeek: 2, startTime: '08:00', endTime: '18:00' },
        { dayOfWeek: 3, startTime: '08:00', endTime: '18:00' },
        { dayOfWeek: 4, startTime: '08:00', endTime: '18:00' },
        { dayOfWeek: 5, startTime: '08:00', endTime: '18:00' },
        { dayOfWeek: 6, startTime: '09:00', endTime: '15:00' }
      ],
      location: 'Puebla',
      experience: 6,
      isVerified: true,
      reviews: [
        {
          id: '5',
          userId: '5',
          userName: 'Diego Ramírez',
          rating: 4,
          comment: 'Muy detallista en su trabajo. Mi oficina quedó impecable.',
          date: new Date('2024-01-12'),
          serviceType: 'Limpieza de oficina'
        }
      ]
    },
    {
      id: '5',
      name: 'Miguel Torres',
      category: this.mockCategories[4],
      avatar: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
      rating: 4.8,
      reviewCount: 94,
      hourlyRate: 28,
      description: 'Carpintero especializado en muebles a medida y reparaciones. Trabajo artesanal de alta calidad.',
      skills: ['Muebles a medida', 'Reparación de muebles', 'Instalación de puertas', 'Trabajos en madera'],
      availability: [
        { dayOfWeek: 1, startTime: '08:00', endTime: '17:00' },
        { dayOfWeek: 2, startTime: '08:00', endTime: '17:00' },
        { dayOfWeek: 3, startTime: '08:00', endTime: '17:00' },
        { dayOfWeek: 4, startTime: '08:00', endTime: '17:00' },
        { dayOfWeek: 5, startTime: '08:00', endTime: '17:00' }
      ],
      location: 'Tijuana',
      experience: 15,
      isVerified: true,
      reviews: [
        {
          id: '6',
          userId: '6',
          userName: 'Laura Jiménez',
          rating: 5,
          comment: 'Hizo un closet a medida espectacular. Muy profesional y creativo.',
          date: new Date('2024-01-08'),
          serviceType: 'Mueble a medida'
        }
      ]
    },
    {
      id: '6',
      name: 'Fernando Vega',
      category: this.mockCategories[5],
      avatar: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
      rating: 4.5,
      reviewCount: 78,
      hourlyRate: 22,
      description: 'Pintor profesional especializado en interiores y exteriores. Acabados perfectos garantizados.',
      skills: ['Pintura de interiores', 'Pintura de exteriores', 'Texturas decorativas', 'Preparación de superficies'],
      availability: [
        { dayOfWeek: 1, startTime: '07:00', endTime: '16:00' },
        { dayOfWeek: 2, startTime: '07:00', endTime: '16:00' },
        { dayOfWeek: 3, startTime: '07:00', endTime: '16:00' },
        { dayOfWeek: 4, startTime: '07:00', endTime: '16:00' },
        { dayOfWeek: 5, startTime: '07:00', endTime: '16:00' },
        { dayOfWeek: 6, startTime: '08:00', endTime: '14:00' }
      ],
      location: 'Mérida',
      experience: 9,
      isVerified: true,
      reviews: [
        {
          id: '7',
          userId: '7',
          userName: 'Sandra Castro',
          rating: 4,
          comment: 'Buen trabajo en la pintura de mi casa. Muy limpio y ordenado.',
          date: new Date('2024-01-05'),
          serviceType: 'Pintura interior'
        }
      ]
    }
  ];

  constructor() {
    this.categoriesSignal.set(this.mockCategories);
    this.professionalsSignal.set(this.mockProfessionals);
  }

  getProfessionals(categoryId?: string): Observable<Professional[]> {
    this.isLoadingSignal.set(true);
    
    let filteredProfessionals = this.mockProfessionals;
    if (categoryId) {
      filteredProfessionals = this.mockProfessionals.filter(p => p.category.id === categoryId);
    }

    return of(filteredProfessionals).pipe(
      delay(500),
      tap(() => {
        this.professionalsSignal.set(filteredProfessionals);
        this.isLoadingSignal.set(false);
      })
    );
  }

  getProfessionalById(id: string): Observable<Professional | undefined> {
    this.isLoadingSignal.set(true);
    const professional = this.mockProfessionals.find(p => p.id === id);
    
    return of(professional).pipe(
      delay(300),
      tap(() => this.isLoadingSignal.set(false))
    );
  }

  getCategories(): Observable<ServiceCategory[]> {
    return of(this.mockCategories).pipe(delay(200));
  }

  searchProfessionals(query: string): Observable<Professional[]> {
    this.isLoadingSignal.set(true);
    const filtered = this.mockProfessionals.filter(p => 
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.category.name.toLowerCase().includes(query.toLowerCase()) ||
      p.skills.some(skill => skill.toLowerCase().includes(query.toLowerCase()))
    );

    return of(filtered).pipe(
      delay(400),
      tap(() => {
        this.professionalsSignal.set(filtered);
        this.isLoadingSignal.set(false);
      })
    );
  }
}