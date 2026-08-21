import type { RentalLifecycleFilter } from '@rentacar/shared';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  VerifyEmail: { email?: string } | undefined;
};

export type AppStackParamList = {
  Home: undefined;
  ProfileSearch: undefined;
  Discovery: undefined;
  DiscoveryVehicleDetail: { vehicleId: string; distanceLabel?: string };
  Profile: undefined;
  MyVehicles: undefined;
  AddVehicle: undefined;
  EditVehicle: { vehicleId: string };
  VehicleDetails: { vehicleId: string };
  MyRentalRequests: { lifecycle?: RentalLifecycleFilter } | undefined;
  OwnerRentalRequests: { lifecycle?: RentalLifecycleFilter } | undefined;
  RentalRequestDetail: { rentalId: string; perspective: 'renter' | 'owner' };
  CreateAgreement: { rentalId: string };
  AgreementDetail: { agreementId: string; rentalId: string; perspective?: 'owner' | 'renter' };
  PickupHandover: { handoverId: string; rentalId: string; perspective: 'owner' | 'renter' };
};

export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
};
