import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import type { AxiosError } from 'axios';
import type { AddressHierarchySelection, LocationResponseDTO } from '../../types/geo';
import { getCells, getDistricts, getProvinces, getSectors, getVillages } from '../../api/addressApi';

interface AddressHierarchySelectionWithNames extends AddressHierarchySelection {
  provinceName: string | null;
  districtName: string | null;
  sectorName: string | null;
  cellName: string | null;
  villageName: string | null;
}

interface GeographyDropdownsProps {
  onVillageSelected?: (villageId: number | null) => void;
  onSelectionChange?: (selection: AddressHierarchySelection) => void;
  onSelectionChangeWithNames?: (selection: AddressHierarchySelectionWithNames) => void;
}

const selectStyles =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400';

const labelStyles = 'mb-1 block text-sm font-semibold text-slate-700';

const toNumberOrNull = (value: string): number | null => {
  return value ? Number(value) : null;
};

const emptySelection: AddressHierarchySelection = {
  provinceId: null,
  districtId: null,
  sectorId: null,
  cellId: null,
  villageId: null,
};

const GeographyDropdowns = ({ onVillageSelected, onSelectionChange, onSelectionChangeWithNames }: GeographyDropdownsProps) => {
  const [provinceId, setProvinceId] = useState<number | null>(null);
  const [districtId, setDistrictId] = useState<number | null>(null);
  const [sectorId, setSectorId] = useState<number | null>(null);
  const [cellId, setCellId] = useState<number | null>(null);
  const [villageId, setVillageId] = useState<number | null>(null);

  const [provinceName, setProvinceName] = useState<string | null>(null);
  const [districtName, setDistrictName] = useState<string | null>(null);
  const [sectorName, setSectorName] = useState<string | null>(null);
  const [cellName, setCellName] = useState<string | null>(null);

  const [provinces, setProvinces] = useState<LocationResponseDTO[]>([]);
  const [districts, setDistricts] = useState<LocationResponseDTO[]>([]);
  const [sectors, setSectors] = useState<LocationResponseDTO[]>([]);
  const [cells, setCells] = useState<LocationResponseDTO[]>([]);
  const [villages, setVillages] = useState<LocationResponseDTO[]>([]);
  const [loadError, setLoadError] = useState('');

  const notifySelection = (selection: AddressHierarchySelection) => {
    onSelectionChange?.(selection);
    onVillageSelected?.(selection.villageId);
  };

  const notifySelectionWithNames = (selection: AddressHierarchySelectionWithNames) => {
    notifySelection(selection);
    onSelectionChangeWithNames?.(selection);
  };

  useEffect(() => {
    let isMounted = true;

    const loadProvinces = async () => {
      try {
        const data = await getProvinces();
        if (isMounted) {
          setProvinces(data);
          setLoadError('');
        }
      } catch (caughtError) {
        if (isMounted) {
          setProvinces([]);
          const axiosError = caughtError as AxiosError<{ message?: string }>;
          const message = axiosError.response?.data?.message ?? axiosError.message;
          const status = axiosError.response?.status;
          setLoadError(`Failed to load provinces${status ? ` (HTTP ${status})` : ''}: ${message}`);
        }
      }
    };

    void loadProvinces();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (provinceId === null) {
      return;
    }

    let isMounted = true;

    const loadDistricts = async () => {
      try {
        const data = await getDistricts(provinceId);
        if (isMounted) {
          setDistricts(data);
          setLoadError('');
        }
      } catch (caughtError) {
        if (isMounted) {
          setDistricts([]);
          const axiosError = caughtError as AxiosError<{ message?: string }>;
          const message = axiosError.response?.data?.message ?? axiosError.message;
          const status = axiosError.response?.status;
          setLoadError(`Failed to load districts${status ? ` (HTTP ${status})` : ''}: ${message}`);
        }
      }
    };

    void loadDistricts();

    return () => {
      isMounted = false;
    };
  }, [provinceId]);

  useEffect(() => {
    if (districtId === null) {
      return;
    }

    let isMounted = true;

    const loadSectors = async () => {
      try {
        const data = await getSectors(districtId);
        if (isMounted) {
          setSectors(data);
          setLoadError('');
        }
      } catch (caughtError) {
        if (isMounted) {
          setSectors([]);
          const axiosError = caughtError as AxiosError<{ message?: string }>;
          const message = axiosError.response?.data?.message ?? axiosError.message;
          const status = axiosError.response?.status;
          setLoadError(`Failed to load sectors${status ? ` (HTTP ${status})` : ''}: ${message}`);
        }
      }
    };

    void loadSectors();

    return () => {
      isMounted = false;
    };
  }, [districtId]);

  useEffect(() => {
    if (sectorId === null) {
      return;
    }

    let isMounted = true;

    const loadCells = async () => {
      try {
        const data = await getCells(sectorId);
        if (isMounted) {
          setCells(data);
          setLoadError('');
        }
      } catch (caughtError) {
        if (isMounted) {
          setCells([]);
          const axiosError = caughtError as AxiosError<{ message?: string }>;
          const message = axiosError.response?.data?.message ?? axiosError.message;
          const status = axiosError.response?.status;
          setLoadError(`Failed to load cells${status ? ` (HTTP ${status})` : ''}: ${message}`);
        }
      }
    };

    void loadCells();

    return () => {
      isMounted = false;
    };
  }, [sectorId]);

  useEffect(() => {
    if (cellId === null) {
      return;
    }

    let isMounted = true;

    const loadVillages = async () => {
      try {
        const data = await getVillages(cellId);
        if (isMounted) {
          setVillages(data);
          setLoadError('');
        }
      } catch (caughtError) {
        if (isMounted) {
          setVillages([]);
          const axiosError = caughtError as AxiosError<{ message?: string }>;
          const message = axiosError.response?.data?.message ?? axiosError.message;
          const status = axiosError.response?.status;
          setLoadError(`Failed to load villages${status ? ` (HTTP ${status})` : ''}: ${message}`);
        }
      }
    };

    void loadVillages();

    return () => {
      isMounted = false;
    };
  }, [cellId]);

  const handleProvinceChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextProvinceId = toNumberOrNull(event.target.value);
    const selectedProvince = provinces.find((p) => p.id === nextProvinceId);
    const nextProvinceName = selectedProvince?.name ?? null;

    setProvinceId(nextProvinceId);
    setProvinceName(nextProvinceName);
    setDistrictId(null);
    setDistrictName(null);
    setSectorId(null);
    setSectorName(null);
    setCellId(null);
    setCellName(null);
    setVillageId(null);
    setDistricts([]);
    setSectors([]);
    setCells([]);
    setVillages([]);

    notifySelectionWithNames({
      ...emptySelection,
      provinceId: nextProvinceId,
      provinceName: nextProvinceName,
      districtName: null,
      sectorName: null,
      cellName: null,
      villageName: null,
    });
  };

  const handleDistrictChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextDistrictId = toNumberOrNull(event.target.value);
    const selectedDistrict = districts.find((d) => d.id === nextDistrictId);
    const nextDistrictName = selectedDistrict?.name ?? null;

    setDistrictId(nextDistrictId);
    setDistrictName(nextDistrictName);
    setSectorId(null);
    setSectorName(null);
    setCellId(null);
    setCellName(null);
    setVillageId(null);
    setSectors([]);
    setCells([]);
    setVillages([]);

    notifySelectionWithNames({
      provinceId,
      provinceName,
      districtId: nextDistrictId,
      districtName: nextDistrictName,
      sectorId: null,
      sectorName: null,
      cellId: null,
      cellName: null,
      villageId: null,
      villageName: null,
    });
  };

  const handleSectorChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextSectorId = toNumberOrNull(event.target.value);
    const selectedSector = sectors.find((s) => s.id === nextSectorId);
    const nextSectorName = selectedSector?.name ?? null;

    setSectorId(nextSectorId);
    setSectorName(nextSectorName);
    setCellId(null);
    setCellName(null);
    setVillageId(null);
    setCells([]);
    setVillages([]);

    notifySelectionWithNames({
      provinceId,
      provinceName,
      districtId,
      districtName,
      sectorId: nextSectorId,
      sectorName: nextSectorName,
      cellId: null,
      cellName: null,
      villageId: null,
      villageName: null,
    });
  };

  const handleCellChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextCellId = toNumberOrNull(event.target.value);
    const selectedCell = cells.find((c) => c.id === nextCellId);
    const nextCellName = selectedCell?.name ?? null;

    setCellId(nextCellId);
    setCellName(nextCellName);
    setVillageId(null);
    setVillages([]);

    notifySelectionWithNames({
      provinceId,
      provinceName,
      districtId,
      districtName,
      sectorId,
      sectorName,
      cellId: nextCellId,
      cellName: nextCellName,
      villageId: null,
      villageName: null,
    });
  };

  const handleVillageChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextVillageId = toNumberOrNull(event.target.value);
    const selectedVillage = villages.find((v) => v.id === nextVillageId);
    const nextVillageName = selectedVillage?.name ?? null;

    setVillageId(nextVillageId);

    notifySelectionWithNames({
      provinceId,
      provinceName,
      districtId,
      districtName,
      sectorId,
      sectorName,
      cellId,
      cellName,
      villageId: nextVillageId,
      villageName: nextVillageName,
    });
  };

  return (
    <div className="space-y-3">
      {loadError && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{loadError}</div>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
      <div>
        <label className={labelStyles} htmlFor="province">
          Province
        </label>
        <select id="province" className={selectStyles} value={provinceId ?? ''} onChange={handleProvinceChange}>
          <option value="">Select province</option>
          {provinces.map((province) => (
            <option key={province.id} value={province.id}>
              {province.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelStyles} htmlFor="district">
          District
        </label>
        <select id="district" className={selectStyles} value={districtId ?? ''} onChange={handleDistrictChange} disabled={provinceId === null}>
          <option value="">Select district</option>
          {districts.map((district) => (
            <option key={district.id} value={district.id}>
              {district.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelStyles} htmlFor="sector">
          Sector
        </label>
        <select id="sector" className={selectStyles} value={sectorId ?? ''} onChange={handleSectorChange} disabled={districtId === null}>
          <option value="">Select sector</option>
          {sectors.map((sector) => (
            <option key={sector.id} value={sector.id}>
              {sector.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelStyles} htmlFor="cell">
          Cell
        </label>
        <select id="cell" className={selectStyles} value={cellId ?? ''} onChange={handleCellChange} disabled={sectorId === null}>
          <option value="">Select cell</option>
          {cells.map((cell) => (
            <option key={cell.id} value={cell.id}>
              {cell.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelStyles} htmlFor="village">
          Village
        </label>
        <select id="village" className={selectStyles} value={villageId ?? ''} onChange={handleVillageChange} disabled={cellId === null}>
          <option value="">Select village</option>
          {villages.map((village) => (
            <option key={village.id} value={village.id}>
              {village.name}
            </option>
          ))}
        </select>
      </div>
      </div>
    </div>
  );
};

export default GeographyDropdowns;

