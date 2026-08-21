const MIN_YEAR = 1980;
const MAX_YEAR = new Date().getFullYear() + 1;

export type VehicleFormValues = {
  make: string;
  model: string;
  year: string;
  color: string;
  latitude: string;
  longitude: string;
  areaLabel: string;
};

export function validateVehicleForm(values: VehicleFormValues): string | null {
  if (!values.make.trim()) return 'Make is required';
  if (!values.model.trim()) return 'Model is required';
  if (!values.color.trim()) return 'Color is required';

  if (!values.areaLabel.trim()) {
    return 'Search and select the area where the vehicle is usually kept';
  }

  const year = Number(values.year);
  if (!Number.isInteger(year) || year < MIN_YEAR || year > MAX_YEAR) {
    return `Year must be between ${MIN_YEAR} and ${MAX_YEAR}`;
  }

  const latitude = Number(values.latitude);
  if (Number.isNaN(latitude) || latitude < -90 || latitude > 90) {
    return 'Select an area from search results or use the vehicle location button';
  }

  const longitude = Number(values.longitude);
  if (Number.isNaN(longitude) || longitude < -180 || longitude > 180) {
    return 'Select an area from search results or use the vehicle location button';
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
