export const VEHICLE_YEAR_MIN = 1980;
export const VEHICLE_YEAR_MAX = new Date().getFullYear() + 1;

export type VehicleFormValues = {
  make: string;
  model: string;
  year: string;
  color: string;
  latitude: string;
  longitude: string;
  areaLabel: string;
};

export type VehicleFormErrorCode =
  | 'makeRequired'
  | 'modelRequired'
  | 'colorRequired'
  | 'areaRequired'
  | 'yearRange'
  | 'areaSelect';

export function validateVehicleForm(values: VehicleFormValues): VehicleFormErrorCode | null {
  if (!values.make.trim()) return 'makeRequired';
  if (!values.model.trim()) return 'modelRequired';
  if (!values.color.trim()) return 'colorRequired';

  if (!values.areaLabel.trim()) {
    return 'areaRequired';
  }

  const year = Number(values.year);
  if (!Number.isInteger(year) || year < VEHICLE_YEAR_MIN || year > VEHICLE_YEAR_MAX) {
    return 'yearRange';
  }

  const latitude = Number(values.latitude);
  if (Number.isNaN(latitude) || latitude < -90 || latitude > 90) {
    return 'areaSelect';
  }

  const longitude = Number(values.longitude);
  if (Number.isNaN(longitude) || longitude < -180 || longitude > 180) {
    return 'areaSelect';
  }

  return null;
}

export function toVehiclePayload(values: VehicleFormValues) {
  return {
    make: values.make.trim(),
    model: values.model.trim(),
    year: Number(values.year),
    color: values.color.trim(),
    latitude: Number(values.latitude),
    longitude: Number(values.longitude),
    areaLabel: values.areaLabel.trim(),
  };
}

export function vehicleToFormValues(vehicle: {
  make: string;
  model: string;
  year: number;
  color: string;
  latitude: number;
  longitude: number;
  areaLabel: string | null;
}): VehicleFormValues {
  return {
    make: vehicle.make,
    model: vehicle.model,
    year: String(vehicle.year),
    color: vehicle.color,
    latitude: String(vehicle.latitude),
    longitude: String(vehicle.longitude),
    areaLabel: vehicle.areaLabel ?? '',
  };
}
