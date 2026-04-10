import type { AddressHierarchyRequest } from './geo';

export type UserRole = 'CITIZEN' | 'LEADER' | 'ADMIN';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest extends AddressHierarchyRequest {
  username: string;
  email: string;
  password: string;
  nationalId: string;
}

export interface AuthResponse {
  token: string;
  username: string;
  role: UserRole;
}

export interface User {
  username: string;
  email: string;
  nationalId: string;
  role: UserRole;
  provinceId?: number;
  districtId?: number;
  sectorId?: number;
  cellId?: number;
  villageId?: number;
}