export interface UserResponseDTO {
  id: number;
  username: string;
  fullName?: string;
  email: string;
  nationalId?: string;
  role: string;
  levelType: string;
  provinceName?: string;
  districtName?: string;
  sectorName?: string;
  cellName?: string;
  villageName?: string;
  fullAddress?: string;
}

export interface RoleUpdateDTO {
  roleName: string;
}

