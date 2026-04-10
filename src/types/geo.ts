export interface LocationResponseDTO {
  id: number;
  name: string;
  type: string;
}

export interface AddressHierarchySelection {
  provinceId: number | null;
  districtId: number | null;
  sectorId: number | null;
  cellId: number | null;
  villageId: number | null;
}

export interface AddressHierarchyRequest {
  provinceId: number;
  districtId: number;
  sectorId: number;
  cellId: number;
  villageId: number;
}

export interface AddressHierarchySelectionWithNames extends AddressHierarchySelection {
  provinceName: string | null;
  districtName: string | null;
  sectorName: string | null;
  cellName: string | null;
  villageName: string | null;
}

