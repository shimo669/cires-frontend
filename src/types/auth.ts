export type UserRole = 'CITIZEN' | 'LEADER' | 'ADMIN';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  nationalId: string;
  locationId?: number;
}

export interface AuthResponse {
  token?: string;
  username: string;
  email: string;
  nationalId: string;
  role: UserRole;
  locationId?: number | null;
  locationName?: string | null;
  fullRwandanAddress?: string | null;
  levelType?: string;
}

export interface User {
  username: string;
  email: string;
  nationalId: string;
  role: UserRole;
  locationId?: number | null;
  locationName?: string | null;
  fullRwandanAddress?: string | null;
  levelType?: string;
}

