import type { LocationResponseDTO } from '../types/geo';
import api from './axios';

const unwrapData = <T>(payload: unknown): T => {
  const wrapped = payload as { data?: T };
  return wrapped.data ?? (payload as T);
};

export const getProvinces = async (): Promise<LocationResponseDTO[]> => {
  const response = await api.get<LocationResponseDTO[]>('/address/provinces');
  return unwrapData<LocationResponseDTO[]>(response.data);
};

export const getDistricts = async (provinceId: number): Promise<LocationResponseDTO[]> => {
  const response = await api.get<LocationResponseDTO[]>(`/address/provinces/${provinceId}/districts`);
  return unwrapData<LocationResponseDTO[]>(response.data);
};

export const getSectors = async (districtId: number): Promise<LocationResponseDTO[]> => {
  const response = await api.get<LocationResponseDTO[]>(`/address/districts/${districtId}/sectors`);
  return unwrapData<LocationResponseDTO[]>(response.data);
};

export const getCells = async (sectorId: number): Promise<LocationResponseDTO[]> => {
  const response = await api.get<LocationResponseDTO[]>(`/address/sectors/${sectorId}/cells`);
  return unwrapData<LocationResponseDTO[]>(response.data);
};

export const getVillages = async (cellId: number): Promise<LocationResponseDTO[]> => {
  const response = await api.get<LocationResponseDTO[]>(`/address/cells/${cellId}/villages`);
  return unwrapData<LocationResponseDTO[]>(response.data);
};