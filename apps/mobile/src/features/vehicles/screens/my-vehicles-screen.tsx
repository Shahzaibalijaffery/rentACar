import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '@/components/app-button';
import { AppText } from '@/components/app-text';
import { QueryState } from '@/components/query-state';
import { useMyVehiclesQuery } from '@/api/hooks/use-vehicles';
import type { AppStackParamList } from '@/navigation/types';
import { colors, spacing } from '@/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'MyVehicles'>;

export function MyVehiclesScreen({ navigation }: Props) {
  const vehiclesQuery = useMyVehiclesQuery();

  return (
    <View style={styles.container}>
      <AppButton title="Add vehicle" onPress={() => navigation.navigate('AddVehicle')} />

      <QueryState
        isLoading={vehiclesQuery.isLoading}
        isError={vehiclesQuery.isError}
        errorMessage={vehiclesQuery.error?.message}
      >
        <FlatList
          data={vehiclesQuery.data ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <AppText variant="body" style={styles.empty}>
              You have not listed any vehicles yet.
            </AppText>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => navigation.navigate('VehicleDetails', { vehicleId: item.id })}
            >
              <AppText variant="body" style={styles.title}>
                {item.year} {item.make} {item.model}
              </AppText>
              <AppText variant="caption" style={styles.meta}>
                {item.color} · {item.availability} · {item.photos.length} photo
                {item.photos.length === 1 ? '' : 's'}
              </AppText>
              {item.areaLabel ? (
                <AppText variant="caption" style={styles.meta}>
                  Area: {item.areaLabel}
                </AppText>
              ) : null}
            </Pressable>
          )}
        />
      </QueryState>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    gap: spacing.md,
  },
  list: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    backgroundColor: colors.backgroundSecondary,
  },
  title: {
    fontWeight: '600',
  },
  meta: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  empty: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
