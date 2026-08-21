import { StyleSheet, View } from 'react-native';
import { AppInput } from '@/components/app-input';
import { AppText } from '@/components/app-text';
import type { VehicleFormValues } from '@/features/vehicles/vehicle-form-utils';
import { colors, spacing } from '@/theme';

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
      <AppText variant="caption" style={styles.hint}>
        Approximate location is used for nearby discovery. Your exact address is never shown
        publicly.
      </AppText>
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
      <AppInput
        placeholder="Area label (e.g. Clifton)"
        value={values.areaLabel}
        onChangeText={(v) => setField('areaLabel', v)}
      />
      <AppInput
        placeholder="Latitude"
        keyboardType="decimal-pad"
        value={values.latitude}
        onChangeText={(v) => setField('latitude', v)}
      />
      <AppInput
        placeholder="Longitude"
        keyboardType="decimal-pad"
        value={values.longitude}
        onChangeText={(v) => setField('longitude', v)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  hint: {
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
});
