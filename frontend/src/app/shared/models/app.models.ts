/**
 * Domain models ported from the React prototype `types.ts`.
 * These are used for mock/demo data; real API models live in `api/generated/`.
 */

export interface Tutor {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  subject: string;
  subjects: string[];
  hourlyRate: number;
  experience: string;
  experienceYears: number;
  location: string;
  bio: string;
  isTop?: boolean;
}

export interface ActivityClass {
  id: string;
  title: string;
  tutorName: string;
  timeString: string;
  status: 'online' | 'waiting' | 'pending_payment';
  countdownSeconds?: number;
}

export interface StudentRequest {
  id: string;
  subject: string;
  grade: string;
  hourlyRate: number;
  schedule: string[];
  startDate: string;
  status: 'draft' | 'submitted' | 'accepted' | 'declined';
  tutorName?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  category: 'action' | 'system' | 'news';
  isUnread: boolean;
  timeAgo: string;
}

export interface Review {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  comment: string;
}
