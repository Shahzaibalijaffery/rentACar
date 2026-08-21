import { useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '@/components/app-button';
import { AppText } from '@/components/app-text';
import { useCreateVehicleMutation } from '@/api/hooks/use-vehicles';
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
  const [values, setValues] = useState<VehicleFormValues>(initialValues);

  const handleSubmit = () => {
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
    <ScrollView contentContainerStyle={styles.container}>
      <AppText variant="title">Add vehicle</AppText>
      <VehicleFormFields values={values} onChange={setValues} />
      <AppButton title="Create vehicle" loading={createMutation.isPending} onPress={handleSubmit} />
      <AppButton title="Cancel" variant="secondary" onPress={() => navigation.goBack()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
});
