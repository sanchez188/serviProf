export interface User {
  id: string;
  email: string;
  name: string;
  userType: UserType;
  phone?: string;
  address?: string;
  avatar?: string;
  createdAt: Date;
  // Professional-specific fields
  professionalProfile?: ProfessionalProfile;
}

export enum UserType {
  CLIENT = 'client'
}

export interface ProfessionalProfile {
  categoryId: string;
  hourlyRate: number;
  description: string;
  skills: string[];
  experience: number;
  location: string;
  availability: Availability[];
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  completedJobs: number;
}

export interface Availability {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  userType: UserType;
  phone?: string;
}