import type { LocationResponseDTO } from '../types/geo';
import api from './axios';
import { unwrapApiData } from './responseUtils';

export const getProvinces = async (): Promise<LocationResponseDTO[]> => {
  const response = await api.get<LocationResponseDTO[]>('/address/provinces');
  return unwrapApiData<LocationResponseDTO[]>(response.data);
};

export const getDistricts = async (provinceId: number): Promise<LocationResponseDTO[]> => {
  const response = await api.get<LocationResponseDTO[]>(`/address/provinces/${provinceId}/districts`);
  return unwrapApiData<LocationResponseDTO[]>(response.data);
};

export const getSectors = async (districtId: number): Promise<LocationResponseDTO[]> => {
  const response = await api.get<LocationResponseDTO[]>(`/address/districts/${districtId}/sectors`);
  return unwrapApiData<LocationResponseDTO[]>(response.data);
};

export const getCells = async (sectorId: number): Promise<LocationResponseDTO[]> => {
  const response = await api.get<LocationResponseDTO[]>(`/address/sectors/${sectorId}/cells`);
  return unwrapApiData<LocationResponseDTO[]>(response.data);
};

export const getVillages = async (cellId: number): Promise<LocationResponseDTO[]> => {
  const response = await api.get<LocationResponseDTO[]>(`/address/cells/${cellId}/villages`);
  return unwrapApiData<LocationResponseDTO[]>(response.data);
};