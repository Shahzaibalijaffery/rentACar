import { useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { KeyboardAwareScroll } from '@/components/keyboard-aware-scroll';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '@/components/app-button';
import { AppText } from '@/components/app-text';
import { getPlanLimits } from '@rentacar/shared';
import { useProfileQuery } from '@/api/hooks/use-auth';
import { useCreateVehicleMutation, useMyVehiclesQuery } from '@/api/hooks/use-vehicles';
import { VehicleFormFields } from '@/features/vehicles/components/vehicle-form-fields';
import {
  toVehiclePayload,
  validateVehicleForm,
  type VehicleFormValues,
} from '@/features/vehicles/vehicle-form-utils';
import type { AppStackParamList } from '@/navigation/types';
import { colors, spacing } from '@/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'AddVehicle'>;

const initialValues: VehicleFormValues = {
  make: '',
  model: '',
  year: '',
  color: '',
  latitude: '',
  longitude: '',
  areaLabel: '',
};

export function AddVehicleScreen({ navigation }: Props) {
  const createMutation = useCreateVehicleMutation();
  const profileQuery = useProfileQuery();
  const vehiclesQuery = useMyVehiclesQuery();
  const [values, setValues] = useState<VehicleFormValues>(initialValues);
  const limits = getPlanLimits(profileQuery.data?.plan);
  const listedCount = vehiclesQuery.data?.length ?? 0;

  const handleSubmit = () => {
    if (listedCount >= limits.maxListedVehicles) {
      Alert.alert(
        'Plan limit',
        `Your plan allows ${limits.maxListedVehicles} listed vehicles.`,
      );
      return;
    }

    const error = validateVehicleForm(values);
    if (error) {
      Alert.alert('Validation', error);
      return;
    }

    createMutation.mutate(toVehiclePayload(values), {
      onSuccess: (vehicle) => {
        navigation.replace('VehicleDetails', { vehicleId: vehicle.id });
      },
      onError: (err) => Alert.alert('Could not create vehicle', err.message),
    });
  };

  return (
    <KeyboardAwareScroll contentContainerStyle={styles.container}>
      <AppText variant="title">Add vehicle</AppText>
      <AppText variant="caption" style={styles.limitHint}>
        {listedCount} of {limits.maxListedVehicles} vehicles used · up to {limits.maxVehiclePhotos}{' '}
        photos each
      </AppText>
      <VehicleFormFields values={values} onChange={setValues} />
      <AppButton title="Create vehicle" loading={createMutation.isPending} onPress={handleSubmit} />
      <AppButton title="Cancel" variant="secondary" onPress={() => navigation.goBack()} />
    </KeyboardAwareScroll>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  limitHint: {
    color: colors.textSecondary,
  },
});
