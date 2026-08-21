import { StyleSheet, View } from 'react-native';
import { AppInput } from '@/components/app-input';
import type { VehicleFormValues } from '@/features/vehicles/vehicle-form-utils';
import { AreaSearchField } from '@/features/vehicles/components/area-search-field';
import { spacing } from '@/theme';

type VehicleFormFieldsProps = {
  values: VehicleFormValues;
  onChange: (values: VehicleFormValues) => void;
};

export function VehicleFormFields({ values, onChange }: VehicleFormFieldsProps) {
  const setField = (field: keyof VehicleFormValues, value: string) => {
    onChange({ ...values, [field]: value });
  };

  return (
    <View style={styles.container}>
      <AppInput placeholder="Make" value={values.make} onChangeText={(v) => setField('make', v)} />
      <AppInput
        placeholder="Model"
        value={values.model}
        onChangeText={(v) => setField('model', v)}
      />
      <AppInput
        placeholder="Year"
        keyboardType="number-pad"
        value={values.year}
        onChangeText={(v) => setField('year', v)}
      />
      <AppInput
        placeholder="Color"
        value={values.color}
        onChangeText={(v) => setField('color', v)}
      />

      <AreaSearchField
        selectedAreaLabel={values.areaLabel}
        latitude={values.latitude}
        longitude={values.longitude}
        onSelect={(result) => {
          onChange({
            ...values,
            areaLabel: result.areaLabel,
            latitude: String(result.latitude),
            longitude: String(result.longitude),
          });
        }}
        onClearSelection={() => {
          onChange({
            ...values,
            areaLabel: '',
            latitude: '',
            longitude: '',
          });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
});
