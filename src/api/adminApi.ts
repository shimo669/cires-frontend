import type { RoleUpdateDTO, UserResponseDTO } from '../types/admin';
import api from './axios';
import { extractApiMessage, unwrapApiData } from './responseUtils';

export const getAllUsers = async (): Promise<UserResponseDTO[]> => {
  const response = await api.get('/admin/users');
  return unwrapApiData<UserResponseDTO[]>(response.data);
};

export const updateUserRole = async (
  userId: number,
  roleName: RoleUpdateDTO['roleName'],
  levelType?: RoleUpdateDTO['levelType'],
  locationType?: RoleUpdateDTO['locationType'],
  locationId?: number,
) => {
  const payload: RoleUpdateDTO = { roleName };

  if (levelType) {
    payload.levelType = levelType;
  }

  if (locationType) {
    payload.locationType = locationType;
  }

  if (typeof locationId === 'number') {
    payload.locationId = locationId;
  }

  const response = await api.put(`/admin/users/${userId}/role`, payload);
  return extractApiMessage(response.data, 'User role updated successfully.');
};

