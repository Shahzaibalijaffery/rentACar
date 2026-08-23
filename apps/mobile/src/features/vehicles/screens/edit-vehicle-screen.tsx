import { useEffect, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { KeyboardAwareScroll } from '@/components/keyboard-aware-scroll';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '@/components/app-button';
import { AppText } from '@/components/app-text';
import { QueryState } from '@/components/query-state';
import { useUpdateVehicleMutation, useVehicleQuery } from '@/api/hooks/use-vehicles';
import { VehicleFormFields } from '@/features/vehicles/components/vehicle-form-fields';
import {
  toVehiclePayload,
  validateVehicleForm,
  vehicleToFormValues,
  type VehicleFormValues,
} from '@/features/vehicles/vehicle-form-utils';
import type { AppStackParamList } from '@/navigation/types';
import { colors, spacing } from '@/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'EditVehicle'>;

export function EditVehicleScreen({ navigation, route }: Props) {
  const { vehicleId } = route.params;
  const vehicleQuery = useVehicleQuery(vehicleId);
  const updateMutation = useUpdateVehicleMutation(vehicleId);
  const [values, setValues] = useState<VehicleFormValues | null>(null);

  useEffect(() => {
    if (vehicleQuery.data && !values) {
      setValues(vehicleToFormValues(vehicleQuery.data));
    }
  }, [vehicleQuery.data, values]);

  const handleSubmit = () => {
    if (!values) return;

    const error = validateVehicleForm(values);
    if (error) {
      Alert.alert('Validation', error);
      return;
    }

    updateMutation.mutate(toVehiclePayload(values), {
      onSuccess: () => {
        Alert.alert('Saved', 'Vehicle updated', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      },
      onError: (err) => Alert.alert('Update failed', err.message),
    });
  };

  return (
    <KeyboardAwareScroll contentContainerStyle={styles.container}>
      <AppText variant="title">Edit vehicle</AppText>
      <QueryState
        isLoading={vehicleQuery.isLoading}
        isError={vehicleQuery.isError}
        errorMessage={vehicleQuery.error?.message}
      >
        {values ? (
          <>
            <VehicleFormFields values={values} onChange={setValues} />
            <AppButton
              title="Save changes"
              loading={updateMutation.isPending}
              onPress={handleSubmit}
            />
          </>
        ) : null}
      </QueryState>
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
});
