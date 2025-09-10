export interface Professional {
  id: string;
  name: string;
  category: ServiceCategory;
  avatar: string;
  rating: number;
  reviewCount: number;
  hourlyRate: number;
  description: string;
  skills: string[];
  availability: Availability[];
  location: string;
  experience: number;
  reviews: Review[];
  isVerified: boolean;
}

export interface ServiceCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Availability {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  startTime: string;
  endTime: string;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  date: Date;
  serviceType: string;
}