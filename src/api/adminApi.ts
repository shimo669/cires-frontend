import type { RoleUpdateDTO, UserResponseDTO } from '../types/admin';
import api from './axios';

const unwrapData = <T>(payload: unknown): T => {
  const wrapped = payload as { data?: T };
  return wrapped.data ?? (payload as T);
};

export const getAllUsers = async (): Promise<UserResponseDTO[]> => {
  const response = await api.get('/admin/users');
  return unwrapData<UserResponseDTO[]>(response.data);
};

export const updateUserRole = async (userId: number, roleName: string) => {
  const payload: RoleUpdateDTO = { roleName };
  const response = await api.put(`/admin/users/${userId}/role`, payload);
  return response.data;
};

