export interface Booking {
  id: string;
  userId: string;
  professionalId: string;
  client: {
    name: string;
    avatar: string;
    phone?: string;
  };
  professional: {
    name: string;
    avatar: string;
    category: string;
  };
  date: Date;
  startTime: string;
  endTime: string;
  hours: number;
  totalPrice: number;
  status: BookingStatus;
  description?: string;
  createdAt: Date;
  completedAt?: Date;
  acceptedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  review?: {
    rating: number;
    comment: string;
    date: Date;
  };
}

export enum BookingStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface BookingRequest {
  serviceId: string;
  date: Date;
  startTime: string;
  hours: number;
  description?: string;
}