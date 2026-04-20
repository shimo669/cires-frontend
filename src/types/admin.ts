export interface UserResponseDTO {
  id: number;
  username: string;
  fullName?: string;
  email: string;
  nationalId?: string;
  role: string;
  levelType?: string;
  locationId?: number | null;
  locationName?: string | null;
  fullRwandanAddress?: string | null;
}

export type UserRoleOption = 'CITIZEN' | 'LEADER' | 'ADMIN' | 'ROLE_CITIZEN' | 'ROLE_LEADER' | 'ROLE_ADMIN';

export type LocationTypeOption = 'PROVINCE' | 'DISTRICT' | 'SECTOR' | 'CELL' | 'VILLAGE';

export type LevelTypeOption =
  | 'NATIONAL_ADMIN'
  | 'PROVINCE_GOVERNOR'
  | 'DISTRICT_MAYOR'
  | 'SECTOR_LEADER'
  | 'CELL_LEADER'
  | 'VILLAGE_LEADER'
  | 'CITIZEN'
  | '';

export interface RoleUpdateDTO {
  roleName: UserRoleOption;
  levelType?: LevelTypeOption;
  locationType?: LocationTypeOption;
  locationId?: number;
}

