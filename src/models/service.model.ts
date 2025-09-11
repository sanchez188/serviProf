export interface Service {
  id: string;
  userId: string;
  categoryId: string;
  title: string;
  description: string;
  priceType: PriceType;
  price?: number;
  hourlyRate?: number;
  location: string;
  isActive: boolean;
  images: string[];
  tags: string[];
  availabilitySchedule: AvailabilitySchedule;
  rating: number;
  reviewCount: number;
  review_count: number;
  totalOrders: number;
  createdAt: Date;
  updatedAt: Date;
  
  // Relaciones
  user?: {
    id: string;
    name: string;
    avatar: string;
    email: string;
  };
  category?: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
  reviews?: ServiceReview[];
}

export enum PriceType {
  FIXED = 'fixed',
  HOURLY = 'hourly',
  NEGOTIABLE = 'negotiable'
}

export interface AvailabilitySchedule {
  [key: string]: {
    available: boolean;
    startTime?: string;
    endTime?: string;
  };
}

export interface ServiceReview {
  id: string;
  userId: string;
  serviceId: string;
  bookingId?: string;
  rating: number;
  comment: string;
  createdAt: Date;
  user: {
    name: string;
    avatar: string;
  };
}

export interface CreateServiceRequest {
  categoryId: string;
  title: string;
  description: string;
  priceType: PriceType;
  price?: number;
  hourlyRate?: number;
  location: string;
  images?: string[];
  tags?: string[];
  availabilitySchedule?: AvailabilitySchedule;
}

export interface UpdateServiceRequest extends Partial<CreateServiceRequest> {
  isActive?: boolean;
}