import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
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
  VEHICLE_YEAR_MAX,
  VEHICLE_YEAR_MIN,
  type VehicleFormValues,
} from '@/features/vehicles/vehicle-form-utils';
import type { AppStackParamList } from '@/navigation/types';
import { colors, spacing } from '@/theme';
import { showAppAlert } from '@/stores/app-alert-store';

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
  const { t } = useTranslation('vehicles');
  const createMutation = useCreateVehicleMutation();
  const profileQuery = useProfileQuery();
  const vehiclesQuery = useMyVehiclesQuery();
  const [values, setValues] = useState<VehicleFormValues>(initialValues);
  const limits = getPlanLimits(profileQuery.data?.plan);
  const listedCount = vehiclesQuery.data?.length ?? 0;

  const handleSubmit = () => {
    if (listedCount >= limits.maxListedVehicles) {
      showAppAlert(t('planLimitTitle'), t('planLimitShort', { limit: limits.maxListedVehicles }));
      return;
    }

    const error = validateVehicleForm(values);
    if (error) {
      showAppAlert(
        t('validation'),
        t(`formErrors.${error}`, { min: VEHICLE_YEAR_MIN, max: VEHICLE_YEAR_MAX }),
      );
      return;
    }

    createMutation.mutate(toVehiclePayload(values), {
      onSuccess: (vehicle) => {
        navigation.replace('VehicleDetails', { vehicleId: vehicle.id });
      },
      onError: (err) => showAppAlert(t('createFailed'), err.message),
    });
  };

  return (
    <KeyboardAwareScroll contentContainerStyle={styles.container}>
      <AppText variant="title">{t('addVehicle')}</AppText>
      <AppText variant="caption" style={styles.limitHint}>
        {t('addLimitHint', {
          count: listedCount,
          limit: limits.maxListedVehicles,
          photos: limits.maxVehiclePhotos,
        })}
      </AppText>
      <VehicleFormFields values={values} onChange={setValues} />
      <AppButton title={t('createVehicle')} loading={createMutation.isPending} onPress={handleSubmit} />
      <AppButton title={t('common:cancel')} variant="secondary" onPress={() => navigation.goBack()} />
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
